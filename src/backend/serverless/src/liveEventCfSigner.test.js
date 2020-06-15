const crypto = require('crypto');
const AWS = require('aws-sdk');

const mockSecretsManagerGetSecretValue = jest.fn();
jest.mock('aws-sdk', () => {
  return {
    SecretsManager: jest.fn(() => ({
      getSecretValue: mockSecretsManagerGetSecretValue
    }))
  };
});

const {
  generateSignedCookies,
  signedCookiesFromEnv,
  canSignCookies
} = require('./liveEventCfSigner');

const {
  privateKey,
  publicKey
} = crypto.generateKeyPairSync('rsa', {
  modulusLength: 512
});
const privateKeyPem = privateKey.export({
  type: 'pkcs1',
  format: 'pem'
});
const keyId = 'APKAAAAAAAAAAAAAAAAA';
const secretARN = 'arn:aws:secretsmanager:us-east-1:999999999999:secret:cf-pkey-APKAAAAAAAAAAAAAAAAA-333333';
const domain = 'd111111abcdef8.cloudfront.net';
const path = '/out/v1/*';
const activeFromUtc = Date.now() / 1000;
const expiresOnUtc = activeFromUtc + 86400;
const srcIp = "12.34.56.78";

const decodeBinary = value => {
  const restored = value.replace(/~/g, '/').replace(/_/g, '=').replace(/-/g, '+');
  return Buffer.from(restored, 'base64');
};

const decodeUrlSafe = value => decodeBinary(value).toString('utf-8');

const signatureVerification = (value, signature) => {
  const verifier = crypto.createVerify('SHA1');
  verifier.update(value);
  verifier.end();
  return verifier.verify(publicKey, signature);
};

describe('generateSignedCookies', () => {
  it('should generate proper cookie values when passing only expiration and path', () => {
    const cookies = generateSignedCookies(keyId, privateKey, expiresOnUtc, path);

    expect(cookies['CloudFront-Key-Pair-Id']).toBe(keyId);

    const decodedPolicy = decodeUrlSafe(cookies['CloudFront-Policy']);
    const statement = JSON.parse(decodedPolicy).Statement[0];
    expect(statement.Resource).toBe(path);
    expect(statement.Condition.DateLessThan['AWS::EpochTime']).toBe(expiresOnUtc);
    expect(statement.Condition.DateGreaterThan).toBeUndefined();
    expect(statement.Condition.IpAddress).toBeUndefined();

    const decodedSignature = decodeBinary(cookies['CloudFront-Signature']);
    expect(signatureVerification(decodedPolicy, decodedSignature)).toBe(true);
  });

  it('should generate proper cookie values when passing all parameters', () => {
    const cookies = generateSignedCookies(keyId, privateKey, expiresOnUtc, path, activeFromUtc, srcIp);

    expect(cookies['CloudFront-Key-Pair-Id']).toBe(keyId);

    const decodedPolicy = decodeUrlSafe(cookies['CloudFront-Policy']);
    const statement = JSON.parse(decodedPolicy).Statement[0];
    expect(statement.Resource).toBe(path);
    expect(statement.Condition.DateLessThan['AWS::EpochTime']).toBe(expiresOnUtc);
    expect(statement.Condition.DateGreaterThan['AWS::EpochTime']).toBe(activeFromUtc);
    expect(statement.Condition.IpAddress['AWS::SourceIp']).toBe(srcIp);

    const decodedSignature = decodeBinary(cookies['CloudFront-Signature']);
    expect(signatureVerification(decodedPolicy, decodedSignature)).toBe(true);
  });
});

describe('signedCookiesFromEnv', () => {
  beforeEach(() => {
    mockSecretsManagerGetSecretValue.mockReset();
    process.env.DOMAIN_NAME = domain;
    process.env.ORIGIN_PATH = path;
    process.env.PKEY_CF_ID = keyId;
    process.env.PKEY_SECRET_ARN = secretARN;
  });

  afterEach(() => {
    delete process.env.DOMAIN_NAME;
    delete process.env.ORIGIN_PATH;
    delete process.env.PKEY_CF_ID;
    delete process.env.PKEY_SECRET_ARN;
  });

  it('should use key from SM to generate cookies', async () => {
    let actualSecretId = null;
    mockSecretsManagerGetSecretValue.mockImplementation(params => {
      return {
        promise() {
          actualSecretId = params.SecretId;
          return Promise.resolve({
            SecretString: privateKeyPem
          });
        }
      }
    });

    const cookies = await signedCookiesFromEnv(expiresOnUtc);

    expect(actualSecretId).toBe(secretARN);

    expect(cookies['CloudFront-Key-Pair-Id']).toBe(keyId);

    const decodedPolicy = decodeUrlSafe(cookies['CloudFront-Policy']);
    const statement = JSON.parse(decodedPolicy).Statement[0];
    expect(statement.Resource).toBe(`https://${domain}${path}`);
    expect(statement.Condition.DateLessThan['AWS::EpochTime']).toBe(expiresOnUtc);
    expect(statement.Condition.DateGreaterThan).toBeUndefined();
    expect(statement.Condition.IpAddress).toBeUndefined();

    const decodedSignature = decodeBinary(cookies['CloudFront-Signature']);
    expect(signatureVerification(decodedPolicy, decodedSignature)).toBe(true);
  });

  it('should throw error when SM retrieval fails', async () => {
    mockSecretsManagerGetSecretValue.mockImplementation(params => {
      return {
        promise() {
          return Promise.reject(new Error("something broke"));
        }
      }
    });

    try {
      await signedCookiesFromEnv(expiresOnUtc);
    } catch (err) {
      expect(err).toMatch('error');
    }
  });
});

describe('canSignCookies', () => {
  afterEach(() => {
    delete process.env.PKEY_CF_ID;
    delete process.env.PKEY_SECRET_ARN;
  });

  it('should return true when all env vars are set', () => {
    process.env.PKEY_CF_ID = keyId;
    process.env.PKEY_SECRET_ARN = secretARN;
    expect(canSignCookies()).toBe(true);
  });

  it('should return false when only PKEY_CF_ID env var is set', () => {
    process.env.PKEY_CF_ID = keyId;
    expect(canSignCookies()).toBe(false);
  });

  it('should return false when only PKEY_SECRET_ARN env var is set', () => {
    process.env.PKEY_SECRET_ARN = secretARN;
    expect(canSignCookies()).toBe(false);
  });

  it('should return false when no env vars are set', () => {
    expect(canSignCookies()).toBe(false);
  });
});