/**
 * Frontend type definitions for the Reminders feature.
 *
 * Defines the Reminder entity matching the API contract for the reminders list.
 *
 * Requirements: 2.2
 */

/**
 * Represents a Reminder entity displayed in the reminder list.
 */
export interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  acknowledged: boolean;
  createdAt: string;
}
