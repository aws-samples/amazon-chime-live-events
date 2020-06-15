import React, { useReducer, Dispatch, useContext } from 'react';

import {
  StateType,
  Type,
  Variant,
  Action,
  initialState,
  reducer,
  NotificationType,
} from './state';

const StateContext = React.createContext<StateType>(initialState);
const DispatchContext = React.createContext<Dispatch<Action>>((): void => {});

const NotificationProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

const useNotificationsState = () => {
  const state = useContext(StateContext);
  return state;
};

const useNotificationDispatch = () => {
  const dispatch = useContext(DispatchContext);
  return dispatch;
};

export {
  NotificationProvider,
  useNotificationsState,
  useNotificationDispatch,
  NotificationType,
  Variant,
  Type,
};
