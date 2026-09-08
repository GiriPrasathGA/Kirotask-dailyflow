/**
 * Unit tests for the Habits service layer.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repo from '../repository';
import * as service from '../service';
import type { Habit, CreateHabitDto, HabitCompletion } from '../types';

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

describe('Habits Service', () => {
  const activeHabit: Habit = {
    id: 'habit-uuid-1',
    name: 'Morning Workout',
    description: '30 mins cardio',
    frequency: 'daily',
    active: true,
    createdAt: '2026-09-08T12:00:00.000Z',
  };

  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('createHabit', () => {
    it('succeeds with valid name and creates active habit', (): void => {
      const dto: CreateHabitDto = {
        name: 'Daily Meditation',
        description: '10 minutes',
      };

      vi.mocked(repo.insertHabit).mockImplementation((): void => {});

      const result = service.createHabit(dto);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
      expect(result.active).toBe(true);
      expect(result.frequency).toBe('daily');
      expect(repo.insertHabit).toHaveBeenCalledWith(result);
    });

    it('fails with 400 when name is empty or whitespace', (): void => {
      const dto: CreateHabitDto = { name: '   ' };
      expect((): Habit => service.createHabit(dto)).toThrowError(service.ServiceError);
    });
  });

  describe('checkIn', () => {
    it('records completion successfully for an active habit', (): void => {
      vi.mocked(repo.findHabitById).mockReturnValue(activeHabit);
      vi.mocked(repo.findCompletionByDate).mockReturnValue(null);
      vi.mocked(repo.insertCompletion).mockImplementation((): void => {});

      const result = service.checkIn('habit-uuid-1');

      expect(result.id).toBeDefined();
      expect(result.habitId).toBe('habit-uuid-1');
      expect(result.completedDate).toBeDefined();
      expect(repo.insertCompletion).toHaveBeenCalledWith(result);
    });

    it('returns 409 conflict when duplicate check-in occurs on the same day', (): void => {
      const existingCompletion: HabitCompletion = {
        id: 'comp-1',
        habitId: 'habit-uuid-1',
        completedDate: new Date().toISOString().split('T')[0] as string,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(repo.findHabitById).mockReturnValue(activeHabit);
      vi.mocked(repo.findCompletionByDate).mockReturnValue(existingCompletion);

      expect((): HabitCompletion => service.checkIn('habit-uuid-1')).toThrowError(service.ServiceError);
      try {
        service.checkIn('habit-uuid-1');
      } catch (err) {
        expect((err as service.ServiceError).statusCode).toBe(409);
      }
    });

    it('returns 409 conflict when checking in on an inactive habit', (): void => {
      const inactiveHabit: Habit = { ...activeHabit, active: false };
      vi.mocked(repo.findHabitById).mockReturnValue(inactiveHabit);

      expect((): HabitCompletion => service.checkIn('habit-uuid-1')).toThrowError(service.ServiceError);
      try {
        service.checkIn('habit-uuid-1');
      } catch (err) {
        expect((err as service.ServiceError).statusCode).toBe(409);
      }
    });
  });

  describe('deactivateHabit', () => {
    it('sets active=false by calling repository deactivation', (): void => {
      vi.mocked(repo.deactivateHabit).mockReturnValue(true);

      const result = service.deactivateHabit('habit-uuid-1');
      expect(result).toBe(true);
      expect(repo.deactivateHabit).toHaveBeenCalledWith('habit-uuid-1');
    });
  });

  describe('listHabits', () => {
    it('returns only active habits with streak attached', (): void => {
      vi.mocked(repo.countActiveHabits).mockReturnValue(1);
      vi.mocked(repo.findAllActiveHabits).mockReturnValue([activeHabit]);
      vi.mocked(repo.findCompletionsForHabit).mockReturnValue([]);

      const result = service.listHabits(1, 20);

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.name).toBe('Morning Workout');
      expect(result.items[0]?.streak).toBeDefined();
      expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
      expect(repo.findAllActiveHabits).toHaveBeenCalledWith(20, 0);
    });
  });
});
