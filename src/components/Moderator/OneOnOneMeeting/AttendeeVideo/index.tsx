import React, { useContext, useEffect, useRef, useState } from 'react';
import { VideoTileState } from 'amazon-chime-sdk-js';
import classNames from 'classnames/bind';

import RemoteVideo from '../../../RemoteVideo';
import getChimeContext from '../../../../context/getChimeContext';
import { ChimeSdkWrapper } from '../../../../providers/ChimeProvider';
import getOneOnOneAttendeeContext from '../../../../context/getOneOnOneAttendeeContext';

import styles from './AttendeeVideo.css';
const cx = classNames.bind(styles);

const AttendeeVideo = () => {
  const attendee = useContext(getOneOnOneAttendeeContext());
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const [activeTileId, setActiveTileId] = useState<number | null>(null);

  useEffect(() => {
    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (
          !tileState.boundAttendeeId ||
          tileState.localTile ||
          !tileState.tileId
        ) {
          return;
        }

        setActiveTileId(tileState.tileId);
        videoEl.current &&
          chime?.audioVideo?.bindVideoElement(
            tileState.tileId,
            videoEl.current
          );
      },
    };

    chime?.audioVideo?.addObserver(observer);
    return () => chime?.audioVideo?.removeObserver(observer);
  }, []);

  useEffect(() => {
    const observer = {
      videoTileWasRemoved: (tileId: number) => {
        if (activeTileId === tileId) {
          setActiveTileId(null);
        }
      },
    };

    chime?.audioVideo?.addObserver(observer);
    return () => chime?.audioVideo?.removeObserver(observer);
  }, [activeTileId]);

  return activeTileId ? (
    <RemoteVideo
      className={cx('remoteVideo')}
      videoElementRef={ref => {
        videoEl.current = ref;
      }}
      name={attendee?.name}
      nameplatePosition='top'
      enabled
    />
  ) : null;
};

export default AttendeeVideo;
