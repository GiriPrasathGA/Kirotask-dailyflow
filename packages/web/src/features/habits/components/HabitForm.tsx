/**
 * Controlled inline form component for creating new habits.
 *
 * Requirements: 3.2, 3.3
 */

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { CreateHabitDto } from '../hooks/useHabits';
import styles from './HabitTracker.module.css';

/**
 * Props for the HabitForm component.
 */
export interface HabitFormProps {
  onAdd: (dto: CreateHabitDto) => void;
}

/**
 * Renders an inline form to create a new habit with name and description.
 *
 * @param props - Component props containing the onAdd handler
 * @returns JSX Element for the habit creation form
 */
export function HabitForm({ onAdd }: HabitFormProps): JSX.Element {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = useCallback(
    (e: FormEvent): void => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) return;

      onAdd({
        name: trimmedName,
        description: description.trim() || undefined,
        frequency: 'daily',
      });
      setName('');
      setDescription('');
    },
    [name, description, onAdd],
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Habit name *"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.target.value)}
        required
      />
      <textarea
        className={styles.textarea}
        placeholder="Description (optional)"
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => setDescription(e.target.value)}
        rows={2}
      />
      <div className={styles.formRow}>
        <button className={styles.submitBtn} type="submit">
          + Add Habit
        </button>
      </div>
    </form>
  );
}
