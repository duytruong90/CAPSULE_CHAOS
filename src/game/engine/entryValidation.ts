import type { PlayerEntry } from '../state/setupTypes';

export const ENTRY_LIMITS = Object.freeze({
  hardMinimum: 8,
  smallPoolThreshold: 20,
  recommendedMinimum: 30,
  recommendedMaximum: 60,
  largePoolThreshold: 100,
});

export type ValidationSeverity = 'error' | 'warning';

export type ValidationCode =
  | 'giveaway-name-required'
  | 'minimum-entries'
  | 'duplicate-entries'
  | 'small-pool'
  | 'below-recommended-range'
  | 'above-recommended-range'
  | 'large-pool'
  | 'duplicates-allowed';

export interface ValidationMessage {
  code: ValidationCode;
  severity: ValidationSeverity;
  message: string;
}

export interface DuplicateGroup {
  normalizedName: string;
  displayNames: string[];
  entryIds: string[];
  sourceLineNumbers: number[];
}

export interface SetupValidationResult {
  roster: PlayerEntry[];
  duplicates: DuplicateGroup[];
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  canStart: boolean;
}

/**
 * Duplicate matching is intentionally case-sensitive. Names are trimmed before
 * reaching this function and normalized to NFC so canonically equivalent
 * Unicode spellings compare equally without changing their displayed spelling.
 */
export function normalizeEntryForDuplicateDetection(displayName: string) {
  return displayName.normalize('NFC');
}

export function parseEntries(rawEntries: string): PlayerEntry[] {
  const roster: PlayerEntry[] = [];

  rawEntries.split(/\r\n|\n|\r/u).forEach((sourceLine, sourceLineIndex) => {
    const displayName = sourceLine.trim();

    if (!displayName) {
      return;
    }

    const entryIndex = roster.length;
    roster.push({
      id: `entry-${String(entryIndex + 1).padStart(4, '0')}`,
      displayName,
      normalizedName: normalizeEntryForDuplicateDetection(displayName),
      entryIndex,
      sourceLineNumber: sourceLineIndex + 1,
    });
  });

  return roster;
}

export function findDuplicateGroups(roster: PlayerEntry[]): DuplicateGroup[] {
  const groupedEntries = new Map<string, PlayerEntry[]>();

  roster.forEach((entry) => {
    const group = groupedEntries.get(entry.normalizedName) ?? [];
    group.push(entry);
    groupedEntries.set(entry.normalizedName, group);
  });

  return Array.from(groupedEntries.entries())
    .filter(([, entries]) => entries.length > 1)
    .map(([normalizedName, entries]) => ({
      normalizedName,
      displayNames: entries.map((entry) => entry.displayName),
      entryIds: entries.map((entry) => entry.id),
      sourceLineNumbers: entries.map((entry) => entry.sourceLineNumber),
    }));
}

export function validateSetup(
  giveawayName: string,
  rawEntries: string,
  allowDuplicateEntries: boolean,
): SetupValidationResult {
  const roster = parseEntries(rawEntries);
  const duplicates = findDuplicateGroups(roster);
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const count = roster.length;

  if (!giveawayName.trim()) {
    errors.push({
      code: 'giveaway-name-required',
      severity: 'error',
      message: 'Enter a giveaway name before starting.',
    });
  }

  if (count < ENTRY_LIMITS.hardMinimum) {
    errors.push({
      code: 'minimum-entries',
      severity: 'error',
      message: `Add at least ${ENTRY_LIMITS.hardMinimum} valid entries to start.`,
    });
  }

  if (duplicates.length > 0) {
    if (allowDuplicateEntries) {
      warnings.push({
        code: 'duplicates-allowed',
        severity: 'warning',
        message: `${duplicates.length} duplicate name ${duplicates.length === 1 ? 'group is' : 'groups are'} allowed as separate entries.`,
      });
    } else {
      errors.push({
        code: 'duplicate-entries',
        severity: 'error',
        message: 'Resolve duplicate names or explicitly allow duplicate entries.',
      });
    }
  }

  if (count < ENTRY_LIMITS.smallPoolThreshold) {
    warnings.push({
      code: 'small-pool',
      severity: 'warning',
      message: 'Capsule Chaos is designed for larger pools; fewer than 20 entries will be shorter.',
    });
  } else if (count < ENTRY_LIMITS.recommendedMinimum) {
    warnings.push({
      code: 'below-recommended-range',
      severity: 'warning',
      message: 'This roster is below the recommended 30–60 player range.',
    });
  } else if (count > ENTRY_LIMITS.largePoolThreshold) {
    warnings.push({
      code: 'large-pool',
      severity: 'warning',
      message: 'More than 100 entries may create a long opening phase.',
    });
  } else if (count > ENTRY_LIMITS.recommendedMaximum) {
    warnings.push({
      code: 'above-recommended-range',
      severity: 'warning',
      message: 'This roster is above the recommended 30–60 player range.',
    });
  }

  return {
    roster,
    duplicates,
    errors,
    warnings,
    canStart: errors.length === 0,
  };
}
