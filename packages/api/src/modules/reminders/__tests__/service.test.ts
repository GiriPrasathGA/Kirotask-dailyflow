/**
 * Unit tests for the Reminders service layer.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Reminders Service', () => {
  const sampleReminder: Reminder = {
    id: 'reminder-uuid-1',
    title: 'Review team PRs',
    dueAt: '2026-09-08T18:00:00.000Z',
    acknowledged: false,
    createdAt: '2026-09-08T12:00:00.000Z',
  };

  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('createReminder', () => {
    it('succeeds with valid title and dueAt', (): void => {
      const dto: CreateReminderDto = {
        title: 'Standup meeting',
        dueAt: '2026-09-09T09:30:00.000Z',
      };

      vi.mocked(repo.insertReminder).mockImplementation((): void => {});

      const result = service.createReminder(dto);

      expect(result.id).toBeDefined();
      expect(result.title).toBe(dto.title);
      expect(result.dueAt).toBe(dto.dueAt);
      expect(result.acknowledged).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(repo.insertReminder).toHaveBeenCalledWith(result);
    });

    it('fails with 400 when title is empty', (): void => {
      const dto: CreateReminderDto = {
        title: '   ',
        dueAt: '2026-09-09T09:30:00.000Z',
      };
      expect((): Reminder => service.createReminder(dto)).toThrowError(service.ServiceError);
    });

    it('fails with 400 when dueAt is invalid', (): void => {
      const dto: CreateReminderDto = {
        title: 'Valid title',
        dueAt: 'not-a-valid-date',
      };
      expect((): Reminder => service.createReminder(dto)).toThrowError(service.ServiceError);
    });
  });

  describe('acknowledgeReminder', () => {
    it('sets acknowledged to true when found', (): void => {
      vi.mocked(repo.findReminderById).mockReturnValue(sampleReminder);
      const ackedReminder: Reminder = { ...sampleReminder, acknowledged: true };
      vi.mocked(repo.setAcknowledged).mockReturnValue(ackedReminder);

      const result = service.acknowledgeReminder('reminder-uuid-1');

      expect(result).toEqual(ackedReminder);
      expect(result?.acknowledged).toBe(true);
      expect(repo.setAcknowledged).toHaveBeenCalledWith('reminder-uuid-1');
    });

    it('is idempotent when reminder is already acknowledged', (): void => {
      const alreadyAcked: Reminder = { ...sampleReminder, acknowledged: true };
      vi.mocked(repo.findReminderById).mockReturnValue(alreadyAcked);
      vi.mocked(repo.setAcknowledged).mockReturnValue(alreadyAcked);

      const result = service.acknowledgeReminder('reminder-uuid-1');

      expect(result).toEqual(alreadyAcked);
      expect(result?.acknowledged).toBe(true);
    });

    it('returns null when reminder does not exist', (): void => {
      vi.mocked(repo.findReminderById).mockReturnValue(null);

      const result = service.acknowledgeReminder('unknown-id');
      expect(result).toBeNull();
      expect(repo.setAcknowledged).not.toHaveBeenCalled();
    });
  });

  describe('getReminderById', () => {
    it('returns null for an unknown id', (): void => {
      vi.mocked(repo.findReminderById).mockReturnValue(null);

      const result = service.getReminderById('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('listReminders', () => {
    it('returns paginated reminders sorted by dueAt ASC', (): void => {
      const reminderA: Reminder = { ...sampleReminder, id: 'r1', dueAt: '2026-09-08T10:00:00.000Z' };
      const reminderB: Reminder = { ...sampleReminder, id: 'r2', dueAt: '2026-09-08T15:00:00.000Z' };

      vi.mocked(repo.countReminders).mockReturnValue(2);
      vi.mocked(repo.findAllReminders).mockReturnValue([reminderA, reminderB]);

      const result = service.listReminders(1, 20);

      expect(result.items).toEqual([reminderA, reminderB]);
      expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 2 });
      expect(repo.findAllReminders).toHaveBeenCalledWith(20, 0);
    });
  });
});
