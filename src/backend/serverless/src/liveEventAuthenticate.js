const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
});

const ddb = new AWS.DynamoDB.DocumentClient();
const kms = new AWS.KMS();

const { makeResponse } = require('./cors');
const {
  getAccessKeyObject,
  useAccessKey,
} = require('./accessKeysDao');

const {
  getAttendeeObject,
  updateUsedAccessKeyForAttendee,
  AttendeeType,
} = require ('./eventAttendeesDao');

const {
  LIVE_EVENTS_TABLE,
  KMS_KEY_ALIAS,
} = process.env;

exports.authenticate = async (event) => {
  try {
    const userEventId = event.pathParameters.eventId;
    const userAccessKey = JSON.parse(event.body).AccessKey;
    const userAttendeeId = JSON.parse(event.body).AttendeeId;

    // Validating it is an active access key.
    const accessKeyObject = await validateAndGetAccessKey(
      userEventId,
      userAccessKey
    );
    if (!accessKeyObject) {
      return makeResponse(401, 'Invalid Access Key');
    }

    let attendeeObject = null;
    if (userAttendeeId) {
      // Validate that the access key type matches the user type.
      attendeeObject = await validateAndGetUser(
        accessKeyObject,
        userAttendeeId
      );
      if (!attendeeObject) {
        return makeResponse(401, 'Invalid Access Key');
      }
    }
    // If it does, based on the user type, we need to signal the system that the user is logged in.
    // and return the authorization header.
    const encryptedAuthenticationToken = await loginUser(
      attendeeObject,
      accessKeyObject
    );

    if (encryptedAuthenticationToken) {
      return makeResponse(200, encryptedAuthenticationToken);
    }
    return makeResponse(401, 'Invalid Access Key');
  } catch (e) {
    if (e.message) {
      return makeResponse(500, e.message);
    }
    return makeResponse(500, 'Internal Server Error');
  }
};

const validateAndGetAccessKey = async (userEventId, userAccessKey) => {
    const accessKey = await getAccessKeyObject(userAccessKey);

  if (!accessKey) {
    return null;
  }

  const used = accessKey.Used;
  const maxLimit = accessKey.Limit;
  const eventId = accessKey.LiveEventId;

  if (used + 1 > maxLimit) {
    return null;
  }

  if (userEventId !== eventId) {
    return null;
  }
  return accessKey;
};

const validateAndGetUser = async (accessKeyObject, userAttendeeId) => {

  const attendee = await getAttendeeObject(userAttendeeId);

  if (attendee) {
    const attendeeType = attendee.AttendeeType;
    const attendeeEventId = attendee.LiveEventId;

    const accessKeyType = accessKeyObject.KeyType;
    const accessKeyEventId = accessKeyObject.LiveEventId;

    if (
      attendeeType !== accessKeyType ||
      attendeeEventId !== accessKeyEventId
    ) {
      return null;
    }

    return attendee;
  }
  return null;
};

const loginUser = async (attendeeObject, accessKeyObject) => {
  const accessKeyId = accessKeyObject.AccessKey;
  const eventId = accessKeyObject.LiveEventId;
  let attendeeId = null;

  await useAccessKey(accessKeyId);

  // Update User table and Moderators
  if (attendeeObject) {
    attendeeId = attendeeObject.AttendeeId;
    // Updating LiveEvent to store the moderator ids, if it's a moderator
    if (attendeeObject.AttendeeType === AttendeeType.MODERATOR) {
      let eventParams = {
        TableName: LIVE_EVENTS_TABLE,
        Key: {
          LiveEventId: eventId,
        },
      };
      const eventObjectResponse = await ddb.get(eventParams).promise();
      const eventObject = eventObjectResponse.Item;

      let moderatorIds = [];
      if (eventObject.moderatorIds) {
        moderatorIds = eventObject.moderatorIds;
        console.log(moderatorIds);
        moderatorIds.push(attendeeId);
        moderatorIds = moderatorIds.filter(onlyUnique);
        console.log(moderatorIds);
      } else {
        moderatorIds.push(attendeeId);
      }
      const eventUpdateParams = {
        TableName: LIVE_EVENTS_TABLE,
        Key: {
          LiveEventId: eventId,
        },
        UpdateExpression: 'SET moderatorIds = :modIds',
        ExpressionAttributeValues: {
          ':modIds': moderatorIds,
        },
        ReturnValues: 'UPDATED_NEW',
      };
      await ddb.update(eventUpdateParams).promise();
    }

    await updateUsedAccessKeyForAttendee(attendeeId, accessKeyId);
  }

  const authenticationToken = {
    AccessKey: accessKeyId,
    AttendeeId: attendeeId,
    LiveEventId: eventId,
  };

  const encryptedAccessKey = await kms
    .encrypt({
      Plaintext: JSON.stringify(authenticationToken),
      KeyId: KMS_KEY_ALIAS,
    })
    .promise();

  const authTokenToReturn = encryptedAccessKey.CiphertextBlob.toString(
    'base64'
  );
  const decryptedAccessToken = JSON.parse(
    (
      await kms
        .decrypt({
          CiphertextBlob: Buffer(authTokenToReturn, 'base64'),
        })
        .promise()
    ).Plaintext.toString('ascii')
  );

  console.log(decryptedAccessToken);

  return authTokenToReturn;
};

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}