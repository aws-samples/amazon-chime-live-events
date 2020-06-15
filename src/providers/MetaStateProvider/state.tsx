export enum MeetingAudio {
  LIVE_EVENT = 'LIVE_EVENT',
  ONE_ON_ONE = 'ONE_ON_ONE',
}

export enum Types {
  START_ONE_ON_ONE,
  ONE_ON_ONE_ENDED,
  TRANSITIONING_ATTENDEE,
  MEETING_AUDIO_CHANGED,
  ATTENDEE_JOINED_ONE_ON_ONE,
  PENDING_ATTENDEE_TO_JOIN,
}

export interface Action {
  type: Types;
  payload?: any;
}

export interface StateType {
  oneOnOneMeetingId: string | null;
  oneOnOneInvitedAttendeeId: string | null;
  transitioningAttendee: string | null;
  externalAttendeeId: string | null;
  activeAudio: MeetingAudio;
  onStartOneOnOneError?: (error: string) => void;
  onStartOneOnOneSuccess?: () => void;
}

export const initialState: StateType = {
  oneOnOneMeetingId: null,
  oneOnOneInvitedAttendeeId: null,
  transitioningAttendee: null,
  externalAttendeeId: null,
  activeAudio: MeetingAudio.LIVE_EVENT,
};

export const reducer = (state: StateType, action: Action): StateType => {
  const { type, payload } = action;

  switch (type) {
    case Types.START_ONE_ON_ONE:
      return {
        ...state,
        activeAudio: MeetingAudio.ONE_ON_ONE,
        oneOnOneMeetingId: payload.meetingId,
        onStartOneOnOneError: payload.onError,
        onStartOneOnOneSuccess: payload.onSuccess,
        oneOnOneInvitedAttendeeId: payload.targetAttendeeId,
      };

    case Types.ONE_ON_ONE_ENDED:
      return {
        ...state,
        activeAudio: MeetingAudio.LIVE_EVENT,
        oneOnOneMeetingId: null,
        oneOnOneInvitedAttendeeId: null,
      };
    case Types.TRANSITIONING_ATTENDEE:
      return {
        ...state,
        oneOnOneMeetingId: null,
        activeAudio: MeetingAudio.LIVE_EVENT,
        transitioningAttendee: payload,
        oneOnOneInvitedAttendeeId: null,
      };
    case Types.ATTENDEE_JOINED_ONE_ON_ONE:
      return {
        ...state,
        externalAttendeeId: payload,
      };
    case Types.MEETING_AUDIO_CHANGED:
      return {
        ...state,
        activeAudio: payload,
      };
    default:
      throw new Error();
  }
};
