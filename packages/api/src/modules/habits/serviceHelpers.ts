/**
 * Service helpers for the Habits module.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 6.1
 */

import type { Habit } from './types';
import * as repo from './repository';
import { computeStreak, todayInTimezone } from './streakUtils';

/**
 * Computes the streak and checked-in status for a habit in the given timezone.
 *
 * @param habit - The Habit entity (without streak)
 * @param timezone - IANA timezone identifier (e.g. 'UTC', 'Asia/Kolkata')
 * @returns The Habit entity with `streak` and `checkedInToday` populated
 */
export function attachStreak(habit: Habit, timezone: string = 'UTC'): Habit {
  const completions = repo.findCompletionsForHabit(habit.id);
  const completedDates = completions.map((c) => c.completedDate);
  const today = todayInTimezone(timezone);
  const streak = computeStreak(completedDates, today);
  const checkedInToday = completedDates.includes(today);
  return { ...habit, streak, checkedInToday };
}

