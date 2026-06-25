import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {error: string | null; stack: string | null}
> {
  constructor(props: any) {
    super(props);
    this.state = {error: null, stack: null};
  }
  static getDerivedStateFromError(error: any) {
    return {error: String(error?.message ?? error), stack: error?.stack ?? ''};
  }
  componentDidCatch(error: any, info: any) {
    console.error('[EB] error:', error);
    console.error('[EB] componentStack:', info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={s.err}>
          <Text style={s.errH}>❌ Caught: {this.state.error}</Text>
          <Text style={s.errS}>{this.state.stack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import {useTaskStore} from './src/store/taskStore';
import {getAllQueueItems} from './src/services/queueService';
import {useOfflineSync} from './src/hooks/useOfflineSync';
import DashboardScreen from './src/screens/DashboardScreen';
import TaskDetailsScreen from './src/screens/TaskDetailsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  TaskDetails: {taskId: string};
};

type Screen = {name: 'Dashboard'} | {name: 'TaskDetails'; taskId: string};

function AppInner() {
  const [screen, setScreen] = React.useState<Screen>({name: 'Dashboard'});
  const loadTasks = useTaskStore(s => s.loadTasks);
  useOfflineSync();

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const fakeNav = {
    navigate: (name: string, params?: any) => {
      if (name === 'TaskDetails') {
        setScreen({name: 'TaskDetails', taskId: params?.taskId});
      } else {
        setScreen({name: 'Dashboard'});
      }
    },
    goBack: () => setScreen({name: 'Dashboard'}),
    canGoBack: () => screen.name !== 'Dashboard',
  } as any;

  if (screen.name === 'TaskDetails') {
    return (
      <TaskDetailsScreen
        navigation={fakeNav}
        route={{
          key: 'TaskDetails',
          name: 'TaskDetails',
          params: {taskId: screen.taskId},
        } as any}
      />
    );
  }

  return (
    <DashboardScreen
      navigation={fakeNav}
      route={{key: 'Dashboard', name: 'Dashboard', params: undefined} as any}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  err: {
    flex: 1,
    backgroundColor: '#1a0000',
    padding: 20,
    paddingTop: 50,
  },
  errH: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  errS: {
    color: '#ffaaaa',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});