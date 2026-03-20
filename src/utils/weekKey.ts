import type { DayOfWeek } from '../types/task';

/**
 * Returns the ISO week key for a given date, e.g. "2026-W12".
 */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns a day-specific completion key, e.g. "2026-W12-1" for Monday of week 12.
 */
export function getDayWeekKey(weekKey: string, day: DayOfWeek): string {
  return `${weekKey}-${day}`;
}

/** ISO week order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0) */
const ISO_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

/**
 * Returns days from Monday through the given day in ISO order.
 * E.g. Wed(3) → [1,2,3], Sun(0) → [1,2,3,4,5,6,0]
 */
export function getWeekDaysUpTo(day: DayOfWeek): DayOfWeek[] {
  const idx = ISO_ORDER.indexOf(day);
  return ISO_ORDER.slice(0, idx + 1);
}
