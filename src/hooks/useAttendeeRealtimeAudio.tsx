import { useContext, useEffect, useState } from 'react';

import getChimeContext from '../context/getChimeContext';

const useAttendeeRealtimeAudio = (attendeeId?: string) => {
  const chime = useContext(getChimeContext());

  const [volume, setVolume] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(true);
  const [signalStrength, setSignalStrength] = useState<number>(0);

  useEffect(() => {
    if (!attendeeId) {
      return;
    }

    const callback = async (
      _: string,
      volume: number | null,
      muted: boolean | null,
      signalStrength: number | null
    ) => {
      if (volume !== null) {
        setVolume(Math.round(volume * 100));
      }
      if (muted !== null) {
        setMuted(muted);
      }
      if (signalStrength !== null) {
        setSignalStrength(Math.round(signalStrength * 100));
      }
    };

    chime?.audioVideo?.realtimeSubscribeToVolumeIndicator(attendeeId, callback);

    return () => {
      chime?.audioVideo?.realtimeUnsubscribeFromVolumeIndicator(attendeeId);
    };
  }, [attendeeId]);

  return {
    volume,
    muted,
    signalStrength,
  };
};

export default useAttendeeRealtimeAudio;
