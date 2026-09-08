/**
 * Property-based tests for Reminders service layer.
 *
 * Requirements: 2.2, 2.4, 2.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as repo from '../repository';
import * as service from '../service';
import type { Reminder, CreateReminderDto } from '../types';

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

describe('Reminders Service Property Tests', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  // Feature: dailyflow, Property 5: Reminder creation round-trip
  it('Property 5: Reminder creation round-trip', (): void => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (title: string, dueDate: Date): void => {
          const dueAt = dueDate.toISOString();
          const dto: CreateReminderDto = { title, dueAt };

          let savedReminder: Reminder | null = null;
          vi.mocked(repo.insertReminder).mockImplementation((r: Reminder): void => {
            savedReminder = r;
          });
          vi.mocked(repo.findReminderById).mockImplementation((id: string): Reminder | null =>
            savedReminder && savedReminder.id === id ? savedReminder : null,
          );

          const created = service.createReminder(dto);
          const retrieved = service.getReminderById(created.id);

          expect(retrieved).not.toBeNull();
          expect(retrieved?.title).toBe(title);
          expect(retrieved?.dueAt).toBe(dueAt);
          expect(retrieved?.acknowledged).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: dailyflow, Property 6: Acknowledge is idempotent
  it('Property 6: Acknowledge is idempotent', (): void => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (ackCount: number): void => {
          let current: Reminder = {
            id: 'rem-prop-1',
            title: 'Water plants',
            dueAt: '2026-09-08T18:00:00.000Z',
            acknowledged: false,
            createdAt: '2026-09-08T12:00:00.000Z',
          };

          vi.mocked(repo.findReminderById).mockImplementation(() => current);
          vi.mocked(repo.setAcknowledged).mockImplementation(() => {
            current = { ...current, acknowledged: true };
            return current;
          });

          for (let i = 0; i < ackCount; i++) {
            const result = service.acknowledgeReminder('rem-prop-1');
            expect(result).not.toBeNull();
            expect(result?.acknowledged).toBe(true);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  // Feature: dailyflow, Property 7: Reminder list sorted by dueAt ascending
  it('Property 7: Reminder list sorted by dueAt ascending', (): void => {
    fc.assert(
      fc.property(
        fc.array(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          { minLength: 1, maxLength: 20 },
        ),
        (dates: Date[]): void => {
          const reminders: Reminder[] = dates.map((d: Date, idx: number) => ({
            id: `r-${idx}`,
            title: `Reminder ${idx}`,
            dueAt: d.toISOString(),
            acknowledged: false,
            createdAt: '2026-09-08T12:00:00.000Z',
          }));

          const sorted = [...reminders].sort(
            (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
          );

          vi.mocked(repo.countReminders).mockReturnValue(sorted.length);
          vi.mocked(repo.findAllReminders).mockReturnValue(sorted);

          const result = service.listReminders(1, 100);

          for (let i = 0; i < result.items.length - 1; i++) {
            const tA = new Date(result.items[i]!.dueAt).getTime();
            const tB = new Date(result.items[i + 1]!.dueAt).getTime();
            expect(tA).toBeLessThanOrEqual(tB);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
