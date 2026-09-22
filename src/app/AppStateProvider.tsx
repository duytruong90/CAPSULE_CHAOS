import { type ReactNode, useMemo, useState } from 'react';
import { AppStateContext } from './appStateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const value = useMemo(() => ({ soundEnabled, setSoundEnabled }), [soundEnabled]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
