import React from 'react';
import classNames from 'classnames/bind';

import styles from './CenteredLoadingSpinner.css';
import LoadingSpinner from './LoadingSpinner';

const cx = classNames.bind(styles);

const CenteredLoadingSpinner: React.FC = () => {
  return (
    <div className={cx('centered')}>
      <LoadingSpinner />
    </div>
  );
};

export default CenteredLoadingSpinner;
