import { formatINRCompact } from '@corpus-quest/shared';
import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Btn, Card, Row, Screen, Txt } from '../../src/components/primitives';
import { useAppStore } from '../../src/store';
import { spacing } from '../../src/theme';

export default function Dashboard() {
  const state = useAppStore((s) => s.state);
  const requiresInput = useAppStore((s) => s.requiresInput);
  const advance = useAppStore((s) => s.advanceTurn);

  if (!state) return null;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Home' }} />
      <ScrollView>
        <ExplainButton screen="dashboard" />
        <Card>
          <Txt variant="caption">THIS MONTH</Txt>
          <Txt variant="title" style={{ marginTop: spacing.xs }}>
            Month {state.month + 1} / 456
          </Txt>
          <Row style={{ marginTop: spacing.md }}>
            <Txt variant="caption">Salary</Txt>
            <Txt variant="number">{formatINRCompact(state.salary)}/mo</Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Active SIPs</Txt>
            <Txt variant="number">{state.sips.filter((s) => s.active).length}</Txt>
          </Row>
          <Row style={{ marginTop: spacing.sm }}>
            <Txt variant="caption">Investments</Txt>
            <Txt variant="number">{state.investments.length}</Txt>
          </Row>
        </Card>

        {state.pendingEvent ? (
          <Card>
            <Txt variant="caption">PENDING EVENT</Txt>
            <Txt variant="title" style={{ marginTop: spacing.sm }}>
              {prettyEvent(state.pendingEvent.templateId)}
            </Txt>
            <Txt variant="caption" style={{ marginTop: spacing.xs }}>
              Resolve it on the Events tab to advance time.
            </Txt>
          </Card>
        ) : null}

        <View style={{ marginTop: spacing.md }}>
          <Btn
            label={requiresInput ? 'Resolve before advancing' : 'Advance month →'}
            onPress={() => advance()}
            disabled={requiresInput}
          />
        </View>

        <FastForwardCard />
      </ScrollView>
    </Screen>
  );
}

function FastForwardCard() {
  const requiresInput = useAppStore((s) => s.requiresInput);
  const state = useAppStore((s) => s.state);
  const advance = useAppStore((s) => s.advanceTurn);

  if (!state) return null;

  const remaining = 456 - state.month;
  if (remaining <= 0) return null;

  return (
    <Card>
      <Txt variant="caption">FAST FORWARD (DEV)</Txt>
      <Txt variant="caption" style={{ marginTop: spacing.xs }}>
        Auto-advance until input is required or the run completes.
      </Txt>
      <View style={{ marginTop: spacing.md }}>
        <Btn
          label="Fast-forward to next decision"
          tone="ghost"
          disabled={requiresInput}
          onPress={() => {
            for (let i = 0; i < remaining; i++) {
              advance();
              const after = useAppStore.getState();
              if (after.requiresInput || after.state?.isComplete) break;
            }
          }}
        />
      </View>
    </Card>
  );
}

function prettyEvent(id: string): string {
  return id
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}
