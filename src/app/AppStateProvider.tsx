import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validateSetup } from '../game/engine/entryValidation';
import { createLockedGameSession, type LockedGameSession } from '../game/state/gameSession';
import { DEFAULT_SETUP_DRAFT } from '../game/state/setupTypes';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';
import { AppStateContext, type LockStatus } from './appStateContext';
import { PlaybackController } from '../presentation/playbackController';
import {
  clearPersistedSession,
  loadPersistedSession,
  savePersistedSession,
  type PersistedGameSession,
} from '../game/state/persistence';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [setupDraft, setSetupDraft] = useState<SetupDraft>(DEFAULT_SETUP_DRAFT);
  const [gameSession, setGameSession] = useState<LockedGameSession | null>(null);
  const [lockStatus, setLockStatus] = useState<LockStatus>('idle');
  const [lockError, setLockError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<PersistedGameSession | null>(() =>
    typeof localStorage === 'undefined' ? null : loadPersistedSession(localStorage),
  );
  const [restoredPlayback, setRestoredPlayback] = useState<PersistedGameSession['playback']>();
  const lockAttempted = useRef(false);
  const playback = useMemo(
    () =>
      gameSession
        ? new PlaybackController(
            gameSession.timeline,
            gameSession.lock.payload.config,
            gameSession.publicLock.entryCount,
            restoredPlayback,
          )
        : null,
    [gameSession, restoredPlayback],
  );

  useEffect(() => {
    if (!gameSession || !playback || typeof localStorage === 'undefined') return;
    const persist = () =>
      savePersistedSession(
        localStorage,
        setupDraft.giveawayName,
        gameSession,
        playback.getSnapshot(),
      );
    persist();
    return playback.subscribe(persist);
  }, [gameSession, playback, setupDraft.giveawayName]);

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

  const resumeGame = useCallback(() => {
    if (!recovery || gameSession) return false;
    setSetupDraft({
      giveawayName: recovery.giveawayName,
      rawEntries: recovery.session.lock.payload.entries
        .map((entry) => entry.displayName)
        .join('\n'),
      config: recovery.session.lock.payload.config,
    });
    setRestoredPlayback(recovery.playback);
    setGameSession(recovery.session);
    setLockStatus('locked');
    setRecovery(null);
    lockAttempted.current = true;
    return true;
  }, [gameSession, recovery]);

  const abandonSession = useCallback(() => {
    if (typeof localStorage !== 'undefined') clearPersistedSession(localStorage);
    setRecovery(null);
  }, []);

  const resetGame = useCallback(() => {
    if (typeof localStorage !== 'undefined') clearPersistedSession(localStorage);
    setGameSession(null);
    setRestoredPlayback(undefined);
    setRecovery(null);
    setLockStatus('idle');
    setLockError(null);
    setSetupDraft(DEFAULT_SETUP_DRAFT);
    lockAttempted.current = false;
  }, []);

  const value = useMemo(
    () => ({
      setupDraft,
      updateSetupDraft,
      updateSetupConfig,
      gameSession,
      playback,
      lockStatus,
      lockError,
      startGame,
      recoveryAvailable: Boolean(recovery),
      resumeGame,
      abandonSession,
      resetGame,
    }),
    [
      setupDraft,
      updateSetupDraft,
      updateSetupConfig,
      gameSession,
      playback,
      lockStatus,
      lockError,
      startGame,
      recovery,
      resumeGame,
      abandonSession,
      resetGame,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
