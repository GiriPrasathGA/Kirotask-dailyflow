/**
 * Frontend type definitions for the Habits feature.
 *
 * Defines the Habit entity matching the API contract for habit tracking.
 *
 * Requirements: 3.2
 */

/**
 * Represents a Habit entity displayed in the habit tracker.
 */
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily';
  active: boolean;
  createdAt: string;
  streak?: number;
  checkedInToday?: boolean;
}
