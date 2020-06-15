import RosterAttendeeType from './RosterAttendeeType';

type RosterType = {
  [attendeeId: string]: RosterAttendeeType;
};

export default RosterType;
