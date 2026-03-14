import { Difficulty, Points } from '../types/task';

interface DifficultyConfig {
  label: string;
  emoji: string;
  points: Points;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Fácil', emoji: '🟢', points: 5 },
  medium: { label: 'Médio', emoji: '🟡', points: 10 },
  hard: { label: 'Difícil', emoji: '🟠', points: 20 },
  heroic: { label: 'Heroico', emoji: '🔴', points: 40 },
};
