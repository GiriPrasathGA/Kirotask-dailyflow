/**
 * Repository layer for the Reminders module.
 *
 * All SQLite queries for the reminders table live here. The service layer calls
 * these functions; no `db.prepare(...)` calls should appear outside this file
 * for the reminders module.
 *
 * Requirements: 2.1, 6.1
 */

import { db } from '../../db';
import type { Reminder } from './types';

/**
 * Raw shape of a reminder row as returned by better-sqlite3 (snake_case columns).
 * `acknowledged` is stored as INTEGER 0/1 in SQLite.
 */
interface ReminderRow {
  id: string;
  title: string;
  due_at: string;
  acknowledged: number; // 0 or 1
  created_at: string;
}

/**
 * Maps a raw SQLite reminder row (snake_case, INTEGER acknowledged) to the typed
 * Reminder entity (camelCase, boolean acknowledged).
 *
 * @param row - Raw row returned from better-sqlite3
 * @returns Typed Reminder entity
 */
function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    dueAt: row.due_at,
    acknowledged: row.acknowledged === 1,
    createdAt: row.created_at,
  };
}

/**
 * Retrieves a paginated list of reminders ordered by `due_at` ascending.
 *
 * @param limit  - Maximum number of rows to return (pageSize)
 * @param offset - Number of rows to skip (0-indexed)
 * @returns Array of Reminder entities ordered earliest-first
 */
export function findAllReminders(limit: number, offset: number): Reminder[] {
  const stmt = db.prepare(
    `SELECT * FROM reminders ORDER BY due_at ASC LIMIT ? OFFSET ?`,
  );
  const rows = stmt.all(limit, offset) as ReminderRow[];
  return rows.map(rowToReminder);
}

/**
 * Counts the total number of reminders in the table.
 *
 * @returns Total count of all stored reminders
 */
export function countReminders(): number {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM reminders`);
  const result = stmt.get() as { c: number };
  return result.c;
}

/**
 * Retrieves a single reminder by its UUID.
 *
 * @param id - The reminder's UUID
 * @returns The matching Reminder entity, or null if not found
 */
export function findReminderById(id: string): Reminder | null {
  const stmt = db.prepare(`SELECT * FROM reminders WHERE id = ?`);
  const row = stmt.get(id) as ReminderRow | undefined;
  return row ? rowToReminder(row) : null;
}

/**
 * Inserts a new reminder row into the database.
 *
 * @param reminder - The fully-constructed Reminder entity to insert
 * @returns void
 */
export function insertReminder(reminder: Reminder): void {
  const stmt = db.prepare(`
    INSERT INTO reminders (id, title, due_at, acknowledged, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    reminder.id,
    reminder.title,
    reminder.dueAt,
    reminder.acknowledged ? 1 : 0,
    reminder.createdAt,
  );
}

/**
 * Applies a partial update to a reminder row, modifying only the supplied fields.
 * Returns the updated Reminder, or null if no row with the given id exists.
 *
 * @param id     - The reminder's UUID
 * @param fields - Record of column-name → new-value pairs (snake_case column names)
 * @returns The updated Reminder entity, or null if the reminder was not found
 */
export function updateReminderFields(
  id: string,
  fields: Partial<Record<string, unknown>>,
): Reminder | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return findReminderById(id);
  }

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const stmt = db.prepare(`UPDATE reminders SET ${setClauses} WHERE id = ?`);
  const info = stmt.run([...values, id]);

  if (info.changes === 0) {
    return null;
  }
  return findReminderById(id);
}

/**
 * Sets `acknowledged = 1` on the reminder with the given id.
 * This operation is idempotent — calling it on an already-acknowledged reminder
 * is safe and returns the current state.
 *
 * @param id - The reminder's UUID
 * @returns The updated Reminder entity, or null if the reminder was not found
 */
export function setAcknowledged(id: string): Reminder | null {
  const stmt = db.prepare(`UPDATE reminders SET acknowledged = 1 WHERE id = ?`);
  const info = stmt.run(id);

  if (info.changes === 0) {
    // Row did not exist — return null to let service decide 404
    return null;
  }
  return findReminderById(id);
}

/**
 * Deletes a reminder row by its UUID.
 *
 * @param id - The reminder's UUID
 * @returns true if a row was deleted, false if no matching row existed
 */
export function deleteReminderById(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM reminders WHERE id = ?`);
  const info = stmt.run(id);
  return info.changes > 0;
}
