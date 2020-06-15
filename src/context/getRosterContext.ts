import React from 'react';
import RosterType from '../types/RosterType';

const context = React.createContext<RosterType>({});

export default function getRosterContext() {
  return context;
}
