import React, { useContext, useState } from 'react';

import getChimeContext from '../../../../context/getChimeContext';
import Button, { ButtonVariant } from '../../../Button';
import { MessageType } from '../../../../types/MeetingMessage';
import useIsMounted from '../../../../hooks/useIsMounted';
import useTranslate from '../../../../hooks/useTranslate';

interface Props {
  attendeeId: string;
}

const KickButton: React.FC<Props> = ({ attendeeId }) => {
  const translate = useTranslate();
  const isMounted = useIsMounted();
  const chime = useContext(getChimeContext());
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant={ButtonVariant.OUTLINE}
      isLoading={isLoading}
      onClick={async () => {
        setIsLoading(true);
        chime?.sendMessage(MessageType.KICK, {
          targetAttendeeId: attendeeId,
        });
        await chime?.kickAttendee(attendeeId);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }}
    >
      {translate('Roster.kick')}
    </Button>
  );
};

export default KickButton;
