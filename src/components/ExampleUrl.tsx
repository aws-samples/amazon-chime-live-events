import React from 'react';

import useTranslate from '../hooks/useTranslate';

const ExampleUrl: React.FC = () => {
  const translate = useTranslate();

  const baseUrl = window.location.origin;
  return <>{translate('ExampleUrl.fullExample', { baseUrl })}</>;
};

export default ExampleUrl;
