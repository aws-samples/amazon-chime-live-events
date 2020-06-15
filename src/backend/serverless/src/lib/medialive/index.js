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
const AWS = require('aws-sdk');

const sleepMs = ms => new Promise(resolve => setTimeout(resolve, ms));

const createPushInput = async (medialive, config) => {
  const sgData = await medialive.createInputSecurityGroup({
    WhitelistRules: [{
      Cidr: config.Cidr
    }]
  }).promise();

  const inputParams = {
    InputSecurityGroups: [sgData.SecurityGroup.Id],
    Name: config.StreamName,
    Type: config.Type,
  };
  if (config.Type === 'RTMP_PUSH') {
    inputParams.Destinations = [{
        StreamName: config.StreamName + '/primary'
      },
      {
        StreamName: config.StreamName + '/secondary'
      }
    ];
  }
  const data = await medialive.createInput(inputParams).promise();

  return {
    Id: data.Input.Id,
    EndPoint1: data.Input.Destinations[0].Url,
    EndPoint2: data.Input.Destinations[1].Url
  };
};

const createPullInput = async (medialive, ssm, config) => {
  // Requires 2 source URLs, authentication is optional.
  const params = {
    Name: config.StreamName,
    Type: config.Type,
    Sources: [{
        Url: config.PriUrl
      },
      {
        Url: config.SecUrl
      }
    ]
  };

  // If authentication is required, update params & store U/P in Parameter Store
  if (config.PriUser !== null && config.PriUser !== '') {
    params.Sources[0].Username = config.PriUser;
    params.Sources[0].PasswordParam = config.PriUser;
    await ssm.putParameter({
      Name: config.PriUser,
      Value: config.PriPass,
      Type: 'String',
      Description: 'Live stream primary input credentials',
      Overwrite: true
    }).promise();
  }
  if (config.SecUser !== null && config.SecUser !== '') {
    params.Sources[1].Username = config.SecUser;
    params.Sources[1].PasswordParam = config.SecUser;
    await ssm.putParameter({
      Name: config.SecUser,
      Value: config.SecPass,
      Type: 'String',
      Description: 'Live stream secondary input credentials',
      Overwrite: true
    }).promise();
  }

  // Create input
  const data = await medialive.createInput(params).promise();

  return {
    Id: data.Input.Id,
    EndPoint1: 'Push InputType only',
    EndPoint2: 'Push InputType only'
  };
};

const createMediaconnectInput = async (medialive, config) => {
  // Create input. Requires 2 Mediaconnect ARNs
  const data = await medialive.createInput({
    Name: config.StreamName,
    Type: config.Type,
    RoleArn: config.RoleArn,
    MediaConnectFlows: [{
        FlowArn: config.PriMediaConnectArn
      },
      {
        FlowArn: config.SecMediaConnectArn
      }
    ]
  }).promise();

  return {
    Id: data.Input.Id,
    EndPoint1: 'Push InputType only',
    EndPoint2: 'Push InputType only'
  };
};

// Create input given an input type
const CreateInput = async (config) => {
  const medialive = new AWS.MediaLive();
  const ssm = new AWS.SSM();

  switch (config.Type) {
    case 'RTP_PUSH':
    case 'RTMP_PUSH':
      return await createPushInput(medialive, config);
    case 'RTMP_PULL':
    case 'URL_PULL':
      return await createPullInput(medialive, ssm, config);
    case 'MEDIACONNECT':
      return await createMediaconnectInput(medialive, config);
    default:
      return Promise.reject("input type not defined in request");
  }
};

