const { generatePolicy } = require('./authorize');
const { getAttendeeObject } = require('./eventAttendeesDao');

exports.authorize = async (event, context, callback) => {
  const eventId = event.pathParameters.eventId;
  const attendeeId = event.queryStringParameters.AttendeeId;
  let isValidAttendee = false;

  try {
    if (attendeeId) {
      const attendee = await getAttendeeObject(attendeeId);
      console.log(JSON.stringify(attendee));

      if (attendee && attendee.LiveEventId === eventId) {
        console.log('Valid attendee ID and event IDs');
        isValidAttendee = true;
      }
    }
  } catch (e) {
    console.log(`Something went wrong getting attendee - ${e.message}`);
  }

  console.log('isValidAttendee: ', isValidAttendee);

  callback(
    null,
    generatePolicy('me', 'Allow', event.methodArn, { isValidAttendee })
  );
};
