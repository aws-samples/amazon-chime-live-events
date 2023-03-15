import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { CfnServiceLinkedRole } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Site, Infrastructure } from './index';

export class AmazonChimeSDKWithLiveConnector extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new CfnServiceLinkedRole(this, 'mediaPipelinesSLR', {
      awsServiceName: 'mediapipelines.chime.amazonaws.com',
    });

    const infrastructure = new Infrastructure(this, 'infrastructure');

    const site = new Site(this, 'Site', { apiUrl: infrastructure.apiUrl });

    new CfnOutput(this, 'distribution', {
      value: site.distribution.domainName,
    });

    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
  }
}
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new AmazonChimeSDKWithLiveConnector(app, 'AmazonChimeSDKWithLiveConnector', {
  env: devEnv,
});

app.synth();
