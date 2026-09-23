import {
  findDuplicateGroups,
  parseEntries,
  validateSetup,
  type ValidationCode,
} from '../../game/engine/entryValidation';

function names(count: number) {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`).join('\n');
}

function warningCodes(count: number): ValidationCode[] {
  return validateSetup('Boundary test', names(count), false).warnings.map((issue) => issue.code);
}

describe('parseEntries', () => {
  it('trims names and ignores blank lines across CRLF, LF, and CR line endings', () => {
    const roster = parseEntries('  Alpha  \r\n\r\nBravo\n  Charlie\r');

    expect(roster.map((entry) => entry.displayName)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(roster.map((entry) => entry.sourceLineNumber)).toEqual([1, 3, 4]);
    expect(roster.map((entry) => entry.entryIndex)).toEqual([0, 1, 2]);
  });

  it('preserves Vietnamese, CJK, emoji, capitalization, and punctuation', () => {
    const values = ['Đặng Trần', '夜桜', 'Player🎮', 'MiXeD-Case_!?'];
    const roster = parseEntries(values.join('\n'));

    expect(roster.map((entry) => entry.displayName)).toEqual(values);
  });

  it('preserves very long valid names without inventing a length restriction', () => {
    const longName = `Captain-${'x'.repeat(500)}-!`;

    expect(parseEntries(longName)[0]?.displayName).toBe(longName);
  });

  it('assigns deterministic, unique IDs based on validated entry order', () => {
    const firstParse = parseEntries('Alpha\n\nBravo\nAlpha');
    const secondParse = parseEntries('Alpha\n\nBravo\nAlpha');

    expect(firstParse.map((entry) => entry.id)).toEqual(['entry-0001', 'entry-0002', 'entry-0003']);
    expect(secondParse).toEqual(firstParse);
    expect(new Set(firstParse.map((entry) => entry.id))).toHaveLength(3);
  });
});

describe('duplicate detection', () => {
  it('treats canonically equivalent Unicode spellings as duplicates without changing display text', () => {
    const composed = 'Café';
    const decomposed = 'Cafe\u0301';
    const roster = parseEntries(`${composed}\n${decomposed}`);
    const duplicates = findDuplicateGroups(roster);

    expect(roster.map((entry) => entry.displayName)).toEqual([composed, decomposed]);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.entryIds).toEqual(['entry-0001', 'entry-0002']);
  });

  it('uses the documented case-sensitive policy', () => {
    expect(findDuplicateGroups(parseEntries('Alpha\nalpha'))).toEqual([]);
  });

  it('blocks accidental duplicates by default', () => {
    const result = validateSetup('Duplicate test', `${names(7)}\nPlayer 1`, false);

    expect(result.errors.map((issue) => issue.code)).toContain('duplicate-entries');
    expect(result.canStart).toBe(false);
  });

  it('keeps allowed duplicates as distinct player instances', () => {
    const result = validateSetup('Duplicate test', `${names(7)}\nPlayer 1`, true);

    expect(result.errors.map((issue) => issue.code)).not.toContain('duplicate-entries');
    expect(result.warnings.map((issue) => issue.code)).toContain('duplicates-allowed');
    expect(result.roster).toHaveLength(8);
    expect(new Set(result.roster.map((entry) => entry.id))).toHaveLength(8);
    expect(result.canStart).toBe(true);
  });
});

describe('setup validation boundaries', () => {
  it('requires a giveaway name', () => {
    const result = validateSetup('   ', names(8), false);

    expect(result.errors.map((issue) => issue.code)).toContain('giveaway-name-required');
    expect(result.canStart).toBe(false);
  });

  it('blocks an empty roster and permits one entry', () => {
    const belowMinimum = validateSetup('Minimum test', '', false);
    const atMinimum = validateSetup('Minimum test', names(1), false);

    expect(belowMinimum.errors.map((issue) => issue.code)).toContain('minimum-entries');
    expect(belowMinimum.canStart).toBe(false);
    expect(atMinimum.errors.map((issue) => issue.code)).not.toContain('minimum-entries');
    expect(atMinimum.canStart).toBe(true);
    expect(belowMinimum.warnings).toEqual([]);
  });

  it.each([
    { count: 1, expected: 'one-entry' },
    { count: 2, expected: 'direct-final-clash' },
    { count: 4, expected: 'direct-final-clash' },
    { count: 5, expected: 'compact-run' },
    { count: 16, expected: 'compact-run' },
    { count: 17, expected: 'all-three-acts' },
    { count: 20, expected: 'all-three-acts' },
    { count: 101, expected: 'large-pool' },
  ] as const)('warns appropriately at $count entries', ({ count, expected }) => {
    expect(warningCodes(count)).toContain(expected);
  });

  it.each([21, 100])('has no pool-size warning at the standard boundary %s', (count) => {
    expect(warningCodes(count)).toEqual([]);
  });

  it('uses the approved three-act guidance copy', () => {
    expect(validateSetup('Copy', names(1), false).warnings[0]?.message).toBe(
      'One entry: this run will declare that entry as the winner.',
    );
    expect(validateSetup('Copy', names(2), false).warnings[0]?.message).toBe(
      'Small field: proceeding directly to Final Clash.',
    );
    expect(validateSetup('Copy', names(5), false).warnings[0]?.message).toBe(
      'Compact run: Escape Run and Final Clash.',
    );
    expect(validateSetup('Copy', names(17), false).warnings[0]?.message).toBe(
      'All three acts; a larger field creates more shared suspense.',
    );
    expect(validateSetup('Copy', names(101), false).warnings[0]?.message).toBe(
      'Large field: names will page during Faultline.',
    );
  });
});
