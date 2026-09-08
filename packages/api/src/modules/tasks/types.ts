/**
 * TypeScript type definitions for the Tasks module.
 *
 * Defines the core Task entity, its union type constraints, and the
 * data-transfer objects used for creating and partially updating tasks.
 * All CRUD operations on tasks are validated against these types.
 *
 * Requirements: 1.2
 */

/** The lifecycle status of a task on the Kanban board. */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

/** The urgency level assigned to a task. */
export type TaskPriority = 'low' | 'medium' | 'high';

/** The organisational category a task belongs to. */
export type TaskCategory = 'work' | 'personal' | 'health';

/**
 * Represents a persisted Task entity.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string | null;   // YYYY-MM-DD or null
  createdAt: string;         // ISO 8601
}

/**
 * Data-transfer object for creating a new Task.
 * `title`, `priority`, and `category` are required; all others are optional.
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string | null;
}

/**
 * Data-transfer object for partially updating an existing Task.
 * All fields are optional; only supplied fields are applied.
 */
export interface PatchTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string | null;
}
