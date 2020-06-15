import { VideoTileState } from 'amazon-chime-sdk-js';
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { FormattedMessage } from 'react-intl';

import getChimeContext from '../context/getChimeContext';
import getRosterContext from '../context/getRosterContext';
import RemoteVideo from './RemoteVideo';
import VideoGrid from './VideoGrid';
import Informational from './Informational';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import LocalVideo from './LocalVideo';
import { useLocalTileState } from '../providers/LocalTileProvider';
import { useLiveAttendees } from '../providers/LiveAttendeesProvider';

const MAX_REMOTE_VIDEOS = 16;

interface Props {
  showLocalTile?: boolean;
}

const AttendeeVideoGroup: React.FC<Props> = ({ showLocalTile = true }) => {
  const isMountedRef = useRef(false);
  const { isSharing } = useLocalTileState();
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const roster = useContext(getRosterContext());
  const [visibleIndices, setVisibleIndices] = useState<{
    [index: string]: { boundAttendeeId: string };
  }>({});
  const videoElements: HTMLVideoElement[] = [];
  const tiles: { [index: number]: number } = {};
  const { liveAttendeeIds, isLocalUserLive } = useLiveAttendees();

  const acquireVideoIndex = (tileId: number): number => {
    for (let index = 0; index < MAX_REMOTE_VIDEOS; index += 1) {
      if (tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index < MAX_REMOTE_VIDEOS; index += 1) {
      if (!(index in tiles)) {
        tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  };

  const releaseVideoIndex = (tileId: number): number => {
    for (let index = 0; index < MAX_REMOTE_VIDEOS; index += 1) {
      if (tiles[index] === tileId) {
        delete tiles[index];
        return index;
      }
    }
    return -1;
  };

  const numberOfVisibleIndices = Object.keys(visibleIndices).reduce<number>(
    (result: number, key: string) => result + (visibleIndices[key] ? 1 : 0),
    0
  );

  const size = numberOfVisibleIndices + (showLocalTile && isSharing ? 1 : 0);

  useEffect(() => {
    isMountedRef.current = true;
    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!isMountedRef.current) {
          return;
        }
        if (
          !tileState.boundAttendeeId ||
          tileState.localTile ||
          !tileState.tileId ||
          tileState.isContent
        ) {
          return;
        }
        const index = acquireVideoIndex(tileState.tileId);
        chime?.audioVideo?.bindVideoElement(
          tileState.tileId,
          videoElements[index]
        );
        setVisibleIndices(previousVisibleIndices => ({
          ...previousVisibleIndices,
          [index]: {
            boundAttendeeId: tileState.boundAttendeeId,
          },
        }));
      },
      videoTileWasRemoved: (tileId: number): void => {
        if (!isMountedRef.current) {
          return;
        }
        const index = releaseVideoIndex(tileId);
        setVisibleIndices(previousVisibleIndices => ({
          ...previousVisibleIndices,
          [index]: null,
        }));
      },
    };
    chime?.audioVideo?.addObserver(observer);

    return () => {
      isMountedRef.current = false;
      chime?.audioVideo?.removeObserver(observer);
    };
  }, []);

  return (
    <VideoGrid size={size}>
      {size === 0 && (
        <Informational>
          <FormattedMessage id='RemoteVideoGroup.noVideo' />
        </Informational>
      )}
      {Array.from(Array(MAX_REMOTE_VIDEOS).keys()).map((key, index) => {
        const visibleIndex = visibleIndices[index];
        let rosterAttendee;
        let live = false;
        if (visibleIndex && roster) {
          rosterAttendee = roster[visibleIndex.boundAttendeeId];
          if (rosterAttendee && liveAttendeeIds.indexOf(rosterAttendee.id) !== - 1) {
            live=true
          }
        }
        return (
          <RemoteVideo
            key={key}
            enabled={!!visibleIndex}
            videoElementRef={useCallback((element: HTMLVideoElement | null) => {
              if (element) {
                videoElements[index] = element;
              }
            }, [])}
            name={rosterAttendee?.name}
            fullScreenVideo
            isLive={live}
          />
        );
      })}
      {showLocalTile && <LocalVideo fill nameplate isLive={isLocalUserLive}/>}
    </VideoGrid>
  );
};

export default AttendeeVideoGroup;
