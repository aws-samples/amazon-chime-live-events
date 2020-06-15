import React, { HTMLAttributes } from 'react';
import classNames from 'classnames/bind';

import styles from './Button.css';
const cx = classNames.bind(styles);

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ALERT = 'alert',
  OUTLINE = 'outline',
  DEFAULT = 'default',
}

export enum ButtonSize {
  LARGE = 'large',
  NORMAL = 'normal',
}

interface Props extends HTMLAttributes<HTMLButtonElement> {
  onClick?: (event: React.MouseEvent) => void;
  type?: 'submit' | 'button' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  isLoading?: boolean;
}

const Form: React.FC<Props> = ({
  onClick,
  children,
  type = 'button',
  isLoading = false,
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.NORMAL,
  className,
  ...rest
}) => {
  return (
    <button
      {...rest}
      className={cx('button', {
        [`variant-${variant}`]: !!variant,
        [`${size}`]: !!size,
        [`${className}`]: !!className,
      })}
      onClick={onClick}
      type={type}
    >
      {isLoading ? <i className='fas fa-spinner fa-spin' /> : children}
    </button>
  );
};

export default Form;
