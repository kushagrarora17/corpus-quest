import { Redirect } from 'expo-router';

import { useAppStore } from '../src/store';

export default function Index() {
  const runId = useAppStore((s) => s.runId);
  return <Redirect href={runId ? '/dashboard' : '/new-game'} />;
}
