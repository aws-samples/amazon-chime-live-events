import React, { FC, useState } from 'react';
import classNames from 'classnames/bind';

import Form from './Form';
import Button from './Button';
import InputWithLabel from './Form/InputWithLabel';
import IconButton from './IconButton';
import CloseButton from '../components/CloseButton';
import icons from '../constants/icons';
import useTranslate from '../hooks/useTranslate';

import styles from './StreamSourceForm.css';
const cx = classNames.bind(styles);

interface StreamSourceInputProps {
  onSubmit: (val: string) => void;
}

const StreamSourceInput: FC<StreamSourceInputProps> = ({ onSubmit }) => {
  const translate = useTranslate();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInputValue((e.target as HTMLInputElement).value);
  };

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    onSubmit(inputValue);
  };

  const watchStr = translate('StreamSourceForm.Watch');

  return (
    <div className={cx('wrapper', { isOpen })}>
      <IconButton
        aria-haspopup='true'
        aria-expanded={isOpen}
        aria-label={watchStr}
        onClick={() => setIsOpen(open => !open)}
        className={cx('watch-button')}
        icon={icons.TV}
      />
      <div className={cx('streamSource__container')}>
        <CloseButton onClick={() => setIsOpen(false)} />
        <Form onSubmit={handleSubmit} className={cx('streamSource__form')}>
          <InputWithLabel
            className={cx('streamSource__input')}
            onChange={handleChange}
            label={translate('StreamSourceForm.Placeholder')}
            value={inputValue}
          />
          <Button className={cx('streamSource__button')} type='submit'>
            {watchStr}
          </Button>
        </Form>
        <div className={cx('arrow')} />
      </div>
    </div>
  );
};

export default StreamSourceInput;
