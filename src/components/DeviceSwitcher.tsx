import classNames from 'classnames/bind';
import React, { useContext, useRef, useEffect } from 'react';
import Dropdown from 'react-dropdown';

import getChimeContext from '../context/getChimeContext';
import useDevices from '../hooks/useDevices';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import DeviceType from '../types/DeviceType';
import useTranslate from '../hooks/useTranslate';

import styles from './DeviceSwitcher.css';

const cx = classNames.bind(styles);

export default function DeviceSwitcher() {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const translate = useTranslate();
  const deviceSwitcherState = useDevices();
  const video = useRef<HTMLVideoElement>(null);

  // eslint-disable-next-line prettier/prettier
  const changed = (selected: DeviceType, existing: DeviceType | undefined | null): boolean =>
    (!existing || selected.value !== existing.value);

  useEffect(() => {
    if (
      video.current &&
      chime?.deviceController &&
      chime?.currentVideoInputDevice
    ) {
      // If this finishes too late, it will happen after our cleanup, and
      // we will have a spurious video indicator. The SDK should return a promise.
      chime.deviceController?.startVideoPreviewForVideoInput(video.current!);
    }
  }, [deviceSwitcherState, video]);

  useEffect(() => {
    return () => {
      if (!chime) {
        return;
      }

      const videoElement = video.current;
      const deviceController = chime.deviceController;

      if (videoElement && deviceController) {
        console.log('Stopping video preview.');
        deviceController.stopVideoPreviewForVideoInput(videoElement);
      }
    };
  }, []);

  return (
    <div className={cx('deviceContainer')}>
      <div className={cx('deviceList')}>
        <div className={cx('form-label')}>
          {translate('DressingRoom.inputAudioLabel')}
        </div>
        <Dropdown
          className={cx('dropdown')}
          controlClassName={cx('control')}
          placeholderClassName={cx('placeholder')}
          menuClassName={cx('menu')}
          arrowClassName={cx('arrow')}
          value={deviceSwitcherState.currentAudioInputDevice || undefined}
          options={
            deviceSwitcherState.audioInputDevices || ([] as DeviceType[])
          }
          disabled={
            !deviceSwitcherState.audioInputDevices ||
            !deviceSwitcherState.audioInputDevices.length
          }
          onChange={async (selectedDevice: DeviceType) => {
            // eslint-disable-next-line prettier/prettier
            if (changed(selectedDevice, deviceSwitcherState.currentAudioInputDevice)) {
              await chime?.chooseAudioInputDevice(selectedDevice);
            }
          }}
          placeholder={
            deviceSwitcherState.currentAudioInputDevice
              ? translate('DeviceSwitcher.noAudioInputPlaceholder')
              : ''
          }
        />

        <div className={cx('form-label')}>
          {translate('DressingRoom.ouputAudioLabel')}
        </div>
        <Dropdown
          className={cx('dropdown')}
          controlClassName={cx('control')}
          placeholderClassName={cx('placeholder')}
          menuClassName={cx('menu')}
          arrowClassName={cx('arrow')}
          value={deviceSwitcherState.currentAudioOutputDevice || undefined}
          options={
            deviceSwitcherState.audioOutputDevices || ([] as DeviceType[])
          }
          disabled={
            !deviceSwitcherState.audioOutputDevices ||
            !deviceSwitcherState.audioOutputDevices.length
          }
          onChange={async (selectedDevice: DeviceType) => {
            // eslint-disable-next-line prettier/prettier
            if (!chime?.browserBehavior.supportsSetSinkId()) {
              return;
            }

            if (changed(selectedDevice, deviceSwitcherState.currentAudioOutputDevice)) {
              await chime?.chooseAudioOutputDevice(selectedDevice);
            }
          }}
          placeholder={
            deviceSwitcherState.currentAudioOutputDevice
              ? translate('DeviceSwitcher.noAudioOutputPlaceholder')
              : ''
          }
        />
        <div className={cx('form-label')}>
          {translate('DressingRoom.inputVideoLabel')}
        </div>
        <Dropdown
          className={cx('dropdown')}
          controlClassName={cx('control')}
          placeholderClassName={cx('placeholder')}
          menuClassName={cx('menu')}
          arrowClassName={cx('arrow')}
          value={deviceSwitcherState.currentVideoInputDevice || undefined}
          options={
            deviceSwitcherState.videoInputDevices || ([] as DeviceType[])
          }
          disabled={
            !deviceSwitcherState.videoInputDevices ||
            !deviceSwitcherState.videoInputDevices.length
          }
          onChange={async (selectedDevice: DeviceType) => {
            // eslint-disable-next-line prettier/prettier
            if (changed(selectedDevice, deviceSwitcherState.currentVideoInputDevice)) {
              await chime?.chooseVideoInputDevice(selectedDevice);
            }
          }}
          placeholder={
            deviceSwitcherState.currentVideoInputDevice
              ? translate('DeviceSwitcher.noVideoInputPlaceholder')
              : ''
          }
        />
      </div>
      <video className={cx('videoPreview')} ref={video}></video>
    </div>
  );
}
