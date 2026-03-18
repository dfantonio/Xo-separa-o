import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { DIFFICULTY_CONFIG } from '../../constants/difficulty';
import { toggleTaskComplete, deleteTask } from '../../services/taskService';
import { getDayWeekKey } from '../../utils/weekKey';
import { isCompletedForDay } from '../../utils/taskStatus';
import type { VisibleTask } from '../../utils/taskAccumulation';
import type { Task, DayOfWeek } from '../../types/task';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const MEMBER_COLORS: Record<string, string> = {
  memberA: '#E94560',
  memberB: '#3A86FF',
  both: '#8338EC',
};

const DAY_LABELS: Record<number, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 0: 'Dom',
};

const ACTION_WIDTH = 140;

interface Props {
  item: VisibleTask;
  memberId: string;
  sessionId: string;
  weekKey: string;
  navigation: NavigationProp;
  onTaskCompleted: () => void;
  setAllTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TaskItem({
  item,
  memberId,
  sessionId,
  weekKey,
  navigation,
  onTaskCompleted,
  setAllTasks,
}: Props) {
  const { task, scheduledDay, accumulated } = item;
  const isCompleted = isCompletedForDay(task, weekKey, scheduledDay);
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
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
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
      toValue: 0, duration: 1200, delay: 400, useNativeDriver: true,
    }).start(() => setBadgeText(null));
  };

  const handleToggle = async () => {
    const wasCompleted = isCompleted;
    const dayKey = getDayWeekKey(weekKey, scheduledDay);

    setAllTasks((prev) =>
      prev.map((t) => {
        if (t.id !== task.id) return t;
        if (t.recurring) {
          const newCompletions = { ...t.completions };
          if (wasCompleted) {
            delete newCompletions[dayKey];
            delete newCompletions[weekKey]; // legacy
          } else {
            newCompletions[dayKey] = { by: memberId } as Task['completions'][string];
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
      await toggleTaskComplete(sessionId, task.id, memberId, weekKey, scheduledDay);
    } catch (error) {
      setAllTasks((prev) =>
        prev.map((t) => {
          if (t.id !== task.id) return t;
          if (t.recurring) return { ...t, completions: task.completions };
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
    Alert.alert('Excluir tarefa', `Deseja excluir "${task.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(sessionId, task.id, weekKey, scheduledDay);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
          }
        },
      },
    ]);
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
            <View style={styles.diffRow}>
              <Text style={styles.diffText}>{diff.emoji} {diff.label}</Text>
              {accumulated && (
                <Text style={styles.accumulatedBadge}>Acumulada de {DAY_LABELS[scheduledDay]}</Text>
              )}
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

const styles = StyleSheet.create({
  swipeContainer: { marginBottom: 10, borderRadius: 12, overflow: 'hidden' },
  actionButtons: { position: 'absolute', right: 0, top: 0, bottom: 0, width: ACTION_WIDTH, flexDirection: 'row' },
  editButton: { flex: 1, backgroundColor: '#3A86FF', alignItems: 'center', justifyContent: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#e74c3c', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12,
    padding: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2,
  },
  taskRowCompleted: { backgroundColor: '#f0f0f0' },
  swipeArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkbox: { marginRight: 10 },
  checkboxInner: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#E94560', borderColor: '#E94560' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  pointsBadge: { backgroundColor: '#E94560', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  pointsBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  assigneeBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  assigneeInitial: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: '500', color: '#222' },
  taskNameDone: { textDecorationLine: 'line-through', color: '#888' },
  diffRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  diffText: { fontSize: 12, color: '#666' },
  accumulatedBadge: { fontSize: 10, color: '#E94560', fontWeight: '600' },
  taskPoints: { fontSize: 13, fontWeight: '600', color: '#E94560', marginLeft: 8 },
});
