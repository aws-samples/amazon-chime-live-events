import React from 'react';
import classNames from 'classnames/bind';

import styles from './Modal.css';

const cx = classNames.bind(styles);

interface Props {
  title?: string;
  className?: string;
}

const Modal: React.FC<Props> = ({ children, title, className }) => {
  return (
    <main className={`${cx('modal')} ${className ? className : ''}`}>
      {title && <h1>{title}</h1>}
      {children}
    </main>
  );
};

export default Modal;
