/**
 * Property-based tests for habit streak calculation utility.
 *
 * Requirements: 3.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { computeStreak } from '../streakUtils';

/**
 * Helper to compute today in a specified timezone using Intl.DateTimeFormat.
 *
 * @param tz - IANA timezone identifier
 * @returns Formatted date string in YYYY-MM-DD
 */
function getTodayInTimezone(tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

describe('streakUtils property tests', () => {
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

  // Feature: dailyflow, Property 8: computeStreak returns correct consecutive count
  it('Property 8: computeStreak returns correct consecutive count', (): void => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        (length: number): void => {
          const baseTime = new Date('2026-09-08T12:00:00.000Z').getTime();
          const dates: Date[] = Array.from(
            { length },
            (_, i: number) => new Date(baseTime - i * 86400000),
          );

          const result = computeStreak(dates);
          if (length === 0) {
            expect(result).toBe(0);
          } else {
            expect(result).toBe(length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: dailyflow, Property 9: todayInTimezone returns correct local date
  it('Property 9: todayInTimezone returns correct local date', (): void => {
    const representativeTimezones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Kolkata',
      'Australia/Sydney',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...representativeTimezones),
        (tz: string): void => {
          const result = getTodayInTimezone(tz);
          expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          const expectedParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());

          expect(result).toBe(expectedParts);
        },
      ),
      { numRuns: 50 },
    );
  });
});
