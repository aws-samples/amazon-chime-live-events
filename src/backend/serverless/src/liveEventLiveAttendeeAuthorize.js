const { validateAuthorizationHeader, generatePolicy } = require('./authorize');
const { AttendeeType } = require('./eventAttendeesDao');

exports.authorize = async (event, context, callback) => {
  console.log(`Event: ${JSON.stringify(event)}`);
  console.log(`Event headers: ${JSON.stringify(event.headers)}`);
  console.log(`Event.methodArn ${JSON.stringify(event.methodArn)}`);
  const strippedArn = event.methodArn.replace(/\/[^\/]*$/, '/*');

  // This is a hack as we noticed sometimes the headers come with different capitalization
  // then specified initially. Headers are supposed to be case insensitive.
  const lower_case_headers = {};
  for (const key in event.headers) {
    lower_case_headers[key.toLowerCase()] = event.headers[key];
  }
  const { authorization, attendeeid } = lower_case_headers;

  const authorized = await validateAuthorizationHeader(
    authorization,
    attendeeid,
    [AttendeeType.MODERATOR]
  );
  if (true === authorized) {
    callback(null, generatePolicy('me', 'Allow', strippedArn));
  } else {
    console.error(`Attendee is unauthorized. AttendeeId: ${attendeeid}`);
    callback(null, generatePolicy('me', 'Deny', strippedArn));
  }
};
