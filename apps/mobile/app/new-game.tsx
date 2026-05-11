import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Card, Screen, Txt } from '../src/components/primitives';
import {
  isTutorialComplete,
  setPlayerName,
  setTutorialComplete,
} from '../src/storage/runStorage';
import { useAppStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';

export default function NewGame() {
  const router = useRouter();
  const startNewRun = useAppStore((s) => s.startNewRun);
  const setTutorialOverlay = useAppStore((s) => s.setTutorialOverlay);
  const [name, setName] = useState('');

  const start = () => {
    if (!name.trim()) return;
    setPlayerName(name.trim());
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    startNewRun(seed, 'NORMAL');
    if (!isTutorialComplete()) {
      setTutorialOverlay(0);
      setTutorialComplete(true);
    }
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Txt variant="display">Corpus Quest</Txt>
          <Txt variant="caption" style={{ marginTop: spacing.xs }}>
            Grow rich. Live well. Retire legend.
          </Txt>

          <View style={{ marginTop: spacing.xl }}>
            <Card>
              <Txt variant="caption">YOUR NAME</Txt>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ananya"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                returnKeyType="done"
                autoFocus
              />
            </Card>

            <Card>
              <Txt variant="caption">RULES</Txt>
              <Txt style={{ marginTop: spacing.sm }}>
                You start at 22 with a randomised salary in ₹25k–₹45k. You will play 456 months
                until age 60. Every choice compounds.
              </Txt>
            </Card>

            <Btn label="Begin your quest" disabled={!name.trim()} onPress={start} />
          </View>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
