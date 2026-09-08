/**
 * Repository layer for Habit Completion records.
 *
 * All SQLite queries for the habit_completions table live here.
 *
 * Requirements: 3.1, 3.4, 6.1
 */

import { db } from '../../db';
import type { HabitCompletion } from './types';

/**
 * Raw shape of a habit_completion row as returned by better-sqlite3.
 */
interface CompletionRow {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

/**
 * Maps a raw SQLite habit_completion row (snake_case) to the typed
 * HabitCompletion entity (camelCase).
 *
 * @param row - Raw row returned from better-sqlite3
 * @returns Typed HabitCompletion entity
 */
function rowToCompletion(row: CompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    completedDate: row.completed_date,
    createdAt: row.created_at,
  };
}

/**
 * Retrieves all completion records for a given habit, ordered by completed_date descending.
 *
 * @param habitId - The UUID of the habit whose completions are requested
 * @returns Array of HabitCompletion entities for the given habit
 */
export function findCompletionsForHabit(habitId: string): HabitCompletion[] {
  const stmt = db.prepare(
    `SELECT * FROM habit_completions WHERE habit_id = ? ORDER BY completed_date DESC`,
  );
  const rows = stmt.all(habitId) as CompletionRow[];
  return rows.map(rowToCompletion);
}

/**
 * Retrieves a single completion record for a specific habit and calendar date.
 *
 * @param habitId - The UUID of the habit to look up
 * @param date    - The calendar date string in YYYY-MM-DD format
 * @returns The matching HabitCompletion entity, or null if no completion exists for that date
 */
export function findCompletionByDate(habitId: string, date: string): HabitCompletion | null {
  const stmt = db.prepare(
    `SELECT * FROM habit_completions WHERE habit_id = ? AND completed_date = ?`,
  );
  const row = stmt.get(habitId, date) as CompletionRow | undefined;
  return row ? rowToCompletion(row) : null;
}

/**
 * Inserts a new habit_completion row into the database.
 *
 * @param completion - The fully-constructed HabitCompletion entity to insert
 * @returns void
 */
export function insertCompletion(completion: HabitCompletion): void {
  const stmt = db.prepare(`
    INSERT INTO habit_completions (id, habit_id, completed_date, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(
    completion.id,
    completion.habitId,
    completion.completedDate,
    completion.createdAt,
  );
}
