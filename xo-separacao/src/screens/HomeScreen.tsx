import React, { useEffect, useState } from 'react';
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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import { DIFFICULTY_CONFIG } from '../constants/difficulty';
import type { Task, DayOfWeek } from '../types/task';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const MEMBER_COLORS: Record<string, string> = {
  memberA: '#E94560',
  memberB: '#3A86FF',
  both: '#8338EC',
};

// Display order: Mon–Sun (Seg–Dom), with corresponding DayOfWeek values
const DAY_TABS: { label: string; value: DayOfWeek }[] = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

function docDataToTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    name: data.name as string,
    dayOfWeek: data.dayOfWeek as DayOfWeek,
    assignedTo: data.assignedTo as Task['assignedTo'],
    difficulty: data.difficulty as Task['difficulty'],
    points: data.points as Task['points'],
    completedBy: (data.completedBy as string | null) ?? null,
    completedAt: (data.completedAt as Task['completedAt']) ?? null,
    createdAt: data.createdAt as Task['createdAt'],
  };
}

function TaskItem({ task, memberId }: { task: Task; memberId: string }) {
  const isCompleted = task.completedBy !== null;
  const diff = DIFFICULTY_CONFIG[task.difficulty];
  const assigneeColor = MEMBER_COLORS[task.assignedTo] ?? '#888';
  const assigneeInitial =
    task.assignedTo === 'both'
      ? '2'
      : task.assignedTo === memberId
      ? 'E'
      : 'C';

  return (
    <View style={[styles.taskRow, isCompleted && styles.taskRowCompleted]}>
      <View style={[styles.assigneeBadge, { backgroundColor: assigneeColor }]}>
        <Text style={styles.assigneeInitial}>{assigneeInitial}</Text>
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskName, isCompleted && styles.taskNameDone]}>
          {task.name}
        </Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>
            {diff.emoji} {diff.label}
          </Text>
        </View>
      </View>
      <Text style={styles.taskPoints}>{task.points} pts</Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>('memberA');
  const today = new Date().getDay() as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);

  useEffect(() => {
    async function loadSession() {
      const sid = await SecureStore.getItemAsync('sessionId');
      const mid = await SecureStore.getItemAsync('memberId');
      setSessionId(sid);
      if (mid) setMemberId(mid);
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);
    const tasksRef = collection(db, 'sessions', sessionId, 'tasks');
    const q = query(tasksRef, where('dayOfWeek', '==', selectedDay));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Task[] = snapshot.docs.map((d) =>
        docDataToTask(d.id, d.data() as Record<string, unknown>)
      );
      // pending first, completed last
      loaded.sort((a, b) => {
        if ((a.completedBy === null) === (b.completedBy === null)) return 0;
        return a.completedBy === null ? -1 : 1;
      });
      setTasks(loaded);
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId, selectedDay]);

  const pending = tasks.filter((t) => t.completedBy === null);
  const completed = tasks.filter((t) => t.completedBy !== null);
  const sorted = [...pending, ...completed];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xô Separação</Text>

      {/* Day-of-week selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {DAY_TABS.map((day) => {
          const isSelected = day.value === selectedDay;
          const isToday = day.value === today;
          return (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayTab,
                isSelected && styles.dayTabSelected,
              ]}
              onPress={() => setSelectedDay(day.value)}
            >
              <Text
                style={[
                  styles.dayTabLabel,
                  isSelected && styles.dayTabLabelSelected,
                ]}
              >
                {day.label}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#E94560" style={styles.loader} />
      ) : sorted.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhuma tarefa para hoje. Toque em + para adicionar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TaskItem task={item} memberId={memberId} />
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    color: '#E94560',
  },
  daySelector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    minWidth: 48,
  },
  dayTabSelected: {
    backgroundColor: '#E94560',
  },
  dayTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  dayTabLabelSelected: {
    color: '#fff',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E94560',
    marginTop: 3,
  },
  loader: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  taskRowCompleted: {
    opacity: 0.5,
  },
  assigneeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assigneeInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  diffBadge: {
    marginTop: 4,
  },
  diffText: {
    fontSize: 12,
    color: '#666',
  },
  taskPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E94560',
    marginLeft: 8,
  },
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
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
});
