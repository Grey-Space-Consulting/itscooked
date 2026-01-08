"use client";

import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";

type AppState = {
  activeKitchen: string;
  lastSyncAt: string | null;
};

type Action =
  | { type: "setActiveKitchen"; value: string }
  | { type: "setLastSync"; value: string | null };

const initialState: AppState = {
  activeKitchen: "Home",
  lastSyncAt: null
};

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<Dispatch<Action> | null>(null);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "setActiveKitchen":
      return { ...state, activeKitchen: action.value };
    case "setLastSync":
      return { ...state, lastSyncAt: action.value };
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within AppStateProvider");
  }
  return context;
}
