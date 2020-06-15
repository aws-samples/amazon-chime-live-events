import React, { useState, useRef } from 'react';
import classNames from 'classnames/bind';

import Button, { ButtonSize, ButtonVariant } from '../../Button';
import InputWithLabel from '../../Form/InputWithLabel';
import Form from '../../Form';
import icons from '../../../constants/icons';
import useTranslate from '../../../hooks/useTranslate';
import useLocalStorageSync from '../../../hooks/useLocalStorageSync';

import styles from './HandForm.css';
const cx = classNames.bind(styles);

interface Props {
  onSubmit: (question: string, name: string) => void;
  isRaised: boolean;
  attendeeId: string;
  liveEventId: string;
  attendeeName?: string;
}

const HandForm: React.FC<Props> = ({
  onSubmit,
  isRaised,
  attendeeId,
  liveEventId,
  attendeeName,
}) => {
  const [name, setName] = useState(attendeeName);
  const [question, setQuestion] = useState('');
  const key = `${liveEventId}.${attendeeId}.question`;
  useLocalStorageSync(key, question, (val: string) => {
    if (val) {
      setQuestion(val);
    }
  });

  const input = useRef<HTMLInputElement>(null);
  const translate = useTranslate();

  return (
    <Form
      onSubmit={e => {
        e.preventDefault();
        if (!name) {
          input.current?.focus();
          return;
        }
        onSubmit(question, name);
      }}
    >
      {!attendeeName && (
        <InputWithLabel
          className={cx('label')}
          label={translate('HandForm.nameField')}
          onChange={e => setName(e.target.value)}
          forwardRef={input}
          value={name}
        />
      )}
      <InputWithLabel
        className={cx('label')}
        label={translate('HandForm.questionField')}
        onChange={e => setQuestion(e.target.value)}
        value={question}
        asTextArea
      />
      <p className={cx('help-text')}>
        <i className={cx(icons.HELP, 'help-icon')} />
        {translate('HandForm.questionHelpText')}
      </p>
      <Button
        type='submit'
        size={ButtonSize.LARGE}
        variant={ButtonVariant.PRIMARY}
      >
        {isRaised && <i className={cx('success-icon', icons.CHECKMARK)} />}
        {translate(
          isRaised ? 'HandForm.yourHandIsRaised' : 'HandForm.raiseYourHand'
        )}
      </Button>
    </Form>
  );
};

export default HandForm;
