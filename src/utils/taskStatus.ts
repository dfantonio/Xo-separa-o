import type { Task, DayOfWeek } from '../types/task';
import { getDayWeekKey } from './weekKey';

export function isCompletedForDay(task: Task, weekKey: string, scheduledDay: DayOfWeek): boolean {
  if (task.recurring) {
    const dayKey = getDayWeekKey(weekKey, scheduledDay);
    if (dayKey in (task.completions ?? {})) return true;
    if (weekKey in (task.completions ?? {})) return true; // legacy
    return false;
  }
  return task.completedBy !== null;
}
