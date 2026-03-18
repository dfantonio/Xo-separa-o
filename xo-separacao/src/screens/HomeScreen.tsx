import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import { DIFFICULTY_CONFIG } from '../constants/difficulty';
import { toggleTaskComplete, deleteTask, docToTask } from '../services/taskService';
import { checkAndResetMonthlyScore } from '../services/sessionService';
import { scheduleTaskReminders, cancelTaskReminders } from '../services/notificationService';
import { getWeekKey } from '../utils/weekKey';
import type { Task, DayOfWeek } from '../types/task';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const MEMBER_COLORS: Record<string, string> = {
  memberA: '#E94560',
  memberB: '#3A86FF',
  both: '#8338EC',
};

const DAY_TABS: { label: string; value: DayOfWeek }[] = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

const ACTION_WIDTH = 140;

function isTaskCompleted(task: Task, weekKey: string): boolean {
  if (task.recurring) {
    return weekKey in (task.completions ?? {});
  }
  return task.completedBy !== null;
}

function TaskItem({
  task,
  memberId,
  sessionId,
  weekKey,
  navigation,
  onTaskCompleted,
  setTasks,
}: {
  task: Task;
  memberId: string;
  sessionId: string;
  weekKey: string;
  navigation: NavigationProp;
  onTaskCompleted: () => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const isCompleted = isTaskCompleted(task, weekKey);
  const diff = DIFFICULTY_CONFIG[task.difficulty];
  const assigneeColor = MEMBER_COLORS[task.assignedTo] ?? '#888';
  const assigneeInitial =
    task.assignedTo === 'both'
      ? '2'
      : task.assignedTo === memberId
      ? 'E'
      : 'C';

  const [badgeText, setBadgeText] = useState<string | null>(null);
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dy) < 20,
      onPanResponderMove: (_, gestureState) => {
        const newX = isOpen.current
          ? Math.min(0, -ACTION_WIDTH + gestureState.dx)
          : Math.min(0, gestureState.dx);
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = ACTION_WIDTH / 2;
        const shouldOpen = isOpen.current
          ? gestureState.dx < threshold
          : gestureState.dx < -threshold;

        if (shouldOpen) {
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
          }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  };

  const showBadge = (text: string) => {
    setBadgeText(text);
    badgeOpacity.setValue(1);
    Animated.timing(badgeOpacity, {
      toValue: 0,
      duration: 1200,
      delay: 400,
      useNativeDriver: true,
    }).start(() => setBadgeText(null));
  };

  const handleToggle = async () => {
    const wasCompleted = isCompleted;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== task.id) return t;
        if (t.recurring) {
          const newCompletions = { ...t.completions };
          if (wasCompleted) {
            delete newCompletions[weekKey];
          } else {
            newCompletions[weekKey] = { by: memberId } as Task['completions'][string];
          }
          return { ...t, completions: newCompletions };
        }
        return { ...t, completedBy: wasCompleted ? null : memberId } as Task;
      })
    );

    if (!wasCompleted) {
      showBadge(`+${task.points} pts!`);
      onTaskCompleted();
    }

    try {
      await toggleTaskComplete(sessionId, task.id, memberId, weekKey);
    } catch (error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== task.id) return t;
          if (t.recurring) {
            return { ...t, completions: task.completions };
          }
          return { ...t, completedBy: task.completedBy, completedAt: task.completedAt } as Task;
        })
      );
      console.error('toggleTaskComplete error:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  };

  const handleEdit = () => {
    closeSwipe();
    navigation.navigate('CreateTask', { task });
  };

  const handleDeletePress = () => {
    closeSwipe();
    Alert.alert(
      'Excluir tarefa',
      `Deseja excluir "${task.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(sessionId, task.id, weekKey);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.taskRow, isCompleted && styles.taskRowCompleted, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isCompleted && styles.checkboxChecked]}>
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={[styles.swipeArea, isCompleted && { opacity: 0.5 }]} {...panResponder.panHandlers}>
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
          <View>
            {badgeText ? (
              <Animated.View
                style={[
                  styles.pointsBadge,
                  { opacity: badgeOpacity, transform: [{ scale: badgeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
                ]}
              >
                <Text style={styles.pointsBadgeText}>{badgeText}</Text>
              </Animated.View>
            ) : (
              <Text style={[styles.taskPoints, isCompleted && { opacity: 0.5 }]}>{task.points} pts</Text>
            )}
          </View>
        </View>
      </Animated.View>
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
    const q = query(tasksRef, where('days', 'array-contains', selectedDay));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Task[] = snapshot.docs.map((d) => docToTask(d));
      loaded.sort((a, b) => {
        const aCompleted = isTaskCompleted(a, weekKey);
        const bCompleted = isTaskCompleted(b, weekKey);
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
      });
      setTasks(loaded);
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId, selectedDay]);

  const pending = tasks.filter((t) => !isTaskCompleted(t, weekKey));

  const handleTaskCompleted = () => {
    if (selectedDay !== today) return;
    if (pending.length <= 1) {
      cancelTaskReminders().catch(() => {});
    }
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
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhuma tarefa para hoje. Toque em + para adicionar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              memberId={memberId}
              sessionId={sessionId ?? ''}
              weekKey={weekKey}
              navigation={navigation}
              onTaskCompleted={handleTaskCompleted}
              setTasks={setTasks}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E94560',
    flex: 1,
  },
  rankingButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingButtonText: {
    fontSize: 24,
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
  swipeContainer: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3A86FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  taskRowCompleted: {
    backgroundColor: '#f0f0f0',
  },
  swipeArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#E94560',
    borderColor: '#E94560',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pointsBadge: {
    backgroundColor: '#E94560',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  pointsBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
