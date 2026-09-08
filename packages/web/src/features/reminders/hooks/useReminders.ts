/**
 * Custom React hook for managing Reminders state and operations.
 *
 * Implements optimistic updates for creating, removing, and acknowledging reminders,
 * with automatic rollback on API errors.
 *
 * Requirements: 2.6, 2.7, 2.8, 2.9
 */

import { useState, useEffect, useCallback } from 'react';
import type { Reminder } from '../types';

/** Standard API response envelope matching backend contract. */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Paginated list response envelope. */
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/** Data-transfer object for creating a new Reminder. */
export interface CreateReminderDto {
  title: string;
  dueAt: string;
}

/** Return signature for the useReminders hook. */
export interface UseRemindersReturn {
  reminders: Reminder[];
  error: string | null;
  loading: boolean;
  fetchReminders: () => Promise<void>;
  addReminder: (dto: CreateReminderDto) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  acknowledge: (id: string) => Promise<void>;
}

/**
 * Hook for fetching, creating, acknowledging, and deleting reminders.
 *
 * @returns State and action handlers for reminder management
 */
export function useReminders(): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Fetches the latest reminders from the API.
   *
   * @returns Promise resolving when reminders have been loaded into state
   */
  const fetchReminders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/reminders?pageSize=100');
      const json: ApiResponse<PaginatedResponse<Reminder>> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to fetch reminders');
      }
      setReminders(json.data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adds a new reminder with optimistic append to state and rollback on error.
   *
   * @param dto - Reminder creation payload
   * @returns Promise resolving when the add operation completes
   */
  const addReminder = useCallback(async (dto: CreateReminderDto): Promise<void> => {
    setError(null);
    const optimisticReminder: Reminder = {
      id: crypto.randomUUID(),
      title: dto.title,
      dueAt: dto.dueAt,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };

    setReminders((prev: Reminder[]) => [...prev, optimisticReminder]);

    try {
      const res = await fetch('/api/v1/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const json: ApiResponse<Reminder> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to create reminder');
      }
      setReminders((prev: Reminder[]) =>
        prev.map((r: Reminder) => (r.id === optimisticReminder.id ? json.data! : r)),
      );
    } catch (err) {
      setReminders((prev: Reminder[]) => prev.filter((r: Reminder) => r.id !== optimisticReminder.id));
      setError((err as Error).message);
    }
  }, []);

  /**
   * Deletes a reminder by UUID with optimistic removal and rollback on error.
   *
   * @param id - UUID of the reminder to delete
   * @returns Promise resolving when the delete operation completes
   */
  const removeReminder = useCallback(async (id: string): Promise<void> => {
    setError(null);
    let previousReminders: Reminder[] = [];

    setReminders((prev: Reminder[]) => {
      previousReminders = prev;
      return prev.filter((r: Reminder) => r.id !== id);
    });

    try {
      const res = await fetch(`/api/v1/reminders/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        let errorMsg = 'Failed to delete reminder';
        try {
          const json: ApiResponse<null> = await res.json();
          if (json.error) errorMsg = json.error;
        } catch {
          // ignore json parse error on non-json error responses
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      setReminders(previousReminders);
      setError((err as Error).message);
    }
  }, []);

  /**
   * Acknowledges a reminder with optimistic update and rollback on error.
   *
   * @param id - UUID of the reminder to acknowledge
   * @returns Promise resolving when the acknowledge operation completes
   */
  const acknowledge = useCallback(async (id: string): Promise<void> => {
    setError(null);
    let previousReminder: Reminder | undefined;

    setReminders((prev: Reminder[]) => {
      previousReminder = prev.find((r: Reminder) => r.id === id);
      return prev.map((r: Reminder) => (r.id === id ? { ...r, acknowledged: true } : r));
    });

    try {
      const res = await fetch(`/api/v1/reminders/${id}/acknowledge`, {
        method: 'POST',
      });
      const json: ApiResponse<Reminder> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to acknowledge reminder');
      }
      setReminders((prev: Reminder[]) =>
        prev.map((r: Reminder) => (r.id === id ? json.data! : r)),
      );
    } catch (err) {
      if (previousReminder) {
        const revertReminder = previousReminder;
        setReminders((prev: Reminder[]) =>
          prev.map((r: Reminder) => (r.id === id ? revertReminder : r)),
        );
      }
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return {
    reminders,
    error,
    loading,
    fetchReminders,
    addReminder,
    removeReminder,
    acknowledge,
  };
}
