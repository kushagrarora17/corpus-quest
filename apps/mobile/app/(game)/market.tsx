import { type FundType, currentNAV } from '@corpus-quest/game-engine';
import { ScrollView, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Card, Pill, Row, Screen, Txt } from '../../src/components/primitives';
import { fundShortName } from '../../src/selectors';
import { useAppStore } from '../../src/store';
import { colors, spacing } from '../../src/theme';

const FUNDS: FundType[] = ['LIQUID', 'DEBT', 'HYBRID', 'LARGE_CAP', 'SMALL_MID_CAP'];

const REGIME_TINT: Record<string, string> = {
  BULL: colors.positive,
  BEAR: colors.negative,
  VOLATILE: colors.warning,
  STEADY: colors.info,
};

export default function Market() {
  const state = useAppStore((s) => s.state);
  if (!state) return null;

  return (
    <Screen>
      <ScrollView>
        <ExplainButton screen="market" />

        <Card>
          <Row>
            <Txt variant="caption">MARKET REGIME</Txt>
            <Pill tint={REGIME_TINT[state.marketState.regime] ?? colors.info}>
              {state.marketState.regime}
            </Pill>
          </Row>
          {state.marketState.activeEvents.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Txt variant="caption">ACTIVE EVENTS</Txt>
              {state.marketState.activeEvents.map((e, i) => (
                <Txt key={i} variant="body" style={{ marginTop: spacing.xs }}>
                  · {prettyEvent(e.type)} (m{e.startMonth + 1} +{e.durationMonths})
                </Txt>
              ))}
            </View>
          ) : (
            <Txt variant="caption" style={{ marginTop: spacing.md }}>
              No headline event. Compounding works silently.
            </Txt>
          )}
        </Card>

        <Card>
          <Txt variant="caption">FUND PERFORMANCE</Txt>
          {FUNDS.map((f) => {
            const history = state.navHistory[f];
            const current = currentNAV(state.navHistory, f, state.month);
            const monthAgo = history[Math.max(0, history.length - 2)] ?? current;
            const yearAgo = history[Math.max(0, history.length - 13)] ?? current;
            const monthlyPct = pctChange(monthAgo, current);
            const yearlyPct = pctChange(yearAgo, current);
            return (
              <Row key={f} style={{ marginTop: spacing.md }}>
                <View>
                  <Txt variant="body">{fundShortName(f)}</Txt>
                  <Txt variant="caption">NAV {(current / 100).toFixed(2)}</Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt
                    variant="number"
                    style={{ color: monthlyPct >= 0 ? colors.positive : colors.negative }}
                  >
                    {fmtPct(monthlyPct)} 1m
                  </Txt>
                  <Txt
                    variant="caption"
                    style={{ color: yearlyPct >= 0 ? colors.positive : colors.negative }}
                  >
                    {fmtPct(yearlyPct)} 1y
                  </Txt>
                </View>
              </Row>
            );
          })}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function pctChange(from: number, to: number): number {
  if (!from) return 0;
  return ((to - from) / from) * 100;
}

function fmtPct(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function prettyEvent(id: string): string {
  return id
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}
