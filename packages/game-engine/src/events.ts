import { PAISE_PER_RUPEE } from '@corpus-quest/shared';
import type { Difficulty } from '@corpus-quest/shared';

import { makeRng, rngInt, rngShuffle } from './rng';
import type { GameState, LifeEventTemplate, TriggeredEvent } from './types';

const inr = (rupees: number): number => rupees * PAISE_PER_RUPEE;

const PLANNED_TEMPLATES: LifeEventTemplate[] = [
  {
    id: 'FIRST_RAISE',
    category: 'PLANNED',
    ageWindow: { fromMonth: 12, toMonth: 36 }, // age 23-25
    cashImpactRange: { min: 0, max: 0 },
    happinessImpact: { SELF: 1500 },
    salaryDelta: { min: inr(5_000), max: inr(15_000) },
    requiresInput: false,
  },
  {
    id: 'MARRIAGE',
    category: 'PLANNED',
    ageWindow: { fromMonth: 48, toMonth: 96 }, // age 26-30
    cashImpactRange: { min: -inr(10_00_000), max: -inr(3_00_000) }, // ₹3-10L
    happinessImpact: { SELF: 2000, SPOUSE: 2000, PARENT: 2000 },
    requiresInput: true,
  },
  {
    id: 'FIRST_CHILD',
    category: 'PLANNED',
    ageWindow: { fromMonth: 72, toMonth: 132 }, // age 28-33
    cashImpactRange: { min: -inr(1_50_000), max: -inr(50_000) },
    happinessImpact: { SELF: 2500, SPOUSE: 2500, CHILD: 2500 },
    requiresInput: true,
  },
  {
    id: 'HOME_PURCHASE',
    category: 'PLANNED',
    ageWindow: { fromMonth: 96, toMonth: 192 }, // age 30-38
    cashImpactRange: { min: -inr(20_00_000), max: -inr(8_00_000) },
    happinessImpact: { SELF: 2000, SPOUSE: 2000 },
    requiresInput: true,
  },
  {
    id: 'PARENT_SUPPORT',
    category: 'PLANNED',
    ageWindow: { fromMonth: 216, toMonth: 336 }, // age 40-50
    cashImpactRange: { min: -inr(20_000), max: -inr(5_000) },
    happinessImpact: { PARENT: 1000 },
    ignorePenalty: { happinessDeltaPerMonth: { SELF: -500 } },
    requiresInput: true,
  },
  {
    id: 'BIG_PROMOTION',
    category: 'PLANNED',
    ageWindow: { fromMonth: 60, toMonth: 360 },
    cashImpactRange: { min: 0, max: 0 },
    happinessImpact: { SELF: 2500 },
    salaryDelta: { min: inr(20_000), max: inr(50_000) },
    requiresInput: false,
  },
];

const EMERGENCY_TEMPLATES: LifeEventTemplate[] = [
  {
    id: 'MEDICAL_SELF',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(3_00_000), max: -inr(50_000) },
    happinessImpact: { SELF: 0 },
    ignorePenalty: { happinessDeltaPerMonth: { SELF: -3000 } },
    requiresInput: true,
  },
  {
    id: 'MEDICAL_FAMILY',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(5_00_000), max: -inr(50_000) },
    happinessImpact: { SPOUSE: 0 },
    ignorePenalty: { happinessDeltaPerMonth: { SPOUSE: -4000 } },
    requiresInput: true,
  },
  {
    id: 'CAR_BREAKDOWN',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(80_000), max: -inr(20_000) },
    happinessImpact: { SELF: -1000 },
    requiresInput: true,
  },
  {
    id: 'HOME_REPAIR',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(2_00_000), max: -inr(30_000) },
    happinessImpact: { SPOUSE: -2000 },
    requiresInput: true,
  },
  {
    id: 'JOB_LOSS',
    category: 'EMERGENCY',
    cashImpactRange: { min: 0, max: 0 },
    happinessImpact: { SELF: -2000 },
    salaryPauseMonths: { min: 3, max: 8 },
    requiresInput: true,
  },
  {
    id: 'LEGAL_DISPUTE',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(3_00_000), max: -inr(50_000) },
    happinessImpact: { SELF: -1500 },
    ignorePenalty: { happinessDeltaPerMonth: { SELF: -1500 } },
    requiresInput: true,
  },
  {
    id: 'THEFT_FRAUD',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(1_00_000), max: -inr(20_000) },
    happinessImpact: { SELF: -1500 },
    requiresInput: false,
  },
  {
    id: 'BUSINESS_OPPORTUNITY',
    category: 'EMERGENCY',
    cashImpactRange: { min: -inr(5_00_000), max: -inr(1_00_000) },
    happinessImpact: { SELF: 1000 },
    requiresInput: true,
  },
];

