/*******************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License Version 2.0 (the "License"). You may not
 *  use this file except in compliance with the License. A copy of the License is
 *  located at
 *
 *      http://www.apache.org/licenses/
 *
 *  or in the "license" file accompanying this file. This file is distributed on
 *  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or
 *  implied. See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
const axios = require('axios');

const sendResponse = async (event, context, responseStatus, responseData, physicalResourceId) => {
  const body = JSON.stringify({
    Status: responseStatus,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });
  const req = {
    url: event.ResponseURL,
    port: 443,
    method: "put",
    headers: {
      "content-type": "",
      "content-length": body.length
    },
    data: body
  };
  const resp = await axios(req);
  return resp.status;
};

module.exports = {
  send: sendResponse
};
