const fs = require('fs');

const { addCORSHeaders } = require('./cors');

exports.handler = async (event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": addCORSHeaders({
      'Content-Type': 'text/html'
    }),
    "body": '',
    "isBase64Encoded": false
  };
  response.body = fs.readFileSync('./index.html', {encoding: 'utf8'});
  callback(null, response);
};

exports.handlerV2 = async (event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": addCORSHeaders({
      'Content-Type': 'text/html'
    }),
    "body": '',
    "isBase64Encoded": false
  };
  response.body = fs.readFileSync('./indexV2.html', {encoding: 'utf8'});
  callback(null, response);
};

// L@E handlers.
exports.addResponse = require('./addResponse');
exports.switchRequest = require('./switchRequest');