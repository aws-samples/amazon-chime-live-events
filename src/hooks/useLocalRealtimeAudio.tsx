import { useEffect, useState, useContext, useCallback } from 'react';

import getChimeContext from '../context/getChimeContext';

const useLocalRealtimeAudio = (
  onMutedChange?: (newMutedValue: boolean) => void
) => {
  const chime = useContext(getChimeContext());
  const [muted, setMuted] = useState<boolean>(
    () => chime?.audioVideo?.realtimeIsLocalAudioMuted() || false
  );

  useEffect(() => {
    const callback = (localMuted: boolean) => {
      setMuted(localMuted);
      onMutedChange && onMutedChange(localMuted);
    };

    chime?.audioVideo?.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);

    return () => {
      chime?.audioVideo?.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback);
    };
  }, [onMutedChange]);

  const toggleMute = useCallback(() => {
    if (muted) {
      chime?.audioVideo?.realtimeUnmuteLocalAudio();
    } else {
      chime?.audioVideo?.realtimeMuteLocalAudio();
    }
  }, [muted]);

  return { muted, toggleMute };
};

export default useLocalRealtimeAudio;
