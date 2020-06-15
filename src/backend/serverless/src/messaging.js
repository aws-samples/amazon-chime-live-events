// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { validateAuthorizationHeader, generatePolicy } = require('./authorize');
const {
  AttendeeType,
  getAttendeeObject,
  setIsVettedForAttendee,
} = require('./eventAttendeesDao');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({ region: process.env.AWS_REGION });
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint(
  'https://service.chime.aws.amazon.com/console'
);

const { CONNECTIONS_TABLE_NAME, LIVE_EVENTS_TABLE } = process.env;
const strictVerify = true;

exports.authorize = async (event, context, callback) => {
  console.log('authorize event:', JSON.stringify(event, null, 2));

  let callerAttendeeId;
  let passedAuthCheck = false;
  if (
    !!event.queryStringParameters.MeetingId &&
    !!event.queryStringParameters.AttendeeId &&
    !!event.queryStringParameters.JoinToken &&
    !!event.queryStringParameters.Authorization
  ) {
    try {
      // Decode authorization payload from base-64
      const decodedAuthPayload = Buffer.from(
        event.queryStringParameters.Authorization,
        'base64'
      );
      const authPayload = JSON.parse(decodedAuthPayload);

      if (!authPayload && authPayload.Authorization && authPayload.AttendeeId) {
        console.log(`Authorization payload is invalid ${authPayload}`);
      }
      callerAttendeeId = authPayload.AttendeeId;

      const authorized = await validateAuthorizationHeader(
        authPayload.Authorization,
        authPayload.AttendeeId,
        [AttendeeType.MODERATOR, AttendeeType.TALENT, AttendeeType.ATTENDEE]
      );

      if (!authorized) throw new Error('Not Authorized!');
      console.log(
        `Calling getAttendee with meetingId ${event.queryStringParameters.MeetingId} and AttendeeId ${event.queryStringParameters.AttendeeId}`
      );
      const attendeeInfo = await chime
        .getAttendee({
          MeetingId: event.queryStringParameters.MeetingId,
          AttendeeId: event.queryStringParameters.AttendeeId,
        })
        .promise();
      console.log(
        `Received attendeeInfo from getAttendee request ${JSON.stringify(
          attendeeInfo
        )}`
      );
      if (
        attendeeInfo.Attendee.JoinToken ===
        event.queryStringParameters.JoinToken
      ) {
        passedAuthCheck = true;
      } else {
        if (strictVerify) {
          console.error('failed to authenticate with join token');
        } else {
          passedAuthCheck = true;
          console.warn(
            'failed to authenticate with join token (skipping due to strictVerify=false)'
          );
        }
      }
    } catch (e) {
      if (strictVerify) {
        console.error(
          `failed to authenticate with join token: ${JSON.stringify(e)}`
        );
      } else {
        passedAuthCheck = true;
        console.warn(
          `failed to authenticate with join token (skipping due to strictVerify=false): ${e.message}`
        );
      }
    }
  } else {
    console.error('missing MeetingId, AttendeeId, JoinToken parameters');
  }
  return generatePolicy(
    'me',
    passedAuthCheck ? 'Allow' : 'Deny',
    event.methodArn,
    {
      MeetingId: event.queryStringParameters.MeetingId,
      AttendeeId: event.queryStringParameters.AttendeeId,
      CallerAttendeeId: callerAttendeeId,
    }
  );
};

exports.onconnect = async event => {
  console.log('onconnect event:', JSON.stringify(event, null, 2));
  const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  try {
    await ddb
      .putItem({
        TableName: process.env.CONNECTIONS_TABLE_NAME,
        Item: {
          MeetingId: { S: event.requestContext.authorizer.MeetingId },
          AttendeeId: { S: event.requestContext.authorizer.AttendeeId },
          ConnectionId: { S: event.requestContext.connectionId },
          TTL: { N: `${oneDayFromNow}` },
        },
      })
      .promise();
  } catch (e) {
    console.error(`error connecting: ${e.message}`);
    return {
      statusCode: 500,
      body: 'Failed to connect: ' + JSON.stringify(e),
    };
  }
  return { statusCode: 200, body: 'Connected.' };
};

exports.ondisconnect = async event => {
  console.log('ondisconnect event:', JSON.stringify(event, null, 2));
  try {
    await ddb
      .delete({
        TableName: process.env.CONNECTIONS_TABLE_NAME,
        Key: {
          MeetingId: event.requestContext.authorizer.MeetingId,
          AttendeeId: event.requestContext.authorizer.AttendeeId,
        },
      })
      .promise();
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Failed to disconnect: ' + JSON.stringify(err),
    };
  }
  return { statusCode: 200, body: 'Disconnected.' };
};

