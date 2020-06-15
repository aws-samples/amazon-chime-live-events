// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const { makeResponse } = require('./cors');
const { getMeeting } = require('./handlers');
const { postToConnection } = require('./messaging');

const {
  LIVE_EVENTS_TABLE,
  CONNECTIONS_TABLE_NAME,
  WS_MEETING_ENDPOINT,
} = process.env;

async function pushLiveAttendees(meetingTitle, data) {
  const { Meeting } = await getMeeting(meetingTitle);
  console.log(`Pushing to meeting ID: ${Meeting.MeetingId}`);

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: WS_MEETING_ENDPOINT,
  });

  const liveEventAttendees = await ddb
    .query({
      TableName: CONNECTIONS_TABLE_NAME,
      ConsistentRead: true,
      KeyConditionExpression: 'MeetingId = :val',
      ExpressionAttributeValues: { ':val': Meeting.MeetingId },
      ProjectionExpression: 'ConnectionId',
    })
    .promise();

  const message = JSON.stringify({
    type: 'live-video-feeds',
    payload: data,
  });

  const postCalls = liveEventAttendees.Items.map(async connection => {
    const connectionId = connection.ConnectionId;
    await postToConnection(apigwManagementApi, connectionId, message);
  });

  await Promise.all(postCalls);
}

exports.add = async event => {
  const { eventId, attendeeId } = event.pathParameters;

  try {
    const updatedRecord = await ddb
      .update({
        TableName: LIVE_EVENTS_TABLE,
        Key: { LiveEventId: eventId },
        UpdateExpression: 'ADD #liveIds :newId',
        ExpressionAttributeNames: {
          '#liveIds': 'liveAttendeeIds',
        },
        ExpressionAttributeValues: {
          ':newId': ddb.createSet([attendeeId]),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    const { talentMeetingId, liveAttendeeIds = [] } = updatedRecord.Attributes;
    console.log('Updated liveAttendeeIds: ', JSON.stringify(liveAttendeeIds));

    await pushLiveAttendees(talentMeetingId, liveAttendeeIds);
    return makeResponse(200, JSON.stringify(updatedRecord));
  } catch (e) {
    console.log('Something went wrong adding live attendee');
    if (e.message) {
      return makeResponse(500, e.message);
    }
    return makeResponse(500, 'Something went wrong.');
  }
};

exports.remove = async event => {
  const { eventId, attendeeId } = event.pathParameters;

  try {
    const updatedRecord = await ddb
      .update({
        TableName: LIVE_EVENTS_TABLE,
        Key: { LiveEventId: eventId },
        UpdateExpression: 'DELETE #liveIds :newId',
        ExpressionAttributeNames: {
          '#liveIds': 'liveAttendeeIds',
        },
        ExpressionAttributeValues: {
          ':newId': ddb.createSet([attendeeId]),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    const { talentMeetingId, liveAttendeeIds = [] } = updatedRecord.Attributes;
    console.log('Updated liveAttendeeIds: ', JSON.stringify(liveAttendeeIds));

    await pushLiveAttendees(talentMeetingId, liveAttendeeIds);
    return makeResponse(200, JSON.stringify(updatedRecord));
  } catch (e) {
    console.log('Something went wrong deleting live attendee');
    if (e.message) {
      return makeResponse(500, e.message);
    }
    return makeResponse(500, 'Something went wrong.');
  }
};
