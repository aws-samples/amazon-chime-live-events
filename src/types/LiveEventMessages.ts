import { AttendeeMeetingProgress } from '../enums/AtttendeeMetteingProgress';

type BasePayload = {
  liveEventId: string;
  attendeeId: string | undefined;
};

export interface LiveEventJoinMeetingPayload extends BasePayload {
  targetAttendeeId: string;
  meetingId: string;
}

export interface LiveEventJoinProgreesPayload extends BasePayload {
  targetAttendeeId: string;
  stepCompeted: AttendeeMeetingProgress;
}

export interface HandRaisePayload extends BasePayload {
  handRaised: boolean;
  name: string;
  message?: string;
  queueId?: string;
  inLocalQueue?: boolean;
}

type BaseMessage = {
  type: LiveEventMessageType;
  timestampMs?: number;
};

export enum LiveEventMessageType {
  RAISE_HAND = 'raise-hand',
  JOIN_MEETING = 'join-meeting',
  ATTENDEE_DISCONNECTED = 'attendee-disconnected',
  ATTENDEE_PROGESS = 'attendee-progress',
  UPDATE_HAND_RAISE = 'update-hand-raise',
}

export interface LiveEventJoinMeetingMessage extends BaseMessage {
  payload?: LiveEventJoinMeetingPayload;
}

export interface HandRaiseMessage extends BaseMessage {
  payload: HandRaisePayload;
}

export interface UpdateHandRaise extends BaseMessage {
  payload: {
    attendeeId: string;
    queue?: boolean;
  };
}

export interface LiveEventAttendeeProgress extends BaseMessage {
  payload?: LiveEventJoinProgreesPayload;
}

export type LiveEventMessage =
  | LiveEventJoinMeetingMessage
  | HandRaiseMessage
  | UpdateHandRaise
  | LiveEventAttendeeProgress;
