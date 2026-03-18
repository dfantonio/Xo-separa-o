import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DayOfWeek } from '../../types/task';

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

interface Props {
  selected: DayOfWeek[];
  onToggle: (day: DayOfWeek) => void;
  error?: string;
}

export default function DaySelector({ selected, onToggle, error }: Props) {
  return (
    <View>
      <Text style={styles.label}>Dias da semana</Text>
      <View style={styles.row}>
        {DAYS.map((d) => {
          const isSelected = selected.includes(d.value);
          return (
            <TouchableOpacity
              key={d.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(d.value)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {d.label}
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
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14, minWidth: 48, alignItems: 'center',
  },
  chipSelected: { borderColor: '#E94560', backgroundColor: '#E94560' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  chipTextSelected: { color: '#fff' },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
});
