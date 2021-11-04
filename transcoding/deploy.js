// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { spawnSync } = require('child_process');
const fs = require("fs");

// Parameters
let region = 'us-east-1';
let imageId = ``;
let bucket = ``;
let stack = ``;
let ecrRepositoryName = ``;
let ecrRepositoryURI = ``;

function usage() {
  console.log(`Usage: deploy.sh [-r region] [-b bucket] [-s stack] [-i docker-image]`);
  console.log(`  -r, --region       Target region, default '${region}'`);
  console.log(`  -b, --s3-bucket    S3 bucket for deployment, required`);
  console.log(`  -s, --stack-name   CloudFormation stack name, required`);
  console.log(`  -n, --repo-name    ECR repository name to be created to upload docker image to, required`);
  console.log(`  -h, --help         Show help and exit`);
}

function ensureBucket() {
  const s3Api = spawnSync('aws', ['s3api', 'head-bucket', '--bucket', `${bucket}`, '--region', `${region}`]);
  if (s3Api.status !== 0) {
    console.log(`Creating S3 bucket ${bucket}`);
    const s3 = spawnSync('aws', ['s3', 'mb', `s3://${bucket}`, '--region', `${region}`]);
    if (s3.status !== 0) {
      console.log(`Failed to create bucket: ${JSON.stringify(s3)}`);
      console.log((s3.stderr || s3.stdout).toString());
      process.exit(s3.status);
    }
  }
}

function ensureECS() {
    const ecrDescribeRepoResult = spawnSync('aws', [
      'ecr',
      'describe-repositories',
      '--repository-names', `${ecrRepositoryName}`,
      '--query', 'repositories[0].repositoryUri',
      '--output', 'text'
    ]);
    if (ecrDescribeRepoResult.status !== 0) {
      console.log(`Creating ECR repository with name: ${ecrRepositoryName}`);
      const ecrCreateRepoResult = spawnSync('aws', [
        'ecr', 
        'create-repository',
        '--repository-name', `${ecrRepositoryName}`
      ]);
  
      if (ecrCreateRepoResult.status !== 0) {
        console.log(`Failed to create ECR repository: ${(ecrCreateRepoResult.stderr || ecrCreateRepoResult.stdout).toString()}`);
        process.exit(ecrCreateRepoResult.status);
      } else {
        const obj = JSON.parse(ecrCreateRepoResult.stdout.toString());
        ecrRepositoryURI = obj.repository.repositoryUri.trim();
        console.log(`The ECR repository is created, reposiroty URI is ${ecrRepositoryURI}`);
      }
    } else {
      console.log(`The repository ${ecrRepositoryName} already exists`);
      ecrRepositoryURI = ecrDescribeRepoResult.stdout.toString().trim();
    }
  }

function ensureEC2ImageId() {
  // Fetching the ECS optimized AMI for AL2
  // More info: https://aws.amazon.com/premiumsupport/knowledge-center/launch-ecs-optimized-ami/
  imageId = spawnSync('aws', ['ssm', 'get-parameters', 
                              '--names', '/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id', 
                              '--region', `${region}`, 
                              '--query', '"Parameters[0].Value"']);
  if(!imageId.length) {
    // Setting image ID optimized for us-east-1
    // Mode info: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html
    imageId = 'ami-00f69adbdc780866c'; 
  }
}

function buildUploadDockerImage() {
  console.log(`Building Docker image and push it into ECR repository: ${ecrRepositoryURI}...`);
  spawnSync('make',
    [`ECR_REPO_URI=${ecrRepositoryURI}`],
    { stdio: [ process.stdin, process.stdout, process.stderr ] }
  );
}

function getArgOrExit(i, args) {
  if (i >= args.length) {
    console.log('Too few arguments');
    usage();
    process.exit(1);
  }
  return args[i];
}

function parseArgs() {
  var args = process.argv.slice(2);
  var i = 0;
  while (i < args.length) {
    switch(args[i]) {
      case '-h': case '--help':
        usage();
        process.exit(0);
        break;
      case '-r': case '--region':
        region = getArgOrExit(++i, args);
        break;
      case '-b': case '--s3-bucket':
        bucket = getArgOrExit(++i, args);
        break;
      case '-s': case '--stack-name':
        stack = getArgOrExit(++i, args);
        break;
      case '-n': case '--repo-name':
        ecrRepositoryName = getArgOrExit(++i, args);
        break;
      default:
        console.log(`Invalid argument ${args[i]}`);
        usage();
        process.exit(1);
    }
    ++i;
  }
  if (!stack.trim() || !bucket.trim() || !ecrRepositoryName.trim()) {
    console.log('Missing required parameters');
    usage();
    process.exit(1);
  }
}

function spawnOrFail(command, args, options) {
  const cmd = spawnSync(command, args, options);
  if (cmd.error) {
    console.log(`Command ${command} failed with ${cmd.error.code}`);
    process.exit(255);
  }
  const output = cmd.stdout.toString();
  console.log(output);

  if (command === 'aws' && args[0] === '--version' && !output.includes('aws-cli/2')) {
    console.log(`Please ensure latest version of aws cli(2.0) is installed.
You can follow the instructions to install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html`);
    process.exit(1);
  }

  if (cmd.status !== 0) {
    console.log(`Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`);
    console.log(cmd.stderr.toString());
    process.exit(cmd.status);
  }
  return output;
}

function ensureTools() {
  spawnOrFail('aws', ['--version']);
  spawnOrFail('sam', ['--version']);
}

parseArgs();
ensureTools();

if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

console.log(`Using region ${region}, bucket ${bucket}, stack ${stack}`);
ensureEC2ImageId();
ensureBucket();
ensureECS();

buildUploadDockerImage();

console.log('Deploying Broadcast API application. The following SAM command is a lengthy action and takes a while to finish.');
spawnOrFail('sam', [
  'deploy',
  '--s3-bucket',
  `${bucket}`,
  '--stack-name',
  `${stack}`,
  '--parameter-overrides',
  `ECRDockerImageArn=${ecrRepositoryURI}:latest`,
  '--capabilities',
  'CAPABILITY_IAM',
  'CAPABILITY_AUTO_EXPAND',
  '--no-fail-on-empty-changeset',
  '--region',
  `${region}`,
]);

console.log("Broadcast Lambda function ARN: ");
spawnOrFail('aws', ['cloudformation', 
                    'describe-stacks',
                    '--stack-name', `${stack}`,
                    '--query', 'Stacks[0].Outputs[0].OutputValue',
                    '--output', 'text',
                    '--region', `${region}`]);