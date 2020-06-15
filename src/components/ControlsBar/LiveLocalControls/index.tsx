import React from 'react';
import classNames from 'classnames/bind';

import ButtonGroup from '../../ButtonGroup';
import Portal from '../../Portal';
import MuteButton from '../MuteButton';
import VideoButton from '../VideoButton';
import ContentShareButton from '../ContentShareButton';
import PromoteButton from '../PromoteButton';
import VolumeButton from '../VolumeButton';
import { MeetingAudio } from '../../../providers/MetaStateProvider/state';
import ControlLabel from '../ControlLabel';
import useTranslate from '../../../hooks/useTranslate';
import { LIVE_CONTROLS_PORTAL } from '..';

import styles from './LiveLocalControls.css';
const cx = classNames.bind(styles);

const LocalUserControls: React.FC = () => {
  const message = useTranslate('Controls.liveLabel');

  return (
    <Portal rootId={LIVE_CONTROLS_PORTAL}>
      <ControlLabel>{message}</ControlLabel>
      <ButtonGroup className={cx('live-controls')} stacked>
        <PromoteButton />
        <MuteButton isLiveEvent withPulse />
        <VideoButton isLiveEvent withPulse />
        <ContentShareButton withPulse />
        <VolumeButton source={MeetingAudio.LIVE_EVENT} />
      </ButtonGroup>
    </Portal>
  );
};

export default LocalUserControls;
