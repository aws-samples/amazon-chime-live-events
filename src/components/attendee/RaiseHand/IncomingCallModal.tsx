import React, { FC } from 'react';
import classNames from 'classnames/bind';

import useTranslate from '../../../hooks/useTranslate';
import Modal from '../../Modal';
import Button, { ButtonVariant, ButtonSize } from '../../Button';

import styles from './IncomingCallModal.css';
const cx = classNames.bind(styles);

interface IncomingCallModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallModal:FC<IncomingCallModalProps> = ({ onAccept, onDecline }) => {
  const translate = useTranslate();

  return( 
    <Modal className={cx('incoming-call')} title={translate('IncomingCallModal.Title')}>
      <p>{translate('IncomingCallModal.Body')}</p>
      <div className={cx('buttons')}>
        <Button variant={ButtonVariant.PRIMARY} size={ButtonSize.LARGE} onClick={onAccept}>{translate('Buttons.Accept')}</Button>
        <Button variant={ButtonVariant.SECONDARY} size={ButtonSize.LARGE} onClick={onDecline}>{translate('Buttons.Decline')}</Button>
      </div>
    </Modal>
  );
}

export default IncomingCallModal;