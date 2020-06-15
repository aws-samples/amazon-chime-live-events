import React, { ReactNode, createContext, useContext } from 'react';
import {
  PassiveParticipant,
  ParticipantType,
} from '../types/LiveEventParticipants';

type Props = {
  children: ReactNode;
};

const defaultParticipant = {
  attendeeType: ParticipantType.ATTENDEE,
};

const PassiveParticipantContext = createContext<PassiveParticipant>(
  defaultParticipant
);

export default function PassiveParticipantProvider(props: Props) {
  const { children } = props;

  return (
    <PassiveParticipantContext.Provider value={defaultParticipant}>
      {children}
    </PassiveParticipantContext.Provider>
  );
}

export function usePassiveParticipantContext() {
  const context = useContext(PassiveParticipantContext);

  return context;
}
