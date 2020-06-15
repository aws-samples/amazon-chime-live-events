import React from 'react';

import LoginForm from '../../LoginForm';
import ActiveParticipantProvider from '../../../providers/ActiveParticipantProvider';
import useTranslate from '../../../hooks/useTranslate';

const Home: React.FC = () => {
  const translate = useTranslate();

  return (
    <ActiveParticipantProvider>
      <LoginForm title={translate('ModeratorHome.joinEventFormTitle')} />
    </ActiveParticipantProvider>
  );
};

export default Home;
