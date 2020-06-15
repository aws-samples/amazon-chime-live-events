import React from 'react';
import classNames from 'classnames/bind';

import { HandRaiseFeed } from '../HandRaiseFeed';

import styles from './Queue.css';

const cx = classNames.bind(styles);

const Queue: React.FC = () =>  (
  <div className={cx('Queue')}>
    <HandRaiseFeed />
  </div>
);

export default Queue;
