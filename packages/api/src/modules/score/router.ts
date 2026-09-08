/**
 * Express router for the Productivity Score module.
 *
 * Exposes a read-only endpoint for computing the aggregated Productivity Score
 * across Tasks, Reminders, and Habits.
 *
 * Requirements: 4.1, 6.2
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse } from '../../types/shared';
import type { ScoreData } from './service';
import * as svc from './service';

export const scoreRouter: Router = Router();

/**
 * Checks whether the given value is a valid IANA timezone string.
 *
 * @param tz - The timezone value to validate
 * @returns true if tz is a recognized IANA timezone identifier; false otherwise
 */
function isValidTimezone(tz: unknown): tz is string {
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
 * Route handler for computing and returning the productivity score.
 *
 * Accepts an optional `timezone` query parameter (defaults to 'UTC').
 * Returns HTTP 400 if the provided timezone is invalid.
 * Returns HTTP 200 with ApiResponse<ScoreData> on success.
 *
 * @param req - Express request; query may contain timezone
 * @param res - Express response; returns ApiResponse<ScoreData>
 * @returns void
 */
function handleGetScore(req: Request, res: Response): void {
  const rawTz = req.query['timezone'];
  let timezone = 'UTC';

  if (rawTz !== undefined) {
    if (!isValidTimezone(rawTz)) {
      const payload: ApiResponse<null> = {
        data: null,
        error: 'Invalid IANA timezone query parameter',
      };
      res.status(400).json(payload);
      return;
    }
    timezone = rawTz;
  }

  try {
    const scoreData = svc.computeScore(timezone);
    const payload: ApiResponse<ScoreData> = {
      data: scoreData,
      error: null,
    };
    res.status(200).json(payload);
  } catch (err) {
    console.error(err);
    const payload: ApiResponse<null> = {
      data: null,
      error: 'Internal server error',
    };
    res.status(500).json(payload);
  }
}

scoreRouter.get('/score', handleGetScore);

