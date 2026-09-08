/**
 * Express router for the Reminders module.
 *
 * Registers all CRUD routes plus the acknowledge action for reminders under
 * the `/reminders` path prefix. Each handler delegates validation and business
 * logic to the service layer, converts ServiceError instances to the appropriate
 * HTTP status codes, and wraps every successful response in the ApiResponse envelope.
 *
 * Note: The `/:id/acknowledge` route is registered BEFORE `/:id` so that Express
 * does not match the literal segment "acknowledge" as an `:id` parameter.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.5
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '../../types/shared';
import type { Reminder } from './types';
import * as svc from './service';
import {
  handleRouterError,
  sendNotFound,
  parsePaginationParams,
} from './routerHelpers';

export const remindersRouter: Router = Router();

// ── GET / ──────────────────────────────────────────────────────────────────

/**
 * Lists reminders with optional pagination, sorted by dueAt ascending.
 *
 * Query params: page (integer ≥ 1), pageSize (integer 1–100).
 * Absent or non-integer pagination params default to service defaults (page=1, pageSize=20).
 *
 * @param req - Express request; query may contain page and pageSize
 * @param res - Express response; returns ApiResponse<PaginatedResponse<Reminder>>
 * @returns void
 */
remindersRouter.get('/', (req: Request, res: Response): void => {
  const { page, pageSize } = parsePaginationParams(req);

  try {
    const result = svc.listReminders(page, pageSize);
    const payload: ApiResponse<PaginatedResponse<Reminder>> = { data: result, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── POST / ─────────────────────────────────────────────────────────────────

/**
 * Creates a new reminder.
 *
 * Request body is parsed as CreateReminderDto. Returns the created Reminder
 * with HTTP 201.
 *
 * @param req - Express request; body must conform to CreateReminderDto
 * @param res - Express response; returns ApiResponse<Reminder> with HTTP 201
 * @returns void
 */
remindersRouter.post('/', (req: Request, res: Response): void => {
  try {
    const reminder = svc.createReminder(req.body);
    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(201).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── POST /:id/acknowledge ──────────────────────────────────────────────────
// MUST be registered before /:id to prevent "acknowledge" matching as an id param.

/**
 * Acknowledges a reminder, setting its acknowledged flag to true.
 *
 * This operation is idempotent — calling it on an already-acknowledged reminder
 * returns HTTP 200 with no error. Returns HTTP 404 if the reminder does not exist.
 *
 * @param req - Express request; params.id is the reminder UUID
 * @param res - Express response; returns ApiResponse<Reminder> with HTTP 200
 * @returns void
 */
remindersRouter.post('/:id/acknowledge', (req: Request, res: Response): void => {
  try {
    const reminder = svc.acknowledgeReminder(req.params['id'] as string);
    if (!reminder) {
      sendNotFound(res, 'Reminder not found');
      return;
    }
    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── GET /:id ───────────────────────────────────────────────────────────────

/**
 * Retrieves a single reminder by its UUID.
 *
 * Returns HTTP 404 when no reminder with the given id exists.
 *
 * @param req - Express request; params.id is the reminder UUID
 * @param res - Express response; returns ApiResponse<Reminder> or HTTP 404
 * @returns void
 */
remindersRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const reminder = svc.getReminderById(req.params['id'] as string);
    if (!reminder) {
      sendNotFound(res, 'Reminder not found');
      return;
    }
    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── PATCH /:id ─────────────────────────────────────────────────────────────

/**
 * Partially updates an existing reminder.
 *
 * Only the fields supplied in the request body are applied; omitted fields
 * remain unchanged. Returns HTTP 404 when no reminder with the given id exists.
 *
 * @param req - Express request; params.id is the reminder UUID; body is PatchReminderDto
 * @param res - Express response; returns ApiResponse<Reminder> or HTTP 404
 * @returns void
 */
remindersRouter.patch('/:id', (req: Request, res: Response): void => {
  try {
    const reminder = svc.updateReminder(req.params['id'] as string, req.body);
    if (!reminder) {
      sendNotFound(res, 'Reminder not found');
      return;
    }
    const payload: ApiResponse<Reminder> = { data: reminder, error: null };
    res.status(200).json(payload);
  } catch (err) {
    handleRouterError(res, err);
  }
});

// ── DELETE /:id ────────────────────────────────────────────────────────────

/**
 * Deletes a reminder by its UUID.
 *
 * Returns HTTP 204 with no body on success.
 * Returns HTTP 404 when no reminder with the given id exists.
 *
 * @param req - Express request; params.id is the reminder UUID
 * @param res - Express response; HTTP 204 on success, HTTP 404 if not found
 * @returns void
 */
remindersRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const deleted = svc.deleteReminder(req.params['id'] as string);
    if (!deleted) {
      sendNotFound(res, 'Reminder not found');
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleRouterError(res, err);
  }
});
