import { LiveEventMessage } from '../../types/LiveEventMessages';

export type State = {
  attendeeId?: string;
  messages: LiveEventMessage[];
  queuedMessages: LiveEventMessage[];
  queuedAttendeeIds: string[];
};

export enum Type {
  INIT_MESSAGES,
  ADD_MESSAGE,
  QUEUE_MESSAGE,
  REMOVE_QUEUED_MESSAGE,
  REMOVE_MESSAGE,
  REMOVE_ATTENDEE_MESSAGE,
  UPDATE_HAND_RAISE,
}

export type Action = {
  type: Type;
  payload?: any;
};

export enum RemoveMessageEventType {
  MODERATOR_REMOVE_CLICK,
  MODERATOR_1ON1_ENDED,
  MODERATOR_1ON1_STARTED,
}

export type RemoveMessagePayload = {
  attendeeId: string;
  event: RemoveMessageEventType;
};

export const initialState: State = {
  attendeeId: '',
  messages: [],
  queuedMessages: [],
  queuedAttendeeIds: [],
};

export function reducer(state: State, action: Action) {
  const { type, payload } = action;

  switch (type) {
    case Type.INIT_MESSAGES: {
      const messages = [];
      const queuedMessages = [];

      for (let i = 0; i < payload.length; i++) {
        const message = payload[i];
        const inLocalQueue = message.QueueId === state.attendeeId;

        const formattedMessage: any = {
          payload: {
            inLocalQueue,
            name: message.Name,
            message: message.Question,
            attendeeId: message.AttendeeId,
            liveEventId: message.LiveEventId,
            queueId: message.QueueId || null,
          },
        };

        if (inLocalQueue) {
          queuedMessages.push(formattedMessage);
        } else {
          messages.push(formattedMessage);
        }
      }

      return {
        ...state,
        messages,
        queuedMessages,
      };
    }
    case Type.ADD_MESSAGE: {
      const inQueue =
        state.queuedMessages.filter(
          msg => msg?.payload?.attendeeId === payload?.payload?.attendeeId
        ).length > 0;

      const wasQueued = state.queuedAttendeeIds.find(
        attendeeId => attendeeId === payload?.payload?.attendeeId
      );

      if (inQueue) {
        return state;
      }

      if (wasQueued) {
        return {
          ...state,
          queuedMessages: [...state.queuedMessages, payload],
        };
      }

      const inMessages =
        state.messages.filter(
          msg => msg?.payload?.attendeeId === payload?.payload?.attendeeId
        ).length > 0;

      if (inMessages) {
        return state;
      }

      return {
        ...state,
        messages: [...state.messages, payload],
      };
    }
    case Type.QUEUE_MESSAGE: {
      const queuedMessages = [...state.queuedMessages];
      const queuedAttendeeIds = [...state.queuedAttendeeIds];

      const targetMessage = state.messages.find(
        msg => msg?.payload?.attendeeId === payload
      );
      targetMessage && queuedMessages.push(targetMessage);
      const messages = state.messages.filter(
        msg => msg?.payload?.attendeeId !== payload
      );

      if (queuedAttendeeIds.indexOf(payload) === -1) {
        queuedAttendeeIds.push(payload);
      }
      return {
        ...state,
        messages,
        queuedMessages,
        queuedAttendeeIds,
      };
    }
    case Type.REMOVE_QUEUED_MESSAGE: {
      const { attendeeId, event } = payload as RemoveMessagePayload;
      let queuedAttendeeIds = [...state.queuedAttendeeIds];
      let queuedMessages = [...state.queuedMessages];
      if (event === RemoveMessageEventType.MODERATOR_REMOVE_CLICK) {
        queuedAttendeeIds = state.queuedAttendeeIds.filter(
          id => id !== attendeeId
        );
      }
      queuedMessages = state.queuedMessages.filter(
        msg => msg?.payload?.attendeeId !== attendeeId
      );
      return {
        ...state,
        queuedMessages,
        queuedAttendeeIds,
      };
    }
    case Type.REMOVE_MESSAGE: {
      const { attendeeId } = payload as RemoveMessagePayload;
      const messages = state.messages.filter(
        msg => msg?.payload?.attendeeId !== attendeeId
      );
      return {
        ...state,
        messages,
      };
    }
    case Type.REMOVE_ATTENDEE_MESSAGE: {
      const { attendeeId } = payload as RemoveMessagePayload;
      const messages = state.messages.filter(
        msg => msg?.payload?.attendeeId !== attendeeId
      );
      const queuedMessages = state.queuedMessages.filter(
        msg => msg?.payload?.attendeeId !== attendeeId
      );

      if (
        messages.length === state.messages.length &&
        queuedMessages.length === state.queuedMessages.length
      ) {
        return state;
      }

      return {
        ...state,
        messages,
        queuedMessages,
      };
    }
    case Type.UPDATE_HAND_RAISE: {
      let updated = false;
      const messages = state.messages.map(msg => {
        if (msg.payload?.attendeeId === payload.AttendeeId) {
          updated = true;
          const inLocalQueue = payload.QueueId === state.attendeeId;
          return {
            payload: { ...msg.payload, inLocalQueue, queueId: payload.QueueId },
          };
        }

        return msg;
      });

      if (updated) {
        return { ...state, messages };
      }
      return state;
    }
    default:
      return state;
  }
}
