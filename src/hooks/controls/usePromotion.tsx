import { useState } from 'react';

import {
  useNotificationDispatch,
  Type as NotifType,
} from '../../providers/NotificationProvider';
import { useTalentMeetingContext } from '../../providers/TalentMeetingProvider';
import useTranslate from '../../hooks/useTranslate';

interface Props {
  isOnAir: boolean;
  liveEventAttendeeId?: string | null;
  name?: string;
  isLocalUser?: boolean;
}

const usePromotion = ({
  liveEventAttendeeId,
  isLocalUser = false,
  isOnAir,
  name,
}: Props) => {
  const translate = useTranslate();
  const dispatch = useNotificationDispatch();
  const talentMeeting = useTalentMeetingContext();
  const [isLoading, setIsLoading] = useState(false);

  const onError = () => {
    console.log(
      isOnAir
        ? `Error removing ${name} from the live event.`
        : `Error promoting ${name} to the live event.`
    );

    if (isOnAir) {
      const payload = translate(
        isLocalUser ? 'Promote.selfDemoteError' : 'Promote.demoteError',
        { name }
      );

      dispatch({
        type: NotifType.ATTENDEE_DEMOTED_ERROR,
        payload,
      });
    } else {
      const payload = translate(
        isLocalUser ? 'Promote.selfPromoteError' : 'Promote.demoteError',
        { name }
      );

      dispatch({
        type: NotifType.ATTENDEE_PROMOTED_ERROR,
        payload,
      });
    }
  };

  const onClick = async () => {
    try {
      if (!liveEventAttendeeId) {
        console.log('Missing liveEventAttendeeId, cannot toggle live status');
        return;
      }

      setIsLoading(true);

      if (isOnAir) {
        await talentMeeting?.removeLiveAttendee(liveEventAttendeeId);
        dispatch({
          type: NotifType.ATTENDEE_REMOVED,
          payload: translate(
            isLocalUser ? 'Roster.demoteLocalUser' : 'Roster.demoteRemoteUser',
            { name }
          ),
        });
      } else {
        await talentMeeting?.addLiveAttendee(liveEventAttendeeId);
        dispatch({
          type: NotifType.ATTENDEE_PROMOTED,
          payload: translate(
            isLocalUser
              ? 'Roster.promoteLocalUser'
              : 'Roster.promoteRemoteUser',
            { name }
          ),
        });
      }
    } catch (e) {
      console.error('Something went wrong toggling live attendee:', e.message);
      onError();
    }

    setIsLoading(false);
  };

  return {
    onClick,
    isLoading,
  };
};

export default usePromotion;
