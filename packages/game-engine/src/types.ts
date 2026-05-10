import type {
  DependentType,
  Difficulty,
  FundType,
  InvestmentType,
  MarketEventType,
  MarketRegime,
  ScoreTier,
} from '@corpus-quest/shared';

export type {
  DependentType,
  Difficulty,
  FundType,
  InvestmentType,
  MarketEventType,
  MarketRegime,
  ScoreTier,
};

// ---------- Investments ----------

export interface Investment {
  id: string;
  fundType: FundType;
  type: InvestmentType;
  unitsPurchased: number;
  navAtPurchase: number; // paise per unit
  investedMonth: number;
  lockInExpiryMonth: number;
  isWithdrawn: boolean;
}

export interface SIPConfig {
  id: string;
  fundType: FundType;
  monthlyAmount: number; // paise
  active: boolean;
  startMonth: number;
}

export interface EMI {
  id: string;
  label: string;
  monthlyAmount: number; // paise
  remainingMonths: number;
}

export interface Dependent {
  id: string;
  type: DependentType;
  name: string;
  happiness: number; // 0-10000
  /** Month at which the dependent was added (e.g. spouse arrives at marriage). */
  joinedMonth: number;
}

/** Snapshot of a single fund's NAV per month. nav[0] = starting NAV. */
export type NAVHistory = Record<FundType, number[]>;

export interface PortfolioEntry {
  fundType: FundType;
  totalUnits: number;
  totalCostPaise: number;
}

// ---------- Market ----------

export interface MarketEvent {
  type: MarketEventType;
  startMonth: number;
  durationMonths: number;
  modifiers: Record<FundType, number>; // monthly return modifier
}

export interface MarketState {
  regime: MarketRegime;
  upcomingEvents: MarketEvent[];
  activeEvents: MarketEvent[];
  pastEvents: MarketEvent[];
}

// ---------- Life events ----------

export type LifeEventCategory = 'PLANNED' | 'EMERGENCY';

export type LifeEventId =
  | 'FIRST_RAISE'
  | 'MARRIAGE'
  | 'FIRST_CHILD'
  | 'SECOND_CHILD'
  | 'HOME_PURCHASE'
  | 'PARENT_SUPPORT'
  | 'CHILD_COLLEGE'
  | 'BIG_PROMOTION'
  | 'JOB_LOSS'
  | 'SALARY_STAGNATION'
  | 'MEDICAL_SELF'
  | 'MEDICAL_FAMILY'
  | 'CAR_BREAKDOWN'
  | 'HOME_REPAIR'
  | 'LEGAL_DISPUTE'
  | 'THEFT_FRAUD'
  | 'BUSINESS_OPPORTUNITY';

export interface LifeEventTemplate {
  id: LifeEventId;
  category: LifeEventCategory;
  /** Inclusive month range (0-455) within which a planned event may fire. */
  ageWindow?: { fromMonth: number; toMonth: number };
  /** Cash impact (paise). Negative = cost. May be a range; resolved with seeded RNG. */
  cashImpactRange: { min: number; max: number };
  /** Per-dependent-type happiness deltas applied on resolution. */
  happinessImpact: Partial<Record<DependentType, number>>;
  /** Salary delta (paise/month) — applied after firing if non-zero. */
  salaryDelta?: { min: number; max: number };
  /** For events that pause salary (job loss). */
  salaryPauseMonths?: { min: number; max: number };
  /** Penalty applied if ignored next month (cumulative). */
  ignorePenalty?: { happinessDeltaPerMonth: Partial<Record<DependentType, number>> };
  /** True if the event must be acknowledged before turn advance. */
  requiresInput: boolean;
}

export interface TriggeredEvent {
  templateId: LifeEventId;
  triggeredMonth: number;
  resolvedMonth: number | null;
  resolvedAction: 'PAID' | 'IGNORED' | 'AUTO' | null;
  cashImpact: number; // realised paise
  happinessApplied: Partial<Record<DependentType, number>>;
}

// ---------- Logs / events stream ----------

export interface HappinessLog {
  month: number;
  /** Average happiness across all current dependents (0-10000). */
  average: number;
}

export type TurnEventKind =
  | 'SALARY_CREDITED'
  | 'SIP_DEDUCTED'
  | 'SIP_SKIPPED'
  | 'EMI_DEDUCTED'
  | 'EMI_SKIPPED'
  | 'NAV_UPDATED'
  | 'HAPPINESS_DECAYED'
  | 'HAPPINESS_BLOCKED'
  | 'MARKET_EVENT_STARTED'
  | 'MARKET_EVENT_ENDED'
  | 'LIFE_EVENT_TRIGGERED'
  | 'LIFE_EVENT_RESOLVED'
  | 'INVESTMENT_PURCHASED'
  | 'INVESTMENT_WITHDRAWN'
  | 'TURN_ADVANCED'
  | 'RUN_COMPLETE';

export interface TurnEvent {
  kind: TurnEventKind;
  month: number;
  detail?: Record<string, unknown>;
}

// ---------- Player actions ----------

export type PlayerAction =
  | { kind: 'INVEST_SIP'; fundType: FundType; monthlyAmount: number }
  | { kind: 'INVEST_LUMPSUM'; fundType: FundType; amountPaise: number }
  | { kind: 'WITHDRAW'; investmentId: string; partialUnits?: number }
  | { kind: 'SET_SIP'; sipId: string; active: boolean; monthlyAmount?: number }
  | { kind: 'HAPPINESS_SPEND'; dependentId: string; amountPaise: number }
  | { kind: 'RESOLVE_EVENT'; templateId: LifeEventId; action: 'PAID' | 'IGNORED' }
  | { kind: 'SKIP' };

// ---------- Game state ----------

export interface GameState {
  runId: string;
  seed: string;
  difficulty: Difficulty;
  month: number; // 0..456
  cash: number; // paise
  salary: number; // paise/month
  salaryPausedUntilMonth: number; // 0 = not paused
  portfolio: PortfolioEntry[];
  investments: Investment[];
  navHistory: NAVHistory;
  sips: SIPConfig[];
  dependents: Dependent[];
  committedEMIs: EMI[];
  eventDeck: LifeEventTemplate[];
  plannedEvents: LifeEventTemplate[];
  triggeredEvents: TriggeredEvent[];
  pendingEvent: TriggeredEvent | null;
  marketState: MarketState;
  happinessLog: HappinessLog[];
  isComplete: boolean;
  finalScore: number | null;
  finalTier: ScoreTier | null;
}

export interface TurnResult {
  nextState: GameState;
  events: TurnEvent[];
  requiresInput: boolean;
}

export interface WithdrawResult {
  net: number;
  penaltyPaid: number;
  unitsRedeemed: number;
}
