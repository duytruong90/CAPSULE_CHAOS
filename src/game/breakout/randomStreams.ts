import { bytesToHex, normalizeSeed } from '../engine/seed';
import {
  BREAKOUT_ENGINE_RULES_VERSION,
  type BreakoutRandomSeeds,
  type BreakoutRandomStreamLabel,
} from './types';

export const BREAKOUT_RANDOM_STREAM_LABELS = Object.freeze([
  'floor',
  'race-decks',
  'race-photo',
  'bracket',
  'clash-sf1',
  'clash-sf2',
  'clash-playin',
  'clash-final',
] as const satisfies readonly BreakoutRandomStreamLabel[]);

type DigestSource = Pick<Crypto, 'subtle'>;

export async function deriveBreakoutRandomSeed(
  masterSeed: string,
  label: BreakoutRandomStreamLabel,
  cryptoSource: DigestSource = globalThis.crypto,
) {
  if (!cryptoSource?.subtle) {
    throw new Error('SHA-256 random-stream derivation is unavailable in this browser.');
  }

  const normalizedSeed = normalizeSeed(masterSeed);
  const input = `${BREAKOUT_ENGINE_RULES_VERSION}\0${normalizedSeed}\0${label}`;
  const digest = await cryptoSource.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return bytesToHex(new Uint8Array(digest));
}

export async function deriveBreakoutRandomSeeds(
  masterSeed: string,
  cryptoSource: DigestSource = globalThis.crypto,
): Promise<BreakoutRandomSeeds> {
  const values = await Promise.all(
    BREAKOUT_RANDOM_STREAM_LABELS.map(
      async (label) =>
        [label, await deriveBreakoutRandomSeed(masterSeed, label, cryptoSource)] as const,
    ),
  );

  return Object.freeze(Object.fromEntries(values) as Record<BreakoutRandomStreamLabel, string>);
}
