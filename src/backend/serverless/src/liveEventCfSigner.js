// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const crypto = require('crypto');
const AWS = require('aws-sdk');

// Variable to store the memoized private key for signing the CloudFront access
// cookies.
let _cfSignatureKey = null;

// Retrieves the CloudFront signing key from AWS Secrets Manager, identified by
// the given parameter `secretId`. The private key must have been stored in
// Secrets Manager in PEM format.
const getCfSignatureKey = async secretARN => {
  const client = new AWS.SecretsManager({
    region: process.env.AWS_REGION
  });
  const value = await client.getSecretValue({
    SecretId: secretARN
  }).promise();
  return crypto.createPrivateKey(value.SecretString);
};

// Return the memoized CloudFront signing key, if available. If not, it will
// retrieve the key, memoize it, and then return the key to the caller.
const cfSignatureKey = async () => {
  return _cfSignatureKey || (
    _cfSignatureKey = await getCfSignatureKey(process.env.PKEY_SECRET_ARN)
  );
};

// Builds the CloudFront signing policy that is necessary for generating signed
// cookies.
//
// XXX `expiresOnUtc` and `activeFromUtc` MUST BE Epoch timestamps in UTC, e.g.
// like those having been generated using `Math.round(Date.now() / 1000)`.
const buildCustomCfPolicy = (expiresOnUtc, path, activeFromUtc, srcIp) => {
  if (!expiresOnUtc) {
    throw new Error("must specify expiresOnUtc parameter");
  }
  const policy = {
    Statement: [{
      Resource: (!path) ? "*" : path,
      Condition: {
        DateLessThan: {
          "AWS:EpochTime": expiresOnUtc,
        },
        IpAddress: {
          "AWS:SourceIp": srcIp || '0.0.0.0/0',
        },
      },
    }],
  }
  if (activeFromUtc) {
    policy.Statement[0].Condition.DateGreaterThan = {
      "AWS:EpochTime": activeFromUtc,
    };
  }
  return JSON.stringify(policy);
};

// Sign the given CloudFront access policy with the given private key.
const signPolicy = (privateKey, policy) => {
  const signer = crypto.createSign('SHA1');
  signer.update(policy);
  signer.end();
  return signer.sign(privateKey);
};

// Encodes a value in Base64 and then converts certain characters from that into
// more URL-safe choices and returns the result.
const encodeUrlSafe = value => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');
};

// Generate the signed cookie material for CloudFront access using the supplied
// parameters.
//
// `keyId`      => CloudFront Key ID of the private key to be used to sign the
//                 cookies (required)
// `key`        => Private key to sign cookies (required)
// `expiresOn`  => Epoch time in UTC when the signature should expire
//                 (required)
// `path`       => Path from which to allow objects to be requested on the
//                 CloudFront origin (optional; defaults to "*")
// `activeFrom` => Epoch time in UTC from which this signature should be valid
//                 (optional)
// `srcIp`      => Source IP from which requests should be valid (optional)
//
// This function returns the map of cookie names and values to send along with
// the HTTP response.
const generateSignedCookies = (
  keyId,
  key,
  expiresOnUtc,
  path,
  activeFromUtc,
  srcIp
) => {
  const policy = buildCustomCfPolicy(expiresOnUtc, path, activeFromUtc, srcIp);
  const signature = signPolicy(key, policy);
  return {
    'CloudFront-Key-Pair-Id': keyId,
    'CloudFront-Policy': encodeUrlSafe(policy),
    'CloudFront-Signature': encodeUrlSafe(signature)
  };
};

// Generate the signed cookie material for CloudFront access using
// `generateSignedCookies` and the environment variables set on the Lambda
// function. The `expiresOnUtc` parameter is the Epoch time in UTC after
// which access is no longer allowed.
const signedCookiesFromEnv = async expiresOnUtc => {
  const privateKey = await cfSignatureKey();
  const keyId = process.env.PKEY_CF_ID;
  const path = `https://${process.env.DOMAIN_NAME}${process.env.ORIGIN_PATH}`;
  return generateSignedCookies(keyId, privateKey, expiresOnUtc, path);
};

const canSignCookies = () => {
  return !(!process.env.PKEY_CF_ID || !process.env.PKEY_SECRET_ARN);
};

module.exports = {
  generateSignedCookies,
  signedCookiesFromEnv,
  canSignCookies
};