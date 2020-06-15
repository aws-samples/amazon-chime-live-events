import React from 'react';
import classNames from 'classnames/bind';

import styles from './ControlsBar.css';
const cx = classNames.bind(styles);

export const ONE_ON_ONE_CONTROL_PORTAL = 'one-on-one-portal';
export const LIVE_CONTROLS_PORTAL = 'live-controls-portal';

const ControlsBar = () => (
  <div className={cx('controls-bar')}>
    <div className={cx('live')} id={LIVE_CONTROLS_PORTAL} />
    <div className={cx('one-on-one')} id={ONE_ON_ONE_CONTROL_PORTAL} />
  </div>
);

export default ControlsBar;
