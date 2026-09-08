/**
 * Tests for the ProductivityScore component.
 *
 * Requirements: 4.7, 4.8, 4.9
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductivityScore } from '../components/ProductivityScore';
import * as scoreHook from '../hooks/useScore';
import type { ScoreData } from '../hooks/useScore';

vi.mock('../components/ExportButton', () => ({
  ExportButton: (): JSX.Element => <div data-testid="export-button">Export Button Mock</div>,
}));

const mockScoreData: ScoreData = {
  score: 85,
  taskCompletionRate: 0.8,
  reminderAckRate: 0.9,
  habitStreakConsistency: 0.85,
};

describe('ProductivityScore', () => {
  it('renders loading state when loading and no score data', () => {
    vi.spyOn(scoreHook, 'useScore').mockReturnValue({
      scoreData: null,
      error: null,
      loading: true,
      fetchScore: vi.fn().mockResolvedValue(undefined),
    });

    render(<ProductivityScore />);

    expect(screen.getByText(/loading score\.\.\./i)).toBeTruthy();
    expect(screen.queryByText('Overall Score (out of 100)')).toBeNull();
  });

  it('renders error banner and avoids showing stale score when error exists', () => {
    vi.spyOn(scoreHook, 'useScore').mockReturnValue({
      scoreData: mockScoreData,
      error: 'Failed to compute score',
      loading: false,
      fetchScore: vi.fn().mockResolvedValue(undefined),
    });

    render(<ProductivityScore />);

    expect(screen.getByText(/Failed to compute score/i)).toBeTruthy();
    expect(screen.queryByText('Overall Score (out of 100)')).toBeNull();
  });

  it('renders numeric score, progress bar, and all component metric rates', () => {
    vi.spyOn(scoreHook, 'useScore').mockReturnValue({
      scoreData: mockScoreData,
      error: null,
      loading: false,
      fetchScore: vi.fn().mockResolvedValue(undefined),
    });

    render(<ProductivityScore />);

    expect(screen.getByText('85')).toBeTruthy();
    expect(screen.getByText('Overall Score (out of 100)')).toBeTruthy();

    const progressBar = screen.getByRole('progressbar') as HTMLProgressElement;
    expect(progressBar.value).toBe(85);
    expect(progressBar.max).toBe(100);

    expect(screen.getByText('Task Completion Rate')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();

    expect(screen.getByText('Reminder Ack Rate')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();

    expect(screen.getByText('Habit Streak Consistency')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();

    expect(screen.getByTestId('export-button')).toBeTruthy();
  });
});
