const otpGenerator = require('otp-generator');
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION
});

const ddb = new AWS.DynamoDB.DocumentClient();

const {
    ACCESS_KEYS_TABLE,
} = process.env;

const getAccessKeyObject = async (accessKey) => {
    const params = {
        Key: {
            "AccessKey": accessKey,
        },
        TableName: ACCESS_KEYS_TABLE,
    };

    const accessKeyResponse = await ddb.get(params).promise();
    return accessKeyResponse.Item;
};

const useAccessKey = async (accessKey) => {
    // Update AccessKey Usage
    const akUpdateParams = {
        Key: {
            "AccessKey": accessKey
        },
        UpdateExpression: "set Used = Used + :val",
        ExpressionAttributeValues:{
            ":val": 1
        },
        ReturnValues:"UPDATED_NEW",
        TableName: ACCESS_KEYS_TABLE
    };
    const accessKeyResponse = await ddb.update(akUpdateParams).promise();
    return accessKeyResponse.Item;
};

const generateAccessKey = async (maxUsageCount, attendeeType, eventId) => {
    const key = otpGenerator.generate(24, { upperCase: true, specialChars: false });
    const params = {
        TableName: ACCESS_KEYS_TABLE,
        Item: {
            Used: 0,
            Limit: maxUsageCount,
            AccessKey: key,
            KeyType: attendeeType,
            LiveEventId: eventId,
        },
    };
    await ddb.put(params).promise();
    return key;
};

module.exports = {
    getAccessKeyObject,
    useAccessKey,
    generateAccessKey,
};