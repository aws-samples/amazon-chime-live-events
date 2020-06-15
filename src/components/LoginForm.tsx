import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import routes from '../constants/routes';
import Modal from './Modal';
import Form from './Form';
import Button, { ButtonVariant, ButtonSize } from './Button';
import InlineNotification, { NotificationType } from './InlineNotification';
import InputWithLabel from './Form/InputWithLabel';
import getCredentialsContext from '../context/getCredentialsContext';
import LoadingSpinner, { SpinnerVariant } from './LoadingSpinner';
import {
  useLiveEventContext,
  LiveEventSession,
} from '../providers/LiveEventProvider';
import { useActiveParticipantContext } from '../providers/ActiveParticipantProvider';
import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import useTranslate from '../hooks/useTranslate';

interface Props {
  requireKey?: boolean;
  title: string;
}

const LoginForm: React.FC<Props> = ({ requireKey = true, title }) => {
  // At this point we require an 'ActiveParticipant' context for this form
  // which means that the attendee ID will already be known from the URL.
  const activeParticipant = useActiveParticipantContext();
  const { attendeeId } = activeParticipant;
  const [attendeeName, setAttendeeName] = useState(
    activeParticipant.attendeeName
  );

  // LiveEventParticipantContext provides a method to update the attendee name,
  // which we allow in this form.
  const liveEventParticipant = useContext(getLiveEventParticipantContext());

  const liveEvent: LiveEventSession = useLiveEventContext();
  const { liveEventId } = liveEvent;

  const credentials = useContext(getCredentialsContext());

  const history = useHistory();
  const translate = useTranslate();

  const [accessKey, setAccessKey] = useState('');

  const [errorMessage, setErrorMessage] = useState<string>();
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const authenticate = (e: React.FormEvent) => {
    e.preventDefault();

    // This just prevents repeated submissions.
    if (!buttonEnabled) {
      return;
    }

    if (!attendeeId || !liveEventId || !attendeeName || !accessKey) {
      console.debug(
        'Needs attendeeId, liveEventId, attendeeName, talentMeeting, accessKey to start meeting: ',
        {
          attendeeId,
          liveEventId,
          attendeeName,
          accessKey,
        }
      );
      setButtonEnabled(true);
      setErrorMessage(translate('LoginForm.missingFormFieldsError'));
      return;
    }

    setButtonEnabled(false);

    activeParticipant.attendeeId = attendeeId;
    liveEventParticipant.setAttendeeName(attendeeName);

    credentials
      .authenticate(liveEventId, accessKey, attendeeId)
      .catch(authError => {
        console.error('Error authenticating: ', authError);
        setButtonEnabled(true);
        setErrorMessage(translate('LoginForm.authenticationFailed'));
      });
  };

  useEffect(() => {
    if (credentials.isAuthenticated) {
      history.push(`${routes.DRESSING_ROOM}?region=us-east-1`);
    } else if (accessKey) {
      setButtonEnabled(true);
      setErrorMessage(translate('LoginForm.authenticationFailed'));
    }
  }, [credentials]);

  return (
    <Modal title={title}>
      <Form onSubmit={authenticate}>
        {errorMessage && (
          <InlineNotification type={NotificationType.ERROR}>
            {errorMessage}
          </InlineNotification>
        )}
        {requireKey && (
          <InputWithLabel
            label={translate('LoginForm.accessKeyLabel')}
            value={accessKey}
            onChange={e => setAccessKey(e.target.value?.trim())}
          />
        )}
        <InputWithLabel
          label={translate('LoginForm.attendeeNameLabel')}
          value={attendeeName}
          onChange={e => setAttendeeName(e.target.value)}
        />
        <Button
          type='submit'
          variant={ButtonVariant.PRIMARY}
          size={ButtonSize.LARGE}
        >
          {buttonEnabled ? (
            translate('LoginForm.joinEventFormSubmission')
          ) : (
            <>
              <LoadingSpinner variant={SpinnerVariant.INLINE} />{' '}
              {translate('LoginForm.authenticating')}
            </>
          )}
          {}
        </Button>
      </Form>
    </Modal>
  );
};

export default LoginForm;
