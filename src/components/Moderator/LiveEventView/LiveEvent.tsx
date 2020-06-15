import React from 'react';

import MeetingStatusProvider from './MeetingStatusProvider';
import RosterProvider from '../../../providers/RosterProvider';
import LiveEventView from '.';
import { ContentShareProvider } from '../../../providers/ContentShareProvider';
import { LiveAttendeesProvider } from '../../../providers/LiveAttendeesProvider';
import { VideoTileProvider } from '../../../providers/VideoTileProvider';
import { LocalTileProvider } from '../../../providers/LocalTileProvider';

const LiveEvent = () => (
  <MeetingStatusProvider joinMuted>
    <RosterProvider>
      <VideoTileProvider>
        <LocalTileProvider>
          <LiveAttendeesProvider>
            <ContentShareProvider>
              <LiveEventView />
            </ContentShareProvider>
          </LiveAttendeesProvider>
        </LocalTileProvider>
      </VideoTileProvider>
    </RosterProvider>
  </MeetingStatusProvider>
);

export default LiveEvent;
