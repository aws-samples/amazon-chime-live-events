import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';

import App from '../App';
import routes from '../../constants/routes';
import ChimeProvider from '../../providers/ChimeProvider';
import I18nProvider from '../../providers/I18nProvider';
import LiveEventParticipantProvider from '../../providers/LiveEventParticipantProvider';
import LiveEventProvider from '../../providers/LiveEventProvider';
import CredentialsProvider from '../../providers/CredentialsProvider';
import FeatureProvider from '../../providers/FeatureProvider';
import { Authenticated } from '../Authenticated';
import DressingRoom from '../DressingRoom';
import { UnsupportedCheck } from '../Unsupported';
import Home from './Home';
import TalentMeeting from './TalentMeeting';
import VerifiedParticipantProvider from '../../providers/VerifiedParticipantProvider';

const TalentRoot: React.FC = () => (
  <I18nProvider>
    <UnsupportedCheck>
      <HashRouter>
        <FeatureProvider>
          <LiveEventProvider>
            <LiveEventParticipantProvider>
              <CredentialsProvider>
                  <ChimeProvider>
                    <App>
                      <Switch>
                        <Route path={routes.HOME} exact>
                          <Home />
                        </Route>
                        <Route path={routes.DRESSING_ROOM} exact>
                          <Authenticated>
                            <VerifiedParticipantProvider>
                              <DressingRoom />
                            </VerifiedParticipantProvider>
                          </Authenticated>
                        </Route>
                        <Route path={routes.MEETING}>
                          <Authenticated>
                            <VerifiedParticipantProvider>
                              <TalentMeeting />
                            </VerifiedParticipantProvider>
                          </Authenticated>
                        </Route>
                      </Switch>
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

export default TalentRoot;
