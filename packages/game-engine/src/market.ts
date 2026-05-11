import { FUND_CONFIG, MONTHS_PER_RUN } from '@corpus-quest/shared';
import type { FundType, MarketEventType } from '@corpus-quest/shared';

import { makeRng, rngFloat, rngInt } from './rng';
import type { MarketEvent, MarketRegime, MarketState, NAVHistory } from './types';

/** All NAVs start at 1000 paise (₹10/unit). Test contracts depend on this. */
export const STARTING_NAV_PAISE = 1000;

const MIN_EVENT_SPACING = 24;
const MIN_EVENTS = 4;
const MAX_EVENTS = 6;

const FUND_TYPES: FundType[] = ['LIQUID', 'DEBT', 'HYBRID', 'LARGE_CAP', 'SMALL_MID_CAP'];

interface EventArchetype {
  type: MarketEventType;
  durationRange: { min: number; max: number };
  modifierRange: Record<FundType, { min: number; max: number }>;
}

/**
 * Per-month return modifiers (added to the fund's base monthly return).
 * For example, GREAT_FREEZE imposes ~–5%/mo on Large Cap over 8–14 months
 * → cumulative ~–40 to –55%, matching GDD §4.2.
 */
const ARCHETYPES: EventArchetype[] = [
  {
    type: 'GREAT_FREEZE',
    durationRange: { min: 8, max: 14 },
    modifierRange: {
      LIQUID: { min: 0, max: 0 },
      DEBT: { min: 0.001, max: 0.003 },
      HYBRID: { min: -0.025, max: -0.015 },
      LARGE_CAP: { min: -0.06, max: -0.04 },
      SMALL_MID_CAP: { min: -0.08, max: -0.05 },
    },
  },
  {
    type: 'PANIC_BOUNCE',
    durationRange: { min: 4, max: 6 },
    modifierRange: {
      LIQUID: { min: 0, max: 0 },
      DEBT: { min: -0.005, max: 0 },
      HYBRID: { min: -0.05, max: -0.03 },
      LARGE_CAP: { min: -0.08, max: -0.05 },
      SMALL_MID_CAP: { min: -0.1, max: -0.07 },
    },
  },
  {
    type: 'BULL_EUPHORIA',
    durationRange: { min: 24, max: 36 },
    modifierRange: {
      LIQUID: { min: 0, max: 0 },
      DEBT: { min: 0, max: 0.001 },
      HYBRID: { min: 0.01, max: 0.02 },
      LARGE_CAP: { min: 0.015, max: 0.025 },
      SMALL_MID_CAP: { min: 0.025, max: 0.045 },
    },
  },
  {
    type: 'SECTOR_STORM',
    durationRange: { min: 6, max: 10 },
    modifierRange: {
      LIQUID: { min: 0, max: 0 },
      DEBT: { min: 0, max: 0 },
      HYBRID: { min: -0.01, max: 0 },
      LARGE_CAP: { min: 0, max: 0 },
      SMALL_MID_CAP: { min: -0.05, max: -0.03 },
    },
  },
  {
    type: 'BANKING_SCARE',
    durationRange: { min: 3, max: 6 },
    modifierRange: {
      LIQUID: { min: -0.001, max: 0 },
      DEBT: { min: -0.025, max: -0.01 },
      HYBRID: { min: -0.01, max: 0 },
      LARGE_CAP: { min: -0.005, max: 0 },
      SMALL_MID_CAP: { min: -0.005, max: 0 },
    },
  },
  {
    type: 'STEADY_GROWTH',
    durationRange: { min: 12, max: 24 },
    modifierRange: {
      LIQUID: { min: 0, max: 0.0005 },
      DEBT: { min: 0.001, max: 0.002 },
      HYBRID: { min: 0.003, max: 0.006 },
      LARGE_CAP: { min: 0.004, max: 0.008 },
      SMALL_MID_CAP: { min: 0.005, max: 0.01 },
    },
  },
];

function pickArchetype(seed: string, eventIndex: number): EventArchetype {
  const idx = rngInt(seed, eventIndex, 'archetype', 0, ARCHETYPES.length - 1);
  return ARCHETYPES[idx] as EventArchetype;
}

function buildModifiers(
  archetype: EventArchetype,
  seed: string,
  eventIndex: number,
): Record<FundType, number> {
  const out = {} as Record<FundType, number>;
  for (const fund of FUND_TYPES) {
    const range = archetype.modifierRange[fund];
    out[fund] = rngFloat(seed, eventIndex, `mod:${fund}`, range.min, range.max);
  }
  return out;
}

/**
 * Generates a deterministic sequence of 4–6 market events with ≥ 24 months
 * of spacing between event start months. Stored sorted by `startMonth` ascending.
 */
