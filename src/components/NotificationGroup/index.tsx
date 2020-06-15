import React from 'react';
// import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';

import {
  useNotificationsState,
  useNotificationDispatch,
  Type,
} from '../../providers/NotificationProvider';
import Portal from '../Portal';
import Notification from '../Notification';

import styles from './NotificationGroup.css';
const cx = classNames.bind(styles);

type Position = 'bottom-left' | 'bottom-right';

interface Props {
  position?: Position;
}

const NotificationGroup: React.FC<Props> = ({ position = 'bottom-right' }) => {
  const { notifications } = useNotificationsState();
  const dispatch = useNotificationDispatch();

  return (
    <Portal rootId='notification-root'>
      <div className={cx('wrapper')}>
        <div className={cx('notifications', position)}>
          {notifications.map(({ id, ...rest }: any) => (
            <Notification
              key={id}
              {...rest}
              onClose={() => dispatch({ type: Type.REMOVE, payload: id })}
            />
          ))}
        </div>
      </div>
    </Portal>
  );
};
export default NotificationGroup;
