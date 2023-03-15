import React, { useState, useEffect } from 'react';
import {
    useMeetingManager,
    useLocalVideo,
    ControlBar,
    ControlBarButton,
    Meeting,
    LeaveMeeting,
    LocalVideo,
    Play,
    Pause,
    Remove,
    AudioInputControl,
    RemoteVideo,
    DeviceLabels,
    VideoGrid,
    VideoInputControl,
    AudioOutputControl,
    MeetingStatus,
    useDeviceLabelTriggerStatus,
    useRemoteVideoTileState,
    useMeetingStatus,
    Laptop,
} from 'amazon-chime-sdk-component-library-react';
import { MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import NorthStarThemeProvider from 'aws-northstar/components/NorthStarThemeProvider';
import Header from 'aws-northstar/components/Header';
import './App.css';
import { AmplifyConfig as config } from './Config';
import { Amplify, API } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
Amplify.configure(config);
Amplify.Logger.LOG_LEVEL = 'DEBUG';
console.log(config.API);
const App = () => {
    const meetingManager = useMeetingManager();
    const status = useDeviceLabelTriggerStatus();
    const meetingStatus = useMeetingStatus();
    const [meetingId, setMeetingId] = useState('');
    const [attendeeId, setAttendeeId] = useState('');
    const [playbackUrl, setPlaybackUrl] = useState('');
    const [mediaPipelineId, setMediaPipelineId] = useState('');
    const [streamStatus, setStreamStatus] = useState(false);
    const { toggleVideo } = useLocalVideo();
    const { tiles } = useRemoteVideoTileState();
    const [remoteTileId, setRemoteTileId] = useState('');

    useEffect(() => {
        if (tiles && tiles.length) {
            setRemoteTileId(tiles[0]);
        } else {
            setRemoteTileId(undefined);
        }
    }, [tiles]);

    useEffect(() => {
        async function tog() {
            if (meetingStatus === MeetingStatus.Succeeded) {
                await toggleVideo();
            }
        }
        tog();
    }, [meetingStatus]);

    const JoinButtonProps = {
        icon: <Meeting />,
        onClick: (event) => handleJoin(event),
        label: 'Join',
    };

    const LeaveButtonProps = {
        icon: <LeaveMeeting />,
        onClick: (event) => handleLeave(event),
        label: 'Leave',
    };

    const EndButtonProps = {
        icon: <Remove />,
        onClick: (event) => handleEnd(event),
        label: 'End',
    };

    const IVSButtonProps = {
        icon: streamStatus ? <Pause /> : <Play />,
        onClick: (event) => handleIVS(event),
        label: 'IVS',
    };

    const StreamButtonProps = {
        icon: <Laptop />,
        onClick: () => handleOpenIVSPlayer(),
        label: 'View',
    };

    const handleOpenIVSPlayer = async () => {
        window.open(`https://debug.ivsdemos.com/?p=jwp&url=${playbackUrl}`, '_blank');
    };

    const handleLeave = async () => {
        await meetingManager.leave();
    };

    const handleEnd = async (event) => {
        event.preventDefault();
        try {
            await API.post('meetingApi', 'end', { body: { meetingId: meetingId } });
            setStreamStatus(false);
            setPlaybackUrl('');
        } catch (err) {
            console.log(err);
        }
    };

    const handleIVS = async (event) => {
        event.preventDefault();
        if (streamStatus) {
            const streamResponse = await API.post('meetingApi', 'stream', {
                body: {
                    streamAction: 'delete',
                    mediaPipelineId: mediaPipelineId,
                },
            });
            console.log(streamResponse);
            setStreamStatus(false);
            setPlaybackUrl('');
        } else {
            const streamResponse = await API.post('meetingApi', 'stream', {
                body: {
                    meetingId: meetingId,
                    streamTarget: 'IVS',
                },
            });
            setMediaPipelineId(streamResponse.mediaPipelineId);
            setPlaybackUrl(streamResponse.playbackUrl);
            console.log(streamResponse);
            setStreamStatus(true);
        }
    };

    const handleJoin = async (event) => {
        event.preventDefault();
        try {
            const joinResponse = await API.post('meetingApi', 'join', {});
            console.log(joinResponse);
            const meetingSessionConfiguration = new MeetingSessionConfiguration(
                joinResponse.Meeting,
                joinResponse.Attendee,
            );

            const options = {
                deviceLabels: DeviceLabels.Video,
            };

            await meetingManager.join(meetingSessionConfiguration, options);
            await meetingManager.start();
            meetingManager.invokeDeviceProvider(DeviceLabels.AudioAndVideo);
            console.log('Meeting started');
            setMeetingId(joinResponse.Meeting.MeetingId);
            setAttendeeId(joinResponse.Attendee.AttendeeId);
            console.log(meetingId);
            console.log(attendeeId);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <NorthStarThemeProvider>
            <Header title="Amazon Chime SDK Meeting with Live Connector" />

            <div id="video">
                <div style={{ padding: '1rem', height: '50vh', width: '`100vh', boxSizing: 'border-box' }}>
                    <VideoGrid size={2}>
                        <LocalVideo
                            nameplate="Me"
                            style={{
                                border: '1px solid grey',
                                gridArea: '',
                            }}
                            key={1}
                        />
                        <RemoteVideo
                            tileId={remoteTileId}
                            nameplate="Remote"
                            style={{
                                border: '1px solid grey',
                                gridArea: '',
                            }}
                            key={0}
                        />
                    </VideoGrid>
                </div>
            </div>
            <ControlBar showLabels={true} responsive={true} layout="undocked-horizontal" css="margin: 10px">
                <ControlBarButton {...JoinButtonProps} />
                <ControlBarButton {...LeaveButtonProps} />
                <ControlBarButton {...EndButtonProps} />
                <ControlBarButton {...IVSButtonProps} />
                <AudioInputControl />
                <AudioOutputControl />
                <VideoInputControl />
                {playbackUrl && <ControlBarButton {...StreamButtonProps} />}
            </ControlBar>
        </NorthStarThemeProvider>
    );
};

export default App;
