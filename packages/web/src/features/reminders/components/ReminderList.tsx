/**
 * Reminder List feature container component.
 *
 * Owns the useReminders hook and renders a list of sorted reminders
 * with inline creation and acknowledgement actions.
 *
 * Requirements: 2.6, 2.7, 2.8, 2.9
 */

import { useReminders } from '../hooks/useReminders';
import { ReminderItem } from './ReminderItem';
import { ReminderForm } from './ReminderForm';
import styles from './ReminderList.module.css';

/**
 * Container component for viewing and creating reminders.
 *
 * @returns JSX Element for the ReminderList view
 */
export function ReminderList(): JSX.Element {
  const { reminders, error, loading, addReminder, removeReminder, acknowledge } =
    useReminders();

  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>⏰ Reminders</h2>
          <p className={styles.meta}>
            {reminders.filter((r) => r.acknowledged).length} / {reminders.length} acknowledged
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <ReminderForm onAdd={addReminder} />

      {loading && reminders.length === 0 ? (
        <div className={styles.emptyState}>Loading reminders...</div>
      ) : (
        <div className={styles.itemsList}>
          {sortedReminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onAcknowledge={acknowledge}
              onDelete={removeReminder}
            />
          ))}

          {sortedReminders.length === 0 && (
            <div className={styles.emptyState}>No reminders scheduled</div>
          )}
        </div>
      )}
    </div>
  );
}
