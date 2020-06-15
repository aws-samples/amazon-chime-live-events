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
const url = require('url');

const CreateEndPoint = async (config) => {
  const mediapackage = new AWS.MediaPackage();

  // Define specific configuration settings for each endpoint type (HLS/DASH/MSS/CMAF)
  const packages = {
    HlsPackage: {
      IncludeIframeOnlyStream: false,
      PlaylistType: 'NONE',
      PlaylistWindowSeconds: 60,
      ProgramDateTimeIntervalSeconds: 0,
      SegmentDurationSeconds: 6,
      UseAudioRenditionGroup: false,
      AdMarkers: 'PASSTHROUGH'
    },
    DashPackage: {
      ManifestWindowSeconds: 60,
      MinBufferTimeSeconds: 30,
      MinUpdatePeriodSeconds: 15,
      Profile: 'NONE',
      SegmentDurationSeconds: 2,
      SuggestedPresentationDelaySeconds: 25
    },
    MssPackage: {
      ManifestWindowSeconds: 60,
      SegmentDurationSeconds: 2
    },
    CmafPackage: {
      SegmentDurationSeconds: 6,
      HlsManifests: [{
        Id: config.ChannelId + '-cmaf-hls',
        AdMarkers: 'PASSTHROUGH',
        IncludeIframeOnlyStream: false,
        PlaylistType: 'NONE',
        PlaylistWindowSeconds: 60,
        ProgramDateTimeIntervalSeconds: 0
      }]
    }
  };
  let params = {
    ChannelId: config.ChannelId,
    Description: 'MediaPackage ' + config.EndPoint + ' Endpoint',
    ManifestName: 'index',
    StartoverWindowSeconds: 0,
    TimeDelaySeconds: 0,
  };
  // Add configuration based on the endpoint type defined in config
  switch (config.EndPoint) {
    case 'HLS':
      params.Id = config.ChannelId + '-hls';
      params.HlsPackage = packages.HlsPackage;
      break;
    case 'DASH':
      params.Id = config.ChannelId + '-dash';
      params.DashPackage = packages.DashPackage;
      break;
    case 'MSS':
      params.Id = config.ChannelId + '-mss';
      params.MssPackage = packages.MssPackage;
      break;
    case 'CMAF':
      params.Id = config.ChannelId + '-cmaf';
      params.CmafPackage = packages.CmafPackage;
      break;
    default:
      console.log('Error EndPoint not defined');
  }
  // Create Endpoint & return detials
  const data = await mediapackage.createOriginEndpoint(params).promise();

  let Url;
  if (config.EndPoint === 'CMAF') {
    Url = url.parse(data.CmafPackage.HlsManifests[0].Url);
  } else {
    Url = url.parse(data.Url);
  }

  return {
    Id: data.Id,
    DomainName: Url.hostname,
    Path: '/' + Url.pathname.split('/')[3],
    Manifest: Url.pathname.slice(7)
  };
};

const CreateChannel = async (config) => {
  const mediapackage = new AWS.MediaPackage();
  const ssm = new AWS.SSM();

  // Create the Channel.
  const data = await mediapackage.createChannel({
    Id: config.ChannelId
  }).promise();

  // Adding User/Password to SSM parameter store.
  await ssm.putParameter({
    Name: data.HlsIngest.IngestEndpoints[0].Username,
    Value: data.HlsIngest.IngestEndpoints[0].Password,
    Type: 'String',
    Description: 'MediaPackage Primary Ingest Credentials'
  }).promise();
  await ssm.putParameter({
    Name: data.HlsIngest.IngestEndpoints[1].Username,
    Value: data.HlsIngest.IngestEndpoints[1].Password,
    Type: 'String',
    Description: 'MediaPackage Secondary Ingest Credentials'
  }).promise();

  return {
    Arn: data.Arn,
    ChannelId: config.ChannelId,
    PrimaryUrl: data.HlsIngest.IngestEndpoints[0].Url,
    PrimaryUser: data.HlsIngest.IngestEndpoints[0].Username,
    PrimaryPassParam: data.HlsIngest.IngestEndpoints[0].Username,
    SecondaryUrl: data.HlsIngest.IngestEndpoints[1].Url,
    SecondaryUser: data.HlsIngest.IngestEndpoints[1].Username,
    SecondaryPassParam: data.HlsIngest.IngestEndpoints[1].Username
  };
};

const DeleteChannel = async (ChannelId) => {
  const mediapackage = new AWS.MediaPackage();

  // Get a list of the endpoint Ids and delete each, waiting for each deletion to complete.
  const data = await mediapackage.listOriginEndpoints({
    ChannelId: ChannelId
  }).promise();
  await Promise.all(data.OriginEndpoints.map(async (endpoint) => {
    await mediapackage.deleteOriginEndpoint({
      Id: endpoint.Id
    }).promise();
  }));

  // Delete the Channel
  await mediapackage.deleteChannel({
    Id: ChannelId
  }).promise();

  return 'success';
};

module.exports = {
  createEndPoint: CreateEndPoint,
  createChannel: CreateChannel,
  deleteChannel: DeleteChannel
};