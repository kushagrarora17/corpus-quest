import seedrandom from 'seedrandom';

/**
 * Returns a deterministic float in [0, 1) given (seed, month, salt).
 * Same inputs always produce the same output; differing salt re-rolls.
 */
export function makeRng(seed: string, month: number, salt: string): number {
  return seedrandom(`${seed}:${month}:${salt}`)();
}

/** Returns an integer in [min, max] inclusive, deterministic for the given inputs. */
export function rngInt(seed: string, month: number, salt: string, min: number, max: number): number {
  const r = makeRng(seed, month, salt);
  return Math.floor(min + r * (max - min + 1));
}

/** Returns a float in [min, max), deterministic for the given inputs. */
export function rngFloat(
  seed: string,
  month: number,
  salt: string,
  min: number,
  max: number,
): number {
  return min + makeRng(seed, month, salt) * (max - min);
}

/** Fisher–Yates shuffle driven by a seeded RNG stream. */
export function rngShuffle<T>(items: readonly T[], seed: string, salt: string): T[] {
  const arr = [...items];
  const prng = seedrandom(`${seed}:shuffle:${salt}`);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}
