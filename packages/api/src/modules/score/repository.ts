/**
 * Repository layer for the Productivity Score module.
 *
 * All SQLite queries needed for aggregating productivity metrics live here.
 * The service layer calls these functions to retrieve raw counts and data;
 * no `db.prepare(...)` calls should appear outside this file for the score module.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1
 */

import { db } from '../../db';

/**
 * Counts the total number of tasks in the database.
 *
 * @returns Total count of all tasks
 */
export function countTotalTasks(): number {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM tasks`);
  const result = stmt.get() as { c: number };
  return result.c;
}

/**
 * Counts the number of tasks with status 'done'.
 *
 * @returns Total count of completed tasks
 */
export function countDoneTasks(): number {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM tasks WHERE status = 'done'`);
  const result = stmt.get() as { c: number };
  return result.c;
}

/**
 * Counts the total number of reminders whose due_at has already passed.
 *
 * @param now - ISO 8601 timestamp representing the current instant
 * @returns Total count of past reminders
 */
export function countPastReminders(now: string): number {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM reminders WHERE due_at <= ?`);
  const result = stmt.get(now) as { c: number };
  return result.c;
}

/**
 * Counts the number of acknowledged reminders whose due_at has already passed.
 *
 * @param now - ISO 8601 timestamp representing the current instant
 * @returns Total count of acknowledged past reminders
 */
export function countAcknowledgedPastReminders(now: string): number {
  const stmt = db.prepare(
    `SELECT COUNT(*) AS c FROM reminders WHERE due_at <= ? AND acknowledged = 1`,
  );
  const result = stmt.get(now) as { c: number };
  return result.c;
}

/**
 * Retrieves the IDs of all active habits (active = 1).
 *
 * @returns Array of active habit UUID strings
 */
export function findActiveHabitIds(): string[] {
  const stmt = db.prepare(`SELECT id FROM habits WHERE active = 1`);
  const rows = stmt.all() as { id: string }[];
  return rows.map((row) => row.id);
}

/**
 * Retrieves all completion date strings for a specific habit, ordered descending.
 *
 * @param habitId - The UUID of the habit
 * @returns Array of YYYY-MM-DD completion date strings
 */
export function findCompletionDatesForHabit(habitId: string): string[] {
  const stmt = db.prepare(
    `SELECT completed_date FROM habit_completions WHERE habit_id = ? ORDER BY completed_date DESC`,
  );
  const rows = stmt.all(habitId) as { completed_date: string }[];
  return rows.map((row) => row.completed_date);
}
