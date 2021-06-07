import classNames from 'classnames/bind';
import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';

import routes from '../constants/routes';
import DeviceSwitcher from './DeviceSwitcher';
import Modal from './Modal';
import Button, { ButtonVariant, ButtonSize } from './Button';
import LoadingSpinner, { SpinnerVariant } from './LoadingSpinner';
import getCredentialsContext from '../context/getCredentialsContext';
import { useFeatures } from '../providers/FeatureProvider';
import useTranslate from '../hooks/useTranslate';

import styles from './DressingRoom.css';
import { useLiveEventMessagingService } from '../providers/LiveEventMessagesProvider';
import { AttendeeMeetingProgress } from '../enums/AtttendeeMeetingProgress';

const cx = classNames.bind(styles);

const JOIN_BUTTON_TIMEOUT_MSEC = 4000;

const message = (translate: any, name: string) =>
  translate(`DressingRoom.${name}`);

type RoomPreviewProps = {
  sendUpdates: boolean;
};
const DressingRoomPreview = (props: RoomPreviewProps) => {
  const { sendUpdates } = props;
  const history = useHistory();
  const translate = useTranslate();
  const [buttonEnabled, enableButton] = useState(false);
  const messagingService = useLiveEventMessagingService();

  useEffect(() => {
    setTimeout(() => enableButton(true), JOIN_BUTTON_TIMEOUT_MSEC);
  }, []);

  return (
    <>
      <DeviceSwitcher />
      <Button
        className={cx('button')}
        variant={ButtonVariant.PRIMARY}
        size={ButtonSize.LARGE}
        onClick={() => {
          if (!buttonEnabled) {
            return;
          }
          if (sendUpdates) {
            messagingService?.notifyModerator(AttendeeMeetingProgress.JOINING);
          }
          const search = history.location.search;
          const next = `${routes.MEETING}${search}`;
          history.replace(next);
        }}
      >
        {buttonEnabled ? (
          message(translate, 'letsGoButton')
        ) : (
          <>
            <LoadingSpinner variant={SpinnerVariant.INLINE} />{' '}
            {message(translate, 'gettingReady')}
          </>
        )}
      </Button>
    </>
  );
};
type Props = {
  sendUpdates?: boolean;
};

const DressingRoom = (props: Props) => {
  const { sendUpdates = false } = props;
  const translate = useTranslate();
  const [mediaStream, setMediaStream] = useState<boolean>(false);
  const messagingService = useLiveEventMessagingService();
  const history = useHistory();
  const credentials = useContext(getCredentialsContext());
  const { straightToMeeting } = useFeatures();

  useEffect(() => {
    if (straightToMeeting && credentials.isAuthenticated) {
      history.push(`${routes.MEETING}?region=us-east-1`);
    }
  }, [straightToMeeting, credentials.isAuthenticated]);

  return (
    <Modal className={cx('dressingRoom')} title={message(translate, 'header')}>
      {mediaStream ? (
        <DressingRoomPreview sendUpdates={sendUpdates} />
      ) : (
        <div>
          <p>{message(translate, 'permissionPrompt1')}</p>
          <ol className={cx('list')}>
            <li>{message(translate, 'permissionPrompt2')}</li>
            <li>{message(translate, 'permissionPrompt3')}</li>
            <li>{message(translate, 'permissionPrompt4')}</li>
          </ol>
          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.LARGE}
            className={cx('button')}
            onClick={async () => {
              // We need to request media before we are able to pick devices.
              // We request both video and audio so that Firefox offers a combo picker, but when
              // the device controller updates its cache by enumerating devices, I have seen a request
              // for another picker for microphone only. Oh well. "Remember this decision" helps.
              let stream: MediaStream;

              try {
                console.log('Getting audio/video stream');

                stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: true,
                });
              } catch (err) {
                console.log('Could not get audio/video stream: ', err.message);

                try {
                  console.log('Falling back to audio stream');

                  stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                  });
                } catch (audioErr) {
                  console.log(`Could not get a/v stream: ${audioErr.message}`);

                  alert(message(translate, 'noDevices'));
                  return;
                }
              }

              // Make sure we are not accidentally holding on to a media stream,
              // which will cause an activity indicator to continue to show.
              setMediaStream(stream.active);
              stream.getTracks().forEach(track => {
                track.stop();
                stream.removeTrack(track);
              });

              // Notify moderator of attendee progress.
              if (sendUpdates) {
                messagingService?.notifyModerator(
                  AttendeeMeetingProgress.GETTING_READY
                );
              }
            }}
          >
            {message(translate, 'readyButton')}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default DressingRoom;
