/**
 * Kanban column component representing a single task status drop zone.
 *
 * Requirements: 1.6, 1.7, 1.8
 */

import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import styles from './TaskBoard.module.css';

/**
 * Props for the KanbanColumn component.
 */
export interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  draggedId: string | null;
  onDrop: (status: TaskStatus) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
}

/**
 * Renders a Kanban column with task cards and drag-and-drop drop target.
 *
 * @param props - Component props containing column status, tasks, and handlers
 * @returns JSX Element for the Kanban column
 */
export function KanbanColumn({
  status,
  label,
  tasks,
  draggedId,
  onDrop,
  onStatusChange,
  onDelete,
  onDragStart,
}: KanbanColumnProps): JSX.Element {
  return (
    <div
      className={`${styles.column} ${draggedId ? styles.dropTarget : ''}`}
      onDragOver={(e): void => e.preventDefault()}
      onDrop={(): void => onDrop(status)}
    >
      <div className={styles.colHeader}>
        <span className={styles.colTitle}>{label}</span>
        <span className={styles.colCount}>{tasks.length}</span>
      </div>

      <div className={styles.cardList}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && <div className={styles.emptyCol}>Drop tasks here</div>}
      </div>
    </div>
  );
}
