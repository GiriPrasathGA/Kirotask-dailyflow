/**
 * Kanban task board orchestrator component.
 *
 * Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12
 */

import { useState, useCallback } from 'react';
import { useTasks } from '../hooks/useTasks';
import type { TaskStatus, TaskPriority, TaskCategory, CreateTaskDto } from '../types';
import { TaskFilters } from './TaskFilters';
import { TaskForm } from './TaskForm';
import { KanbanColumn } from './KanbanColumn';
import styles from './TaskBoard.module.css';

/**
 * Column definition configuration.
 */
const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: '📋 To Do' },
  { status: 'in_progress', label: '⚡ In Progress' },
  { status: 'done', label: '✅ Done' },
];

/**
 * Kanban task board component coordinating state, filters, and drag-and-drop.
 *
 * @returns JSX Element for the task board
 */
export function TaskBoard(): JSX.Element {
  const { tasks, error, loading, addTask, moveTask, removeTask } = useTasks();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const visibleTasks = tasks.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleDragStart = useCallback((id: string): void => {
    setDraggedId(id);
  }, []);

  const handleDrop = useCallback(
    (targetStatus: TaskStatus): void => {
      if (!draggedId) return;
      void moveTask(draggedId, targetStatus);
      setDraggedId(null);
    },
    [draggedId, moveTask],
  );

  const handleStatusChange = useCallback(
    (id: string, newStatus: TaskStatus): void => {
      void moveTask(id, newStatus);
    },
    [moveTask],
  );

  const handleDelete = useCallback(
    (id: string): void => {
      void removeTask(id);
    },
    [removeTask],
  );

  const handleAddTask = useCallback(
    (dto: CreateTaskDto): void => {
      void addTask(dto);
    },
    [addTask],
  );

  const handleCategoryChange = useCallback((category: TaskCategory | 'all'): void => {
    setFilterCategory(category);
  }, []);

  const handlePriorityChange = useCallback((priority: TaskPriority | 'all'): void => {
    setFilterPriority(priority);
  }, []);

  const handleToggleForm = useCallback((): void => {
    setShowForm((prev) => !prev);
  }, []);

  const handleCancelForm = useCallback((): void => {
    setShowForm(false);
  }, []);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  return (
    <div className={styles.board}>
      <div className={styles.boardHeader}>
        <div>
          <h2 className={styles.boardTitle}>📝 Task Board</h2>
          <p className={styles.boardMeta}>
            {doneCount} / {tasks.length} done &nbsp;·&nbsp;{completionRate}% completion rate
          </p>
        </div>
        <button className={styles.addBtn} onClick={handleToggleForm}>
          {showForm ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <TaskFilters
        filterCategory={filterCategory}
        filterPriority={filterPriority}
        onCategoryChange={handleCategoryChange}
        onPriorityChange={handlePriorityChange}
      />

      {showForm && (
        <TaskForm onAdd={handleAddTask} onCancel={handleCancelForm} />
      )}

      {loading && tasks.length === 0 ? (
        <div className={styles.emptyCol}>Loading tasks...</div>
      ) : (
        <div className={styles.columns}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={visibleTasks.filter((t) => t.status === col.status)}
              draggedId={draggedId}
              onDrop={handleDrop}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
