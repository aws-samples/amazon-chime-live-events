const { apps, appForPath } = require('./apps');

const rewritePath = (path) => {
  const app = appForPath(path);
  if (!app) {
    console.log('Not modifying path', path);
    return path;
  }
  const rewritten = apps[app];
  console.log(`Path ${path} for app ${app} maps to ${rewritten}.`);
  return rewritten;
};

module.exports = (event, context, callback) => {
  const record = event && event.Records && event.Records[0];
  const request = record && record.cf && record.cf.request;
  console.log('Request is', JSON.stringify(request));

  if (!request || !request.origin || !request.origin.s3) {
      const message = 'Invalid request.';
      console.error(message);
      callback(null, {
          status: 403,
          statusDescription: 'Invalid request',
          body: JSON.stringify({ message: message }),
          headers: {'content-type': [{key: 'Content-Type', value: 'text/plain'}]},
      });
      return;
  }

  // Which app are we fetching?
  request.uri = rewritePath(request.uri);
  callback(null, request);
};