import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AmazonChimeSDKWithLiveConnector } from '../src/amazon-chime-sdk-meeting-with-live-connector';

test('Snapshot', () => {
  const app = new App();
  const amazonChimeSDKWithLiveConnector = new AmazonChimeSDKWithLiveConnector(
    app,
    'AmazonChimeSDKWithLiveConnector',
  );

  const frontEndTemplate = Template.fromStack(amazonChimeSDKWithLiveConnector);
  expect(frontEndTemplate.toJSON()).toMatchSnapshot();
});
