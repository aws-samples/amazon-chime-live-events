# Amazon Chime Live Events

This demo is a small app that will showcase the features of the Chime SDK and show how a live event application can be built. The live event application is different from a regular meeting and it has users with specific roles like:
1. **Attendee** is a regular role for a user that joins the event to watch the stream. The attendee can raise its hand during the event and ask questions.
1. **Moderator** role has admin level priviliges and can manage attendees' raised hands, promote an attendee's video to the live stream, and manage other aspects of the live stream.
1. **Talent** is the role for the primary presenter of the stream.
1. **Broadcast** is an internal role that allows transcoding lambda to join the meeting. This role is not meant to be used by a user.

## Deploying the demo backend
The documentation for deploying this demo is currently stored in `src/backend/serverless/README.md`. Follow the steps in the README [here](./src/backend/serverless) and come back to this doc to run the demo.
## Running the Frontend React App Locally

To run the `react` application demo locally:

1. Navigate to the root of the project
1. Run `npm install`
1. Install the [Allow CORS: Access-Control-Allow-Origin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf/related?hl=en) in your browser and enable it by clicking the large 'C' with three dots that appears in the left side of the widget's popup.

   ![Modes](https://lh3.googleusercontent.com/rnAMOT3vUYMpZZt-5N8An3sC4PBCN-_ZdUdq27R1oNpHrKNbrmmJZDCRxl-5YQLm6wVZRIrdhA=w200)
1. You can start individual apps by running the following base urls along with the required parameters:

| Role      | Command                   | Local Base URL                       | Required URL Parameters     |
| --------- | ------------------------- | ------------------------------------ | --------------------------- |
| Attendee  | `npm run start:attendee`  | http://localhost:9002/attendee.html  | aId, eId, name              |
| Moderator | `npm run start:moderator` | http://localhost:9001/moderator.html | aId, eId, name, access key  |
| Talent    | `npm run start:talent`    | http://localhost:9000/talent.html    | aId, eId, name, access key  |
| Broadcast | `npm run start:broadcast` | http://localhost:9003/broadcast.html | aId, eId, name, access key  |

#### URL Parameters

For the above base urls, you will need to pass in parameters. If you have the backend setup then you should have these parameters available in the S3 bucket. 
> Please see [creating live event resources](#creating-live-event-resources) to generate users data for each application. You might be able to view the UI without running the backend but functionality will be quite limited.

Example of generated Moderator model
```json
  {
    "full_name": "John Doe",
    "phone": "0411-732-965",
    "email": "john_doe@email.com",
    "eventId": "LiveEventSample-ke40",
    "attendeeId": "d59f0394-9b56-48e9-9954-b2309a617220",
    "access_url": "http://localhost:9001/moderator.html?aId=d59f0394-9b56-48e9-9954-b2309a617220&eId=LiveEventSample-ke40&name=John%20Doe",
    "access_key": "jHkbdH2TJIlGfrzcWUYtUE3J"
  }
```

All of the apps take the following URL parameters: attendeeId (`aId`), liveEventId (`eId`), and name (`name`).
The moderator and talent app also need an `Access Key` which you must provide from their respective generated models. e.g. `"access_key": "jHkbdH2TJIlGfrzcWUYtUE3J"`
For example, `?aId=d59f0394-9b56-48e9-9954-b2309a617220&eId=LiveEventSample-ke40&name=John%20Doe` by opening this the page will prefill the authentication form based on URL params.

Additional URL params are available for the moderator app and the talent app.
`straightToMeeting=true` allows moderators and talent to skip the dressing room and load straight into the meeting if they are already authorized.
`hideQueue=true` hides the queue UI in the moderator view.
`hideRoster=true` hides the roster in the moderator view.
`minimalRoster=true` removes live controls from the moderator Roster.
`singleFeed=true` does not split the feed into live vs holding videos, provides more focus on the content.
## Running Backend Infrastructure
### Creating live event resources

After creating/updating the CloudFormation stack that can be found in `src/backend/serverless` retrieve from the output the following fields:
`GenerateEventFunction` and `CustomerImportS3Bucket`

e.g.:

```
Key                 GenerateEventFunction
Description         The generate event lambda function that takes as input data from the
CustomerImportS3Bucket and creates an event
Value               <Your specific value>

Key                 CustomerImportS3Bucket
Description         The S3 bucket where the moderators, attendees and talent data must be
specified
Value               <Your specific value>
```

The `GenerateEventFunction` value retrieved from the output can be used to generate the live event resources. Talent/Attendees/Moderator URLs and corresponding access keys are the resources that you will need for your event.
You can generate these resources by triggering a **test** event on the lambda. 

#### User information files upload

Before you run the **test** event, you need to pass in the user information for attendees, moderators and talent. The lambda will reference this information to generate the live event resources.
- The user information files must be created and added in the `CustomerImportS3Bucket`. You can retrieve the S3 bucket name from the output of the CloudFormation stack. Example: `live-event-deployment-stack-customer-import`.
- Currently, the lambda expects 3 CSV files in the S3 bucket, that need to contain at minimum a field called `full_name`.
- Required input files:
  1. Attendees.csv
  1. Moderators.csv
  1. Talents.csv

Example of a Attendees.csv content:

```
full_name
Adam Smith
Alexander Hamilton
Marie Curie
```

#### Run the generate event resources lambda

In order to run the `GenerateEventFunction` lambda, just use the **TEST** event from the AWS console. It will trigger the lambda to generate the event resources.
Currently, the lambda supports only 1 talent and broadcaster.

`GenerateEventFunction` payload:
```json
{
  "attendeesKey": "Attendees.csv",
  "moderatorsKey": "Moderators.csv",
  "talentsKey": "Talents.csv"
}
```

- The lambda also accepts a few environment variables for customizations like:
- `EVENT_PREFIX` -> the event name prefix. Events will be generated of the form (EVENT_PREFIX-<4 digit code>)
- `USE_STRICT_ACCESS_KEYS` -> if set to `false` it generates the same access code for all moderators, otherwise it generates 1 code per moderator
- `DOMAIN_PREFIX` -> the domain where the application will be hosted.

Following screenshot shows the **TEST** event UI used to generate the resources. (It can be hard to know what is meant by the test event)
![generateLiveEventLambdaTrigger](https://github.com/aws-samples/amazon-chime-live-events/blob/master/resources/generate_live_event_lambda_trigger.png)
#### Generated live event resources

Once you run the lambda test event, you should see a successful response code. You will not find the event resources in the response body though. To access the event resources generated from the last step, you need to access the `CustomerImportS3Bucket` S3 bucket. Link to the S3 bucket can be found in the CloudFormation outputs.
- In the S3 bucket, 4 JSON files will be produced at the end:
- <EVENT_ID>-event_moderators.json
- <EVENT_ID>-event_attendees.json
- <EVENT_ID>-event_talents.json
- <EVENT_ID>-event_broadcast.json

These files contain all the details required to pass the login screen, and make sure your requests are authenticated.

Sample talent JSON file is added below for reference. Your JSON will look similar. In this sample, Michael Jackson is used as the talent for the event. Michael Jackson can use the following access url to join the event.
```json
{
  "full_name":"Michael Jackson",
  "eventId":"LiveEvent-dOtH",
  "attendeeId":"165cre2a-a5e2-495b-88fd-d4fasd784f8a5",
  "access_url":"https://43fsd5p0rt1j7.cloudfront.net/talent?aId=165cre2a-a5e2-495b-88fd-d4fasd784f8a5&eId=LiveEvent-dOtH&name=Michael%20Jackson",
  "access_key":"X83cF2otcRTGHJeD5Gkr3UkX"}
```

### Start and Stop the Transcoding Lambda Broadcasting
After the live event resources are generated, you need to start transcoding. To start or stop the transcoding task in ECS, you need to run a test event on the transcoding lambda that was created when you deployed the serverless demo. There should be a CloudFormation stack created that ends with the suffix `-broadcast` - the name of the Transcoding Lambda should be specified in this CloudFormation stack outputs.

#### Using Lambda Test Event (AWS Console UI)
1. You can **START** the broadcast task by creating a test event with the input below, then click **Test** button: 
```
{
  "action": "start",
  "meetingURL": "<your-meeting-url-to-be-broadcast>",
  "rtmpEndpoint": "<your-rtmp-endpoint-url>"
}
```

The broadcast URL that you provide to this start event must include all of the required parameters. The cloudformation stack output includes only the base url and passing that will cause errors in the ECS task. To find the full url please reference the `CustomerImportS3Bucket` file <EVENT_ID>-event_broadcast.json. Example broadcast url: `https://d3vj7dfsp0rt1j7.cloudfront.net/broadcast?aId=34e5fdc6-90963-4768-b389-2878i3fff3e&eId=LiveEvent-fPfdstG&accessKey=5KQIcQ5234fsdyk4CrbPl2pnVX&name=%E2%80%B9Broadcaster%E2%80%BA`. 

The RTMP endpoint can be found in the cloudformation stack outputs under `MediaLivePrimaryEndpoint`. The url will look something like this `rtmp://34.187.107.987:1935/live-event-deployment-stack-livestream/primary`.

> Important: Note down the ECS task ARN. It is the response of the start event and it will be needed to stop the task.
2. You can **STOP** the broadcast task by creating another test event with the input below, then click **Test** button:
```
{
  "action": "stop",
  "taskId": "<your-ecs-task-arn>"
}
```

#### Using AWS CLI
1. Use AWS client to invoke lambda to **START** transcoding.
  ```
  aws lambda invoke --function-name broadcast-lambda --payload '{"action":"start","meetingURL":"<your-meeting-url-to-be-broadcast>","rtmpEndpoint":"<your-rtmp-endpoint-url>"}' --cli-binary-format raw-in-base64-out output.json
  ```

2. Use AWS client to invoke lambda to **STOP** transcoding.
  ```  
  aws lambda invoke --function-name broadcast-lambda --payload '{"action":"stop", "taskId": "<your-ecs-task-arn>"}' --cli-binary-format raw-in-base64-out output.json
  ```

## Accessing the application
After the backend is deployed along with event resources and transcoding has started you can now join the event using the access url from the JSON files in the `CustomerImportS3Bucket`. For some of the roles you will need an access key.
## Re-deploying new stack versions

If you are re-deploying to bring in new updates from the repo, you may need invalidate your CloudFront cache to ensure the latest web assets are being served, particularly if you are using a custom domain.

[Follow these steps](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#invalidating-objects-console) to invalidate the CloudFront cache.

## Development

If you are developing on the LiveEvents app, adjust `defaultURLs` within `/utils/configuredURLs.ts` with the output URLs from running the backend deployment.

## Browser Compatibility

Currently, the live events demo is optimized for desktop browsers. We do not support mobile browsers at this time.