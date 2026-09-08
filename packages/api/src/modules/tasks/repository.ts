/**
 * Repository layer for the Tasks module.
 *
 * All SQLite queries for the tasks table live here. The service layer calls
 * these functions; no `db.prepare(...)` calls should appear outside this file
 * for the tasks module.
 *
 * Requirements: 1.1, 6.1
 */

import { db } from '../../db';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from './types';

/**
 * Raw shape of a task row as returned by better-sqlite3 (snake_case columns).
 */
interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
  created_at: string;
}

/**
 * Maps a raw SQLite task row (snake_case) to the typed Task entity (camelCase).
 *
 * @param row - Raw row returned from better-sqlite3
 * @returns Typed Task entity
 */
function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    category: row.category as TaskCategory,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

/**
 * Filter parameters for querying tasks.
 */
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
}

/**
 * Builds a WHERE clause and param array from the given filter options.
 *
 * @param filters - Optional filter values; undefined fields are ignored
 * @returns Object containing the SQL WHERE clause string and bound parameters array
 */
function buildWhereClause(filters: TaskFilters): { clause: string; params: string[] } {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.status !== undefined) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.category !== undefined) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.priority !== undefined) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/**
 * Retrieves a paginated list of tasks, optionally filtered by status, category, or priority.
 *
 * @param filters - Optional filter criteria (status, category, priority)
 * @param limit   - Maximum number of rows to return (pageSize)
 * @param offset  - Number of rows to skip (0-indexed)
 * @returns Array of Task entities matching the query
 */
export function findAllTasks(filters: TaskFilters, limit: number, offset: number): Task[] {
  const { clause, params } = buildWhereClause(filters);
  const stmt = db.prepare(
    `SELECT * FROM tasks ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  );
  const rows = stmt.all([...params, limit, offset]) as TaskRow[];
  return rows.map(rowToTask);
}

/**
 * Counts the total number of tasks matching the given filters.
 *
 * @param filters - Optional filter criteria (status, category, priority)
 * @returns Total count of matching tasks
 */
export function countTasks(filters: TaskFilters): number {
  const { clause, params } = buildWhereClause(filters);
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM tasks ${clause}`);
  const result = stmt.get(params) as { c: number };
  return result.c;
}

/**
 * Retrieves a single task by its UUID.
 *
 * @param id - The task's UUID
 * @returns The matching Task entity, or null if not found
 */
export function findTaskById(id: string): Task | null {
  const stmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
  const row = stmt.get(id) as TaskRow | undefined;
  return row ? rowToTask(row) : null;
}

/**
 * Inserts a new task row into the database.
 *
 * @param task - The fully-constructed Task entity to insert
 * @returns void
 */
export function insertTask(task: Task): void {
  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, category, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    task.id,
    task.title,
    task.description,
    task.status,
    task.priority,
    task.category,
    task.dueDate,
    task.createdAt,
  );
}

/**
 * Applies a partial update to a task row, updating only the supplied fields.
 * Returns the updated Task, or null if no row with the given id exists.
 *
 * @param id     - The task's UUID
 * @param fields - Record of column-name → new-value pairs (snake_case column names)
 * @returns The updated Task entity, or null if the task was not found
 */
export function updateTaskFields(
  id: string,
  fields: Partial<Record<string, unknown>>,
): Task | null {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return findTaskById(id);
  }

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ');
  const values = entries.map(([, val]) => val);

  const stmt = db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`);
  const info = stmt.run([...values, id]);

  if (info.changes === 0) {
    return null;
  }
  return findTaskById(id);
}

/**
 * Deletes a task row by its UUID.
 *
 * @param id - The task's UUID
 * @returns true if a row was deleted, false if no matching row existed
 */
export function deleteTaskById(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM tasks WHERE id = ?`);
  const info = stmt.run(id);
  return info.changes > 0;
}
