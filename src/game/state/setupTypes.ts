export type AnimationSpeed = 'fast' | 'normal' | 'cinematic';
export type FakeoutIntensity = 'low' | 'standard' | 'high';

export interface SetupConfig {
  animationSpeed: AnimationSpeed;
  soundEnabled: boolean;
  autoAdvancePhases: boolean;
  showFullSurvivorBoard: boolean;
  fakeoutIntensity: FakeoutIntensity;
  allowDuplicateEntries: boolean;
}

export interface SetupDraft {
  giveawayName: string;
  rawEntries: string;
  config: SetupConfig;
}

export interface PlayerEntry {
  id: string;
  displayName: string;
  normalizedName: string;
  entryIndex: number;
  sourceLineNumber: number;
}

export const DEFAULT_SETUP_CONFIG: SetupConfig = Object.freeze({
  animationSpeed: 'normal',
  soundEnabled: true,
  autoAdvancePhases: false,
  showFullSurvivorBoard: true,
  fakeoutIntensity: 'standard',
  allowDuplicateEntries: false,
});

export const DEFAULT_SETUP_DRAFT: SetupDraft = Object.freeze({
  giveawayName: '',
  rawEntries: '',
  config: DEFAULT_SETUP_CONFIG,
});
