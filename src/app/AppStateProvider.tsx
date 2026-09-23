import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioManager } from '../audio/AudioManager';
import { validateSetup } from '../game/engine/entryValidation';
import {
  BreakoutCheckpointQueue,
  BreakoutRecoveryValidationError,
  clearBreakoutRecovery,
  loadBreakoutRecovery,
  readLegacySessionJson,
  saveBreakoutCheckpoint,
  saveBreakoutSession,
  type BreakoutRecoveryRecord,
} from '../game/breakout/persistence';
import {
  createLockedBreakoutSession,
  verifyBreakoutSession,
  type LockedBreakoutSession,
} from '../game/breakout/session';
import { DEFAULT_SETUP_DRAFT, type SetupConfig, type SetupDraft } from '../game/state/setupTypes';
import {
  BreakoutPlaybackController,
  type BreakoutPlaybackCheckpoint,
} from '../presentation/breakout/BreakoutPlaybackController';
import { BREAKOUT_BUS_GAINS } from '../presentation/breakout/cueSheet';
import { AppStateContext, type LockStatus } from './appStateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [setupDraft, setSetupDraft] = useState<SetupDraft>(DEFAULT_SETUP_DRAFT);
  const [gameSession, setGameSession] = useState<LockedBreakoutSession | null>(null);
  const [lockStatus, setLockStatus] = useState<LockStatus>('idle');
  const [lockError, setLockError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<'checking' | 'available' | 'unavailable'>(
    () => (typeof globalThis.indexedDB === 'undefined' ? 'unavailable' : 'checking'),
  );
  const [recovery, setRecovery] = useState<BreakoutRecoveryRecord | null>(null);
  const [restoredCheckpoint, setRestoredCheckpoint] = useState<BreakoutPlaybackCheckpoint | null>(
    null,
  );
  const [legacySessionJson, setLegacySessionJson] = useState<string | null>(() =>
    typeof localStorage === 'undefined' ? null : readLegacySessionJson(localStorage),
  );
  const [rejectedRecoveryJson, setRejectedRecoveryJson] = useState<string | null>(null);
  const lockAttempted = useRef(false);
  const checkpointQueue = useRef(new BreakoutCheckpointQueue());

  useEffect(() => {
    if (typeof globalThis.indexedDB === 'undefined') return undefined;
    let active = true;
    void loadBreakoutRecovery()
      .then(async (record) => {
        if (!active) return;
        setStorageStatus('available');
        if (!record) return;
        const verification = await verifyBreakoutSession(record.savedSession.session);
        if (!active) return;
        if (verification.verified) setRecovery(record);
        else {
          setRejectedRecoveryJson(`${JSON.stringify(record, null, 2)}\n`);
          setLockError(`Saved Breakout cannot resume: ${verification.error}.`);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof BreakoutRecoveryValidationError) {
          setStorageStatus('available');
          setRejectedRecoveryJson(error.savedBytes);
          setLockError(`Saved Breakout cannot resume: ${error.message}.`);
        } else {
          setStorageStatus('unavailable');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const playback = useMemo(() => {
    if (!gameSession) return null;
    return new BreakoutPlaybackController(gameSession.timeline, {
      animationSpeed: gameSession.lock.payload.config.animationSpeed,
      autoAdvanceActs: gameSession.lock.payload.config.autoAdvancePhases,
      ...(restoredCheckpoint ? { checkpoint: restoredCheckpoint } : {}),
      cueSink: (eventId, cue) =>
        audioManager.cue(
          { cue: cue.cueId, eventId, gain: BREAKOUT_BUS_GAINS[cue.bus], bus: cue.bus },
          gameSession.lock.payload.config.soundEnabled,
        ),
    });
  }, [gameSession, restoredCheckpoint]);

  useEffect(() => {
    if (!gameSession || !playback || storageStatus !== 'available') return;
    let lastSavedAt = 0;
    let lastRevision = -1;
    const persist = () => {
      const checkpoint = playback.getSnapshot();
      const now = Date.now();
      const immediate = checkpoint.checkpointRevision !== lastRevision;
      if (!immediate && now - lastSavedAt < 250) return;
      lastSavedAt = now;
      lastRevision = checkpoint.checkpointRevision;
      void checkpointQueue.current
        .enqueue(() => saveBreakoutCheckpoint(gameSession, checkpoint))
        .catch(() => setStorageStatus('unavailable'));
    };
    persist();
    return playback.subscribe(persist);
  }, [gameSession, playback, storageStatus]);

  const updateSetupDraft = useCallback(
    (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => {
      if (!gameSession) setSetupDraft((current) => ({ ...current, ...updates }));
    },
    [gameSession],
  );

  const updateSetupConfig = useCallback(
    (updates: Partial<SetupConfig>) => {
      if (!gameSession) {
        setSetupDraft((current) => ({ ...current, config: { ...current.config, ...updates } }));
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
      const session = await createLockedBreakoutSession(validation.roster, setupDraft.config);
      try {
        await saveBreakoutSession(setupDraft.giveawayName, session);
        setStorageStatus('available');
      } catch {
        setStorageStatus('unavailable');
      }
      setRestoredCheckpoint(null);
      setGameSession(session);
      setLockStatus('locked');
      return true;
    } catch (error) {
      lockAttempted.current = false;
      setLockError(error instanceof Error ? error.message : 'The Breakout lock failed.');
      setLockStatus('error');
      return false;
    }
  }, [gameSession, setupDraft]);

  const resumeGame = useCallback(() => {
    if (!recovery || gameSession) return false;
    const config = recovery.savedSession.session.lock.payload.config;
    setSetupDraft({
      giveawayName: recovery.savedSession.giveawayName,
      rawEntries: recovery.savedSession.session.lock.payload.entries
        .map((entry) => entry.displayName)
        .join('\n'),
      config: { ...config, fakeoutIntensity: 'standard' },
    });
    setRestoredCheckpoint(
      recovery.savedCheckpoint?.checkpoint ?? {
        eventIndex: 0,
        elapsedBaseMs: 0,
        paused: true,
      },
    );
    setGameSession(recovery.savedSession.session);
    setLockStatus('locked');
    setRecovery(null);
    setRejectedRecoveryJson(null);
    lockAttempted.current = true;
    return true;
  }, [gameSession, recovery]);

  const abandonSession = useCallback(() => {
    void clearBreakoutRecovery().catch(() => setStorageStatus('unavailable'));
    setRecovery(null);
    setRejectedRecoveryJson(null);
    setLockError(null);
  }, []);

  const resetGame = useCallback(() => {
    void clearBreakoutRecovery().catch(() => setStorageStatus('unavailable'));
    setGameSession(null);
    setRestoredCheckpoint(null);
    setRecovery(null);
    setRejectedRecoveryJson(null);
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
      storageStatus,
      legacySessionJson,
      rejectedRecoveryJson,
      dismissLegacySession: () => setLegacySessionJson(null),
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
      storageStatus,
      legacySessionJson,
      rejectedRecoveryJson,
      startGame,
      recovery,
      resumeGame,
      abandonSession,
      resetGame,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
