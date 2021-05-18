import React, {
  useContext,
  useEffect,
  useReducer,
  createContext,
  Dispatch,
  useState,
} from 'react';

import getLiveEventParticipantContext from '../../context/getLiveEventParticipantContext';
import { getHandRaiseWSSURL, getBaseURL } from '../../utils/configuredURLs';
import {
  LiveEventMessage,
  LiveEventMessageType,
  LiveEventJoinProgreesPayload,
} from '../../types/LiveEventMessages';
import { State, initialState, reducer, Type } from './state';
import { useLiveEventContext } from '../LiveEventProvider';
import { AttendeeMeetingProgress } from '../../enums/AtttendeeMeetingProgress';
import getCredentialsContext from '../../context/getCredentialsContext';

export const DEFAULT_WEB_SOCKET_TIMEOUT_MS = 10000;

class LiveEventMessagingService {
  private wsStabilizer: any;

  private stopWsStabilizer = () => {
    if (!this.wsStabilizer) {
      console.log('No active Websocket to stop!');
    }
    clearInterval(this.wsStabilizer);
  };

  private startWsStabilizer = () => {
    const seconds = 1000 * 60;
    const pingMessage = {
      message: 'ping',
    };
    this.wsStabilizer = setInterval(() => {
      try {
        this.liveEventSocket?.send(JSON.stringify(pingMessage));
      } catch (error) {
        console.error('Error sending ping message.');
        this.stopWsStabilizer();
        this.logError(error);
      }
    }, seconds);
  };

  liveEventId: string;
  attendeeId: string;
  moderatorId: string | undefined;

  liveEventSocket: WebSocket | null = null;

  messageUpdateCallbacks: ((message: LiveEventMessage) => void)[] = [];

  constructor(liveEventId: string, attendeeId: string) {
    this.liveEventId = liveEventId;
    this.attendeeId = attendeeId;
  }

  joinLiveEventMessaging = async (): Promise<void> => {
    if (!this.liveEventId || !this.attendeeId) {
      throw new Error(
        'Must provide liveEventId and attendeeId to join liveEvent messaging.'
      );
    }

    console.log(`Joining live event messaging with event ID: ${this.liveEventId},
      attendeeId: ${this.attendeeId}`);

    const base = getHandRaiseWSSURL();
    const messagingUrl = `${base}?LiveEventId=${this.liveEventId}&AttendeeId=${this.attendeeId}`;
    console.log(`Setting up websocket to URL: ${messagingUrl}`);
    this.liveEventSocket = new WebSocket(messagingUrl);

    this.liveEventSocket.addEventListener('open', () => {
      // Initiate WS stabilizer
      this.startWsStabilizer();
    });

    this.liveEventSocket.addEventListener('message', (event: Event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        // Do not process ping messages.
        if (data?.type === 'ping') return;

        // JoinMeeting payload has a attendeeId of the RaiseHand moderator
        // and so we will need to store moderatorId to send progress messages.
        if (
          data?.type === LiveEventMessageType.JOIN_MEETING &&
          data?.payload?.attendeeId
        ) {
          this.moderatorId = data.payload.attendeeId;
        }

        this.publishMessageUpdate({
          type: data.type,
          payload: data.payload,
          timestampMs: Date.now(),
        });
      } catch (error) {
        this.logError(error);
      }
    });

    window.addEventListener('beforeunload', () => {
      this.stopWsStabilizer();
      console.debug('Closing live event socket.');
      this.liveEventSocket?.close();
      console.debug('Closed live event socket.');
    });
  };

  notifyModerator = (step: AttendeeMeetingProgress) => {
    if (!this.moderatorId) {
      console.error('ModeratorId required to send moderator message.');
    }
    const attendeeProgressMessage = {
      type: LiveEventMessageType.ATTENDEE_PROGESS,
      payload: {
        stepCompeted: step,
        targetAttendeeId: this.moderatorId,
      } as LiveEventJoinProgreesPayload,
    } as LiveEventMessage;
    this.sendMessage(attendeeProgressMessage);
  };

  sendMessage = (data: LiveEventMessage) => {
    if (!this.liveEventSocket) {
      return;
    }
    const message = {
      message: 'sendmessage',
      data: JSON.stringify(data),
    };
    try {
      this.liveEventSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending Live Event message.');
      this.logError(error);
    }
  };

  subscribeToMessageUpdate = (
    callback: (message: LiveEventMessage) => void
  ) => {
    this.messageUpdateCallbacks.push(callback);
  };

  unsubscribeFromMessageUpdate = (
    callback: (message: LiveEventMessage) => void
  ) => {
    const index = this.messageUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.messageUpdateCallbacks.splice(index, 1);
    }
  };

  private publishMessageUpdate = (message: LiveEventMessage) => {
    for (let i = 0; i < this.messageUpdateCallbacks.length; i += 1) {
      const callback = this.messageUpdateCallbacks[i];
      callback(message);
    }
  };

  private logError = (error: Error) => {
    console.error(error);
  };
}

