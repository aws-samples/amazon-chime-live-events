/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import { Redirect } from 'react-router-dom';

import routes from '../constants/routes';
import getCredentialsContext from '../context/getCredentialsContext';

export const Authenticated: React.FC = ({ children }) => {
  const credentialContext = useContext(getCredentialsContext());

  if (credentialContext.isAuthenticated) {
    console.log('Authenticated.');

    return <>{children}</>;
  }
  console.log('Not authenticated; going home.');
  return <Redirect to={routes.HOME} />;
};
