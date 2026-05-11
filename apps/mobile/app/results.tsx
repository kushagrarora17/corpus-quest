import { type ScoreTier } from '@corpus-quest/game-engine';
import { formatINRCompact } from '@corpus-quest/shared';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Card, Row, Screen, Txt } from '../src/components/primitives';
import { selectNetWorth } from '../src/selectors';
import { useAppStore } from '../src/store';
import { colors, spacing } from '../src/theme';

const TIER_TITLES: Record<ScoreTier, string> = {
  S: 'Corpus Legend',
  A: 'Wealthy & Wise',
  B: 'Comfortable Achiever',
  C: 'The Survivor',
  D: 'The Hard Lesson',
};

const TIER_TINT: Record<ScoreTier, string> = {
  S: colors.positive,
  A: colors.primary,
  B: colors.info,
  C: colors.warning,
  D: colors.negative,
};

export default function Results() {
  const router = useRouter();
  const state = useAppStore((s) => s.state);
  const endRun = useAppStore((s) => s.endRun);

  if (!state) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Screen>
          <Txt variant="title">No run loaded.</Txt>
          <Btn label="New game" onPress={() => router.replace('/new-game')} />
        </Screen>
      </SafeAreaView>
    );
  }

  const score = state.finalScore ?? 0;
  const tier = state.finalTier ?? 'D';
  const nw = selectNetWorth(state);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        <ScrollView>
          <Txt variant="caption">THE VERDICT</Txt>
          <Txt variant="display" style={{ color: TIER_TINT[tier], marginTop: spacing.sm }}>
            {tier} · {score}/100
          </Txt>
          <Txt variant="title" style={{ marginTop: spacing.xs }}>
            {TIER_TITLES[tier]}
          </Txt>

          <Card>
            <Row>
              <Txt variant="caption">Final net worth</Txt>
              <Txt variant="number">{formatINRCompact(nw)}</Txt>
            </Row>
            <Row style={{ marginTop: spacing.sm }}>
              <Txt variant="caption">Cash</Txt>
              <Txt variant="number">{formatINRCompact(state.cash)}</Txt>
            </Row>
            <Row style={{ marginTop: spacing.sm }}>
              <Txt variant="caption">Portfolio</Txt>
              <Txt variant="number">{formatINRCompact(nw - state.cash)}</Txt>
            </Row>
            <Row style={{ marginTop: spacing.sm }}>
              <Txt variant="caption">Months played</Txt>
              <Txt variant="number">{state.month}</Txt>
            </Row>
          </Card>

          <Card>
            <Txt variant="caption">HAPPINESS LEGACY</Txt>
            {state.dependents.map((d) => (
              <Row key={d.id} style={{ marginTop: spacing.sm }}>
                <Txt variant="caption">{d.name}</Txt>
                <Txt variant="number">{Math.round(d.happiness / 100)}</Txt>
              </Row>
            ))}
          </Card>

          <View style={{ gap: spacing.sm }}>
            <Btn
              label="Replay"
              onPress={() => {
                endRun();
                router.replace('/new-game');
              }}
            />
            <Btn
              label="See run history"
              tone="ghost"
              onPress={() => router.replace('/run-history')}
            />
          </View>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
