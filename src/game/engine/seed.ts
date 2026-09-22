export const SEED_BYTES = 32;
export const SEED_HEX_LENGTH = SEED_BYTES * 2;

export type RandomValuesSource = Pick<Crypto, 'getRandomValues'>;

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeSeed(seed: string) {
  const normalized = seed.trim().toLowerCase();

  if (!new RegExp(`^[0-9a-f]{${SEED_HEX_LENGTH}}$`, 'u').test(normalized)) {
    throw new TypeError(`Seed must be exactly ${SEED_HEX_LENGTH} hexadecimal characters.`);
  }

  return normalized;
}

export function generateSecureSeed(cryptoSource: RandomValuesSource = globalThis.crypto) {
  if (!cryptoSource?.getRandomValues) {
    throw new Error('Secure random seed generation is unavailable in this browser.');
  }

  const bytes = new Uint8Array(SEED_BYTES);
  cryptoSource.getRandomValues(bytes);
  return bytesToHex(bytes);
}
