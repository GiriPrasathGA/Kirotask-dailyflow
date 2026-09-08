/**
 * Validation helpers and domain errors for the Tasks module.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.5, 6.7
 */

import type { TaskStatus, TaskPriority, TaskCategory } from './types';

// ── Pagination constants ────────────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ── Valid enum values ───────────────────────────────────────────────────────
const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const VALID_CATEGORIES: TaskCategory[] = ['work', 'personal', 'health'];

/** Pattern for an optional due date in YYYY-MM-DD format. */
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Typed error thrown by service functions to communicate HTTP status codes
 * to the router layer without coupling business logic to Express.
 */
export class ServiceError extends Error {
  /**
   * @param statusCode - HTTP status code the router should use (e.g. 400, 404, 409)
   * @param message    - Human-readable error description included in the ApiResponse error field
   */
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Validates and normalises pagination query parameters.
 *
 * @param page     - Requested page number (1-indexed); undefined defaults to 1
 * @param pageSize - Requested page size; undefined defaults to 20
 * @returns Validated `{ page, pageSize }` tuple
 * @throws ServiceError(400) if page < 1 or pageSize outside 1–100
 */
export function validatePagination(
  page: number | undefined,
  pageSize: number | undefined,
): { page: number; pageSize: number } {
  const p = page ?? DEFAULT_PAGE;
  const ps = pageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(p) || p < 1) {
    throw new ServiceError(400, 'page must be an integer ≥ 1');
  }
  if (!Number.isInteger(ps) || ps < 1 || ps > MAX_PAGE_SIZE) {
    throw new ServiceError(400, `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }

  return { page: p, pageSize: ps };
}

/**
 * Validates the `title` field for create and patch operations.
 *
 * @param title - The title string to validate
 * @throws ServiceError(400) if title is empty or exceeds 200 characters
 */
export function validateTitle(title: string): void {
  if (title.trim().length === 0) {
    throw new ServiceError(400, 'title is required and must not be empty');
  }
  if (title.length > 200) {
    throw new ServiceError(400, 'title must not exceed 200 characters');
  }
}

/**
 * Validates the `description` field for create and patch operations.
 *
 * @param description - The description string to validate
 * @throws ServiceError(400) if description exceeds 1000 characters
 */
export function validateDescription(description: string): void {
  if (description.length > 1000) {
    throw new ServiceError(400, 'description must not exceed 1000 characters');
  }
}

/**
 * Validates the `priority` field against the allowed enum values.
 *
 * @param priority - The priority string to validate
 * @throws ServiceError(400) if priority is not one of 'low' | 'medium' | 'high'
 */
export function validatePriority(priority: string): void {
  if (!(VALID_PRIORITIES as string[]).includes(priority)) {
    throw new ServiceError(400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
}

/**
 * Validates the `category` field against the allowed enum values.
 *
 * @param category - The category string to validate
 * @throws ServiceError(400) if category is not one of 'work' | 'personal' | 'health'
 */
export function validateCategory(category: string): void {
  if (!(VALID_CATEGORIES as string[]).includes(category)) {
    throw new ServiceError(400, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
}

/**
 * Validates the `status` field against the allowed enum values.
 *
 * @param status - The status string to validate
 * @throws ServiceError(400) if status is not one of 'todo' | 'in_progress' | 'done'
 */
export function validateStatus(status: string): void {
  if (!(VALID_STATUSES as string[]).includes(status)) {
    throw new ServiceError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

/**
 * Validates the `dueDate` field when provided.
 * An explicit `null` is allowed (clears the due date); a string must match YYYY-MM-DD.
 *
 * @param dueDate - The due date value to validate (string or null)
 * @throws ServiceError(400) if dueDate is a non-null string that does not match YYYY-MM-DD
 */
export function validateDueDate(dueDate: string | null): void {
  if (dueDate !== null && !DUE_DATE_PATTERN.test(dueDate)) {
    throw new ServiceError(400, 'dueDate must be a date string in YYYY-MM-DD format or null');
  }
}
