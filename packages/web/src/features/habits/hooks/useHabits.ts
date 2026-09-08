/**
 * Custom React hook for managing Habits state and operations.
 *
 * Handles habit retrieval, creation, and optimistic daily check-ins
 * with timezone awareness and automatic rollback on API errors.
 *
 * Requirements: 3.10, 3.11
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Habit } from '../types';

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

/** Data-transfer object for creating a new Habit. */
export interface CreateHabitDto {
  name: string;
  description?: string;
  frequency?: 'daily';
}

/** Return signature for the useHabits hook. */
export interface UseHabitsReturn {
  habits: Habit[];
  error: string | null;
  loading: boolean;
  fetchHabits: () => Promise<void>;
  addHabit: (dto: CreateHabitDto) => Promise<void>;
  checkIn: (id: string) => Promise<void>;
}

/**
 * Hook for fetching, creating, and checking in on habits.
 *
 * @returns State and action handlers for habit management
 */
export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Detect the user's IANA timezone once
  const timezone = useMemo<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  /**
   * Fetches the latest active habits with current streak counts from the API.
   *
   * @returns Promise resolving when habits have been loaded into state
   */
  const fetchHabits = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/habits?timezone=${encodeURIComponent(timezone)}&pageSize=100`);
      const json: ApiResponse<PaginatedResponse<Habit>> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to fetch habits');
      }
      setHabits(json.data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  /**
   * Creates a new habit via POST and refreshes the habits list upon success.
   *
   * @param dto - Habit creation payload
   * @returns Promise resolving when the habit is created and list refreshed
   */
  const addHabit = useCallback(
    async (dto: CreateHabitDto): Promise<void> => {
      setError(null);
      try {
        const res = await fetch('/api/v1/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });
        const json: ApiResponse<Habit> = await res.json();
        if (!res.ok || json.error || !json.data) {
          throw new Error(json.error ?? 'Failed to create habit');
        }
        await fetchHabits();
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [fetchHabits],
  );

  /**
   * Records a daily check-in with optimistic state update and rollback on error.
   * On success, refreshes the habits list to synchronize authoritative streak counts.
   *
   * @param id - UUID of the habit to check in
   * @returns Promise resolving when the check-in operation completes
   */
  const checkIn = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      let previousHabits: Habit[] = [];

      setHabits((prev: Habit[]) => {
        previousHabits = prev;
        return prev.map((h: Habit) =>
          h.id === id ? { ...h, streak: (h.streak ?? 0) + 1, checkedInToday: true } : h,
        );
      });

      try {
        const res = await fetch(
          `/api/v1/habits/${id}/check-in?timezone=${encodeURIComponent(timezone)}`,
          {
            method: 'POST',
          },
        );
        const json: ApiResponse<unknown> = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error ?? 'Failed to check in');
        }
        await fetchHabits();
      } catch (err) {
        setHabits(previousHabits);
        setError((err as Error).message);
      }
    },
    [timezone, fetchHabits],
  );

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  return {
    habits,
    error,
    loading,
    fetchHabits,
    addHabit,
    checkIn,
  };
}
