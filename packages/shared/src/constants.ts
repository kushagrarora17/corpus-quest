import type { DependentType, FundConfig, FundType, ScoreTier } from './types.js';

/**
 * Game tuning constants. Single source of truth — both the engine and the UI
 * import from here so a tweak ripples through the whole monorepo.
 *
 * Monetary values are stored in **paise** (integer). Display happens in
 * `./money.ts`.
 */

// ---------- Run cadence ----------

/** Total months from age 22 → age 60 (inclusive of month 0). */
export const MONTHS_PER_RUN = 456;

/** Player starts at age 22. */
export const STARTING_AGE_MONTHS = 22 * 12;

/** Lock-in window applied to every investment unit before withdrawal is penalty-free. */
export const LOCK_IN_MONTHS = 12;

// ---------- Money formatting ----------

/** 1 INR = 100 paise. All cash math is integer paise. */
export const PAISE_PER_RUPEE = 100;

/** 1 Lakh = 1,00,000 INR. */
export const LAKH = 100_000;

/** 1 Crore = 1,00,00,000 INR. */
export const CRORE = 10_000_000;

// ---------- Fund profiles (mirror SystemDesign §7.3) ----------

export const FUND_CONFIG: Record<FundType, FundConfig> = {
  LIQUID: { baseAnnualReturn: 0.055, noiseAmp: 0.002, penaltyRate: 0.005 },
  DEBT: { baseAnnualReturn: 0.075, noiseAmp: 0.005, penaltyRate: 0.01 },
  HYBRID: { baseAnnualReturn: 0.11, noiseAmp: 0.015, penaltyRate: 0.02 },
  LARGE_CAP: { baseAnnualReturn: 0.135, noiseAmp: 0.025, penaltyRate: 0.03 },
  SMALL_MID_CAP: { baseAnnualReturn: 0.175, noiseAmp: 0.05, penaltyRate: 0.05 },
};

/** Per-fund early-withdrawal penalty (fraction of gross redemption). */
export const PENALTY_RATES: Record<FundType, number> = {
  LIQUID: FUND_CONFIG.LIQUID.penaltyRate,
  DEBT: FUND_CONFIG.DEBT.penaltyRate,
  HYBRID: FUND_CONFIG.HYBRID.penaltyRate,
  LARGE_CAP: FUND_CONFIG.LARGE_CAP.penaltyRate,
  SMALL_MID_CAP: FUND_CONFIG.SMALL_MID_CAP.penaltyRate,
};

// ---------- Happiness ----------

/**
 * Monthly happiness decay per dependent type. Happiness is stored as integer
 * 0–10000 (display divides by 100, so values map to 0.00–100.00).
 */
export const DECAY_RATES: Record<DependentType, number> = {
  SELF: 100,
  SPOUSE: 150,
  CHILD: 200,
  PARENT: 100,
};

/** Starting happiness for every dependent at run init (display: 70). */
export const STARTING_HAPPINESS = 7000;

/** Happiness threshold below which the engine blocks turn advance (display: 20). */
export const HAPPINESS_BLOCK_THRESHOLD = 2000;

/** Happiness ceiling above which the spend boost begins to diminish (display: 80). */
export const HAPPINESS_DIMINISHING_RETURNS = 8000;

/** Maximum integer happiness value (display: 100). */
export const HAPPINESS_MAX = 10000;

// ---------- Salary range at run start (paise / month) ----------

export const STARTING_SALARY_MIN_PAISE = 25_000 * PAISE_PER_RUPEE; // ₹25,000 = 2,500,000 paise
export const STARTING_SALARY_MAX_PAISE = 45_000 * PAISE_PER_RUPEE; // ₹45,000 = 4,500,000 paise

// ---------- Final-score weights & tier thresholds ----------

/**
 * Final score weighting (SystemDesign §F10): 70% net worth, 30% happiness legacy.
 * Both inputs are normalised to 0..1 before being combined.
 */
export const SCORE_WEIGHTS = {
  netWorth: 0.7,
  happiness: 0.3,
} as const;

/** Reference net worth used to normalise the score. ₹5 Cr → score-perfect on the wealth axis. */
export const SCORE_REFERENCE_NET_WORTH_PAISE = 5 * CRORE * PAISE_PER_RUPEE;

/** Tier cutoffs on the 0–100 final-score scale (inclusive lower bound). */
export const SCORE_THRESHOLDS: Record<ScoreTier, number> = {
  S: 90,
  A: 75,
  B: 55,
  C: 35,
  D: 0,
};

// ---------- Server-side score sanity ----------

/**
 * Hard ceiling used by the API to reject implausible self-reported scores.
 * Set at ₹50 Cr (= 50 × 1 Cr × 100 paise/INR = 5×10¹⁰ paise). The SystemDesign
 * doc lists the same INR figure but with an off-by-one-zero paise figure;
 * resolved here in favour of the INR value.
 */
export const MAX_PLAUSIBLE_NET_WORTH_PAISE = 50 * CRORE * PAISE_PER_RUPEE;

/** Permitted drift between client-computed and server-recomputed final scores. */
export const SCORE_DRIFT_TOLERANCE = 2;
