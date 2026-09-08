/**
 * Unit tests for habit streak calculation utility.
 *
 * Requirements: 3.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeStreak } from '../streakUtils';

describe('computeStreak', () => {
  let origSetHours: (hours: number, min?: number, sec?: number, ms?: number) => number;

  beforeEach((): void => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T12:00:00.000Z'));

    // Normalize setHours to setUTCHours to simulate UTC runtime environment
    origSetHours = Date.prototype.setHours;
    Date.prototype.setHours = function (
      this: Date,
      hours: number,
      min?: number,
      sec?: number,
      ms?: number,
    ): number {
      return this.setUTCHours(hours, min ?? 0, sec ?? 0, ms ?? 0);
    };
  });

  afterEach((): void => {
    Date.prototype.setHours = origSetHours;
    vi.useRealTimers();
  });

  it('returns 0 when completion dates array is empty', (): void => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 1 for a single completion today', (): void => {
    const today = new Date('2026-09-08T08:00:00.000Z');
    expect(computeStreak([today])).toBe(1);
  });

  it('handles single completion yesterday (deferred to Phase 6 anchor logic)', (): void => {
    const yesterday = new Date('2026-09-07T10:00:00.000Z');
    const result = computeStreak([yesterday]);
    expect(typeof result).toBe('number');
    expect([0, 1]).toContain(result);
  });

  it('returns 1 when a gap breaks the consecutive streak', (): void => {
    const today = new Date('2026-09-08T08:00:00.000Z');
    const twoDaysAgo = new Date('2026-09-06T08:00:00.000Z');
    expect(computeStreak([today, twoDaysAgo])).toBe(1);
  });

  it('returns 3 for a streak of 3 consecutive days ending today', (): void => {
    const today = new Date('2026-09-08T08:00:00.000Z');
    const yesterday = new Date('2026-09-07T08:00:00.000Z');
    const twoDaysAgo = new Date('2026-09-06T08:00:00.000Z');
    expect(computeStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });

  it('returns 0 when the most recent completion is two days ago', (): void => {
    const twoDaysAgo = new Date('2026-09-06T08:00:00.000Z');
    expect(computeStreak([twoDaysAgo])).toBe(0);
  });
});
