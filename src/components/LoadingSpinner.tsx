import classNames from 'classnames/bind';
import React from 'react';

import styles from './LoadingSpinner.css';

const cx = classNames.bind(styles);

export enum SpinnerVariant {
  INLINE = 'inline',
}

interface Props {
  variant?: SpinnerVariant;
  className?: string;
}

export default function LoadingSpinner({ className, variant }: Props) {
  return (
    <div
      className={`${cx('loadingSpinner', { [`${variant}`]: variant })} ${
        className ? className : ''
      }`}
    >
      <div className={cx('spinner')}>
        {Array.from(Array(12).keys()).map((key) => (
          <div key={key} className={cx('circle', `circle${key + 1}`)} />
        ))}
      </div>
    </div>
  );
}
