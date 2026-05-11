import {
  type FundType,
  LOCK_IN_MONTHS,
  PENALTY_RATES,
  buildPortfolio,
  currentNAV,
} from '@corpus-quest/game-engine';
import { formatINRCompact } from '@corpus-quest/shared';
import { ScrollView, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Btn, Card, Pill, Row, Screen, Txt } from '../../src/components/primitives';
import { fundShortName } from '../../src/selectors';
import { useAppStore } from '../../src/store';
import { colors, spacing } from '../../src/theme';

export default function Portfolio() {
  const state = useAppStore((s) => s.state);
  const applyAction = useAppStore((s) => s.applyAction);

  if (!state) return null;

  const portfolio = state.portfolio.length ? state.portfolio : buildPortfolio(state.investments);

  return (
    <Screen>
      <ScrollView>
        <ExplainButton screen="portfolio" />

        <Card>
          <Txt variant="caption">HOLDINGS BY FUND</Txt>
          {portfolio.length === 0 ? (
            <Txt variant="caption" style={{ marginTop: spacing.sm }}>
              You haven't invested yet. Try an SIP on the Invest tab.
            </Txt>
          ) : (
            portfolio.map((p) => {
              const nav = currentNAV(state.navHistory, p.fundType, state.month);
              const value = Math.floor(p.totalUnits * nav);
              const pnl = value - p.totalCostPaise;
              return (
                <Row key={p.fundType} style={{ marginTop: spacing.md }}>
                  <View>
                    <Txt variant="body">{fundShortName(p.fundType)}</Txt>
                    <Txt variant="caption">{p.totalUnits.toFixed(2)} units</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="number">{formatINRCompact(value)}</Txt>
                    <Txt
                      variant="caption"
                      style={{ color: pnl >= 0 ? colors.positive : colors.negative }}
                    >
                      {pnl >= 0 ? '▲' : '▼'} {formatINRCompact(Math.abs(pnl))}
                    </Txt>
                  </View>
                </Row>
              );
            })
          )}
        </Card>

        <Card>
          <Txt variant="caption">INVESTMENT LOTS</Txt>
          {state.investments.length === 0 ? (
            <Txt variant="caption" style={{ marginTop: spacing.sm }}>
              No active lots.
            </Txt>
          ) : (
            state.investments.map((inv) => {
              const locked = state.month < inv.lockInExpiryMonth;
              const lockedFor = inv.lockInExpiryMonth - state.month;
              return (
                <View key={inv.id} style={{ marginTop: spacing.md }}>
                  <Row>
                    <Txt variant="body">
                      {fundShortName(inv.fundType as FundType)} · {inv.type}
                    </Txt>
                    <Pill tint={locked ? colors.warning : colors.positive}>
                      {locked ? `Locked ${lockedFor}m` : 'Withdrawable'}
                    </Pill>
                  </Row>
                  <Row style={{ marginTop: spacing.xs }}>
                    <Txt variant="caption">
                      {inv.unitsPurchased.toFixed(2)} units @ {formatINRCompact(inv.navAtPurchase)}
                    </Txt>
                    <Txt variant="caption">
                      Penalty {Math.round(PENALTY_RATES[inv.fundType as FundType] * 100)}%
                    </Txt>
                  </Row>
                  <View style={{ marginTop: spacing.sm }}>
                    <Btn
                      label={locked ? 'Withdraw (with penalty)' : 'Withdraw'}
                      tone="ghost"
                      onPress={() => applyAction({ kind: 'WITHDRAW', investmentId: inv.id })}
                    />
                  </View>
                </View>
              );
            })
          )}
          <Txt variant="caption" style={{ marginTop: spacing.md }}>
            Lock-in window: {LOCK_IN_MONTHS} months from purchase.
          </Txt>
        </Card>

        <Card>
          <Txt variant="caption">ACTIVE SIPs</Txt>
          {state.sips.length === 0 ? (
            <Txt variant="caption" style={{ marginTop: spacing.sm }}>
              No SIPs configured.
            </Txt>
          ) : (
            state.sips.map((sip) => (
              <Row key={sip.id} style={{ marginTop: spacing.md }}>
                <View>
                  <Txt variant="body">{fundShortName(sip.fundType)}</Txt>
                  <Txt variant="caption">{formatINRCompact(sip.monthlyAmount)}/mo</Txt>
                </View>
                <Btn
                  label={sip.active ? 'Pause' : 'Resume'}
                  tone="ghost"
                  onPress={() =>
                    applyAction({ kind: 'SET_SIP', sipId: sip.id, active: !sip.active })
                  }
                />
              </Row>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
