import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { DEFAULT_SETUP_DRAFT } from '../game/state/setupTypes';
import type { SetupConfig, SetupDraft } from '../game/state/setupTypes';
import { AppStateContext } from './appStateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [setupDraft, setSetupDraft] = useState<SetupDraft>(DEFAULT_SETUP_DRAFT);

  const updateSetupDraft = useCallback(
    (updates: Partial<Pick<SetupDraft, 'giveawayName' | 'rawEntries'>>) => {
      setSetupDraft((current) => ({ ...current, ...updates }));
    },
    [],
  );

  const updateSetupConfig = useCallback((updates: Partial<SetupConfig>) => {
    setSetupDraft((current) => ({
      ...current,
      config: { ...current.config, ...updates },
    }));
  }, []);

  const value = useMemo(
    () => ({ setupDraft, updateSetupDraft, updateSetupConfig }),
    [setupDraft, updateSetupDraft, updateSetupConfig],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
