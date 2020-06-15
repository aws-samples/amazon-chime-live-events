import React, { useContext, useState, useEffect } from 'react';
import classNames from 'classnames/bind';

import getOneOnOneAttendeeContext from '../../../../context/getOneOnOneAttendeeContext';
import useTranslate from '../../../../hooks/useTranslate';
import Informational from '../../../Informational';

import styles from './AttendeeStatus.css';
import { useLiveEventMessagingService } from '../../../../providers/LiveEventMessagesProvider';
import {
  LiveEventMessageType,
  LiveEventMessage,
  LiveEventJoinProgreesPayload,
} from '../../../../types/LiveEventMessages';
import { useMetaState } from '../../../../providers/MetaStateProvider';
const cx = classNames.bind(styles);

const AttendeeStatus = () => {
  const attendee = useContext(getOneOnOneAttendeeContext());
  const messagingService = useLiveEventMessagingService();
  const translate = useTranslate();
  const initialMessage = translate('AttendeeDetails.WaitingForAttendee');
  const [infoMessage, setInfoMessage] = useState(initialMessage);
  const metaState = useMetaState();

  useEffect(() => {
    const cb = (msg: LiveEventMessage) => {
      if (msg.type === LiveEventMessageType.ATTENDEE_PROGESS) {
        const { stepCompeted } = msg.payload as LiveEventJoinProgreesPayload;
        setInfoMessage(translate(`AttendeeDetails.${stepCompeted}`));
      }
    };
    messagingService?.subscribeToMessageUpdate(cb);
    return () => {
      messagingService?.unsubscribeFromMessageUpdate(cb);
    };
  }, [initialMessage, messagingService, translate]);

  useEffect(() => {
    setInfoMessage(initialMessage);
  }, [initialMessage, metaState.oneOnOneMeetingId]);

  return attendee ? (
    <h2 className={cx('header')}>
      {translate('AttendeeDetails.SpeakingToAttendee', {
        attendeeName: attendee.name,
      })}
    </h2>
  ) : (
    <Informational>{infoMessage}</Informational>
  );
};

export default AttendeeStatus;
