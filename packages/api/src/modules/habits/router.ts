/**
 * Express router for the Habits module.
 *
 * Registers all CRUD routes plus daily check-ins for habits under the `/habits`
 * path prefix. Each handler delegates validation and business logic to the
 * service layer, converts ServiceError instances to the appropriate HTTP status
 * codes, and wraps every successful response in the ApiResponse envelope.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 6.2
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '../../types/shared';
import type { Habit, HabitCompletion } from './types';
import * as svc from './service';
import {
  isValidTimezone,
  handleRouterError,
  sendNotFound,
  sendTimezoneRequired,
  parsePaginationParams,
} from './routerHelpers';

export const habitsRouter: Router = Router();

// ── GET / ──────────────────────────────────────────────────────────────────

/**
 * Lists active habits with attached streak counts.
 *
 * Requires a valid IANA timezone query parameter.
 * Optional pagination query params: page (integer ≥ 1), pageSize (integer 1–100).
 *
 * @param req - Express request; query must contain timezone and may contain page and pageSize
 * @param res - Express response; returns ApiResponse<PaginatedResponse<Habit>>
 * @returns void
 */
habitsRouter.get('/', (req: Request, res: Response): void => {
  const timezone = req.query['timezone'];
  if (!isValidTimezone(timezone)) {
    sendTimezoneRequired(res);
    return;
  }

  const { page, pageSize } = parsePaginationParams(req);

  try {
    const result = svc.listHabits(page, pageSize);
    const payload: ApiResponse<PaginatedResponse<Habit>> = { data: result, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── POST / ─────────────────────────────────────────────────────────────────

/**
 * Creates a new habit.
 *
 * Request body is parsed as CreateHabitDto. Returns the created Habit with HTTP 201.
 *
 * @param req - Express request; body must conform to CreateHabitDto
 * @param res - Express response; returns ApiResponse<Habit> with HTTP 201
 * @returns void
 */
habitsRouter.post('/', (req: Request, res: Response): void => {
  try {
    const habit = svc.createHabit(req.body);
    const payload: ApiResponse<Habit> = { data: habit, error: null };
    res.status(201).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── POST /:id/check-in ─────────────────────────────────────────────────────
// Registered before /:id to prevent routing ambiguities.

/**
 * Records a daily check-in for a habit.
 *
 * Requires a valid IANA timezone query parameter.
 * Returns HTTP 201 with the created HabitCompletion on success.
 * Returns HTTP 404 if the habit does not exist.
 * Returns HTTP 409 if the habit is inactive or already checked in today.
 *
 * @param req - Express request; params.id is habit UUID; query must contain timezone
 * @param res - Express response; returns ApiResponse<HabitCompletion> with HTTP 201
 * @returns void
 */
habitsRouter.post('/:id/check-in', (req: Request, res: Response): void => {
  const timezone = req.query['timezone'];
  if (!isValidTimezone(timezone)) {
    sendTimezoneRequired(res);
    return;
  }

  try {
    const completion = svc.checkIn(req.params['id'] as string);
    const payload: ApiResponse<HabitCompletion> = { data: completion, error: null };
    res.status(201).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── GET /:id ───────────────────────────────────────────────────────────────

/**
 * Retrieves a single habit by its UUID with the current streak attached.
 *
 * Requires a valid IANA timezone query parameter.
 * Returns HTTP 404 when no habit with the given id exists.
 *
 * @param req - Express request; params.id is habit UUID; query must contain timezone
 * @param res - Express response; returns ApiResponse<Habit> or HTTP 404
 * @returns void
 */
habitsRouter.get('/:id', (req: Request, res: Response): void => {
  const timezone = req.query['timezone'];
  if (!isValidTimezone(timezone)) {
    sendTimezoneRequired(res);
    return;
  }

  try {
    const habit = svc.getHabitById(req.params['id'] as string);
    if (!habit) {
      sendNotFound(res, 'Habit not found');
      return;
    }
    const payload: ApiResponse<Habit> = { data: habit, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── PATCH /:id ─────────────────────────────────────────────────────────────

/**
 * Partially updates an existing habit's name and/or description.
 *
 * Returns HTTP 404 when no habit with the given id exists.
 *
 * @param req - Express request; params.id is habit UUID; body contains name and/or description
 * @param res - Express response; returns ApiResponse<Habit> or HTTP 404
 * @returns void
 */
habitsRouter.patch('/:id', (req: Request, res: Response): void => {
  try {
    const habit = svc.updateHabit(req.params['id'] as string, req.body);
    if (!habit) {
      sendNotFound(res, 'Habit not found');
      return;
    }
    const payload: ApiResponse<Habit> = { data: habit, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── DELETE /:id ────────────────────────────────────────────────────────────

/**
 * Soft-deletes a habit by its UUID (sets active = false).
 *
 * Returns HTTP 204 with no body on success.
 * Returns HTTP 404 when no habit with the given id exists.
 *
 * @param req - Express request; params.id is habit UUID
 * @param res - Express response; HTTP 204 on success, HTTP 404 if not found
 * @returns void
 */
habitsRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const deactivated = svc.deactivateHabit(req.params['id'] as string);
    if (!deactivated) {
      sendNotFound(res, 'Habit not found');
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleRouterError(res, err);
  }
});
