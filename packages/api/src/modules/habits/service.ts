/**
 * Service layer for the Habits module.
 *
 * Contains all validation and business logic for habit operations and check-ins.
 * Calls the repository for database access. Throws `ServiceError` for validation
 * failures (400), missing records (404), and conflict conditions (409) so the
 * router layer can convert these to the correct HTTP responses.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 6.1
 */

import { randomUUID } from 'crypto';
import type { PaginatedResponse } from '../../types/shared';
import type { Habit, HabitCompletion, CreateHabitDto } from './types';
import * as repo from './repository';
import { attachStreak } from './serviceHelpers';
import { todayInTimezone } from './streakUtils';
import {
  ServiceError,
  validatePagination,
  validateName,
  validateDescription,
} from './validation';

export { ServiceError } from './validation';

// ── Public service functions ────────────────────────────────────────────────

/**
 * Returns a paginated list of active habits, each with a current streak attached.
 *
 * @param timezoneOrPage - IANA timezone identifier (string) or page number
 * @param pageOrPageSize - 1-indexed page number (if timezone passed) or pageSize
 * @param pageSizeParam  - Number of items per page (1–100)
 * @returns Paginated response containing active Habit entities with streak populated
 * @throws ServiceError(400) if pagination params are invalid
 */
export function listHabits(
  timezoneOrPage?: string | number,
  pageOrPageSize?: number,
  pageSizeParam?: number,
): PaginatedResponse<Habit> {
  let timezone = 'UTC';
  let page: number | undefined;
  let pageSize: number | undefined;

  if (typeof timezoneOrPage === 'string') {
    timezone = timezoneOrPage;
    page = pageOrPageSize;
    pageSize = pageSizeParam;
  } else {
    page = timezoneOrPage;
    pageSize = pageOrPageSize;
  }

  const { page: p, pageSize: ps } = validatePagination(page, pageSize);
  const offset = (p - 1) * ps;
  const total = repo.countActiveHabits();
  const habits = repo.findAllActiveHabits(ps, offset);
  const items = habits.map((h) => attachStreak(h, timezone));

  return { items, meta: { page: p, pageSize: ps, total } };
}

/**
 * Creates a new habit after validating name and optional description.
 *
 * @param dto - Data-transfer object containing the fields for the new habit
 * @returns The newly created Habit entity (streak is undefined on create)
 * @throws ServiceError(400) for any validation failure
 */
export function createHabit(dto: CreateHabitDto): Habit {
  validateName(dto.name);
  if (dto.description !== undefined) {
    validateDescription(dto.description);
  }

  const habit: Habit = {
    id: randomUUID(),
    name: dto.name,
    description: dto.description ?? '',
    frequency: dto.frequency ?? 'daily',
    active: true,
    createdAt: new Date().toISOString(),
  };

  repo.insertHabit(habit);
  return habit;
}

/**
 * Retrieves a single habit by its UUID with the current streak attached.
 *
 * @param id       - The UUID of the habit to retrieve
 * @param timezone - IANA timezone identifier; defaults to 'UTC'
 * @returns The Habit entity with streak populated, or null if not found
 */
export function getHabitById(id: string, timezone: string = 'UTC'): Habit | null {
  const habit = repo.findHabitById(id);
  if (!habit) {
    return null;
  }
  return attachStreak(habit, timezone);
}

/**
 * Applies a partial update to an existing habit's name and/or description.
 *
 * @param id       - The UUID of the habit to update
 * @param dto      - Partial update object; only name and description are patchable
 * @param timezone - IANA timezone identifier; defaults to 'UTC'
 * @returns The updated Habit entity with streak attached, or null if not found
 * @throws ServiceError(400) for any validation failure on supplied fields
 */
export function updateHabit(
  id: string,
  dto: { name?: string; description?: string },
  timezone: string = 'UTC',
): Habit | null {
  const existing = repo.findHabitById(id);
  if (!existing) {
    return null;
  }

  if (dto.name !== undefined) validateName(dto.name);
  if (dto.description !== undefined) validateDescription(dto.description);

  const dbFields: Partial<Record<string, unknown>> = {};
  if (dto.name !== undefined) dbFields['name'] = dto.name;
  if (dto.description !== undefined) dbFields['description'] = dto.description;

  const updated = repo.updateHabitFields(id, dbFields);
  if (!updated) {
    return null;
  }
  return attachStreak(updated, timezone);
}

/**
 * Soft-deletes a habit by setting its `active` flag to false.
 *
 * @param id - The UUID of the habit to deactivate
 * @returns true if the habit was deactivated; false if not found
 */
export function deactivateHabit(id: string): boolean {
  return repo.deactivateHabit(id);
}

/**
 * Records a daily check-in for an active habit in the caller's timezone.
 *
 * @param habitId  - The UUID of the habit to check in
 * @param timezone - IANA timezone identifier; defaults to 'UTC'
 * @returns The newly created HabitCompletion entity
 * @throws ServiceError(404) if no habit with the given id exists
 * @throws ServiceError(409) if the habit is inactive or already checked in today
 */
export function checkIn(habitId: string, timezone: string = 'UTC'): HabitCompletion {
  const habit = repo.findHabitById(habitId);
  if (!habit) {
    throw new ServiceError(404, 'Habit not found');
  }
  if (!habit.active) {
    throw new ServiceError(409, 'Cannot check in on an inactive habit');
  }

  const today = todayInTimezone(timezone);

  const existing = repo.findCompletionByDate(habitId, today);
  if (existing) {
    throw new ServiceError(409, 'Already checked in today');
  }

  const completion: HabitCompletion = {
    id: randomUUID(),
    habitId,
    completedDate: today,
    createdAt: new Date().toISOString(),
  };

  repo.insertCompletion(completion);
  return completion;
}

