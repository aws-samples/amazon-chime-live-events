import { randomUUID } from 'crypto';
import {
  ChimeSDKMediaPipelinesClient,
  CreateMediaLiveConnectorPipelineCommand,
  CreateMediaLiveConnectorPipelineCommandInput,
  CreateMediaLiveConnectorPipelineCommandOutput,
  DeleteMediaPipelineCommand,
} from '@aws-sdk/client-chime-sdk-media-pipelines';
import {
  ChimeSDKMeetingsClient,
  CreateAttendeeCommand,
  CreateMeetingCommand,
  CreateMeetingCommandInput,
  DeleteMeetingCommand,
  DeleteMeetingCommandOutput,
  Meeting,
  Attendee,
  CreateAttendeeCommandInput,
} from '@aws-sdk/client-chime-sdk-meetings';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  IvsClient,
  CreateChannelCommand,
  GetStreamCommand,
  CreateChannelCommandOutput,
  GetStreamCommandOutput,
} from '@aws-sdk/client-ivs';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: false,
};
const unmarshallOptions = {
  wrapNumbers: false,
};
const translateConfig = { marshallOptions, unmarshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
const ivsClient = new IvsClient({ region: 'us-east-1' });
const chimeSdkMediaPipelineclient = new ChimeSDKMediaPipelinesClient({
  region: 'us-east-1',
});
const chimeSdkMeetings = new ChimeSDKMeetingsClient({
  region: 'us-east-1',
});

var meetingInfoTable = process.env.MEETINGS_TABLE;
var awsAccountId = process.env.AWS_ACCOUNT_ID;

var createMeetingCommandInput: CreateMeetingCommandInput = {
  ClientRequestToken: '',
  ExternalMeetingId: '',
  MediaRegion: 'us-east-1',
};

var createAttendeeCommandInput: CreateAttendeeCommandInput = {
  MeetingId: '',
  ExternalUserId: '',
};

interface JoinInfo {
  Meeting: Meeting;
  Attendee: Array<Attendee>;
}

var createMediaLiveConnectorPipelineCommandInput: CreateMediaLiveConnectorPipelineCommandInput =
  {
    Sources: [
      {
        SourceType: 'ChimeSdkMeeting',
        ChimeSdkMeetingLiveConnectorConfiguration: {
          Arn: '',
          MuxType: 'AudioWithCompositedVideo',
          CompositedVideo: {
            Layout: 'GridView',
            Resolution: 'FHD',
            GridViewConfiguration: {
              ContentShareLayout: 'Horizontal',
            },
          },
        },
      },
    ],
    Sinks: [
      {
        SinkType: 'RTMP',
        RTMPConfiguration: {
          Url: '',
          AudioChannels: 'Stereo',
          AudioSampleRate: '48000',
        },
      },
    ],
  };

var response: APIGatewayProxyResult = {
  statusCode: 200,
  body: '',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  },
};

export const lambdaHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.info(event);

  switch (event.path) {
    case '/join':
      console.log('Joining Meeting');
      return meetingRequest();
    case '/end':
      console.log('Ending Meeting');
      return endRequest(event);
    case '/stream':
      console.log('Streaming');
      return streamRequest(event);
    default:
      return response;
  }
};

async function endRequest(event: APIGatewayEvent) {
  if (event.body) {
    const body = JSON.parse(event.body);
    console.log(`Deleting Meeting ${body.meetingId}`);
    const deleteMeetingResponse: DeleteMeetingCommandOutput =
      await chimeSdkMeetings.send(
        new DeleteMeetingCommand({ MeetingId: body.meetingId }),
      );
    console.log(
      `DeleteMeetingResponse: ${JSON.stringify(deleteMeetingResponse)}`,
    );
    const deleteCommandParams: DeleteCommandInput = {
      TableName: meetingInfoTable,
      Key: { meetingId: body.meetingId },
    };
    console.log(`Deleting Meeting from DynamoDB ${deleteCommandParams}`);
    const deleteItemResponse: DeleteCommandOutput = await ddbDocClient.send(
      new DeleteCommand(deleteCommandParams),
    );
    console.log(JSON.stringify(`DeleteItemResponse: ${deleteItemResponse}`));

    response.body = JSON.stringify('Meeting Deleted');
    response.statusCode = 200;
    return response;
  } else {
    response.body = JSON.stringify('Meeting not found');
    response.statusCode = 404;
    return response;
  }
}