const postToConnection = async (postApi, connectionId, message) => {
  try {
    await postApi
      .postToConnection({ ConnectionId: connectionId, Data: message })
      .promise();
    console.log(
      'Successfully posted to connection with connectionId ' + connectionId
    );
    return;
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`found stale connection, skipping ${connectionId}`);
    } else {
      console.error(
        `error posting to connection ${connectionId}: ${e.message}`
      );
    }
  }
};

exports.postToConnection = postToConnection;

exports.ping = async event => {
  console.log('Ping event:', JSON.stringify(event, null, 2));

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });

  const response = {
    type: 'ping',
    message: 'pong',
  };
  try {
    await postToConnection(
      apigwManagementApi,
      event.requestContext.connectionId,
      JSON.stringify(response)
    );

    return { statusCode: 200, body: 'Pong!.' };
  } catch (e) {
    console.error(`Failed to post ping message: ${e.message}`);
    return { statusCode: 500, body: e.stack };
  }
};

exports.sendmessage = async event => {
  const INIT_ATTENDEE = 'init-attendee';
  console.log('sendmessage event:', JSON.stringify(event, null, 2));
  // Get caller attendee object.
  const {
    AttendeeId,
    AttendeeType: attendeeType,
    isVetted = false,
    LiveEventId,
  } = await getAttendeeObject(event.requestContext.authorizer.CallerAttendeeId);
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  let message = JSON.parse(event.body).data;
  const parsedMessage = JSON.parse(message);
  const targetAttendeeId =
    parsedMessage.payload && parsedMessage.payload.targetAttendeeId;
  const isVettedAttendee = attendeeType === AttendeeType.ATTENDEE && isVetted;
  const isModerator = attendeeType === AttendeeType.MODERATOR;
  const isTalent = attendeeType === AttendeeType.TALENT;

  // TODO: Currently we have authorization logic scattering around the lambdas
  // We will need to handle permission and access in a single place within authorizer.

  // Check if call is to initialize connection.
  if (
    parsedMessage.type === INIT_ATTENDEE &&
    (isVettedAttendee || isModerator || isTalent)
  ) {
    try {
      const params = {
        Key: {
          LiveEventId: {
            S: LiveEventId,
          },
        },
        TableName: LIVE_EVENTS_TABLE,
      };

      const liveEventsResponse = await ddb.getItem(params).promise();
      const liveEvent = liveEventsResponse.Item;

      console.log(
        `Provided attendee with Live attendee ids: ${JSON.stringify(
          liveEvent.liveAttendeeIds.SS
        )}`
      );
      message = JSON.stringify({
        type: 'live-video-feeds',
        payload: liveEvent.liveAttendeeIds.SS,
      });
    } catch (error) {
      console.error(
        `Failed to get liveEvent:(${LiveEventId}) object. Error: ${JSON.stringify(
          error.message
        )}`
      );
      return { statusCode: 500, body: error.message };
    }
  } // Allow only moderators to send messages other then "Init"
  else if (!isModerator) {
    const errorMessage = `Unauthorized attempt to send message. Type: ${attendeeType}, ID: ${AttendeeId}`;
    console.error(errorMessage);

    return { statusCode: 401, body: errorMessage };
  }

  if (!targetAttendeeId) {
    const errorMessage = 'Cannot send message without a targetAttendeeId.';
    console.error(errorMessage);
    return { statusCode: 500, body: errorMessage };
  }

  try {
    const params = {
      Key: {
        MeetingId: {
          S: event.requestContext.authorizer.MeetingId,
        },
        AttendeeId: {
          S: targetAttendeeId,
        },
      },
      TableName: CONNECTIONS_TABLE_NAME,
    };

    const attendeeConnection = await ddb.getItem(params).promise();
    console.log(
      `Retrieved attendee connection for target attendee: ${JSON.stringify(
        attendeeConnection
      )}`
    );

    if (parsedMessage.type === 'transfer-meeting') {
      const liveEventAttendeeId =
        parsedMessage.payload && parsedMessage.payload.liveEventAttendeeId;

      console.log(
        `Attendee is asked to join holding room and there for isVetted attendee!`
      );
      const isVettedResponse = await setIsVettedForAttendee(
        liveEventAttendeeId,
        true
      );
      console.log(
        `AttendeeId: ${liveEventAttendeeId} isVetted status set to: ${JSON.stringify(
          isVettedResponse
        )}`
      );
    }

    const attendeeConnectionId = attendeeConnection.Item.ConnectionId.S;
    await postToConnection(apigwManagementApi, attendeeConnectionId, message);
    return { statusCode: 200, body: 'Message sent.' };
  } catch (e) {
    console.error(`Failed to post message: ${e.message}`);
    return { statusCode: 500, body: e.stack };
  }
};
