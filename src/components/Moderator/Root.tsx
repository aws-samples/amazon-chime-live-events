import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';

import routes from '../../constants/routes';
import CredentialsProvider from '../../providers/CredentialsProvider';
import ChimeProvider from '../../providers/ChimeProvider';
import I18nProvider from '../../providers/I18nProvider';
import { NotificationProvider } from '../../providers/NotificationProvider';
import LiveEventParticipantProvider from '../../providers/LiveEventParticipantProvider';
import LiveEventProvider from '../../providers/LiveEventProvider';
import { MetaStateProvider } from '../../providers/MetaStateProvider';
import FeatureProvider from '../../providers/FeatureProvider';
import { Authenticated } from '../Authenticated';
import DressingRoom from '../DressingRoom';
import NotificationGroup from '../NotificationGroup';
import { UnsupportedCheck } from '../Unsupported';
import Home from './Home';
import VerifiedParticipantProvider from '../../providers/VerifiedParticipantProvider';
import Moderation from './Moderation';

const ModeratorRoot: React.FC = () => (
  <I18nProvider>
    <UnsupportedCheck>
      <HashRouter>
        <FeatureProvider>
          <NotificationProvider>
            <MetaStateProvider>
              <LiveEventProvider>
                <LiveEventParticipantProvider>
                  <CredentialsProvider>
                    <ChimeProvider>
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
                              <Moderation />
                            </VerifiedParticipantProvider>
                          </Authenticated>
                        </Route>
                      </Switch>
                    </ChimeProvider>
                  </CredentialsProvider>
                </LiveEventParticipantProvider>
              </LiveEventProvider>
            </MetaStateProvider>
            <NotificationGroup />
          </NotificationProvider>
        </FeatureProvider>
      </HashRouter>
    </UnsupportedCheck>
  </I18nProvider>
);

export default ModeratorRoot;
