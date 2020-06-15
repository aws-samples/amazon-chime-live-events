import React from 'react';
import className from 'classnames/bind';

import {
  useMetaDispatch,
  useMetaState,
} from '../../../providers/MetaStateProvider';
import {
  Types,
  MeetingAudio,
} from '../../../providers/MetaStateProvider/state';
import icons from '../../../constants/icons';

import styles from './VolumeButton.css';
const cx = className.bind(styles);

interface Props {
  className?: string;
  source: MeetingAudio;
}

const VolumeButton: React.FC<Props> = ({ className, source }) => {
  const dispatch = useMetaDispatch();
  const { activeAudio } = useMetaState();
  const active = activeAudio === source;

  return (
    <button
      className={cx('button', className, { active })}
      onClick={() =>
        dispatch({ type: Types.MEETING_AUDIO_CHANGED, payload: source })
      }
      aria-label='Toggle audio'
    >
      <i className={cx('icon', active ? icons.VOLUME_ON : icons.VOLUME_OFF)} />
    </button>
  );
};

export default VolumeButton;
