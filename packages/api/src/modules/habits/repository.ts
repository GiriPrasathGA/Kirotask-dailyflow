/**
 * Repository layer for the Habits module.
 *
 * All SQLite queries for the habits table live here. Completion queries are
 * delegated to completionRepository and re-exported.
 *
 * Requirements: 3.1, 3.4, 6.1
 */

import { db } from '../../db';
import type { Habit } from './types';

export {
  findCompletionsForHabit,
  findCompletionByDate,
  insertCompletion,
} from './completionRepository';

// ── Raw row shapes ──────────────────────────────────────────────────────────

/**
 * Raw shape of a habit row as returned by better-sqlite3 (snake_case columns).
 * `active` is stored as INTEGER 0/1 in SQLite.
 */
interface HabitRow {
  id: string;
  name: string;
  description: string;
  frequency: string;
  active: number; // 0 or 1
  created_at: string;
}

// ── Row mappers ─────────────────────────────────────────────────────────────

/**
 * Maps a raw SQLite habit row (snake_case, INTEGER active) to the typed
 * Habit entity (camelCase, boolean active). The `streak` field is not stored
 * in the DB and is omitted from this mapper — the service attaches it separately.
 *
 * @param row - Raw row returned from better-sqlite3
 * @returns Typed Habit entity (without streak)
 */
function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    frequency: row.frequency as Habit['frequency'],
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

// ── Habit queries ───────────────────────────────────────────────────────────

/**
 * Retrieves a paginated list of active habits (active = 1).
 *
 * @param limit  - Maximum number of rows to return (pageSize)
 * @param offset - Number of rows to skip (0-indexed)
 * @returns Array of active Habit entities (without streak)
 */
export function findAllActiveHabits(limit: number, offset: number): Habit[] {
  const stmt = db.prepare(
    `SELECT * FROM habits WHERE active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  );
  const rows = stmt.all(limit, offset) as HabitRow[];
  return rows.map(rowToHabit);
}

/**
 * Counts the total number of active habits.
 *
 * @returns Total count of habits with active = 1
 */
export function countActiveHabits(): number {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM habits WHERE active = 1`);
  const result = stmt.get() as { c: number };
  return result.c;
}

/**
 * Retrieves a single habit by its UUID, regardless of active status.
 *
 * @param id - The habit's UUID
 * @returns The matching Habit entity (without streak), or null if not found
 */
export function findHabitById(id: string): Habit | null {
  const stmt = db.prepare(`SELECT * FROM habits WHERE id = ?`);
  const row = stmt.get(id) as HabitRow | undefined;
  return row ? rowToHabit(row) : null;
}

/**
 * Inserts a new habit row into the database.
 * The `streak` field is not persisted — it is computed at query time.
 *
 * @param habit - The fully-constructed Habit entity to insert (streak field excluded)
 * @returns void
 */
export function insertHabit(habit: Omit<Habit, 'streak'>): void {
  const stmt = db.prepare(`
    INSERT INTO habits (id, name, description, frequency, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    habit.id,
    habit.name,
    habit.description,
    habit.frequency,
    habit.active ? 1 : 0,
    habit.createdAt,
  );
}

/**
 * Applies a partial update to a habit row, modifying only the supplied fields.
 * Returns the updated Habit, or null if no row with the given id exists.
 *
 * @param id     - The habit's UUID
 * @param fields - Record of column-name → new-value pairs (snake_case column names)
 * @returns The updated Habit entity (without streak), or null if the habit was not found
 */
export function updateHabitFields(
  id: string,
  fields: Partial<Record<string, unknown>>,
): Habit | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return findHabitById(id);
  }

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const stmt = db.prepare(`UPDATE habits SET ${setClauses} WHERE id = ?`);
  const info = stmt.run([...values, id]);

  if (info.changes === 0) {
    return null;
  }
  return findHabitById(id);
}

/**
 * Soft-deletes a habit by setting its `active` flag to 0.
 * The habit row and its completions are preserved for score calculation history.
 *
 * @param id - The habit's UUID
 * @returns true if the habit was deactivated; false if no matching habit was found
 */
export function deactivateHabit(id: string): boolean {
  const stmt = db.prepare(`UPDATE habits SET active = 0 WHERE id = ?`);
  const info = stmt.run(id);
  return info.changes > 0;
}
