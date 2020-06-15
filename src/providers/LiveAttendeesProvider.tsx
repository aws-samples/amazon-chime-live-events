import React, {
  useEffect,
  useState,
  useMemo,
  useContext,
  createContext,
} from 'react';
import isEqual from 'lodash.isequal';

import getChimeContext from '../context/getChimeContext';
import {
  Message,
  MessageType,
  LiveVideoFeedsMessage,
} from '../types/MeetingMessage';
import getMeetingStatusContext from '../context/getMeetingStatusContext';
import getRosterContext from '../context/getRosterContext';
import MeetingStatus from '../enums/MeetingStatus';

interface ContextState {
  isLocalUserLive: boolean;
  liveAttendeeIds: string[];
}

const initialState: ContextState = {
  isLocalUserLive: false,
  liveAttendeeIds: [],
};

const Context = createContext<ContextState>(initialState);

const LiveAttendeesProvider: React.FC = ({ children }) => {
  const chime = useContext(getChimeContext());
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const roster = useContext(getRosterContext());
  const [isLocalUserLive, setIsLocalUserLive] = useState(false);
  const [liveAttendeeIds, setliveAttendeeIds] = useState<string[]>([]);
  const [liveAndPresentAttendees, setLiveAndPresentAttendees] = useState<
    string[]
  >([]);

  useEffect(() => {
    const isMuted = chime?.audioVideo?.realtimeIsLocalAudioMuted();

    if (isLocalUserLive && isMuted) {
      chime?.audioVideo?.realtimeUnmuteLocalAudio();
    } else if (!isLocalUserLive && !isMuted) {
      chime?.audioVideo?.realtimeMuteLocalAudio();
    }
  }, [isLocalUserLive]);

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const callback = (message: Message) => {
      if (message.type === MessageType.LIVE_VIDEO_FEEDS) {
        const liveAttendees = (message.payload as LiveVideoFeedsMessage) || [];
        setliveAttendeeIds(liveAttendees);
      }
    };

    chime?.subscribeToMessageUpdate(callback);
    return () => chime?.unsubscribeFromMessageUpdate(callback);
  }, [meetingStatus]);

  useEffect(() => {
    const liveIds: string[] = [];
    const rosterKeys = Object.keys(roster);
    const localUserId = chime?.configuration?.credentials?.attendeeId;
    let localUserIsLive = false;

    liveAttendeeIds.forEach(id => {
      for (let i = 0; i < rosterKeys.length; i++) {
        const key = rosterKeys[i];
        const { liveEventAttendeeId } = roster[key];
        if (liveEventAttendeeId === id) {
          liveIds.push(key);

          if (key === localUserId) {
            localUserIsLive = true;
          }
          break;
        }
      }
    });

    if (!isEqual(liveIds, liveAndPresentAttendees)) {
      setLiveAndPresentAttendees(liveIds);
    }

    if (localUserIsLive !== isLocalUserLive) {
      setIsLocalUserLive(localUserIsLive);
    }
  }, [
    meetingStatus,
    liveAttendeeIds,
    liveAndPresentAttendees,
    roster,
    isLocalUserLive,
  ]);

  const state = useMemo(
    () => ({
      isLocalUserLive,
      liveAttendeeIds: liveAndPresentAttendees,
    }),
    [isLocalUserLive, liveAndPresentAttendees]
  );

  return <Context.Provider value={state}>{children}</Context.Provider>;
};

const useLiveAttendees = () => {
  const state = useContext(Context);

  if (!state) {
    throw new Error(
      'useLiveAttendees must be used within LiveAttendeesProvider'
    );
  }

  return state;
};

export { LiveAttendeesProvider, useLiveAttendees };
