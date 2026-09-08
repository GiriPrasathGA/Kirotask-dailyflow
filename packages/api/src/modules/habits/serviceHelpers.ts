/**
 * Service helpers for the Habits module.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 6.1
 */

import type { Habit } from './types';
import * as repo from './repository';
import { computeStreak } from './streakUtils';

/**
 * Computes the streak for a habit and returns the habit with the streak attached.
 *
 * Uses the existing `computeStreak(Date[])` signature from streakUtils — this is
 * the buggy version that always returns 0 in non-UTC timezones. The timezone-aware
 * fix is deferred to Phase 6.
 *
 * @param habit - The Habit entity (without streak)
 * @returns The Habit entity with the `streak` field populated
 */
export function attachStreak(habit: Habit): Habit {
  const completions = repo.findCompletionsForHabit(habit.id);
  // Convert YYYY-MM-DD strings to Date objects for the existing computeStreak signature.
  // NOTE: new Date('YYYY-MM-DD') parses as UTC midnight — known limitation until Phase 6.
  const dates: Date[] = completions.map((c) => new Date(c.completedDate));
  const streak = computeStreak(dates);
  return { ...habit, streak };
}
