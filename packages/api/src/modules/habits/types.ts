/**
 * TypeScript type definitions for the Habits module.
 *
 * Defines the core Habit entity, its completion records, and the data-transfer
 * objects used for creating habits. Habits are recurring daily activities;
 * each check-in creates a HabitCompletion for the current calendar day in the
 * caller's timezone. Streaks are computed from completion history and attached
 * to Habit responses at query time.
 *
 * Requirements: 3.2
 */

/** The supported recurrence frequency for a Habit (currently daily only). */
export type HabitFrequency = 'daily';

/**
 * Represents a persisted Habit entity.
 * The `streak` field is populated only on GET responses, not stored in the DB.
 */
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  active: boolean;
  createdAt: string;    // ISO 8601
  streak?: number;      // populated by GET /habits
  checkedInToday?: boolean; // populated by GET /habits
}

/**
 * Represents a single daily check-in record for a Habit.
 * `completedDate` is stored as a YYYY-MM-DD string in the caller's timezone.
 */
export interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string; // YYYY-MM-DD in the requested timezone
  createdAt: string;     // ISO 8601
}

/**
 * Data-transfer object for creating a new Habit.
 * Only `name` is required; all other fields default on the server side.
 */
export interface CreateHabitDto {
  name: string;
  description?: string;
  frequency?: HabitFrequency;
}
