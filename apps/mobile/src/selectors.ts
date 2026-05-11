import {
  type FundType,
  type GameState,
  STARTING_AGE_MONTHS,
  buildPortfolio,
  netWorth,
} from '@corpus-quest/game-engine';

import type { AppStore } from './store';

export interface UpcomingExpense {
  label: string;
  monthsAway: number;
  amount: number;
}

export interface AgeDisplay {
  years: number;
  months: number;
}

export function ageFromMonth(month: number): AgeDisplay {
  const total = STARTING_AGE_MONTHS + month;
  return { years: Math.floor(total / 12), months: total % 12 };
}

export function selectNetWorth(state: GameState): number {
  return netWorth(state.cash, state.investments, state.navHistory, state.month);
}

export function selectPortfolioValue(state: GameState): number {
  return selectNetWorth(state) - state.cash;
}

export function selectUpcomingExpenses(state: GameState, limit = 3): UpcomingExpense[] {
  const list: UpcomingExpense[] = state.committedEMIs
    .filter((emi) => emi.remainingMonths > 0)
    .map((emi) => ({
      label: emi.label,
      monthsAway: 1,
      amount: emi.monthlyAmount,
    }));

  for (const sip of state.sips) {
    if (!sip.active) continue;
    list.push({
      label: `SIP · ${fundShortName(sip.fundType)}`,
      monthsAway: 1,
      amount: sip.monthlyAmount,
    });
  }

  return list.slice(0, limit);
}

export function fundShortName(fund: FundType): string {
  switch (fund) {
    case 'LIQUID':
      return 'Liquid';
    case 'DEBT':
      return 'Debt';
    case 'HYBRID':
      return 'Hybrid';
    case 'LARGE_CAP':
      return 'Large Cap';
    case 'SMALL_MID_CAP':
      return 'Small/Mid Cap';
  }
}

export const selectHud = (s: AppStore) => {
  if (!s.state) return null;
  return {
    netWorth: selectNetWorth(s.state),
    cash: s.state.cash,
    age: ageFromMonth(s.state.month),
    dependents: s.state.dependents,
    upcoming: selectUpcomingExpenses(s.state),
    regime: s.state.marketState.regime,
    requiresInput: s.requiresInput,
    pendingEvent: s.state.pendingEvent,
    isComplete: s.state.isComplete,
    month: s.state.month,
  };
};

export function ensurePortfolio(state: GameState) {
  return state.portfolio.length > 0 ? state.portfolio : buildPortfolio(state.investments);
}
