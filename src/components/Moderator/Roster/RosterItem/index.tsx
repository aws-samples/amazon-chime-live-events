import React, { useContext } from 'react';
import classNames from 'classnames/bind';

import getChimeContext from '../../../../context/getChimeContext';
import IconButton from '../../../IconButton';
import ButtonGroup from '../../../ButtonGroup';
import PromoteButton from './PromoteButton';
import KickButton from './KickButton';
import RosterAttendeeType from '../../../../types/RosterAttendeeType';
import { MessageType } from '../../../../types/MeetingMessage';
import icons from '../../../../constants/icons';
import useAttendeeRealtimeAudio from '../../../../hooks/useAttendeeRealtimeAudio';
import useIsAtVideoCapacity from '../../../../hooks/useIsAtVideoCapacity';
import useTranslate from '../../../../hooks/useTranslate';
import {
  useNotificationDispatch,
  Type,
  Variant,
} from '../../../../providers/NotificationProvider';

import styles from './RosterItem.css';
const cx = classNames.bind(styles);

interface Props {
  attendee: RosterAttendeeType;
  isOnAir?: boolean;
  videoAttendees: Set<string>;
  isLocalUser?: boolean;
  liveControls?: boolean;
}

export default function RosterItem({
  attendee,
  isOnAir = false,
  videoAttendees,
  isLocalUser = false,
  liveControls = true,
}: Props) {
  const chime = useContext(getChimeContext());
  const { id: attendeeId, liveEventAttendeeId } = attendee;
  const { muted } = useAttendeeRealtimeAudio(attendeeId);
  const isVideoAtCapacity = useIsAtVideoCapacity();
  const dispatch = useNotificationDispatch();
  const translate = useTranslate();
  const isVideoEnabled = videoAttendees.has(attendeeId);

  return (
    <div
      key={attendeeId}
      className={cx('attendee', {
        'attendee--live': isOnAir,
        'no-controls': !liveControls,
      })}
    >
      <div className={cx('name', { isLocalUser })}>
        {isLocalUser ? (
          <>
            <i className={cx(icons.CROWN, 'localUserIcon')} /> Me
          </>
        ) : (
          attendee.name
        )}
      </div>
      <ButtonGroup>
        <IconButton
          className={cx('video')}
          active={!muted}
          icon={muted ? icons.MIC_DISABLED : icons.MIC}
          onClick={() => {
            const type = muted ? MessageType.UNMUTE : MessageType.MUTE;
            chime?.sendMessage(type, {
              targetAttendeeId: attendeeId,
            });
          }}
        />
        <IconButton
          className={cx('video')}
          active={isVideoEnabled}
          icon={isVideoEnabled ? icons.VIDEO : icons.VIDEO_DISABLED}
          onClick={() => {
            if (!isVideoEnabled && isVideoAtCapacity) {
              dispatch({
                type: Type.ADD,
                payload: {
                  variant: Variant.ERROR,
                  message: translate('Roster.videoMaxCapacity'),
                },
              });

              return;
            }

            const type = isVideoEnabled
              ? MessageType.DISABLE_VIDEO
              : MessageType.ENABLE_VIDEO;

            chime?.sendMessage(type, {
              targetAttendeeId: attendeeId,
            });
          }}
        />
      </ButtonGroup>
      {liveControls && (
        <ButtonGroup>
          <KickButton attendeeId={attendeeId} />
          <PromoteButton
            isOnAir={isOnAir}
            liveEventAttendeeId={liveEventAttendeeId}
            name={attendee.name}
          />
        </ButtonGroup>
      )}
    </div>
  );
}
