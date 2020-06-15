import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  MeetingSessionStatus,
  MeetingSessionStatusCode,
} from 'amazon-chime-sdk-js';

import getChimeContext from '../../../context/getChimeContext';
import getMeetingStatusContext from '../../../context/getMeetingStatusContext';
import MeetingStatus from '../../../enums/MeetingStatus';
import { ChimeSdkWrapper } from '../../../providers/ChimeProvider';
import {
  useMetaState,
  useMetaDispatch,
} from '../../../providers/MetaStateProvider';
import {
  MeetingAudio,
  Types,
} from '../../../providers/MetaStateProvider/state';
import { MessageType } from '../../../types/MeetingMessage';
import useVideoSendError from '../../../hooks/useVideoSendError';
import { useLiveEventMessagesDispatch } from '../../../providers/LiveEventMessagesProvider';
import {
  RemoveMessageEventType,
  RemoveMessagePayload,
  Type as MsgType,
} from '../../../providers/LiveEventMessagesProvider/state';

type Props = {
  children: ReactNode;
};

export default function OneOnOneMeetingStatusProvider(props: Props) {
  const MeetingStatusContext = getMeetingStatusContext();
  const liveEventMessagesDispatch = useLiveEventMessagesDispatch();
  const { children } = props;
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const [meetingStatus, setMeetingStatus] = useState<{
    meetingStatus: MeetingStatus;
    errorMessage?: string;
  }>({
    meetingStatus: MeetingStatus.Loading,
  });
  useVideoSendError(meetingStatus.meetingStatus);
  const {
    oneOnOneMeetingId,
    activeAudio,
    onStartOneOnOneError,
    onStartOneOnOneSuccess,
  } = useMetaState();
  const dispatch = useMetaDispatch();
  const audioElement = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!oneOnOneMeetingId) return;

    const observer = {
      audioVideoDidStop: (sessionStatus: MeetingSessionStatus): void => {
        const status = sessionStatus.statusCode();
        if (status === MeetingSessionStatusCode.AudioCallEnded) {
          console.log(`1on1 meeting ended with status - ${status}`);
          dispatch({
            type: Types.ONE_ON_ONE_ENDED,
          });
        }
      },
    };

    const presenceChanged = (
      attendeeID: string,
      present: boolean,
      externalAttendeeId?: string | null | undefined
    ) => {
      const self = chime?.configuration?.credentials?.attendeeId;
      if (attendeeID === self) {
        return;
      }
      console.log(`Attendee ${attendeeID} changed presence to ${present}.`);
      console.log(`External Attendee Id: ${externalAttendeeId}`);
      if (!present) {
        console.log(`Other attendee left; ending meeting.`);
        dispatch({
          type: Types.ONE_ON_ONE_ENDED,
        });
      } else {
        liveEventMessagesDispatch?.({
          type: MsgType.REMOVE_QUEUED_MESSAGE,
          payload: {
            attendeeId: externalAttendeeId,
            event: RemoveMessageEventType.MODERATOR_1ON1_STARTED,
          } as RemoveMessagePayload,
        });
        console.log('Attendee joined: remotely unmuting them.');
        dispatch({
          type: Types.ATTENDEE_JOINED_ONE_ON_ONE,
          payload: externalAttendeeId,
        });
        chime?.sendMessage(MessageType.UNMUTE, {
          targetAttendeeId: attendeeID,
        });
      }
    };

    const start = async () => {
      try {
        await chime?.createRoom(oneOnOneMeetingId, 'Moderator', 'us-east-1');

        setMeetingStatus({
          meetingStatus: MeetingStatus.Succeeded,
        });

        chime?.audioVideo?.addObserver(observer);
        chime?.audioVideo?.realtimeSubscribeToAttendeeIdPresence(
          presenceChanged
        );

        await chime?.joinRoom(audioElement.current);
        onStartOneOnOneSuccess && onStartOneOnOneSuccess();
      } catch (error) {
        onStartOneOnOneError && onStartOneOnOneError(error);
        setMeetingStatus({
          meetingStatus: MeetingStatus.Failed,
          errorMessage: error.message,
        });
      }
    };
    start();

    return () => {
      chime?.audioVideo?.realtimeUnsubscribeToAttendeeIdPresence(
        presenceChanged
      );
      chime?.audioVideo?.removeObserver(observer);

      // This means we left a 1:1 for some reason, so delete (by ending) that meetingID.
      const endMeeting = true;
      chime?.disableVideoAndLeaveRoom(endMeeting);

      setMeetingStatus({
        meetingStatus: MeetingStatus.Ended,
      });
    };
  }, [oneOnOneMeetingId]);

  useEffect(() => {
    if (
      activeAudio !== MeetingAudio.ONE_ON_ONE ||
      meetingStatus.meetingStatus !== MeetingStatus.Succeeded
    ) {
      return;
    }

    if (audioElement.current) {
      console.log(`ActiveAudio changed: ${activeAudio}. Binding audio element`);
      chime?.audioVideo?.bindAudioElement(audioElement.current);
    }
    return () => {
      console.log(`Unbinding audio element from ${activeAudio}`);
      chime?.audioVideo?.unbindAudioElement();
      chime?.audioVideo?.realtimeMuteLocalAudio();
    };
  }, [activeAudio, meetingStatus.meetingStatus]);

  return (
    <MeetingStatusContext.Provider value={meetingStatus}>
      <audio
        ref={audioElement}
        style={{
          display: 'none',
        }}
      />
      {children}
    </MeetingStatusContext.Provider>
  );
}
