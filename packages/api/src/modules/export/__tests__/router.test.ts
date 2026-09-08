/**
 * Unit tests for the Export router and service integration.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import type { Request, Response } from 'express';
import { exportRouter } from '../router';
import * as repo from '../repository';
import * as scoreService from '../../score/service';
import type { ApiResponse } from '../../../types/shared';
import type { ExportResult } from '../service';

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

  // Retrieve route handler
  const route = exportRouter.stack.find((layer) => layer.route?.path === '/export');
  const handler = route?.route?.stack[0]?.handle;
  if (!handler) {
    throw new Error('Export route handler not found');
  }

  const next = (): void => {};
  handler(req, res, next);
  return { status: statusCode, body: responseBody };
}

describe('Export Router & Service', () => {
  let createdFiles: string[] = [];

  beforeEach((): void => {
    vi.clearAllMocks();
    createdFiles = [];

    vi.mocked(repo.getAllTasks).mockReturnValue([]);
    vi.mocked(repo.getAllReminders).mockReturnValue([]);
    vi.mocked(repo.getAllHabits).mockReturnValue([]);
    vi.mocked(repo.getAllHabitCompletions).mockReturnValue([]);
    vi.mocked(scoreService.computeScore).mockReturnValue({
      score: 85,
      taskCompletionRate: 0.8,
      reminderAckRate: 0.9,
      habitStreakConsistency: 0.85,
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

  it('POST /export writes a valid JSON file and returns 200 with filePath', async (): Promise<void> => {
    const { status, body } = await invokeExport();

    expect(status).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data).toBeDefined();
    expect(body.data?.filePath).toBeDefined();

    const filePath = body.data!.filePath;
    createdFiles.push(filePath);

    expect(existsSync(filePath)).toBe(true);
  });

  it('written export file contains all required top-level keys', async (): Promise<void> => {
    const { status, body } = await invokeExport();

    expect(status).toBe(200);
    const filePath = body.data!.filePath;
    createdFiles.push(filePath);

    const fileContent = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent) as Record<string, unknown>;

    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('tasks');
    expect(parsed).toHaveProperty('reminders');
    expect(parsed).toHaveProperty('habits');
    expect(parsed).toHaveProperty('habitCompletions');
    expect(parsed).toHaveProperty('score');
  });

  it('cleans up partial file and returns 500 when serialization or write fails', async (): Promise<void> => {
    vi.mocked(scoreService.computeScore).mockImplementation((): never => {
      throw new Error('Database disk error');
    });

    const { status, body } = await invokeExport();

    expect(status).toBe(500);
    expect(body.data).toBeNull();
    expect(body.error).toContain('Export failed: Database disk error');
  });
});
