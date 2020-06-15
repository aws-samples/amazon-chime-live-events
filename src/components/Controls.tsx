import classNames from 'classnames/bind';
import React, { useContext, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router-dom';

import IconButton from '../components/IconButton';
import getChimeContext from '../context/getChimeContext';
import { ChimeSdkWrapper } from '../providers/ChimeProvider';
import routes from '../constants/routes';
import ButtonGroup from '../components/ButtonGroup';
import { VideoStatus } from '../types/VideoStatus';
import Tooltip from './Tooltip';
import icons from '../constants/icons';
import useTranslate from '../hooks/useTranslate';

import styles from './Controls.css';
const cx = classNames.bind(styles);

type Props = {
  allowAudioControls?: boolean;
  allowVideoControls?: boolean;
  allowLeave?: boolean;
  allowEnd?: boolean;
  onEnd?: () => void;
};

export default function Controls(props: Props) {
  const {
    allowAudioControls,
    allowVideoControls,
    allowLeave,
    allowEnd,
    onEnd,
  } = props;

  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const [muted, setMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState(VideoStatus.Disabled);
  const translate = useTranslate();
  const history = useHistory();

  useEffect(() => {
    const callback = (localMuted: boolean) => {
      setMuted(localMuted);
    };
    chime?.audioVideo?.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);
    if (chime?.audioVideo?.hasStartedLocalVideoTile()) {
      setVideoStatus(VideoStatus.Enabled);
    }

    return () => {
      chime?.audioVideo?.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback);
    };
  }, []);

  return (
    <ButtonGroup
      className={cx('controls', {
        videoEnabled: videoStatus === VideoStatus.Enabled,
        audioMuted: muted,
      })}
    >
      {allowAudioControls && (
        <>
          <div className={cx('micMuted')}>
            <FormattedMessage id='Controls.micMutedInScreenViewMode' />
          </div>
          <Tooltip
            tooltip={
              muted
                ? translate('Controls.unmuteTooltip')
                : translate('Controls.muteTooltip')
            }
          >
            <IconButton
              className={cx('muteButton', {
                enabled: !muted,
              })}
              onClick={async () => {
                if (muted) {
                  chime?.audioVideo?.realtimeUnmuteLocalAudio();
                } else {
                  chime?.audioVideo?.realtimeMuteLocalAudio();
                }
                // Adds a slight delay to close the tooltip before rendering the updated text in it
                await new Promise(resolve => setTimeout(resolve, 10));
              }}
              icon={muted ? icons.MIC_DISABLED : icons.MIC}
            />
          </Tooltip>
        </>
      )}
      {allowVideoControls && (
        <Tooltip
          tooltip={
            videoStatus === VideoStatus.Disabled
              ? translate('Controls.turnOnVideoTooltip')
              : translate('Controls.turnOffVideoTooltip')
          }
        >
          <IconButton
            className={cx('videoButton', {
              enabled: videoStatus === VideoStatus.Enabled,
            })}
            onClick={async () => {
              // Adds a slight delay to close the tooltip before rendering the updated text in it
              await new Promise(resolve => setTimeout(resolve, 10));
              console.debug('Current video status:', VideoStatus.Disabled);
              if (videoStatus === VideoStatus.Disabled) {
                setVideoStatus(VideoStatus.Loading);
                try {
                  if (!chime?.currentVideoInputDevice) {
                    throw new Error('currentVideoInputDevice does not exist');
                  }
                  await chime?.chooseVideoInputDevice(
                    chime?.currentVideoInputDevice
                  );
                  console.info('Starting local video.', chime?.audioVideo);
                  console.info(
                    'Current input:',
                    chime?.currentVideoInputDevice
                  );
                  chime?.audioVideo?.startLocalVideoTile();
                  setVideoStatus(VideoStatus.Enabled);
                } catch (error) {
                  console.error(error);
                  setVideoStatus(VideoStatus.Disabled);
                }
              } else if (videoStatus === VideoStatus.Enabled) {
                setVideoStatus(VideoStatus.Loading);
                chime?.audioVideo?.stopLocalVideoTile();
                setVideoStatus(VideoStatus.Disabled);
              }
            }}
            icon={
              videoStatus === VideoStatus.Enabled
                ? icons.VIDEO
                : icons.VIDEO_DISABLED
            }
          />
        </Tooltip>
      )}
      {allowEnd && (
        <Tooltip tooltip={translate('Controls.endMeetingTooltip')}>
          <IconButton
            variant='danger'
            onClick={() => {
              if (onEnd) {
                onEnd();
              } else {
                chime?.disableVideoAndLeaveRoom(true).then(() => {
                  history.push(routes.HOME);
                });
              }
            }}
            icon={icons.CLOSE}
          />
        </Tooltip>
      )}
      {allowLeave && (
        <Tooltip tooltip={translate('Controls.leaveMeetingTooltip')}>
          <IconButton
            variant='danger'
            onClick={() => {
              chime?.disableVideoAndLeaveRoom().then(() => {
                history.push(`${routes.HOME}`);
              });
            }}
            icon={icons.CLOSE}
          />
        </Tooltip>
      )}
    </ButtonGroup>
  );
}
