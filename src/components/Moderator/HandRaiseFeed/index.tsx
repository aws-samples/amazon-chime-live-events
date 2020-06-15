import React from 'react';
import classNames from 'classnames/bind';

import MessageFeed from './MessageFeed';
import QueueFeed from './QueueFeed';

import styles from './HandRaiseFeed.css';
const cx = classNames.bind(styles);

export const HandRaiseFeed: React.FC = () => {
  return (
    <div className={cx('wrapper')}>
      <QueueFeed className={cx('queue-wrapper')} />
      <MessageFeed className={cx('nonqueue-wrapper')} />
    </div>
  );
};
