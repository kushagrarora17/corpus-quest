import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { GLOSSARY } from '../data/glossary';
import { useAppStore } from '../store';
import { colors, radius, spacing } from '../theme';

import { Btn, Txt } from './primitives';

export function GlossarySheet() {
  const open = useAppStore((s) => s.glossaryOpen);
  const term = useAppStore((s) => s.glossaryTerm);
  const close = useAppStore((s) => s.closeGlossary);

  if (!open) return null;
  const entry = term ? GLOSSARY[term] : null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={close}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Txt variant="caption">EXPLAIN THIS</Txt>
          {entry ? (
            <>
              <Txt variant="title" style={{ marginTop: spacing.sm }}>
                {entry.term}
              </Txt>
              <Txt style={{ marginTop: spacing.sm }}>{entry.shortDef}</Txt>
              <Txt variant="caption" style={{ marginTop: spacing.md }}>
                EXAMPLE
              </Txt>
              <Txt style={{ marginTop: spacing.xs }}>{entry.example}</Txt>
            </>
          ) : (
            <Txt style={{ marginTop: spacing.md }}>Pick a term from any screen.</Txt>
          )}
          <View style={{ marginTop: spacing.xl }}>
            <Btn label="Close" tone="ghost" onPress={close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});
