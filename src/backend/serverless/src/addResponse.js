const { appForOriginPath } = require('./apps');
const { CC_VALUE_ASSETS, CC_VALUE_HTML } = require('./constants');

const HEADER_CONTENT_SECURITY_POLICY = 'content-security-policy';
const HEADER_HSTS = 'strict-transport-security';
const HEADER_SET_COOKIE = 'set-cookie';
const HEADER_CACHE_CONTROL = 'cache-control';

// TODO: add real CSP.
const BASIC_CSP = "frame-ancestors 'self';";

module.exports = (event, context, callback) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;

  response.headers[HEADER_HSTS] = [{
    key: HEADER_HSTS,
    value: 'max-age=31536000; includeSubdomains'
  }];

  // This is the path that we requested from the origin — e.g., /moderator.html —
  // not the full path that the caller provided.
  const app = appForOriginPath(request.uri);
  console.log('Origin path', request.uri, 'maps to', app);
  const cacheDuration = app ? CC_VALUE_HTML : CC_VALUE_ASSETS;

  response.headers[HEADER_CACHE_CONTROL] = [{
    key: HEADER_CACHE_CONTROL,
    value: cacheDuration,
  }];

  if (app) {
    response.headers[HEADER_CONTENT_SECURITY_POLICY] = [{
      key: HEADER_CONTENT_SECURITY_POLICY,
      value: BASIC_CSP,
    }];
  }

  callback(null, response);
};