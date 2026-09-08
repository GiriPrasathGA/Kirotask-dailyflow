/**
 * TypeScript type definitions for the Reminders module.
 *
 * Defines the core Reminder entity and the data-transfer objects used for
 * creating and partially updating reminders. Reminders carry a due date-time
 * and an acknowledgement flag that tracks whether the user has dismissed them.
 *
 * Requirements: 2.2
 */

/**
 * Represents a persisted Reminder entity.
 */
export interface Reminder {
  id: string;
  title: string;
  dueAt: string;        // ISO 8601 date-time
  acknowledged: boolean;
  createdAt: string;    // ISO 8601
}

/**
 * Data-transfer object for creating a new Reminder.
 * Both `title` and `dueAt` are required.
 */
export interface CreateReminderDto {
  title: string;
  dueAt: string;
}

/**
 * Data-transfer object for partially updating an existing Reminder.
 * All fields are optional; only supplied fields are applied.
 */
export interface PatchReminderDto {
  title?: string;
  dueAt?: string;
}
