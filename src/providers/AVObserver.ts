import { ChimeSdkWrapper } from "./ChimeProvider";
import { MeetingSessionVideoAvailability, MeetingSessionStatus, MeetingSessionStatusCode, AudioVideoFacade, AudioVideoObserver } from "amazon-chime-sdk-js";

export interface ObserverOptions {
  joinMuted: boolean;
  joinWithVideo: boolean;
  onEnded: () => void;
  reselectAudio: () => Promise<void>;
  reselectVideo: () => Promise<void>;
};

export function makeAVObserver(av: AudioVideoFacade, options: ObserverOptions): AudioVideoObserver {
  let shouldTryToStart = options.joinWithVideo;
  let started = false;
  let videoAvailable = false;

  const startVideoWhenReady = async () => {
    if (shouldTryToStart && !started && videoAvailable) {
      console.debug('Starting video.');
      await options.reselectVideo();
      av.startLocalVideoTile();
    }
  };

  return {
    audioVideoDidStop: (sessionStatus: MeetingSessionStatus): void => {
      if (sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded) {
        options.onEnded();
      }
    },

    // This fires *before* audioVideoDidStart.
    videoAvailabilityDidChange: (availability: MeetingSessionVideoAvailability): void => {
      console.log('Video availability changed to', availability);
      videoAvailable = availability.canStartLocalVideo;
      startVideoWhenReady();
    },

    audioVideoDidStart: (): void => {
      console.log('AV did start.');
      started = true;
      startVideoWhenReady();

      options.reselectAudio().then(() => {
        if (options.joinMuted) {
          console.log('Automatically muting self on join.');
          av.realtimeMuteLocalAudio();
        } else {
          console.log('Automatically unmuting self on join.');
          av.realtimeUnmuteLocalAudio();
        }
      });
    },
  };
}

export function makeReselects(chime: ChimeSdkWrapper): {
  reselectVideo: () => Promise<void>,
  reselectAudio: () => Promise<void>
} {
  const reselectVideo = async () => {
    if (!chime || !chime.currentVideoInputDevice) {
      return;
    }
    await chime.audioVideo?.chooseVideoInputDevice(chime.currentVideoInputDevice.value);
  };

  const reselectAudio = async () => {
    if (!chime || !chime.currentAudioInputDevice) {
      return;
    }

    console.log('Re-selecting current audio:', chime.currentAudioInputDevice);
    await chime.audioVideo?.chooseAudioInputDevice(chime.currentAudioInputDevice.value);
  };

  return {
    reselectAudio,
    reselectVideo,
  };
}