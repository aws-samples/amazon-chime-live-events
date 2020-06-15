import React, { useReducer, Dispatch, useContext } from "react";

import { StateType, Action, initialState, reducer } from "./state";

const StateContext = React.createContext<StateType>(initialState);

const DispatchContext = React.createContext<Dispatch<Action>>((): void => {});

const MetaStateProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

const useMetaState = () => {
  const state = useContext(StateContext);
  return state;
};

const useMetaDispatch = () => {
  const dispatch = useContext(DispatchContext);
  return dispatch;
};

export { MetaStateProvider, useMetaState, useMetaDispatch };
