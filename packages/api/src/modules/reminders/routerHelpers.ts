/**
 * HTTP router helpers for the Reminders module.
 *
 * Provides reusable error mapping, 404 response emission, and query parameter parsing.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.5
 */

import type { Request, Response } from 'express';
import type { ApiResponse } from '../../types/shared';
import { ServiceError } from './service';

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
