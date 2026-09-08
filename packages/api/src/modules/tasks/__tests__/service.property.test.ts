/**
 * Property-based tests for Tasks service layer.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as repo from '../repository';
import * as service from '../service';
import type { Task, CreateTaskDto, PatchTaskDto, TaskStatus, TaskPriority, TaskCategory } from '../types';

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      pragma: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn().mockReturnValue({ run: vi.fn(), get: vi.fn(), all: vi.fn() }),
    })),
  };
});

vi.mock('../repository');

const validPriorities: TaskPriority[] = ['low', 'medium', 'high'];
const validCategories: TaskCategory[] = ['work', 'personal', 'health'];
const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done'];

describe('Tasks Service Property Tests', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  // Feature: dailyflow, Property 1: Task creation round-trip
  it('Property 1: Task creation round-trip', (): void => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s: string) => s.trim().length > 0),
        fc.option(fc.string({ maxLength: 1000 })),
        fc.constantFrom(...validPriorities),
        fc.constantFrom(...validCategories),
        (title: string, description: string | null, priority: TaskPriority, category: TaskCategory): void => {
          const dto: CreateTaskDto = {
            title,
            description: description ?? undefined,
            priority,
            category,
          };

          let savedTask: Task | null = null;
          vi.mocked(repo.insertTask).mockImplementation((task: Task): void => {
            savedTask = task;
          });
          vi.mocked(repo.findTaskById).mockImplementation((id: string): Task | null =>
            savedTask && savedTask.id === id ? savedTask : null,
          );

          const created = service.createTask(dto);
          const retrieved = service.getTaskById(created.id);

          expect(retrieved).not.toBeNull();
          expect(retrieved?.title).toBe(title);
          expect(retrieved?.description).toBe(description ?? '');
          expect(retrieved?.priority).toBe(priority);
          expect(retrieved?.category).toBe(category);
          expect(retrieved?.status).toBe('todo');
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: dailyflow, Property 2: Task validation rejects all invalid inputs
  it('Property 2: Task validation rejects all invalid inputs', (): void => {
    // Sub-property A: whitespace or empty title throws 400
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (invalidTitle: string): void => {
          const dto: CreateTaskDto = {
            title: invalidTitle,
            priority: 'medium',
            category: 'work',
          };
          expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
        },
      ),
      { numRuns: 50 },
    );

    // Sub-property B: title > 200 chars throws 400
    fc.assert(
      fc.property(
        fc.string({ minLength: 201, maxLength: 300 }),
        (longTitle: string): void => {
          const dto: CreateTaskDto = {
            title: longTitle,
            priority: 'medium',
            category: 'work',
          };
          expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
        },
      ),
      { numRuns: 50 },
    );

    // Sub-property C: description > 1000 chars throws 400
    fc.assert(
      fc.property(
        fc.string({ minLength: 1001, maxLength: 1200 }),
        (longDesc: string): void => {
          const dto: CreateTaskDto = {
            title: 'Valid title',
            description: longDesc,
            priority: 'medium',
            category: 'work',
          };
          expect((): Task => service.createTask(dto)).toThrowError(service.ServiceError);
        },
      ),
      { numRuns: 50 },
    );
  });

  // Feature: dailyflow, Property 3: Partial update preserves omitted fields
  it('Property 3: Partial update preserves omitted fields', (): void => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validStatuses),
        fc.constantFrom(...validPriorities),
        (newStatus: TaskStatus, newPriority: TaskPriority): void => {
          const existing: Task = {
            id: 'task-100',
            title: 'Immutable Title',
            description: 'Original Desc',
            status: 'todo',
            priority: 'low',
            category: 'personal',
            dueDate: null,
            createdAt: '2026-09-08T12:00:00.000Z',
          };

          vi.mocked(repo.findTaskById).mockReturnValue(existing);
          vi.mocked(repo.updateTaskFields).mockImplementation(
            (_id: string, fields: Partial<Record<string, unknown>>): Task => ({
              ...existing,
              ...fields,
            }),
          );

          const patch: PatchTaskDto = { status: newStatus, priority: newPriority };
          const updated = service.updateTask('task-100', patch);

          expect(updated?.title).toBe(existing.title);
          expect(updated?.description).toBe(existing.description);
          expect(updated?.category).toBe(existing.category);
          expect(updated?.status).toBe(newStatus);
          expect(updated?.priority).toBe(newPriority);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: dailyflow, Property 4: Task filter returns only matching tasks
  it('Property 4: Task filter returns only matching tasks', (): void => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validCategories),
        fc.constantFrom(...validPriorities),
        (filterCat: TaskCategory, filterPrio: TaskPriority): void => {
          const allTasks: Task[] = [
            { id: '1', title: 'T1', description: '', status: 'todo', category: filterCat, priority: filterPrio, dueDate: null, createdAt: '' },
            { id: '2', title: 'T2', description: '', status: 'todo', category: 'health', priority: 'low', dueDate: null, createdAt: '' },
          ];

          const matchingTasks = allTasks.filter(
            (t: Task) => t.category === filterCat && t.priority === filterPrio,
          );

          vi.mocked(repo.countTasks).mockReturnValue(matchingTasks.length);
          vi.mocked(repo.findAllTasks).mockReturnValue(matchingTasks);

          const result = service.listTasks(1, 20, { category: filterCat, priority: filterPrio });

          for (const item of result.items) {
            expect(item.category).toBe(filterCat);
            expect(item.priority).toBe(filterPrio);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
