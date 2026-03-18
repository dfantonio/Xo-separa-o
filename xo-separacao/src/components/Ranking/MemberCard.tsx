import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  name: string;
  score: number;
  isWinner: boolean;
  isYou: boolean;
}

export default function MemberCard({ name, score, isWinner, isYou }: Props) {
  return (
    <View style={[styles.card, isWinner && styles.cardWinner]}>
      {isWinner && <Text style={styles.trophy}>🏆</Text>}
      <Text style={styles.memberName}>
        {name}{isYou ? ' (Você)' : ''}
      </Text>
      <Text style={styles.score}>{score} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#f9f9f9', borderRadius: 16, padding: 20,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardWinner: { borderColor: '#E94560', backgroundColor: '#fff5f7' },
  trophy: { fontSize: 28, marginBottom: 6 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#222', textAlign: 'center', marginBottom: 8 },
  score: { fontSize: 24, fontWeight: 'bold', color: '#E94560' },
});
