import React from 'react';
const { randomUUID } = require('crypto');

import {
  useLiveEventMessages,
  useLiveEventMessagingService,
  useLiveEventMessagesDispatch,
  Type,
} from '../../../providers/LiveEventMessagesProvider';
import {
  LiveEventMessageType,
  HandRaiseMessage,
} from '../../../types/LiveEventMessages';
import {
  useLiveEventContext,
  LiveEventSession,
} from '../../../providers/LiveEventProvider';
import {
  useNotificationDispatch,
  Type as NotifType,
} from '../../../providers/NotificationProvider';
import {
  RemoveMessageEventType,
  RemoveMessagePayload,
} from '../../../providers/LiveEventMessagesProvider/state';
import Header from '../Header';
import FeedList from './FeedList';
import useTranslate from '../../../hooks/useTranslate';
import { useMetaDispatch } from '../../../providers/MetaStateProvider';
import { VerifiedParticipant } from '../../../types/LiveEventParticipants';
import { Types as MetaTypes } from '../../../providers/MetaStateProvider/state';
import { useVerifiedParticipantContext } from '../../../providers/VerifiedParticipantProvider';

interface Props {
  className: string;
}

const QueueFeed: React.FC<Props> = ({ className }) => {
  const participant: VerifiedParticipant = useVerifiedParticipantContext();
  const liveEvent: LiveEventSession = useLiveEventContext();
  const { queuedMessages = [] as HandRaiseMessage[] } = useLiveEventMessages();
  const metaDispatch = useMetaDispatch();
  const translate = useTranslate();
  const messagingService = useLiveEventMessagingService();
  const notifDispatch = useNotificationDispatch();
  const dispatch = useLiveEventMessagesDispatch();
  const { liveEventId } = liveEvent;
  const { attendeeId, attendeeName } = participant;
  const title = translate('FeedList.startMeetingButton');
  const subtitle = translate('FeedList.removeFromQueue');

  const startMeeting = (targetAttendeeId: string) => {
    if (!targetAttendeeId || !attendeeId || !liveEventId) {
      console.error('Needs targetAttendeeId, attendeeId, liveEventId: ', {
        targetAttendeeId,
        attendeeId,
        liveEventId,
      });
      return;
    }

    console.info(
      `Attempting to start meeting with viewer ID: ${targetAttendeeId}.`
    );

    const meetingId = randomUUID();
    const message = {
      type: LiveEventMessageType.JOIN_MEETING,
      payload: {
        attendeeId,
        liveEventId,
        meetingId,
        targetAttendeeId,
      },
    };

    const onError = (error: string) => {
      console.error(
        `Error joining 1:1 with attendee ${targetAttendeeId}`,
        error
      );
      metaDispatch({ type: MetaTypes.ONE_ON_ONE_ENDED });
      notifDispatch({
        type: NotifType.ONE_ON_ONE_JOIN_ERROR,
        payload: { name: attendeeName },
      });
    };

    const onSuccess = () => {
      console.info(
        `Successfully connected to 1:1 with viewer ID: ${targetAttendeeId}.`
      );
    };

    messagingService?.sendMessage(message);

    metaDispatch({
      type: MetaTypes.START_ONE_ON_ONE,
      payload: { meetingId, onError, onSuccess, targetAttendeeId },
    });
  };

  const handleRemove = (id: string) => {
    const payload: RemoveMessagePayload = {
      attendeeId: id,
      event: RemoveMessageEventType.MODERATOR_REMOVE_CLICK,
    };

    dispatch?.({
      type: Type.REMOVE_QUEUED_MESSAGE,
      payload,
    });

    const message = {
      type: LiveEventMessageType.UPDATE_HAND_RAISE,
      payload: {
        attendeeId: id,
      },
    };
    messagingService?.sendMessage(message);
  };

  return (
    <>
      <Header>{translate('HandRaiseFeed.queuedViewersTitle')}</Header>
      <FeedList
        isQueued
        title={title}
        subtitle={subtitle}
        className={className}
        messages={queuedMessages as HandRaiseMessage[]}
        onPromote={startMeeting}
        onRemove={handleRemove}
      />
    </>
  );
};

export default QueueFeed;
