import { formatINRCompact } from '@corpus-quest/shared';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Card, Row, Screen, Txt } from '../src/components/primitives';
import { useAppStore } from '../src/store';
import { colors, spacing } from '../src/theme';

export default function RunHistory() {
  const router = useRouter();
  const history = useAppStore((s) => s.runHistory);
  const hydrate = useAppStore((s) => s.hydrateRunHistory);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        <ScrollView>
          <Txt variant="display">Run history</Txt>
          <Txt variant="caption" style={{ marginTop: spacing.xs }}>
            Your last five runs.
          </Txt>

          {history.slice(0, 5).map((run) => (
            <Card key={run.runId}>
              <Row>
                <Txt variant="body">{run.finalTier ?? '—'}</Txt>
                <Txt variant="number">{run.finalScore ?? '—'}</Txt>
              </Row>
              <Row style={{ marginTop: spacing.xs }}>
                <Txt variant="caption">Net worth</Txt>
                <Txt variant="caption">
                  {run.finalNetWorth != null ? formatINRCompact(run.finalNetWorth) : '—'}
                </Txt>
              </Row>
              <Row style={{ marginTop: spacing.xs }}>
                <Txt variant="caption">Months</Txt>
                <Txt variant="caption">{run.finalMonth ?? '—'}</Txt>
              </Row>
            </Card>
          ))}

          {history.length === 0 ? (
            <Card>
              <Txt variant="caption">No completed runs yet.</Txt>
            </Card>
          ) : null}

          <Btn label="New game" onPress={() => router.replace('/new-game')} />
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}
