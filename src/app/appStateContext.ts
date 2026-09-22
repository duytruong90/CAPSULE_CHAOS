import { createContext } from 'react';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';

export interface AppState {
  setupDraft: SetupDraft;
  updateSetupDraft: (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => void;
  updateSetupConfig: (updates: Partial<SetupConfig>) => void;
}

export const AppStateContext = createContext<AppState | null>(null);
