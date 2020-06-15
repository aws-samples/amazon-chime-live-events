import React, { ReactNode } from 'react';

import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import {
  UnknownParticipant,
  getParticipantTypeFromPath,
} from '../types/LiveEventParticipants';

type Props = {
  children: ReactNode;
};

export default function LiveEventParticipantProvider(props: Props) {
  const { children } = props;

  // Ex - ?eId=liveEvent1234&aId=Will12356&name=willsmith
  const urlParams = new URLSearchParams(location.search);
  const attendeeId = urlParams.get('aId')?.trim() || undefined;
  const nameFromUrl = urlParams.get('name')?.trim() || undefined;

  const attendeeType = getParticipantTypeFromPath(window.location.pathname);

  const liveEventParticipant = new UnknownParticipant(
    attendeeType,
    attendeeId,
    nameFromUrl
  );

  const LiveEventParticipantContext = getLiveEventParticipantContext();

  return (
    <LiveEventParticipantContext.Provider value={liveEventParticipant}>
      {children}
    </LiveEventParticipantContext.Provider>
  );
}
