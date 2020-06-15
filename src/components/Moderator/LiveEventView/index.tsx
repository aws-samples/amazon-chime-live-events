import React, { useContext } from 'react';
import classNames from 'classnames/bind';

import getMeetingStatusContext from '../../../context/getMeetingStatusContext';
import { useFeatures } from '../../../providers/FeatureProvider';
import MeetingStatus from '../../../enums/MeetingStatus';
import Header from '../Header';
import Roster from '../Roster';
import { useMetaState } from '../../../providers/MetaStateProvider';
import useMeetingMessaging from '../../../hooks/useMeetingMessaging';
import CenteredLoadingSpinner from '../../CenteredLoadingSpinner';
import LiveLocalControls from '../../ControlsBar/LiveLocalControls';
import useRemoteMeetingCommands from '../../../hooks/useRemoteMeetingCommands';
import Informational from '../../Informational';
import useTranslate from '../../../hooks/useTranslate';
import SingleFeed from './SingleVideoFeed';
import SplitVideoFeed from './SplitVideoFeed';

import styles from './LiveEventView.css';
const cx = classNames.bind(styles);

const LiveEventView: React.FC = () => {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const state = useMetaState();
  const translate = useTranslate();
  const { hideRoster, singleFeed } = useFeatures();
  useRemoteMeetingCommands();
  useMeetingMessaging();

  if (meetingStatus === MeetingStatus.Failed) {
    return (
      <div className={cx('meetingError')}>
        <Informational>
          <i className='fa fa-exclamation-triangle' />
          <br />
          {translate('LiveEventView.errorJoiningTalentMeeting')}
        </Informational>
      </div>
    );
  }
  return (
    <>
      <div
        className={cx('LiveEventView', {
          minimized: !!state.oneOnOneMeetingId,
          singleFeed,
        })}
      >
        {meetingStatus === MeetingStatus.Succeeded ? (
          <>
            <LiveLocalControls />
            {singleFeed ? <SingleFeed /> : <SplitVideoFeed />}
          </>
        ) : (
          <CenteredLoadingSpinner />
        )}
      </div>
      {!hideRoster && (
        <div className={cx('HoldingRoomRoster')}>
          <Header>{translate('LiveEventView.holdingRoomTitle')}</Header>
          {meetingStatus === MeetingStatus.Succeeded && <Roster />}
        </div>
      )}
    </>
  );
};

export default LiveEventView;
