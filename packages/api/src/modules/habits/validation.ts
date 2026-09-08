/**
 * Validation helpers and domain errors for the Habits module.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 6.1
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
 * Validates the `name` field for create and update operations.
 *
 * @param name - The name string to validate
 * @throws ServiceError(400) if name is empty or exceeds 200 characters
 */
export function validateName(name: string): void {
  if (name.trim().length === 0) {
    throw new ServiceError(400, 'name is required and must not be empty');
  }
  if (name.length > 200) {
    throw new ServiceError(400, 'name must not exceed 200 characters');
  }
}

/**
 * Validates the `description` field for create and update operations.
 *
 * @param description - The description string to validate
 * @throws ServiceError(400) if description exceeds 500 characters
 */
export function validateDescription(description: string): void {
  if (description.length > 500) {
    throw new ServiceError(400, 'description must not exceed 500 characters');
  }
}
