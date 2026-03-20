import type { Task, DayOfWeek } from '../types/task';
import { getDayWeekKey, getWeekDaysUpTo } from './weekKey';

export interface VisibleTask {
  task: Task;
  /** The original scheduled day this instance refers to */
  scheduledDay: DayOfWeek;
  /** True if this task is accumulated from an earlier day */
  accumulated: boolean;
}

function isCompletedForDay(task: Task, weekKey: string, scheduledDay: DayOfWeek): boolean {
  if (task.recurring) {
    const dayKey = getDayWeekKey(weekKey, scheduledDay);
    if (dayKey in (task.completions ?? {})) return true;
    // Legacy compat: old key without day suffix
    if (weekKey in (task.completions ?? {})) return true;
    return false;
  }
  return task.completedBy !== null;
}

/**
 * Returns tasks visible on `viewDay`, including accumulated from earlier days.
 *
 * Rules:
 * - A task appears if natively scheduled for viewDay, OR if scheduled for an
 *   earlier day in the same week and not completed for that day.
 * - Accumulation only happens up to today (not into future days).
 * - Monday never looks back (no cross-week accumulation).
 * - At most one instance per task per day (deduplication).
 * - For recurring tasks with multiple days (e.g. Mon+Wed): if pending from Mon,
 *   it accumulates to Tue. On Wed, only the native Wed instance appears.
 */
export function getVisibleTasks(
  allTasks: Task[],
  viewDay: DayOfWeek,
  today: DayOfWeek,
  weekKey: string,
): VisibleTask[] {
  const daysUpToView = getWeekDaysUpTo(viewDay);
  const daysUpToToday = getWeekDaysUpTo(today);
  const viewIsReachable = daysUpToToday.includes(viewDay);
  const result: VisibleTask[] = [];

  for (const task of allTasks) {
    const nativelyScheduled = task.days.includes(viewDay);

    if (nativelyScheduled) {
      result.push({
        task,
        scheduledDay: viewDay,
        accumulated: false,
      });
    }

    // Check accumulation from earlier uncompleted scheduled days
    // Only if NOT natively scheduled on viewDay (avoid duplicate)
    // Only if viewDay is today or earlier (don't accumulate into the future)
    if (!nativelyScheduled && viewIsReachable) {
      // Find scheduled days before viewDay in this week
      const earlierScheduledDays = task.days
        .filter((d) => daysUpToView.includes(d) && d !== viewDay)
        .sort((a, b) => daysUpToView.indexOf(a) - daysUpToView.indexOf(b));

      // Check from latest to earliest — find the most recent scheduled day.
      // If it's uncompleted, accumulate it. If it's completed, stop — don't
      // look further back (completing Thu should not resurface Wed).
      for (let i = earlierScheduledDays.length - 1; i >= 0; i--) {
        const schedDay = earlierScheduledDays[i];

        if (task.recurring) {
          if (!isCompletedForDay(task, weekKey, schedDay)) {
            result.push({ task, scheduledDay: schedDay, accumulated: true });
          }
          break; // stop at the most recent scheduled day regardless
        } else {
          if (task.completedBy === null) {
            result.push({ task, scheduledDay: schedDay, accumulated: true });
          }
          break;
        }
      }
    }
  }

  return result;
}
