import { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import getChimeContext from '../context/getChimeContext';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import getMeetingStatusContext from '../context/getMeetingStatusContext';
import MeetingStatus from '../enums/MeetingStatus';
import {
  MessageType,
  Message,
  TransferMeetingMessage,
} from '../types/MeetingMessage';
import routes from '../constants/routes';
import {
  useNotificationDispatch,
  Type as NotifType,
} from '../providers/NotificationProvider';
import { useVerifiedParticipantContext } from '../providers/VerifiedParticipantProvider';
import { useLocalTileApi } from '../providers/LocalTileProvider';

const useRemoteMeetingCommands = () => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const notifDispatch = useNotificationDispatch();
  const localVideoApi = useLocalTileApi();
  const history = useHistory();

  const participant = useVerifiedParticipantContext();
  const attendeeName = participant.attendeeName;

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }
    console.log('Setting up listeners for remote commands');

    const cb = async (message: Message) => {
      const { type } = message;

      switch (type) {
        case MessageType.MUTE:
          console.log('Remote muted us.');
          chime?.audioVideo?.realtimeMuteLocalAudio();
          notifDispatch({ type: NotifType.REMOTE_MUTE });
          break;
        case MessageType.UNMUTE:
          console.log('Remote unmuted us.');
          chime?.audioVideo?.realtimeUnmuteLocalAudio();
          notifDispatch({ type: NotifType.REMOTE_UNMUTE });
          break;
        case MessageType.ENABLE_VIDEO:
          try {
            if (!chime?.currentVideoInputDevice) {
              throw new Error('currentVideoInputDevice does not exist');
            }
            await chime?.chooseVideoInputDevice(chime?.currentVideoInputDevice);
            localVideoApi.startLocalVideoTile();
            notifDispatch({ type: NotifType.REMOTE_VIDEO_ENABLED });
          } catch (error) {
            console.error(error);
          }
          break;
        case MessageType.DISABLE_VIDEO:
          notifDispatch({ type: NotifType.REMOTE_VIDEO_DISABLED });
          localVideoApi.stopLocalVideoTile();
          break;
        case MessageType.TRANSFER_MEETING:
          notifDispatch({ type: NotifType.TRANSFERRING_MEETING });
          const meetingId = (message.payload as TransferMeetingMessage)
            ?.meetingId;
          console.log(
            `Received moderator message to transfer meetings: ${meetingId}`
          );
          localVideoApi.stopLocalVideoTile();
          const url = `${routes.MEETING}?title=${meetingId}&name=${attendeeName}&region=us-east-1&liveEvent=true`;
          history.replace(url);
          break;
        case MessageType.KICK:
          history.replace(routes.HOME);
          break;
        default:
          break;
      }
    };

    chime?.subscribeToMessageUpdate(cb);
    return () => chime?.unsubscribeFromMessageUpdate(cb);
  }, [meetingStatus]);
};

export default useRemoteMeetingCommands;
