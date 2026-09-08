/**
 * Service layer for the Tasks module.
 *
 * Contains all validation and business logic for task operations. Calls the
 * repository for database access. Throws `ServiceError` for validation
 * failures (400) and missing records (404) so the router layer can convert
 * these to the correct HTTP responses without needing to understand DB details.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.5, 6.7
 */

import { randomUUID } from 'crypto';
import type { PaginatedResponse } from '../../types/shared';
import type { Task, CreateTaskDto, PatchTaskDto } from './types';
import * as repo from './repository';
import type { TaskFilters } from './repository';
import {
  validatePagination,
  validateTitle,
  validateDescription,
  validatePriority,
  validateCategory,
  validateStatus,
  validateDueDate,
} from './validation';

export { ServiceError } from './validation';

// ── Public service functions ────────────────────────────────────────────────

/**
 * Returns a paginated, optionally filtered list of tasks.
 *
 * @param page     - 1-indexed page number; defaults to 1
 * @param pageSize - Number of items per page (1–100); defaults to 20
 * @param filters  - Optional filter criteria: status, category, priority
 * @returns Paginated response containing matching Task entities and pagination metadata
 * @throws ServiceError(400) if pagination params are invalid
 */
export function listTasks(
  page?: number,
  pageSize?: number,
  filters?: TaskFilters,
): PaginatedResponse<Task> {
  const { page: p, pageSize: ps } = validatePagination(page, pageSize);
  const f: TaskFilters = filters ?? {};

  // Validate filter enum values if supplied
  if (f.status !== undefined) validateStatus(f.status);
  if (f.category !== undefined) validateCategory(f.category);
  if (f.priority !== undefined) validatePriority(f.priority);

  const offset = (p - 1) * ps;
  const total = repo.countTasks(f);
  const items = repo.findAllTasks(f, ps, offset);

  return { items, meta: { page: p, pageSize: ps, total } };
}

/**
 * Creates a new task after validating all required and optional fields.
 *
 * @param dto - Data-transfer object containing the fields for the new task
 * @returns The newly created Task entity with a generated id and createdAt timestamp
 * @throws ServiceError(400) for any validation failure
 */
export function createTask(dto: CreateTaskDto): Task {
  validateTitle(dto.title);
  validateDescription(dto.description ?? '');
  validatePriority(dto.priority);
  validateCategory(dto.category);
  if (dto.dueDate !== undefined) {
    validateDueDate(dto.dueDate ?? null);
  }

  const task: Task = {
    id: randomUUID(),
    title: dto.title,
    description: dto.description ?? '',
    status: 'todo',
    priority: dto.priority,
    category: dto.category,
    dueDate: dto.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };

  repo.insertTask(task);
  return task;
}

/**
 * Retrieves a single task by its UUID.
 * Returns null if no task with the given id exists — the router decides whether
 * to convert this to a 404.
 *
 * @param id - The UUID of the task to retrieve
 * @returns The Task entity, or null if not found
 */
export function getTaskById(id: string): Task | null {
  return repo.findTaskById(id);
}

/**
 * Applies a partial update to an existing task.
 * Only the fields supplied in `dto` are modified; all others remain unchanged.
 *
 * @param id  - The UUID of the task to update
 * @param dto - Partial data-transfer object; only supplied fields are applied
 * @returns The updated Task entity, or null if no task with the given id was found
 * @throws ServiceError(400) for any validation failure on supplied fields
 */
export function updateTask(id: string, dto: PatchTaskDto): Task | null {
  const existing = repo.findTaskById(id);
  if (!existing) {
    return null;
  }

  // Validate each supplied field
  if (dto.title !== undefined) validateTitle(dto.title);
  if (dto.description !== undefined) validateDescription(dto.description);
  if (dto.status !== undefined) validateStatus(dto.status);
  if (dto.priority !== undefined) validatePriority(dto.priority);
  if (dto.category !== undefined) validateCategory(dto.category);
  if (dto.dueDate !== undefined) validateDueDate(dto.dueDate ?? null);

  // Map camelCase DTO fields to snake_case DB columns
  const dbFields: Partial<Record<string, unknown>> = {};
  if (dto.title !== undefined) dbFields['title'] = dto.title;
  if (dto.description !== undefined) dbFields['description'] = dto.description;
  if (dto.status !== undefined) dbFields['status'] = dto.status;
  if (dto.priority !== undefined) dbFields['priority'] = dto.priority;
  if (dto.category !== undefined) dbFields['category'] = dto.category;
  if (dto.dueDate !== undefined) dbFields['due_date'] = dto.dueDate ?? null;

  return repo.updateTaskFields(id, dbFields);
}

/**
 * Deletes a task by its UUID.
 *
 * @param id - The UUID of the task to delete
 * @returns true if the task was deleted; false if no task with the given id was found
 */
export function deleteTask(id: string): boolean {
  return repo.deleteTaskById(id);
}
