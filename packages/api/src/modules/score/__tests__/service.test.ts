/**
 * Unit tests for the Productivity Score service layer.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Productivity Score Service', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('computeScore Formula and Weights', () => {
    it('computes score=100.00 when all rates are 1.0 (tcr=1, rar=1, hsc=1)', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(10);
      vi.mocked(repo.countDoneTasks).mockReturnValue(10);
      vi.mocked(repo.countPastReminders).mockReturnValue(5);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(5);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue(['h1']);
      vi.mocked(repo.findCompletionDatesForHabit).mockReturnValue(['2026-09-08']);

      const result = service.computeScore('UTC');

      expect(result.taskCompletionRate).toBe(1);
      expect(result.reminderAckRate).toBe(1);
      expect(result.habitStreakConsistency).toBe(1);
      expect(result.score).toBe(100.0);
    });

    it('computes score=20.00 when only tcr=0.5 and others are 0 (0.5 * 0.4 * 100)', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(10);
      vi.mocked(repo.countDoneTasks).mockReturnValue(5);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const result = service.computeScore('UTC');

      expect(result.taskCompletionRate).toBe(0.5);
      expect(result.reminderAckRate).toBe(0);
      expect(result.habitStreakConsistency).toBe(0);
      expect(result.score).toBe(20.0);
    });

    it('computes score=30.00 when only rar=1 and others are 0 (1 * 0.3 * 100)', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countDoneTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(4);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(4);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const result = service.computeScore('UTC');

      expect(result.taskCompletionRate).toBe(0);
      expect(result.reminderAckRate).toBe(1);
      expect(result.habitStreakConsistency).toBe(0);
      expect(result.score).toBe(30.0);
    });

    it('computes score=30.00 when only hsc=1 and others are 0 (1 * 0.3 * 100)', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countDoneTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue(['h1']);
      vi.mocked(repo.findCompletionDatesForHabit).mockReturnValue(['2026-09-08']);

      const result = service.computeScore('UTC');

      expect(result.taskCompletionRate).toBe(0);
      expect(result.reminderAckRate).toBe(0);
      expect(result.habitStreakConsistency).toBe(1);
      expect(result.score).toBe(30.0);
    });

    it('applies exact weights: 0.4 for tasks, 0.3 for reminders, 0.3 for habits', (): void => {
      // 0.25 * 0.4 + 0.5 * 0.3 + 0.75 * 0.3 = 0.10 + 0.15 + 0.225 = 0.475 -> 47.50
      vi.mocked(repo.countTotalTasks).mockReturnValue(4);
      vi.mocked(repo.countDoneTasks).mockReturnValue(1); // 0.25
      vi.mocked(repo.countPastReminders).mockReturnValue(4);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(2); // 0.5
      vi.mocked(repo.findActiveHabitIds).mockReturnValue(['h1', 'h2', 'h3', 'h4']);
      vi.mocked(repo.findCompletionDatesForHabit).mockImplementation((id: string): string[] =>
        id === 'h4' ? [] : ['2026-09-08'],
      ); // 3 of 4 = 0.75

      const result = service.computeScore('UTC');

      expect(result.taskCompletionRate).toBe(0.25);
      expect(result.reminderAckRate).toBe(0.5);
      expect(result.habitStreakConsistency).toBe(0.75);
      expect(result.score).toBe(47.5);
    });
  });

  describe('Zero-Denominator Edge Cases', () => {
    it('sets taskCompletionRate = 0 when totalTasks = 0', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countDoneTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const result = service.computeScore('UTC');
      expect(result.taskCompletionRate).toBe(0);
    });

    it('sets reminderAckRate = 0 when pastTotalReminders = 0', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const result = service.computeScore('UTC');
      expect(result.reminderAckRate).toBe(0);
    });

    it('sets habitStreakConsistency = 0 when activeHabits = 0', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const result = service.computeScore('UTC');
      expect(result.habitStreakConsistency).toBe(0);
    });
  });

  describe('Score Range and Precision', () => {
    it('ensures score is always between 0 and 100 inclusive', (): void => {
      vi.mocked(repo.countTotalTasks).mockReturnValue(0);
      vi.mocked(repo.countPastReminders).mockReturnValue(0);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue([]);

      const zeroScore = service.computeScore('UTC');
      expect(zeroScore.score).toBeGreaterThanOrEqual(0);
      expect(zeroScore.score).toBeLessThanOrEqual(100);
    });

    it('rounds score to exactly two decimal places', (): void => {
      // 1/3 * 0.4 + 1/3 * 0.3 + 1/3 * 0.3 = 1/3 * 1.0 = 0.333333... -> 33.33
      vi.mocked(repo.countTotalTasks).mockReturnValue(3);
      vi.mocked(repo.countDoneTasks).mockReturnValue(1);
      vi.mocked(repo.countPastReminders).mockReturnValue(3);
      vi.mocked(repo.countAcknowledgedPastReminders).mockReturnValue(1);
      vi.mocked(repo.findActiveHabitIds).mockReturnValue(['h1', 'h2', 'h3']);
      vi.mocked(repo.findCompletionDatesForHabit).mockImplementation((id: string): string[] =>
        id === 'h1' ? ['2026-09-08'] : [],
      );

      const result = service.computeScore('UTC');
      expect(result.score).toBe(33.33);
    });
  });
});
