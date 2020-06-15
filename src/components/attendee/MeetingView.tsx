import React from 'react';

import Attendee from '../Attendee';
import Controls from '../Controls';
import MeetingStatusProvider from './MeetingStatusProvider';
import RosterProvider from '../../providers/RosterProvider';
import { ContentShareProvider } from '../../providers/ContentShareProvider';
import { LiveAttendeesProvider } from '../../providers/LiveAttendeesProvider';
import { VideoTileProvider } from '../../providers/VideoTileProvider';
import { LocalTileProvider } from '../../providers/LocalTileProvider';

const MeetingView = () => (
  <MeetingStatusProvider joinMuted>
    <RosterProvider>
      <LocalTileProvider>
        <VideoTileProvider>
          <LiveAttendeesProvider>
            <ContentShareProvider>
              <Attendee controls={<Controls allowLeave />} fullScreenVideo />
            </ContentShareProvider>
          </LiveAttendeesProvider>
        </VideoTileProvider>
      </LocalTileProvider>
    </RosterProvider>
  </MeetingStatusProvider>
);

export default MeetingView;
