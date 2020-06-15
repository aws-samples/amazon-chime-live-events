import React, { PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

import { DefaultBrowserBehavior } from 'amazon-chime-sdk-js';

import Informational from './Informational';

const Unsupported = () => {
  return (
    <Informational>
      {useIntl().formatMessage({ id: 'UnsupportedBrowser.message' })}
    </Informational>
  );
};

export const UnsupportedCheck: React.FC<PropsWithChildren<{}>> = (props) => (
  new DefaultBrowserBehavior().isSupported() ? <>{props.children}</> : <Unsupported />
);