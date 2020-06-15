import React, { ReactNode, createContext, useContext } from 'react';

import {
  ActiveParticipant,
  ParticipantType,
} from '../types/LiveEventParticipants';
import Informational from '../components/Informational';
import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import ExampleUrl from '../components/ExampleUrl';
import useTranslate from '../hooks/useTranslate';

const ActiveParticipantContext = createContext<ActiveParticipant>({
  attendeeId: '',
  attendeeType: ParticipantType.ATTENDEE,
});

type Props = {
  children: ReactNode;
};

export default function ActiveParticipantProvider({ children }: Props) {
  const translate = useTranslate();
  const participant = useContext(getLiveEventParticipantContext());

  try {
    // If there is any issues with the participant information,
    // constructing an ActiveParticipant will throw during validation.
    const unknownParticipant = participant as ActiveParticipant;
    const activeParticipant = new ActiveParticipant(unknownParticipant);
    return (
      <ActiveParticipantContext.Provider value={activeParticipant}>
        {children}
      </ActiveParticipantContext.Provider>
    );
  } catch (e) {
    console.warn('Error creating ActiveParticipantContext', e);
    return (
      <Informational>
        {translate('ActiveParticipantProvider.missingInformation')}
        <br />
        <ExampleUrl />
      </Informational>
    );
  }
}

export function useActiveParticipantContext() {
  const context = useContext(ActiveParticipantContext);

  // The default values above for context are empty strings.
  if (context.attendeeId === '') {
    throw new Error(
      'useActiveParticipantContext must be used within an ActiveParticipantContext'
    );
  }

  return context;
}
