import React, { ReactNode, createContext, useContext } from 'react';

import {
  VerifiedParticipant,
  ParticipantType,
} from '../types/LiveEventParticipants';
import Informational from '../components/Informational';
import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import ExampleUrl from '../components/ExampleUrl';
import useTranslate from '../hooks/useTranslate';

const VerifiedParticipantContext = createContext<VerifiedParticipant>({
  attendeeId: '',
  attendeeName: '',
  attendeeType: ParticipantType.ATTENDEE,
});

type Props = {
  children: ReactNode;
};

export default function VerifiedParticipantProvider({ children }: Props) {
  const translate = useTranslate();
  const participant = useContext(getLiveEventParticipantContext());

  try {
    // If there is any issues with the participant information,
    // creating a VerifiedParticipant will throw during validation.
    const unknownParticipant = participant as VerifiedParticipant;
    const verifiedParticipant = new VerifiedParticipant(unknownParticipant);
    return (
      <VerifiedParticipantContext.Provider value={verifiedParticipant}>
        {children}
      </VerifiedParticipantContext.Provider>
    );
  } catch (e) {
    console.warn('Error creating VerifiedParticipantContext', e);
    return (
      <Informational>
        {translate('VerifiedParticipantProvider.missingInformation')}
        <br />
        <ExampleUrl />
      </Informational>
    );
  }
}

export function useVerifiedParticipantContext() {
  const context = useContext(VerifiedParticipantContext);

  // The default values above for context are empty strings.
  if (context.attendeeId === '') {
    throw new Error(
      'useVerifiedParticipantContext must be used within an VerifiedParticipantContext'
    );
  }

  return context;
}
