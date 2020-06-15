import React from 'react';
import {
  UnknownParticipant,
  ParticipantType,
} from '../types/LiveEventParticipants';

/*
 * This is just a dummy value to create the context with defined values.
 * The alternative would be to have UnknownParticipant | null as the context type,
 * or to loosen UnknownParticipant to have a bunch of optional values.
 * Both of those alternatives make it really messy for consumers of this data.
 *
 * If you look in LiveEventParticipantProvider, you will see that we don't actually render
 * a provider or any of its children until we have *real* non-dummy values for
 * the liveEvent.
 */
const context = React.createContext<UnknownParticipant>({
  attendeeType: ParticipantType.ATTENDEE,
  setAttendeeName: () => {},
});

/*
 * !!!!This really shouldn't be used anywhere other than in other ParticipantProviders!!!!
 *
 * The participant providers such as ActiveParticipantProvider, VerifiedParticipantProvider
 * give much more meaningful contracts for use within child components.
 * For example, anywhere that expects attendeeName to be provided should be expecting a VerifiedParticipant.
 */
export default function getLiveEventParticipantContext() {
  return context;
}
