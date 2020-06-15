// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const AWS = require('aws-sdk');
const ecs = new AWS.ECS();

// Reading environment variables
const ecsClusterArn = process.env.ecsClusterArn;
const ecsTaskDefinationArn = process.env.ecsTaskDefinationArn;
const ecsContainerName = process.env.ecsContainerName;
 
exports.handler = function(event, context, callback) {
    let meetingURL = "";
    let taskId = "";
    let rtmpEndpoint = "";
    
    console.log("event", event);
    const { action = "" } = event;
    console.log("Broadcast Action: " + action);
    
    switch (action.toLowerCase()) {
        case 'start':
            if (event.meetingURL && event.rtmpEndpoint) {
                meetingURL = decodeURIComponent(event.meetingURL);
                rtmpEndpoint = decodeURIComponent(event.rtmpEndpoint);
                console.log("Meeting URL: " + meetingURL);
                console.log("RTMP Endpoint: " + rtmpEndpoint);
                startRecording(event, context, callback, meetingURL, rtmpEndpoint);
            } else {
                callback(null, "Missing parameter: meetingURL or rtmpEndpoint");
            }
            break;
        case 'stop':
            if (event.taskId) {
                taskId = event.taskId;
                console.log("ECS task ID: " + taskId);
                stopRecording(event, context, callback, taskId);
            } else {
                callback(null, "Missing parameter: taskId");
            }
            break;
        default:
            callback(null, "Invalid parameter: action. Valid values 'start' & 'stop'");
    }
};

function startRecording(event, context, callback, meetingUrl, rtmpEndpoint) {
    let ecsRunTaskParams = {
        cluster: ecsClusterArn,
        launchType: "EC2",
        count: 1,
        overrides: {
            containerOverrides: [ 
                 { 
                    environment: [ 
                        { 
                            name: "MEETING_URL",
                            value: meetingUrl
                        },
                        {
                            name: "RTMP_URL",
                            value: rtmpEndpoint
                        }
                    ],
                    name: ecsContainerName
                }
            ],
        },
        placementConstraints: [{
            type: "distinctInstance"
        }],
        taskDefinition: ecsTaskDefinationArn
    };
    
    console.log("ecsRunTaskParams:", JSON.stringify(ecsRunTaskParams));
    
    ecs.runTask(ecsRunTaskParams, function(err, data) {
        if (err) {
            console.log("start task failed: ", err);
            callback(err);
        } else if (data.failures.length) {
            console.log("start task failed: ", data);
            callback("Task is not started, please see logs", data);
        } else {
            console.log("start task succeed", data);
            const result = JSON.stringify((data.tasks.length && data.tasks[0].taskArn) ? data.tasks[0].taskArn : data, null, ' ');
            callback(null, result);
        }
    });
}

function stopRecording(event, context, callback, taskId) {
    let ecsStopTaskParam = {
        cluster: ecsClusterArn,
        task: taskId
    };
    
    ecs.stopTask(ecsStopTaskParam, function(err, data) {
        if (err) {
            console.log("stop task failed: ", err);
            callback(err);
        } else {
            console.log("stop task succeed", data);
            callback(null, data);
        }
    });
}