const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB();
const chime = new AWS.Chime({ region: 'us-east-1' });
const { LIVE_EVENTS_TABLE } = process.env;

chime.endpoint = new AWS.Endpoint(
  'https://service.chime.aws.amazon.com/console'
);

const { makeCORSHeaders, makeResponse } = require('./cors');
const { getAttendeeObject, AttendeeType } = require('./eventAttendeesDao');

const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

// Read resource names from the environment
const meetingsTableName = process.env.MEETINGS_TABLE_NAME;
const attendeesTableName = process.env.ATTENDEES_TABLE_NAME;
const sqsQueueArn = process.env.SQS_QUEUE_ARN;
const provideQueueArn = process.env.USE_EVENT_BRIDGE === 'false';
const logGroupName = process.env.BROWSER_LOG_GROUP_NAME;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const getMeeting = async meetingTitle => {
  const result = await ddb
    .getItem({
      TableName: meetingsTableName,
      Key: {
        Title: {
          S: meetingTitle,
        },
      },
    })
    .promise();
  if (!result.Item) {
    return null;
  }
  const meetingData = JSON.parse(result.Item.Data.S);
  try {
    await chime
      .getMeeting({
        MeetingId: meetingData.Meeting.MeetingId,
      })
      .promise();
  } catch (err) {
    return null;
  }
  return meetingData;
};

exports.getMeeting = getMeeting;

const putMeeting = async (title, meetingInfo) => {
  await ddb
    .putItem({
      TableName: meetingsTableName,
      Item: {
        Title: { S: title },
        Data: { S: JSON.stringify(meetingInfo) },
        TTL: {
          N: '' + oneDayFromNow,
        },
      },
    })
    .promise();
};

const getAttendee = async (title, attendeeId) => {
  const result = await ddb
    .getItem({
      TableName: attendeesTableName,
      Key: {
        AttendeeId: {
          S: `${title}/${attendeeId}`,
        },
      },
    })
    .promise();
  if (!result.Item) {
    return 'Unknown';
  }
  return result.Item.Name.S;
};

const putAttendee = async (title, attendeeId, name) => {
  await ddb
    .putItem({
      TableName: attendeesTableName,
      Item: {
        AttendeeId: {
          S: `${title}/${attendeeId}`,
        },
        Name: { S: name },
        TTL: {
          N: '' + oneDayFromNow,
        },
      },
    })
    .promise();
};

const getCurrentEventMetadata = async eventId => {
  const result = await ddb
    .getItem({
      TableName: LIVE_EVENTS_TABLE,
      Key: {
        LiveEventId: { S: eventId },
      },
    })
    .promise();
  if (!result.Item) {
    return 'Unknown';
  }
  return result.Item;
};

function getNotificationsConfig() {
  if (provideQueueArn) {
    return {
      SqsQueueArn: sqsQueueArn,
    };
  }
  return {};
}

// ===== Join or create meeting ===================================
exports.createMeeting = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: makeCORSHeaders(),
    body: '',
    isBase64Encoded: false,
  };

  if (!event.queryStringParameters.title) {
    response.statusCode = 400;
    response.body = 'Must provide title';
    callback(null, response);
    return;
  }

  console.info('Create meeting:' + JSON.stringify(event));

  const externalAttendeeId = event && event.headers['attendeeid'];
  const title = event.queryStringParameters.title;
  const region = event.queryStringParameters.region || 'us-east-1';

  const attendee = await getAttendeeObject(externalAttendeeId);
  const isAttendee =
    attendee && AttendeeType.ATTENDEE === attendee.AttendeeType;

  try {
    let meetingInfo = await getMeeting(title);
    if (!meetingInfo) {
      if (!isAttendee) {
        const request = {
          ClientRequestToken: uuid(),
          MediaRegion: region,
          NotificationsConfiguration: getNotificationsConfig(),
        };
        console.info('Creating new meeting: ' + JSON.stringify(request));
        meetingInfo = await chime.createMeeting(request).promise();
        await putMeeting(title, meetingInfo);
      } else {
        response.statusCode = 400;
        response.body = 'Must be moderator to create meeting';
        callback(null, response);
        return;
      }
    }

    const joinInfo = {
      JoinInfo: {
        Title: title,
        Meeting: meetingInfo.Meeting,
      },
    };

    response.body = JSON.stringify(joinInfo, '', 2);
  } catch (e) {
    console.error('createMeeting handler failed:', e);
    callback(null, makeResponse(503, 'Internal server error'));
    return;
  }

  callback(null, response);
};

