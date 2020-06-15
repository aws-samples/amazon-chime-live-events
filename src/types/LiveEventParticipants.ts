/*
 * DO NOT EXPORT! Drive attendeeName changes through the classes defined below.
 */
const useAttendeeNameStorage = (attendeeName?: string) => {
  let name;
  if (attendeeName && attendeeName.length > 0) {
    name = attendeeName;
    localStorage.setItem('attendeeName', attendeeName);
  } else {
    name = localStorage.getItem('attendeeName') || undefined;
  }
  return name;
};

export enum ParticipantType {
  MODERATOR,
  TALENT,
  ATTENDEE,
}

/*
 * All participants have a type.
 */
type Participant = {
  attendeeType: ParticipantType;
};

/*
 * This should only be used in places where we haven't yet gotten full
 * information about our participant yet. We don't know yet if we will get
 * an ID or name from them.
 */
export interface UnknownParticipant extends Participant {
  attendeeName?: string;
  attendeeId?: string;
}

export class UnknownParticipant implements UnknownParticipant {
  attendeeId?: string;
  attendeeType: ParticipantType;
  attendeeName?: string;

  constructor(
    attendeeType: ParticipantType,
    attendeeId?: string,
    attendeeName?: string
  ) {
    this.setAttendeeName(attendeeName?.trim());
    this.attendeeId = attendeeId;
    this.attendeeType = attendeeType;
  }

  setAttendeeName(name: string | undefined) {
    this.attendeeName = useAttendeeNameStorage(name);
  }
}

/*
 * Passive participants don't really have any attributes at this point.
 * They don't have an attendeeId, they can't raise their hand, etc.
 */
export type PassiveParticipant = {} & Participant;

/*
 * Active participants need an attendeeId, but they
 * may not have provided their name yet. Once they have given their
 * name they can switch to a 'verified' participant.
 * This step happens once they raise their hand and must give their name,
 * for example.
 */
export interface ActiveParticipant extends Participant {
  attendeeName?: string;
  attendeeId: string;
}

export class ActiveParticipant implements ActiveParticipant {
  attendeeId: string;
  attendeeType: ParticipantType;
  attendeeName?: string;

  constructor(participant: ActiveParticipant) {
    const sanitizedAttendeeId = participant.attendeeId.trim();

    if (sanitizedAttendeeId.length <= 0) {
      throw new Error('ActiveParticipant must have a non-empty attendeeId');
    }

    this.attendeeId = sanitizedAttendeeId;
    this.attendeeName = participant.attendeeName?.trim();
    this.attendeeType = participant.attendeeType;
  }
}

/*
 * Verified participants must have a name and attendeeId.
 */
export interface VerifiedParticipant extends Participant {
  attendeeName: string;
  attendeeId: string;
}

export class VerifiedParticipant implements VerifiedParticipant {
  attendeeName: string;
  attendeeId: string;
  attendeeType: ParticipantType;

  constructor(participant: VerifiedParticipant) {
    const sanitizedAttendeeId = participant.attendeeId.trim();

    if (sanitizedAttendeeId.length <= 0) {
      throw new Error('VerifiedParticipant must have a non-empty attendeeId');
    }

    const sanitizedAttendeeName = participant.attendeeName
      ? participant.attendeeName.trim()
      : undefined;

    if (!sanitizedAttendeeName || sanitizedAttendeeName.length <= 0) {
      throw new Error('VerifiedParticipant must have a non-empty attendeeName');
    }

    this.attendeeId = sanitizedAttendeeId;
    this.attendeeName = sanitizedAttendeeName;
    this.attendeeType = participant.attendeeType;
  }
}

export const getParticipantTypeFromPath = (path: string) => {
  if (path.includes('/moderator')) {
    return ParticipantType.MODERATOR;
  }
  if (path.includes('/talent')) {
    return ParticipantType.TALENT;
  }
  return ParticipantType.ATTENDEE;
};
