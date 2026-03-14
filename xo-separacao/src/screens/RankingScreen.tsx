import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { doc, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Ranking'>;

interface MemberData {
  name: string;
  score: number;
}

interface SessionData {
  memberA: MemberData | null;
  memberB: MemberData | null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function getResetDate(date: Date): string {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const dd = String(nextMonth.getDate()).padStart(2, '0');
  const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const yyyy = nextMonth.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function RankingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [memberId, setMemberId] = useState<string>('memberA');
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthLabel = getMonthLabel(now);
  const resetDate = getResetDate(now);

  useEffect(() => {
    async function init() {
      const sid = await SecureStore.getItemAsync('sessionId');
      const mid = await SecureStore.getItemAsync('memberId');
      if (mid) setMemberId(mid);
      if (!sid) {
        setLoading(false);
        return;
      }

      const sessionRef = doc(db, 'sessions', sid);
      const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession({
            memberA: data.memberA ?? null,
            memberB: data.memberB ?? null,
          });
        }
        setLoading(false);
      });

      return unsubscribe;
    }

    let unsubscribe: (() => void) | undefined;
    init().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const scoreA = session?.memberA?.score ?? 0;
  const scoreB = session?.memberB?.score ?? 0;
  const tied = scoreA === scoreB;
  const aWins = scoreA > scoreB;
  const bWins = scoreB > scoreA;

  const myLabel = memberId === 'memberA' ? 'Você' : session?.memberA?.name ?? 'Membro A';
  const partnerLabel = memberId === 'memberB' ? 'Você' : session?.memberB?.name ?? 'Cônjuge';

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
          {/* Member A card */}
          <View style={[styles.card, (tied || aWins) && styles.cardWinner]}>
            {(tied || aWins) && <Text style={styles.trophy}>🏆</Text>}
            <Text style={styles.memberName}>
              {session?.memberA?.name ?? 'Membro A'}
              {memberId === 'memberA' ? ' (Você)' : ''}
            </Text>
            <Text style={styles.score}>{scoreA} pts</Text>
          </View>

          <Text style={styles.vs}>VS</Text>

          {/* Member B card */}
          <View style={[styles.card, (tied || bWins) && styles.cardWinner]}>
            {(tied || bWins) && <Text style={styles.trophy}>🏆</Text>}
            <Text style={styles.memberName}>
              {session?.memberB?.name ?? 'Cônjuge'}
              {memberId === 'memberB' ? ' (Você)' : ''}
            </Text>
            <Text style={styles.score}>{scoreB} pts</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#E94560',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E94560',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    marginBottom: 4,
  },
  resetText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#999',
    marginBottom: 32,
  },
  loader: {
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardWinner: {
    borderColor: '#E94560',
    backgroundColor: '#fff5f7',
  },
  trophy: {
    fontSize: 28,
    marginBottom: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E94560',
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aaa',
    marginHorizontal: 4,
  },
});
