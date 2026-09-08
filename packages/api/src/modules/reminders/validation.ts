/**
 * Validation helpers and domain errors for the Reminders module.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.5, 6.7
 */

// ── Pagination constants ────────────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
 * Validates the `dueAt` field as a required, valid ISO 8601 date-time string.
 *
 * @param dueAt - The dueAt string to validate
 * @throws ServiceError(400) if dueAt is missing, empty, or not a valid ISO 8601 date-time
 */
export function validateDueAt(dueAt: string): void {
  if (!dueAt || dueAt.trim().length === 0) {
    throw new ServiceError(400, 'dueAt is required');
  }
  if (isNaN(Date.parse(dueAt))) {
    throw new ServiceError(400, 'dueAt must be a valid ISO 8601 date-time string');
  }
}
