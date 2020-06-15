import React from 'react';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';

const context = React.createContext<ChimeSdkWrapper | null>(null);

export default function getChimeContext() {
  return context;
}
