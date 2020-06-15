import React, { useState } from 'react';
import classNames from 'classnames/bind';

import styles from './InputWithLabel.css';
const cx = classNames.bind(styles);

interface Props {
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  label: string;
  forwardRef?: any;
  value?: string;
  className?: string;
  asTextArea?: boolean;
}

const InputWithLabel: React.FC<Props> = ({
  onChange,
  label,
  value = '',
  className,
  forwardRef,
  asTextArea = false,
}) => {
  const [focused, setFocused] = useState(false);
  const El = asTextArea ? 'textarea' : 'input';

  return (
    <div
      className={cx(
        'wrapper',
        { active: focused || value, focused },
        className
      )}
    >
      <label>
        <div className={cx('label')}>{label}</div>
        <El
          ref={forwardRef}
          className={cx('input')}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          value={value}
          onChange={onChange}
        />
      </label>
    </div>
  );
};

export default InputWithLabel;
