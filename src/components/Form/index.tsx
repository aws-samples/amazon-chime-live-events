import React from 'react';
import classNames from 'classnames/bind';

import styles from './Form.css';

const cx = classNames.bind(styles);

interface Props {
  onSubmit: (event: React.FormEvent) => void;
  className?: string;
}

const Form: React.FC<Props> = ({ children, onSubmit, className = '' }) => {
  return (
    <form
      className={cx('form', className)}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
};

export default Form;
