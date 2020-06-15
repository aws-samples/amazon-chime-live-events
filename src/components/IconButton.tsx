import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames/bind';

import icons from '../constants/icons';

import styles from './IconButton.css';
const cx = classNames.bind(styles);

type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  className?: string;
  active?: boolean;
  pulse?: boolean;
  variant?: Variant;
  isLoading?: boolean;
}

const IconButton: React.FC<Props> = forwardRef(
  (props: Props, ref?: React.Ref<HTMLButtonElement>) => {
    const {
      icon,
      active,
      pulse,
      className,
      isLoading,
      variant = 'default',
      ...rest
    } = props;

    return (
      <button
        className={cx(
          'button',
          `button--${variant}`,
          { active, pulse },
          className
        )}
        ref={ref}
        {...rest}
      >
        <i className={isLoading ? icons.SPINNER : icon} />
      </button>
    );
  }
);

export default IconButton;
