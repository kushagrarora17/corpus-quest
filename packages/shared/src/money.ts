import { PAISE_PER_RUPEE } from './constants.js';

/**
 * Monetary helpers. The single rule: **all internal math is paise (integer)**.
 * Floating-point INR is only ever used at the display boundary or when reading
 * user input. Calls into these helpers are the only place where the conversion
 * is allowed.
 */

/**
 * Convert paise → INR (rupees, possibly fractional).
 * @example toINR(100)        // → 1
 * @example toINR(150)        // → 1.5
 * @example toINR(10_000_000) // → 100000
 */
export function toINR(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new RangeError(`toINR: expected a finite number, got ${paise}`);
  }
  return paise / PAISE_PER_RUPEE;
}

/**
 * Convert INR (rupees) → paise (integer). Rounds to the nearest paise to
 * eliminate floating-point dust accumulating from user input.
 *
 * @example toPaise(1)    // → 100
 * @example toPaise(1.5)  // → 150
 * @example toPaise(0.01) // → 1
 */
export function toPaise(inr: number): number {
  if (!Number.isFinite(inr)) {
    throw new RangeError(`toPaise: expected a finite number, got ${inr}`);
  }
  return Math.round(inr * PAISE_PER_RUPEE);
}

/**
 * Format paise as an Indian-numbered rupee string, e.g. `₹1,00,000` or
 * `₹1,23,45,678.90`. Uses the lakh/crore comma convention (last three digits
 * grouped, then groups of two).
 *
 * @example formatINR(10_000_000)  // → '₹1,00,000'
 * @example formatINR(123_45_67_890) // → '₹1,23,45,678.90'
 * @example formatINR(-50_000)     // → '-₹500'
 */
export function formatINR(paise: number): string {
  if (!Number.isFinite(paise)) {
    throw new RangeError(`formatINR: expected a finite number, got ${paise}`);
  }

  const isNegative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / PAISE_PER_RUPEE);
  const remainder = abs - rupees * PAISE_PER_RUPEE;

  const integerPart = formatIndianGrouping(rupees);
  const fractional = remainder > 0 ? `.${remainder.toString().padStart(2, '0')}` : '';

  return `${isNegative ? '-' : ''}₹${integerPart}${fractional}`;
}

/**
 * Compact format using the Indian "L" / "Cr" suffixes — useful when HUD space
 * is tight. Falls back to {@link formatINR} below the lakh threshold.
 *
 * @example formatINRCompact(10_000_000)        // → '₹1,00,000'
 * @example formatINRCompact(1_00_000_00)       // → '₹1.00 L'
 * @example formatINRCompact(5_00_00_000_00)    // → '₹5.00 Cr'
 */
export function formatINRCompact(paise: number, fractionDigits = 2): string {
  if (!Number.isFinite(paise)) {
    throw new RangeError(`formatINRCompact: expected a finite number, got ${paise}`);
  }
  const isNegative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = abs / PAISE_PER_RUPEE;
  const sign = isNegative ? '-' : '';

  if (rupees >= 1_00_00_000) {
    return `${sign}₹${(rupees / 1_00_00_000).toFixed(fractionDigits)} Cr`;
  }
  if (rupees >= 1_00_000) {
    return `${sign}₹${(rupees / 1_00_000).toFixed(fractionDigits)} L`;
  }
  return formatINR(paise);
}

/**
 * Apply the Indian digit-grouping convention to a non-negative integer.
 * Examples: 100 → '100', 1000 → '1,000', 100000 → '1,00,000',
 * 12345678 → '1,23,45,678'.
 */
function formatIndianGrouping(n: number): string {
  const s = Math.trunc(n).toString();
  if (s.length <= 3) return s;

  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  // Group `rest` from the right in pairs of 2.
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${grouped},${last3}`;
}
