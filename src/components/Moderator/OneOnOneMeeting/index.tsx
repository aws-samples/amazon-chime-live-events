import React, { useContext } from 'react';
import classNames from 'classnames/bind';

import getMeetingStatusContext from '../../../context/getMeetingStatusContext';
import OneOnOneLocalControls from '../../ControlsBar/OneOnOneLocalControls';
import useMeetingMessaging from '../../../hooks/useMeetingMessaging';
import MeetingStatus from '../../../enums/MeetingStatus';
import RemoteControls from './RemoteControls';
import AttendeeVideo from './AttendeeVideo';
import { useMetaState } from '../../../providers/MetaStateProvider';
import AttendeeStatus from './AttendeeStatus';
import { LocalTileProvider } from '../../../providers/LocalTileProvider';

import styles from './OneOnOneMeeting.css';
const cx = classNames.bind(styles);

const OneOnOneMeeting: React.FC = () => {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const state = useMetaState();
  useMeetingMessaging();

  return (
    <div
      className={cx('OneOnOneMeeting', { inactive: !state.oneOnOneMeetingId })}
    >
      {meetingStatus === MeetingStatus.Succeeded && (
        <>
          <LocalTileProvider>
            <OneOnOneLocalControls />
            <RemoteControls />
            <AttendeeVideo />
          </LocalTileProvider>
        </>
      )}
      <AttendeeStatus />
    </div>
  );
};

export default OneOnOneMeeting;
