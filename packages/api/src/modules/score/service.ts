/**
 * Service layer for the Productivity Score module.
 *
 * Contains the business logic for calculating the aggregated productivity score
 * from Tasks, Reminders, and Habits data. All database access is delegated to
 * the score repository.
 *
 * Formula:
 *   Score = ((Task_Completion_Rate * 0.4) + (Reminder_Ack_Rate * 0.3) + (Habit_Streak_Consistency * 0.3)) * 100
 *
 * Rounded to 2 decimal places. All component rates are in the range [0, 1].
 *
 * Zero-denominator behavior:
 *   - totalTasks = 0 -> taskCompletionRate = 0
 *   - pastTotalReminders = 0 -> reminderAckRate = 0
 *   - activeHabits = 0 -> habitStreakConsistency = 0
 *
 * KNOWN LIMITATION (Phase 6): `computeStreak` uses the existing Date[] signature
 * from streakUtils.ts which is UTC-based. The timezone argument is accepted for
 * future compatibility with Phase 6.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import * as repo from './repository';
import { computeStreak, todayInTimezone } from '../habits/streakUtils';

/**
 * Composite Productivity Score data payload.
 */
export interface ScoreData {
  score: number;                  // 0–100, rounded to 2 decimal places
  taskCompletionRate: number;     // 0–1
  reminderAckRate: number;        // 0–1
  habitStreakConsistency: number; // 0–1
}

/**
 * Computes the Productivity Score and its three component rates.
 *
 * @param timezone - IANA timezone identifier (e.g. 'UTC', 'America/New_York'); defaults to 'UTC'
 * @returns ScoreData containing the overall score and individual component rates
 */
export function computeScore(timezone: string = 'UTC'): ScoreData {
  // ── Task Completion Rate (TCR) ──────────────────────────────────────────
  // Ratio of tasks with status = 'done' to total tasks (0 if no tasks)
  const totalTasks = repo.countTotalTasks();
  const doneTasks = repo.countDoneTasks();
  const tcr = totalTasks === 0 ? 0 : doneTasks / totalTasks;

  // ── Reminder Acknowledgement Rate (RAR) ─────────────────────────────────
  // Ratio of acknowledged past reminders to total past reminders (due_at ≤ now)
  const now = new Date().toISOString();
  const pastTotal = repo.countPastReminders(now);
  const acked = repo.countAcknowledgedPastReminders(now);
  const rar = pastTotal === 0 ? 0 : acked / pastTotal;

  // ── Habit Streak Consistency (HSC) ──────────────────────────────────────
  // Ratio of active habits with streak ≥ 1 to total active habits
  const activeHabitIds = repo.findActiveHabitIds();
  const today = todayInTimezone(timezone);

  let habitsWithStreak = 0;
  if (activeHabitIds.length > 0) {
    for (const habitId of activeHabitIds) {
      const completionDates = repo.findCompletionDatesForHabit(habitId);
      const streak = computeStreak(completionDates, today);
      if (streak >= 1) {
        habitsWithStreak++;
      }
    }
  }

  const hsc = activeHabitIds.length === 0 ? 0 : habitsWithStreak / activeHabitIds.length;

  // ── Overall Score Calculation ───────────────────────────────────────────
  // Step 1: Compute raw score in 0–100 range
  const rawScore = (tcr * 0.4 + rar * 0.3 + hsc * 0.3) * 100;
  // Step 2: Round to 2 decimal places
  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    taskCompletionRate: tcr,
    reminderAckRate: rar,
    habitStreakConsistency: hsc,
  };
}
