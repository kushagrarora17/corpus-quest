import { type FundType, FUND_CONFIG } from '@corpus-quest/game-engine';
import { formatINRCompact, toPaise } from '@corpus-quest/shared';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Btn, Card, Row, Screen, Txt } from '../../src/components/primitives';
import { fundShortName } from '../../src/selectors';
import { useAppStore } from '../../src/store';
import { colors, radius, spacing } from '../../src/theme';

const FUNDS: FundType[] = ['LIQUID', 'DEBT', 'HYBRID', 'LARGE_CAP', 'SMALL_MID_CAP'];

const RISK: Record<FundType, string> = {
  LIQUID: 'Very Low',
  DEBT: 'Low',
  HYBRID: 'Medium',
  LARGE_CAP: 'Medium-High',
  SMALL_MID_CAP: 'High',
};

export default function Invest() {
  const cash = useAppStore((s) => s.state?.cash ?? 0);
  const applyAction = useAppStore((s) => s.applyAction);
  const [fund, setFund] = useState<FundType>('HYBRID');
  const [mode, setMode] = useState<'SIP' | 'LUMPSUM'>('SIP');
  const [amount, setAmount] = useState('5000');

  const numeric = Number(amount);
  const paise = Number.isFinite(numeric) && numeric > 0 ? toPaise(numeric) : 0;
  const isLumpsumOverBalance = mode === 'LUMPSUM' && paise > cash;

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ExplainButton screen="invest" />

        <Card>
          <Txt variant="caption">PICK A FUND</Txt>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {FUNDS.map((f) => {
              const cfg = FUND_CONFIG[f];
              const active = f === fund;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFund(f)}
                  style={[
                    styles.fundCard,
                    { borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  <Row>
                    <Txt variant="body">{fundShortName(f)}</Txt>
                    <Txt variant="caption">{RISK[f]}</Txt>
                  </Row>
                  <Row style={{ marginTop: spacing.xs }}>
                    <Txt variant="caption">
                      ~{Math.round(cfg.baseAnnualReturn * 1000) / 10}% p.a.
                    </Txt>
                    <Txt variant="caption">Penalty {Math.round(cfg.penaltyRate * 100)}%</Txt>
                  </Row>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Txt variant="caption">MODE</Txt>
          <Row style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Btn
                label="SIP (monthly)"
                tone={mode === 'SIP' ? 'primary' : 'ghost'}
                onPress={() => setMode('SIP')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Btn
                label="Lumpsum"
                tone={mode === 'LUMPSUM' ? 'primary' : 'ghost'}
                onPress={() => setMode('LUMPSUM')}
              />
            </View>
          </Row>
        </Card>

        <Card>
          <Txt variant="caption">AMOUNT (₹)</Txt>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="5000"
            placeholderTextColor={colors.textMuted}
          />
          <Txt variant="caption" style={{ marginTop: spacing.xs }}>
            {mode === 'SIP'
              ? `${formatINRCompact(paise)} will deduct every month.`
              : `One-time ${formatINRCompact(paise)} into ${fundShortName(fund)}.`}
          </Txt>
          {isLumpsumOverBalance ? (
            <Txt variant="caption" style={{ color: colors.negative, marginTop: spacing.xs }}>
              Insufficient cash · available {formatINRCompact(cash)}
            </Txt>
          ) : null}
        </Card>

        <View>
          <Btn
            label={mode === 'SIP' ? 'Start SIP' : 'Invest lumpsum'}
            disabled={paise <= 0 || isLumpsumOverBalance}
            onPress={() => {
              if (mode === 'SIP') {
                applyAction({ kind: 'INVEST_SIP', fundType: fund, monthlyAmount: paise });
              } else {
                applyAction({ kind: 'INVEST_LUMPSUM', fundType: fund, amountPaise: paise });
              }
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fundCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  input: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '700',
  },
});
