/**
 * Tests for the useTasks custom hook with optimistic updates and error rollback.
 *
 * Requirements: 1.7, 1.8, 1.9, 1.10, 1.11
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types';

const sampleTask: Task = {
  id: 'task-1',
  title: 'Original Task',
  description: 'Desc',
  status: 'todo',
  priority: 'medium',
  category: 'work',
  dueDate: null,
  createdAt: '2026-09-01T00:00:00Z',
};

describe('useTasks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches tasks successfully and updates state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { items: [sampleTask], meta: { page: 1, pageSize: 20, total: 1 } },
        error: null,
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Original Task');
    expect(result.current.error).toBeNull();
  });

  it('rolls back task addition when API request fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: 'Validation failed',
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({
        title: 'New Failed Task',
        priority: 'high',
        category: 'work',
      });
    });

    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.error).toBe('Validation failed');
  });

  it('moves task status and rolls back on failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: 'Network timeout',
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.moveTask(sampleTask.id, 'done');
    });

    expect(result.current.error).toBe('Network timeout');
  });
});
