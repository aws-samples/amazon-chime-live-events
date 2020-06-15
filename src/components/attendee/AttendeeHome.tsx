import React, { useEffect, useContext } from 'react';

import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import getChimeContext from '../../context/getChimeContext';
import VideoPlayer from '../../components/VideoPlayer';
import RaiseHand from './RaiseHand';
import ActiveParticipantProvider from '../../providers/ActiveParticipantProvider';
import PassiveParticipantProvider from '../../providers/PassiveParticipantProvider';
import getLiveEventParticipantContext from '../../context/getLiveEventParticipantContext';
import { UnknownParticipant } from '../../types/LiveEventParticipants';
import { useStreamState, Status } from '../../providers/StreamProvider';

const AttendeeHome = () => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const participant: UnknownParticipant = useContext(
    getLiveEventParticipantContext()
  );

  // Just in case we're dropped back here, kill the mic.
  // TODO: this doesn't seem to actually work reliably.
  useEffect(() => {
    chime?.audioVideo?.chooseAudioInputDevice(null);
  }, []);

  const hasId = participant.attendeeId;
  const Wrapper = hasId
    ? ActiveParticipantProvider
    : PassiveParticipantProvider;
  const status = useStreamState();

  return (
    <Wrapper>
      {status === Status.SUCCEEDED && <VideoPlayer className='active' />}
      {hasId && <RaiseHand />}
    </Wrapper>
  );
};

export default AttendeeHome;