async function streamRequest(event: APIGatewayEvent) {
  if (event.body) {
    let meetingId: string = JSON.parse(event.body).meetingId || '';
    let streamAction: string = JSON.parse(event.body).streamAction || '';
    let mediaPipelineId: string = JSON.parse(event.body).mediaPipelineId || '';
    console.log(`streamAction: ${streamAction}`);
    console.log(`mediaPipelineId: ${mediaPipelineId}`);
    console.log(`meetingId: ${meetingId}`);
    if (streamAction == 'delete') {
      console.log('Deleting Stream');
      return deleteStream(mediaPipelineId);
    } else {
      console.log(`Creating Stream for Meeting ${meetingId}`);
      return createStream(meetingId);
    }
  }
  response.statusCode = 503;
  return response;
}

async function createStream(meetingId: string) {
  const createChannelResponse: CreateChannelCommandOutput =
    await ivsClient.send(new CreateChannelCommand({ latencyMode: 'NORMAL' }));
  console.log(
    `createChannelResponse: ${JSON.stringify(createChannelResponse)}`,
  );
  if (
    createChannelResponse &&
    createChannelResponse.channel &&
    createChannelResponse.streamKey
  ) {
    createMediaLiveConnectorPipelineCommandInput!.Sources![0]!.ChimeSdkMeetingLiveConnectorConfiguration!.Arn = `arn:aws:chime::${awsAccountId}:meeting:${meetingId}`;
    createMediaLiveConnectorPipelineCommandInput!.Sinks![0]!.RTMPConfiguration!.Url = `rtmps://${createChannelResponse.channel.ingestEndpoint}:443/app/${createChannelResponse.streamKey.value}`;

    console.log(
      `CreateMediaCapturePipelineCommandInput: ${JSON.stringify(
        createMediaLiveConnectorPipelineCommandInput,
      )}`,
    );

    const createPipelineResponse: CreateMediaLiveConnectorPipelineCommandOutput =
      await chimeSdkMediaPipelineclient.send(
        new CreateMediaLiveConnectorPipelineCommand(
          createMediaLiveConnectorPipelineCommandInput,
        ),
      );
    console.log(
      `CreatePipelineResponse: ${JSON.stringify(createPipelineResponse)}`,
    );
    if (
      createPipelineResponse &&
      createPipelineResponse.MediaLiveConnectorPipeline
    ) {
      const getStreamResponse: GetStreamCommandOutput | null =
        await checkForStream(createChannelResponse);
      console.log(`getStreamResponse: ${JSON.stringify(getStreamResponse)}`);
      if (getStreamResponse && getStreamResponse.stream) {
        response.body = JSON.stringify({
          mediaPipelineId:
            createPipelineResponse.MediaLiveConnectorPipeline.MediaPipelineId,
          playbackUrl: getStreamResponse.stream.playbackUrl,
        });

        response.statusCode = 200;
        console.info('streamInfo: ' + JSON.stringify(response));
        return response;
      }
    }
  }
  response.statusCode = 503;
  return response;
}

async function deleteStream(mediaPipelineId: string) {
  try {
    const deletePipelineResponse = await chimeSdkMediaPipelineclient.send(
      new DeleteMediaPipelineCommand({
        MediaPipelineId: mediaPipelineId,
      }),
    );
    console.log(
      `DeletePipelineResponse: ${JSON.stringify(deletePipelineResponse)}`,
    );

    response.statusCode = 200;
    return response;
  } catch (err) {
    response.statusCode = 503;
    return response;
  }
}

