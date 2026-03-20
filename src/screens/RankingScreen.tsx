import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { doc, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import MemberCard from '../components/Ranking/MemberCard';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Ranking'>;

interface MemberData {
  name: string;
  score: number;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function getMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function getResetDate(date: Date): string {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const dd = String(nextMonth.getDate()).padStart(2, '0');
  const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${nextMonth.getFullYear()}`;
}

export default function RankingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [memberA, setMemberA] = useState<MemberData | null>(null);
  const [memberB, setMemberB] = useState<MemberData | null>(null);
  const [memberId, setMemberId] = useState<string>('memberA');
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthLabel = getMonthLabel(now);
  const resetDate = getResetDate(now);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const sid = await SecureStore.getItemAsync('sessionId');
      const mid = await SecureStore.getItemAsync('memberId');
      if (mid) setMemberId(mid);
      if (!sid) {
        setLoading(false);
        return;
      }

      unsubscribe = onSnapshot(doc(db, 'sessions', sid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMemberA(data.memberA ?? null);
          setMemberB(data.memberB ?? null);
        }
        setLoading(false);
      });
    }

    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const scoreA = memberA?.score ?? 0;
  const scoreB = memberB?.score ?? 0;
  const tied = scoreA === scoreB;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🏅 Ranking</Text>
      <Text style={styles.subtitle}>Mês atual: {monthLabel}</Text>
      <Text style={styles.resetText}>Reset em: {resetDate}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#E94560" style={styles.loader} />
      ) : (
        <View style={styles.cardsContainer}>
          <MemberCard
            name={memberA?.name ?? 'Membro A'}
            score={scoreA}
            isWinner={tied || scoreA > scoreB}
            isYou={memberId === 'memberA'}
          />
          <Text style={styles.vs}>VS</Text>
          <MemberCard
            name={memberB?.name ?? 'Cônjuge'}
            score={scoreB}
            isWinner={tied || scoreB > scoreA}
            isYou={memberId === 'memberB'}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 48, paddingHorizontal: 24 },
  backButton: { marginBottom: 8 },
  backButtonText: { fontSize: 16, color: '#E94560', fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E94560',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#555', marginBottom: 4 },
  resetText: { fontSize: 13, textAlign: 'center', color: '#999', marginBottom: 32 },
  loader: { flex: 1 },
  cardsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  vs: { fontSize: 18, fontWeight: 'bold', color: '#aaa', marginHorizontal: 4 },
});
