import React, { useState } from 'react';

import MeetingStatusProvider from './MeetingStatusProvider';
import RosterProvider from '../../providers/RosterProvider';
import Attendee from '../Attendee';
import { Response } from '../../types/Response';
import { LiveAttendeesProvider } from '../../providers/LiveAttendeesProvider';
import TalentMeetingProvider from '../../providers/TalentMeetingProvider';
import { VideoTileProvider } from '../../providers/VideoTileProvider';
import Error from '../Error';
import { ContentShareProvider } from '../../providers/ContentShareProvider';
import { LocalTileProvider } from '../../providers/LocalTileProvider';

const TalentMeeting: React.FC = () => {
  const [error, setError] = useState<string | undefined>();

  const onLoadTalentMeeting = (response: Response) => {
    if (response.error) {
      console.error(response.error);
      setError(
        'There was an error getting necessary information about the talent meeting.'
      );
    }
  };

  if (error) {
    return <Error errorMessage={error} />;
  }
  return (
    <TalentMeetingProvider onLoad={onLoadTalentMeeting}>
      <MeetingStatusProvider joinWithVideo joinMuted={false}>
        <RosterProvider>
          <LocalTileProvider>
            <VideoTileProvider>
              <ContentShareProvider>
                <LiveAttendeesProvider>
                  <Attendee fullScreenVideo showLiveView showSelfView={false} />
                </LiveAttendeesProvider>
              </ContentShareProvider>
            </VideoTileProvider>
          </LocalTileProvider>
        </RosterProvider>
      </MeetingStatusProvider>
    </TalentMeetingProvider>
  );
};

export default TalentMeeting;
