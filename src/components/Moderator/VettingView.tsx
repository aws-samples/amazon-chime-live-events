import React from 'react';

import ChimeProvider from '../../providers/ChimeProvider';
import OneOnOneMeetingStatusProvider from './OneOnOneMeeting/MeetingStatusProvider';
import OneOnOneAttendeeProvider from './OneOnOneAttendeeProvider';
import { useFeatures } from '../../providers/FeatureProvider';
import Queue from './Queue';
import OneOnOneMeeting from './OneOnOneMeeting';
import { Authenticated } from '../Authenticated';

const VettingView = () => {
  const { hideQueue } = useFeatures();
  return (
    <ChimeProvider>
      <Authenticated>
        <OneOnOneMeetingStatusProvider>
          {!hideQueue && <Queue />}
          <OneOnOneAttendeeProvider>
            <OneOnOneMeeting />
          </OneOnOneAttendeeProvider>
        </OneOnOneMeetingStatusProvider>
      </Authenticated>
    </ChimeProvider>
  );
};

export default VettingView;
