import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

export default function RecurringToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Tarefa recorrente</Text>
        <Text style={styles.hint}>Repete toda semana automaticamente</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#ddd', true: '#E94560' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 4, paddingVertical: 8,
    backgroundColor: '#f9f9f9', borderRadius: 10, paddingLeft: 12, paddingRight: 8,
  },
  textContainer: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '600', color: '#333' },
  hint: { fontSize: 12, color: '#888', marginTop: 2 },
});
