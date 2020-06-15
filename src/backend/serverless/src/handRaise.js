const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({ region: process.env.AWS_REGION });
const ddbc = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
});

const { generateAccessKey } = require('./accessKeysDao');
const { getAttendeeObject, AttendeeType } = require('./eventAttendeesDao');
const { makeResponse } = require('./cors');

const {
  HAND_RAISE_CONNECTION_TABLE,
  LIVE_EVENTS_TABLE,
  HAND_RAISES_TABLE,
} = process.env;

const apigwManagementApi = event => {
  return new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });
};

const notifyModerators = async (event, message, liveEventId) => {
  let attendees = {};
  let listOfModeratorIds = [];

  try {
    attendees = await ddb
      .query({
        ExpressionAttributeValues: {
          ':liveEventId': { S: liveEventId },
        },
        KeyConditionExpression: 'LiveEventId = :liveEventId',
        ProjectionExpression: 'ConnectionId, AttendeeId',
        TableName: HAND_RAISE_CONNECTION_TABLE,
      })
      .promise();

    const currentEventMetadata = await ddb
      .getItem({
        TableName: LIVE_EVENTS_TABLE,
        Key: {
          LiveEventId: { S: liveEventId },
        },
      })
      .promise();

    console.log(
      `Live event information ${JSON.stringify(currentEventMetadata)}`
    );
    listOfModeratorIds = currentEventMetadata.Item.moderatorIds.L || [];
  } catch (e) {
    console.log(
      `Error encountered trying to get attendee lists ${JSON.stringify(e)}.`
    );
    return makeResponse(500, e.stack);
  }

  console.log(`Sending to ${listOfModeratorIds.length} moderators.`);
  const postCalls = attendees.Items.map(connection => {
    if (
      listOfModeratorIds.some(
        attendeeId => attendeeId.S === connection.AttendeeId.S
      )
    ) {
      const connectionId = connection.ConnectionId.S;
      return postToConnection(apigwManagementApi(event), connectionId, message);
    }
    return Promise.resolve();
  });

  try {
    await Promise.all(postCalls);
    console.log('Sent to all.');
  } catch (e) {
    console.error(`failed to post: ${e.message}`);
    return makeResponse(500, e.stack);
  }
};

exports.get = async event => {
  console.log(JSON.stringify(event));
  const { eventId } = event.pathParameters;

  try {
    const params = {
      TableName: HAND_RAISES_TABLE,
      IndexName: 'LiveEventId',
      KeyConditionExpression: 'LiveEventId = :val',
      ExpressionAttributeValues: { ':val': eventId },
    };

    const data = await ddbc.query(params).promise();
    const handRaises = JSON.stringify(data.Items);

    console.log(`Hand raises: ${handRaises}`);

    return makeResponse(200, handRaises);
  } catch (e) {
    console.log('Something went wrong: ', e.message);
    return makeResponse(500, 'Internal server error');
  }
};

exports.onconnect = async event => {
  console.log('onconnect event:', JSON.stringify(event, null, 2));
  if (
    !event.requestContext.authorizer.LiveEventId ||
    !event.requestContext.authorizer.AttendeeId
  ) {
    console.error('missing LiveEventId or AttendeeId');
    return makeResponse(
      400,
      'Must have LiveEventId and AttendeeId parameters to connect.'
    );
  }

  const liveEventId = event.requestContext.authorizer.LiveEventId;
  const attendeeId = event.requestContext.authorizer.AttendeeId;

  const oneDayFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  try {
    await ddb
      .putItem({
        TableName: HAND_RAISE_CONNECTION_TABLE,
        Item: {
          LiveEventId: { S: liveEventId },
          AttendeeId: { S: attendeeId },
          ConnectionId: { S: event.requestContext.connectionId },
          TTL: { N: `${oneDayFromNow}` },
        },
      })
      .promise();
  } catch (e) {
    console.error(`error connecting: ${e.message}`);
    return makeResponse(500, `Failed to connect: ${JSON.stringify(e)}`);
  }
  return makeResponse(200, 'Connected.');
};

