/**
 * Service layer for the Reminders module.
 *
 * Contains all validation and business logic for reminder operations. Calls the
 * repository for database access. Throws `ServiceError` for validation failures
 * (400) and missing records (404) so the router layer can convert these to the
 * correct HTTP responses without understanding DB details.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.5, 6.7
 */

import { randomUUID } from 'crypto';
import type { PaginatedResponse } from '../../types/shared';
import type { Reminder, CreateReminderDto, PatchReminderDto } from './types';
import * as repo from './repository';
import {
  validatePagination,
  validateTitle,
  validateDueAt,
} from './validation';

export { ServiceError } from './validation';

// ── Public service functions ────────────────────────────────────────────────

/**
 * Returns a paginated list of reminders sorted by `dueAt` ascending.
 *
 * @param page     - 1-indexed page number; defaults to 1
 * @param pageSize - Number of items per page (1–100); defaults to 20
 * @returns Paginated response containing Reminder entities and pagination metadata
 * @throws ServiceError(400) if pagination params are invalid
 */
export function listReminders(
  page?: number,
  pageSize?: number,
): PaginatedResponse<Reminder> {
  const { page: p, pageSize: ps } = validatePagination(page, pageSize);
  const offset = (p - 1) * ps;
  const total = repo.countReminders();
  const items = repo.findAllReminders(ps, offset);

  return { items, meta: { page: p, pageSize: ps, total } };
}

/**
 * Creates a new reminder after validating the required fields.
 *
 * @param dto - Data-transfer object containing `title` and `dueAt`
 * @returns The newly created Reminder entity with a generated id and createdAt timestamp
 * @throws ServiceError(400) for any validation failure
 */
export function createReminder(dto: CreateReminderDto): Reminder {
  validateTitle(dto.title);
  validateDueAt(dto.dueAt);

  const reminder: Reminder = {
    id: randomUUID(),
    title: dto.title,
    dueAt: dto.dueAt,
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };

  repo.insertReminder(reminder);
  return reminder;
}

/**
 * Retrieves a single reminder by its UUID.
 * Returns null if no reminder with the given id exists — the router decides
 * whether to convert this to a 404.
 *
 * @param id - The UUID of the reminder to retrieve
 * @returns The Reminder entity, or null if not found
 */
export function getReminderById(id: string): Reminder | null {
  return repo.findReminderById(id);
}

/**
 * Applies a partial update to an existing reminder.
 * Only the fields supplied in `dto` are modified; all others remain unchanged.
 *
 * @param id  - The UUID of the reminder to update
 * @param dto - Partial data-transfer object; only supplied fields are applied
 * @returns The updated Reminder entity, or null if no reminder with the given id was found
 * @throws ServiceError(400) for any validation failure on supplied fields
 */
export function updateReminder(id: string, dto: PatchReminderDto): Reminder | null {
  const existing = repo.findReminderById(id);
  if (!existing) {
    return null;
  }

  // Validate each supplied field
  if (dto.title !== undefined) validateTitle(dto.title);
  if (dto.dueAt !== undefined) validateDueAt(dto.dueAt);

  // Map camelCase DTO fields to snake_case DB columns
  const dbFields: Partial<Record<string, unknown>> = {};
  if (dto.title !== undefined) dbFields['title'] = dto.title;
  if (dto.dueAt !== undefined) dbFields['due_at'] = dto.dueAt;

  return repo.updateReminderFields(id, dbFields);
}

/**
 * Deletes a reminder by its UUID.
 *
 * @param id - The UUID of the reminder to delete
 * @returns true if the reminder was deleted; false if no reminder with the given id was found
 */
export function deleteReminder(id: string): boolean {
  return repo.deleteReminderById(id);
}

/**
 * Acknowledges a reminder, setting its `acknowledged` flag to `true`.
 *
 * This operation is idempotent — calling it on an already-acknowledged reminder
 * returns HTTP 200 with no error and leaves the state unchanged (Requirement 2.4).
 *
 * @param id - The UUID of the reminder to acknowledge
 * @returns The updated Reminder entity with `acknowledged = true`, or null if not found
 */
export function acknowledgeReminder(id: string): Reminder | null {
  // First check existence so we can distinguish 404 from the idempotent-already-acked case
  const existing = repo.findReminderById(id);
  if (!existing) {
    return null;
  }

  // setAcknowledged is safe to call even when acknowledged is already 1
  return repo.setAcknowledged(id);
}
