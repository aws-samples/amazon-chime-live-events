import React, { useContext, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';

import getChimeContext from '../../context/getChimeContext';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import { useContentShareState } from '../../providers/ContentShareProvider';

import styles from './ContentShare.css';
const cx = classNames.bind(styles);

interface Props {
  className?: string;
}

const ContentShare: React.FC<Props> = ({ className }) => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { isSomeoneSharing, activeContentTileId } = useContentShareState();
  const videoEl = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoEl.current || !activeContentTileId) {
      return;
    }

    chime?.audioVideo?.bindVideoElement(activeContentTileId, videoEl.current);
  }, [activeContentTileId]);

  return (
    <div
      className={cx('contentWrapper', className, {
        active: isSomeoneSharing,
      })}
    >
      <video className={cx('contentVideo')} ref={videoEl}></video>
    </div>
  );
};

export default ContentShare;
