/**
 * Property-based tests for Habits service layer.
 *
 * Requirements: 3.2, 3.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
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

describe('Habits Service Property Tests', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  // Feature: dailyflow, Property 10: Duplicate check-in rejected and leaves exactly one record
  it('Property 10: Duplicate check-in rejected and leaves exactly one record', (): void => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (habitId: string): void => {
          const habit: Habit = {
            id: habitId,
            name: 'Hydration',
            description: '',
            frequency: 'daily',
            active: true,
            createdAt: '2026-09-08T12:00:00.000Z',
          };

          const completions: HabitCompletion[] = [];
          vi.mocked(repo.findHabitById).mockReturnValue(habit);
          vi.mocked(repo.findCompletionByDate).mockImplementation((hId: string, date: string) => {
            return completions.find((c) => c.habitId === hId && c.completedDate === date) ?? null;
          });
          vi.mocked(repo.insertCompletion).mockImplementation((c: HabitCompletion) => {
            completions.push(c);
          });

          // First check-in succeeds
          const first = service.checkIn(habitId);
          expect(first).toBeDefined();
          expect(completions.length).toBe(1);

          // Second check-in on the same day fails with 409
          expect((): HabitCompletion => service.checkIn(habitId)).toThrowError(service.ServiceError);
          try {
            service.checkIn(habitId);
          } catch (err) {
            expect((err as service.ServiceError).statusCode).toBe(409);
          }

          // Exactly one completion record remains
          expect(completions.length).toBe(1);
        },
      ),
      { numRuns: 50 },
    );
  });

  // Feature: dailyflow, Property 11: Habit creation round-trip
  it('Property 11: Habit creation round-trip', (): void => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
        fc.option(fc.string({ maxLength: 500 })),
        (name: string, description: string | null): void => {
          const dto: CreateHabitDto = {
            name,
            description: description ?? undefined,
          };

          let savedHabit: Habit | null = null;
          vi.mocked(repo.insertHabit).mockImplementation((h: Habit): void => {
            savedHabit = h;
          });
          vi.mocked(repo.findHabitById).mockImplementation((id: string): Habit | null =>
            savedHabit && savedHabit.id === id ? savedHabit : null,
          );
          vi.mocked(repo.findCompletionsForHabit).mockReturnValue([]);

          const created = service.createHabit(dto);
          const retrieved = service.getHabitById(created.id);

          expect(retrieved).not.toBeNull();
          expect(retrieved?.name).toBe(name);
          expect(retrieved?.description).toBe(description ?? '');
          expect(retrieved?.frequency).toBe('daily');
          expect(retrieved?.active).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
