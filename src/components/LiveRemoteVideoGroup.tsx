import React, { useContext } from 'react';

import getChimeContext from '../context/getChimeContext';
import RemoteVideo from './RemoteVideo';
import Informational from './Informational';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import VideoGrid from './VideoGrid';
import useTranslate from '../hooks/useTranslate';
import { useLiveRoster } from './LiveRosterProvider';
import { useLiveAttendees } from '../providers/LiveAttendeesProvider';
import { useLocalTileState } from '../providers/LocalTileProvider';

interface Props {
  fullScreenVideo?: boolean;
  showLiveBadges?: boolean;
  className?: string;
  showYouAreLiveBadge?: boolean;
  hideInformational?: boolean;
  showLocalTile?: boolean;
}

export default function LiveRemoteVideoGroup({
  fullScreenVideo,
  showLiveBadges,
  className,
  showLocalTile = false,
  hideInformational = false,
}: Props) {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const translate = useTranslate();
  const roster = useLiveRoster();
  const { isLocalUserLive, liveAttendeeIds } = useLiveAttendees();
  const { isSharing, localTileId } = useLocalTileState();

  const us = chime?.configuration?.credentials?.attendeeId;
  const weHaveVideo = chime?.audioVideo?.hasStartedLocalVideoTile();
  const size =
    !isLocalUserLive || showLocalTile
      ? liveAttendeeIds.length
      : liveAttendeeIds.length - 1;

  return (
    <>
      {size ? (
        <VideoGrid className={className} size={size}>
          {liveAttendeeIds.map(liveId => {
            const isLocalUser = us === liveId;
            if (isLocalUser && !showLocalTile) {
              return;
            }

            let { name, tileId } = roster[liveId] || {};
            if (isLocalUser && isSharing && localTileId) {
              tileId = localTileId;
            }

            return tileId ? (
              <RemoteVideo
                key={`${liveId}.${tileId}`}
                enabled={!!tileId}
                bindVideoElement={(element: HTMLVideoElement | null) => {
                  if (!element || !tileId) {
                    return;
                  }

                  // TODO make it so that videos don't shuffle and keep their index.
                  // As it's written, we just render the videos in the order of the liveAttendeeIds list.
                  // We are sending the liveAttendees list in a consistent order in that we always
                  // add new people to the end of the list.
                  chime?.audioVideo?.bindVideoElement(tileId, element);
                }}
                unbindVideoElement={() => {
                  tileId && chime?.audioVideo?.unbindVideoElement(tileId);
                }}
                tileId={tileId}
                name={isLocalUser ? translate('Video.meNameplate') : name}
                fullScreenVideo={fullScreenVideo}
                isLive={showLiveBadges}
              />
            ) : (
              <Informational withContainer key={`${liveId}.noVideo`}>
                {translate(
                  isLocalUser
                    ? 'RemoteVideoGroup.localNoVideo'
                    : 'RemoteVideoGroup.attendeeNoVideo',
                  {
                    attendeeName: name,
                  }
                )}
              </Informational>
            );
          })}
        </VideoGrid>
      ) : (
        !hideInformational && (
          <Informational>
            {translate(
              isLocalUserLive && weHaveVideo
                ? 'RemoteVideoGroup.noOtherVideo'
                : 'RemoteVideoGroup.noVideo'
            )}
          </Informational>
        )
      )}
    </>
  );
}
