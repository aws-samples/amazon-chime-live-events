import React from 'react';
import classNames from 'classnames/bind';

import styles from './Header.css';
const cx = classNames.bind(styles);

export const Header: React.FC = ({ children }) => (
  <h2 className={cx('header')}>{children}</h2>
);

export default Header;
