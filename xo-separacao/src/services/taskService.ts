import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteField,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
  increment,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, DayOfWeek, AssignedTo, Difficulty, Points } from '../types/task';
import { DIFFICULTY_CONFIG } from '../constants/difficulty';

export function docToTask(docSnap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    days: data.days ?? [data.dayOfWeek],
    recurring: data.recurring ?? false,
    assignedTo: data.assignedTo,
    difficulty: data.difficulty,
    points: data.points,
    completedBy: data.completedBy ?? null,
    completedAt: data.completedAt ?? null,
    completions: data.completions ?? {},
    createdAt: data.createdAt,
  };
}

export async function createTask(
  sessionId: string,
  params: {
    name: string;
    days: DayOfWeek[];
    recurring: boolean;
    assignedTo: AssignedTo;
    difficulty: Difficulty;
  }
): Promise<string> {
  const points = DIFFICULTY_CONFIG[params.difficulty].points;
  const tasksRef = collection(db, 'sessions', sessionId, 'tasks');
  const docRef = await addDoc(tasksRef, {
    name: params.name,
    days: params.days,
    recurring: params.recurring,
    assignedTo: params.assignedTo,
    difficulty: params.difficulty,
    points,
    completedBy: null,
    completedAt: null,
    completions: {},
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(
  sessionId: string,
  taskId: string,
  updates: Partial<Pick<Task, 'name' | 'days' | 'recurring' | 'assignedTo' | 'difficulty'>>
): Promise<void> {
  const taskRef = doc(db, 'sessions', sessionId, 'tasks', taskId);
  const payload: DocumentData = { ...updates };
  if (updates.difficulty) {
    payload.points = DIFFICULTY_CONFIG[updates.difficulty].points;
  }
  await updateDoc(taskRef, payload);
}

export async function deleteTask(sessionId: string, taskId: string, weekKey: string): Promise<void> {
  const taskRef = doc(db, 'sessions', sessionId, 'tasks', taskId);
  const sessionRef = doc(db, 'sessions', sessionId);

  await runTransaction(db, async (transaction) => {
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) return;

    const taskData = taskSnap.data();
    const points = taskData.points as Points;
    const isRecurring = taskData.recurring ?? false;

    if (isRecurring) {
      const completions = taskData.completions ?? {};
      if (completions[weekKey]) {
        const completer = completions[weekKey].by as string;
        transaction.update(sessionRef, {
          [`${completer}.score`]: increment(-points),
        });
      }
    } else {
      if (taskData.completedBy) {
        const completer = taskData.completedBy as string;
        transaction.update(sessionRef, {
          [`${completer}.score`]: increment(-points),
        });
      }
    }

    transaction.delete(taskRef);
  });
}

export async function getTasksForDay(sessionId: string, day: DayOfWeek): Promise<Task[]> {
  const tasksRef = collection(db, 'sessions', sessionId, 'tasks');
  const q = query(tasksRef, where('days', 'array-contains', day));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}

export async function toggleTaskComplete(
  sessionId: string,
  taskId: string,
  memberId: string,
  weekKey: string
): Promise<{ action: 'completed' | 'uncompleted'; points: Points }> {
  const taskRef = doc(db, 'sessions', sessionId, 'tasks', taskId);
  const sessionRef = doc(db, 'sessions', sessionId);

  return runTransaction(db, async (transaction) => {
    const taskSnap = await transaction.get(taskRef);
    const sessionSnap = await transaction.get(sessionRef);

    if (!taskSnap.exists() || !sessionSnap.exists()) {
      throw new Error('Task or session not found');
    }

    const taskData = taskSnap.data();
    const points = taskData.points as Points;
    const isRecurring = taskData.recurring ?? false;

    if (isRecurring) {
      const completions = taskData.completions ?? {};
      if (!completions[weekKey]) {
        transaction.update(taskRef, {
          [`completions.${weekKey}`]: { by: memberId, at: serverTimestamp() },
        });
        transaction.update(sessionRef, {
          [`${memberId}.score`]: increment(points),
        });
        return { action: 'completed' as const, points };
      } else {
        const originalCompleter = completions[weekKey].by as string;
        transaction.update(taskRef, {
          [`completions.${weekKey}`]: deleteField(),
        });
        transaction.update(sessionRef, {
          [`${originalCompleter}.score`]: increment(-points),
        });
        return { action: 'uncompleted' as const, points };
      }
    } else {
      if (taskData.completedBy === null) {
        transaction.update(taskRef, {
          completedBy: memberId,
          completedAt: serverTimestamp(),
        });
        transaction.update(sessionRef, {
          [`${memberId}.score`]: increment(points),
        });
        return { action: 'completed' as const, points };
      } else {
        const originalCompleter = taskData.completedBy as string;
        transaction.update(taskRef, {
          completedBy: null,
          completedAt: null,
        });
        transaction.update(sessionRef, {
          [`${originalCompleter}.score`]: increment(-points),
        });
        return { action: 'uncompleted' as const, points };
      }
    }
  });
}
