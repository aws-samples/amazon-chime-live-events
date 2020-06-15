const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
});

const kms = new AWS.KMS();

const { getAccessKeyObject } = require('./accessKeysDao');
const { getAttendeeObject } = require('./eventAttendeesDao');

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

const validateAuthorizationHeader = async (
  Authorization,
  AttendeeId,
  attendeeTypes
) => {
  try {
    console.log(`Authorization token: ${Authorization}`);
    console.log(`AttendeeId: ${AttendeeId}`);
    console.log(`AttendeeTypes: ${attendeeTypes}`);

    const decryptedAccessToken = JSON.parse(
      (
        await kms
          .decrypt({
            CiphertextBlob: Buffer(Authorization, 'base64'),
          })
          .promise()
      ).Plaintext.toString('ascii')
    );

    const decryptedAccessKey = decryptedAccessToken.AccessKey;
    const decryptedAttendeeId = decryptedAccessToken.AttendeeId;

    const accessKey = await getAccessKeyObject(decryptedAccessKey);
    const attendee = await getAttendeeObject(decryptedAttendeeId);

    console.log(`Access key from ddb: ${JSON.stringify(accessKey)}`);
    console.log(`Attendee from ddb: ${JSON.stringify(attendee)}`);

    // We are checking if:
    // - The access key encrypted is valid. (e.g. exists)
    // - The attendeeId is valid. (e.g. exists)
    // - And also if the attendee id in the header matches the one in the encrypted token.
    return (
      accessKey &&
      attendee &&
      attendee.AttendeeId === AttendeeId &&
      attendeeTypes &&
      attendeeTypes.includes(attendee.AttendeeType)
    );
  } catch (e) {
    console.log(
      `Error encountered validating response header ${JSON.stringify(e)}`
    );
    return false;
  }
};

module.exports = {
  generatePolicy,
  validateAuthorizationHeader,
};
