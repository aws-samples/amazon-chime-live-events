import React, {
  useContext,
  useState,
  useMemo,
  createContext,
  useEffect,
} from 'react';
import {
  VideoTileState,
  MeetingSessionVideoAvailability,
} from 'amazon-chime-sdk-js';

import { ChimeSdkWrapper } from './ChimeProvider';
import getMeetingStatusContext from '../context/getMeetingStatusContext';
import getChimeContext from '../context/getChimeContext';
import MeetingStatus from '../enums/MeetingStatus';

interface Api {
  startLocalVideoTile: () => void;
  stopLocalVideoTile: () => void;
}

interface State {
  isSharing: boolean;
  localTileId?: number | null;
}

const StateContext = createContext<State>({
  isSharing: false,
  localTileId: null,
});
const ApiContext = createContext<Api>({
  startLocalVideoTile: () => {},
  stopLocalVideoTile: () => {},
});

interface Props {
  startVideoOnMount?: boolean;
}

const LocalTileProvider: React.FC<Props> = ({
  children,
  startVideoOnMount = true,
}) => {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  const [localTileId, setLocalTileId] = useState<number | null>();

  const api = useMemo(
    () => ({
      startLocalVideoTile: () => {
        try {
          chime?.audioVideo?.startLocalVideoTile();
          setIsLocalVideoOn(true);
        } catch (e) {
          console.error(e);
        }
      },
      stopLocalVideoTile: () => {
        chime?.audioVideo?.stopLocalVideoTile();
        setIsLocalVideoOn(false);
        setLocalTileId(null);
      },
    }),
    [meetingStatus]
  );

  useEffect(() => {
    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.localTile || !tileState.tileId || tileState.isContent) {
          return;
        }

        if (tileState.active) {
          setIsLocalVideoOn(true);
        }
      },
      videoSendDidBecomeUnavailable: () => {
        setIsLocalVideoOn(false);
      },
    };

    chime?.audioVideo?.stopLocalVideoTile();
    return () => chime?.audioVideo?.removeObserver(observer);
  }, [meetingStatus]);

  useEffect(() => {
    if (!startVideoOnMount || meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }
    let videoStarted = false;
    let videoAvailable = false;

    const startVideoWhenReady = async () => {
      if (!chime?.currentVideoInputDevice || videoStarted || !videoAvailable) {
        return;
      }

      await chime.chooseVideoInputDevice(chime.currentVideoInputDevice);

      try {
        if (!videoStarted) {
          chime?.audioVideo?.startLocalVideoTile();
          setIsLocalVideoOn(true);
          videoStarted = true;
        }
      } catch (e) {
        console.log(e);
      }
    };

    const observer = {
      audioVideoDidStart: (): void => {
        startVideoWhenReady();
      },
      videoAvailabilityDidChange: (
        availability: MeetingSessionVideoAvailability
      ): void => {
        console.log('Video availability changed to', availability);
        videoAvailable = availability.canStartLocalVideo;
        startVideoWhenReady();
      },
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.localTile || !tileState.tileId) {
          return;
        }
        setLocalTileId(tileState.tileId);
        if (tileState.active) {
          setIsLocalVideoOn(true);
        }
      },
    };

    chime?.audioVideo?.addObserver(observer);
    return () => chime?.audioVideo?.removeObserver(observer);
  }, [meetingStatus, startVideoOnMount]);

  const value = useMemo(
    () => ({
      isSharing: isLocalVideoOn,
      localTileId,
    }),
    [isLocalVideoOn, localTileId]
  );

  return (
    <StateContext.Provider value={value}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  );
};

const useLocalTileState = () => {
  const state = useContext(StateContext);

  return state;
};

const useLocalTileApi = () => {
  const state = useContext(ApiContext);

  return state;
};

export { LocalTileProvider, useLocalTileState, useLocalTileApi };
