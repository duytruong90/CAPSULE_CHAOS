import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { validateSetup } from '../game/engine/entryValidation';
import { createLockedGameSession, type LockedGameSession } from '../game/state/gameSession';
import { DEFAULT_SETUP_DRAFT } from '../game/state/setupTypes';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';
import { AppStateContext, type LockStatus } from './appStateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [setupDraft, setSetupDraft] = useState<SetupDraft>(DEFAULT_SETUP_DRAFT);
  const [gameSession, setGameSession] = useState<LockedGameSession | null>(null);
  const [lockStatus, setLockStatus] = useState<LockStatus>('idle');
  const [lockError, setLockError] = useState<string | null>(null);
  const lockAttempted = useRef(false);

  const updateSetupDraft = useCallback(
    (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => {
      if (!gameSession) setSetupDraft((current) => ({ ...current, ...updates }));
    },
    [gameSession],
  );

  const updateSetupConfig = useCallback(
    (updates: Partial<SetupConfig>) => {
      if (!gameSession) {
        setSetupDraft((current) => ({
          ...current,
          config: { ...current.config, ...updates },
        }));
      }
    },
    [gameSession],
  );

  const startGame = useCallback(async () => {
    if (gameSession || lockAttempted.current) return false;
    const validation = validateSetup(
      setupDraft.giveawayName,
      setupDraft.rawEntries,
      setupDraft.config.allowDuplicateEntries,
    );
    if (!validation.canStart) return false;

    lockAttempted.current = true;
    setLockStatus('locking');
    setLockError(null);
    try {
      const session = await createLockedGameSession(validation.roster, setupDraft.config);
      setGameSession(session);
      setLockStatus('locked');
      return true;
    } catch (error) {
      lockAttempted.current = false;
      setLockError(error instanceof Error ? error.message : 'The game could not be locked.');
      setLockStatus('error');
      return false;
    }
  }, [gameSession, setupDraft]);

  const value = useMemo(
    () => ({
      setupDraft,
      updateSetupDraft,
      updateSetupConfig,
      gameSession,
      lockStatus,
      lockError,
      startGame,
    }),
    [
      setupDraft,
      updateSetupDraft,
      updateSetupConfig,
      gameSession,
      lockStatus,
      lockError,
      startGame,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
