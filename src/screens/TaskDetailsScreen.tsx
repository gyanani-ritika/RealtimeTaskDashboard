import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../../App';
import {useTaskStore} from '../store/taskStore';
import {saveDraft, getDraft, clearDraft} from '../services/storageService';
import {Task, TaskStatus, TaskPriority} from '../types/task';

type Props = StackScreenProps<RootStackParamList, 'TaskDetails'>;

const STATUS_OPTIONS: Array<{label: string; value: TaskStatus}> = [
  {label: 'Pending', value: 'pending'},
  {label: 'In Progress', value: 'in_progress'},
  {label: 'Completed', value: 'completed'},
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#e94560',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function TaskDetailsScreen({route, navigation}: Props) {
  const {taskId} = route.params;

  const task = useTaskStore(
    useCallback(
      (state: {tasks: Task[]}) => state.tasks.find(t => t.id === taskId),
      [taskId],
    ),
  ) as Task | undefined;

  const editTask = useTaskStore(state => state.editTask);
  const isOnline = useTaskStore(state => state.isOnline);

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const notesRef = useRef(notes);
  const statusRef = useRef(status);
  const isDirtyRef = useRef(isDirty);
  notesRef.current = notes;
  statusRef.current = status;
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (!task) {
      return;
    }

    (async () => {
      const draft = await getDraft(taskId);
      if (draft) {
        setNotes(draft.notes);
        setStatus(draft.status);
        setDraftRestored(true);
        setLastSaved(new Date(draft.savedAt).toLocaleTimeString());
      } else {
        setNotes(task.notes ?? '');
        setStatus(task.status);
      }
    })();
  }, [taskId, task]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!taskId || !isDirtyRef.current) {
        return;
      }
      const now = new Date().toISOString();
      await saveDraft({
        taskId,
        notes: notesRef.current,
        status: statusRef.current,
        savedAt: now,
      });
      setLastSaved(new Date(now).toLocaleTimeString());
    }, 5000);

    return () => clearInterval(interval);
  }, [taskId]);

  const handleStatusChange = (s: TaskStatus) => {
    setStatus(s);
    setIsDirty(true);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    setIsDirty(true);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await editTask(taskId, status, notes);
      await clearDraft(taskId);
      setDraftRestored(false);
      setIsDirty(false);
      setLastSaved(null);
      Alert.alert(
        'Saved',
        isOnline
          ? 'Changes saved to server.'
          : 'Offline – changes queued and will sync when you reconnect.',
      );
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  }, [taskId, status, notes, editTask, isOnline]);

  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.centerText}>Loading task…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {draftRestored && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftText}>
              📝 Draft restored from{' '}
              {lastSaved ? `last save at ${lastSaved}` : 'previous session'}
            </Text>
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              🔴 Offline Mode — changes will sync automatically when you reconnect
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Task Details</Text>
        <View style={styles.card}>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>TITLE</Text>
            <Text style={styles.fieldValue}>{task.title}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: PRIORITY_COLOR[task.priority] + '22',
                  borderColor: PRIORITY_COLOR[task.priority],
                },
              ]}>
              <Text
                style={[
                  styles.priorityBadgeText,
                  {color: PRIORITY_COLOR[task.priority]},
                ]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>SERVER STATUS</Text>
            <View
              style={[
                styles.statusReadBadge,
                {backgroundColor: STATUS_COLOR[task.status] + '22'},
              ]}>
              <View
                style={[styles.dot, {backgroundColor: STATUS_COLOR[task.status]}]}
              />
              <Text
                style={[
                  styles.statusReadText,
                  {color: STATUS_COLOR[task.status]},
                ]}>
                {STATUS_LABEL[task.status]}
              </Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>TASK ID</Text>
            <Text style={[styles.fieldValue, {color: '#666'}]}>#{task.id}</Text>
          </View>

          <View style={[styles.fieldRow, {borderBottomWidth: 0}]}>
            <Text style={styles.fieldLabel}>LAST UPDATED</Text>
            <Text style={styles.fieldValue}>
              {new Date(task.updatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Change Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.statusChip,
                status === opt.value && {
                  backgroundColor: STATUS_COLOR[opt.value],
                  borderColor: STATUS_COLOR[opt.value],
                },
              ]}
              onPress={() => handleStatusChange(opt.value)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.statusChipText,
                  status === opt.value && styles.statusChipTextActive,
                ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Add notes here…"
          placeholderTextColor="#555"
          value={notes}
          onChangeText={handleNotesChange}
          textAlignVertical="top"
        />

        <View style={styles.autoSaveRow}>
          {lastSaved ? (
            <Text style={styles.autoSaveText}>
              💾 Draft auto-saved at {lastSaved}
            </Text>
          ) : (
            <Text style={styles.autoSaveText}>Auto-saves every 5 s</Text>
          )}
          {isDirty && (
            <Text style={styles.unsavedText}>● Unsaved changes</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isOnline ? '✓  Save Changes' : '📶 Save to Offline Queue'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#1a1a2e'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backBtnText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  backBtnPlaceholder: {width: 60},
  scroll: {padding: 16, paddingBottom: 40},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  centerText: {color: '#888', fontSize: 14},
  draftBanner: {
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  draftText: {color: '#93c5fd', fontSize: 13, lineHeight: 18},
  offlineBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  offlineText: {color: '#fca5a5', fontSize: 13, lineHeight: 18},
  sectionTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  fieldLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  priorityBadgeText: {fontSize: 13, fontWeight: '700'},
  statusReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dot: {width: 7, height: 7, borderRadius: 4},
  statusReadText: {fontSize: 13, fontWeight: '600'},
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0f3460',
    backgroundColor: '#16213e',
  },
  statusChipText: {color: '#888', fontSize: 13, fontWeight: '600'},
  statusChipTextActive: {color: '#fff'},
  notesInput: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    minHeight: 140,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#0f3460',
    marginBottom: 6,
  },
  autoSaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  autoSaveText: {color: '#555', fontSize: 11},
  unsavedText: {color: '#f59e0b', fontSize: 11, fontWeight: '600'},
  saveBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnDisabled: {opacity: 0.6},
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