const LiveEventMessagesContext = createContext<State>(initialState);
const LiveEventMessagesDispatchContext = createContext<Dispatch<any> | null>(
  null
);
const LiveEventMessagingServiceContext = createContext<LiveEventMessagingService | null>(
  null
);

type LiveEventMessagesProviderProps = {
  children: any;
  initMessaging?: boolean;
};

const LiveEventMessagesProvider: React.FC<LiveEventMessagesProviderProps> = ({
  children,
  initMessaging,
}) => {
  // TODO we should be able to expect an Active/Verified Participant here,
  // but it will take some moving around to acheive that.
  const { attendeeId } = useContext(getLiveEventParticipantContext());
  const { isAuthenticated, authToken } = useContext(getCredentialsContext());
  const liveEvent = useLiveEventContext();

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    attendeeId,
  });
  const [messagingService] = useState<LiveEventMessagingService>(
    () =>
      new LiveEventMessagingService(
        liveEvent.liveEventId,
        attendeeId! // TODO remove ! when ActiveParticipant expectation above is fulfilled
      )
  );

  useEffect(() => {
    if (!initMessaging || !isAuthenticated || !authToken || !attendeeId) {
      return;
    }

    console.log('Getting initial hand raises');

    const getMessages = async () => {
      const headers: any = {
        Authorization: authToken,
        AttendeeId: attendeeId,
      };

      const url = `${getBaseURL()}live-events/${
        liveEvent.liveEventId
      }/hand-raises`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          dispatch({ type: Type.INIT_MESSAGES, payload: data });
        } else {
          console.log(`Hand raises - server error ${res.status}`);
        }
      } catch (e) {
        console.log(`Something went wrong fetching hand raises - ${e.message}`);
      }
    };

    getMessages();
  }, [isAuthenticated, authToken, liveEvent.liveEventId, initMessaging]);

  useEffect(() => {
    // In some cases we want to init right away (e.g. moderator), in others we
    // want to init lazily (e.g. attendee).
    if (initMessaging) {
      const joinLiveEventMessaging = async () => {
        await messagingService.joinLiveEventMessaging();
      };
      joinLiveEventMessaging();
    }

    const cb = (msg: LiveEventMessage) => {
      if (
        msg.type === LiveEventMessageType.JOIN_MEETING ||
        msg.type === LiveEventMessageType.RAISE_HAND
      ) {
        dispatch({ type: Type.ADD_MESSAGE, payload: msg });
      } else if (msg.type === LiveEventMessageType.UPDATE_HAND_RAISE) {
        dispatch({ type: Type.UPDATE_HAND_RAISE, payload: msg.payload });
      }
    };
    messagingService.subscribeToMessageUpdate(cb);
    return () => {
      messagingService.unsubscribeFromMessageUpdate(cb);
    };
  }, []);

  return (
    <LiveEventMessagesContext.Provider value={state}>
      <LiveEventMessagesDispatchContext.Provider value={dispatch}>
        <LiveEventMessagingServiceContext.Provider value={messagingService}>
          {children}
        </LiveEventMessagingServiceContext.Provider>
      </LiveEventMessagesDispatchContext.Provider>
    </LiveEventMessagesContext.Provider>
  );
};

function useLiveEventMessages() {
  const context = useContext(LiveEventMessagesContext);

  if (context === undefined) {
    throw new Error(
      'useLiveEventMessages must be used within a LiveEventMessagesContext'
    );
  }

  return context;
}

function useLiveEventMessagesDispatch() {
  const context = useContext(LiveEventMessagesDispatchContext);

  if (context === undefined) {
    throw new Error(
      'useLiveEventMessageApis must be used within a LiveEventMessagesDispatchContext'
    );
  }

  return context;
}

function useLiveEventMessagingService() {
  const context = useContext(LiveEventMessagingServiceContext);

  if (context === undefined) {
    throw new Error(
      'useLiveEventMessagingService must be used within a LiveEventMessagingServiceContext'
    );
  }

  return context;
}

export {
  LiveEventMessagesProvider,
  useLiveEventMessages,
  useLiveEventMessagesDispatch,
  useLiveEventMessagingService,
  Type,
};
