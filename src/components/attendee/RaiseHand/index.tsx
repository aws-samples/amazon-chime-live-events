import React, { useState, useEffect, useContext } from 'react';
import classNames from 'classnames/bind';
import { useHistory } from 'react-router';

import HandForm from './HandForm';
import CloseButton from '../../CloseButton';
import IconButton from '../../IconButton';
import {
  LiveEventSession,
  useLiveEventContext,
} from '../../../providers/LiveEventProvider';
import {
  DEFAULT_WEB_SOCKET_TIMEOUT_MS,
  useLiveEventMessagingService,
} from '../../../providers/LiveEventMessagesProvider';
import { LiveEventMessageType } from '../../../types/LiveEventMessages';
import routes from '../../../constants/routes';
import getCredentialsContext from '../../../context/getCredentialsContext';
import { useActiveParticipantContext } from '../../../providers/ActiveParticipantProvider';
import getLiveEventParticipantContext from '../../../context/getLiveEventParticipantContext';
import {
  useNotificationDispatch,
  Type as NotifType,
} from '../../../providers/NotificationProvider';
import useIsMounted from '../../../hooks/useIsMounted';
import icons from '../../../constants/icons';
import IncomingCallModal from './IncomingCallModal';
import useTranslate from '../../../hooks/useTranslate';

import styles from './RaiseHand.css';
import { AttendeeMeetingProgress } from '../../../enums/AtttendeeMeetingProgress';
const cx = classNames.bind(styles);

const RaiseHand = () => {
  const liveEvent: LiveEventSession = useLiveEventContext();
  const credentials = useContext(getCredentialsContext());
  const [isRaised, setIsRaised] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const isMounted = useIsMounted();
  const history = useHistory();
  const messagingService = useLiveEventMessagingService();
  const activeParticipant = useActiveParticipantContext();
  const notifDispatch = useNotificationDispatch();
  const translate = useTranslate();

  const { attendeeId } = activeParticipant;
  const { liveEventId } = liveEvent;

  const [attendeeName, setAttendeeName] = useState<string | undefined>(
    () => activeParticipant.attendeeName || undefined
  );

  // This is the only participant provider where you can configure the name,
  // so we will use this to provide the name form field for hand raises.
  const liveEventParticipant = useContext(getLiveEventParticipantContext());

  const handleLiveEventMessage = (message: any) => {
    if (message.type === LiveEventMessageType.JOIN_MEETING) {
      const meetingId = message?.payload?.meetingId;
      const accessKey = message?.payload?.accessKey;

      console.log(
        `Received moderator message for attendee to join meeting: ${meetingId} with ${accessKey} key.`
      );

      if (!liveEventId || !meetingId || !accessKey || !attendeeId) {
        console.error(
          `Missing AttendeeId ${attendeeId} or LiveEventId ${liveEventId} or accessKey ${accessKey} or mettingId ${meetingId}`
        );
        notifDispatch({ type: NotifType.ERROR_ENTERING_EVENT_ATTENDEE });
        setIsRaised(false);
      }

      credentials.authenticate(liveEventId, accessKey, attendeeId).catch(e => {
        console.error('Error joining meeting: ', e);
        notifDispatch({ type: NotifType.ERROR_ENTERING_EVENT_ATTENDEE });
        setIsRaised(false);
      });

      setMeetingId(meetingId);
    }
  };

  const handleSubmit = async (question: string, name: string) => {
    if (isRaised) {
      return;
    }

    if (!attendeeId || !liveEventId || !name) {
      console.log(
        `Missing AttendeeId ${attendeeId}, LiveEventId ${liveEventId}, or attendeeName ${name}`
      );
      return;
    }

    try {
      await messagingService?.joinLiveEventMessaging();
      messagingService?.sendMessage({
        type: LiveEventMessageType.RAISE_HAND,
        payload: {
          handRaised: true,
          attendeeId,
          liveEventId,
          name,
          message: question,
        },
      });
      messagingService?.subscribeToMessageUpdate(handleLiveEventMessage);

      setIsRaised(true);

      setAttendeeName(name);
      liveEventParticipant.setAttendeeName(name);
    } catch (e) {
      setIsRaised(false);
      console.error('Error encountered sending hand raise message:', e);
      notifDispatch({ type: NotifType.ERROR_RAISING_HAND });
    }

    setTimeout(() => {
      if (isMounted.current) {
        setIsOpen(false);
      }
    }, 7000);
  };

  useEffect(() => {
    if (credentials.isAuthenticated && meetingId && attendeeName) {
      setShowIncomingCall(true);
    } else {
      console.log(`Attendee not authenticated!`);
    }
  }, [attendeeName, credentials, meetingId]);

  const handleAccept = () => {
    messagingService?.notifyModerator(AttendeeMeetingProgress.INVITE_ACCEPTED);
    const url = `${routes.DRESSING_ROOM}?title=${meetingId}&name=${attendeeName}&region=us-east-1`;
    history.replace(url);
  };

  const handleDecline = () => {
    setIsRaised(false);
    setShowIncomingCall(false);
    messagingService?.liveEventSocket?.close(DEFAULT_WEB_SOCKET_TIMEOUT_MS);
    console.log('Closing hand raising web socket');
  };

  return (
    <>
      <div className={cx('wrapper', { isOpen, isRaised })}>
        <div className={cx('menu')}>
          <CloseButton onClick={() => setIsOpen(false)} />
          {isRaised ? (
            <>
              <h2 className={cx('menu-header')}>
                <i className={cx('success-icon', icons.CHECKMARK)} />
                {translate('RaiseHand.yourHandIsRaised')}
              </h2>
              <p className={cx('help-text')}>
                {translate('RaiseHand.helpText')}
              </p>
            </>
          ) : (
            <>
              <h2 className={cx('menu-header')}>
                {translate('RaiseHand.askAQuestion')}
              </h2>
              <HandForm
                attendeeId={attendeeId}
                liveEventId={liveEventId}
                isRaised={isRaised}
                onSubmit={handleSubmit}
                attendeeName={attendeeName}
              />
            </>
          )}
          <div className={cx('arrow')} />
        </div>
        <IconButton
          aria-haspopup='true'
          aria-expanded={isOpen}
          aria-label='Raise hand'
          onClick={() => setIsOpen(open => !open)}
          className={cx('hand-button')}
          icon={icons.HAND_RAISE}
        />
      </div>
      {showIncomingCall && (
        <IncomingCallModal onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </>
  );
};

export default RaiseHand;