async function meetingRequest() {
  const currentMeetings = await checkForMeetings();
  if (currentMeetings) {
    for (let meeting of currentMeetings) {
      if (meeting.joinInfo.Attendee.length < 2) {
        console.log(
          `Adding an attendee to an existing meeting: ${meeting.meetingId}`,
        );
        const attendeeInfo = await createAttendee(meeting.meetingId);
        console.log(`attendeeInfo: ${JSON.stringify(attendeeInfo)}`);
        meeting.joinInfo.Attendee.push(attendeeInfo.Attendee);
        await putMeetingInfo(meeting.joinInfo);

        const responseInfo = {
          Meeting: meeting.joinInfo.Meeting,
          Attendee: attendeeInfo.Attendee,
        };

        response.statusCode = 200;
        response.body = JSON.stringify(responseInfo);
        console.info('joinInfo: ' + JSON.stringify(response));
        return response;
      }
    }
  }

  const meetingInfo = await createMeeting();
  if (meetingInfo && meetingInfo.Meeting && meetingInfo.Meeting.MeetingId) {
    const attendeeInfo = await createAttendee(meetingInfo.Meeting.MeetingId);
    if (attendeeInfo && attendeeInfo.Attendee) {
      const joinInfo: JoinInfo = {
        Meeting: meetingInfo.Meeting,
        Attendee: [attendeeInfo.Attendee],
      };
      await putMeetingInfo(joinInfo);

      const responseInfo = {
        Meeting: meetingInfo.Meeting,
        Attendee: attendeeInfo.Attendee,
      };

      response.statusCode = 200;
      response.body = JSON.stringify(responseInfo);
      console.info('joinInfo: ' + JSON.stringify(response));
      return response;
    }
  }
  response.statusCode = 503;
  return response;
}

async function checkForStream(
  createChannelResponse: CreateChannelCommandOutput,
) {
  console.log('Checking for Stream');
  console.log(
    `createChannelResponse: ${JSON.stringify(createChannelResponse)}`,
  );
  if (createChannelResponse.channel && createChannelResponse.channel.arn) {
    for (var m = 0; m < 5; m++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        var getStreamResponse = await ivsClient.send(
          new GetStreamCommand({
            channelArn: createChannelResponse.channel.arn,
          }),
        );
        console.log(`getStreamResponse: ${JSON.stringify(getStreamResponse)}`);
        console.log(`Loop:  ${m}`);

        if (getStreamResponse) {
          return getStreamResponse;
        }
      } catch (err) {
        console.log('No Stream');
        console.log(`Loop:  ${m}`);
        console.log(`Error: ${err}`);
        continue;
      }
    }
    return null;
  }
  return null;
}

async function createMeeting() {
  console.log('Creating Meeting');
  createMeetingCommandInput.ClientRequestToken = randomUUID();
  createMeetingCommandInput.ExternalMeetingId = randomUUID();
  const meetingInfo = await chimeSdkMeetings.send(
    new CreateMeetingCommand(createMeetingCommandInput),
  );
  console.info(`Meeting Info: ${JSON.stringify(meetingInfo)}`);
  return meetingInfo;
}

async function createAttendee(meetingId: string) {
  console.log(`Creating Attendee for Meeting: ${meetingId}`);
  createAttendeeCommandInput.MeetingId = meetingId;
  createAttendeeCommandInput.ExternalUserId = randomUUID();
  const attendeeInfo = await chimeSdkMeetings.send(
    new CreateAttendeeCommand(createAttendeeCommandInput),
  );
  return attendeeInfo;
}
async function putMeetingInfo(joinInfo: JoinInfo) {
  var timeToLive = new Date();
  timeToLive.setMinutes(timeToLive.getMinutes() + 5);
  const putMeetingInfoInput = {
    TableName: meetingInfoTable,
    Item: {
      meetingId: joinInfo.Meeting.MeetingId,
      joinInfo,
      timeToLive: timeToLive.getTime() / 1e3,
    },
  };
  console.log(`info to put: ${JSON.stringify(putMeetingInfoInput)}`);
  try {
    const data = await ddbDocClient.send(new PutCommand(putMeetingInfoInput));
    console.log('Success - item added or updated', data);
    return data;
  } catch (err) {
    console.log('Error', err);
    return false;
  }
}
async function checkForMeetings() {
  const scanMeetingInfo = {
    TableName: meetingInfoTable,
    FilterExpression: 'timeToLive >= :currentEpoch',
    ExpressionAttributeValues: {
      ':currentEpoch': Date.now() / 1e3,
    },
  };
  try {
    const data = await ddbDocClient.send(new ScanCommand(scanMeetingInfo));
    console.log(data);
    return data.Items;
  } catch (err) {
    console.log('Error', err);
    return false;
  }
}
