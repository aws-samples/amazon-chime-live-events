import React from 'react';
import classNames from 'classnames/bind';

import AttendeeVideoGroup from '../../../AttendeeVideoGroup';
import { useContentShareState } from '../../../../providers/ContentShareProvider';
import ContentShare from '../../../ContentShare';

import styles from './SingleVideoFeed.css';
const cx = classNames.bind(styles);

const SingleVideoFeed = () => {
  const { isSomeoneSharing } = useContentShareState();

  const classes = cx('wrapper', {
    shareActive: isSomeoneSharing,
  });

  return (
    <div className={classes}>
      <ContentShare className={cx('content')} />
      <div className={cx('videos')}>
        <AttendeeVideoGroup />
      </div>
    </div>
  );
};

export default SingleVideoFeed;
