import React, { useMemo, ReactNode, createContext, useContext } from 'react';

import Feature from '../types/FeatureType';

type Props = {
  children: ReactNode;
};

const defaultValue = {
  hideQueue: false,
  hideRoster: false,
  straightToMeeting: false,
  singleFeed: true,
  minimalRoster: false,
};

const FeatureContext = createContext<Feature>(defaultValue);

export default function FeatureProvider({ children }: Props) {
  const features = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      hideRoster: !!params.get('hideRoster'),
      hideQueue: !!params.get('hideQueue') || params.get('exp') === 'tier1',
      straightToMeeting: !!params.get('straightToMeeting'),
      minimalRoster:
        !!params.get('minimalRoster') || params.get('exp') === 'tier1',
      singleFeed: !!params.get('singleFeed') || params.get('exp') === 'tier1',
    };
  }, []);

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  return context;
}
