/**
 * Export button component for backing up application data to JSON.
 *
 * Requirements: 5.7, 5.8
 */

import { useState, useCallback } from 'react';
import styles from './ProductivityScore.module.css';

/** API response envelope. */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Result shape returned by export endpoint. */
interface ExportResult {
  filePath: string;
}

/**
 * Button component that triggers data export and renders status banners.
 *
 * @returns JSX Element containing the export button and notification banners
 */
export function ExportButton(): JSX.Element {
  const [exporting, setExporting] = useState<boolean>(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async (): Promise<void> => {
    // Dismiss previous banners on a new export attempt
    setFilePath(null);
    setError(null);
    setExporting(true);

    try {
      const res = await fetch('/api/v1/export', { method: 'POST' });
      const json: ApiResponse<ExportResult> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Export failed');
      }
      setFilePath(json.data.filePath);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDismissSuccess = useCallback((): void => {
    setFilePath(null);
  }, []);

  const handleDismissError = useCallback((): void => {
    setError(null);
  }, []);

  return (
    <div className={styles.exportSection}>
      <button
        className={styles.exportBtn}
        onClick={(): void => {
          void handleExport();
        }}
        disabled={exporting}
      >
        {exporting ? '⏳ Exporting...' : '💾 Export Data'}
      </button>

      {filePath && (
        <div className={styles.successBanner}>
          <span>
            ✅ Export saved successfully to: <code>{filePath}</code>
          </span>
          <button
            className={styles.dismissBtn}
            onClick={handleDismissSuccess}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button
            className={styles.dismissBtn}
            onClick={handleDismissError}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
