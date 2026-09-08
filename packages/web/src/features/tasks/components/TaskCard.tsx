/**
 * Draggable Task Card component representing a single task.
 *
 * Requirements: 1.6, 1.7, 1.11
 */

import type { Task, TaskStatus, TaskPriority } from '../types';
import styles from './TaskBoard.module.css';

/** Priority indicator dot colours map. */
const PRIORITY_COLOURS: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

/**
 * Formats an ISO date string into a friendly localized month and day.
 *
 * @param iso - ISO date string or null
 * @returns Formatted date string
 */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Props for the TaskCard component.
 */
export interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
}

/**
 * Renders a draggable task card with status transitions and delete actions.
 *
 * @param props - Component props containing task data and event callbacks
 * @returns JSX Element for the card
 */
export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onDragStart,
}: TaskCardProps): JSX.Element {
  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(): void => onDragStart?.(task.id)}
    >
      <div className={styles.cardTop}>
        <span
          className={styles.priorityDot}
          style={{ background: PRIORITY_COLOURS[task.priority] }}
          title={`${task.priority} priority`}
        />
        <span className={styles.cardTitle}>{task.title}</span>
      </div>

      {task.description && <p className={styles.cardDesc}>{task.description}</p>}

      <div className={styles.cardMeta}>
        <span className={styles.categoryTag}>{task.category}</span>
        {task.dueDate && <span className={styles.dueDate}>📅 {formatDate(task.dueDate)}</span>}
      </div>

      <div className={styles.cardActions}>
        {task.status !== 'todo' && (
          <button
            className={styles.actionBtn}
            onClick={(): void =>
              onStatusChange(task.id, task.status === 'done' ? 'in_progress' : 'todo')
            }
          >
            ← Back
          </button>
        )}
        {task.status !== 'done' && (
          <button
            className={styles.actionBtn}
            onClick={(): void =>
              onStatusChange(task.id, task.status === 'todo' ? 'in_progress' : 'done')
            }
          >
            Forward →
          </button>
        )}
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={(): void => onDelete(task.id)}
          title="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
