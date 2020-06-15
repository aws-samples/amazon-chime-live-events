import React, { useContext } from 'react';

import getChimeContext from '../../context/getChimeContext';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import BaseControlButton from './BaseControlButton';
import { useLiveAttendees } from '../../providers/LiveAttendeesProvider';
import useTranslate from '../../hooks/useTranslate';
import icons from '../../constants/icons';
import useIsAtVideoCapacity from '../../hooks/useIsAtVideoCapacity';
import {
  useNotificationDispatch,
  Type,
  Variant,
} from '../../providers/NotificationProvider';
import {
  useLocalTileApi,
  useLocalTileState,
} from '../../providers/LocalTileProvider';

interface Props {
  withPulse?: boolean;
  isLiveEvent?: boolean;
}

const getLabel = (isActive: boolean, isLiveEvent?: boolean) => {
  if (isActive) {
    return isLiveEvent
      ? 'Controls.disableLiveVideo'
      : 'Controls.disable1on1Video';
  }
  return isLiveEvent ? 'Controls.enableLiveVideo' : 'Controls.enable1on1Video';
};

const VideoButton: React.FC<Props> = ({ withPulse = false, isLiveEvent }) => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { isLocalUserLive } = useLiveAttendees();
  const isAtVideoCapacity = useIsAtVideoCapacity();
  const notifDispatch = useNotificationDispatch();
  const translate = useTranslate();
  const { isSharing } = useLocalTileState();
  const contentId = getLabel(isSharing, isLiveEvent);
  const { startLocalVideoTile, stopLocalVideoTile } = useLocalTileApi();

  return (
    <BaseControlButton
      message={translate(contentId)}
      active={isSharing}
      pulse={withPulse && isLocalUserLive}
      onClick={async () => {
        if (isSharing) {
          stopLocalVideoTile();
        } else {
          if (isAtVideoCapacity) {
            notifDispatch({
              type: Type.ADD,
              payload: {
                message: translate('Controls.videoAtCapacity'),
                variant: Variant.ERROR,
              },
            });
            return;
          }

          try {
            if (!chime?.currentVideoInputDevice) {
              throw new Error('currentVideoInputDevice does not exist');
            }

            await chime?.chooseVideoInputDevice(chime?.currentVideoInputDevice);
            startLocalVideoTile();
          } catch (error) {
            console.error(error);
          }
        }
      }}
      icon={isSharing ? icons.VIDEO : icons.VIDEO_DISABLED}
    />
  );
};

export default VideoButton;
