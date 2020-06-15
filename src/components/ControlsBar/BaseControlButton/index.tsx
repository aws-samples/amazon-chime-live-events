import React from 'react';
import classNames from 'classnames/bind';

import IconButton from '../../IconButton';
import Tooltip from '../../Tooltip';

import styles from './BaseControlButton.css';
const cx = classNames.bind(styles);

interface Props {
  active?: boolean;
  pulse?: boolean;
  icon: string;
  onClick: () => void;
  message: string;
  isLoading?: boolean;
}

const BaseControlButton: React.FC<Props> = ({
  active = false,
  pulse = false,
  message,
  ...rest
}) => (
  <Tooltip tooltip={message} position='right'>
    <IconButton
      active={active}
      className={cx('button')}
      variant='primary'
      pulse={pulse && active}
      {...rest}
      aria-label={message}
    />
  </Tooltip>
);

export default BaseControlButton;
