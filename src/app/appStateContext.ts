import { createContext } from 'react';
import type { LockedBreakoutSession } from '../game/breakout/session';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';
import type { BreakoutPlaybackController } from '../presentation/breakout/BreakoutPlaybackController';

export type LockStatus = 'idle' | 'locking' | 'locked' | 'error';

export interface AppState {
  setupDraft: SetupDraft;
  updateSetupDraft: (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => void;
  updateSetupConfig: (updates: Partial<SetupConfig>) => void;
  gameSession: LockedBreakoutSession | null;
  playback: BreakoutPlaybackController | null;
  lockStatus: LockStatus;
  lockError: string | null;
  storageStatus: 'checking' | 'available' | 'unavailable';
  legacySessionJson: string | null;
  rejectedRecoveryJson: string | null;
  dismissLegacySession: () => void;
  startGame: () => Promise<boolean>;
  recoveryAvailable: boolean;
  resumeGame: () => boolean;
  abandonSession: () => void;
  resetGame: () => void;
}

export const AppStateContext = createContext<AppState | null>(null);
