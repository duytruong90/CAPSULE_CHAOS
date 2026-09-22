import { createContext } from 'react';

export interface AppState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const AppStateContext = createContext<AppState | null>(null);
