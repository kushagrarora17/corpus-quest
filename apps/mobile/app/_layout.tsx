import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GlossarySheet } from '../src/components/GlossarySheet';
import { TutorialOverlay } from '../src/components/TutorialOverlay';
import { getActiveRunId, loadRunState } from '../src/storage/runStorage';
import { useAppStore } from '../src/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  const loadExistingRun = useAppStore((s) => s.loadExistingRun);
  const hydrateRunHistory = useAppStore((s) => s.hydrateRunHistory);

  useEffect(() => {
    hydrateRunHistory();
    const id = getActiveRunId();
    if (id) {
      const state = loadRunState(id);
      if (state) loadExistingRun(state);
    }
  }, [hydrateRunHistory, loadExistingRun]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <GlossarySheet />
        <TutorialOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
