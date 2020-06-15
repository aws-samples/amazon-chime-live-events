import React from 'react';
import { HashRouter } from 'react-router-dom';

import App from '../App';
import ChimeProvider from '../../providers/ChimeProvider';
import I18nProvider from '../../providers/I18nProvider';
import LiveEventParticipantProvider from '../../providers/LiveEventParticipantProvider';
import LiveEventProvider from '../../providers/LiveEventProvider';
import CredentialsProvider from '../../providers/CredentialsProvider';
import FeatureProvider from '../../providers/FeatureProvider';
import { Authenticated } from '../Authenticated';
import { UnsupportedCheck } from '../Unsupported';
import TalentMeeting from '../talent/TalentMeeting';
import VerifiedParticipantProvider from '../../providers/VerifiedParticipantProvider';

const BroadcastRoot: React.FC = () => (
  <I18nProvider>
    <UnsupportedCheck>
      <HashRouter>
        <FeatureProvider>
          <LiveEventProvider>
            <LiveEventParticipantProvider>
              <CredentialsProvider>
                <ChimeProvider>
                  <App>
                    <Authenticated>
                      <VerifiedParticipantProvider>
                        <TalentMeeting />
                      </VerifiedParticipantProvider>
                    </Authenticated>
                  </App>
                </ChimeProvider>
              </CredentialsProvider>
            </LiveEventParticipantProvider>
          </LiveEventProvider>
        </FeatureProvider>
      </HashRouter>
    </UnsupportedCheck>
  </I18nProvider>
);

export default BroadcastRoot;
