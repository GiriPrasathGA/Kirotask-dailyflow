/**
 * Express router for the Tasks module.
 *
 * Registers all CRUD routes for tasks under the `/tasks` path prefix.
 * Each handler delegates validation and business logic to the service layer,
 * converts ServiceError instances to the appropriate HTTP status codes, and
 * wraps every successful response in the ApiResponse envelope.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2, 6.5
 */

import { Router, Request, Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '../../types/shared';
import type { Task, TaskStatus, TaskCategory, TaskPriority } from './types';
import type { TaskFilters } from './repository';
import * as svc from './service';
import { ServiceError } from './service';

export const tasksRouter: Router = Router();

// ── GET / ──────────────────────────────────────────────────────────────────

/**
 * Lists tasks with optional pagination and filtering.
 *
 * Query params: page (integer ≥ 1), pageSize (integer 1–100), status, category, priority.
 * Absent or non-integer pagination params default to service defaults (page=1, pageSize=20).
 *
 * @param req - Express request; query may contain page, pageSize, status, category, priority
 * @param res - Express response; returns ApiResponse<PaginatedResponse<Task>>
 * @returns void
 */
tasksRouter.get('/', (req: Request, res: Response): void => {
  const rawPage = parseInt(req.query['page'] as string, 10);
  const rawPageSize = parseInt(req.query['pageSize'] as string, 10);
  const page = Number.isNaN(rawPage) ? undefined : rawPage;
  const pageSize = Number.isNaN(rawPageSize) ? undefined : rawPageSize;

  const filters: TaskFilters = {};
  if (req.query['status']) filters.status = req.query['status'] as TaskStatus;
  if (req.query['category']) filters.category = req.query['category'] as TaskCategory;
  if (req.query['priority']) filters.priority = req.query['priority'] as TaskPriority;

  try {
    const result = svc.listTasks(page, pageSize, filters);
    const payload: ApiResponse<PaginatedResponse<Task>> = { data: result, error: null };
    res.status(200).json(payload);
  } catch (err) {
    if (err instanceof ServiceError) {
      const payload: ApiResponse<null> = { data: null, error: err.message };
      res.status(err.statusCode).json(payload);
      return;
    }
    console.error(err);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  }
});

// ── POST / ─────────────────────────────────────────────────────────────────

/**
 * Creates a new task.
 *
 * Request body is parsed as CreateTaskDto. Returns the created Task with HTTP 201.
 *
 * @param req - Express request; body must conform to CreateTaskDto
 * @param res - Express response; returns ApiResponse<Task> with HTTP 201
 * @returns void
 */
tasksRouter.post('/', (req: Request, res: Response): void => {
  try {
    const task = svc.createTask(req.body);
    const payload: ApiResponse<Task> = { data: task, error: null };
    res.status(201).json(payload);
  } catch (err) {
    if (err instanceof ServiceError) {
      const payload: ApiResponse<null> = { data: null, error: err.message };
      res.status(err.statusCode).json(payload);
      return;
    }
    console.error(err);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  }
});

// ── GET /:id ───────────────────────────────────────────────────────────────

/**
 * Retrieves a single task by its UUID.
 *
 * Returns HTTP 404 when no task with the given id exists.
 *
 * @param req - Express request; params.id is the task UUID
 * @param res - Express response; returns ApiResponse<Task> or HTTP 404
 * @returns void
 */
tasksRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const task = svc.getTaskById(req.params['id'] as string);
    if (!task) {
      const payload: ApiResponse<null> = { data: null, error: 'Task not found' };
      res.status(404).json(payload);
      return;
    }
    const payload: ApiResponse<Task> = { data: task, error: null };
    res.status(200).json(payload);
  } catch (err) {
    if (err instanceof ServiceError) {
      const payload: ApiResponse<null> = { data: null, error: err.message };
      res.status(err.statusCode).json(payload);
      return;
    }
    console.error(err);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  }
});

// ── PATCH /:id ─────────────────────────────────────────────────────────────

/**
 * Partially updates an existing task.
 *
 * Only the fields supplied in the request body are applied; omitted fields
 * remain unchanged. Returns HTTP 404 when no task with the given id exists.
 *
 * @param req - Express request; params.id is the task UUID; body is PatchTaskDto
 * @param res - Express response; returns ApiResponse<Task> or HTTP 404
 * @returns void
 */
tasksRouter.patch('/:id', (req: Request, res: Response): void => {
  try {
    const task = svc.updateTask(req.params['id'] as string, req.body);
    if (!task) {
      const payload: ApiResponse<null> = { data: null, error: 'Task not found' };
      res.status(404).json(payload);
      return;
    }
    const payload: ApiResponse<Task> = { data: task, error: null };
    res.status(200).json(payload);
  } catch (err) {
    if (err instanceof ServiceError) {
      const payload: ApiResponse<null> = { data: null, error: err.message };
      res.status(err.statusCode).json(payload);
      return;
    }
    console.error(err);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  }
});

// ── DELETE /:id ────────────────────────────────────────────────────────────

/**
 * Deletes a task by its UUID.
 *
 * Returns HTTP 204 with no body on success.
 * Returns HTTP 404 when no task with the given id exists.
 *
 * @param req - Express request; params.id is the task UUID
 * @param res - Express response; HTTP 204 on success, HTTP 404 if not found
 * @returns void
 */
tasksRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const deleted = svc.deleteTask(req.params['id'] as string);
    if (!deleted) {
      const payload: ApiResponse<null> = { data: null, error: 'Task not found' };
      res.status(404).json(payload);
      return;
    }
    res.status(204).send();
  } catch (err) {
    if (err instanceof ServiceError) {
      const payload: ApiResponse<null> = { data: null, error: err.message };
      res.status(err.statusCode).json(payload);
      return;
    }
    console.error(err);
    const payload: ApiResponse<null> = { data: null, error: 'Internal server error' };
    res.status(500).json(payload);
  }
});
