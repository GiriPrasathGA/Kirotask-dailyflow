/**
 * Tests for the useScore custom hook.
 *
 * Requirements: 4.7, 4.8, 4.9
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScore } from '../hooks/useScore';
import type { ScoreData } from '../hooks/useScore';

const mockScoreData: ScoreData = {
  score: 92,
  taskCompletionRate: 0.95,
  reminderAckRate: 0.9,
  habitStreakConsistency: 0.9,
};

describe('useScore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches score data successfully with timezone parameter', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: mockScoreData,
        error: null,
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useScore());

    await act(async () => {
      await result.current.fetchScore();
    });

    expect(result.current.scoreData).toEqual(mockScoreData);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/score?timezone='),
    );
  });

  it('sets error state when API returns an error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: 'Invalid timezone parameter',
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useScore());

    await act(async () => {
      await result.current.fetchScore();
    });

    expect(result.current.scoreData).toBeNull();
    expect(result.current.error).toBe('Invalid timezone parameter');
  });
});
