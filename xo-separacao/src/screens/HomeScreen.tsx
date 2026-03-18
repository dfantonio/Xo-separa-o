import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { collection, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import { docToTask } from '../services/taskService';
import { checkAndResetMonthlyScore } from '../services/sessionService';
import { scheduleTaskReminders, cancelTaskReminders } from '../services/notificationService';
import { getWeekKey } from '../utils/weekKey';
import { isCompletedForDay } from '../utils/taskStatus';
import { getVisibleTasks } from '../utils/taskAccumulation';
import TaskItem from '../components/Home/TaskItem';
import type { Task, DayOfWeek } from '../types/task';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const DAY_TABS: { label: string; value: DayOfWeek }[] = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>('memberA');
  const today = new Date().getDay() as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);
  const weekKey = getWeekKey();

  useEffect(() => {
    async function loadSession() {
      const sid = await SecureStore.getItemAsync('sessionId');
      const mid = await SecureStore.getItemAsync('memberId');
      setSessionId(sid);
      if (mid) setMemberId(mid);
      if (sid) {
        checkAndResetMonthlyScore(sid).catch(() => {});
        scheduleTaskReminders().catch(() => {});
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    const tasksRef = collection(db, 'sessions', sessionId, 'tasks');

    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      setAllTasks(snapshot.docs.map((d) => docToTask(d)));
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId]);

  const visibleTasks = useMemo(() => {
    const visible = getVisibleTasks(allTasks, selectedDay, today, weekKey);
    visible.sort((a, b) => {
      const ac = isCompletedForDay(a.task, weekKey, a.scheduledDay);
      const bc = isCompletedForDay(b.task, weekKey, b.scheduledDay);
      if (ac === bc) return 0;
      return ac ? 1 : -1;
    });
    return visible;
  }, [allTasks, selectedDay, today, weekKey]);

  const pending = visibleTasks.filter((v) => !isCompletedForDay(v.task, weekKey, v.scheduledDay));

  const handleTaskCompleted = () => {
    if (selectedDay !== today) return;
    if (pending.length <= 1) cancelTaskReminders().catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Xô Separação</Text>
        <TouchableOpacity
          style={styles.rankingButton}
          onPress={() => navigation.navigate('Ranking')}
        >
          <Text style={styles.rankingButtonText}>🏅</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
        style={styles.daySelectorContainer}
      >
        {DAY_TABS.map((day) => {
          const isSelected = day.value === selectedDay;
          const isToday = day.value === today;
          return (
            <TouchableOpacity
              key={day.value}
              style={[styles.dayTab, isSelected && styles.dayTabSelected]}
              onPress={() => setSelectedDay(day.value)}
            >
              <Text style={[styles.dayTabLabel, isSelected && styles.dayTabLabelSelected]}>
                {day.label}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#E94560" style={styles.loader} />
      ) : visibleTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma tarefa para hoje. Toque em + para adicionar.</Text>
        </View>
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={(v) => `${v.task.id}-${v.scheduledDay}`}
          contentContainerStyle={styles.list}
          renderItem={({ item: v }) => (
            <TaskItem
              item={v}
              memberId={memberId}
              sessionId={sessionId ?? ''}
              weekKey={weekKey}
              navigation={navigation}
              onTaskCompleted={handleTaskCompleted}
              setAllTasks={setAllTasks}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask', undefined)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#E94560', flex: 1 },
  rankingButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  rankingButtonText: { fontSize: 24 },
  daySelectorContainer: { flexGrow: 0 },
  daySelector: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    minWidth: 48,
  },
  dayTabSelected: { backgroundColor: '#E94560' },
  dayTabLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayTabLabelSelected: { color: '#fff' },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E94560', marginTop: 3 },
  loader: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#888' },
  list: { padding: 16, paddingBottom: 100 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E94560',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
});
