// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const {
  makeResponse
} = require('./cors');
const {
  signedCookiesFromEnv,
  canSignCookies
} = require('./liveEventCfSigner');

exports.getBroadcast = async event => {
  try {
    const eventId = event.pathParameters.eventId;
    const attendeeId = event.queryStringParameters.AttendeeId;
    const isValidAttendee =
      event.requestContext.authorizer.isValidAttendee === 'true';
    const signCookies = canSignCookies();
    const resp = {};

    if (isValidAttendee && signCookies) {
      const maxAge = Number.parseInt(process.env.ALLOWED_DURATION_SECS);
      const expiresOnUtc = Math.round(Date.now() / 1000) + maxAge;
      resp.authorization = {
        cookies: await signedCookiesFromEnv(expiresOnUtc),
        path: process.env.COOKIE_PATH,
        maxAge: maxAge,
      };
      console.log(`attendee=${attendeeId} event=${eventId}: returning cookies`);
    } else {
      console.log(`attendee=${attendeeId} event=${eventId}: not returning cookies: isValidAttendee=${isValidAttendee} canSignCookies=${signCookies}`);
    }

    return makeResponse(200, JSON.stringify(resp));
  } catch (e) {
    console.log(`Something went wrong. ${e.message}`);
    return makeResponse(500, JSON.stringify({
      message: 'Something went wrong.'
    }));
  }
};