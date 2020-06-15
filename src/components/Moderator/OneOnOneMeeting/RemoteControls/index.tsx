import React, { useContext, useEffect, useState } from 'react';
import { VideoTileState } from 'amazon-chime-sdk-js';
import classNames from 'classnames/bind';

import getChimeContext from '../../../../context/getChimeContext';
import getMeetingStatusContext from '../../../../context/getMeetingStatusContext';
import MeetingStatus from '../../../../enums/MeetingStatus';
import getOneOnOneAttendeeContext from '../../../../context/getOneOnOneAttendeeContext';
import { ChimeSdkWrapper } from '../../../../providers/ChimeProvider';
import {
  useMetaDispatch,
  useMetaState,
} from '../../../../providers/MetaStateProvider';
import { Types } from '../../../../providers/MetaStateProvider/state';
import IconButton from '../../../../components/IconButton';
import { MessageType } from '../../../../types/MeetingMessage';
import useAttendeeRealtimeAudio from '../../../../hooks/useAttendeeRealtimeAudio';
import ButtonGroup from '../../../ButtonGroup';
import Controls from '../../../Controls';
import Tooltip from '../../../Tooltip';
import useTranslate from '../../../../hooks/useTranslate';
import { useTalentMeetingContext } from '../../../../providers/TalentMeetingProvider';

import styles from './RemoteControls.css';
const cx = classNames.bind(styles);

export default function RemoteControls() {
  const chime: ChimeSdkWrapper | null = useContext(getChimeContext());
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const talentMeetingService = useTalentMeetingContext();
  const rosterAttendee = useContext(getOneOnOneAttendeeContext());
  const translate = useTranslate();
  const attendeeId = rosterAttendee?.id;
  const { muted } = useAttendeeRealtimeAudio(attendeeId);
  const [videoAttendees, setVideoAttendees] = useState(new Set());
  const dispatch = useMetaDispatch();
  const { externalAttendeeId } = useMetaState();

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const tileIds: { [tileId: number]: string } = {};
    // <tileId, attendeeId>
    const realTimeVideoAttendees = new Set();

    const removeTileId = (tileId: number): void => {
      const removedAttendeeId = tileIds[tileId];
      delete tileIds[tileId];
      realTimeVideoAttendees.delete(removedAttendeeId);
      setVideoAttendees(new Set(realTimeVideoAttendees));
    };

    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.boundAttendeeId || !tileState.tileId) {
          return;
        }

        tileIds[tileState.tileId] = tileState.boundAttendeeId;
        realTimeVideoAttendees.add(tileState.boundAttendeeId);
        setVideoAttendees(new Set(realTimeVideoAttendees));
      },
      videoTileWasRemoved: (tileId: number): void => {
        removeTileId(tileId);
      },
    };

    chime?.audioVideo?.addObserver(observer);

    return () => {
      chime?.audioVideo?.removeObserver(observer);
    };
  }, [meetingStatus]);

  if (attendeeId && externalAttendeeId) {
    return (
      <ButtonGroup key={attendeeId} className={cx('remote-controls')}>
        <Tooltip
          tooltip={translate(
            videoAttendees.has(attendeeId)
              ? 'RemoteControls.disableVideo'
              : 'RemoteControls.enableVideo'
          )}
        >
          <Controls
            allowEnd
            onEnd={() => {
              dispatch({ type: Types.ONE_ON_ONE_ENDED });
            }}
          />
        </Tooltip>
        <Tooltip
          tooltip={translate(
            videoAttendees.has(attendeeId)
              ? 'RemoteControls.disableVideo'
              : 'RemoteControls.enableVideo'
          )}
        >
          <IconButton
            className={cx('button')}
            onClick={() => {
              const type = videoAttendees.has(attendeeId)
                ? MessageType.DISABLE_VIDEO
                : MessageType.ENABLE_VIDEO;
              chime?.sendMessage(type, {
                targetAttendeeId: attendeeId,
              });
            }}
            icon={
              videoAttendees.has(attendeeId)
                ? 'fas fa-video'
                : 'fas fa-video-slash'
            }
          />
        </Tooltip>
        <Tooltip
          tooltip={translate(
            muted
              ? 'RemoteControls.unmuteAttendee'
              : 'RemoteControls.muteAttendee'
          )}
        >
          <IconButton
            className={cx('button')}
            onClick={() => {
              const type = muted ? MessageType.UNMUTE : MessageType.MUTE;
              chime?.sendMessage(type, {
                targetAttendeeId: attendeeId,
              });
            }}
            icon={muted ? 'fas fa-microphone-slash' : 'fas fa-microphone'}
          />
        </Tooltip>
        <Tooltip tooltip={translate('RemoteControls.moveToHolding')}>
          <IconButton
            className={cx('button', 'success')}
            onClick={() => {
              dispatch({
                type: Types.TRANSITIONING_ATTENDEE,
                payload: attendeeId,
              });
              chime?.sendMessage(MessageType.TRANSFER_MEETING, {
                targetAttendeeId: attendeeId,
                liveEventAttendeeId: externalAttendeeId,
                meetingId: talentMeetingService.talentMeeting?.id,
              });
            }}
            icon='fas fa-check'
          />
        </Tooltip>
      </ButtonGroup>
    );
  }

  return null;
}