export function generateEventSequence(seed: string): MarketEvent[] {
  const eventCount = rngInt(seed, 0, 'event-count', MIN_EVENTS, MAX_EVENTS);
  const events: MarketEvent[] = [];
  const usedMonths: number[] = [];

  // Reserve room at the end so even the longest event finishes inside the run.
  const longestPossible = Math.max(...ARCHETYPES.map((a) => a.durationRange.max));
  const maxStart = MONTHS_PER_RUN - longestPossible - 1;

  for (let i = 0; i < eventCount; i += 1) {
    const archetype = pickArchetype(seed, i);
    const duration = rngInt(
      seed,
      i,
      'duration',
      archetype.durationRange.min,
      archetype.durationRange.max,
    );

    let start = -1;
    // Try up to 32 candidate offsets; widen seed via attempt index.
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const candidate = rngInt(seed, i * 100 + attempt, 'start', 6, maxStart);
      const ok = usedMonths.every((m) => Math.abs(m - candidate) >= MIN_EVENT_SPACING);
      if (ok) {
        start = candidate;
        break;
      }
    }
    if (start < 0) break; // ran out of space — settle for fewer events

    usedMonths.push(start);
    events.push({
      type: archetype.type,
      startMonth: start,
      durationMonths: duration,
      modifiers: buildModifiers(archetype, seed, i),
    });
  }

  events.sort((a, b) => a.startMonth - b.startMonth);
  return events;
}

export function createInitialMarketState(seed: string): MarketState {
  return {
    regime: 'STEADY',
    upcomingEvents: generateEventSequence(seed),
    activeEvents: [],
    pastEvents: [],
  };
}

export function createInitialNAVHistory(): NAVHistory {
  const out = {} as NAVHistory;
  for (const fund of FUND_TYPES) {
    out[fund] = [STARTING_NAV_PAISE];
  }
  return out;
}

function regimeFromActive(active: MarketEvent[]): MarketRegime {
  if (active.length === 0) return 'STEADY';
  // Pick the dominant event by largest absolute LARGE_CAP modifier.
  const dominant = active.reduce((best, ev) =>
    Math.abs(ev.modifiers.LARGE_CAP) > Math.abs(best.modifiers.LARGE_CAP) ? ev : best,
  );
  switch (dominant.type) {
    case 'GREAT_FREEZE':
    case 'PANIC_BOUNCE':
    case 'BANKING_SCARE':
      return 'BEAR';
    case 'BULL_EUPHORIA':
      return 'BULL';
    case 'SECTOR_STORM':
      return 'VOLATILE';
    case 'STEADY_GROWTH':
      return 'STEADY';
    default:
      return 'STEADY';
  }
}

/** Promote upcoming → active and active → past based on the new month. */
export function advanceMarketState(state: MarketState, month: number): MarketState {
  const upcoming: MarketEvent[] = [];
  const active: MarketEvent[] = [...state.activeEvents];
  const past: MarketEvent[] = [...state.pastEvents];

  for (const ev of state.upcomingEvents) {
    if (ev.startMonth <= month) {
      active.push(ev);
    } else {
      upcoming.push(ev);
    }
  }

  const stillActive: MarketEvent[] = [];
  for (const ev of active) {
    if (month >= ev.startMonth + ev.durationMonths) {
      past.push(ev);
    } else {
      stillActive.push(ev);
    }
  }

  return {
    regime: regimeFromActive(stillActive),
    upcomingEvents: upcoming,
    activeEvents: stillActive,
    pastEvents: past,
  };
}

/** Sum of monthly modifiers across all active events for the given fund. */
function activeEventModifier(state: MarketState, fund: FundType): number {
  return state.activeEvents.reduce((acc, ev) => acc + ev.modifiers[fund], 0);
}

/** Per-month return for a given fund: base + active event modifiers + noise. */
export function computeMonthlyReturn(
  fundType: FundType,
  month: number,
  marketState: MarketState,
  seed: string,
): number {
  const cfg = FUND_CONFIG[fundType];
  const base = cfg.baseAnnualReturn / 12;
  const evt = activeEventModifier(marketState, fundType);
  // noise centred on zero with amplitude noiseAmp
  const noise = (makeRng(seed, month, `noise:${fundType}`) - 0.5) * 2 * cfg.noiseAmp;
  return base + evt + noise;
}

/**
 * Apply one month of returns to all funds and append the new NAV.
 * Mutates the input series in place (the engine owns the navHistory object
 * inside resolveTurn) and returns the same reference for chaining.
 */
export function updateNAVs(
  navHistory: NAVHistory,
  marketState: MarketState,
  month: number,
  seed: string,
): NAVHistory {
  for (const fund of FUND_TYPES) {
    const series = navHistory[fund];
    const prev = series[series.length - 1] ?? STARTING_NAV_PAISE;
    const r = computeMonthlyReturn(fund, month, marketState, seed);
    series.push(prev * (1 + r));
  }
  return navHistory;
}

export function currentNAV(navHistory: NAVHistory, fundType: FundType, month: number): number {
  const series = navHistory[fundType];
  return series[Math.min(month, series.length - 1)] ?? STARTING_NAV_PAISE;
}
