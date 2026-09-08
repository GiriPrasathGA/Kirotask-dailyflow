/**
 * Router helpers and validation for the Habits module HTTP endpoints.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 6.2
 */

import type { Request, Response } from 'express';
import type { ApiResponse } from '../../types/shared';
import { ServiceError } from './service';

/**
 * Checks whether the given value is a valid IANA timezone string.
 *
 * @param tz - The timezone value to validate
 * @returns true if tz is a recognized IANA timezone identifier; false otherwise
 */
export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.trim().length === 0) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Handles errors thrown during request processing and maps them to standard API responses.
 *
 * @param res - Express response object
 * @param err - Error instance caught in route handler
 */
export function handleRouterError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    const payload: ApiResponse<null> = { data: null, error: err.message };
    res.status(err.statusCode).json(payload);
    return;
  }
  console.error(err);
  const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
  res.status(500).json(payload);
}

/**
 * Sends a 404 Not Found response wrapped in the ApiResponse envelope.
 *
 * @param res     - Express response object
 * @param message - Error description to include in payload
 */
export function sendNotFound(res: Response, message: string): void {
  const payload: ApiResponse<null> = { data: null, error: message };
  res.status(404).json(payload);
}

/**
 * Sends a 400 Bad Request error response when a valid IANA timezone query parameter is missing.
 *
 * @param res - Express response object
 */
export function sendTimezoneRequired(res: Response): void {
  const payload: ApiResponse<null> = {
    data: null,
    error: 'Valid IANA timezone query parameter is required',
  };
  res.status(400).json(payload);
}

/**
 * Parses and extracts optional pagination numbers from Express query params.
 *
 * @param req - Express request object
 * @returns Parsed page and pageSize integers or undefined if absent/invalid
 */
export function parsePaginationParams(req: Request): {
  page: number | undefined;
  pageSize: number | undefined;
} {
  const rawPage = parseInt(req.query['page'] as string, 10);
  const rawPageSize = parseInt(req.query['pageSize'] as string, 10);
  const page = Number.isNaN(rawPage) ? undefined : rawPage;
  const pageSize = Number.isNaN(rawPageSize) ? undefined : rawPageSize;

  return { page, pageSize };
}
