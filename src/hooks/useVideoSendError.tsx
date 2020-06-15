import { useContext, useEffect } from 'react';

import getChimeContext from '../context/getChimeContext';
import MeetingStatus from '../enums/MeetingStatus';
import {
  useNotificationDispatch,
  Type,
  Variant,
} from '../providers/NotificationProvider';
import useTranslate from './useTranslate';

const useVideoSendError = (meetingStatus: MeetingStatus) => {
  const chime = useContext(getChimeContext());
  const dispatch = useNotificationDispatch();
  const message = useTranslate('Error.videoMaxCapacity');

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const observer = {
      videoSendDidBecomeUnavailable: () => {
        dispatch({
          type: Type.ADD,
          payload: {
            variant: Variant.ERROR,
            message,
          },
        });
      },
    };

    chime?.audioVideo?.addObserver(observer);

    return () => chime?.audioVideo?.removeObserver(observer);
  }, [meetingStatus]);
};

export default useVideoSendError;
