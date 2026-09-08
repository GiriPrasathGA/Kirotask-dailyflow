/**
 * Reminder Item component representing a single scheduled alert.
 *
 * Requirements: 2.7, 2.8, 2.9
 */

import type { Reminder } from '../types';
import styles from './ReminderList.module.css';

/**
 * Props for the ReminderItem component.
 */
export interface ReminderItemProps {
  reminder: Reminder;
  onAcknowledge: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * Formats an ISO date-time string into a human-readable local time string.
 *
 * @param iso - ISO 8601 date-time string
 * @returns Formatted localized string
 */
function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Renders a reminder item with title, due date/time, overdue indicator, and acknowledge action.
 *
 * @param props - Component props containing the reminder entity and action callbacks
 * @returns JSX Element for the reminder item
 */
export function ReminderItem({
  reminder,
  onAcknowledge,
  onDelete,
}: ReminderItemProps): JSX.Element {
  const isOverdue =
    new Date(reminder.dueAt).getTime() < Date.now() && !reminder.acknowledged;

  return (
    <div
      className={`${styles.item} ${isOverdue ? styles.overdue : ''} ${
        reminder.acknowledged ? styles.acknowledged : ''
      }`}
    >
      <div className={styles.itemInfo}>
        <span className={styles.itemTitle}>{reminder.title}</span>
        <div className={styles.itemDue}>
          <span>⏰ {formatDateTime(reminder.dueAt)}</span>
          {isOverdue && <span className={styles.overdueBadge}>Overdue</span>}
          {reminder.acknowledged && <span>✓ Acknowledged</span>}
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          className={styles.ackBtn}
          onClick={(): void => onAcknowledge(reminder.id)}
          disabled={reminder.acknowledged}
        >
          {reminder.acknowledged ? 'Acknowledged' : 'Acknowledge'}
        </button>
        {onDelete && (
          <button
            className={styles.deleteBtn}
            onClick={(): void => onDelete(reminder.id)}
            title="Delete reminder"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
