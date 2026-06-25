import {QueueItem, TaskStatus} from '../types/task';
import {
  getQueue,
  upsertQueueItem,
  removeQueueItem,
} from './storageService';

export async function enqueue(
  taskId: string,
  status: TaskStatus,
  notes: string,
  currentVersion: number,
): Promise<void> {
  const item: QueueItem = {
    taskId,
    status,
    notes,
    updatedAt: new Date().toISOString(),
    retryCount: 0,
    version: currentVersion + 1,
  };
  await upsertQueueItem(item);
}

export async function dequeue(taskId: string, version?: number): Promise<void> {
  await removeQueueItem(taskId, version);
}

export async function incrementRetry(item: QueueItem): Promise<void> {
  const updated: QueueItem = {...item, retryCount: item.retryCount + 1};
  await upsertQueueItem(updated);
}

export async function getAllQueueItems(): Promise<QueueItem[]> {
  const queue = await getQueue();
  return Object.values(queue);
}

export async function getVersionForTask(taskId: string): Promise<number> {
  const queue = await getQueue();
  return queue[taskId]?.version ?? 0;
}
