import { MONTHS_PER_RUN } from '@corpus-quest/shared';

import {
  __test_only__,
  applyEvent,
  checkPlannedEvents,
  compoundUnresolvedIgnorePenalties,
  rollEmergency,
} from './events';
import {
  applyDecay,
  applySpend as applyHappinessSpend,
  averageHappiness,
  happinessLegacy,
  requiresHappinessAction,
} from './happiness';
import { buildPortfolio, netWorth, purchaseUnits, withdraw } from './investments';
import { advanceMarketState, currentNAV, updateNAVs } from './market';
import { computeFinalScore } from './score';
import type {
  GameState,
  Investment,
  LifeEventId,
  PlayerAction,
  TriggeredEvent,
  TurnEvent,
  TurnResult,
} from './types';

/**
 * Pure turn-resolution pipeline (SystemDesign §6.2). Runs the eight phases in
 * order and returns the next `GameState` plus a stream of `TurnEvent`s.
 *
 * If `requiresInput` is true, the caller must surface the pending event /
 * happiness alert to the player before calling resolveTurn again.
 */
export function resolveTurn(state: GameState, action?: PlayerAction): TurnResult {
  if (state.isComplete) {
    return { nextState: state, events: [], requiresInput: false };
  }

  let next: GameState = { ...state };
  const events: TurnEvent[] = [];

  if (action) {
    next = applyAction(next, action, events);
    if (action.kind !== 'RESOLVE_EVENT' && action.kind !== 'SKIP') {
      return { nextState: next, events, requiresInput: next.pendingEvent !== null };
    }
  }

  if (next.pendingEvent && next.pendingEvent.resolvedAction === null) {
    return { nextState: next, events, requiresInput: true };
  }

  if (requiresHappinessAction(next.dependents)) {
    events.push({ kind: 'HAPPINESS_BLOCKED', month: next.month });
    return { nextState: next, events, requiresInput: true };
  }

  // ---------- 1. INCOME PHASE ----------
  const salaryPaused = next.month < next.salaryPausedUntilMonth;
  if (!salaryPaused) {
    next = { ...next, cash: next.cash + next.salary };
    events.push({ kind: 'SALARY_CREDITED', month: next.month, detail: { amount: next.salary } });
  }

  // ---------- 2a. COMMITMENT PHASE — SIPs ----------
  const newInvestments: Investment[] = [...next.investments];
  for (const sip of next.sips) {
    if (!sip.active) continue;
    if (sip.startMonth > next.month) continue;
    if (next.cash < sip.monthlyAmount) {
      events.push({
        kind: 'SIP_SKIPPED',
        month: next.month,
        detail: { sipId: sip.id, fundType: sip.fundType, amount: sip.monthlyAmount },
      });
      continue;
    }
    const nav = currentNAV(next.navHistory, sip.fundType, next.month);
    const { investment, cashAfter } = purchaseUnits(
      next.cash,
      sip.fundType,
      sip.monthlyAmount,
      next.month,
      nav,
      'SIP',
    );
    next = { ...next, cash: cashAfter };
    newInvestments.push(investment);
    events.push({
      kind: 'SIP_DEDUCTED',
      month: next.month,
      detail: {
        fundType: sip.fundType,
        amount: sip.monthlyAmount,
        units: investment.unitsPurchased,
      },
    });
  }
  next = { ...next, investments: newInvestments };

  // ---------- 2b. COMMITMENT PHASE — EMIs ----------
  const remainingEMIs = [];
  for (const emi of next.committedEMIs) {
    if (emi.remainingMonths <= 0) continue;
    if (next.cash < emi.monthlyAmount) {
      events.push({
        kind: 'EMI_SKIPPED',
        month: next.month,
        detail: { emiId: emi.id, amount: emi.monthlyAmount },
      });
      remainingEMIs.push(emi);
      continue;
    }
    next = { ...next, cash: next.cash - emi.monthlyAmount };
    events.push({
      kind: 'EMI_DEDUCTED',
      month: next.month,
      detail: { emiId: emi.id, amount: emi.monthlyAmount },
    });
    remainingEMIs.push({ ...emi, remainingMonths: emi.remainingMonths - 1 });
  }
  next = { ...next, committedEMIs: remainingEMIs.filter((e) => e.remainingMonths > 0) };

  // ---------- 3. MARKET PHASE ----------
  const advancedMarket = advanceMarketState(next.marketState, next.month);
  const newNavHistory = updateNAVs(next.navHistory, advancedMarket, next.month, next.seed);
  next = { ...next, marketState: advancedMarket, navHistory: newNavHistory };
  events.push({ kind: 'NAV_UPDATED', month: next.month });

  // ---------- 4. HAPPINESS PHASE ----------
  next = compoundUnresolvedIgnorePenalties(next);
  next = { ...next, dependents: applyDecay(next.dependents) };
  events.push({ kind: 'HAPPINESS_DECAYED', month: next.month });

  // ---------- 5. EVENT PHASE ----------
  const planned = checkPlannedEvents(next);
  if (planned) {
    if (planned.requiresInput) {
      next = withPendingEvent(next, planned.id);
      events.push({
        kind: 'LIFE_EVENT_TRIGGERED',
        month: next.month,
        detail: { templateId: planned.id },
      });
    } else {
      const result = applyEvent(next, planned, 'AUTO');
      next = result.state;
      events.push({
        kind: 'LIFE_EVENT_TRIGGERED',
        month: next.month,
        detail: { templateId: planned.id, auto: true },
      });
      events.push({
        kind: 'LIFE_EVENT_RESOLVED',
        month: next.month,
        detail: { templateId: planned.id, action: 'AUTO' },
      });
    }
  } else if (!next.pendingEvent) {
    const emergency = rollEmergency(next);
    if (emergency) {
      next = { ...next, eventDeck: next.eventDeck.slice(1) };
      if (emergency.requiresInput) {
        next = withPendingEvent(next, emergency.id);
        events.push({
          kind: 'LIFE_EVENT_TRIGGERED',
          month: next.month,
          detail: { templateId: emergency.id },
        });
      } else {
        const result = applyEvent(next, emergency, 'AUTO');
        next = result.state;
        events.push({
          kind: 'LIFE_EVENT_TRIGGERED',
          month: next.month,
          detail: { templateId: emergency.id, auto: true },
        });
      }
    }
  }

  // ---------- 6. LOCK-IN PHASE — implicit (handled in withdraw()) ----------

  // ---------- 7. SNAPSHOT PHASE ----------
  const happinessAvg = averageHappiness(next.dependents);
  next = {
    ...next,
    happinessLog: [...next.happinessLog, { month: next.month, average: happinessAvg }],
    portfolio: buildPortfolio(next.investments),
  };

  // ---------- 8. TURN ADVANCE ----------
  const advancedMonth = next.month + 1;
  next = { ...next, month: advancedMonth };
  events.push({ kind: 'TURN_ADVANCED', month: advancedMonth });

  if (advancedMonth >= MONTHS_PER_RUN) {
    const finalNet = netWorth(next.cash, next.investments, next.navHistory, next.month);
    const legacy = happinessLegacy(next.happinessLog);
    const { score, tier } = computeFinalScore(finalNet, legacy);
    next = { ...next, isComplete: true, finalScore: score, finalTier: tier };
    events.push({
      kind: 'RUN_COMPLETE',
      month: next.month,
      detail: { netWorth: finalNet, happinessLegacy: legacy, score, tier },
    });
  }

  return {
    nextState: next,
    events,
    requiresInput: next.pendingEvent !== null,
  };
}

