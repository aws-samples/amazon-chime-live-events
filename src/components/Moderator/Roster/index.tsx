import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { VideoTileState } from 'amazon-chime-sdk-js';

import getChimeContext from '../../../context/getChimeContext';
import getMeetingStatusContext from '../../../context/getMeetingStatusContext';
import MeetingStatus from '../../../enums/MeetingStatus';
import getRosterContext from '../../../context/getRosterContext';
import RosterAttendeeType from '../../../types/RosterAttendeeType';
import RosterItem from './RosterItem';
import { useLiveAttendees } from '../../../providers/LiveAttendeesProvider';
import useTranslate from '../../../hooks/useTranslate';
import { useFeatures } from '../../../providers/FeatureProvider';

import styles from './Roster.css';
const cx = classNames.bind(styles);

export default function Roster() {
  const { meetingStatus } = useContext(getMeetingStatusContext());
  const { liveAttendeeIds } = useLiveAttendees();
  const roster = useContext(getRosterContext());
  const chime = useContext(getChimeContext());
  const translate = useTranslate();
  const { minimalRoster } = useFeatures();

  const [videoAttendees, setVideoAttendees] = useState(new Set<string>());
  const attendeeIds: string[] = Object.keys(roster);

  useEffect(() => {
    if (meetingStatus !== MeetingStatus.Succeeded) {
      return;
    }

    const tileIds: { [tileId: number]: string } = {};
    // <tileId, attendeeId>
    const realTimeVideoAttendees = new Set<string>();

    const removeTileId = (tileId: number): void => {
      const removedAttendeeId = tileIds[tileId];
      delete tileIds[tileId];
      realTimeVideoAttendees.delete(removedAttendeeId);
      setVideoAttendees(new Set(realTimeVideoAttendees));
    };

    const observer = {
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (
          !tileState.boundAttendeeId ||
          !tileState.tileId ||
          tileState.isContent
        ) {
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

  return (
    <div className={cx('roster')}>
      {attendeeIds.length > 1 ? ( // Exclude the local user
        attendeeIds.map((attendeeId: string) => {
          if (attendeeId === chime?.configuration?.credentials?.attendeeId) {
            return null;
          }

          const isOnAir = liveAttendeeIds.includes(attendeeId);
          const rosterAttendee: RosterAttendeeType = roster[attendeeId];

          return (
            <RosterItem
              key={attendeeId}
              attendee={rosterAttendee}
              isOnAir={isOnAir}
              videoAttendees={videoAttendees}
              liveControls={!minimalRoster}
            />
          );
        })
      ) : (
        <p className={cx('no-attendees')}>{translate('Roster.noAttendees')}</p>
      )}
    </div>
  );
}
