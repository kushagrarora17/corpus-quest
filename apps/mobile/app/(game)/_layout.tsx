import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HUD } from '../../src/components/HUD';
import { useAppStore } from '../../src/store';
import { colors } from '../../src/theme';

export default function GameLayout() {
  const runId = useAppStore((s) => s.runId);
  const isComplete = useAppStore((s) => s.state?.isComplete ?? false);

  if (!runId) return <Redirect href="/new-game" />;
  if (isComplete) return <Redirect href="/results" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <HUD />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
          <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
          <Tabs.Screen name="invest" options={{ title: 'Invest' }} />
          <Tabs.Screen name="events" options={{ title: 'Events' }} />
          <Tabs.Screen name="family" options={{ title: 'Family' }} />
          <Tabs.Screen name="market" options={{ title: 'Market' }} />
          <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
