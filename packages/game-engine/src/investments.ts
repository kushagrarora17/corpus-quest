import { LOCK_IN_MONTHS, PENALTY_RATES } from '@corpus-quest/shared';
import type { FundType } from '@corpus-quest/shared';

import { currentNAV } from './market';
import type { Investment, NAVHistory, PortfolioEntry, WithdrawResult } from './types';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36)}`;
}

/**
 * Buys mutual fund units. Returns the new investment plus cash after deduction.
 * Throws when the requested amount exceeds available cash.
 */
export function purchaseUnits(
  cash: number,
  fundType: FundType,
  amountPaise: number,
  month: number,
  navPaise: number,
  type: 'SIP' | 'LUMPSUM' = 'LUMPSUM',
): { investment: Investment; cashAfter: number } {
  if (amountPaise <= 0) throw new Error('purchaseUnits: amount must be > 0');
  if (amountPaise > cash) throw new Error('purchaseUnits: insufficient cash');
  if (navPaise <= 0) throw new Error('purchaseUnits: nav must be > 0');

  const units = amountPaise / navPaise;
  const investment: Investment = {
    id: nextId('inv'),
    fundType,
    type,
    unitsPurchased: units,
    navAtPurchase: navPaise,
    investedMonth: month,
    lockInExpiryMonth: month + LOCK_IN_MONTHS,
    isWithdrawn: false,
  };
  return { investment, cashAfter: cash - amountPaise };
}

/**
 * Withdraws all (or `partialUnits`) of an investment at the current NAV.
 * Locked investments incur the fund-type penalty.
 */
export function withdraw(
  investment: Investment,
  navHistory: NAVHistory,
  month: number,
  partialUnits?: number,
): WithdrawResult {
  if (investment.isWithdrawn) {
    return { net: 0, penaltyPaid: 0, unitsRedeemed: 0 };
  }
  const units = Math.min(partialUnits ?? investment.unitsPurchased, investment.unitsPurchased);
  const nav = currentNAV(navHistory, investment.fundType, month);
  const gross = Math.floor(units * nav);
  const isLocked = month < investment.lockInExpiryMonth;
  const penaltyRate = isLocked ? PENALTY_RATES[investment.fundType] : 0;
  const penalty = Math.floor(gross * penaltyRate);
  return { net: gross - penalty, penaltyPaid: penalty, unitsRedeemed: units };
}

/** Sum of (units × current NAV) across all non-withdrawn investments. */
export function portfolioValue(
  investments: Investment[],
  navHistory: NAVHistory,
  month: number,
): number {
  let total = 0;
  for (const inv of investments) {
    if (inv.isWithdrawn) continue;
    const nav = currentNAV(navHistory, inv.fundType, month);
    total += inv.unitsPurchased * nav;
  }
  return Math.floor(total);
}

export function netWorth(
  cash: number,
  investments: Investment[],
  navHistory: NAVHistory,
  month: number,
): number {
  return cash + portfolioValue(investments, navHistory, month);
}

/** Aggregates investments into per-fund holdings for HUD/portfolio screens. */
export function buildPortfolio(investments: Investment[]): PortfolioEntry[] {
  const map = new Map<FundType, PortfolioEntry>();
  for (const inv of investments) {
    if (inv.isWithdrawn) continue;
    const entry = map.get(inv.fundType) ?? {
      fundType: inv.fundType,
      totalUnits: 0,
      totalCostPaise: 0,
    };
    entry.totalUnits += inv.unitsPurchased;
    entry.totalCostPaise += inv.unitsPurchased * inv.navAtPurchase;
    map.set(inv.fundType, entry);
  }
  return [...map.values()].map((e) => ({ ...e, totalCostPaise: Math.floor(e.totalCostPaise) }));
}
