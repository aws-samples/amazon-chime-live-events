import React, { useContext } from 'react';

import useTranslate from '../../hooks/useTranslate';
import usePromotion from '../../hooks/controls/usePromotion';
import BaseControlButton from './BaseControlButton';
import { useLiveAttendees } from '../../providers/LiveAttendeesProvider';
import getChimeContext from '../../context/getChimeContext';
import icons from '../../constants/icons';

const PromoteButton: React.FC = () => {
  const { isLocalUserLive } = useLiveAttendees();
  const chime = useContext(getChimeContext());
  const localUserId = chime?.configuration?.credentials?.externalUserId;
  const { onClick, isLoading } = usePromotion({
    liveEventAttendeeId: localUserId,
    isLocalUser: true,
    isOnAir: isLocalUserLive,
  });
  const message = useTranslate(
    isLocalUserLive ? 'Controls.demoteSelf' : 'Controls.promoteSelf'
  );

  return (
    <BaseControlButton
      pulse
      active={isLocalUserLive}
      message={message}
      onClick={onClick}
      icon={icons.BROADCAST}
      isLoading={isLoading}
    />
  );
};

export default PromoteButton;
