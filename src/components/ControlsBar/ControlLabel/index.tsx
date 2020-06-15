import React from 'react';
import classNames from 'classnames/bind';

import styles from './ControlLabel.css';
const cx = classNames.bind(styles);

const ControlLabel: React.FC = ({ children }) => (
  <p className={cx('label')}>{children}</p>
);

export default ControlLabel;
