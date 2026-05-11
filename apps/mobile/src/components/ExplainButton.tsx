import { Pressable, StyleSheet } from 'react-native';

import { SCREEN_DEFAULT_TERM } from '../data/glossary';
import { useAppStore } from '../store';
import { colors, radius, spacing } from '../theme';

import { Txt } from './primitives';

export function ExplainButton({ screen }: { screen: keyof typeof SCREEN_DEFAULT_TERM }) {
  const open = useAppStore((s) => s.openGlossary);
  return (
    <Pressable
      onPress={() => open(SCREEN_DEFAULT_TERM[screen])}
      style={({ pressed }) => [styles.btn, pressed ? { opacity: 0.7 } : null]}
      accessibilityLabel="Explain this screen"
      accessibilityRole="button"
    >
      <Txt variant="caption">? EXPLAIN</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
});
