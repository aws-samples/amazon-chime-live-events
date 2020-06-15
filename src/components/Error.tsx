import classNames from 'classnames/bind';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import routes from '../constants/routes';
import styles from './Error.css';
import useTranslate from '../hooks/useTranslate';

const cx = classNames.bind(styles);

type Props = {
  errorMessage: ReactNode;
  tryAgain?: boolean;
  onTryAgain?: () => void;
};

export default function Error(props: Props) {
  const { errorMessage, tryAgain, onTryAgain } = props;
  const translate = useTranslate();

  return (
    <div className={cx('error')}>
      <div className={cx('errorMessage')}>
        {errorMessage || translate('Error.defaultErrorMessage')}
      </div>
      {tryAgain && (
        <button className={cx('goHomeLink')} onClick={onTryAgain} type='button'>
          {translate('Error.tryAgainLink')}
        </button>
      )}
      <Link className={cx('goHomeLink')} to={routes.HOME}>
        {translate('Error.homeLink')}
      </Link>
    </div>
  );
}
