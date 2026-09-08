/**
 * Tests for the useHabits custom hook.
 *
 * Requirements: 3.8, 3.9, 3.10
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useHabits } from '../hooks/useHabits';
import type { Habit } from '../types';

const sampleHabit: Habit = {
  id: 'habit-1',
  name: 'Read Book',
  description: 'Read 10 pages',
  frequency: 'daily',
  streak: 3,
  active: true,
  checkedInToday: false,
  createdAt: '2026-09-01T00:00:00Z',
};

describe('useHabits', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches habits on mount and populates state with streak data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { items: [sampleHabit], meta: { page: 1, pageSize: 20, total: 1 } },
        error: null,
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useHabits());

    await act(async () => {
      await result.current.fetchHabits();
    });

    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].name).toBe('Read Book');
    expect(result.current.habits[0].streak).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('handles addHabit failure by setting error and rolling back state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: 'Name is required',
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useHabits());

    await act(async () => {
      await result.current.addHabit({
        name: 'Invalid Habit',
        frequency: 'daily',
      });
    });

    expect(result.current.habits).toHaveLength(0);
    expect(result.current.error).toBe('Name is required');
  });

  it('performs check-in and updates habit state', async () => {
    const updatedHabit: Habit = { ...sampleHabit, streak: 4, checkedInToday: true };
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/check-in')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { id: 'comp-1', habitId: 'habit-1', completedDate: '2026-09-08', createdAt: '' },
            error: null,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: { items: [updatedHabit], meta: { page: 1, pageSize: 20, total: 1 } },
          error: null,
        }),
      });
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useHabits());

    await act(async () => {
      await result.current.checkIn('habit-1');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.habits[0]?.checkedInToday).toBe(true);
    expect(result.current.habits[0]?.streak).toBe(4);
  });

  it('handles 409 duplicate check-in by preserving state and setting error', async () => {
    const checkedHabit: Habit = { ...sampleHabit, streak: 4, checkedInToday: true };
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/check-in')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            data: null,
            error: 'Already checked in today',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: { items: [checkedHabit], meta: { page: 1, pageSize: 20, total: 1 } },
          error: null,
        }),
      });
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useHabits());

    await act(async () => {
      await result.current.checkIn('habit-1');
    });

    expect(result.current.error).toBe('Already checked in today');
    expect(result.current.habits[0]?.checkedInToday).toBe(true);
    expect(result.current.habits[0]?.streak).toBe(4);
  });
});