exports.ondisconnect = async event => {
  console.log('ondisconnect event:', JSON.stringify(event, null, 2));
  const liveEventId = event.requestContext.authorizer.LiveEventId;
  const attendeeId = event.requestContext.authorizer.AttendeeId;

  if (!liveEventId || !attendeeId) {
    console.error('missing LiveEventId or AttendeeId');
    return makeResponse(
      400,
      'Must have LiveEventId and AttendeeId parameters to disconnect.'
    );
  }
  try {
    const Key = {
      LiveEventId: liveEventId,
      AttendeeId: attendeeId,
    };

    await ddbc
      .delete({
        TableName: HAND_RAISE_CONNECTION_TABLE,
        Key,
      })
      .promise();

    await ddbc
      .delete({
        TableName: HAND_RAISES_TABLE,
        Key,
      })
      .promise();

    const message = {
      type: 'attendee-disconnected',
      payload: {
        attendeeId,
        liveEventId,
        handRaised: false,
      },
    };

    await notifyModerators(event, JSON.stringify(message), liveEventId);
  } catch (err) {
    console.error(
      `Failed to disconnect: LiveEventId - ${liveEventId}; AttendeeId - ${attendeeId}, with error: ${err}`
    );
    return makeResponse(500, `Failed to disconnect: ${JSON.stringify(err)}`);
  }
  return makeResponse(200, 'Disconnected.');
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

exports.ping = async event => {
  console.log('Ping event:', JSON.stringify(event, null, 2));

  const response = {
    type: 'ping',
    message: 'pong',
  };
  try {
    await postToConnection(
      apigwManagementApi(event),
      event.requestContext.connectionId,
      JSON.stringify(response)
    );

    return makeResponse(200, 'Pong!.');
  } catch (e) {
    console.error(`Failed to post ping message: ${e.message}`);
    return makeResponse(500, e.stack);
  }
};

exports.sendmessage = async event => {
  console.log('sendmessage event:', JSON.stringify(event, null, 2));
  const message = JSON.parse(event.body).data;
  const parsedMessage = JSON.parse(message);
  const targetAttendeeId =
    parsedMessage.payload && parsedMessage.payload.targetAttendeeId;
  const {
    isModerator,
    LiveEventId,
    AttendeeId,
  } = event.requestContext.authorizer;

  switch (parsedMessage.type) {
    case 'join-meeting' || 'attendee-progress':
      console.log('join-meeting/attendee-progress handler');
      // if message has a targetAttendeeId, send message just to them
      if (targetAttendeeId) {
        try {
          const params = {
            Key: {
              LiveEventId: {
                S: LiveEventId,
              },
              AttendeeId: {
                S: targetAttendeeId,
              },
            },
            TableName: HAND_RAISE_CONNECTION_TABLE,
          };

          const attendeeConnection = await ddb.getItem(params).promise();
          console.log(
            `Retrieved attendee connection for target attendee: ${JSON.stringify(
              attendeeConnection
            )}`
          );

          const attendeeConnectionId = attendeeConnection.Item.ConnectionId.S;

          // In case the moderator invites attendee to a meeting, they will generate an
          // attendee access key and pass to attendee.
          if (parsedMessage.type === 'join-meeting' && isModerator) {
            const attendeeAccessKey = await generateAccessKey(
              5,
              AttendeeType.ATTENDEE,
              LiveEventId
            );
            parsedMessage.payload.accessKey = attendeeAccessKey;
          }
          await postToConnection(
            apigwManagementApi(event),
            attendeeConnectionId,
            JSON.stringify(parsedMessage)
          );
          return makeResponse(200, 'Data sent to target attendee.');
        } catch (e) {
          console.error(
            `Failed to post message to target attendee: ${e.message}`
          );
          return makeResponse(500, e.stack);
        }
      }
      break;
    case 'raise-hand': {
      console.log('raise-hand handler');
      const question = parsedMessage.payload.message;
      const name = parsedMessage.payload.name;

      const params = {
        Key: {
          LiveEventId,
          AttendeeId,
        },
        UpdateExpression: 'SET #Q = :q, #N = :n, #D = :d',
        ExpressionAttributeNames: {
          '#Q': 'Question',
          '#N': 'Name',
          '#D': 'UpdatedAt',
        },
        ExpressionAttributeValues: {
          ':q': question,
          ':n': name,
          ':d': Date.now(),
        },
        ReturnValues: 'ALL_NEW',
        TableName: HAND_RAISES_TABLE,
      };

      try {
        const handRaise = await ddbc.update(params).promise();
        console.log('HandRaise: ', JSON.stringify(handRaise));
      } catch (e) {
        console.log('Something went wrong storing hand raise: ', e.message);
      }

      await notifyModerators(event, message, LiveEventId);
      break;
    }

    case 'update-hand-raise':
      console.log('update-hand-raise handler');
      const messageAttendee = parsedMessage.payload.attendeeId;
      const queue = parsedMessage.payload.queue;

      const params = {
        Key: {
          LiveEventId,
          AttendeeId: messageAttendee,
        },
        UpdateExpression: 'SET #Q = :q',
        ExpressionAttributeNames: {
          '#Q': 'QueueId',
        },
        ExpressionAttributeValues: {
          ':q': queue ? AttendeeId : '',
        },
        ReturnValues: 'ALL_NEW',
        TableName: HAND_RAISES_TABLE,
      };

      try {
        const handRaise = await ddbc.update(params).promise();
        const outgoingMessage = JSON.stringify({
          type: 'update-hand-raise',
          payload: handRaise.Attributes,
        });

        console.log('Updated hand raise message: ', outgoingMessage);
        await notifyModerators(event, outgoingMessage, LiveEventId);
      } catch (e) {
        console.log('Something went wrong storing hand raise: ', e.message);
      }

      break;
    default:
      // Send message to list each moderator
      await notifyModerators(event, message, LiveEventId);
  }

  return makeResponse(200, 'Data sent.');
};

const generatePolicy = (principalId, effect, resource, context) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  authResponse.context = context;
  return authResponse;
};

exports.authorize = async (event, context, callback) => {
  console.log('Authorize event:', JSON.stringify(event, null, 2));

  try {
    if (
      event.queryStringParameters.LiveEventId &&
      event.queryStringParameters.AttendeeId
    ) {
      const liveEventId = event.queryStringParameters.LiveEventId;
      const attendeeId = event.queryStringParameters.AttendeeId;

      console.log('Live EventId: ' + liveEventId);
      console.log('AttendeeId: ' + attendeeId);
      const attendee = await getAttendeeObject(attendeeId);
      console.log('Loaded Attendee: ' + JSON.stringify(attendee));

      if (attendee && attendee.LiveEventId === liveEventId) {
        console.log(
          `Authorized for liveEventId: ${liveEventId} and attendeeId: ${attendeeId}`
        );
        return generatePolicy('me', 'Allow', event.methodArn, {
          LiveEventId: liveEventId,
          AttendeeId: attendeeId,
          isModerator: attendee.AttendeeType === AttendeeType.MODERATOR,
        });
      } else {
        console.error('Unauthorized login');
      }
    } else {
      console.error('missing LiveEventId, AttendeeId parameters');
    }
  } catch (err) {
    console.error('Unexpected error encountered: ', JSON.stringify(err));
  }

  return generatePolicy('me', 'Deny', event.methodArn);
};
