import React from 'react';

import MeetingStatus from '../enums/MeetingStatus';

const context = React.createContext<{
  meetingStatus: MeetingStatus;
  errorMessage?: string;
}>({
  meetingStatus: MeetingStatus.Loading,
});

export default function getMeetingStatusContext() {
  return context;
}
