import { ScrollView, View } from 'react-native';

import { ExplainButton } from '../../src/components/ExplainButton';
import { Btn, Card, Row, Screen, Txt } from '../../src/components/primitives';
import { useAppStore } from '../../src/store';
import { colors, spacing } from '../../src/theme';

export default function Events() {
  const state = useAppStore((s) => s.state);
  const applyAction = useAppStore((s) => s.applyAction);

  if (!state) return null;

  return (
    <Screen>
      <ScrollView>
        <ExplainButton screen="events" />

        {state.pendingEvent ? (
          <Card>
            <Txt variant="caption">PENDING DECISION</Txt>
            <Txt variant="title" style={{ marginTop: spacing.sm }}>
              {prettyEvent(state.pendingEvent.templateId)}
            </Txt>
            <Txt variant="caption" style={{ marginTop: spacing.xs }}>
              Triggered at month {state.pendingEvent.triggeredMonth + 1}.
            </Txt>
            <Row style={{ marginTop: spacing.md, gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Btn
                  label="Pay now"
                  onPress={() =>
                    applyAction({
                      kind: 'RESOLVE_EVENT',
                      templateId: state.pendingEvent!.templateId,
                      action: 'PAID',
                    })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Btn
                  label="Ignore"
                  tone="danger"
                  onPress={() =>
                    applyAction({
                      kind: 'RESOLVE_EVENT',
                      templateId: state.pendingEvent!.templateId,
                      action: 'IGNORED',
                    })
                  }
                />
              </View>
            </Row>
          </Card>
        ) : (
          <Card>
            <Txt variant="caption">NO PENDING EVENTS</Txt>
            <Txt variant="caption" style={{ marginTop: spacing.xs }}>
              Advance time on the Home tab. Emergencies will surface here when they trigger.
            </Txt>
          </Card>
        )}

        <Card>
          <Txt variant="caption">HISTORY</Txt>
          {state.triggeredEvents.length === 0 ? (
            <Txt variant="caption" style={{ marginTop: spacing.sm }}>
              Nothing has happened yet.
            </Txt>
          ) : (
            state.triggeredEvents
              .slice()
              .reverse()
              .map((e, i) => (
                <Row key={`${e.templateId}-${i}`} style={{ marginTop: spacing.sm }}>
                  <View>
                    <Txt variant="body">{prettyEvent(e.templateId)}</Txt>
                    <Txt variant="caption">
                      m{e.triggeredMonth + 1} · {e.resolvedAction ?? 'pending'}
                    </Txt>
                  </View>
                  <Txt
                    variant="caption"
                    style={{ color: e.cashImpact < 0 ? colors.negative : colors.positive }}
                  >
                    {e.cashImpact ? cashLabel(e.cashImpact) : '—'}
                  </Txt>
                </Row>
              ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function prettyEvent(id: string): string {
  return id
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

function cashLabel(paise: number): string {
  const inr = Math.abs(paise) / 100;
  if (inr >= 1_00_000) return `${paise < 0 ? '-' : '+'}₹${(inr / 1_00_000).toFixed(1)}L`;
  return `${paise < 0 ? '-' : '+'}₹${Math.round(inr)}`;
}
