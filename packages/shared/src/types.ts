/**
 * Cross-package shared types — referenced by `game-engine`, `apps/api`, and `apps/mobile`.
 * Keep this file dependency-free (pure TypeScript, no runtime imports). Runtime validators
 * for these shapes live in `./schemas.ts` (Zod).
 */

// ---------- Funds & investments ----------

export type FundType = 'LIQUID' | 'DEBT' | 'HYBRID' | 'LARGE_CAP' | 'SMALL_MID_CAP';

export type InvestmentType = 'SIP' | 'LUMPSUM';

// ---------- Difficulty & scoring ----------

export type Difficulty = 'NORMAL' | 'HARD';

export type ScoreTier = 'S' | 'A' | 'B' | 'C' | 'D';

// ---------- Family / dependents ----------

export type DependentType = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT';

// ---------- Market ----------

export type MarketRegime = 'BULL' | 'BEAR' | 'VOLATILE' | 'STEADY';

export type MarketEventType =
  | 'GREAT_FREEZE'
  | 'PANIC_BOUNCE'
  | 'BULL_EUPHORIA'
  | 'SECTOR_STORM'
  | 'BANKING_SCARE'
  | 'STEADY_GROWTH';

// ---------- Fund configuration shape ----------
// Note: API payload shapes (StartRunResponse, SnapshotPayload, CompleteRunPayload,
// PlayerProfile) are defined in ./schemas.ts as Zod-inferred types — that file is
// the single source of truth for those shapes.

export interface FundConfig {
  baseAnnualReturn: number;
  noiseAmp: number;
  penaltyRate: number;
}
