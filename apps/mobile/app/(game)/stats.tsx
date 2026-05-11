import { formatINRCompact } from '@corpus-quest/shared';
import { ScrollView, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Card, Row, Screen, Txt } from '../../src/components/primitives';
import { selectNetWorth, selectPortfolioValue } from '../../src/selectors';
import { useAppStore } from '../../src/store';
import { colors, spacing } from '../../src/theme';

export default function Stats() {
  const state = useAppStore((s) => s.state);
  if (!state) return null;

  const nw = selectNetWorth(state);
  const portfolioValue = selectPortfolioValue(state);
  const monthlySpend = state.committedEMIs.reduce((acc, e) => acc + e.monthlyAmount, 0);
  const monthlySIP = state.sips
    .filter((s) => s.active)
    .reduce((acc, s) => acc + s.monthlyAmount, 0);
  const savings = state.salary - monthlySpend - monthlySIP;
  const savingsRate = state.salary > 0 ? (savings / state.salary) * 100 : 0;
  const happinessAvg =
    state.happinessLog.length === 0
      ? state.dependents.reduce((a, d) => a + d.happiness, 0) /
        Math.max(1, state.dependents.length)
      : state.happinessLog[state.happinessLog.length - 1]?.average ?? 0;

  return (
    <Screen>
      <ScrollView>
        <ExplainButton screen="stats" />

        <Card>
          <Txt variant="caption">RUN SUMMARY</Txt>
          <Row style={{ marginTop: spacing.md }}>
            <Txt variant="caption">Net worth</Txt>
            <Txt variant="number">{formatINRCompact(nw)}</Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Portfolio value</Txt>
            <Txt variant="number">{formatINRCompact(portfolioValue)}</Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Cash</Txt>
            <Txt variant="number">{formatINRCompact(state.cash)}</Txt>
          </Row>
        </Card>

        <Card>
          <Txt variant="caption">MONTHLY FLOW</Txt>
          <Row style={{ marginTop: spacing.md }}>
            <Txt variant="caption">Salary</Txt>
            <Txt variant="number" style={{ color: colors.positive }}>
              +{formatINRCompact(state.salary)}
            </Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">EMIs / rent</Txt>
            <Txt variant="number" style={{ color: colors.negative }}>
              -{formatINRCompact(monthlySpend)}
            </Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Active SIPs</Txt>
            <Txt variant="number" style={{ color: colors.negative }}>
              -{formatINRCompact(monthlySIP)}
            </Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Net savings</Txt>
            <Txt
              variant="number"
              style={{ color: savings >= 0 ? colors.positive : colors.negative }}
            >
              {savings >= 0 ? '+' : ''}
              {formatINRCompact(savings)}
            </Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Savings rate</Txt>
            <Txt variant="number">{savingsRate.toFixed(1)}%</Txt>
          </Row>
        </Card>

        <Card>
          <Txt variant="caption">HAPPINESS LEGACY</Txt>
          <Row style={{ marginTop: spacing.md }}>
            <Txt variant="caption">Latest avg</Txt>
            <Txt variant="number">{Math.round(happinessAvg / 100)} / 100</Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Months tracked</Txt>
            <Txt variant="number">{state.happinessLog.length}</Txt>
          </Row>
        </Card>

        <Sparkline />
      </ScrollView>
    </Screen>
  );
}

function Sparkline() {
  const log = useAppStore((s) => s.state?.happinessLog ?? []);
  if (log.length < 2) return null;
  const values = log.map((l) => l.average);
  const max = Math.max(...values, 1);
  return (
    <Card>
      <Txt variant="caption">HAPPINESS OVER TIME</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, marginTop: spacing.sm }}>
        {values.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              marginHorizontal: 1,
              height: `${(v / max) * 100}%`,
              backgroundColor: colors.primary,
              opacity: 0.6,
            }}
          />
        ))}
      </View>
    </Card>
  );
}
