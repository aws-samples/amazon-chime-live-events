import React from 'react';

import {
  useMetaDispatch,
  useMetaState,
} from '../../providers/MetaStateProvider';
import { Types, MeetingAudio } from '../../providers/MetaStateProvider/state';
import BaseControlButton from './BaseControlButton';
import useTranslate from '../../hooks/useTranslate';
import icons from '../../constants/icons';

interface Props {
  source: MeetingAudio;
}

const getLabel = (isActive: boolean, isLiveEvent: boolean) => {
  if (isActive) {
    return isLiveEvent
      ? 'Controls.disableLiveVolume'
      : 'Controls.disable1on1Volume';
  }

  return isLiveEvent
    ? 'Controls.enableLiveVolume'
    : 'Controls.enable1on1Volume';
};

const VolumeButton: React.FC<Props> = ({ source }) => {
  const dispatch = useMetaDispatch();
  const { activeAudio } = useMetaState();
  const isActive = activeAudio === source;
  const contentId = getLabel(isActive, source === MeetingAudio.LIVE_EVENT);
  const message = useTranslate(contentId);

  const handleClick = () => {
    dispatch({ type: Types.MEETING_AUDIO_CHANGED, payload: source });
  };

  return (
    <BaseControlButton
      message={message}
      active={isActive}
      onClick={handleClick}
      icon={isActive ? icons.VOLUME_ON : icons.VOLUME_OFF}
    />
  );
};

export default VolumeButton;
