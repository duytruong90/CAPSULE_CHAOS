import { SeededRng } from '../../game/engine/rng';
import { generateSecureSeed } from '../../game/engine/seed';

const seed = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

describe('secure seed generation', () => {
  it('uses 256 bits supplied by getRandomValues', () => {
    let callCount = 0;
    const cryptoSource: Pick<Crypto, 'getRandomValues'> = {
      getRandomValues<T extends Exclude<BufferSource, ArrayBuffer>>(array: T): T {
        callCount += 1;
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        bytes.forEach((_, index) => {
          bytes[index] = index;
        });
        return array;
      },
    };

    expect(generateSecureSeed(cryptoSource)).toBe(seed);
    expect(callCount).toBe(1);
  });
});

describe('SeededRng', () => {
  it('matches the fixed xoshiro256** v1 test vector', () => {
    const rng = new SeededRng(seed);
    const values = Array.from({ length: 6 }, () => rng.nextUint64().toString(16).padStart(16, '0'));

    expect(values).toEqual([
      'cb61f88f25bc5234',
      '34cb61f88f25bb9c',
      '3b002d5a891e1d0e',
      '4407cb349c43dbd7',
      'f2ac9857862c2cff',
      'fc5479354710d01e',
    ]);
  });

  it('reproduces streams for the same seed and changes them for another seed', () => {
    const first = new SeededRng(seed);
    const second = new SeededRng(seed);
    const different = new SeededRng('f'.repeat(64));
    const stream = (rng: SeededRng) => Array.from({ length: 20 }, () => rng.nextInt(0, 10_000));

    expect(stream(first)).toEqual(stream(second));
    expect(stream(new SeededRng(seed))).not.toEqual(stream(different));
  });

  it('keeps integer ranges within their documented half-open bounds', () => {
    const rng = new SeededRng(seed);

    for (let index = 0; index < 10_000; index += 1) {
      const value = rng.nextInt(-7, 13);
      expect(value).toBeGreaterThanOrEqual(-7);
      expect(value).toBeLessThan(13);
    }
  });

  it('reproduces shuffle and does not mutate the source', () => {
    const source = ['a', 'b', 'c', 'd', 'e', 'f'];
    const first = new SeededRng(seed).shuffle(source);
    const second = new SeededRng(seed).shuffle(source);

    expect(first).toEqual(second);
    expect(source).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect([...first].sort()).toEqual(source);
  });

  it('reproduces weighted choices and never selects zero-weight options', () => {
    const options = [
      { value: 'never', weight: 0 },
      { value: 'common', weight: 8 },
      { value: 'rare', weight: 2 },
    ] as const;
    const choose = () => {
      const rng = new SeededRng(seed);
      return Array.from({ length: 30 }, () => rng.weightedChoice(options));
    };

    expect(choose()).toEqual(choose());
    expect(choose()).not.toContain('never');
  });

  it('rejects invalid ranges and weighted collections', () => {
    const rng = new SeededRng(seed);

    expect(() => rng.nextInt(3, 3)).toThrow(RangeError);
    expect(() => rng.nextInt(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => rng.choose([])).toThrow(RangeError);
    expect(() => rng.weightedChoice([{ value: 'none', weight: 0 }])).toThrow(RangeError);
    expect(() => rng.weightedChoice([{ value: 'bad', weight: -1 }])).toThrow(RangeError);
  });
});
