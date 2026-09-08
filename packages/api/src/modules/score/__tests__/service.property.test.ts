/**
 * Property-based tests for Productivity Score service layer.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as repo from '../repository';
import * as service from '../service';

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
vi.mock('../../habits/streakUtils', () => ({
  computeStreak: vi.fn().mockImplementation((dates: Date[]): number => (dates.length > 0 ? 1 : 0)),
}));

describe('Score Service Property Tests', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  // Feature: dailyflow, Property 12: Score formula and bounds
  it('Property 12: Score formula and bounds', (): void => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // total tasks
        fc.integer({ min: 0, max: 100 }), // done tasks (may exceed total in generator, clamped below)
        fc.integer({ min: 0, max: 100 }), // past reminders
        fc.integer({ min: 0, max: 100 }), // acked reminders
        fc.integer({ min: 0, max: 50 }),  // total habits
        fc.integer({ min: 0, max: 50 }),  // habits with streak
        (rawTotalT, rawDoneT, rawTotalR, rawAckR, rawTotalH, rawStreakH): void => {
          const totalTasks = rawTotalT;
          const doneTasks = Math.min(rawDoneT, totalTasks);

          const pastReminders = rawTotalR;
          const ackedReminders = Math.min(rawAckR, pastReminders);

          const totalHabits = rawTotalH;
          const streakHabits = Math.min(rawStreakH, totalHabits);

          vi.mocked(repo.countTotalTasks).mockReturnValue(totalTasks);
          vi.mocked(repo.countDoneTasks).mockReturnValue(doneTasks);
          vi.mocked(repo.countPastReminders).mockReturnValue(pastReminders);
          vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(ackedReminders);

          const habitIds = Array.from({ length: totalHabits }, (_, i) => `h-${i}`);
          vi.mocked(repo.findActiveHabitIds).mockReturnValue(habitIds);
          vi.mocked(repo.findCompletionDatesForHabit).mockImplementation((id: string) => {
            const index = parseInt(id.replace('h-', ''), 10);
            return index < streakHabits ? ['2026-09-08'] : [];
          });

          const result = service.computeScore('UTC');

          const expectedTcr = totalTasks === 0 ? 0 : doneTasks / totalTasks;
          const expectedRar = pastReminders === 0 ? 0 : ackedReminders / pastReminders;
          const expectedHsc = totalHabits === 0 ? 0 : streakHabits / totalHabits;

          const rawExpectedScore = (expectedTcr * 0.4 + expectedRar * 0.3 + expectedHsc * 0.3) * 100;
          const expectedScore = Math.round(rawExpectedScore * 100) / 100;

          // Bounds guarantee
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
          expect(result.taskCompletionRate).toBeGreaterThanOrEqual(0);
          expect(result.taskCompletionRate).toBeLessThanOrEqual(1);
          expect(result.reminderAckRate).toBeGreaterThanOrEqual(0);
          expect(result.reminderAckRate).toBeLessThanOrEqual(1);
          expect(result.habitStreakConsistency).toBeGreaterThanOrEqual(0);
          expect(result.habitStreakConsistency).toBeLessThanOrEqual(1);

          // Value and formula verification
          expect(result.taskCompletionRate).toBe(expectedTcr);
          expect(result.reminderAckRate).toBe(expectedRar);
          expect(result.habitStreakConsistency).toBe(expectedHsc);
          expect(result.score).toBe(expectedScore);
        },
      ),
      { numRuns: 1000 },
    );
  });
});
