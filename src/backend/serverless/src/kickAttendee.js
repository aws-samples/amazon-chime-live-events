const AWS = require('aws-sdk');
const chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint(
  'https://service.chime.aws.amazon.com/console'
);

const { makeResponse } = require('./cors');
const { getMeeting } = require('./handlers');
const { setIsVettedForAttendee } = require('./eventAttendeesDao');

exports.handler = async (event, context, callback) => {
  const title = event.pathParameters.eventId;
  const body = JSON.parse(event.body);
  const attendeeId = body && body.attendeeId;

  if (!attendeeId || !title) {
    callback(
      null,
      makeResponse(
        404,
        JSON.stringify({ message: 'attendee ID and title required' })
      )
    );
    return;
  }

  const meetingData = await getMeeting(title);

  if (!meetingData) {
    console.log('No meeting data found for title');
    callback(
      null,
      makeResponse(404, JSON.stringify({ message: 'No meeting found' }))
    );
    return;
  }

  try {
    const requestParams = {
      MeetingId: meetingData.Meeting.MeetingId,
      AttendeeId: attendeeId,
    };
    const attendee = await chime.getAttendee(requestParams).promise();
    if (!attendee) {
      throw new Error('Failed to get attendee.');
    }
    console.log(`Attendee to be kicked: ${JSON.stringify(attendee)}`);

    await chime.deleteAttendee(requestParams).promise();

    const isVettedResult = await setIsVettedForAttendee(
      attendee.Attendee.ExternalUserId,
      false
    );
    console.log(
      `AttendeeId: ${
        attendee.Attendee.ExternalUserId
      } isVetted status set to: ${JSON.stringify(isVettedResult)}`
    );
  } catch (e) {
    console.error('kick handler failed:', e);
    callback(
      null,
      makeResponse(
        503,
        JSON.stringify({ error: e.message, message: 'Internal server error' })
      )
    );
    return;
  }

  const message = `Attendee kicked!`;
  console.log(message);

  callback(null, makeResponse(200, JSON.stringify({ message })));
};
