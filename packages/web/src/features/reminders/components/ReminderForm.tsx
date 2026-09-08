/**
 * Controlled inline form component for creating new reminders.
 *
 * Requirements: 2.3, 2.4, 2.5
 */

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { CreateReminderDto } from '../hooks/useReminders';
import styles from './ReminderList.module.css';

/**
 * Props for the ReminderForm component.
 */
export interface ReminderFormProps {
  onAdd: (dto: CreateReminderDto) => void;
}

/**
 * Renders an inline form to create a new reminder with title and datetime-local picker.
 *
 * @param props - Component props containing the onAdd handler
 * @returns JSX Element for the reminder creation form
 */
export function ReminderForm({ onAdd }: ReminderFormProps): JSX.Element {
  const [title, setTitle] = useState<string>('');
  const [dueAt, setDueAt] = useState<string>('');

  const handleSubmit = useCallback(
    (e: FormEvent): void => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (!trimmedTitle || !dueAt) return;

      const isoDueAt = new Date(dueAt).toISOString();
      onAdd({ title: trimmedTitle, dueAt: isoDueAt });
      setTitle('');
      setDueAt('');
    },
    [title, dueAt, onAdd],
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <input
          className={styles.input}
          placeholder="Reminder title *"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="datetime-local"
          value={dueAt}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => setDueAt(e.target.value)}
          required
        />
        <button className={styles.submitBtn} type="submit">
          + Add Reminder
        </button>
      </div>
    </form>
  );
}
