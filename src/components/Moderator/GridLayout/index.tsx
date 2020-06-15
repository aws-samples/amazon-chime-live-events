import React from 'react';
import classNames from 'classnames/bind';

import { useFeatures } from '../../../providers/FeatureProvider';

import styles from './GridLayout.css';
const cx = classNames.bind(styles);

const GridLayout: React.FC = ({ children }) => {
  const { hideQueue, hideRoster } = useFeatures();

  return (
    <div
      className={cx(
        'GridLayout',
        { ['GridLayout--hideQueue']: hideQueue },
        { ['GridLayout--hideRoster']: hideRoster }
      )}
    >
      {children}
    </div>
  );
};
export default GridLayout;