exports.join = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: makeCORSHeaders(),
    body: '',
    isBase64Encoded: false,
  };

  if (!event.queryStringParameters.title || !event.queryStringParameters.name) {
    response['statusCode'] = 400;
    response['body'] = 'Must provide title and name';
    callback(null, response);
    return;
  }

  console.info('Join meeting' + JSON.stringify(event));

  const externalAttendeeId = event && event.headers['attendeeid'];
  const title = event.queryStringParameters.title;
  const name = event.queryStringParameters.name;
  const region = event.queryStringParameters.region || 'us-east-1';

  const attendee = await getAttendeeObject(externalAttendeeId);
  const isAttendee =
    attendee && AttendeeType.ATTENDEE === attendee.AttendeeType;

  try {
    let meetingInfo = await getMeeting(title);
    if (!meetingInfo) {
      if (!isAttendee) {
        const request = {
          ClientRequestToken: uuid(),
          MediaRegion: region,
          NotificationsConfiguration: getNotificationsConfig(),
        };
        console.info('Creating new meeting: ' + JSON.stringify(request));
        meetingInfo = await chime.createMeeting(request).promise();
        await putMeeting(title, meetingInfo);
      } else {
        response['statusCode'] = 403;
        response['body'] = JSON.stringify({
          message: 'Must be moderator to create meeting',
        });
        callback(null, response);
        return;
      }
    }

    const currentEventMetadata = await getCurrentEventMetadata(
      attendee.LiveEventId
    );

    /*
      Talents metting  should only be allowed to join by attendees that are 
      type = MODERATORS or type = ATTENDEE with isVetted set to true.
    */
    if (
      currentEventMetadata &&
      currentEventMetadata.talentMeetingId.S === title &&
      isAttendee &&
      !attendee.isVetted
    ) {
      response['statusCode'] = 403;
      response['body'] = JSON.stringify({
        message: 'AttendeeId must be vetted to join moderated meeting',
      });
      callback(null, response);
      return;
    }

    console.info('Adding new attendee');
    const attendeeInfo = await chime
      .createAttendee({
        MeetingId: meetingInfo.Meeting.MeetingId,
        ExternalUserId: externalAttendeeId,
      })
      .promise();

    await putAttendee(title, attendeeInfo.Attendee.AttendeeId, name);

    const joinInfo = {
      JoinInfo: {
        Title: title,
        Meeting: meetingInfo.Meeting,
        Attendee: attendeeInfo.Attendee,
      },
    };

    response.body = JSON.stringify(joinInfo, '', 2);
  } catch (e) {
    console.error('join handler failed:', e);
    callback(null, makeResponse(503, 'Internal server error'));
    return;
  }

  callback(null, response);
};

exports.attendee = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: makeCORSHeaders(),
    body: '',
    isBase64Encoded: false,
  };
  const title = event.queryStringParameters.title;
  const attendeeId = event.queryStringParameters.attendee;
  try {
    const attendeeInfo = {
      AttendeeInfo: {
        AttendeeId: attendeeId,
        Name: await getAttendee(title, attendeeId),
      },
    };
    response.body = JSON.stringify(attendeeInfo, '', 2);
  } catch (e) {
    console.error('attendee handler failed:', e);
    callback(null, makeResponse(503, 'Internal server error'));
    return;
  }

  callback(null, response);
};

exports.end = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: makeCORSHeaders(),
    body: '',
    isBase64Encoded: false,
  };
  const title = event.queryStringParameters.title;
  try {
    let meetingInfo = await getMeeting(title);
    await chime
      .deleteMeeting({
        MeetingId: meetingInfo.Meeting.MeetingId,
      })
      .promise();
  } catch (e) {
    console.error('end handler failed:', e);
    callback(null, makeResponse(503, 'Internal server error'));
    return;
  }

  callback(null, response);
};

const ensureLogStream = async (cloudWatchClient, logStreamName) => {
  const describeLogStreamsParams = {
    logGroupName: logGroupName,
    logStreamNamePrefix: logStreamName,
  };
  const response = await cloudWatchClient
    .describeLogStreams(describeLogStreamsParams)
    .promise();
  const foundStream = response.logStreams.find(
    s => s.logStreamName === logStreamName
  );
  if (foundStream) {
    return foundStream.uploadSequenceToken;
  }

  const putLogEventsInput = {
    logGroupName,
    logStreamName,
  };

  await cloudWatchClient.createLogStream(putLogEventsInput).promise();
  return null;
};

exports.logs = async (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: makeCORSHeaders(),
    body: '',
    isBase64Encoded: false,
  };

  const body = JSON.parse(event.body);
  if (!body.logs || !body.meetingId || !body.attendeeId || !body.appName) {
    response.body = 'Empty Parameters Received';
    response.statusCode = 400;
    callback(null, response);
    return;
  }

  const logStreamName = 'ChimeSDKMeeting_' + body.meetingId.toString();
  const cloudWatchClient = new AWS.CloudWatchLogs({
    apiVersion: '2014-03-28',
  });

  const putLogEventsInput = {
    logGroupName,
    logStreamName,
  };

  try {
    const uploadSequence = await ensureLogStream(
      cloudWatchClient,
      logStreamName
    );
    if (uploadSequence) {
      putLogEventsInput['sequenceToken'] = uploadSequence;
    }
    const logEvents = [];

    if (body.logs.length) {
      for (let i = 0; i < body.logs.length; i++) {
        const log = body.logs[i];
        const timestampIso = new Date(log.timestampMs).toISOString();
        const message = `${timestampIso} [${log.sequenceNumber}] [${
          log.logLevel
        }] [mid: ${body.meetingId.toString()}] [aid: ${body.attendeeId}]: ${
          log.message
        }`;
        logEvents.push({
          message,
          timestamp: log.timestampMs,
        });
      }
      putLogEventsInput['logEvents'] = logEvents;
      await cloudWatchClient.putLogEvents(putLogEventsInput).promise();
    }
  } catch (e) {
    console.error('logs handler failed:', e);
    callback(null, makeResponse(503, 'Internal server error'));
    return;
  }

  callback(null, response);
};
