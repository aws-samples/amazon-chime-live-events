import React, { ReactNode, useContext, useEffect, useState } from 'react';

import { getLiveEventsURL } from '../utils/configuredURLs';
import { TalentMeeting } from '../types/TalentMeeting';
import getCredentialsContext from '../context/getCredentialsContext';

import { RequestHeadersType } from '../types/RequestHeadersType';
import { jsonOrBail, hasError } from '../utils/ResponseUtils';
import { useLiveEventContext } from './LiveEventProvider';
import { useVerifiedParticipantContext } from './VerifiedParticipantProvider';
import { Response } from '../types/Response';
import CenteredLoadingSpinner from '../components/CenteredLoadingSpinner';

const constructLiveEventsURL = (eventId?: string) => {
  const liveEventsURLBase = getLiveEventsURL();
  if (!eventId) {
    return liveEventsURLBase;
  }
  return `${liveEventsURLBase}${eventId}`;
};

export class TalentMeetingService {
  private liveEventId: string;
  private token: string;
  private attendeeId: string;

  talentMeeting?: TalentMeeting;

  constructor(liveEventId: string, token: string, attendeeId: string) {
    this.liveEventId = liveEventId;
    this.token = token;
    this.attendeeId = attendeeId;
  }

  private getRequestHeaders() {
    return {
      Authorization: this.token,
      AttendeeId: this.attendeeId,
    } as RequestHeadersType;
  }

  async loadTalentMeeting() {
    const liveEventURL = constructLiveEventsURL(this.liveEventId);

    const liveEventResponse = await fetch(liveEventURL, {
      method: 'GET',
      headers: this.getRequestHeaders(),
    });

    const errorLabel = 'Error getting live event';
    const json = await jsonOrBail(liveEventResponse, () => errorLabel);

    if (hasError(liveEventResponse)) {
      throw new Error(`${errorLabel}: ${json.message}`);
    }

    const liveEventPayload = json;
    this.talentMeeting = ({
      id: liveEventPayload.talentMeetingId,
      talentAttendeeId: liveEventPayload.talentAttendeeIdForTalentMeeting,
    } as unknown) as TalentMeeting;
    return this.talentMeeting;
  }

  async setTalentAttendeeId(talentAttendeeIdForTalentMeeting: string) {
    if (!this.talentMeeting || !this.talentMeeting.id) {
      throw new Error(
        'Cannot set talentAttendeeID for unknown talentMeeting ID'
      );
    }

    const liveEventURL = await constructLiveEventsURL(this.liveEventId);

    try {
      const liveEventResponse = await fetch(liveEventURL, {
        method: 'PUT',
        headers: this.getRequestHeaders(),
        body: JSON.stringify({ talentAttendeeIdForTalentMeeting }),
      });

      const errorLabel = 'Error updating live event';
      const json = await jsonOrBail(liveEventResponse, () => errorLabel);

      if (hasError(liveEventResponse)) {
        throw new Error(`${errorLabel}: ${json.message}`);
      }

      const liveEventPayload = json;
      this.talentMeeting = ({
        id: liveEventPayload.talentMeetingId,
        talentAttendeeId: liveEventPayload.talentAttendeeIdForTalentMeeting,
      } as unknown) as TalentMeeting;
    } catch (e) {
      throw new Error(
        'Failed to set up the talent attendeeId for the talent meeting.'
      );
    }
  }

  async addLiveAttendee(attendeeId: string) {
    const liveEventURL = constructLiveEventsURL(this.liveEventId);
    const url = `${liveEventURL}/attendee/${attendeeId}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getRequestHeaders(),
    });

    const errorLabel = `Error adding live attendee ${attendeeId}`;
    const json = await jsonOrBail(res, () => errorLabel);

    if (hasError(res)) {
      throw new Error(`${errorLabel}: ${json.message}`);
    }

    return res;
  }

  async removeLiveAttendee(attendeeId: string) {
    const liveEventURL = constructLiveEventsURL(this.liveEventId);
    const url = `${liveEventURL}/attendee/${attendeeId}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getRequestHeaders(),
    });

    const errorLabel = `Error removing live attendee ${attendeeId}`;
    const json = await jsonOrBail(res, () => errorLabel);

    if (hasError(res)) {
      throw new Error(`${errorLabel}: ${json.message}`);
    }

    return res;
  }
}

type Props = {
  children: ReactNode;
  onLoad: (response: Response) => void;
};

/*
 * This sets a dummy TalentMeetingService so that our Typescript contract can
 * expect a TalentMeetingService in the context, but we won't actually render anything
 * below until the *real* TalentMeetingService is created.
 */
const TalentMeetingContext = React.createContext<TalentMeetingService>(
  new TalentMeetingService('', '', '')
);

export default function TalentMeetingProvider(props: Props) {
  const { children, onLoad } = props;
  const verifiedParticipant = useVerifiedParticipantContext();
  const liveEvent = useLiveEventContext();
  const credentials = useContext(getCredentialsContext());
  const [talentMeetingService, setTalentMeetingService] = useState<
    TalentMeetingService
  >();

  useEffect(() => {
    if (!credentials.isAuthenticated || !credentials.authToken) {
      onLoad({
        error:
          'User must be authenticated to fetch the talent meeting details.',
      });
      return;
    }

    const service = new TalentMeetingService(
      liveEvent.liveEventId,
      credentials.authToken,
      verifiedParticipant.attendeeId
    );
    service
      ?.loadTalentMeeting()
      .then(() => {
        setTalentMeetingService(service);
        onLoad({});
      })
      .catch(e => {
        setTalentMeetingService(service);
        onLoad({
          error: `Error getting talent meeting details: ${e}`,
        });
      });
  }, [verifiedParticipant]);

  if (talentMeetingService) {
    return (
      <TalentMeetingContext.Provider value={talentMeetingService}>
        {children}
      </TalentMeetingContext.Provider>
    );
  }

  // Don't render until the talentMeetingService is instantiated and we've loaded the talentMeeting.
  return <CenteredLoadingSpinner />;
}

export function useTalentMeetingContext() {
  const context = useContext(TalentMeetingContext);

  if (!context) {
    throw new Error(
      'useTalentMeetingContext must be used within an TalentMeetingContext'
    );
  }

  return context;
}
