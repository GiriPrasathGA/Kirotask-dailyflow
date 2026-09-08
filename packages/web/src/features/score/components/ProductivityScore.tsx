/**
 * Productivity Score feature container component.
 *
 * Owns the useScore hook and renders the composite score, progress bar,
 * component metric breakdown, and export button.
 *
 * Requirements: 4.7, 4.8, 4.9
 */

import { useScore } from '../hooks/useScore';
import { ExportButton } from './ExportButton';
import styles from './ProductivityScore.module.css';

/**
 * Formats a 0-1 decimal rate as a whole percentage string.
 *
 * @param rate - Decimal rate between 0 and 1
 * @returns Formatted percentage string
 */
function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Renders the productivity score dashboard widget with component rates and export.
 *
 * @returns JSX Element for the ProductivityScore component
 */
export function ProductivityScore(): JSX.Element {
  const { scoreData, error, loading } = useScore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>📊 Productivity Score</h2>
          <p className={styles.meta}>
            Composite score weighted across tasks (40%), reminders (30%), and habits (30%)
          </p>
        </div>
      </div>

      {error ? (
        <div className={styles.errorBanner}>⚠️ {error}</div>
      ) : loading && !scoreData ? (
        <div className={styles.loadingState}>Loading score...</div>
      ) : scoreData ? (
        <>
          <div className={styles.scoreCard}>
            <div className={styles.scoreValue}>{scoreData.score}</div>
            <div className={styles.scoreLabel}>Overall Score (out of 100)</div>
            <progress
              className={styles.progressBar}
              value={scoreData.score}
              max={100}
            />
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Task Completion Rate</h3>
              <p className={styles.metricValue}>
                {formatPercent(scoreData.taskCompletionRate)}
              </p>
              <span className={styles.metricWeight}>40% of total score</span>
            </div>

            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Reminder Ack Rate</h3>
              <p className={styles.metricValue}>
                {formatPercent(scoreData.reminderAckRate)}
              </p>
              <span className={styles.metricWeight}>30% of total score</span>
            </div>

            <div className={styles.metricCard}>
              <h3 className={styles.metricTitle}>Habit Streak Consistency</h3>
              <p className={styles.metricValue}>
                {formatPercent(scoreData.habitStreakConsistency)}
              </p>
              <span className={styles.metricWeight}>30% of total score</span>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>No productivity data available</div>
      )}

      <ExportButton />
    </div>
  );
}
