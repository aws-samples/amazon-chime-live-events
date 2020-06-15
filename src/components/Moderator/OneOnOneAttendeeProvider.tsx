import React, { useContext, useEffect, useState, ReactNode } from 'react';

import getChimeContext from '../../context/getChimeContext';
import getOneOnOneAttendeeContext from '../../context/getOneOnOneAttendeeContext';
import getMeetingStatusContext from '../../context/getMeetingStatusContext';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import RosterAttendeeType from '../../types/RosterAttendeeType';
import RosterType from '../../types/RosterType';

type Props = {
  children: ReactNode;
};

export default function OneOnOneAttendeeProvider(props: Props) {
  const { children } = props;
  const [attendee, setAttendee] = useState<RosterAttendeeType>();
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { meetingStatus } = useContext(getMeetingStatusContext());

  useEffect(() => {
    const callback = (newRoster: RosterType) => {
      if (Object.keys(newRoster).length === 0) {
        return;
      }

      if (Object.keys(newRoster).length > 2) {
        console.error(
          'Meeting should not have more than 2 attendees for a 1:1.'
        );
      }

      const getRemoteAttendee = (attendeeIds: string[]) => {
        for (const attendeeId of attendeeIds) {
          if (attendeeId !== chime?.configuration?.credentials?.attendeeId) {
            return attendeeId;
          }
        }
        return null;
      };

      const remoteAttendeeId = getRemoteAttendee(Object.keys(newRoster));
      remoteAttendeeId &&
        setAttendee({ ...newRoster[remoteAttendeeId], id: remoteAttendeeId });
    };

    chime?.subscribeToRosterUpdate(callback);

    return () => {
      setAttendee(undefined);
      chime?.unsubscribeFromRosterUpdate(callback);
    };
  }, [meetingStatus]);

  const OneOnOneAttendeeContext = getOneOnOneAttendeeContext();
  return (
    <OneOnOneAttendeeContext.Provider value={attendee}>
      {children}
    </OneOnOneAttendeeContext.Provider>
  );
}
