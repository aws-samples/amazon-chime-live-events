import { VideoTileState } from 'amazon-chime-sdk-js';
import classNames from 'classnames/bind';
import React, { useContext, useEffect, useRef, useState } from 'react';

import getChimeContext from '../context/getChimeContext';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import useTranslate from '../hooks/useTranslate';
import useDynamicFontSize from '../hooks/useDynamicFontSize';

import styles from './LocalVideo.css';
import { useLocalTileState } from '../providers/LocalTileProvider';
import LiveIndicator from './LiveIndicator';
const cx = classNames.bind(styles);

interface Props {
  className?: string;
  fill?: boolean;
  nameplate?: boolean;
  isLive?: boolean;
}

const LocalVideo: React.FC<Props> = ({ className, fill, nameplate, isLive }) => {
  const [enabled, setEnabled] = useState(false);
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const videoElement = useRef(null);
  const name = useTranslate('Video.meNameplate');
  const containerRef = useRef(null);
  const fontSize = useDynamicFontSize(containerRef);
  const { isSharing } = useLocalTileState();

  useEffect(() => {
    chime?.audioVideo?.addObserver({
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (
          !tileState.boundAttendeeId ||
          !tileState.localTile ||
          !tileState.tileId ||
          !videoElement.current ||
          tileState.isContent
        ) {
          return;
        }
        chime?.audioVideo?.bindVideoElement(
          tileState.tileId,
          (videoElement.current as unknown) as HTMLVideoElement
        );
        setEnabled(tileState.active);
      },
    });
  }, []);

  return (
    <div
      style={{ fontSize }}
      ref={containerRef}
      className={cx('localVideo', className, {
        enabled: enabled && isSharing,
        fill,
      })}
    >
      <video muted ref={videoElement} className={cx('video')} />
      {nameplate && <p className={cx('nameplate')}>{name}</p>}
      {isLive && <LiveIndicator />}
    </div>
  );
};

export default LocalVideo;
