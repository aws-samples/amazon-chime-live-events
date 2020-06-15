import React, { useContext, useMemo, useEffect } from 'react';
import classNames from 'classnames/bind';
import { useLocation } from 'react-router-dom';

import { useLiveAttendees } from '../providers/LiveAttendeesProvider';
import AttendeeVideoGroup from './AttendeeVideoGroup';
import LiveMediaGroup from './LiveMediaGroup';
import LoadingSpinner from './LoadingSpinner';
import LocalVideo from './LocalVideo';
import Error from './Error';
import getMeetingStatusContext from '../context/getMeetingStatusContext';
import useRemoteMeetingCommands from '../hooks/useRemoteMeetingCommands';
import useMeetingMessaging from '../hooks/useMeetingMessaging';
import MeetingStatus from '../enums/MeetingStatus';
import useTranslate from '../hooks/useTranslate';
import LiveIndicator from './LiveIndicator';
import icons from '../constants/icons';
import Tooltip from './Tooltip';
import {
  useNotificationDispatch,
  Type as NotifType,
} from '../providers/NotificationProvider';
import { LiveRosterProvider } from './LiveRosterProvider';

import styles from './Attendee.css';
const cx = classNames.bind(styles);

interface Props {
  controls?: JSX.Element;
  fullScreenVideo?: boolean;
  showSelfView?: boolean;
  showLiveView?: boolean;
}

export default function Attendee({
  controls,
  fullScreenVideo,
  showSelfView = true,
  showLiveView = false,
}: Props) {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const location = useLocation();
  const isLiveEvent = useMemo(
    () => new URLSearchParams(location.search).get('liveEvent'),
    [location]
  );
  useRemoteMeetingCommands();
  useMeetingMessaging();
  const { isLocalUserLive } = useLiveAttendees();
  const translate = useTranslate();
  const notifDispatch = useNotificationDispatch();

  const onTryAgain = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (isLocalUserLive) {
      notifDispatch({ type: NotifType.PROMOTED_TO_LIVE });
    }
  }, [isLocalUserLive]);

  return (
    <div className={cx('attendee')}>
      {meetingStatus === MeetingStatus.Loading && <LoadingSpinner />}
      {meetingStatus === MeetingStatus.Failed && (
        <Error
          tryAgain
          onTryAgain={onTryAgain}
          errorMessage={translate('Attendee.meetingJoinFailed')}
        />
      )}
      {meetingStatus === MeetingStatus.Succeeded && (
        <div className={cx('left')}>
          <div
            className={cx('attendeeRemoteMedia', {
              fullScreenVideo,
            })}
          >
            {isLiveEvent || showLiveView ? (
              <LiveRosterProvider>
                <LiveMediaGroup theaterView />
              </LiveRosterProvider>
            ) : (
              <AttendeeVideoGroup showLocalTile={false} />
            )}
          </div>
          {showSelfView &&
            (isLiveEvent ? (
              <LiveIndicator
                position='bottom-right'
                className={cx('liveAttendeeLocalVideo')}
                isLive={isLocalUserLive}
              >
                <p className={cx('liveLocalVideoTitle')}>
                  {isLocalUserLive
                    ? translate('Attendee.youAreLive')
                    : translate('Attendee.youAreNotLive')}
                  {!isLocalUserLive && (
                    <Tooltip tooltip={translate('Attendee.notLiveHelp')}>
                      <i className={`${cx('helpIcon')} ${icons.HELP}`} />
                    </Tooltip>
                  )}
                </p>
                <LocalVideo />
              </LiveIndicator>
            ) : (
              <div className={cx('attendeeLocalVideo')}>
                <LocalVideo />
              </div>
            ))}
          <div className={cx('localControls')}>
            <div className={cx('controls')}>{controls}</div>
          </div>
        </div>
      )}
    </div>
  );
}
