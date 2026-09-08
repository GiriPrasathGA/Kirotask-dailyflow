/**
 * Frontend type definitions for the Tasks feature.
 *
 * Defines the Task entity, union types for status, priority, and category,
 * and data-transfer objects for creating tasks on the Kanban board.
 *
 * Requirements: 1.2, 1.6
 */

/** The lifecycle status of a task on the Kanban board. */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/** The urgency level assigned to a task. */
export type TaskPriority = 'low' | 'medium' | 'high';

/** The organisational category a task belongs to. */
export type TaskCategory = 'work' | 'personal' | 'health';

/**
 * Represents a Task entity displayed on the Kanban board.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string | null;
  createdAt: string;
}

/**
 * Data-transfer object for creating a new Task from the frontend.
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string | null;
}
