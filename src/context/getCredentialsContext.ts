import React from 'react';

export type Credentials = {
  isAuthenticated: boolean;
  authenticate(
    liveEventId: string,
    accessKey: string,
    attendeeId: string
  ): Promise<void>;
  authToken?: string;
};

/*
 * This is just a dummy value to create the context with defined values.
 * The alternative would be to have Credentials | null as the context type,
 * or too loosen Credentials to have a bunch of optional values.
 * Both of those alternatives make it really messy for consumers of this data.
 *
 * If you look in CredentialsProvider, you will see that we don't actually render
 * a provider or any of its children until we have *real* non-dummy values for
 * the credentials.
 */
const dummyCreds = {
  isAuthenticated: false,
  authenticate: (_: string, __: string, ___: string) => Promise.resolve(),
};

export const CredentialsContext = React.createContext<Credentials>(dummyCreds);

export default function getCredentialsContext() {
  return CredentialsContext;
}
