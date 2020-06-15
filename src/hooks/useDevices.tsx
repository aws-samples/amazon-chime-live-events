import { useContext, useEffect, useState } from 'react';

import getChimeContext from '../context/getChimeContext';
import FullDeviceInfoType from '../types/FullDeviceInfoType';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';

export default function useDevices() {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const [deviceSwitcherState, setDeviceUpdated] = useState({
    currentAudioInputDevice: chime?.currentAudioInputDevice,
    currentAudioOutputDevice: chime?.currentAudioOutputDevice,
    currentVideoInputDevice: chime?.currentVideoInputDevice,
    audioInputDevices: chime?.audioInputDevices,
    audioOutputDevices: chime?.audioOutputDevices,
    videoInputDevices: chime?.videoInputDevices,
  });

  useEffect(() => {
    const devicesUpdatedCallback = (fullDeviceInfo: FullDeviceInfoType) => {
      console.debug('Devices updated.', fullDeviceInfo);
      setDeviceUpdated({
        ...fullDeviceInfo,
      });
    };

    chime?.subscribeToDevicesUpdated(devicesUpdatedCallback);

    if (chime && !chime.deviceController) {
      console.debug('Initing device controller.');
      chime.initializeDeviceController().then(() => {
        chime.listAndSelectDevices();
      });
    }

    return () => {
      chime?.unsubscribeFromDevicesUpdated(devicesUpdatedCallback);
    };
  }, []);

  return deviceSwitcherState;
}
