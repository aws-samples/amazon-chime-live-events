import React, { useContext } from 'react';

import getChimeContext from '../../../../context/getChimeContext';
import RemoteVideo from '../../../RemoteVideo';
import Informational from '../../../Informational';
import { ChimeSdkWrapper } from '../../../../providers/ChimeProvider';
import VideoGrid from '../../../VideoGrid';
import useTranslate from '../../../../hooks/useTranslate';
import { useHoldingRoomRoster } from './HoldingRoomRosterProvider';

interface Props {
  fullScreenVideo?: boolean;
  className?: string;
}

function HoldingRoomVideoGroup({ fullScreenVideo }: Props) {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const translate = useTranslate();
  const roster = useHoldingRoomRoster();

  const us = chime?.configuration?.credentials?.attendeeId;
  const holdingRoomAttendeeIds = Object.keys(roster);

  return holdingRoomAttendeeIds && holdingRoomAttendeeIds.length > 0 ? (
    <VideoGrid size={holdingRoomAttendeeIds.length}>
      {holdingRoomAttendeeIds.map(holdingRoomAttendeeId => {
        const isLocalUser = us === holdingRoomAttendeeId;
        const { tileId, name } = roster[holdingRoomAttendeeId];

        return (
          <RemoteVideo
            key={`${holdingRoomAttendeeId}.${tileId}`}
            enabled
            bindVideoElement={(element: HTMLVideoElement | null) => {
              if (element) {
                // TODO make it so that videos don't shuffle and keep their index.
                // As it's written, we just render the videos in the order of the liveAttendeeIds list.
                // We are sending the liveAttendees list in a consistent order in that we always
                // add new people to the end of the list.
                tileId && chime?.audioVideo?.bindVideoElement(tileId, element);
              }
            }}
            unbindVideoElement={() => {
              tileId && chime?.audioVideo?.unbindVideoElement(tileId);
            }}
            name={isLocalUser ? translate('Video.meNameplate') : name}
            fullScreenVideo={fullScreenVideo}
          />
        );
      })}
    </VideoGrid>
  ) : (
    <Informational>{translate('HoldingRoomVideoGroup.noVideo')}</Informational>
  );
}

export default HoldingRoomVideoGroup;
