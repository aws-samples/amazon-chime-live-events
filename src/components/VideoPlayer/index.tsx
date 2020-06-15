import React, { FC, useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import classNames from 'classnames/bind';
require('!style-loader!css-loader!video.js/dist/video-js.css');

import Informational from '../Informational';
import useTranslate from '../../hooks/useTranslate';
import { getURLs } from '../../utils/configuredURLs';

import styles from './VideoPlayer.css';
const cx = classNames.bind(styles);

const { broadcasts } = getURLs();

const videoJSOptions = {
  autoplay: 'muted',
  fluid: false,
  controls: true,
  userActions: { hotkeys: true },
  liveui: true,
};

interface VideoPlayerProps {
  className?: string;
}

const VideoPlayer: FC<VideoPlayerProps> = () => {
  const translate = useTranslate();
  const playerRef = useRef() as React.MutableRefObject<HTMLVideoElement>;

  const [error, setError] = useState(false);

  useEffect(() => {
    const player = videojs(playerRef.current, videoJSOptions, () => {
      player.src(broadcasts.HLS);
    });

    player.on('error', (error: any) => {
      console.log('Error:', error);
      setError(true);
    });

    const controlBar = player.getChild('ControlBar');
    const pipButton = controlBar?.getChild('PictureInPictureToggle');
    pipButton?.addClass('vjs-hidden');
    return () => {
      player.dispose();
    };
  }, []);

  return error ? (
    <Informational>
      {translate('VideoPlayer.videoStreamUnavailable')}
    </Informational>
  ) : (
    <div>
      <div data-vjs-player>
        <video ref={playerRef} className={`${cx('player')} video-js`} />
      </div>
    </div>
  );
};

export default VideoPlayer;
