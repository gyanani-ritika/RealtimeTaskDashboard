import {create} from 'zustand';
import {fetchTasks} from '../api/taskApi';
import {Task, SyncStatus, TaskStatus} from '../types/task';
import {syncQueue} from '../services/syncService';
import {enqueue, getVersionForTask, getAllQueueItems} from '../services/queueService';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  isRefreshing: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  queueCount: number;
  error: string | null;

  // Actions
  loadTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateTaskInStore: (task: Task) => void;
  editTask: (taskId: string, status: TaskStatus, notes: string) => Promise<void>;
  setOnline: (online: boolean) => void;
  setSyncStatus: (s: SyncStatus) => void;
  setQueueCountFromStorage: () => Promise<void>;
  incrementQueueCount: () => void;
  decrementQueueCount: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isRefreshing: false,
  isOnline: true,
  syncStatus: 'idle',
  queueCount: 0,
  error: null,

  loadTasks: async () => {
    set({isLoading: true, error: null});
    try {
      const tasks = await fetchTasks();
      set({tasks, isLoading: false});
      await get().setQueueCountFromStorage();
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to load tasks. Pull down to retry.';
      set({isLoading: false, error: msg});
    }
  },

  refreshTasks: async () => {
    set({isRefreshing: true, error: null});
    try {
      const tasks = await fetchTasks();
      set({tasks, isRefreshing: false});
    } catch (e: any) {
      const msg = e?.message ?? 'Refresh failed. Please try again.';
      set({isRefreshing: false, error: msg});
    }
  },

  setQueueCountFromStorage: async () => {
    const items = await getAllQueueItems();
    set({queueCount: items.length});
  },

  updateTaskInStore: (updatedTask: Task) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === updatedTask.id ? updatedTask : t,
      ),
    }));
  },

  editTask: async (taskId, status, notes) => {
    const now = new Date().toISOString();
    
    // Optimistic UI update
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? {...t, status, notes, updatedAt: now} : t,
      ),
    }));

    const {isOnline} = get();
    const currentVersion = await getVersionForTask(taskId);

    if (isOnline && currentVersion === 0) {
      try {
        const {updateTask} = await import('../api/taskApi');
        const updated = await updateTask(taskId, {status, notes});
        get().updateTaskInStore(updated);
        return;
      } catch {
        // Fall back to queue path
      }
    }

    await enqueue(taskId, status, notes, currentVersion);
    await get().setQueueCountFromStorage();
  },

  setOnline: async (online: boolean) => {
    set({isOnline: online});
    if (online) {
      await syncQueue();
      await get().setQueueCountFromStorage();
    }
  },

  setSyncStatus: (s: SyncStatus) => set({syncStatus: s}),
  incrementQueueCount: () =>
    set(state => ({queueCount: state.queueCount + 1})),
  decrementQueueCount: () =>
    set(state => ({queueCount: Math.max(0, state.queueCount - 1)})),
}));
