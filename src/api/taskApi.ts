import {Task, TaskStatus, TaskPriority} from '../types/task';

const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTasks(count: number): Task[] {
  return Array.from({length: count}, (_, i) => {
    const id = String(i + 1);
    const offsetMs = Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(Date.now() - offsetMs).toISOString();

    return {
      id,
      title: `Task #${id}: ${sampleTitles[i % sampleTitles.length]}`,
      status: randomItem(STATUSES),
      priority: randomItem(PRIORITIES),
      updatedAt,
      notes: '',
    };
  });
}

const sampleTitles = [
  'Prepare Report',
  'Code Review',
  'Fix Bug',
  'Write Tests',
  'Deploy Service',
  'Update Docs',
  'Design Mockup',
  'Client Meeting',
  'Sprint Planning',
  'Database Migration',
  'Performance Audit',
  'Security Scan',
  'Refactor Module',
  'API Integration',
  'Release Notes',
];

let _cachedTasks: Task[] | null = null;

function getCachedTasks(): Task[] {
  if (!_cachedTasks) {
    _cachedTasks = generateTasks(2000);
  }
  return _cachedTasks;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchTasks(): Promise<Task[]> {
  await delay(500);
  return [...getCachedTasks()];
}

export async function updateTask(
  taskId: string,
  patch: {status: TaskStatus; notes: string},
): Promise<Task> {
  await delay(300);

  if (Math.random() < 0.2) {
    throw new Error(`API error: failed to update task ${taskId}`);
  }

  const tasks = getCachedTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) {
    throw new Error(`Task ${taskId} not found`);
  }

  const updated: Task = {
    ...tasks[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  tasks[idx] = updated;
  return updated;
}
