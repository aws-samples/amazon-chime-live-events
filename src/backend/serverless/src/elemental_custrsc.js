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
const cfn = require('./lib/cfn');
const MediaPackage = require('./lib/mediapackage');
const MediaLive = require('./lib/medialive');

exports.handler = async (event, context) => {
  console.log('PARAMS:: ', event);
  const config = event.ResourceProperties;
  let responseData = {};
  let Id;

  // Each resource returns a promise with a JSON object to return
  // CloudFormation.
  try {
    if (event.RequestType === 'Create') {
      switch (config.Resource) {
        case 'MediaLiveInput':
          responseData = await MediaLive.createInput(config);
          Id = responseData.Id;
          break;
        case 'MediaLiveChannel':
          responseData = await MediaLive.createChannel(config);
          Id = responseData.ChannelId;
          break;
        case 'MediaLiveChannelStart':
          await MediaLive.startChannel(config);
          break;
        case 'MediaPackageChannel':
          responseData = await MediaPackage.createChannel(config);
          Id = responseData.ChannelId;
          break;
        case 'MediaPackageEndPoint':
          responseData = await MediaPackage.createEndPoint(config);
          Id = responseData.Id;
          break;
        default:
          console.log(config.Resource, ': not defined as a custom resource, sending success response');
      }
    }
    if (event.RequestType === 'Delete') {
      switch (config.Resource) {
        case 'MediaLiveChannel':
          // XXX For some reason, the PhysicalResourceId we set in the creation
          // of this resource is not passed to us here in the deletion;
          // something else is passed instead. Thus, we instead pass the ID of
          // the input that is attached to this channel so we can look that up
          // and get the channel ID from there.
          await MediaLive.deleteChannel(config.InputId);
          break;
        case 'MediaPackageChannel':
          await MediaPackage.deleteChannel(event.PhysicalResourceId);
          break;
        default:
          // medialive inputs and mediapackage endpoints are deleted as part of
          // the the channel deletes so not included here, sending default
          // success response
          console.log(event.LogicalResourceId, ': delete not required, sending success response');
      }
    }

    const response = await cfn.send(event, context, 'SUCCESS', responseData, Id);
    console.log('CFN STATUS:: ', response, ' ID::', Id, ' RESPONSE::', responseData);
  } catch (err) {
    console.log('ERROR:: ', err, err.stack);
    await cfn.send(event, context, 'FAILED');
  }
};