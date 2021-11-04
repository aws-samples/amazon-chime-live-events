# Live Event Transcoding Serverless Application

The transcoding serverless application is used for broadcasting the live event stream to the attendees. It records the meeting based on the meeting url provided to it when you start the transcoding lambda, and streams that recording to the specified RTMP endpoint URL. 

The application has a deploy script that will create a separate Docker image and CloudFormation stack suffixed with `-broadcast` that contains all of the resources to run the Transcoder Serverless Application. When deployed, you can trigger a transcoding lambda test event to start/stop the broadcast task in ECS.

> Note: If you ran the backend deploy.js script already then transcoding deploy script is run automatically and you should be able to find the cloudformation stack in your AWS account.
## Using Lambda function to Start/Stop Broadcast Task in ECS

This contains resources for building an application that broadcast media from any URL of meeting sessions to a RTMP endpiont URL. Included is a Docker image and a serverless AWS CloudFormation template that you can deploy to your AWS account. The AWS CloudFormation template orchestrates resources (including Amazon Lambda and Amazon ECS) that run the broadcast application. When deployed, you can create Lambda test events to start/stop broadcast task in ECS.

## Prerequisite
* [An AWS account](https://signin.aws.amazon.com/signin?redirect_uri=https%3A%2F%2Fportal.aws.amazon.com%2Fbilling%2Fsignup%2Fresume&client_id=signup)
* [Latest version of AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-mac.html)

## Deploying the transcoding stack
1. Clone this code repository.
2. Simply run:
    ```
    node ./deploy.js -b <my-bucket> -s <my-stack> -n <ecr-repo-name> -r <region>
    ```
   
    Here is an example:
    ```
    node ./deploy.js -b broadcast-lambda-cf-deploy-bucket -s broadcast-lambda-cf-stack -n broadcast-lambda -r us-east-1
    ```

3. Once the deployment completes, it shows the ARN of Lambda function created. Go to AWS console and find the function.
 The arn of the broadcast lambda function will look something like this: `arn:aws:lambda:us-east-1:000087643245:function:broadcast-lambda-cf-stack-lambda`. This function will be used in the next section to start/stop the ECS task.
    
## Running the transcoding task in ECS
Please refer to the [running transcoding for broadcast](../README.md/#running-transcoding-for-broadcast) section in the main README.

## What will running deploy.js do?
This section dives into the implementation of the deploy script. Following are the several resources created by the script.
* Create an Amazon Elastic Container Registry (ECR) repository
  * `aws ecr create-repository --repository-name <repository-name>`
* Build a Docker image and upload to the ECR repository
  * `make ECR_REPO_URI=<repositoryUri>`
  * The make file runs ECS authentication, docker build, tag and push
  * **Note:** If this command fails due to AWS CLI version 2.0 not available, you can follow the instructions given here: [Installing the AWS CLI version 2 on Linux](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html) and try again.
* Deploy the Cloudformation Template
  * Create an AWS CloudFormation stack, which contains Amazon Lambda, Amazon ECS cluster, Amazon ECS task definition along with IAM roles and networking resources required for the Amazon ECS Cluster including an Amazon VPC, subnets and security group.

## Clean Up
To avoid incurring future charges, please delete the CloudFormation stack in your account.

## Broadcast/Recording General Architecture
![architecture](https://github.com/aws-samples/amazon-chime-live-events/blob/master/resources/transcoding_architecture_diagram.png)