/**
 * Repository layer for the Export module.
 *
 * All SQLite queries for dumping full datasets across all DailyFlow entities live here.
 * No `db.prepare(...)` calls should appear outside repository files.
 *
 * Requirements: 5.1, 5.5, 6.1
 */

import { db } from '../../db';

/**
 * Retrieves all rows from the tasks table.
 *
 * @returns Array of raw task records
 */
export function getAllTasks(): unknown[] {
  const stmt = db.prepare(`SELECT * FROM tasks`);
  return stmt.all();
}

/**
 * Retrieves all rows from the reminders table.
 *
 * @returns Array of raw reminder records
 */
export function getAllReminders(): unknown[] {
  const stmt = db.prepare(`SELECT * FROM reminders`);
  return stmt.all();
}

/**
 * Retrieves all rows from the habits table.
 *
 * @returns Array of raw habit records
 */
export function getAllHabits(): unknown[] {
  const stmt = db.prepare(`SELECT * FROM habits`);
  return stmt.all();
}

/**
 * Retrieves all rows from the habit_completions table.
 *
 * @returns Array of raw habit completion records
 */
export function getAllHabitCompletions(): unknown[] {
  const stmt = db.prepare(`SELECT * FROM habit_completions`);
  return stmt.all();
}
