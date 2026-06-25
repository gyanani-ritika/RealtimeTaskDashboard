export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  updatedAt: string;
  notes?: string;
}

export interface QueueItem {
  taskId: string;
  status: TaskStatus;
  notes: string;
  updatedAt: string;
  retryCount: number;
  version: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'failed';

export interface DraftItem {
  taskId: string;
  notes: string;
  status: TaskStatus;
  savedAt: string;
}
