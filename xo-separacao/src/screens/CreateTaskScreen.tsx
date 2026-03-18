import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import type { RootStackParamList } from '../navigation/types';
import type { DayOfWeek, AssignedTo, Difficulty } from '../types/task';
import { DIFFICULTY_CONFIG } from '../constants/difficulty';
import { createTask, updateTask } from '../services/taskService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'CreateTask'>;
type CreateTaskRouteProp = RouteProp<RootStackParamList, 'CreateTask'>;

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'heroic'];

export default function CreateTaskScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateTaskRouteProp>();
  const editingTask = route.params?.task;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [name, setName] = useState(editingTask?.name ?? '');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(editingTask?.days ?? []);
  const [recurring, setRecurring] = useState(editingTask?.recurring ?? true);
  const [assigneeChoice, setAssigneeChoice] = useState<'me' | 'partner' | 'both' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(editingTask?.difficulty ?? null);

  const [nameError, setNameError] = useState('');
  const [dayError, setDayError] = useState('');
  const [assigneeError, setAssigneeError] = useState('');
  const [difficultyError, setDifficultyError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const sid = await SecureStore.getItemAsync('sessionId');
      const mid = await SecureStore.getItemAsync('memberId');
      setSessionId(sid);
      setMemberId(mid);

      if (editingTask && mid) {
        if (editingTask.assignedTo === 'both') {
          setAssigneeChoice('both');
        } else if (editingTask.assignedTo === mid) {
          setAssigneeChoice('me');
        } else {
          setAssigneeChoice('partner');
        }
      }
    }
    loadSession();
  }, []);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function resolveAssignedTo(): AssignedTo | null {
    if (!memberId || !assigneeChoice) return null;
    if (assigneeChoice === 'both') return 'both';
    if (assigneeChoice === 'me') return memberId as AssignedTo;
    return (memberId === 'memberA' ? 'memberB' : 'memberA') as AssignedTo;
  }

  async function handleSave() {
    let valid = true;
    setNameError('');
    setDayError('');
    setAssigneeError('');
    setDifficultyError('');

    if (!name.trim()) {
      setNameError('Nome é obrigatório.');
      valid = false;
    }
    if (selectedDays.length === 0) {
      setDayError('Selecione ao menos um dia da semana.');
      valid = false;
    }
    if (!assigneeChoice) {
      setAssigneeError('Selecione o responsável.');
      valid = false;
    }
    if (!difficulty) {
      setDifficultyError('Selecione a dificuldade.');
      valid = false;
    }
    if (!valid) return;

    const assignedTo = resolveAssignedTo();
    if (!sessionId || !assignedTo || !difficulty) return;

    setLoading(true);
    try {
      if (editingTask) {
        await updateTask(sessionId, editingTask.id, {
          name: name.trim(),
          days: selectedDays,
          recurring,
          assignedTo,
          difficulty,
        });
      } else {
        await createTask(sessionId, {
          name: name.trim(),
          days: selectedDays,
          recurring,
          assignedTo,
          difficulty,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</Text>

      {/* Name */}
      <Text style={styles.label}>Nome da tarefa</Text>
      <TextInput
        style={[styles.input, nameError ? styles.inputError : null]}
        placeholder="Ex: Lavar a louça"
        value={name}
        onChangeText={setName}
        maxLength={60}
      />
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      <Text style={styles.charCount}>{name.length}/60</Text>

      {/* Day of Week — multi-select */}
      <Text style={styles.label}>Dias da semana</Text>
      <View style={styles.chipRow}>
        {DAYS.map((d) => {
          const isSelected = selectedDays.includes(d.value);
          return (
            <TouchableOpacity
              key={d.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleDay(d.value)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {dayError ? <Text style={styles.errorText}>{dayError}</Text> : null}

      {/* Recurring toggle */}
      <View style={styles.recurringRow}>
        <View style={styles.recurringTextContainer}>
          <Text style={styles.recurringLabel}>Tarefa recorrente</Text>
          <Text style={styles.recurringHint}>Repete toda semana automaticamente</Text>
        </View>
        <Switch
          value={recurring}
          onValueChange={setRecurring}
          trackColor={{ false: '#ddd', true: '#E94560' }}
          thumbColor="#fff"
        />
      </View>

      {/* Assignee */}
      <Text style={styles.label}>Responsável</Text>
      <View style={styles.chipRow}>
        {([['me', 'Eu'], ['partner', 'Cônjuge'], ['both', 'Ambos']] as const).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[styles.chip, assigneeChoice === val && styles.chipSelected]}
            onPress={() => setAssigneeChoice(val)}
          >
            <Text style={[styles.chipText, assigneeChoice === val && styles.chipTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {assigneeError ? <Text style={styles.errorText}>{assigneeError}</Text> : null}

      {/* Difficulty */}
      <Text style={styles.label}>Dificuldade</Text>
      <View style={styles.difficultyRow}>
        {DIFFICULTIES.map((d) => {
          const config = DIFFICULTY_CONFIG[d];
          return (
            <TouchableOpacity
              key={d}
              style={[styles.difficultyChip, difficulty === d && styles.chipSelected]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={styles.difficultyEmoji}>{config.emoji}</Text>
              <Text style={[styles.difficultyLabel, difficulty === d && styles.chipTextSelected]}>
                {config.label}
              </Text>
              <Text style={[styles.difficultyPoints, difficulty === d && styles.chipTextSelected]}>
                {config.points} pts
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {difficultyError ? <Text style={styles.errorText}>{difficultyError}</Text> : null}

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E94560',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: {
    borderColor: '#E94560',
    backgroundColor: '#E94560',
  },
  chipText: {
    fontSize: 14,
    color: '#555',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  recurringTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  recurringLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  recurringHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyChip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  difficultyEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  difficultyLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  difficultyPoints: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#E94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15,
  },
});
