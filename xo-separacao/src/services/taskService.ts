import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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

function docToTask(docSnap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    dayOfWeek: data.dayOfWeek,
    assignedTo: data.assignedTo,
    difficulty: data.difficulty,
    points: data.points,
    completedBy: data.completedBy ?? null,
    completedAt: data.completedAt ?? null,
    createdAt: data.createdAt,
  };
}

export async function createTask(
  sessionId: string,
  params: {
    name: string;
    dayOfWeek: DayOfWeek;
    assignedTo: AssignedTo;
    difficulty: Difficulty;
  }
): Promise<string> {
  const points = DIFFICULTY_CONFIG[params.difficulty].points;
  const tasksRef = collection(db, 'sessions', sessionId, 'tasks');
  const docRef = await addDoc(tasksRef, {
    name: params.name,
    dayOfWeek: params.dayOfWeek,
    assignedTo: params.assignedTo,
    difficulty: params.difficulty,
    points,
    completedBy: null,
    completedAt: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(
  sessionId: string,
  taskId: string,
  updates: Partial<Pick<Task, 'name' | 'dayOfWeek' | 'assignedTo' | 'difficulty' | 'completedBy' | 'completedAt'>>
): Promise<void> {
  const taskRef = doc(db, 'sessions', sessionId, 'tasks', taskId);
  const payload: DocumentData = { ...updates };
  if (updates.difficulty) {
    payload.points = DIFFICULTY_CONFIG[updates.difficulty].points;
  }
  await updateDoc(taskRef, payload);
}

export async function deleteTask(sessionId: string, taskId: string): Promise<void> {
  const taskRef = doc(db, 'sessions', sessionId, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function getTasksForDay(sessionId: string, dayOfWeek: DayOfWeek): Promise<Task[]> {
  const tasksRef = collection(db, 'sessions', sessionId, 'tasks');
  const q = query(tasksRef, where('dayOfWeek', '==', dayOfWeek));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}

export async function toggleTaskComplete(
  sessionId: string,
  taskId: string,
  memberId: string
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
      if (taskData.completedBy !== memberId) {
        throw new Error('Only the person who completed this task can unmark it');
      }
      transaction.update(taskRef, {
        completedBy: null,
        completedAt: null,
      });
      transaction.update(sessionRef, {
        [`${memberId}.score`]: increment(-points),
      });
      return { action: 'uncompleted' as const, points };
    }
  });
}
