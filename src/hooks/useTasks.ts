import {useMemo, useState, useCallback} from 'react';
import {useTaskStore} from '../store/taskStore';
import {Task, TaskStatus} from '../types/task';
import {debounce} from '../utils/debounce';

export type FilterOption = 'all' | TaskStatus;

interface UseTasksReturn {
  filteredTasks: Task[];
  searchText: string;
  setSearchText: (text: string) => void;
  filter: FilterOption;
  setFilter: (f: FilterOption) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshTasks: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const tasks = useTaskStore(state => state.tasks);
  const isLoading = useTaskStore(state => state.isLoading);
  const isRefreshing = useTaskStore(state => state.isRefreshing);
  const refreshTasks = useTaskStore(state => state.refreshTasks);

  const [searchText, setSearchTextRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');

  const applyDebouncedSearch = useMemo(
    () => debounce((text: string) => setDebouncedSearch(text), 300),
    [],
  );

  const setSearchText = useCallback(
    (text: string) => {
      setSearchTextRaw(text);
      applyDebouncedSearch(text);
    },
    [applyDebouncedSearch],
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }

    if (debouncedSearch.trim()) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(lower));
    }

    result = [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return result;
  }, [tasks, filter, debouncedSearch]);

  return {
    filteredTasks,
    searchText,
    setSearchText,
    filter,
    setFilter,
    isLoading,
    isRefreshing,
    refreshTasks,
  };
}
