import React from 'react';
import classNames from 'classnames/bind';

import styles from './InlineNotification.css';

const cx = classNames.bind(styles);

export enum NotificationType {
  ERROR = 'error',
}

interface Props {
  type: NotificationType;
}

const Form: React.FC<Props> = ({ type, children }) => {
  return (
    <p
      className={cx('inline-notification', {
        [`${type}`]: !!type,
      })}
    >
      {children}
    </p>
  );
};

export default Form;
