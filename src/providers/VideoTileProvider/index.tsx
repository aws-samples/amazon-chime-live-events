import React, { useContext, useEffect, useReducer, createContext } from 'react';
import { AudioVideoObserver } from 'amazon-chime-sdk-js';

import { ChimeSdkWrapper } from '../ChimeProvider';
import getMeetingStatusContext from '../../context/getMeetingStatusContext';
import getChimeContext from '../../context/getChimeContext';
import MeetingStatus from '../../enums/MeetingStatus';
import { State, initialState, reducer, VideoTileActionType } from './state';

const Context = createContext<State>(initialState);

const VideoTileProvider: React.FC = ({ children }) => {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const observer: AudioVideoObserver = {
      videoTileDidUpdate: (tileState): void => {
        if (
          tileState?.boundAttendeeId &&
          tileState?.tileId &&
          !tileState.isContent &&
          !tileState.localTile
        ) {
          const { tileId, boundAttendeeId } = tileState;
          dispatch({
            type: VideoTileActionType.UPDATE,
            payload: {
              tileId,
              attendeeId: boundAttendeeId,
            },
          });
        }
      },
      videoTileWasRemoved: (tileId): void => {
        dispatch({
          type: VideoTileActionType.REMOVE,
          payload: {
            tileId,
          },
        });
      },
    };

    chime?.audioVideo?.addObserver(observer);
    return () => chime?.audioVideo?.removeObserver(observer);
  }, [meetingStatus]);

  useEffect(() => {
    if (!(meetingStatus === MeetingStatus.Succeeded)) {
      return;
    }

    return () => dispatch({ type: VideoTileActionType.RESET });
  }, [meetingStatus]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
};

const useVideoTileState = () => {
  const state = useContext(Context);

  if (!state) {
    throw new Error(
      'useVideoTileState must be used within a VideoTileProvider'
    );
  }

  return state;
};

export { VideoTileProvider, useVideoTileState };
