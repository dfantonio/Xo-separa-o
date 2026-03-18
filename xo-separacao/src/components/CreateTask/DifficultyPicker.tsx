import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Difficulty } from '../../types/task';
import { DIFFICULTY_CONFIG } from '../../constants/difficulty';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'heroic'];

interface Props {
  value: Difficulty | null;
  onChange: (d: Difficulty) => void;
  error?: string;
}

export default function DifficultyPicker({ value, onChange, error }: Props) {
  return (
    <View>
      <Text style={styles.label}>Dificuldade</Text>
      <View style={styles.row}>
        {DIFFICULTIES.map((d) => {
          const config = DIFFICULTY_CONFIG[d];
          const isSelected = value === d;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onChange(d)}
            >
              <Text style={styles.emoji}>{config.emoji}</Text>
              <Text style={[styles.diffLabel, isSelected && styles.textSelected]}>
                {config.label}
              </Text>
              <Text style={[styles.points, isSelected && styles.textSelected]}>
                {config.points} pts
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  chipSelected: { borderColor: '#E94560', backgroundColor: '#E94560' },
  emoji: { fontSize: 20, marginBottom: 2 },
  diffLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  points: { fontSize: 11, color: '#888', marginTop: 2 },
  textSelected: { color: '#fff' },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
});
