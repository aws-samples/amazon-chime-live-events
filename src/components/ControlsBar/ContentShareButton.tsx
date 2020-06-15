import React, { useContext } from 'react';

import {
  useContentShareApi,
  useContentShareState,
} from '../../providers/ContentShareProvider';
import getChimeContext from '../../context/getChimeContext';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import BaseControlButton from './BaseControlButton';
import useTranslate from '../../hooks/useTranslate';
import icons from '../../constants/icons';

interface Props {
  withPulse?: boolean;
}

const ContentShareButton: React.FC<Props> = ({ withPulse = false }) => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const contentShareApi = useContentShareApi();
  const { isLocalUserSharing, isLocalShareLoading } = useContentShareState();
  const message = useTranslate(
    isLocalUserSharing
      ? 'Controls.stopShareTooltip'
      : 'Controls.startShareTooltip'
  );

  return (
    <BaseControlButton
      message={message}
      active={isLocalUserSharing}
      pulse={withPulse && isLocalUserSharing}
      isLoading={isLocalShareLoading}
      onClick={async () => {
        if (!chime?.audioVideo || isLocalShareLoading) {
          console.log('No audioVideo or in loading state');
          return;
        }

        if (isLocalUserSharing) {
          contentShareApi.stopContentShare();
        } else {
          contentShareApi.startContentShare();
        }
      }}
      icon={icons.LAPTOP}
    />
  );
};

export default ContentShareButton;
