import React, { useState, ReactNode, useContext } from 'react';
import { getLiveEventsURL } from '../utils/configuredURLs';
import useLocalStorageSync from '../hooks/useLocalStorageSync';
import getLiveEventParticipantContext from '../context/getLiveEventParticipantContext';
import getCredentialsContext, {
  Credentials,
} from '../context/getCredentialsContext';
import { useLiveEventContext } from './LiveEventProvider';

class AuthService {
  private AUTH_PATH_SEGMENT: string = 'authenticate';
  private liveEventId: string;
  private accessKey: string;
  private attendeeId: string;

  constructor(liveEventId: string, accessKey: string, attendeeId: string) {
    this.liveEventId = liveEventId;
    this.accessKey = accessKey;
    this.attendeeId = attendeeId;
  }

  private getLiveEventIdURL(): string {
    const base = getLiveEventsURL();
    return `${base}${this.liveEventId}/${this.AUTH_PATH_SEGMENT}`;
  }

  async authenticate() {
    const simpleTokenValidator = /([0-9A-Za-z]*[/|+|=][0-9A-Za-z]*)/;

    const liveEventResponse = await fetch(this.getLiveEventIdURL(), {
      method: 'POST',
      body: JSON.stringify({
        AccessKey: this.accessKey,
        AttendeeId: this.attendeeId,
      }),
    });

    const text = await liveEventResponse.text();

    return simpleTokenValidator.exec(text) ? text : null;
  }
}

/* 1000ms * 60s * 60min * 12hr
 * TTL is set to 12 hours so that moderators/talent can login well
 *  before an event and not have to log back in if their browser refreshes
 * for any reason in the middle of an event.
 */
const TOKEN_TTL = 1000 * 60 * 60 * 12;

type Props = {
  children: ReactNode;
};

/* This is an internal type that allows values to be undefined
 * while we wait for them to be populated by asynchronous calls.
 */
type PendingCredentials = {
  isAuthenticated?: boolean;
  authToken?: string;
};

export default function CredentialsProvider({ children }: Props) {
  // isAuthenticated is not set by default so that we can know in the Authenticated
  // component whether or not authentication flow as completed.
  // isAuthenticated is set by pulling from localStorage or by calling service.authenticate().
  const [creds, setCreds] = useState<PendingCredentials>({});
  const CredentialsContext = getCredentialsContext();

  const authenticate = async (
    liveEventId: string, // TODO we could remove this and get it from context
    accessKey: string,
    attendeeId: string
  ) => {
    const service = new AuthService(liveEventId, accessKey, attendeeId);

    await service
      ?.authenticate()
      .then(token => {
        if (token) {
          setCreds({
            ...creds,
            isAuthenticated: true,
            authToken: token,
          });
        } else {
          setCreds({
            ...creds,
            isAuthenticated: false,
            authToken: undefined,
          });
        }
      })
      .catch(e => {
        throw new Error(`Failed to authenticate. ${e} `);
      });
  };

  // TODO CredentialsProvider should be able to expect an ActiveParticipant,
  // but I think we'll have to move various things around to acheive that.
  const liveEventParticipant = useContext(getLiveEventParticipantContext());
  const { attendeeId } = liveEventParticipant;
  const urlParams = new URLSearchParams(window.location.search);
  const urlAccessKey = urlParams.get('accessKey');
  const { liveEventId } = useLiveEventContext();

  const liveEvent = useLiveEventContext();
  const storeKey = `${liveEvent.liveEventId}-auth-${attendeeId}`;
  useLocalStorageSync(
    storeKey,
    creds,
    (payload: undefined | any) => {
      if (
        payload &&
        payload.isAuthenticated !== undefined &&
        payload.authToken !== undefined
      ) {
        setCreds({
          ...payload,
        });
      } else if (liveEventId && urlAccessKey && attendeeId) {
        // Check if we can authenticate using an accessKey in the url
        authenticate(liveEventId, urlAccessKey, attendeeId)
          .catch((authError: any) => {
            console.error('Error, accessKey, liveEventId, or attendeeId invalid: ', authError);
          })
      } else {
        // Initialize isAuthenticated to false.
        setCreds({
          isAuthenticated: false,
        });
      }
    },
    TOKEN_TTL
  );

  /*
   * We only want to render the provider and it's children when we have
   * *real* non-dummy values for credentials. This makes sure that we've already
   * read from localStorage for any existing auth token.
   *
   * See the getCredentialsContext file for more context about this pattern.
   */
  if (creds && creds.isAuthenticated !== undefined) {
    const fulfilledCreds: Credentials = {
      isAuthenticated: creds.isAuthenticated,
      authToken: creds.authToken,
      authenticate,
    };
    return (
      <CredentialsContext.Provider value={fulfilledCreds}>
        {children}
      </CredentialsContext.Provider>
    );
  }

  return null;
}
