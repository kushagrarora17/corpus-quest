/**
 * Visual design tokens (SystemDesign §7.2). Single source of truth for colours,
 * spacing, and typography. Anything that hard-codes a hex elsewhere is a bug.
 */

export const colors = {
  bg: '#0B1220',
  surface: '#121C2E',
  surfaceAlt: '#1A2540',
  border: '#243454',
  text: '#E6ECF7',
  textMuted: '#8895AE',
  primary: '#4F8CFF',
  positive: '#3DDC97',
  negative: '#FF5C7A',
  warning: '#FFB547',
  info: '#4F8CFF',
  happinessHigh: '#3DDC97',
  happinessMid: '#FFB547',
  happinessLow: '#FF5C7A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  number: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
} as const;

export function happinessColor(value: number): string {
  if (value >= 6000) return colors.happinessHigh;
  if (value >= 3000) return colors.happinessMid;
  return colors.happinessLow;
}
