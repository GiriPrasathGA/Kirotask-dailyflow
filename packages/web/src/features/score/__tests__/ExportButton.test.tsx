/**
 * Tests for the ExportButton component.
 *
 * Requirements: 5.7, 5.8
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportButton } from '../components/ExportButton';

describe('ExportButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers POST request to /api/v1/export and shows success banner with file path', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { filePath: '/exports/dailyflow-backup.json' },
        error: null,
      }),
    });
    global.fetch = mockFetch;

    render(<ExportButton />);

    const exportBtn = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(exportBtn);

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/export', { method: 'POST' });

    await waitFor(() => {
      expect(screen.getByText(/\/exports\/dailyflow-backup\.json/)).toBeTruthy();
    });

    const dismissBtn = screen.getByTitle('Dismiss');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/\/exports\/dailyflow-backup\.json/)).toBeNull();
  });

  it('displays error banner when API returns error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: 'Disk full error',
      }),
    });
    global.fetch = mockFetch;

    render(<ExportButton />);

    const exportBtn = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Disk full error/)).toBeTruthy();
    });
  });

  it('displays error banner on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));
    global.fetch = mockFetch;

    render(<ExportButton />);

    const exportBtn = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network disconnected/)).toBeTruthy();
    });
  });
});
