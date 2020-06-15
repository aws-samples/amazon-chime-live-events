import React from 'react';

import {
  useLiveEventMessagesDispatch,
  useLiveEventMessages,
  Type as MsgType,
  useLiveEventMessagingService,
} from '../../../providers/LiveEventMessagesProvider';
import Header from '../Header';
import FeedList from './FeedList';
import {
  Type,
  RemoveMessageEventType,
  RemoveMessagePayload,
} from '../../../providers/LiveEventMessagesProvider/state';
import {
  LiveEventMessageType,
  HandRaiseMessage,
} from '../../../types/LiveEventMessages';
import useTranslate from '../../../hooks/useTranslate';

interface Props {
  className: string;
}

const MessageFeed: React.FC<Props> = ({ className }) => {
  const translate = useTranslate();
  const dispatch = useLiveEventMessagesDispatch();
  const { messages } = useLiveEventMessages();
  const messagingService = useLiveEventMessagingService();
  const title = translate('FeedList.addToQueueButton');
  const subtitle = translate('FeedList.removeRaisedHAnd');

  const moveToQueue = (id: string) => {
    const message = {
      type: LiveEventMessageType.UPDATE_HAND_RAISE,
      payload: {
        attendeeId: id,
        queue: true,
      },
    };
    messagingService?.sendMessage(message);
    dispatch?.({ type: MsgType.QUEUE_MESSAGE, payload: id });
  };

  const handleRemove = (id: string) => {
    const payload: RemoveMessagePayload = {
      attendeeId: id,
      event: RemoveMessageEventType.MODERATOR_REMOVE_CLICK,
    };

    dispatch?.({
      type: Type.REMOVE_MESSAGE,
      payload,
    });
  };

  return (
    <>
      <Header>{translate('HandRaiseFeed.raisedHandsTitle')}</Header>
      <FeedList
        title={title}
        subtitle={subtitle}
        className={className}
        messages={messages as HandRaiseMessage[]}
        onPromote={moveToQueue}
        onRemove={handleRemove}
      />
    </>
  );
};

export default MessageFeed;
