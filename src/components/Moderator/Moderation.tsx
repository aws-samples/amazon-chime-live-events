import React, { useState } from 'react';
import classNames from 'classnames/bind';

import { LiveEventMessagesProvider } from '../../providers/LiveEventMessagesProvider';
import TalentMeetingProvider from '../../providers/TalentMeetingProvider';
import LiveEvent from './LiveEventView/LiveEvent';
import { Response } from '../../types/Response';
import Informational from '../Informational';
import VettingView from './VettingView';
import ControlsBar from '../ControlsBar';
import GridLayout from './GridLayout';
import useTranslate from '../../hooks/useTranslate';

import styles from './Moderation.css';
import AttendeeStatusProvider from '../../providers/AttendeeStatusProvider';
const cx = classNames.bind(styles);

const Moderation: React.FC = () => {
  const translate = useTranslate();
  const [talentMeetingError, setTalentMeetingError] = useState<
    string | undefined
  >();

  const onLoadTalentMeeting = (response: Response) => {
    if (response.error) {
      console.error(response.error);
      setTalentMeetingError(translate('Moderation.talentMeetingDetailsError'));
    }
  };

  return (
    <TalentMeetingProvider onLoad={onLoadTalentMeeting}>
      {/* init liveEvent messaging right away for the moderator so that they begin receiving hand raises. */}
      <LiveEventMessagesProvider initMessaging>
        <AttendeeStatusProvider>
          <GridLayout>
            {talentMeetingError ? (
              <div className={cx('moderationError')}>
                <Informational>
                  <i className='fa fa-exclamation-triangle' />
                  <br />
                  {talentMeetingError}
                </Informational>
              </div>
            ) : (
              <LiveEvent />
            )}
            <VettingView />
            <ControlsBar />
          </GridLayout>
        </AttendeeStatusProvider>
      </LiveEventMessagesProvider>
    </TalentMeetingProvider>
  );
};

export default Moderation;
