import { HAPPINESS_MAX } from '@corpus-quest/game-engine';
import { formatINRCompact, toPaise } from '@corpus-quest/shared';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Btn, Card, Row, Screen, Txt } from '../../src/components/primitives';
import { useAppStore } from '../../src/store';
import { colors, happinessColor, radius, spacing } from '../../src/theme';

const BOOST_OPTIONS = [
  { label: 'Small treat (₹1,000)', amount: toPaise(1_000) },
  { label: 'Outing (₹5,000)', amount: toPaise(5_000) },
  { label: 'Vacation (₹25,000)', amount: toPaise(25_000) },
];

export default function Family() {
  const state = useAppStore((s) => s.state);
  const applyAction = useAppStore((s) => s.applyAction);

  if (!state) return null;

  return (
    <Screen>
      <ScrollView>
        <ExplainButton screen="family" />
        {state.dependents.map((d) => {
          const pct = d.happiness / HAPPINESS_MAX;
          const tint = happinessColor(d.happiness);
          return (
            <Card key={d.id}>
              <Row>
                <Txt variant="title">{d.name}</Txt>
                <Txt variant="caption">{d.type}</Txt>
              </Row>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max(2, pct * 100)}%`, backgroundColor: tint },
                  ]}
                />
              </View>
              <Row style={{ marginTop: spacing.xs }}>
                <Txt variant="caption">{Math.round(d.happiness / 100)} / 100</Txt>
                {d.happiness < 2000 ? (
                  <Txt variant="caption" style={{ color: colors.negative }}>
                    Below threshold — spend to unblock
                  </Txt>
                ) : null}
              </Row>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {BOOST_OPTIONS.map((opt) => (
                  <Btn
                    key={opt.label}
                    label={opt.label}
                    tone="ghost"
                    onPress={() =>
                      applyAction({
                        kind: 'HAPPINESS_SPEND',
                        dependentId: d.id,
                        amountPaise: opt.amount,
                      })
                    }
                  />
                ))}
                <Txt variant="caption">Cash on hand: {formatINRCompact(state.cash)}</Txt>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
