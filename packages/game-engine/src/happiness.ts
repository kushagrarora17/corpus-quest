import {
  DECAY_RATES,
  HAPPINESS_BLOCK_THRESHOLD,
  HAPPINESS_DIMINISHING_RETURNS,
  HAPPINESS_MAX,
  PAISE_PER_RUPEE,
} from '@corpus-quest/shared';

import type { Dependent, HappinessLog } from './types.js';

/** Apply one month of decay to every dependent. */
export function applyDecay(dependents: Dependent[]): Dependent[] {
  return dependents.map((d) => ({
    ...d,
    happiness: Math.max(0, d.happiness - DECAY_RATES[d.type]),
  }));
}

/**
 * Boost a dependent's happiness based on a rupee spend. Each ₹1,000 spent
 * yields +500 happiness (display +5) below the diminishing-returns threshold.
 * Above 8000, the marginal effect drops to 40% — under half normal boost.
 */
export function applySpend(dependent: Dependent, amountPaise: number): Dependent {
  if (amountPaise <= 0) return dependent;
  const inrSpent = amountPaise / PAISE_PER_RUPEE;
  const baseBoostPerRupee = 0.5; // 500 / 1000
  const linearBoost = inrSpent * baseBoostPerRupee;

  const start = dependent.happiness;
  let next = start;
  let remaining = linearBoost;

  if (next < HAPPINESS_DIMINISHING_RETURNS) {
    const room = HAPPINESS_DIMINISHING_RETURNS - next;
    const consumed = Math.min(room, remaining);
    next += consumed;
    remaining -= consumed;
  }
  if (remaining > 0) {
    next += remaining * 0.4;
  }
  return { ...dependent, happiness: Math.min(HAPPINESS_MAX, Math.round(next)) };
}

/** True if any dependent has fallen below the block threshold (display: 20). */
export function requiresHappinessAction(dependents: Dependent[]): boolean {
  return dependents.some((d) => d.happiness < HAPPINESS_BLOCK_THRESHOLD);
}

/** Average current happiness across all dependents (0 if none). */
export function averageHappiness(dependents: Dependent[]): number {
  if (dependents.length === 0) return 0;
  const sum = dependents.reduce((acc, d) => acc + d.happiness, 0);
  return Math.round(sum / dependents.length);
}

/**
 * Average of the per-month happiness averages across the entire run.
 * Returns 0 when the log is empty (e.g. month 0 before snapshot).
 */
export function happinessLegacy(log: HappinessLog[]): number {
  if (log.length === 0) return 0;
  const sum = log.reduce((acc, h) => acc + h.average, 0);
  return Math.round(sum / log.length);
}
