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
import { makeAVObserver, makeReselects } from '../../providers/AVObserver';
import { useVerifiedParticipantContext } from '../../providers/VerifiedParticipantProvider';
import { useTalentMeetingContext } from '../../providers/TalentMeetingProvider';
import useTranslate from '../../hooks/useTranslate';
import useVideoSendError from '../../hooks/useVideoSendError';

type Props = {
  children: ReactNode;
  joinMuted?: boolean;
  joinWithVideo?: boolean;
};

export default function MeetingStatusProvider(props: Props) {
  const translate = useTranslate();
  const MeetingStatusContext = getMeetingStatusContext();
  const { children, joinMuted = false, joinWithVideo = true } = props;
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const talentMeetingService = useTalentMeetingContext();
  const verifiedParticipant = useVerifiedParticipantContext();

  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>(
    MeetingStatus.Loading
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  useVideoSendError(meetingStatus);
  const state = useMetaState();

  const history = useHistory();
  const query = new URLSearchParams(useLocation().search);
  const audioElement = useRef<HTMLAudioElement>(null);
  const meetingId = talentMeetingService.talentMeeting?.id;

  useEffect(() => {
    let mainObserver: AudioVideoObserver;
    const start = async () => {
      try {
        if (!meetingId) {
          throw new Error('Must have meetingId to get meeting status.');
        }

        if (!chime) {
          return;
        }

        await chime.createRoom(
          meetingId,
          verifiedParticipant.attendeeName,
          query.get('region') || 'us-east-1'
        );

        setMeetingStatus(MeetingStatus.Succeeded);

        if (!chime.audioVideo) {
          return;
        }

        mainObserver = makeAVObserver(chime.audioVideo, {
          ...makeReselects(chime),
          joinMuted,
          joinWithVideo,
          onEnded: () => {
            history.push(routes.HOME);
          },
        });

        chime.audioVideo.addObserver(mainObserver);

        await chime.joinRoom(audioElement.current);

        const attendeeId = chime?.configuration?.credentials?.attendeeId;
        if (!attendeeId) {
          throw Error(
            'Unable to set the talentAttendeeId for the talent meeting.'
          );
        }
        await talentMeetingService.setTalentAttendeeId(attendeeId);
      } catch (error) {
        console.error('Error setting talent meeting attendee id', error);
        setMeetingStatus(MeetingStatus.Failed);
        setErrorMessage(
          translate('Failed to join the talent meeting. Please try again.')
        );
      }
    };

    if (meetingId) {
      start();
    }

    return () => {
      console.log('Meeting title param changed, leaving meeting...');
      setMeetingStatus(MeetingStatus.Ended);
      chime?.audioVideo?.removeObserver(mainObserver);
      chime?.leaveRoom(false);
    };
  }, [meetingId]);

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded || !audioElement.current) {
      return;
    }

    if (state.oneOnOneMeetingId) {
      console.log('1on1 meeting started, muting primary meeting audio');
      chime?.audioVideo?.unbindAudioElement();
    } else {
      chime?.audioVideo?.bindAudioElement(audioElement.current);
    }
  }, [meetingStatus, state.oneOnOneMeetingId]);

  return (
    <MeetingStatusContext.Provider value={{ meetingStatus, errorMessage }}>
      <audio ref={audioElement} style={{ display: 'none' }} />
      {children}
    </MeetingStatusContext.Provider>
  );
}
