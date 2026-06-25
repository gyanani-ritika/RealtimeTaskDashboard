import {updateTask} from '../api/taskApi';
import {retryWithBackoff} from '../utils/retry';
import {getAllQueueItems, dequeue, incrementRetry} from './queueService';
import {useTaskStore} from '../store/taskStore';

const MAX_RETRIES = 5;
let isSyncing = false;
let forceFailureMode = false;

export function setForceFailure(v: boolean) {
  forceFailureMode = v;
}

export function isForceFailureMode() {
  return forceFailureMode;
}

export async function syncQueue(): Promise<void> {
  if (isSyncing) {
    return;
  }

  isSyncing = true;
  const store = useTaskStore.getState();
  store.setSyncStatus('syncing');

  try {
    const items = await getAllQueueItems();

    if (items.length === 0) {
      store.setSyncStatus('idle');
      return;
    }

    for (const item of items) {
      if (item.retryCount >= MAX_RETRIES) {
        await dequeue(item.taskId, item.version);
        continue;
      }

      try {
        const remaining = MAX_RETRIES - item.retryCount;

        const updated = await retryWithBackoff(
          async () => {
            if (forceFailureMode) {
              throw new Error('Forced failure');
            }
            return updateTask(item.taskId, {
              status: item.status,
              notes: item.notes,
            });
          },
          remaining,
          1000,
        );

        await dequeue(item.taskId, item.version);

        const storeTask = store.tasks.find(t => t.id === item.taskId);
        if (
          !storeTask ||
          new Date(storeTask.updatedAt).getTime() <= new Date(item.updatedAt).getTime()
        ) {
          store.updateTaskInStore(updated);
        }
      } catch {
        await incrementRetry(item);
      }
    }

    const remainingItems = await getAllQueueItems();
    if (remainingItems.length > 0) {
      store.setSyncStatus('failed');
    } else {
      store.setSyncStatus('idle');
    }
  } catch {
    store.setSyncStatus('failed');
  } finally {
    isSyncing = false;
  }
}

export function getIsSyncing(): boolean {
  return isSyncing;
}
