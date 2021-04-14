const {
  spawnSync
} = require('child_process');
const fs = require("fs");
const path = require("path");

// Deploy parameters
let region = 'us-east-1';
let bucket = ``;
let stack = ``;

// Stack parameters
const stackParams = {
  UseEventBridge: false,
  EventPrefix: 'LiveEvent',
  TalentFullName: 'John Smith',
  UseStrictAccessKeys: true,
  ChannelStart: false,
};

function usage() {
  console.log(`Usage: deploy.sh [opts]`);
  console.log(`  -r, --region                 Target region, default '${region}'`);
  console.log(`  -b, --s3-bucket              S3 bucket for deployment, required`);
  console.log(`  -s, --stack-name             CloudFormation stack name, required`);
  console.log(`  -p, --event-prefix           Event prefix, default '${stackParams.EventPrefix}'`);
  console.log(`  -t, --talent-name            Talent full name, default '${stackParams.TalentFullName}'`);
  console.log(`  -d, --domain-name            Site domain name, default empty`);
  console.log(`  -c, --acm-cert-arn           ACM Certificate Arn , default empty`);
  console.log(`  -e, --event-bridge           Enable EventBridge integration, default is no integration`);
  console.log(`  -n, --non-strict-access-keys Use non strict access keys, default is strict`);
  console.log(`  -C, --input-codec            Codec for broadcast media input (AVC, HEVC, MPEG2; default is AVC)`);
  console.log(`  -R, --input-resolution       Resolution of broadcast media input (1080, 720, 540; default is 1080)`);
  console.log(`  -I, --input-cidr             CIDR range from which to allow broadcast input (default is 0.0.0.0/0)`);
  console.log(`  -S, --start-channel          Start MediaLive channel on stack creation (default is to not start)`);
  console.log(`  -K, --signing-key-id         Key ID of Cloudfront signing keypair (optional)`);
  console.log(`  -A, --signing-key-arn        ARN of Secrets Manager secret holding private key part of Cloudfront signing keypair, in PEM format (optional)`);
  console.log(`  -D, --access-duration        Number of seconds viewers should have access to broadcast (default is 86400)`);
  console.log(`  -h, --help                   Show help and exit`);
}

function ensureBucket() {
  const s3Api = spawnSync('aws', [
    's3api',
    'head-bucket',
    '--bucket',
    `${bucket}`,
    '--region',
    `${region}`,
  ]);
  if (s3Api.status !== 0) {
    console.log(`Creating S3 bucket ${bucket}`);
    const s3 = spawnSync('aws', [
      's3',
      'mb',
      `s3://${bucket}`,
      '--region',
      `${region}`,
    ]);
    if (s3.status !== 0) {
      console.log(`Failed to create bucket: ${JSON.stringify(s3)}`);
      console.log((s3.stderr || s3.stdout).toString());
      process.exit(s3.status);
    }
  }
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
    switch (args[i]) {
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;
      case '-r':
      case '--region':
        region = getArgOrExit(++i, args);
        break;
      case '-b':
      case '--s3-bucket':
        bucket = getArgOrExit(++i, args);
        break;
      case '-s':
      case '--stack-name':
        stack = getArgOrExit(++i, args);
        break;
      case '-p':
      case '--event-prefix':
        stackParams.EventPrefix = getArgOrExit(++i, args);
        break;
      case '-t':
      case '--talent-name':
        stackParams.TalentFullName = getArgOrExit(++i, args);
        break;
      case '-d':
      case '--domain-name':
        stackParams.DomainName = getArgOrExit(++i, args);
        break;
      case '-c':
      case '--acm-cert-arn':
        stackParams.AcmCertArn = getArgOrExit(++i, args);
        break;
      case '-e':
      case '--event-bridge':
        stackParams.UseEventBridge = true;
        break;
      case '-n':
      case '--non-strict-access-keys':
        stackParams.UseStrictAccessKeys = false;
        break;
      case '-C':
      case '--input-codec':
        stackParams.InputCodec = getArgOrExit(++i, args);
        break;
      case '-R':
      case '--input-resolution':
        stackParams.InputResolution = getArgOrExit(++i, args);
        break;
      case '-I':
      case '--input-cidr':
        stackParams.InputCIDR = getArgOrExit(++i, args);
        break;
      case '-S':
      case '--start-channel':
        stackParams.StartChannel = true;
        break;
      case '-K':
      case '--signing-key-id':
        stackParams.CloudfrontSigningKeyId = getArgOrExit(++i, args);
        break;
      case '-A':
      case '--signing-key-arn':
        stackParams.CloudfrontPrivateSigningKeySecretArn = getArgOrExit(++i, args);
        break;
      case '-D':
      case '--access-duration':
        stackParams.BroadcastAccessDurationSecs = getArgOrExit(++i, args);
        break;
      default:
        console.log(`Invalid argument ${args[i]}`);
        usage();
        process.exit(1);
    }
    ++i;
  }
  if (!stack.trim() || !bucket.trim()) {
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
  const output = cmd.output.toString();
  console.log(output);
  if (cmd.status !== 0) {
    console.log(
      `Command ${command} failed with exit code ${cmd.status} signal ${cmd.signal}`
    );
    console.log(cmd.stderr.toString());
    process.exit(cmd.status);
  }
  return output;
}

function ensureTools() {
  spawnOrFail('npm', ['--version']);
  spawnOrFail('aws', ['--version']);
  spawnOrFail('sam', ['--version']);
}

parseArgs();
ensureTools();

console.log('Installing node dependencies');
spawnOrFail('npm', ['install'], {
  cwd: path.resolve('../../../')
});
spawnOrFail('npm', ['install'], {
  cwd: path.resolve('src/')
});
// Ensure all the file timestamps make sense so the ZIP won't fail
spawnOrFail('find', ['.', '-type', 'f', '-exec', 'touch', '{}', ';'], {
  cwd: path.resolve('src/node_modules')
});
console.log('Compiling frontend assets');
spawnOrFail('npm', ['run', 'release'], {
  cwd: path.resolve('../../../')
});
console.log(`Using region ${region}, bucket ${bucket}, stack ${stack}, domain ${stackParams.DomainName} ACM cert arn ${stackParams.AcmCertArn}`);

console.log('Creating deployment bucket');
ensureBucket();
console.log('Deployment of bucket is done');

// Initiate deployment of broadcast stack.
console.log('Started deploying broadcast');
spawnOrFail('node', ['./deploy.js', '-b', `${bucket}-broadcast`, '-s', `${stack}-broadcast`, '-n', `${stack.toLowerCase()}-broadcast`], {cwd: path.resolve('../../../transcoding')})
console.log('Deploying broadcast finished');

console.log('Deploying serverless application');
const prefix = ['deploy', '--s3-bucket', bucket, '--stack-name', stack, '--parameter-overrides'];
const overrides = Object.getOwnPropertyNames(stackParams).map(key => `${key}="${stackParams[key]}"`);
const suffix = ['--capabilities', 'CAPABILITY_IAM', 'CAPABILITY_AUTO_EXPAND', '--region', region];
const samParams = [].concat(prefix, overrides, suffix);
console.log('executing: sam', samParams);

spawnOrFail('sam', samParams);
