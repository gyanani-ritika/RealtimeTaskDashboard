import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

function SearchBar({value, onChangeText}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search tasks..."
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
});

export default React.memo(SearchBar);
