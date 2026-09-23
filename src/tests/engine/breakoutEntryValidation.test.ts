import { validateBreakoutSetup } from '../../game/breakout/entryValidation';

function names(count: number) {
  return Array.from({ length: count }, (_, index) => `Player ${index + 1}`).join('\n');
}

describe('Breakout setup validation', () => {
  it('blocks an empty roster but accepts every positive count', () => {
    expect(validateBreakoutSetup('Show', '', false).canStart).toBe(false);
    for (let count = 1; count <= 25; count += 1) {
      expect(validateBreakoutSetup('Show', names(count), false).canStart).toBe(true);
    }
  });

  it.each([
    [1, 'One entry: this run will declare that entry as the winner.'],
    [2, 'Small field: proceeding directly to Final Clash.'],
    [4, 'Small field: proceeding directly to Final Clash.'],
    [5, 'Compact run: Escape Run and Final Clash.'],
    [16, 'Compact run: Escape Run and Final Clash.'],
    [17, 'All three acts; a larger field creates more shared suspense.'],
    [20, 'All three acts; a larger field creates more shared suspense.'],
  ] as const)('uses the required route message at %s entries', (count, message) => {
    expect(
      validateBreakoutSetup('Show', names(count), false).warnings.map((item) => item.message),
    ).toContain(message);
  });

  it('has no size warning from 21–100 and adds paging guidance at 101+', () => {
    expect(validateBreakoutSetup('Show', names(21), false).warnings).toEqual([]);
    expect(validateBreakoutSetup('Show', names(100), false).warnings).toEqual([]);
    expect(
      validateBreakoutSetup('Show', names(101), false).warnings.map((item) => item.message),
    ).toContain('Large field: names will page during Faultline.');
  });

  it('keeps duplicate tickets separate only with explicit permission', () => {
    const rawEntries = 'Café\nCafe\u0301';
    expect(validateBreakoutSetup('Show', rawEntries, false).canStart).toBe(false);
    const allowed = validateBreakoutSetup('Show', rawEntries, true);
    expect(allowed.canStart).toBe(true);
    expect(new Set(allowed.roster.map((entry) => entry.id))).toHaveLength(2);
  });
});
