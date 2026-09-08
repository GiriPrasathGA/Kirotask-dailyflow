/**
 * Filter controls component for categorizing and prioritizing tasks.
 *
 * Requirements: 1.12
 */

import type { TaskPriority, TaskCategory } from '../types';
import styles from './TaskBoard.module.css';

/**
 * Props for the TaskFilters component.
 */
export interface TaskFiltersProps {
  filterCategory: TaskCategory | 'all';
  filterPriority: TaskPriority | 'all';
  onCategoryChange: (category: TaskCategory | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
}

/**
 * Renders category and priority filter dropdowns.
 *
 * @param props - Component props containing current filters and change handlers
 * @returns JSX Element containing filter selects
 */
export function TaskFilters({
  filterCategory,
  filterPriority,
  onCategoryChange,
  onPriorityChange,
}: TaskFiltersProps): JSX.Element {
  return (
    <div className={styles.filters}>
      <label className={styles.filterLabel}>Category:</label>
      <select
        className={styles.filterSelect}
        value={filterCategory}
        onChange={(e): void => onCategoryChange(e.target.value as TaskCategory | 'all')}
      >
        <option value="all">All</option>
        <option value="work">Work</option>
        <option value="personal">Personal</option>
        <option value="health">Health</option>
      </select>
      <label className={styles.filterLabel}>Priority:</label>
      <select
        className={styles.filterSelect}
        value={filterPriority}
        onChange={(e): void => onPriorityChange(e.target.value as TaskPriority | 'all')}
      >
        <option value="all">All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
