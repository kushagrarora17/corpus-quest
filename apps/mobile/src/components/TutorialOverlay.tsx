import { Modal, StyleSheet, View } from 'react-native';

import { useAppStore } from '../store';
import { colors, radius, spacing } from '../theme';

import { Btn, Txt } from './primitives';

const STEPS = [
  {
    title: 'Welcome to Corpus Quest',
    body: 'You are 22, fresh out of college. Over 38 in-game years you will earn, invest, and survive emergencies. Your net worth and happiness at 60 decide your legacy.',
  },
  {
    title: 'The HUD',
    body: 'Net worth, cash, age, and family happiness are always on top of the screen. The market pulse chip tells you the current regime.',
  },
  {
    title: 'Invest early',
    body: 'Start an SIP into a Hybrid or Large Cap fund. Compounding does more from age 22 than from age 35 — by a lot.',
  },
  {
    title: 'Mind happiness',
    body: 'Each dependent decays in happiness every month. Below 20 forces you to spend before advancing. Plan vacations, gifts, and care.',
  },
  {
    title: 'Lock-in is real',
    body: 'Withdrawing within 12 months of an investment costs 0.5%–5% depending on fund type. Keep a Liquid buffer for emergencies.',
  },
];

export function TutorialOverlay() {
  const step = useAppStore((s) => s.tutorialOverlay);
  const set = useAppStore((s) => s.setTutorialOverlay);
  if (step === null || step >= STEPS.length) return null;
  const entry = STEPS[step];
  if (!entry) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => set(null)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Txt variant="caption">TUTORIAL · STEP {step + 1} / {STEPS.length}</Txt>
          <Txt variant="title" style={{ marginTop: spacing.sm }}>
            {entry.title}
          </Txt>
          <Txt style={{ marginTop: spacing.md }}>{entry.body}</Txt>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <View style={{ flex: 1 }}>
              <Btn
                label={step === 0 ? 'Skip' : 'Back'}
                tone="ghost"
                onPress={() => (step === 0 ? set(null) : set(step - 1))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Btn
                label={step === STEPS.length - 1 ? 'Start playing' : 'Next'}
                onPress={() => (step === STEPS.length - 1 ? set(null) : set(step + 1))}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0007',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1,
    width: '100%',
    maxWidth: 420,
  },
});