/**
 * Builds the per-run event collections. The emergency deck is a shuffled,
 * de-duplicated copy of the emergency templates. Planned events are returned
 * sorted by their age window so the engine can process them in order.
 */
export function buildEventDeck(
  seed: string,
  difficulty: Difficulty,
): { plannedEvents: LifeEventTemplate[]; emergencyDeck: LifeEventTemplate[] } {
  const planned = [...PLANNED_TEMPLATES].sort(
    (a, b) => (a.ageWindow?.fromMonth ?? 0) - (b.ageWindow?.fromMonth ?? 0),
  );
  // HARD difficulty doubles the deck so emergencies recur more often.
  const base = difficulty === 'HARD'
    ? [...EMERGENCY_TEMPLATES, ...EMERGENCY_TEMPLATES]
    : [...EMERGENCY_TEMPLATES];
  const emergencyDeck = rngShuffle(base, seed, 'emergency-deck');
  return { plannedEvents: planned, emergencyDeck };
}

/** True iff the deck has at least one occurrence of every emergency template id. */
export function emergencyDeckHasAllIds(deck: LifeEventTemplate[]): boolean {
  const ids = new Set(deck.map((t) => t.id));
  return EMERGENCY_TEMPLATES.every((t) => ids.has(t.id));
}

/** Returns the next planned event whose age-window includes the current month. */
export function checkPlannedEvents(state: GameState): LifeEventTemplate | null {
  for (const tpl of state.plannedEvents) {
    const fired = state.triggeredEvents.some((t) => t.templateId === tpl.id);
    if (fired) continue;
    if (!tpl.ageWindow) continue;
    if (state.month >= tpl.ageWindow.fromMonth && state.month <= tpl.ageWindow.toMonth) {
      // Schedule deterministically inside the window using the seed.
      const fireMonth = rngInt(
        state.seed,
        state.month,
        `planned:${tpl.id}`,
        tpl.ageWindow.fromMonth,
        tpl.ageWindow.toMonth,
      );
      if (state.month >= fireMonth) return tpl;
    } else if (state.month > tpl.ageWindow.toMonth) {
      // Past the window without firing — auto-fire on first chance.
      return tpl;
    }
  }
  return null;
}

const EMERGENCY_PROB_NORMAL = 0.06;
const EMERGENCY_PROB_HARD = 0.1;

/** Probability roll for an emergency on the current month. */
export function rollEmergency(state: GameState): LifeEventTemplate | null {
  if (state.eventDeck.length === 0) return null;
  const threshold =
    state.difficulty === 'HARD' ? EMERGENCY_PROB_HARD : EMERGENCY_PROB_NORMAL;
  const r = makeRng(state.seed, state.month, 'emergency-roll');
  if (r > threshold) return null;
  return state.eventDeck[0] ?? null;
}

