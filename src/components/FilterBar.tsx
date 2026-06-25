import React from 'react';
import {Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {FilterOption} from '../hooks/useTasks';

interface FilterBarProps {
  selected: FilterOption;
  onChange: (f: FilterOption) => void;
}

const OPTIONS: Array<{label: string; value: FilterOption}> = [
  {label: 'All', value: 'all'},
  {label: 'Pending', value: 'pending'},
  {label: 'In Progress', value: 'in_progress'},
  {label: 'Completed', value: 'completed'},
];

function FilterBar({selected, onChange}: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}>
      {OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, selected === opt.value && styles.chipActive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.chipText,
              selected === opt.value && styles.chipTextActive,
            ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#1a1a2e',
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  chipActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  chipText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default React.memo(FilterBar);
