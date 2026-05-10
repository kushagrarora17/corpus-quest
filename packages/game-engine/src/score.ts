import {
  SCORE_REFERENCE_NET_WORTH_PAISE,
  SCORE_THRESHOLDS,
  SCORE_WEIGHTS,
} from '@corpus-quest/shared';
import type { ScoreTier } from '@corpus-quest/shared';

/**
 * Final score: 70% net-worth axis (clamped to ₹5 Cr reference) + 30% happiness
 * legacy axis (0..10000), scaled to 0..100.
 */
export function computeFinalScore(
  finalNetWorthPaise: number,
  happinessLegacy: number,
): { score: number; tier: ScoreTier } {
  const wealthAxis = Math.max(0, Math.min(1, finalNetWorthPaise / SCORE_REFERENCE_NET_WORTH_PAISE));
  const happinessAxis = Math.max(0, Math.min(1, happinessLegacy / 10000));
  const blended = wealthAxis * SCORE_WEIGHTS.netWorth + happinessAxis * SCORE_WEIGHTS.happiness;
  const score = Math.round(blended * 100);
  return { score, tier: tierFor(score) };
}

export function tierFor(score: number): ScoreTier {
  if (score >= SCORE_THRESHOLDS.S) return 'S';
  if (score >= SCORE_THRESHOLDS.A) return 'A';
  if (score >= SCORE_THRESHOLDS.B) return 'B';
  if (score >= SCORE_THRESHOLDS.C) return 'C';
  return 'D';
}
