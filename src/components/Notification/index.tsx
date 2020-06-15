import React, { memo, useEffect } from 'react';
import classNames from 'classnames/bind';

import { Variant } from '../../providers/NotificationProvider';
import CloseButton from '../CloseButton';
import icons from '../../constants/icons';

import styles from './Notification.css';
const cx = classNames.bind(styles);

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  header?: string;
  message?: string;
  onClose: () => void;
  autoClose?: boolean;
}

const iconMap = {
  [Variant.ERROR]: icons.ERROR,
  [Variant.SUCCESS]: icons.SUCCESS,
  [Variant.WARNING]: icons.INFO,
  [Variant.INFO]: icons.INFO,
};

const Notification: React.FC<Props> = ({
  message,
  title,
  variant = Variant.INFO,
  autoClose = true,
  onClose = () => {},
}) => {
  const ariaLive = variant === Variant.ERROR ? 'assertive' : 'polite';
  const ariaRole = variant === Variant.ERROR ? 'alert' : 'status';
  const classes = cx('notification', `notification--${variant}`);
  const iconClasses = cx('icon', iconMap[variant]);

  useEffect(() => {
    if (!autoClose) {
      return;
    }
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div aria-live={ariaLive} role={ariaRole} className={classes}>
      <i className={iconClasses} />
      <CloseButton onClick={onClose} />
      {title && <div className={cx('title')}>{title}</div>}
      {message && <div className={cx('message')}>{message}</div>}
    </div>
  );
};

export default memo(Notification);
