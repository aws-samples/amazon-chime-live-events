import React from 'react';

import Button, { ButtonVariant } from '../../../Button';
import usePromotion from '../../../../hooks/controls/usePromotion';
import useTranslate from '../../../../hooks/useTranslate';

interface Props {
  isOnAir: boolean;
  liveEventAttendeeId?: string | null;
  name?: string;
  isLocalUser?: boolean;
}

const PromoteButton: React.FC<Props> = ({
  liveEventAttendeeId,
  isOnAir,
  name,
}) => {
  const { onClick, isLoading } = usePromotion({
    liveEventAttendeeId,
    isOnAir,
    name,
  });
  const message = useTranslate(isOnAir ? 'Roster.remove' : 'Roster.promote');

  return (
    <Button
      onClick={onClick}
      isLoading={isLoading}
      variant={isOnAir ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
      style={{ minWidth: '5.25rem' }}
    >
      {message}
    </Button>
  );
};

export default PromoteButton;
