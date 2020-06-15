import React, { useContext, useEffect, useState, createContext } from 'react';
import isEqual from 'lodash.isequal';

import getRosterContext from '../context/getRosterContext';
import { useVideoTileState } from '../providers/VideoTileProvider';
import { useLiveAttendees } from '../providers/LiveAttendeesProvider';

interface LiveContextState {
  [key: string]: {
    name?: string;
    tileId: number;
  };
}

const Context = createContext<LiveContextState>({});

const LiveRosterProvider: React.FC = ({ children }) => {
  const roster = useContext(getRosterContext());
  const { attendeeIdToTileId } = useVideoTileState();
  const [liveRoster, setliveRoster] = useState({});
  const { liveAttendeeIds } = useLiveAttendees();

  useEffect(() => {
    const newRoster: any = {};

    for (let i = 0; i < liveAttendeeIds.length; i++) {
      const id = liveAttendeeIds[i];

      newRoster[id] = {
        name: roster[id]?.name || '',
        tileId: attendeeIdToTileId[id] || null,
      };
    }

    if (!isEqual(liveRoster, newRoster)) {
      setliveRoster(newRoster);
    }
  }, [liveRoster, roster, attendeeIdToTileId, liveAttendeeIds]);

  return <Context.Provider value={liveRoster}>{children}</Context.Provider>;
};

const useLiveRoster = () => {
  const roster = useContext(Context);

  if (!roster) {
    console.log(
      'useHoldingRoomRoster must be used within HoldingRoomRosterProvider'
    );
  }

  return roster;
};

export { LiveRosterProvider, useLiveRoster };
