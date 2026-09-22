import { normalizeSeed } from './seed';

const UINT64_MASK = (1n << 64n) - 1n;
const RANDOM_INTEGER_SPACE = 2 ** 53;
const PRNG_FALLBACK_STATE = 0x9e3779b97f4a7c15n;

export const PRNG_ALGORITHM = 'xoshiro256**-v1' as const;

export interface WeightedOption<T> {
  value: T;
  weight: number;
}

function rotateLeft(value: bigint, bits: bigint) {
  return ((value << bits) | (value >> (64n - bits))) & UINT64_MASK;
}

/**
 * Auditable xoshiro256** implementation. Seeds are four big-endian uint64
 * words encoded as one 256-bit hexadecimal string.
 */
export class SeededRng {
  readonly algorithm = PRNG_ALGORITHM;
  private readonly state: [bigint, bigint, bigint, bigint];

  constructor(seed: string) {
    const normalizedSeed = normalizeSeed(seed);
    this.state = [0, 1, 2, 3].map((index) =>
      BigInt(`0x${normalizedSeed.slice(index * 16, index * 16 + 16)}`),
    ) as [bigint, bigint, bigint, bigint];

    if (this.state.every((word) => word === 0n)) {
      this.state[0] = PRNG_FALLBACK_STATE;
    }
  }

  nextUint64() {
    const [state0, state1, state2, state3] = this.state;
    const result = (rotateLeft((state1 * 5n) & UINT64_MASK, 7n) * 9n) & UINT64_MASK;
    const shifted = (state1 << 17n) & UINT64_MASK;

    this.state[2] = state2 ^ state0;
    this.state[3] = state3 ^ state1;
    this.state[1] = state1 ^ this.state[2];
    this.state[0] = state0 ^ this.state[3];
    this.state[2] ^= shifted;
    this.state[3] = rotateLeft(this.state[3], 45n);

    return result;
  }

  /** Returns a floating-point value in the half-open range [0, 1). */
  nextFloat() {
    return Number(this.nextUint64() >> 11n) / RANDOM_INTEGER_SPACE;
  }

  /** Returns an integer in the half-open range [minimumInclusive, maximumExclusive). */
  nextInt(minimumInclusive: number, maximumExclusive: number) {
    if (
      !Number.isSafeInteger(minimumInclusive) ||
      !Number.isSafeInteger(maximumExclusive) ||
      maximumExclusive <= minimumInclusive
    ) {
      throw new RangeError('Integer range must contain at least one safe integer.');
    }

    const range = maximumExclusive - minimumInclusive;
    if (!Number.isSafeInteger(range) || range > RANDOM_INTEGER_SPACE) {
      throw new RangeError('Integer range cannot exceed the 53-bit random integer space.');
    }
    const unbiasedLimit = Math.floor(RANDOM_INTEGER_SPACE / range) * range;
    let sample: number;

    do {
      sample = Number(this.nextUint64() >> 11n);
    } while (sample >= unbiasedLimit);

    return minimumInclusive + (sample % range);
  }

  choose<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('Cannot choose from an empty collection.');
    }

    return items[this.nextInt(0, items.length)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = this.nextInt(0, index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] as T, shuffled[index] as T];
    }

    return shuffled;
  }

  weightedChoice<T>(options: readonly WeightedOption<T>[]): T {
    if (options.length === 0) {
      throw new RangeError('Weighted choice requires at least one option.');
    }

    let totalWeight = 0;
    let lastPositiveOption: WeightedOption<T> | undefined;

    options.forEach((option) => {
      if (!Number.isFinite(option.weight) || option.weight < 0) {
        throw new RangeError('Weights must be finite, non-negative numbers.');
      }
      if (option.weight > 0) {
        totalWeight += option.weight;
        lastPositiveOption = option;
      }
    });

    if (totalWeight <= 0 || !lastPositiveOption) {
      throw new RangeError('At least one weighted option must have a positive weight.');
    }

    const threshold = this.nextFloat() * totalWeight;
    let cumulativeWeight = 0;

    for (const option of options) {
      cumulativeWeight += option.weight;
      if (option.weight > 0 && threshold < cumulativeWeight) {
        return option.value;
      }
    }

    return lastPositiveOption.value;
  }
}
