import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Task, TaskStatus, TaskPriority} from '../types/task';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TaskCard({task, onPress}: TaskCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(task)}
      activeOpacity={0.85}>
      <View
        style={[
          styles.priorityStripe,
          {backgroundColor: PRIORITY_COLOR[task.priority]},
        ]}
      />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.footer}>
          <View
            style={[
              styles.badge,
              {backgroundColor: STATUS_COLOR[task.status] + '22'},
            ]}>
            <View
              style={[styles.dot, {backgroundColor: STATUS_COLOR[task.status]}]}
            />
            <Text style={[styles.badgeText, {color: STATUS_COLOR[task.status]}]}>
              {STATUS_LABEL[task.status]}
            </Text>
          </View>

          <Text style={styles.date}>{formatDate(task.updatedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  priorityStripe: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
});

export default React.memo(TaskCard, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.status === next.task.status &&
    prev.task.notes === next.task.notes &&
    prev.task.updatedAt === next.task.updatedAt
  );
});
