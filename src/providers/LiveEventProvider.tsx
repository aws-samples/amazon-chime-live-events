import React, { ReactNode, useContext } from 'react';

import Informational from '../components/Informational';
import ExampleUrl from '../components/ExampleUrl';
import useTranslate from '../hooks/useTranslate';

export class LiveEventSession {
  liveEventId: string;

  constructor(liveEventId: string) {
    if (liveEventId?.trim().length <= 0) {
      throw new Error(
        'liveEventId must be provided to create LiveEventSession'
      );
    }
    this.liveEventId = liveEventId;
  }
}

type Props = {
  children: ReactNode;
};

/*
 * This is just a dummy value to create the context with defined values.
 * The alternative would be to have LiveEventSession | null as the context type,
 * or too loosen LiveEventSession to have a bunch of optional values.
 * Both of those alternatives make it really messy for consumers of this data.
 *
 * If you look below, you will see that we don't actually render
 * a provider or any of its children until we have *real* non-dummy values for
 * the liveEvent.
 */
const LiveEventContext = React.createContext<LiveEventSession>({
  liveEventId: '',
});

export default function LiveEventProvider({ children }: Props) {
  const translate = useTranslate();

  const urlParams = new URLSearchParams(location.search);
  // Ex - ?eId=liveEvent1234
  const liveEventId = urlParams.get('eId')?.trim();

  if (!liveEventId) {
    return (
      <Informational>
        {translate('LiveEventProvider.mustHaveEventId')}
        <br />
        <ExampleUrl />
      </Informational>
    );
  }

  const liveEventSession = new LiveEventSession(liveEventId);
  return (
    <LiveEventContext.Provider value={liveEventSession}>
      {children}
    </LiveEventContext.Provider>
  );
}

export function useLiveEventContext() {
  const context = useContext(LiveEventContext);

  if (context === undefined) {
    throw new Error(
      'useLiveEventMessageApis must be used within a LiveEventMessagesDispatchContext'
    );
  }

  return context;
}
