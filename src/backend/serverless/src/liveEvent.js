// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const { makeResponse } = require('./cors');

const { LIVE_EVENTS_TABLE } = process.env;

exports.getLiveEvent = async event => {
  const eventId = event.pathParameters.eventId;

  try {
    const params = {
      Key: {
        LiveEventId: eventId,
      },
      TableName: LIVE_EVENTS_TABLE,
    };

    const liveEventsResponse = await ddb.get(params).promise();

    const liveEvent = liveEventsResponse.Item;
    return makeResponse(200, JSON.stringify(liveEvent));
  } catch (e) {
    if (e.message) {
      return makeResponse(500, e.message);
    }
    return makeResponse(500, 'Something went wrong.');
  }
};

exports.updateLiveEvent = async event => {
  const eventId = event.pathParameters.eventId;
  const parsedRequestBody = JSON.parse(event.body);
  try {
    if (!parsedRequestBody) {
      throw new Error('Missing request body');
    }

    const talentAttendeeIdForTalentMeeting =
      parsedRequestBody.talentAttendeeIdForTalentMeeting;
    if (typeof talentAttendeeIdForTalentMeeting !== 'string') {
      throw new Error('Invalid request payload');
    }

    console.log(
      `Updating talentAttendeeIdForTalentMeeting to ${talentAttendeeIdForTalentMeeting} for eventId ${eventId}`
    );
    const updateParams = {
      TableName: LIVE_EVENTS_TABLE,
      Key: {
        LiveEventId: eventId,
      },
      UpdateExpression:
        'SET talentAttendeeIdForTalentMeeting = :talentAttendeeIdForTalentMeeting',
      ExpressionAttributeValues: {
        ':talentAttendeeIdForTalentMeeting': talentAttendeeIdForTalentMeeting,
      },
      ReturnValues: 'ALL_NEW',
    };

    const updatedRecord = await ddb.update(updateParams).promise();

    console.log('Updated record: ', updatedRecord);

    return makeResponse(200, JSON.stringify(updatedRecord.Attributes));
  } catch (e) {
    if (e.message) {
      return makeResponse(500, e.message);
    }
    return makeResponse(500, 'Something went wrong.');
  }
};
