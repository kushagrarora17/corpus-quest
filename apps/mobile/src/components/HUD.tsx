import { formatINRCompact } from '@corpus-quest/shared';
import { StyleSheet, View } from 'react-native';

import { selectHud } from '../selectors';
import { useAppStore } from '../store';
import { colors, happinessColor, radius, spacing } from '../theme';

import { Pill, Row, Txt } from './primitives';

const REGIME_TINT: Record<string, string> = {
  BULL: colors.positive,
  BEAR: colors.negative,
  VOLATILE: colors.warning,
  STEADY: colors.info,
};

export function HUD() {
  const hud = useAppStore(selectHud);
  if (!hud) return null;

  return (
    <View style={styles.hud}>
      <Row>
        <View>
          <Txt variant="caption">NET WORTH</Txt>
          <Txt variant="display">{formatINRCompact(hud.netWorth)}</Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="caption">CASH</Txt>
          <Txt variant="title">{formatINRCompact(hud.cash)}</Txt>
        </View>
      </Row>

      <Row style={{ marginTop: spacing.md }}>
        <Txt variant="caption">
          AGE {hud.age.years}y {hud.age.months}m
        </Txt>
        <Pill tint={REGIME_TINT[hud.regime] ?? colors.info}>{hud.regime}</Pill>
      </Row>

      <Row style={{ marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {hud.dependents.slice(0, 5).map((d) => (
            <View
              key={d.id}
              style={[
                styles.dot,
                {
                  backgroundColor: happinessColor(d.happiness),
                  opacity: d.happiness < 2000 ? 1 : 0.85,
                },
              ]}
              accessibilityLabel={`${d.name} happiness ${Math.round(d.happiness / 100)}`}
            />
          ))}
        </View>
        {hud.upcoming[0] ? (
          <Txt variant="caption">Next: {formatINRCompact(hud.upcoming[0].amount)}</Txt>
        ) : (
          <Txt variant="caption">No upcoming bills</Txt>
        )}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
  },
});
