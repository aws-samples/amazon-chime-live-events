### About

This demo is a small app that will showcase the features of the Chime SDK as well as provide a starting point for developers that wish to integrate a React application with the SDK.

### Running the demo

To run the `react` application demo locally:

1. Navigate to the root of the project
1. Run `npm install`
1. Install the [Allow CORS: Access-Control-Allow-Origin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf/related?hl=en) in your browser and enable it by clicking the large 'C' with three dots that appears in the left side of the widget's popup.
   ![Modes](https://lh3.googleusercontent.com/rnAMOT3vUYMpZZt-5N8An3sC4PBCN-_ZdUdq27R1oNpHrKNbrmmJZDCRxl-5YQLm6wVZRIrdhA=w200)
1. You can start individual apps by running:

**Attendee**

`npm run start:attendee`

Access at http://localhost:9002/attendee.html

**Moderator**

`npm run start:moderator`

Access at http://localhost:9001/moderator.html

**Talent**

`npm run start:talent`

http://localhost:9000/talent.html

**Broadcast**

`npm run start:broadcast`

http://localhost:9003/broadcast.html

### URL Parameters

> Please see [Creating live event resources](#creating-live-event-resources) to generate users data for each application.

```
// Example of generated Moderator model
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

All of the apps take the following URL parameters for setting attendeeId (`aId`), liveEvenId (`eId`), and name (`name`).

e.g. `?aId=d59f0394-9b56-48e9-9954-b2309a617220&eId=LiveEventSample-ke40&name=John%20Doe` by opening this the page will prefill the authentication form based on URL params.

Additional URL params are available for the moderator app and the talent app.
`straightToMeeting=true` allows moderators and talent to skip the dressing room and load straight into the meeting if they are already authorized.
`hideQueue=true` hides the queue UI in the moderator view.
`hideRoster=true` hides the roster in the moderator view.
`minimalRoster=true` removes live controls from the moderator Roster.
`singleFeed=true` does not split the feed into live vs holding videos, provides more focus on the content.

The moderator and talent app also need an `Access Key` which you must provide from their respective generated models. e.g. `"access_key": "jHkbdH2TJIlGfrzcWUYtUE3J"`

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

The `GenerateEventFunction` value retrieved from the output can be used to generate the live event and populate the Talent/Attendees/Moderator URLs and
corresponding access keys.

#### Input

- The files below must be created and added in the `CustomerImportS3Bucket` retrieved from the CloudFormation stack output. It can be found in the value field.
- Currently it expects 3 CSV files in the S3 Bucket created by this stack, that need to contain at minimum a field called
  `full_name` (e.g. Attendees.csv, Moderators.csv, Talents.csv)

Example of such a minimum file content:

```
full_name
Adam Smith
Alexander Hamilton
Marie Curie
```

- This input needs to be specified in a test event for the lambda on the structure of.
- Currently this script supports only 1 talent and broadcaster, but with little changes we can support multiple.

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

#### Run

- In order to run, just use the TEST method in lambda, with the test event created above.

#### Output

- In the S3 bucket defined as input, 4 JSON files will be produced at the end:
- <EVENT_ID>-event_moderators.json
- <EVENT_ID>-event_attendees.json
- <EVENT_ID>-event_talents.json
- <EVENT_ID>-event_broadcast.json

These files contain all the details required to pass the login screen, and make sure your requests are authenticated.

### Deploying the full stack

See the README in the `backend/serverless directory` for how to deploy a full serverless stack for this product.

### Re-deploying new stack versions

If you are re-deploying to bring in new updates from the repo, you may need invalidate your CloudFront cache to ensure the latest web assets are being served, particularly if you are using a custom domain.

[Follow these steps](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#invalidating-objects-console) to invalidate the CloudFront cache.

### Development

If you are developing on the LiveEvents app, adjust `defaultURLs` within `/utils/configuredURLs.ts` with the output URLs from running the backend deployment.