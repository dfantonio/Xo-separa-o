import { Timestamp } from 'firebase/firestore';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AssignedTo = 'memberA' | 'memberB' | 'both';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'heroic';
export type Points = 5 | 10 | 20 | 40;
export type ScoringMode = 'split' | 'completer';

export interface WeekCompletion {
  by: string;
  at: Timestamp;
}

export interface Task {
  id: string;
  name: string;
  days: DayOfWeek[];
  recurring: boolean;
  assignedTo: AssignedTo;
  scoringMode: ScoringMode;
  difficulty: Difficulty;
  points: Points;
  completedBy: string | null;
  completedAt: Timestamp | null;
  completions: Record<string, WeekCompletion>;
  createdAt: Timestamp;
}