function withPendingEvent(state: GameState, templateId: LifeEventId): GameState {
  const pending: TriggeredEvent = {
    templateId,
    triggeredMonth: state.month,
    resolvedMonth: null,
    resolvedAction: null,
    cashImpact: 0,
    happinessApplied: {},
  };
  return { ...state, pendingEvent: pending };
}

function findTemplate(id: LifeEventId) {
  const all = [...__test_only__.PLANNED_TEMPLATES, ...__test_only__.EMERGENCY_TEMPLATES];
  return all.find((t) => t.id === id) ?? null;
}

function applyAction(state: GameState, action: PlayerAction, events: TurnEvent[]): GameState {
  switch (action.kind) {
    case 'INVEST_LUMPSUM': {
      const nav = currentNAV(state.navHistory, action.fundType, state.month);
      const { investment, cashAfter } = purchaseUnits(
        state.cash,
        action.fundType,
        action.amountPaise,
        state.month,
        nav,
        'LUMPSUM',
      );
      const investments = [...state.investments, investment];
      events.push({
        kind: 'INVESTMENT_PURCHASED',
        month: state.month,
        detail: {
          fundType: action.fundType,
          amount: action.amountPaise,
          units: investment.unitsPurchased,
        },
      });
      return {
        ...state,
        cash: cashAfter,
        investments,
        portfolio: buildPortfolio(investments),
      };
    }
    case 'INVEST_SIP': {
      const sip = {
        id: `sip-${state.sips.length + 1}`,
        fundType: action.fundType,
        monthlyAmount: action.monthlyAmount,
        active: true,
        startMonth: state.month,
      };
      return { ...state, sips: [...state.sips, sip] };
    }
    case 'SET_SIP': {
      return {
        ...state,
        sips: state.sips.map((s) =>
          s.id === action.sipId
            ? {
                ...s,
                active: action.active,
                ...(action.monthlyAmount !== undefined
                  ? { monthlyAmount: action.monthlyAmount }
                  : {}),
              }
            : s,
        ),
      };
    }
    case 'WITHDRAW': {
      const inv = state.investments.find((i) => i.id === action.investmentId);
      if (!inv) return state;
      const result = withdraw(inv, state.navHistory, state.month, action.partialUnits);
      const updatedInvestments = state.investments.map((i) =>
        i.id === inv.id
          ? {
              ...i,
              isWithdrawn: result.unitsRedeemed >= i.unitsPurchased,
              unitsPurchased: i.unitsPurchased - result.unitsRedeemed,
            }
          : i,
      );
      events.push({
        kind: 'INVESTMENT_WITHDRAWN',
        month: state.month,
        detail: { investmentId: inv.id, net: result.net, penalty: result.penaltyPaid },
      });
      return {
        ...state,
        cash: state.cash + result.net,
        investments: updatedInvestments,
        portfolio: buildPortfolio(updatedInvestments),
      };
    }
    case 'HAPPINESS_SPEND': {
      if (state.cash < action.amountPaise) return state;
      return {
        ...state,
        cash: state.cash - action.amountPaise,
        dependents: state.dependents.map((d) =>
          d.id === action.dependentId ? applyHappinessSpend(d, action.amountPaise) : d,
        ),
      };
    }
    case 'RESOLVE_EVENT': {
      if (!state.pendingEvent) return state;
      const tplId = state.pendingEvent.templateId;
      const template = findTemplate(tplId);
      if (!template) return { ...state, pendingEvent: null };
      const result = applyEvent(state, template, action.action);
      events.push({
        kind: 'LIFE_EVENT_RESOLVED',
        month: state.month,
        detail: { templateId: tplId, action: action.action },
      });
      return { ...result.state, pendingEvent: null };
    }
    case 'SKIP':
      return state;
    default:
      return state;
  }
}
