import React from 'react';
import classNames from 'classnames/bind';

import styles from './CloseButton.css';
const cx = classNames.bind(styles);

interface Props {
  onClick: () => void;
}

const CloseButton: React.FC<Props> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label='Minimize'
    className={cx('close-button')}
  >
    <i className='fa fa-times' />
  </button>
);

export default CloseButton;
