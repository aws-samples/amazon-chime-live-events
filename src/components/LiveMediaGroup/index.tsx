import React from 'react';
import classNames from 'classnames/bind';

import { useLiveAttendees } from '../../providers/LiveAttendeesProvider';
import { useContentShareState } from '../../providers/ContentShareProvider';
import ContentShare from '../ContentShare';
import LiveRemoteVideoGroup from '../LiveRemoteVideoGroup';

import styles from './LiveMediaGroup.css';
const cx = classNames.bind(styles);

interface Props {
  theaterView?: boolean;
  showLocalTile?: boolean;
  showLiveBadges?: boolean;
}

const LiveMediaGroup: React.FC<Props> = ({
  theaterView = false,
  showLocalTile = false,
  showLiveBadges = false,
}) => {
  const { liveAttendeeIds, isLocalUserLive } = useLiveAttendees();
  const { isSomeoneSharing, isLocalUserSharing } = useContentShareState();

  const isRemoteVideoAvailable =
    liveAttendeeIds.length > 1 || (liveAttendeeIds.length && !isLocalUserLive);
  const isContentAvailable = isSomeoneSharing || isLocalUserSharing;
  const classes = cx('wrapper', {
    'wrapper--split': isContentAvailable && isRemoteVideoAvailable,
    'wrapper--theater': theaterView,
  });

  return (
    <div className={classes}>
      <ContentShare className={cx('contentShare')} />
      <LiveRemoteVideoGroup
        showLocalTile={showLocalTile}
        className={cx('videos')}
        hideInformational={isContentAvailable}
        showLiveBadges={showLiveBadges}
      />
    </div>
  );
};

export default LiveMediaGroup;
