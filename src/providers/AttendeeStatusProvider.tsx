import React, { ReactNode, useEffect } from 'react';
import { useMetaDispatch, useMetaState } from './MetaStateProvider';
import {
  useNotificationDispatch,
  Type as NotificationType,
} from './NotificationProvider';
import { Types as MetaTypes } from './MetaStateProvider/state';
import {
  LiveEventMessage,
  LiveEventMessageType,
  HandRaiseMessage,
} from '../types/LiveEventMessages';
import {
  useLiveEventMessagingService,
  useLiveEventMessagesDispatch,
  useLiveEventMessages,
} from './LiveEventMessagesProvider';
import {
  RemoveMessageEventType,
  RemoveMessagePayload,
  Type as MsgType,
} from './LiveEventMessagesProvider/state';

type Props = {
  children: ReactNode;
};

const AttendeeStatusContext = React.createContext({});

export default function AttendeeStatusProvider({ children }: Props) {
  const metaDispatch = useMetaDispatch();
  const notifyDispatch = useNotificationDispatch();
  const liveEventMessagesDispatch = useLiveEventMessagesDispatch();
  const messagingService = useLiveEventMessagingService();
  const metaState = useMetaState();
  const { queuedMessages } = useLiveEventMessages();

  useEffect(() => {
    const cb = (msg: LiveEventMessage) => {
      if (msg.type === LiveEventMessageType.ATTENDEE_DISCONNECTED) {
        if (
          metaState.oneOnOneInvitedAttendeeId === msg.payload?.attendeeId &&
          metaState.oneOnOneMeetingId
        ) {
          // Cleanup moderator 1:1 if attendee disconnected during 1:1
          metaDispatch({
            type: MetaTypes.ONE_ON_ONE_ENDED,
          });

          const targetMessage = queuedMessages.find(
            msg =>
              msg?.payload?.attendeeId === metaState.oneOnOneInvitedAttendeeId
          ) as HandRaiseMessage;

          notifyDispatch({
            type: NotificationType.ONE_ON_ONE_DECLINED,
            payload: targetMessage.payload?.name || 'Attendee',
          });
        }
        liveEventMessagesDispatch?.({
          type: MsgType.REMOVE_ATTENDEE_MESSAGE,
          payload: {
            attendeeId: msg.payload?.attendeeId,
            event: RemoveMessageEventType.MODERATOR_1ON1_ENDED,
          } as RemoveMessagePayload,
        });
      }
    };
    messagingService?.subscribeToMessageUpdate(cb);
    return () => {
      messagingService?.unsubscribeFromMessageUpdate(cb);
    };
  }, [
    messagingService,
    metaDispatch,
    metaState.oneOnOneMeetingId,
    metaState.oneOnOneInvitedAttendeeId,
    notifyDispatch,
    liveEventMessagesDispatch,
    queuedMessages,
  ]);

  return (
    <AttendeeStatusContext.Provider value={AttendeeStatusContext}>
      {children}
    </AttendeeStatusContext.Provider>
  );
}
