import {
  MeetingSessionStatus,
  MeetingSessionStatusCode,
} from 'amazon-chime-sdk-js';
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import getMeetingStatusContext from '../../../context/getMeetingStatusContext';
import getChimeContext from '../../../context/getChimeContext';
import MeetingStatus from '../../../enums/MeetingStatus';
import { ChimeSdkWrapper } from '../../../providers/ChimeProvider';
import routes from '../../../constants/routes';
import { useMetaState } from '../../../providers/MetaStateProvider';
import { MeetingAudio } from '../../../providers/MetaStateProvider/state';
import { useVerifiedParticipantContext } from '../../../providers/VerifiedParticipantProvider';
import { useTalentMeetingContext } from '../../../providers/TalentMeetingProvider';
import useVideoSendError from '../../../hooks/useVideoSendError';

type Props = {
  children: ReactNode;
  joinMuted?: boolean;
  joinWithVideo?: boolean;
};

export default function LiveEventMeetingStatusProvider(props: Props) {
  const MeetingStatusContext = getMeetingStatusContext();
  const { children, joinMuted = false } = props;
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const talentMeetingService = useTalentMeetingContext();
  const verifiedParticipant = useVerifiedParticipantContext();

  const [meetingStatus, setMeetingStatus] = useState<{
    meetingStatus: MeetingStatus;
    errorMessage?: string;
  }>({
    meetingStatus: MeetingStatus.Loading,
  });
  useVideoSendError(meetingStatus.meetingStatus);
  const { activeAudio } = useMetaState();

  const history = useHistory();
  const query = new URLSearchParams(useLocation().search);
  const audioElement = useRef<HTMLAudioElement>(null);
  const meetingId =
    query.get('title') || talentMeetingService.talentMeeting?.id;

  const observer = {
    audioVideoDidStop: (sessionStatus: MeetingSessionStatus): void => {
      if (
        sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded
      ) {
        history.push(routes.HOME);
      }
    },
    audioVideoDidStart: (): void => {
      console.log('AV did start.');

      if (chime && chime.currentAudioInputDevice) {
        console.log(
          'Re-selecting current audio:',
          chime.currentAudioInputDevice
        );
        chime.audioVideo?.chooseAudioInputDevice(
          chime.currentAudioInputDevice.value
        );
      }

      // There is a chance that we need this to unbreak audio.
      // chime?.audioVideo?.realtimeUnmuteLocalAudio();
    },
  };

  useEffect(() => {
    const start = async () => {
      try {
        if (!meetingId) {
          throw new Error('Must have meetingId to get meeting status.');
        }

        await chime?.createRoom(
          meetingId,
          verifiedParticipant.attendeeName,
          query.get('region') || 'us-east-1'
        );

        if (joinMuted) {
          console.log('Automatically muting self on join.');
          chime?.audioVideo?.realtimeMuteLocalAudio();
        }

        setMeetingStatus({
          meetingStatus: MeetingStatus.Succeeded,
        });

        chime?.audioVideo?.addObserver(observer);

        await chime?.joinRoom(audioElement.current);
      } catch (error) {
        console.error(error);
        setMeetingStatus({
          meetingStatus: MeetingStatus.Failed,
          errorMessage: error.message,
        });
      }
    };

    if (meetingId) {
      start();
    }

    return () => {
      console.log('Meeting title param changed, leaving meeting...');
      setMeetingStatus({
        meetingStatus: MeetingStatus.Ended,
      });
      chime?.audioVideo?.removeObserver(observer);
      chime?.dropAudio().then(() => {
        chime?.disableVideoAndLeaveRoom(false);
      });
    };
  }, [meetingId]);

  useEffect(() => {
    if (
      activeAudio === MeetingAudio.ONE_ON_ONE ||
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
      <audio ref={audioElement} style={{ display: 'none' }} />
      {children}
    </MeetingStatusContext.Provider>
  );
}
