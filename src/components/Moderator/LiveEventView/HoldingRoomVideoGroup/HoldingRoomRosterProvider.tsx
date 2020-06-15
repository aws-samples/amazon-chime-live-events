import React, { useContext, useEffect, useState, createContext } from 'react';
import isEqual from 'lodash.isequal';

import getRosterContext from '../../../../context/getRosterContext';
import { useVideoTileState } from '../../../../providers/VideoTileProvider';
import { useLiveAttendees } from '../../../../providers/LiveAttendeesProvider';

interface HoldingRoster {
  [key: string]: {
    name?: string;
    tileId: number;
  };
}

const Context = createContext<HoldingRoster>({});

const HoldingRoomRosterProvider: React.FC = ({ children }) => {
  const { liveAttendeeIds } = useLiveAttendees();
  const roster = useContext(getRosterContext());
  const { attendeeIdToTileId } = useVideoTileState();
  const [holdingRoster, setHoldingRoster] = useState({});

  useEffect(() => {
    const newRoster: any = {};
    const allIdsWithVid = Object.keys(attendeeIdToTileId);

    for (let i = 0; i < allIdsWithVid.length; i++) {
      const id = allIdsWithVid[i];

      if (!liveAttendeeIds.includes(id)) {
        newRoster[id] = {
          name: roster[id]?.name || '',
          tileId: attendeeIdToTileId[id],
        };
      }
    }

    if (!isEqual(holdingRoster, newRoster)) {
      setHoldingRoster(newRoster);
    }
  }, [holdingRoster, roster, attendeeIdToTileId, liveAttendeeIds]);

  return <Context.Provider value={holdingRoster}>{children}</Context.Provider>;
};

const useHoldingRoomRoster = () => {
  const roster = useContext(Context);

  if (!roster) {
    console.log(
      'useHoldingRoomRoster must be used within HoldingRoomRosterProvider'
    );
  }

  return roster;
};

export { HoldingRoomRosterProvider, useHoldingRoomRoster };
