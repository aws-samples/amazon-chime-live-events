const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
});

const ddb = new AWS.DynamoDB.DocumentClient();

const { LIVE_EVENT_ATTENDEES_TABLE } = process.env;

const getAttendeeObject = async attendeeId => {
  var params = {
    Key: {
      AttendeeId: attendeeId,
    },
    TableName: LIVE_EVENT_ATTENDEES_TABLE,
  };

  const attendeeResponse = await ddb.get(params).promise();
  return attendeeResponse.Item;
};

const saveAttendee = async (attendee, attendeeType) => {
  const params = {
    TableName: LIVE_EVENT_ATTENDEES_TABLE,
    Item: {
      AttendeeId: attendee.attendeeId,
      AttendeeType: attendeeType,
      FullName: attendee.full_name,
      AssignedAccessKey: attendee.access_key,
      LiveEventId: attendee.eventId,
    },
  };
  await ddb.put(params).promise();
};

const updateUsedAccessKeyForAttendee = async (attendeeId, accessKeyId) => {
  // Update attendee record with the used accessKeyId
  const attendeeUpdateParams = {
    TableName: LIVE_EVENT_ATTENDEES_TABLE,
    Key: {
      AttendeeId: attendeeId,
    },
    UpdateExpression: 'SET usedAccessKey = :accessKeyId',
    ExpressionAttributeValues: {
      ':accessKeyId': accessKeyId,
    },
    ReturnValues: 'UPDATED_NEW',
  };
  await ddb.update(attendeeUpdateParams).promise();
};

const setIsVettedForAttendee = async (attendeeId, isVetted) => {
  // Update attendee record with isVetted prop.
  const attendeeUpdateParams = {
    TableName: LIVE_EVENT_ATTENDEES_TABLE,
    Key: {
      AttendeeId: attendeeId,
    },
    UpdateExpression: 'SET isVetted = :vetted',
    ExpressionAttributeValues: {
      ':vetted': isVetted,
    },
    ReturnValues: 'UPDATED_NEW',
  };
  const response = await ddb.update(attendeeUpdateParams).promise();

  return response.Attributes;
};

const AttendeeType = {
  MODERATOR: 'MODERATOR',
  TALENT: 'TALENT',
  ATTENDEE: 'ATTENDEE',
};

module.exports = {
  saveAttendee,
  getAttendeeObject,
  updateUsedAccessKeyForAttendee,
  setIsVettedForAttendee,
  AttendeeType,
};
