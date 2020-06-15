import React, { useState, useEffect, useContext, createContext } from 'react';

import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import { useLiveEventContext } from './LiveEventProvider';
import { getBaseURL } from '../utils/configuredURLs';
import { UnknownParticipant } from '../types/LiveEventParticipants';

enum Status {
  LOADING,
  FAILED,
  SUCCEEDED,
}

type BroadcastAuthData = {
  cookies: { [key: string]: string };
  path: string;
  maxAge: number;
};

type BroadcastAuthResponse = {
  authorization?: BroadcastAuthData;
};

const Context = createContext<Status>(Status.LOADING);

const StreamProvider: React.FC = ({ children }) => {
  const liveEventSession = useLiveEventContext();
  const [status, setStatus] = useState<Status>(Status.LOADING);
  const participant: UnknownParticipant = useContext(
    getLiveEventParticipantContext()
  );

  useEffect(() => {
    const setCloudfrontAccessCookies = (data: BroadcastAuthData) => {
      const { cookies, maxAge, path } = data;
      const cookieProperties = `Path=${path}; Max-Age=${maxAge}; Secure; SameSite=Strict`;
      for (const key of Object.getOwnPropertyNames(cookies)) {
        const val = cookies[key];
        document.cookie = `${key}=${val}; ${cookieProperties}`;
      }
    };

    const getStream = async () => {
      try {
        const eventId = liveEventSession.liveEventId;
        const attendeeId = participant.attendeeId || 'Unknown';
        const broadcastUrl = `${getBaseURL()}live-events/${eventId}/broadcast?AttendeeId=${attendeeId}`;
        const res = await fetch(broadcastUrl);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        const data: BroadcastAuthResponse = await res.json();
        if (data.authorization) {
          setCloudfrontAccessCookies(data.authorization);
        }
        setStatus(Status.SUCCEEDED);
      } catch (e) {
        setStatus(Status.FAILED);
        console.error(`Something went wrong fetching stream - ${e.message}`);
      }
    };

    getStream();
  }, []);

  return <Context.Provider value={status}>{children}</Context.Provider>;
};

const useStreamState = () => {
  const state = useContext(Context);

  return state;
};

export { StreamProvider, useStreamState, Status };