const CreateChannel = async (config) => {
  const medialive = new AWS.MediaLive();
  const encode1080p = require('./encoding-profiles/medialive-1080p');
  const encode720p = require('./encoding-profiles/medialive-720p');
  const encode540p = require('./encoding-profiles/medialive-540p');

  // Define baseline parameters for create channel
  const params = {
    Destinations: [{
      Id: "destination1",
      Settings: [{
          PasswordParam: config.MediaPackagePriUser,
          Url: config.MediaPackagePriUrl,
          Username: config.MediaPackagePriUser
        },
        {
          PasswordParam: config.MediaPackageSecUser,
          Url: config.MediaPackageSecUrl,
          Username: config.MediaPackageSecUser
        }
      ]
    }],
    InputSpecification: {
      Codec: config.Codec,
      Resolution: '',
      MaximumBitrate: ''
    },
    Name: config.Name,
    RoleArn: config.Role,
    InputAttachments: [{
      InputId: config.InputId,
      InputSettings: {}
    }],
    EncoderSettings: {}
  };
  // loop only supported in HLS_PULL
  if (config.Type === 'URL_PULL') {
    params.InputAttachments[0].InputSettings = {
      SourceEndBehavior: 'LOOP'
    };
  }
  // Update parameters based on source resolution (defined in CloudFormation)
  switch (config.Resolution) {
    case '1080':
      params.InputSpecification.Resolution = 'HD';
      params.InputSpecification.MaximumBitrate = 'MAX_20_MBPS';
      params.EncoderSettings = encode1080p;
      break;
    case '720':
      params.InputSpecification.Resolution = 'HD';
      params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
      params.EncoderSettings = encode720p;
      break;
    default:
      params.InputSpecification.Resolution = 'SD';
      params.InputSpecification.MaximumBitrate = 'MAX_10_MBPS';
      params.EncoderSettings = encode540p;
      break;
  }

  // Create Channel
  const createData = await medialive.createChannel(params).promise();
  const rv = {
    ChannelId: createData.Channel.Id
  };

  // Wait for Channel create to complete; valid States are CREATING, IDLE,
  // CREATE_FAILED
  let descData = await medialive.describeChannel(rv).promise();
  while (descData.State === 'CREATING') {
    await sleepMs(3000);
    descData = await medialive.describeChannel(rv).promise();
  }
  if (descData.State === 'CREATE_FAILED') {
    return Promise.reject('CREATE_FAILED');
  }

  return rv;
};

const StartChannel = async (config) => {
  const medialive = new AWS.MediaLive();
  await medialive.startChannel({
    ChannelId: config.ChannelId
  }).promise();
  return 'success';
};

const findChannelId = async (medialive, inputId) => {
  const resp = await medialive.describeInput({
    InputId: inputId
  }).promise();
  return (resp.AttachedChannels.length < 1) ? null : resp.AttachedChannels[0];
};

const stopAndDeleteChannel = async (medialive, channelId) => {
  const params = {
    ChannelId: channelId
  };

  // Stop channel
  await medialive.stopChannel(params).promise();

  // Keep checking channel status every 30 seconds till it is stopped
  let data = await medialive.describeChannel(params).promise();
  while (data.State !== 'IDLE') {
    await sleepMs(30000);
    data = await medialive.describeChannel(params).promise();
  }

  // Delete channel
  return await medialive.deleteChannel(params).promise();
};

const deleteChannelInputs = async (medialive, inputId) => {
  const params = {
    InputId: inputId
  };

  // Keep checking input status every 30 seconds until it is detached from
  // the channel
  let data = await medialive.describeInput(params).promise();
  while (data.State !== "DETACHED") {
    await sleepMs(10000);
    data = await medialive.describeInput(params).promise();
  }

  // Delete input
  await medialive.deleteInput(params).promise();

  // Wait 1 second
  await sleepMs(1000);

  // Delete SG if it exists
  if (data.SecurityGroups) {
    await medialive.deleteInputSecurityGroup({
      InputSecurityGroupId: data.SecurityGroups[0]
    }).promise();
  }
};

const DeleteChannel = async (inputId) => {
  const medialive = new AWS.MediaLive();
  const channelId = await findChannelId(medialive, inputId);
  if (channelId === null) {
    // there is no channel with this name; jump out
    return;
  }
  const data = await stopAndDeleteChannel(medialive, channelId);
  await deleteChannelInputs(medialive, data.InputAttachments[0].InputId);
};

module.exports = {
  createInput: CreateInput,
  createChannel: CreateChannel,
  startChannel: StartChannel,
  deleteChannel: DeleteChannel
};