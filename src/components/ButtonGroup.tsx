import React from 'react';
import classNames from 'classnames/bind';

import styles from './ButtonGroup.css';

const cx = classNames.bind(styles);

interface Props {
  className?: string;
  stacked?: boolean;
}

const ButtonGroup: React.FC<Props> = ({ children, className, stacked }) => {
  return (
    <div className={cx('buttonGroup', className, { stacked })}>{children}</div>
  );
};

export default ButtonGroup;
