import React from 'react';
import classNames from 'classnames/bind';

import styles from './Informational.css';

const cx = classNames.bind(styles);

interface Props {
  className?: string;
  withContainer?: boolean;
}

const Informational: React.FC<Props> = ({
  children,
  className,
  withContainer = false,
}) => {
  return (
    <div className={cx({ container: withContainer })}>
      <p className={cx('informational', className)}>{children}</p>
    </div>
  );
};

export default Informational;
