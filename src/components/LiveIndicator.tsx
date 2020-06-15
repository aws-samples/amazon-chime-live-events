import React from 'react';
import classNames from 'classnames/bind';

import useTranslate from '../hooks/useTranslate';

import styles from './LiveIndicator.css';

const cx = classNames.bind(styles);

interface Props {
  className?: string;
  children?: any;
  position?: 'top-right' | 'bottom-right';
  isLive?: boolean;
}

const LiveIndicator: React.FC<Props> = ({
  children,
  className,
  position = 'top-right',
  isLive = true,
}) => {
  const translate = useTranslate();

  return (
    <div
      className={cx(
        'liveIndicator',
        {
          topRight: position === 'top-right',
          bottomRight: position === 'bottom-right',
          live: isLive,
          notLive: !isLive,
        },
        className
      )}
    >
      {children || translate('LiveIndicator.default')}
    </div>
  );
};

export default LiveIndicator;
