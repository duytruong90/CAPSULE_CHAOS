import { createContext } from 'react';
import type { LockedGameSession } from '../game/state/gameSession';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';

export type LockStatus = 'idle' | 'locking' | 'locked' | 'error';

export interface AppState {
  setupDraft: SetupDraft;
  updateSetupDraft: (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => void;
  updateSetupConfig: (updates: Partial<SetupConfig>) => void;
  gameSession: LockedGameSession | null;
  lockStatus: LockStatus;
  lockError: string | null;
  startGame: () => Promise<boolean>;
}

export const AppStateContext = createContext<AppState | null>(null);
