const otpGenerator = require('otp-generator');
const short = require('short-uuid');
const AWS = require('aws-sdk');
const csv = require('csvtojson');

const { makeResponse } = require('./cors');
const { generateAccessKey } = require('./accessKeysDao');
const { AttendeeType, saveAttendee } = require('./eventAttendeesDao');

AWS.config.update({
  region: process.env.AWS_REGION,
});

const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const {
  LIVE_EVENTS_TABLE,
  EVENT_PREFIX,
  USE_STRICT_ACCESS_KEYS,
  DOMAIN_PREFIX,
  CUSTOMER_IMPORT_BUCKET,
} = process.env;

/*
Use test event with something similar to this:

// Currently this script supports only 1 talent and broadcaster, but with little changes we can support multiple.
{
  "attendeesKey": "Attendees.csv",
  "moderatorsKey": "Moderators.csv",
  "talentsKey": "Talents.csv"
}
*/

exports.createEvent = async event => {
  const bucket = CUSTOMER_IMPORT_BUCKET;
  const attendeesFileKey = event.attendeesKey;
  const moderatorsFileKey = event.moderatorsKey;
  const talentsFileKey = event.talentsKey;
  const paramsAttendees = { Bucket: bucket, Key: attendeesFileKey };
  const paramsModerators = { Bucket: bucket, Key: moderatorsFileKey };
  const paramsTalents = { Bucket: bucket, Key: talentsFileKey };

  const fileAttendeesStream = s3.getObject(paramsAttendees).createReadStream();
  const moderatorAttendeesStream = s3
    .getObject(paramsModerators)
    .createReadStream();
  const talentAttendeesStream = s3.getObject(paramsTalents).createReadStream();

  // convert csv file (stream) to JSON format data
  const attendees = await csv().fromStream(fileAttendeesStream);
  const moderators = await csv().fromStream(moderatorAttendeesStream);
  const talents = await csv().fromStream(talentAttendeesStream);

  // Generate new event id
  const shortIdForEvent = otpGenerator.generate(4, { specialChars: false });
  const eventId = EVENT_PREFIX + '-' + shortIdForEvent;

  // console.log(attendees);
  // console.log(moderators);
  // console.log(talents);

  // For now we only take the first talent in the file, but later on we can support more
  const talent = talents[0];
  const talentId = short().uuid();
  const talentAccessKey = await generateAccessKey(
    99999,
    AttendeeType.TALENT,
    eventId
  );

  const slash = DOMAIN_PREFIX.endsWith('/') ? '' : '/';
  const talentUrl =
    DOMAIN_PREFIX +
    slash +
    'talent' +
    '?aId=' +
    talentId +
    '&eId=' +
    eventId +
    '&name=' +
    encodeURIComponent(talent.full_name);

  talent.eventId = eventId;
  talent.attendeeId = talentId;
  talent.access_url = talentUrl;
  talent.access_key = talentAccessKey;

  // Save new event
  const params = {
    TableName: LIVE_EVENTS_TABLE,
    Item: {
      LiveEventId: eventId,
      talentMeetingId: talentId,
    },
  };

  await ddb.put(params).promise();

  // Will create broadcast attendee with same access rights as TALENT.
  const broadcaster = { full_name: '‹Broadcaster›' };
  const broadcasterAttendeeId = short().uuid();
  const broadcastAccessKey = await generateAccessKey(
    99999,
    AttendeeType.MODERATOR,
    eventId
  );
  broadcaster.access_key = broadcastAccessKey;
  broadcaster.attendeeId = broadcasterAttendeeId;
  broadcaster.eventId = eventId;
  broadcaster.access_url = `${DOMAIN_PREFIX +
    slash}broadcast?aId=${broadcasterAttendeeId}&eId=${eventId}&accessKey=${broadcastAccessKey}&name=${encodeURIComponent(
    broadcaster.full_name
  )}`;

  await saveAttendees(attendees, moderators, talent, broadcaster, eventId);

  await saveJSONtoS3(moderators, bucket, eventId + '_event_moderators.json');
  await saveJSONtoS3(attendees, bucket, eventId + '_event_attendees.json');
  await saveJSONtoS3(talent, bucket, eventId + '_event_talents.json');
  await saveJSONtoS3(broadcaster, bucket, eventId + '_event_broadcaster.json');

  return makeResponse(
    200,
    JSON.stringify({
      EventId: eventId,
      TalentURL: talentUrl,
      TalentAccessKey: talentAccessKey,
      BroadcasterURL: broadcaster.access_url,
    })
  );
};

const saveAttendees = async (
  attendees,
  moderators,
  talent,
  broadcaster,
  eventId
) => {
  // Save Talent and Broadcaster first (talent and broadcaster is already complete, and does not need an access key generated)
  await saveAttendee(talent, AttendeeType.TALENT);
  await saveAttendee(broadcaster, AttendeeType.MODERATOR);

  // Save moderators and assign them a key
  // Currently the association is not enforced, but this can be later added as an extra safety measure.
  // For now it's just for keeping track if moderators used the key assigned to them.

  let access_key_usage_count = 99999;
  if (USE_STRICT_ACCESS_KEYS) {
    access_key_usage_count = 10;
  }

  let moderatorAccessKey = await generateAccessKey(
    access_key_usage_count,
    AttendeeType.MODERATOR,
    eventId
  );
  for (const moderator of moderators) {
    const attendeeId = short().uuid();
    // http://localhost:9001/moderator?aId=Mod1234567&eId=townhall56745&name=Moderator#/
    const slash = DOMAIN_PREFIX.endsWith('/') ? '' : '/';
    const accessUrl =
      DOMAIN_PREFIX +
      slash +
      'moderator' +
      '?aId=' +
      attendeeId +
      '&eId=' +
      eventId +
      '&name=' +
      encodeURIComponent(moderator.full_name);

    moderator.eventId = eventId;
    moderator.attendeeId = attendeeId;
    moderator.access_url = accessUrl;
    moderator.access_key = moderatorAccessKey;

    await saveAttendee(moderator, AttendeeType.MODERATOR);

    if (USE_STRICT_ACCESS_KEYS) {
      moderatorAccessKey = await generateAccessKey(
        access_key_usage_count,
        AttendeeType.MODERATOR,
        eventId
      );
    }
  }

  for (const attendee of attendees) {
    const attendeeId = short().uuid();
    // http://localhost:9001/attendee?aId=Mod1234567&eId=townhall56745&name=Moderator#/
    const slash = DOMAIN_PREFIX.endsWith('/') ? '' : '/';
    const accessUrl =
      DOMAIN_PREFIX +
      slash +
      'attendee' +
      '?aId=' +
      attendeeId +
      '&eId=' +
      eventId +
      '&name=' +
      encodeURIComponent(attendee.full_name);

    attendee.eventId = eventId;
    attendee.attendeeId = attendeeId;
    attendee.access_url = accessUrl;

    await saveAttendee(attendee, AttendeeType.ATTENDEE);
  }
};

const saveJSONtoS3 = async (data, bucket, path) => {
  const params = {
    Bucket: bucket, // your bucket name,
    Key: path, // path to the object
    Body: JSON.stringify(data),
  };

  await s3.putObject(params).promise();
};
