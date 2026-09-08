/**
 * Express router for the Export module.
 *
 * Exposes the POST /export endpoint to export all user data to a local JSON file.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse } from '../../types/shared';
import type { ExportResult } from './service';
import * as svc from './service';

export const exportRouter: Router = Router();

/**
 * Handles POST requests to export all application data to a JSON file.
 *
 * Returns HTTP 200 with ApiResponse<{ filePath: string }> on success.
 * Returns HTTP 500 with ApiResponse<null> on filesystem failure.
 *
 * @param req - Express request
 * @param res - Express response; returns ApiResponse<{ filePath: string }> or HTTP 500
 * @returns void
 */
function handleExport(_req: Request, res: Response): void {
  try {
    const result: ExportResult = svc.exportData();
    const payload: ApiResponse<ExportResult> = {
      data: result,
      error: null,
    };
    res.status(200).json(payload);
  } catch (err) {
    const payload: ApiResponse<null> = {
      data: null,
      error: `Export failed: ${(err as Error).message}`,
    };
    res.status(500).json(payload);
  }
}

exportRouter.post('/export', handleExport);
