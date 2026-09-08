/**
 * Unit tests for the Tasks service layer.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.5, 6.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repo from '../repository';
import * as service from '../service';
import type { Task, CreateTaskDto, PatchTaskDto } from '../types';

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      pragma: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
        get: vi.fn(),
        all: vi.fn(),
      }),
    })),
  };
});

vi.mock('../repository');

describe('Tasks Service', () => {
  const sampleTask: Task = {
    id: 'task-uuid-1',
    title: 'Sample Task',
    description: 'A sample description',
    status: 'todo',
    priority: 'medium',
    category: 'work',
    dueDate: '2026-10-01',
    createdAt: '2026-09-08T12:00:00.000Z',
  };

  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('succeeds with a valid dto and persists via repository', (): void => {
      const dto: CreateTaskDto = {
        title: 'Complete project documentation',
        description: 'Detail all modules',
        priority: 'high',
        category: 'work',
        dueDate: '2026-10-15',
      };

      vi.mocked(repo.insertTask).mockImplementation((): void => {});

      const result = service.createTask(dto);

      expect(result.id).toBeDefined();
      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
      expect(result.status).toBe('todo');
      expect(result.priority).toBe('high');
      expect(result.category).toBe('work');
      expect(result.dueDate).toBe('2026-10-15');
      expect(result.createdAt).toBeDefined();
      expect(repo.insertTask).toHaveBeenCalledWith(result);
    });

    it('fails with 400 when title is empty or whitespace', (): void => {
      const dto: CreateTaskDto = { title: '   ', priority: 'medium', category: 'personal' };
      expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
    });

    it('fails with 400 when title exceeds 200 characters', (): void => {
      const dto: CreateTaskDto = { title: 'a'.repeat(201), priority: 'medium', category: 'health' };
      expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
    });

    it('fails with 400 when description exceeds 1000 characters', (): void => {
      const dto: CreateTaskDto = {
        title: 'Valid title',
        description: 'd'.repeat(1001),
        priority: 'low',
        category: 'work',
      };
      expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
    });
  });

  describe('getTaskById', () => {
    it('returns the task when found', (): void => {
      vi.mocked(repo.findTaskById).mockReturnValue(sampleTask);

      const result = service.getTaskById('task-uuid-1');
      expect(result).toEqual(sampleTask);
      expect(repo.findTaskById).toHaveBeenCalledWith('task-uuid-1');
    });

    it('returns null for an unknown id', (): void => {
      vi.mocked(repo.findTaskById).mockReturnValue(null);

      const result = service.getTaskById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('updates only supplied fields and preserves unchanged fields', (): void => {
      vi.mocked(repo.findTaskById).mockReturnValue(sampleTask);
      const updatedTask: Task = { ...sampleTask, status: 'in_progress', priority: 'high' };
      vi.mocked(repo.updateTaskFields).mockReturnValue(updatedTask);

      const patchDto: PatchTaskDto = {
        status: 'in_progress',
        priority: 'high',
      };

      const result = service.updateTask('task-uuid-1', patchDto);

      expect(result).toEqual(updatedTask);
      expect(repo.updateTaskFields).toHaveBeenCalledWith('task-uuid-1', {
        status: 'in_progress',
        priority: 'high',
      });
    });

    it('returns null if the task does not exist', (): void => {
      vi.mocked(repo.findTaskById).mockReturnValue(null);

      const result = service.updateTask('unknown-id', { title: 'New title' });
      expect(result).toBeNull();
      expect(repo.updateTaskFields).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('returns true when task is deleted', (): void => {
      vi.mocked(repo.deleteTaskById).mockReturnValue(true);

      const result = service.deleteTask('task-uuid-1');
      expect(result).toBe(true);
      expect(repo.deleteTaskById).toHaveBeenCalledWith('task-uuid-1');
    });

    it('returns false for an unknown id', (): void => {
      vi.mocked(repo.deleteTaskById).mockReturnValue(false);

      const result = service.deleteTask('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('listTasks', () => {
    it('returns paginated result metadata and items', (): void => {
      vi.mocked(repo.countTasks).mockReturnValue(1);
      vi.mocked(repo.findAllTasks).mockReturnValue([sampleTask]);

      const result = service.listTasks(1, 20);

      expect(result.items).toEqual([sampleTask]);
      expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
      expect(repo.countTasks).toHaveBeenCalledWith({});
      expect(repo.findAllTasks).toHaveBeenCalledWith({}, 20, 0);
    });

    it('returns only matching tasks when filtered by status', (): void => {
      vi.mocked(repo.countTasks).mockReturnValue(1);
      vi.mocked(repo.findAllTasks).mockReturnValue([sampleTask]);

      const result = service.listTasks(1, 10, { status: 'todo' });

      expect(result.items).toEqual([sampleTask]);
      expect(repo.countTasks).toHaveBeenCalledWith({ status: 'todo' });
      expect(repo.findAllTasks).toHaveBeenCalledWith({ status: 'todo' }, 10, 0);
    });
  });
});