/** Resolve an event: returns the modified state and the realised triggered record. */
export function applyEvent(
  state: GameState,
  template: LifeEventTemplate,
  action: 'PAID' | 'IGNORED' | 'AUTO',
): { state: GameState; triggered: TriggeredEvent } {
  const { min, max } = template.cashImpactRange;
  const cashImpact = min === max ? min : rngInt(state.seed, state.month, `cash:${template.id}`, min, max);
  const happinessApplied: TriggeredEvent['happinessApplied'] = {};

  let nextCash = state.cash;
  let nextSalary = state.salary;
  let nextSalaryPausedUntil = state.salaryPausedUntilMonth;
  const nextDependents = state.dependents.map((d) => ({ ...d }));

  if (action === 'PAID' || action === 'AUTO') {
    nextCash += cashImpact; // negative for costs
    for (const [type, delta] of Object.entries(template.happinessImpact)) {
      happinessApplied[type as keyof typeof happinessApplied] = delta;
      for (const d of nextDependents) {
        if (d.type === type) {
          d.happiness = Math.max(0, Math.min(10000, d.happiness + (delta ?? 0)));
        }
      }
    }
    if (template.salaryDelta) {
      const sd = template.salaryDelta;
      nextSalary += rngInt(state.seed, state.month, `salary:${template.id}`, sd.min, sd.max);
    }
    if (template.salaryPauseMonths) {
      const sp = template.salaryPauseMonths;
      const months = rngInt(state.seed, state.month, `pause:${template.id}`, sp.min, sp.max);
      nextSalaryPausedUntil = state.month + months;
    }
  } else if (action === 'IGNORED' && template.ignorePenalty) {
    for (const [type, delta] of Object.entries(template.ignorePenalty.happinessDeltaPerMonth)) {
      happinessApplied[type as keyof typeof happinessApplied] = delta;
      for (const d of nextDependents) {
        if (d.type === type) {
          d.happiness = Math.max(0, Math.min(10000, d.happiness + (delta ?? 0)));
        }
      }
    }
  }

  const triggered: TriggeredEvent = {
    templateId: template.id,
    triggeredMonth: state.month,
    resolvedMonth: action === 'IGNORED' ? null : state.month,
    resolvedAction: action,
    cashImpact: action === 'PAID' || action === 'AUTO' ? cashImpact : 0,
    happinessApplied,
  };

  // Add a CHILD dependent on first/second child events.
  let nextDeps = nextDependents;
  if ((template.id === 'FIRST_CHILD' || template.id === 'SECOND_CHILD') && action !== 'IGNORED') {
    nextDeps = [
      ...nextDependents,
      {
        id: `child-${template.id === 'FIRST_CHILD' ? '1' : '2'}`,
        type: 'CHILD',
        name: template.id === 'FIRST_CHILD' ? 'Child 1' : 'Child 2',
        happiness: 7000,
        joinedMonth: state.month,
      },
    ];
  }
  // Add a SPOUSE dependent on marriage.
  if (template.id === 'MARRIAGE' && action !== 'IGNORED') {
    nextDeps = [
      ...nextDeps,
      {
        id: 'spouse',
        type: 'SPOUSE',
        name: 'Spouse',
        happiness: 7000,
        joinedMonth: state.month,
      },
    ];
  }

  const triggeredEvents: TriggeredEvent[] = [...state.triggeredEvents, triggered];

  return {
    state: {
      ...state,
      cash: Math.max(0, nextCash),
      salary: Math.max(0, nextSalary),
      salaryPausedUntilMonth: nextSalaryPausedUntil,
      dependents: nextDeps,
      triggeredEvents,
    },
    triggered,
  };
}

/** Re-applies the ignore-penalty for unresolved events that have an `ignorePenalty`. */
export function compoundUnresolvedIgnorePenalties(state: GameState): GameState {
  let dependents = state.dependents.map((d) => ({ ...d }));
  for (const triggered of state.triggeredEvents) {
    if (triggered.resolvedAction !== 'IGNORED') continue;
    if (triggered.resolvedMonth !== null) continue;
    const template = [...PLANNED_TEMPLATES, ...EMERGENCY_TEMPLATES].find(
      (t) => t.id === triggered.templateId,
    );
    if (!template?.ignorePenalty) continue;
    // Only compound after at least one full month has passed since the trigger.
    if (state.month <= triggered.triggeredMonth) continue;
    for (const [type, delta] of Object.entries(template.ignorePenalty.happinessDeltaPerMonth)) {
      dependents = dependents.map((d) =>
        d.type === type
          ? { ...d, happiness: Math.max(0, Math.min(10000, d.happiness + (delta ?? 0))) }
          : d,
      );
    }
  }
  return { ...state, dependents };
}

export const __test_only__ = { PLANNED_TEMPLATES, EMERGENCY_TEMPLATES };
