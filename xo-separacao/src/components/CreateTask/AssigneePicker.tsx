import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { ScoringMode } from '../../types/task';

export type AssigneeChoice = 'me' | 'partner' | 'both';

interface Props {
  value: AssigneeChoice | null;
  onChange: (v: AssigneeChoice) => void;
  scoringMode: ScoringMode;
  onScoringModeChange: (v: ScoringMode) => void;
  sessionId: string | null;
  memberId: string | null;
  error?: string;
}

const SCORING_OPTIONS: { key: ScoringMode; label: string }[] = [
  { key: 'split', label: 'Dividir igualmente' },
  { key: 'completer', label: 'Somente quem completar' },
];

export default function AssigneePicker({
  value,
  onChange,
  scoringMode,
  onScoringModeChange,
  sessionId,
  memberId,
  error,
}: Props) {
  const [myName, setMyName] = useState('Eu');
  const [partnerName, setPartnerName] = useState('Cônjuge');

  useEffect(() => {
    if (!sessionId || !memberId) return;

    getDoc(doc(db, 'sessions', sessionId))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const me = data[memberId];
        const partner = data[memberId === 'memberA' ? 'memberB' : 'memberA'];
        if (me?.name) setMyName(me.name);
        if (partner?.name) setPartnerName(partner.name);
      })
      .catch(() => {});
  }, [sessionId, memberId]);

  const options: { key: AssigneeChoice; label: string }[] = [
    { key: 'me', label: myName },
    { key: 'partner', label: partnerName },
    { key: 'both', label: 'Ambos' },
  ];

  return (
    <View>
      <Text style={styles.label}>Responsável</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, value === opt.key && styles.chipSelected]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.chipText, value === opt.key && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {value === 'both' && (
        <View style={styles.scoringContainer}>
          <Text style={styles.scoringLabel}>Pontuação</Text>
          <View style={styles.row}>
            {SCORING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.scoringChip, scoringMode === opt.key && styles.chipSelected]}
                onPress={() => onScoringModeChange(opt.key)}
              >
                <Text
                  style={[styles.chipText, scoringMode === opt.key && styles.chipTextSelected]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 48,
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#E94560', backgroundColor: '#E94560' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  chipTextSelected: { color: '#fff' },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
  scoringContainer: { marginTop: 12 },
  scoringLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6 },
  scoringChip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
});
