import { useEffect, useState, useContext } from 'react';
import { VideoTileState } from 'amazon-chime-sdk-js';

import { VideoStatus } from '../../types/VideoStatus';
import getChimeContext from '../../context/getChimeContext';
import { ChimeSdkWrapper } from '../../providers/ChimeProvider';
import getMeetingStatusContext from '../../context/getMeetingStatusContext';
import MeetingStatus from '../../enums/MeetingStatus';

const useLocalVideoStatus = () => {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const [status, setStatus] = useState(VideoStatus.Disabled);

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    if (chime?.audioVideo?.hasStartedLocalVideoTile()) {
      setStatus(VideoStatus.Enabled);
    }

    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.localTile || !tileState.tileId || tileState.isContent) {
          return;
        }

        if (tileState.active && status !== VideoStatus.Enabled) {
          setStatus(VideoStatus.Enabled);
        } else if (!tileState.active && status === VideoStatus.Enabled) {
          setStatus(VideoStatus.Disabled);
        }
      },
      videoSendDidBecomeUnavailable: () => {
        if (status === VideoStatus.Enabled) {
          chime?.audioVideo?.stopLocalVideoTile();
          setStatus(VideoStatus.Disabled);
        }
      },
    };

    chime?.audioVideo?.addObserver(observer);
    return () => chime?.audioVideo?.removeObserver(observer);
  }, [meetingStatus, status]);

  return {
    status,
    setStatus,
  };
};

export default useLocalVideoStatus;
