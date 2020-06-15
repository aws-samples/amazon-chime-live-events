import React, { useEffect, createRef } from 'react';
import classNames from 'classnames/bind';

import useDynamicFontSize from '../hooks/useDynamicFontSize';
import LiveIndicator from './LiveIndicator';

import styles from './RemoteVideo.css';
const cx = classNames.bind(styles);

type Position = 'top' | 'bottom';

type Props = {
  enabled: boolean;
  name?: string;
  fullScreenVideo?: boolean;
  className?: string;
  isLive?: boolean;
  // videoElementRef is used in the non-'live' meetings
  videoElementRef?: (instance: HTMLVideoElement | null) => void;
  // bindVideoElement is used for the 'live' meetings
  bindVideoElement?: (instance: HTMLVideoElement | null) => void;
  unbindVideoElement?: () => void;
  nameplatePosition?: Position;
  tileId?: number;
};

export default function RemoteVideo(props: Props) {
  const {
    isLive = false,
    enabled,
    className,
    videoElementRef,
    name = '',
    tileId,
    fullScreenVideo,
    bindVideoElement,
    unbindVideoElement,
    nameplatePosition = 'bottom',
  } = props;
  const containerRef = createRef<HTMLDivElement>();
  const videoRef = React.createRef<HTMLVideoElement>();
  const fontSize = useDynamicFontSize(containerRef);

  useEffect(() => {
    bindVideoElement && bindVideoElement(videoRef.current);
    return unbindVideoElement;
  }, [tileId]);

  return (
    <div
      ref={containerRef}
      className={cx('remoteVideo', className, {
        enabled,
        fullScreenVideo,
      })}
    >
      <video muted ref={videoElementRef || videoRef} className={styles.video} />
      {name && (
        <div
          style={{ fontSize }}
          className={cx('nameplate', `nameplate--${nameplatePosition}`)}
        >
          {name}
        </div>
      )}
      {isLive && <LiveIndicator />}
    </div>
  );
}
