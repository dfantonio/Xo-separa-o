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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import type { RootStackParamList } from '../navigation/types';
import type { DayOfWeek, AssignedTo, Difficulty } from '../types/task';
import { createTask, updateTask } from '../services/taskService';
import DaySelector from '../components/CreateTask/DaySelector';
import RecurringToggle from '../components/CreateTask/RecurringToggle';
import AssigneePicker, { type AssigneeChoice } from '../components/CreateTask/AssigneePicker';
import DifficultyPicker from '../components/CreateTask/DifficultyPicker';

type NavigationProp = StackNavigationProp<RootStackParamList, 'CreateTask'>;
type CreateTaskRouteProp = RouteProp<RootStackParamList, 'CreateTask'>;

export default function CreateTaskScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateTaskRouteProp>();
  const editingTask = route.params?.task;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [name, setName] = useState(editingTask?.name ?? '');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(editingTask?.days ?? []);
  const [recurring, setRecurring] = useState(editingTask?.recurring ?? true);
  const [assigneeChoice, setAssigneeChoice] = useState<AssigneeChoice | null>(null);
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
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</Text>

      {/* Nome */}
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

      <DaySelector selected={selectedDays} onToggle={toggleDay} error={dayError} />
      <RecurringToggle value={recurring} onChange={setRecurring} />
      <AssigneePicker
        value={assigneeChoice}
        onChange={setAssigneeChoice}
        sessionId={sessionId}
        memberId={memberId}
        error={assigneeError}
      />
      <DifficultyPicker value={difficulty} onChange={setDifficulty} error={difficultyError} />

      <View style={styles.spacer} />

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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, padding: 24, paddingTop: 56 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E94560',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  inputError: { borderColor: '#e74c3c' },
  charCount: { fontSize: 12, color: '#aaa', textAlign: 'right', marginTop: 4 },
  errorText: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
  saveButton: {
    backgroundColor: '#E94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#888', fontSize: 15 },
  spacer: { flexGrow: 1, minHeight: 32 },
});
