/**
 * Property-based tests for Export router and service.
 *
 * Requirements: 5.1, 5.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import type { Request, Response } from 'express';
import { exportRouter } from '../router';
import * as repo from '../repository';
import * as scoreService from '../../score/service';
import type { ApiResponse } from '../../../types/shared';
import type { ExportResult } from '../service';
import type { Task } from '../../tasks/types';
import type { Reminder } from '../../reminders/types';
import type { Habit, HabitCompletion } from '../../habits/types';

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      pragma: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn().mockReturnValue({ run: vi.fn(), get: vi.fn(), all: vi.fn() }),
    })),
  };
});

vi.mock('../repository');
vi.mock('../../score/service');

/**
 * Helper to invoke the export router handler.
 *
 * @returns Object containing status code and JSON body
 */
async function invokeExport(): Promise<{ status: number; body: ApiResponse<ExportResult> }> {
  let statusCode = 200;
  let responseBody: ApiResponse<ExportResult> = { data: null, error: null };

  const req = {} as Request;
  const res = {
    status: (code: number): Response => {
      statusCode = code;
      return res as unknown as Response;
    },
    json: (data: ApiResponse<ExportResult>): Response => {
      responseBody = data;
      return res as unknown as Response;
    },
  } as unknown as Response;

  const route = exportRouter.stack.find((layer) => layer.route?.path === '/export');
  const handler = route?.route?.stack[0]?.handle;
  if (!handler) {
    throw new Error('Export route handler not found');
  }

  const next = (): void => {};
  handler(req, res, next);
  return { status: statusCode, body: responseBody };
}

describe('Export Router Property Tests', () => {
  let createdFiles: string[] = [];

  beforeEach((): void => {
    vi.clearAllMocks();
    createdFiles = [];

    vi.mocked(scoreService.computeScore).mockReturnValue({
      score: 75.0,
      taskCompletionRate: 0.75,
      reminderAckRate: 0.8,
      habitStreakConsistency: 0.7,
    });
  });

  afterEach((): void => {
    for (const filePath of createdFiles) {
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
        } catch {
          // ignore cleanup errors
        }
      }
    }
  });

  // Feature: dailyflow, Property 13: Export file contains all records with required structure
  it('Property 13: Export file contains all records with required structure', async (): Promise<void> => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        async (taskCount, reminderCount, habitCount, completionCount): Promise<void> => {
          const tasks: Task[] = Array.from({ length: taskCount }, (_, i) => ({
            id: `t-${i}`,
            title: `Task ${i}`,
            description: '',
            status: 'todo',
            priority: 'medium',
            category: 'work',
            dueDate: null,
            createdAt: '2026-09-08T12:00:00.000Z',
          }));

          const reminders: Reminder[] = Array.from({ length: reminderCount }, (_, i) => ({
            id: `r-${i}`,
            title: `Reminder ${i}`,
            dueAt: '2026-09-08T18:00:00.000Z',
            acknowledged: false,
            createdAt: '2026-09-08T12:00:00.000Z',
          }));

          const habits: Habit[] = Array.from({ length: habitCount }, (_, i) => ({
            id: `h-${i}`,
            name: `Habit ${i}`,
            description: '',
            frequency: 'daily',
            active: true,
            createdAt: '2026-09-08T12:00:00.000Z',
          }));

          const habitCompletions: HabitCompletion[] = Array.from({ length: completionCount }, (_, i) => ({
            id: `hc-${i}`,
            habitId: `h-0`,
            completedDate: '2026-09-08',
            createdAt: '2026-09-08T12:00:00.000Z',
          }));

          vi.mocked(repo.getAllTasks).mockReturnValue(tasks);
          vi.mocked(repo.getAllReminders).mockReturnValue(reminders);
          vi.mocked(repo.getAllHabits).mockReturnValue(habits);
          vi.mocked(repo.getAllHabitCompletions).mockReturnValue(habitCompletions);

          const { status, body } = await invokeExport();

          expect(status).toBe(200);
          expect(body.data?.filePath).toBeDefined();

          const filePath = body.data!.filePath;
          createdFiles.push(filePath);

          expect(existsSync(filePath)).toBe(true);

          const raw = readFileSync(filePath, 'utf-8');
          const json = JSON.parse(raw) as {
            exportedAt: string;
            tasks: unknown[];
            reminders: unknown[];
            habits: unknown[];
            habitCompletions: unknown[];
            score: unknown;
          };

          // Check top-level keys
          expect(json).toHaveProperty('exportedAt');
          expect(json).toHaveProperty('tasks');
          expect(json).toHaveProperty('reminders');
          expect(json).toHaveProperty('habits');
          expect(json).toHaveProperty('habitCompletions');
          expect(json).toHaveProperty('score');

          // Check lengths match table counts exactly
          expect(json.tasks.length).toBe(taskCount);
          expect(json.reminders.length).toBe(reminderCount);
          expect(json.habits.length).toBe(habitCount);
          expect(json.habitCompletions.length).toBe(completionCount);
        },
      ),
      { numRuns: 50 },
    );
  });
});
