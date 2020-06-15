import React from 'react';
import classNames from 'classnames/bind';

import IconButton from '../../../IconButton';
import { HandRaiseMessage } from '../../../../types/LiveEventMessages';
import icons from '../../../../constants/icons';
import useTranslate from '../../../../hooks/useTranslate';

import styles from './FeedList.css';
const cx = classNames.bind(styles);

interface FeedListProps {
  title: string;
  subtitle: string;
  isQueued?: boolean;
  className?: string;
  messages: HandRaiseMessage[];
  onRemove: (id: string) => void;
  onPromote: (id: string) => void;
}

const FeedList: React.FC<FeedListProps> = ({
  title,
  subtitle,
  messages,
  className,
  onRemove,
  onPromote,
  isQueued,
}) => {
  const translate = useTranslate();

  return (
    <ul className={cx('feed', className)}>
      {messages.map(({ payload }: HandRaiseMessage) => {
        const {
          queueId,
          message,
          inLocalQueue,
          attendeeId = '',
          name = translate('FeedList.anonymousName'),
        } = payload;
        const showPrimaryButton = isQueued || !(queueId && !inLocalQueue);

        return (
          <li key={attendeeId} className={cx('item')}>
            <p className={cx('name')}>
              {!isQueued && <i className={`${cx('hand')} fas fa-hand-paper`} />}
              {name}
            </p>
            {message && <p className={cx('message')}>{message}</p>}
            <div className={cx('buttons')}>
              {showPrimaryButton && (
                <IconButton
                  variant='secondary'
                  title={title}
                  icon={isQueued ? icons.PHONE : icons.ADD}
                  onClick={() => {
                    onPromote(attendeeId);
                  }}
                />
              )}
              <IconButton
                variant='secondary'
                icon={icons.TRASH}
                title={subtitle}
                onClick={() => {
                  onRemove(attendeeId);
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default FeedList;
