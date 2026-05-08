import { describe, expect, it } from 'vitest';

import { formatINR, formatINRCompact, toINR, toPaise } from '../src/money.js';

describe('toINR', () => {
  it('converts paise to whole rupees', () => {
    expect(toINR(100)).toBe(1);
  });

  it('preserves the fractional rupee', () => {
    expect(toINR(150)).toBe(1.5);
    expect(toINR(1)).toBe(0.01);
  });

  it('handles zero', () => {
    expect(toINR(0)).toBe(0);
  });

  it('handles negative balances', () => {
    expect(toINR(-2500)).toBe(-25);
  });

  it('throws on non-finite input', () => {
    expect(() => toINR(Number.NaN)).toThrow(RangeError);
    expect(() => toINR(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('toPaise', () => {
  it('converts whole rupees to paise', () => {
    expect(toPaise(1)).toBe(100);
    expect(toPaise(50_000)).toBe(50_00_000);
  });

  it('rounds away floating-point dust', () => {
    // 0.1 + 0.2 = 0.30000000000000004 — must still round cleanly to 30 paise.
    expect(toPaise(0.1 + 0.2)).toBe(30);
  });

  it('rounds to the nearest paise', () => {
    expect(toPaise(0.005)).toBe(1); // round-half-away-from-zero (Math.round)
    expect(toPaise(0.014)).toBe(1);
    expect(toPaise(0.016)).toBe(2);
  });

  it('throws on non-finite input', () => {
    expect(() => toPaise(Number.NaN)).toThrow(RangeError);
  });
});

describe('formatINR — Indian digit grouping', () => {
  it('formats 1 lakh exactly per the validation requirement', () => {
    // 10,000,000 paise = 100,000 INR = 1 Lakh
    expect(formatINR(10_000_000)).toBe('₹1,00,000');
  });

  it('formats values below 1000 without commas', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(50_000)).toBe('₹500');
    expect(formatINR(99_900)).toBe('₹999');
  });

  it('inserts the first comma at the thousands place', () => {
    expect(formatINR(1_00_000)).toBe('₹1,000');
    expect(formatINR(99_99_900)).toBe('₹99,999');
  });

  it('groups higher digits in pairs of two (lakh / crore)', () => {
    // 1,23,45,678 INR = 1.2 crore
    expect(formatINR(123_45_67_800)).toBe('₹1,23,45,678');
    // 5 crore = ₹5,00,00,000 = 5_00_00_000_00 paise (10 digits)
    expect(formatINR(5_00_00_000_00)).toBe('₹5,00,00,000');
  });

  it('emits the paise as two decimal places when non-zero', () => {
    expect(formatINR(150)).toBe('₹1.50');
    expect(formatINR(101)).toBe('₹1.01');
    expect(formatINR(1_00_001)).toBe('₹1,000.01');
  });

  it('handles negative amounts', () => {
    expect(formatINR(-50_000)).toBe('-₹500');
    expect(formatINR(-10_000_000)).toBe('-₹1,00,000');
  });

  it('throws on non-finite input', () => {
    expect(() => formatINR(Number.NaN)).toThrow(RangeError);
  });
});

describe('formatINRCompact', () => {
  it('uses full Indian grouping below 1 Lakh', () => {
    // 9,999,900 paise = ₹99,999 (just under 1 Lakh)
    expect(formatINRCompact(9_999_900)).toBe('₹99,999');
  });

  it('switches to "L" suffix from 1 Lakh up to 1 Crore', () => {
    // 5 Lakh = 5_00_000 INR = 5_00_000_00 paise
    expect(formatINRCompact(5_00_000_00)).toBe('₹5.00 L');
  });

  it('switches to "Cr" suffix at 1 Crore and above', () => {
    // 5 Cr = ₹5,00,00,000 = 5_00_00_000_00 paise
    expect(formatINRCompact(5_00_00_000_00)).toBe('₹5.00 Cr');
  });
});

describe('round-trip toPaise → toINR', () => {
  it('preserves any number of rupees', () => {
    for (const inr of [0, 1, 100, 12345, 99_99_999]) {
      expect(toINR(toPaise(inr))).toBe(inr);
    }
  });
});
