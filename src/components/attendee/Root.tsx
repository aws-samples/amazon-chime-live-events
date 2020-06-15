import React from 'react';
import { Switch, Route, HashRouter } from 'react-router-dom';

import routes from '../../constants/routes';

import ChimeProvider from '../../providers/ChimeProvider';
import CredentialsProvider from '../../providers/CredentialsProvider';
import I18nProvider from '../../providers/I18nProvider';
import LiveEventParticipantProvider from '../../providers/LiveEventParticipantProvider';
import LiveEventProvider from '../../providers/LiveEventProvider';
import { LiveEventMessagesProvider } from '../../providers/LiveEventMessagesProvider';
import { NotificationProvider } from '../../providers/NotificationProvider';
import FeatureProvider from '../../providers/FeatureProvider';
import { Authenticated } from '../Authenticated';
import DressingRoom from '../DressingRoom';
import NotificationGroup from '../NotificationGroup';
import VerifiedParticipantProvider from '../../providers/VerifiedParticipantProvider';
import { StreamProvider } from '../../providers/StreamProvider';
import AttendeeHome from './AttendeeHome';
import MeetingView from './MeetingView';

import { UnsupportedCheck } from '../Unsupported';

const AttendeeRoot = () => (
  <I18nProvider>
    <UnsupportedCheck>
      <HashRouter>
        <FeatureProvider>
          <NotificationProvider>
            <LiveEventProvider>
              <LiveEventParticipantProvider>
                <LiveEventMessagesProvider>
                  <StreamProvider>
                    <CredentialsProvider>
                      <ChimeProvider>
                        <Switch>
                          <Route path={routes.MEETING} exact>
                            <Authenticated>
                              <VerifiedParticipantProvider>
                                <MeetingView />
                              </VerifiedParticipantProvider>
                            </Authenticated>
                          </Route>
                          <Route path={routes.DRESSING_ROOM} exact>
                            <Authenticated>
                              <VerifiedParticipantProvider>
                                <DressingRoom sendUpdates />
                              </VerifiedParticipantProvider>
                            </Authenticated>
                          </Route>
                          <Route path={routes.HOME} exact>
                            <AttendeeHome />
                          </Route>
                        </Switch>
                      </ChimeProvider>
                    </CredentialsProvider>
                  </StreamProvider>
                </LiveEventMessagesProvider>
              </LiveEventParticipantProvider>
            </LiveEventProvider>
            <NotificationGroup position='bottom-left' />
          </NotificationProvider>
        </FeatureProvider>
      </HashRouter>
    </UnsupportedCheck>
  </I18nProvider>
);

export default AttendeeRoot;
