import React from 'react';

import BaseControlButton from './BaseControlButton';
import useLocalRealtimeAudio from '../../hooks/useLocalRealtimeAudio';
import useTranslate from '../../hooks/useTranslate';
import icons from '../../constants/icons';

interface Props {
  withPulse?: boolean;
  isLiveEvent?: boolean;
}

const getLabel = (muted: boolean, isLiveEvent?: boolean) => {
  if (muted) {
    return isLiveEvent ? 'Controls.unmuteLiveMic' : 'Controls.unmute1on1Mic';
  }
  return isLiveEvent ? 'Controls.muteLiveMic' : 'Controls.mute1on1Mic';
};

const MuteButton: React.FC<Props> = ({ withPulse = false, isLiveEvent }) => {
  const { toggleMute, muted } = useLocalRealtimeAudio();
  const contentId = getLabel(muted, isLiveEvent);
  const message = useTranslate(contentId);

  return (
    <BaseControlButton
      active={!muted}
      pulse={withPulse && !muted}
      message={message}
      onClick={toggleMute}
      icon={muted ? icons.MIC_DISABLED : icons.MIC}
    />
  );
};

export default MuteButton;
