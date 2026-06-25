import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {Task} from '../types/task';
import {RootStackParamList} from '../../App';
import {useTaskStore} from '../store/taskStore';
import {useTasks} from '../hooks/useTasks';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import {syncQueue} from '../services/syncService';
import {setForceFailure, isForceFailureMode} from '../services/syncService';

type Props = StackScreenProps<RootStackParamList, 'Dashboard'>;

function Loader() {
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color="#e94560" />
      <Text style={styles.loaderText}>Loading 2 000 tasks…</Text>
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}
function ErrorView({message, onRetry}: ErrorViewProps) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

interface EmptyViewProps {
  hasFilter: boolean;
}
function EmptyView({hasFilter}: EmptyViewProps) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No tasks found</Text>
      <Text style={styles.emptySubtitle}>
        {hasFilter
          ? 'Try adjusting your search or filter.'
          : 'Pull down to refresh the list.'}
      </Text>
    </View>
  );
}

interface NetworkStatusBarProps {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'failed';
  queueCount: number;
}

function NetworkStatusBar({isOnline, syncStatus, queueCount}: NetworkStatusBarProps) {
  let bg = '#10b981';
  let icon = '🟢';
  let label = 'Online';

  if (!isOnline) {
    bg = '#e94560';
    icon = '🔴';
    label =
      queueCount > 0
        ? `Offline Mode — ${queueCount} change${queueCount > 1 ? 's' : ''} will sync automatically`
        : 'Offline Mode';
  } else if (syncStatus === 'syncing') {
    bg = '#f59e0b';
    icon = '🔄';
    label = `Syncing${queueCount > 0 ? ` ${queueCount} queued item${queueCount > 1 ? 's' : ''}` : ''}…`;
  } else if (syncStatus === 'failed') {
    bg = '#7c3aed';
    icon = '⚠️';
    label = 'Sync failed';
  } else if (queueCount > 0) {
    bg = '#f59e0b';
    icon = '🟡';
    label = `Pending Sync: ${queueCount} item${queueCount > 1 ? 's' : ''}`;
  }

  return (
    <View style={[styles.netBar, {backgroundColor: bg + '22', borderColor: bg}]}>
      <Text style={[styles.netBarText, {color: bg}]}>
        {icon}  {label}
      </Text>
    </View>
  );
}

interface DebugPanelProps {
  isOnline: boolean;
}

function DebugPanel({isOnline}: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [forceMode, setForceMode] = useState(isForceFailureMode());
  const setSyncStatus = useTaskStore(state => state.setSyncStatus);
  const setQueueCountFromStorage = useTaskStore(
    state => state.setQueueCountFromStorage,
  );

  const toggleForce = () => {
    const next = !forceMode;
    setForceFailure(next);
    setForceMode(next);
  };

  const triggerSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline.');
      return;
    }
    setSyncStatus('syncing');
    try {
      await syncQueue();
      await setQueueCountFromStorage();
      setSyncStatus('idle');
      Alert.alert('Sync complete');
    } catch {
      setSyncStatus('failed');
    }
  };

  return (
    <View style={styles.debugWrapper}>
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={() => setOpen(o => !o)}>
        <Text style={styles.debugToggleText}>
          🛠 Debug Panel  {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.debugBody}>
          <TouchableOpacity
            style={[
              styles.debugBtn,
              forceMode && styles.debugBtnDanger,
            ]}
            onPress={toggleForce}>
            <Text style={styles.debugBtnText}>
              {forceMode ? '✅ Force Failure ON' : '💥 Force API Failure'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.debugBtn, !isOnline && styles.debugBtnDisabled]}
            onPress={triggerSync}
            disabled={!isOnline}>
            <Text style={styles.debugBtnText}>🔄 Trigger Manual Sync</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen({navigation}: Props) {
  const loadTasks = useTaskStore(state => state.loadTasks);
  const isOnline = useTaskStore(state => state.isOnline);
  const syncStatus = useTaskStore(state => state.syncStatus);
  const queueCount = useTaskStore(state => state.queueCount);
  const error = useTaskStore(state => state.error);

  const {
    filteredTasks,
    searchText,
    setSearchText,
    filter,
    setFilter,
    isLoading,
    isRefreshing,
    refreshTasks,
  } = useTasks();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const renderItem = useCallback(
    ({item}: {item: Task}) => (
      <TaskCard
        task={item}
        onPress={() => navigation.navigate('TaskDetails', {taskId: item.id})}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const hasActiveFilter = filter !== 'all' || searchText.trim().length > 0;

  let content: React.ReactNode;

  if (isLoading) {
    content = <Loader />;
  } else if (error) {
    content = <ErrorView message={error} onRetry={loadTasks} />;
  } else {
    content = (
      <FlatList
        data={filteredTasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={<EmptyView hasFilter={hasActiveFilter} />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshTasks}
            tintColor="#e94560"
            colors={['#e94560']}
          />
        }
        contentContainerStyle={
          filteredTasks.length === 0 ? styles.emptyList : styles.list
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Task Dashboard</Text>
          <Text style={styles.headerSub}>
            {isLoading
              ? 'Loading…'
              : error
              ? 'Error loading tasks'
              : `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {queueCount > 0 && (
          <View style={styles.queueBadge}>
            <Text style={styles.queueBadgeText}>⏳ {queueCount}</Text>
          </View>
        )}
      </View>

      <NetworkStatusBar
        isOnline={isOnline}
        syncStatus={syncStatus}
        queueCount={queueCount}
      />

      <SearchBar value={searchText} onChangeText={setSearchText} />
      <FilterBar selected={filter} onChange={setFilter} />

      {content}

      <DebugPanel isOnline={isOnline} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#1a1a2e'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  headerTitle: {color: '#fff', fontSize: 22, fontWeight: '700'},
  headerSub: {color: '#888', fontSize: 12, marginTop: 2},
  queueBadge: {
    backgroundColor: '#f59e0b22',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  queueBadgeText: {color: '#f59e0b', fontSize: 13, fontWeight: '700'},
  netBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  netBarText: {fontSize: 13, fontWeight: '600'},
  list: {paddingTop: 6, paddingBottom: 20},
  emptyList: {flexGrow: 1},
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loaderText: {color: '#888', fontSize: 14},
  errorIcon: {fontSize: 40},
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#e94560',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  emptyIcon: {fontSize: 40},
  emptyTitle: {color: '#ccc', fontSize: 17, fontWeight: '600'},
  emptySubtitle: {color: '#666', fontSize: 13, textAlign: 'center'},
  debugWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    backgroundColor: '#10101e',
  },
  debugToggle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  debugToggleText: {color: '#555', fontSize: 12, fontWeight: '600'},
  debugBody: {paddingHorizontal: 16, paddingBottom: 14, gap: 8},
  debugBtn: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  debugBtnDanger: {borderColor: '#e94560', backgroundColor: '#7f1d1d22'},
  debugBtnDisabled: {opacity: 0.4},
  debugBtnText: {color: '#ccc', fontSize: 13},
});
