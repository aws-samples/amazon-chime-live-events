import React, { useContext, useEffect, useState, ReactNode } from 'react';

import getChimeContext from '../context/getChimeContext';
import getRosterContext from '../context/getRosterContext';
import RosterType from '../types/RosterType';
import { ChimeSdkWrapper } from './ChimeProvider';
import getMeetingStatusContext from '../context/getMeetingStatusContext';

type Props = {
  children: ReactNode;
};

export default function RosterProvider(props: Props) {
  const { children } = props;
  const [roster, setRoster] = useState<RosterType>({});
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const RosterContext = getRosterContext();
  const { meetingStatus } = useContext(getMeetingStatusContext());

  useEffect(() => {
    const callback = (newRoster: RosterType) => {
      setRoster({
        ...newRoster,
      });
    };

    chime?.subscribeToRosterUpdate(callback);

    return () => {
      setRoster({});
      chime?.unsubscribeFromRosterUpdate(callback);
    };
  }, [meetingStatus]);

  return (
    <RosterContext.Provider value={roster}>{children}</RosterContext.Provider>
  );
}
