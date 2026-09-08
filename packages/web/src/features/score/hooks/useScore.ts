/**
 * Custom React hook for fetching and managing Productivity Score data.
 *
 * Requirements: 4.7, 4.8, 4.9
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Shape of the composite Productivity Score data.
 */
export interface ScoreData {
  score: number;
  taskCompletionRate: number;
  reminderAckRate: number;
  habitStreakConsistency: number;
}

/** Standard API response envelope. */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Return signature for the useScore hook. */
export interface UseScoreReturn {
  scoreData: ScoreData | null;
  error: string | null;
  loading: boolean;
  fetchScore: () => Promise<void>;
}

/**
 * Hook for retrieving the user's Productivity Score with local timezone detection.
 *
 * @returns State and fetch handler for score management
 */
export function useScore(): UseScoreReturn {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Detect the user's IANA timezone once
  const timezone = useMemo<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  /**
   * Fetches the current productivity score from the API.
   *
   * @returns Promise resolving when score data is retrieved
   */
  const fetchScore = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/score?timezone=${encodeURIComponent(timezone)}`);
      const json: ApiResponse<ScoreData> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to fetch productivity score');
      }
      setScoreData(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    scoreData,
    error,
    loading,
    fetchScore,
  };
}
