/**
 * Tests for the useReminders custom hook.
 *
 * Requirements: 2.6, 2.7, 2.8, 2.9
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReminders } from '../hooks/useReminders';
import type { Reminder } from '../types';

const sampleReminder: Reminder = {
  id: 'rem-1',
  title: 'Daily Standup',
  dueAt: '2026-09-08T10:00:00Z',
  acknowledged: false,
  createdAt: '2026-09-01T00:00:00Z',
};

describe('useReminders', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches reminders on mount and populates state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async (): Promise<{
        data: { items: Reminder[]; meta: { page: number; pageSize: number; total: number } };
        error: null;
      }> => ({
        data: { items: [sampleReminder], meta: { page: 1, pageSize: 20, total: 1 } },
        error: null,
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0].title).toBe('Daily Standup');
    expect(result.current.error).toBeNull();
  });

  it('handles addReminder failure by setting error and rolling back state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async (): Promise<{ data: null; error: string }> => ({
        data: null,
        error: 'Invalid due date',
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.addReminder({
        title: 'New Failed Reminder',
        dueAt: '2026-09-09T10:00:00Z',
      });
    });

    expect(result.current.reminders).toHaveLength(0);
    expect(result.current.error).toBe('Invalid due date');
  });

  it('acknowledges reminder and updates acknowledged flag', async () => {
    const acked = { ...sampleReminder, acknowledged: true };
    const mockFetch = vi.fn().mockImplementation(async (url: string): Promise<{
      ok: boolean;
      json: () => Promise<unknown>;
    }> => {
      if (typeof url === 'string' && url.includes('/acknowledge')) {
        return {
          ok: true,
          json: async (): Promise<{ data: Reminder; error: null }> => ({ data: acked, error: null }),
        };
      }
      return {
        ok: true,
        json: async (): Promise<{
          data: { items: Reminder[]; meta: { page: number; pageSize: number; total: number } };
          error: null;
        }> => ({
          data: { items: [sampleReminder], meta: { page: 1, pageSize: 20, total: 1 } },
          error: null,
        }),
      };
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.fetchReminders();
    });

    await act(async () => {
      await result.current.acknowledge('rem-1');
    });

    expect(result.current.reminders[0].acknowledged).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
