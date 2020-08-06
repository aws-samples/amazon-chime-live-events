## Live Event Broadcast Serverless Application - Use Lambda function to Start/Stop Broadcast Task in ECS

This contains resources for building an application that broadcast media from any URL of meeting sessions to a RTMP endpiont URL. Included is a Docker image and a serverless AWS CloudFormation template that you can deploy to your AWS account. The AWS CloudFormation template orchestrates resources (including Amazon Lambda and Amazon ECS) that run the broadcast application. When deployed, you can create Lambda test events to start/stop broadcast task in ECS.

## Prerequisite
* [An AWS account](https://signin.aws.amazon.com/signin?redirect_uri=https%3A%2F%2Fportal.aws.amazon.com%2Fbilling%2Fsignup%2Fresume&client_id=signup)
* [Latest version of AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-mac.html)

## How to Run
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
    
   #### Options to start/stop transcoding
   1. You can **START** a broadcast by creating a test event with the input below, then click **Test** button: 
    ```
    {
      "action": "start",
      "meetingURL": "<your-meeting-url-to-be-broadcast>",
      "rtmpEndpoint": "<your-rtmp-endpoint-url>"
    }
    ```
    The output of the above command is an ECS task ID, it will be used to **STOP** the broadcast. To stop the broadcast, create another test event with the input below, then click **Test** button:
    ```
    {
      "action": "stop",
      "taskId": "<your-ecs-task-id-or-arn>"
    }
    ```
    2.  Use AWS client to invoke lambda to start and stop transcoding. 
      ```
      // Start
      aws lambda invoke --function-name broadcast-lambda --payload '{"action":"start","meetingURL":"<your-meeting-url-to-be-broadcast>","rtmpEndpoint":"<your-rtmp-endpoint-url>"}' --cli-binary-format raw-in-base64-out output.json

      // Stop  
      aws lambda invoke --function-name broadcast-lambda --payload '{"action":"stop", "taskId": "<your-ecs-task-id-or-arn>"}' --cli-binary-format raw-in-base64-out output.json
      ```

## What's in Behind
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
![architecture](https://github.com/aws-samples/amazon-chime-live-events/blob/master/resources/architecture_diagram.png)