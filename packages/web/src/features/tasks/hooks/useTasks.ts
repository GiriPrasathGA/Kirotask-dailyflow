/**
 * Custom React hook for managing Tasks state and operations.
 *
 * Implements optimistic updates for adding, moving, and removing tasks,
 * with automatic rollback on API errors.
 *
 * Requirements: 1.7, 1.8, 1.9, 1.10, 1.11
 */

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, CreateTaskDto } from '../types';

/** Standard API response envelope matching backend contract. */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Paginated list response envelope. */
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/** Return signature for the useTasks hook. */
export interface UseTasksReturn {
  tasks: Task[];
  error: string | null;
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (dto: CreateTaskDto) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

/**
 * Hook for fetching and mutating tasks with optimistic updates.
 *
 * @returns State and action handlers for task management
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Fetches the latest tasks from the API.
   *
   * @returns Promise resolving when tasks have been loaded into state
   */
  const fetchTasks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/tasks?pageSize=100');
      const json: ApiResponse<PaginatedResponse<Task>> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to fetch tasks');
      }
      setTasks(json.data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adds a new task with optimistic prepend to state and rollback on error.
   *
   * @param dto - Task creation payload
   * @returns Promise resolving when the add operation completes
   */
  const addTask = useCallback(async (dto: CreateTaskDto): Promise<void> => {
    setError(null);
    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description ?? '',
      status: 'todo',
      priority: dto.priority,
      category: dto.category,
      dueDate: dto.dueDate ?? null,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev: Task[]) => [optimisticTask, ...prev]);

    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const json: ApiResponse<Task> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to create task');
      }
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => (t.id === optimisticTask.id ? json.data! : t)),
      );
    } catch (err) {
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== optimisticTask.id));
      setError((err as Error).message);
    }
  }, []);

  /**
   * Updates the status of an existing task with optimistic update and rollback on error.
   *
   * @param id - UUID of the task to update
   * @param newStatus - Target status ('todo' | 'in_progress' | 'done')
   * @returns Promise resolving when the status update completes
   */
  const moveTask = useCallback(async (id: string, newStatus: TaskStatus): Promise<void> => {
    setError(null);
    let previousTask: Task | undefined;

    setTasks((prev: Task[]) => {
      previousTask = prev.find((t: Task) => t.id === id);
      return prev.map((t: Task) => (t.id === id ? { ...t, status: newStatus } : t));
    });

    try {
      const res = await fetch(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json: ApiResponse<Task> = await res.json();
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? 'Failed to update task status');
      }
      setTasks((prev: Task[]) => prev.map((t: Task) => (t.id === id ? json.data! : t)));
    } catch (err) {
      if (previousTask) {
        const revertTask = previousTask;
        setTasks((prev: Task[]) => prev.map((t: Task) => (t.id === id ? revertTask : t)));
      }
      setError((err as Error).message);
    }
  }, []);

  /**
   * Deletes a task by UUID with optimistic removal and rollback on error.
   *
   * @param id - UUID of the task to delete
   * @returns Promise resolving when the delete operation completes
   */
  const removeTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    let previousTasks: Task[] = [];

    setTasks((prev: Task[]) => {
      previousTasks = prev;
      return prev.filter((t: Task) => t.id !== id);
    });

    try {
      const res = await fetch(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        let errorMsg = 'Failed to delete task';
        try {
          const json: ApiResponse<null> = await res.json();
          if (json.error) errorMsg = json.error;
        } catch {
          // ignore json parse error on non-json error responses
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      setTasks(previousTasks);
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    error,
    loading,
    fetchTasks,
    addTask,
    moveTask,
    removeTask,
  };
}
