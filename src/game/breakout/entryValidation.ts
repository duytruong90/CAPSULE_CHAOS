import {
  findDuplicateGroups,
  parseEntries,
  type DuplicateGroup,
  type ValidationMessage,
} from '../engine/entryValidation';
import type { PlayerEntry } from '../state/setupTypes';

export type BreakoutValidationCode =
  ValidationMessage['code'] | 'sole-entry' | 'small-field' | 'compact-run' | 'full-show';

export interface BreakoutValidationMessage {
  readonly code: BreakoutValidationCode;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface BreakoutSetupValidationResult {
  readonly roster: readonly PlayerEntry[];
  readonly duplicates: readonly DuplicateGroup[];
  readonly errors: readonly BreakoutValidationMessage[];
  readonly warnings: readonly BreakoutValidationMessage[];
  readonly canStart: boolean;
}

export function validateBreakoutSetup(
  giveawayName: string,
  rawEntries: string,
  allowDuplicateEntries: boolean,
): BreakoutSetupValidationResult {
  const roster = parseEntries(rawEntries);
  const duplicates = findDuplicateGroups(roster);
  const errors: BreakoutValidationMessage[] = [];
  const warnings: BreakoutValidationMessage[] = [];
  const count = roster.length;

  if (!giveawayName.trim()) {
    errors.push({
      code: 'giveaway-name-required',
      severity: 'error',
      message: 'Enter a giveaway name before starting.',
    });
  }
  if (count === 0) {
    errors.push({
      code: 'minimum-entries',
      severity: 'error',
      message: 'Add at least one valid entry to start.',
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

  if (count === 1) {
    warnings.push({
      code: 'sole-entry',
      severity: 'warning',
      message: 'One entry: this run will declare that entry as the winner.',
    });
  } else if (count <= 4 && count > 1) {
    warnings.push({
      code: 'small-field',
      severity: 'warning',
      message: 'Small field: proceeding directly to Final Clash.',
    });
  } else if (count <= 16 && count > 4) {
    warnings.push({
      code: 'compact-run',
      severity: 'warning',
      message: 'Compact run: Escape Run and Final Clash.',
    });
  } else if (count <= 20 && count > 16) {
    warnings.push({
      code: 'full-show',
      severity: 'warning',
      message: 'All three acts; a larger field creates more shared suspense.',
    });
  }
  if (count >= 101) {
    warnings.push({
      code: 'large-pool',
      severity: 'warning',
      message: 'Large field: names will page during Faultline.',
    });
  }

  return Object.freeze({
    roster: Object.freeze(roster),
    duplicates: Object.freeze(duplicates),
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    canStart: errors.length === 0,
  });
}
