import DeviceType from './DeviceType';

type FullDeviceInfoType = {
  currentAudioInputDevice: DeviceType | null;
  currentAudioOutputDevice: DeviceType | null;
  currentVideoInputDevice: DeviceType | null;
  audioInputDevices: DeviceType[];
  audioOutputDevices: DeviceType[];
  videoInputDevices: DeviceType[];
};

export default FullDeviceInfoType;
