import { describe, expect, it } from 'vitest';

import {
  buildPortfolio,
  netWorth,
  portfolioValue,
  purchaseUnits,
  withdraw,
} from '../src/investments.js';
import { STARTING_NAV_PAISE, createInitialNAVHistory } from '../src/market.js';
import type { NAVHistory } from '../src/types.js';

const PAISE_PER_RUPEE = 100;

describe('investments', () => {
  it('₹1,00,000 at NAV 1000 paise buys 10,000 units (paise math)', () => {
    const cashPaise = 100_000 * PAISE_PER_RUPEE; // 1,00,00,000 paise
    const { investment, cashAfter } = purchaseUnits(
      cashPaise,
      'LIQUID',
      cashPaise,
      0,
      STARTING_NAV_PAISE,
    );
    expect(investment.unitsPurchased).toBe(10_000);
    expect(cashAfter).toBe(0);
  });

  it('early withdrawal of LARGE_CAP triggers 3% penalty', () => {
    const navHistory: NAVHistory = createInitialNAVHistory();
    const { investment } = purchaseUnits(
      10_000_000,
      'LARGE_CAP',
      10_000_000,
      0,
      STARTING_NAV_PAISE,
    );
    // Withdraw before lock-in expiry (month 6)
    const result = withdraw(investment, navHistory, 6);
    expect(result.penaltyPaid).toBeGreaterThan(0);
    // Penalty rate is 3%; gross = 10,000 units × 1000 paise = 10,000,000
    expect(result.penaltyPaid).toBe(Math.floor(10_000_000 * 0.03));
  });

  it('post lock-in withdrawal has no penalty', () => {
    const navHistory: NAVHistory = createInitialNAVHistory();
    const { investment } = purchaseUnits(
      10_000_000,
      'LARGE_CAP',
      10_000_000,
      0,
      STARTING_NAV_PAISE,
    );
    const result = withdraw(investment, navHistory, 13);
    expect(result.penaltyPaid).toBe(0);
  });

  it('portfolioValue marks investments to current NAV', () => {
    const navHistory: NAVHistory = createInitialNAVHistory();
    const { investment } = purchaseUnits(10_000_000, 'LIQUID', 10_000_000, 0, STARTING_NAV_PAISE);
    // Append an inflated NAV at month 1
    navHistory.LIQUID = [...navHistory.LIQUID, STARTING_NAV_PAISE * 1.1];
    const value = portfolioValue([investment], navHistory, 1);
    expect(value).toBe(Math.floor(10_000 * STARTING_NAV_PAISE * 1.1));
  });

  it('netWorth = cash + portfolioValue', () => {
    const navHistory: NAVHistory = createInitialNAVHistory();
    const { investment } = purchaseUnits(10_000_000, 'LIQUID', 5_000_000, 0, STARTING_NAV_PAISE);
    const cashAfter = 10_000_000 - 5_000_000;
    expect(netWorth(cashAfter, [investment], navHistory, 0)).toBe(
      cashAfter + portfolioValue([investment], navHistory, 0),
    );
  });

  it('buildPortfolio aggregates per fund', () => {
    const a = purchaseUnits(20_000_000, 'LIQUID', 5_000_000, 0, STARTING_NAV_PAISE).investment;
    const b = purchaseUnits(20_000_000, 'LIQUID', 5_000_000, 0, STARTING_NAV_PAISE).investment;
    const port = buildPortfolio([a, b]);
    expect(port).toHaveLength(1);
    expect(port[0]?.totalUnits).toBe(10_000);
  });
});
