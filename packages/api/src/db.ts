import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'db.sqlite');

mkdirSync(DB_DIR, { recursive: true });

/**
 * Singleton SQLite database instance.
 * Uses better-sqlite3 for synchronous, low-overhead database access.
 */
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialises the database schema.
 * Safe to call on every startup — uses IF NOT EXISTS for idempotency.
 * @returns void
 */
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Tasks ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT    PRIMARY KEY,
      title       TEXT    NOT NULL CHECK(length(title) >= 1 AND length(title) <= 200),
      description TEXT    NOT NULL DEFAULT '' CHECK(length(description) <= 1000),
      status      TEXT    NOT NULL DEFAULT 'todo'
                          CHECK(status IN ('todo','in_progress','done')),
      priority    TEXT    NOT NULL CHECK(priority IN ('low','medium','high')),
      category    TEXT    NOT NULL CHECK(category IN ('work','personal','health')),
      due_date    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

    -- ── Reminders ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS reminders (
      id           TEXT    PRIMARY KEY,
      title        TEXT    NOT NULL CHECK(length(title) >= 1 AND length(title) <= 200),
      due_at       TEXT    NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0 CHECK(acknowledged IN (0,1)),
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_due_at       ON reminders(due_at);
    CREATE INDEX IF NOT EXISTS idx_reminders_acknowledged ON reminders(acknowledged);

    -- ── Habits ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT    PRIMARY KEY,
      name        TEXT    NOT NULL CHECK(length(name) >= 1 AND length(name) <= 200),
      description TEXT    NOT NULL DEFAULT '' CHECK(length(description) <= 500),
      frequency   TEXT    NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily')),
      active      INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(active);

    -- ── Habit Completions ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS habit_completions (
      id             TEXT PRIMARY KEY,
      habit_id       TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      completed_date TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(habit_id, completed_date)
    );

    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
  `);
}
