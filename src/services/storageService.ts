import AsyncStorage from '@react-native-async-storage/async-storage';
import {DraftItem, QueueItem} from '../types/task';

const KEYS = {
  DRAFTS: 'drafts_v1',
  QUEUE: 'offline_queue_v1',
} as const;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export async function saveDraft(draft: DraftItem): Promise<void> {
  const drafts = await readJSON<Record<string, DraftItem>>(KEYS.DRAFTS, {});
  drafts[draft.taskId] = draft;
  await writeJSON(KEYS.DRAFTS, drafts);
}

export async function getDraft(taskId: string): Promise<DraftItem | null> {
  const drafts = await readJSON<Record<string, DraftItem>>(KEYS.DRAFTS, {});
  return drafts[taskId] ?? null;
}

export async function clearDraft(taskId: string): Promise<void> {
  const drafts = await readJSON<Record<string, DraftItem>>(KEYS.DRAFTS, {});
  delete drafts[taskId];
  await writeJSON(KEYS.DRAFTS, drafts);
}

export async function getQueue(): Promise<Record<string, QueueItem>> {
  return readJSON<Record<string, QueueItem>>(KEYS.QUEUE, {});
}

export async function upsertQueueItem(item: QueueItem): Promise<void> {
  const queue = await getQueue();
  const existing = queue[item.taskId];

  if (!existing || item.version >= existing.version) {
    queue[item.taskId] = item;
    await writeJSON(KEYS.QUEUE, queue);
  }
}

export async function removeQueueItem(taskId: string, version?: number): Promise<void> {
  const queue = await getQueue();
  if (version !== undefined) {
    const existing = queue[taskId];
    if (existing && existing.version !== version) {
      return;
    }
  }
  delete queue[taskId];
  await writeJSON(KEYS.QUEUE, queue);
}

export async function clearQueue(): Promise<void> {
  await writeJSON(KEYS.QUEUE, {});
}
