import React from 'react';
import classNames from 'classnames/bind';

import ButtonGroup from '../../ButtonGroup';
import Portal from '../../Portal';
import MuteButton from '../MuteButton';
import VideoButton from '../VideoButton';
import VolumeButton from '../VolumeButton';
import { MeetingAudio } from '../../../providers/MetaStateProvider/state';
import ControlLabel from '../ControlLabel';
import { ONE_ON_ONE_CONTROL_PORTAL } from '..';
import useTranslate from '../../../hooks/useTranslate';

import styles from './OneOnOneLocalControls.css';
const cx = classNames.bind(styles);

const LocalUserControls: React.FC = () => {
  const message = useTranslate('Controls.oneOnOneLabel');

  return (
    <Portal rootId={ONE_ON_ONE_CONTROL_PORTAL}>
      <ControlLabel>{message}</ControlLabel>
      <ButtonGroup className={cx('one-on-one')} stacked>
        <MuteButton />
        <VideoButton />
        <VolumeButton source={MeetingAudio.ONE_ON_ONE} />
      </ButtonGroup>
    </Portal>
  );
};

export default LocalUserControls;
