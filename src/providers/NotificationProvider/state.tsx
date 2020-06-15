import { v4 as uuidv4 } from 'uuid';

export enum Variant {
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
}

export enum Positions {
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center',
}

export interface NotificationType {
  id?: string;
  message?: string;
  title?: string;
  variant?: Variant;
  selfClose?: boolean;
  replaceAll?: boolean;
  position?: Positions;
}

export interface StateType {
  notifications: NotificationType[];
}

export enum Type {
  ONE_ON_ONE_STARTED,
  ONE_ON_ONE_JOIN_ERROR,
  REMOTE_UNMUTE,
  REMOTE_MUTE,
  REMOTE_VIDEO_ENABLED,
  REMOTE_VIDEO_DISABLED,
  TRANSFERRING_MEETING,
  ATTENDEE_PROMOTED,
  ATTENDEE_REMOVED,
  ADD,
  REMOVE,
  REMOVE_ALL,
  MISSING_TALENT,
  ERROR_RAISING_HAND,
  ERROR_ENTERING_EVENT_ATTENDEE,
  ERROR_GETTING_TALENT_MEETING,
  ATTENDEE_DEMOTED_ERROR,
  ATTENDEE_PROMOTED_ERROR,
  PROMOTED_TO_LIVE,
  ONE_ON_ONE_DECLINED,
}

export interface Action {
  type: Type;
  payload?: any;
}

export const initialState: StateType = {
  notifications: [],
};

export const reducer = (state: StateType, action: Action): StateType => {
  const { type, payload } = action;

  switch (type) {
    case Type.ADD: {
      const notif = { id: uuidv4(), ...payload };
      const notifications = notif?.replaceAll
        ? [notif]
        : [...state.notifications, notif];
      return {
        ...state,
        notifications,
      };
    }
    case Type.REMOVE: {
      const notifications = state.notifications.filter(
        notif => notif?.id !== payload
      );
      return {
        ...state,
        notifications,
      };
    }
    case Type.REMOVE_ALL: {
      return {
        ...state,
        notifications: [],
      };
    }
    case Type.ONE_ON_ONE_STARTED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'Starting meeting...',
          },
        ],
      };
    }
    case Type.ONE_ON_ONE_DECLINED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: `${payload} declined your invite.`,
          },
        ],
      };
    }
    case Type.ONE_ON_ONE_JOIN_ERROR: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: `Error starting meeting with ${payload.name}.`,
            variant: Variant.ERROR,
          },
        ],
      };
    }
    case Type.REMOTE_MUTE: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'You have been muted by a moderator.',
          },
        ],
      };
    }
    case Type.REMOTE_UNMUTE: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'You have been unmuted by a moderator.',
          },
        ],
      };
    }
    case Type.REMOTE_VIDEO_ENABLED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'Your video has been started by a moderator.',
          },
        ],
      };
    }
    case Type.REMOTE_VIDEO_DISABLED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'Your video has been turned off by a moderator.',
          },
        ],
      };
    }
    case Type.TRANSFERRING_MEETING: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: `Transferring to meeting`,
            message:
              'You are being transferred to the live event meeting. You will join muted with video enabled.',
          },
        ],
      };
    }
    case Type.PROMOTED_TO_LIVE: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: `You are live`,
            message: 'A moderator has promoted you to the live broadcast.',
            variant: Variant.WARNING,
          },
        ],
      };
    }
    case Type.ATTENDEE_PROMOTED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: payload,
          },
        ],
      };
    }
    case Type.ATTENDEE_REMOVED: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: payload,
          },
        ],
      };
    }
    case Type.MISSING_TALENT: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title:
              'You cannot perform this action without the talent being live.',
            variant: Variant.ERROR,
          },
        ],
      };
    }
    case Type.ERROR_RAISING_HAND: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: 'There was an error submitting your hand raise.',
            variant: Variant.ERROR,
          },
        ],
      };
    }
    case Type.ERROR_ENTERING_EVENT_ATTENDEE: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title:
              'There was an error trying to bring you into the live event for your hand raise.',
            variant: Variant.ERROR,
          },
        ],
      };
    }
    case Type.ATTENDEE_DEMOTED_ERROR: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: payload,
            variant: Variant.ERROR,
          },
        ],
      };
    }
    case Type.ATTENDEE_PROMOTED_ERROR: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            title: payload,
            variant: Variant.ERROR,
          },
        ],
      };
    }
    default:
      throw new Error('Incorrect type in NotificationProvider');
  }
};
