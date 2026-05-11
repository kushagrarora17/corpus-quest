import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export function Screen({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <View style={[styles.screen, style]} {...rest}>
      {children}
    </View>
  );
}

export function Card({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Row({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <View style={[styles.row, style]} {...rest}>
      {children}
    </View>
  );
}

type Variant = keyof typeof typography;

export function Txt({
  variant = 'body',
  style,
  children,
  ...rest
}: TextProps & { variant?: Variant; children: ReactNode }) {
  return (
    <Text style={[typography[variant] as TextStyle, style]} {...rest}>
      {children}
    </Text>
  );
}

export interface BtnProps extends PressableProps {
  label: string;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}

export function Btn({ label, tone = 'primary', disabled, style, ...rest }: BtnProps) {
  const toneStyle =
    tone === 'primary'
      ? { backgroundColor: colors.primary }
      : tone === 'danger'
        ? { backgroundColor: colors.negative }
        : { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 };
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        toneStyle,
        pressed && !disabled ? { opacity: 0.85 } : null,
        disabled ? { opacity: 0.4 } : null,
        typeof style === 'function' ? undefined : style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.btnLabel, tone === 'ghost' ? { color: colors.text } : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Pill({ children, tint = colors.primary }: { children: ReactNode; tint?: string }) {
  return (
    <View style={[styles.pill, { borderColor: tint }]}>
      <Text style={[styles.pillLabel, { color: tint }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
