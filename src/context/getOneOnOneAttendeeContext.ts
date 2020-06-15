import React from 'react';
import RosterAttendeeType from '../types/RosterAttendeeType';

const context = React.createContext<RosterAttendeeType | undefined>(undefined);

export default function getOneOnOneAttendeeContext() {
  return context;
}
