import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useMemo,
} from 'react';
import { DefaultModality, VideoTileState } from 'amazon-chime-sdk-js';

import getChimeContext from '../../context/getChimeContext';
import getMeetingStatusContext from '../../context/getMeetingStatusContext';
import MeetingStatus from '../../enums/MeetingStatus';
import { initialState, ContentState } from './state';

const StateContext = createContext<ContentState>(initialState);

const ApiContext = createContext({
  startContentShare: () => {},
  stopContentShare: () => {},
});

const ContentShareProvider: React.FC = ({ children }) => {
  const chime = useContext(getChimeContext());
  const [state, setState] = useState(initialState);
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const {
    isLocalUserSharing,
    isLocalShareLoading,
    activeContentTileId,
  } = state;

  const api = useMemo(
    () => ({
      startContentShare: async () => {
        setState((localState: ContentState) => ({
          ...localState,
          isLocalShareLoading: true,
        }));
        chime?.audioVideo?.startContentShareFromScreenCapture();
      },
      stopContentShare: async () => {
        chime?.audioVideo?.stopContentShare();
      },
    }),
    [meetingStatus]
  );

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const videoCb = {
      videoTileDidUpdate: (tileState: VideoTileState) => {
        if (
          !tileState.boundAttendeeId ||
          !tileState.isContent ||
          !tileState.tileId
        ) {
          return;
        }

        const { boundAttendeeId } = tileState;
        const baseAttendeeId = new DefaultModality(boundAttendeeId).base();
        const localAttendeeId = chime?.configuration?.credentials?.attendeeId;
        const isLocalUser = baseAttendeeId === localAttendeeId;

        if (!isLocalUser && isLocalUserSharing) {
          chime?.audioVideo?.stopContentShare();
        }

        if (isLocalUser) {
          setState((localState: ContentState) => ({
            ...localState,
            activeContentTileId: tileState.tileId,
            isLocalShareLoading: false,
            isLocalUserSharing: true,
            isSomeoneSharing: true,
          }));
        } else {
          setState((localState: ContentState) => ({
            ...localState,
            activeContentTileId: tileState.tileId,
            isRemoteUserSharing: true,
            isSomeoneSharing: true,
          }));
        }
      },
      videoTileWasRemoved: (tileId: number) => {
        if (tileId === activeContentTileId) {
          setState(initialState);
        }
      },
    };

    const screenShareCb = {
      contentShareDidStart: () => {
        setState((localState: ContentState) => ({
          ...localState,
          isLocalShareLoading: false,
          isLocalUserSharing: true,
        }));
      },
      contentShareDidStop: () => {
        setState((localState: ContentState) => ({
          ...localState,
          isLocalUserSharing: false,
        }));
      },
    };

    chime?.audioVideo?.addObserver(videoCb);
    chime?.audioVideo?.addContentShareObserver(screenShareCb);

    return () => {
      chime?.audioVideo?.removeObserver(videoCb);
      chime?.audioVideo?.removeContentShareObserver(screenShareCb);
    };
  }, [meetingStatus, activeContentTileId, isLocalUserSharing]);

  useEffect(() => {
    const cb = (event: PromiseRejectionEvent) => {
      if (event.reason.name === 'NotAllowedError' && isLocalShareLoading) {
        setState((localState: ContentState) => ({
          ...localState,
          isLocalShareLoading: false,
        }));
      }
    };

    window.addEventListener('unhandledrejection', cb);

    return () => window.removeEventListener('unhandledrejection', cb);
  }, [isLocalShareLoading]);

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  );
};

const useContentShareState = () => {
  const state = useContext(StateContext);

  if (!state) {
    throw new Error(
      'useContentShareState must be used within ScreenShareProvider'
    );
  }

  return state;
};

const useContentShareApi = () => {
  const api = useContext(ApiContext);

  if (!api) {
    throw new Error(
      'useContentShareApi must be used within ScreenShareProvider'
    );
  }

  return api;
};

export { ContentShareProvider, useContentShareState, useContentShareApi };
