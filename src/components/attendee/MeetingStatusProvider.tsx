/* eslint-disable jsx-a11y/media-has-caption */
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { AudioVideoObserver } from 'amazon-chime-sdk-js';

import getMeetingStatusContext from '../../context/getMeetingStatusContext';
import getChimeContext from '../../context/getChimeContext';
import MeetingStatus from '../../enums/MeetingStatus';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import routes from '../../constants/routes';
import { useMetaState } from '../../providers/MetaStateProvider';
import { MeetingAudio } from '../../providers/MetaStateProvider/state';
import { makeReselects, makeAVObserver } from '../../providers/AVObserver';
import { useVerifiedParticipantContext } from '../../providers/VerifiedParticipantProvider';
import { useTalentMeetingContext } from '../../providers/TalentMeetingProvider';
import useVideoSendError from '../../hooks/useVideoSendError';

type Props = {
  children: ReactNode;
  joinMuted?: boolean;
  joinWithVideo?: boolean;
};

export default function MeetingStatusProvider(props: Props): JSX.Element {
  const MeetingStatusContext = getMeetingStatusContext();
  const { children, joinMuted = false } = props;
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const talentMeetingService = useTalentMeetingContext();
  const verifiedParticipant = useVerifiedParticipantContext();

  const attendeeName = verifiedParticipant.attendeeName;

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

  useEffect(() => {
    let mainObserver: AudioVideoObserver;

    const start = async (): Promise<void> => {
      try {
        if (!meetingId) {
          throw new Error('Cannot join meeting without a meeting ID.');
        }

        if (!chime) {
          throw new Error('Chime has not been initialized.');
        }

        await chime.createRoom(
          meetingId,
          attendeeName,
          query.get('region') || 'us-east-1'
        );

        setMeetingStatus({
          meetingStatus: MeetingStatus.Succeeded,
        });

        if (!chime.audioVideo) {
          return;
        }

        mainObserver = makeAVObserver(chime.audioVideo, {
          ...makeReselects(chime),
          joinMuted,
          joinWithVideo: false,
          onEnded: () => {
            history.push(routes.HOME);
          },
        });

        chime.audioVideo.addObserver(mainObserver);
        await chime.joinRoom(audioElement.current);
      } catch (error) {
        console.error(`Failed to join meeting ${meetingId} - ${error}`);
        setMeetingStatus({
          meetingStatus: MeetingStatus.Failed,
        });
      }
    };

    if (meetingId) {
      start();
    }

    return (): void => {
      console.log('Meeting title param changed, leaving meeting...');
      setMeetingStatus({
        meetingStatus: MeetingStatus.Ended,
      });
      chime?.audioVideo?.removeObserver(mainObserver);
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
    return (): void => {
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
