import React from 'react';
import classNames from 'classnames/bind';

import HoldingRoomVideoGroup from './HoldingRoomVideoGroup';
import LiveMediaGroup from '../../LiveMediaGroup';
import useTranslate from '../../../hooks/useTranslate';
import { LiveRosterProvider } from '../../LiveRosterProvider';
import { useMetaState } from '../../../providers/MetaStateProvider';
import { HoldingRoomRosterProvider } from './HoldingRoomVideoGroup/HoldingRoomRosterProvider';

import styles from './LiveEventView.css';
const cx = classNames.bind(styles);

const SplitVideoFeed = () => {
  const translate = useTranslate();
  const state = useMetaState();

  return (
    <>
      <div className={cx('onAirAttendees')}>
        <h2>{translate('LiveEventView.liveMeetingTitle')}</h2>
        <LiveRosterProvider>
          <LiveMediaGroup showLocalTile showLiveBadges />
        </LiveRosterProvider>
      </div>
      <div
        className={cx('HoldingRoomVideoGroup', {
          minimized: !!state.oneOnOneMeetingId,
        })}
      >
        <h2>{translate('LiveEventView.holdingRoomVideosTitle')}</h2>
        <HoldingRoomRosterProvider>
          <HoldingRoomVideoGroup />
        </HoldingRoomRosterProvider>
      </div>
    </>
  );
};

export default SplitVideoFeed;
