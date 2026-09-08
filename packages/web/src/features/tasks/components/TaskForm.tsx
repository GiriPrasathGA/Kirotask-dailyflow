/**
 * Controlled inline form component for creating new tasks.
 *
 * Requirements: 1.9
 */

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { TaskPriority, TaskCategory, CreateTaskDto } from '../types';
import styles from './TaskBoard.module.css';

/**
 * Props for the TaskForm component.
 */
export interface TaskFormProps {
  onAdd: (dto: CreateTaskDto) => void;
  onCancel: () => void;
}

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
}

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
};

/**
 * Form component for task creation.
 *
 * @param props - Component props containing onAdd and onCancel handlers
 * @returns JSX Element for the task creation form
 */
export function TaskForm({ onAdd, onCancel }: TaskFormProps): JSX.Element {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: FormEvent): void => {
      e.preventDefault();
      const trimmedTitle = form.title.trim();
      if (!trimmedTitle) return;

      const dto: CreateTaskDto = {
        title: trimmedTitle,
        description: form.description.trim() || undefined,
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate ? form.dueDate : null,
      };

      onAdd(dto);
      setForm(INITIAL_FORM);
      onCancel();
    },
    [form, onAdd, onCancel],
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        name="title"
        placeholder="Task title *"
        value={form.title}
        onChange={handleChange}
        required
      />
      <textarea
        className={styles.textarea}
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={handleChange}
        rows={2}
      />
      <div className={styles.formRow}>
        <select
          className={styles.select}
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <select
          className={styles.select}
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
        </select>
        <input
          className={styles.input}
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
        />
        <button className={styles.submitBtn} type="submit">
          Add
        </button>
      </div>
    </form>
  );
}
