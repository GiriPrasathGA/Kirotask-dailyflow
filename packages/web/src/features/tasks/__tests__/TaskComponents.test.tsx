/**
 * Tests for Task feature UI components (TaskForm, TaskFilters, TaskCard, KanbanColumn).
 *
 * Requirements: 1.6, 1.7, 1.8, 1.9, 1.11, 1.12
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';
import { TaskFilters } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { KanbanColumn } from '../components/KanbanColumn';
import type { Task } from '../types';

const mockTask: Task = {
  id: 'task-123',
  title: 'Sample Task',
  description: 'Sample description',
  status: 'todo',
  priority: 'high',
  category: 'work',
  dueDate: '2026-10-15',
  createdAt: '2026-09-01T00:00:00Z',
};

describe('TaskForm', () => {
  it('does not submit when title is empty', () => {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    render(<TaskForm onAdd={onAdd} onCancel={onCancel} />);

    fireEvent.submit(screen.getByRole('button', { name: /^add$/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits valid task data and invokes onAdd and onCancel', () => {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    render(<TaskForm onAdd={onAdd} onCancel={onCancel} />);

    fireEvent.change(screen.getByPlaceholderText(/task title/i), {
      target: { value: 'New Feature' },
    });
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: 'Feature description' },
    });
    fireEvent.change(screen.getByDisplayValue(/medium priority/i), {
      target: { value: 'high' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /^add$/i }));

    expect(onAdd).toHaveBeenCalledWith({
      title: 'New Feature',
      description: 'Feature description',
      priority: 'high',
      category: 'work',
      dueDate: null,
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('TaskFilters', () => {
  it('triggers onCategoryChange and onPriorityChange when selects change', () => {
    const onCategoryChange = vi.fn();
    const onPriorityChange = vi.fn();

    render(
      <TaskFilters
        filterCategory="all"
        filterPriority="all"
        onCategoryChange={onCategoryChange}
        onPriorityChange={onPriorityChange}
      />,
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'personal' } });
    expect(onCategoryChange).toHaveBeenCalledWith('personal');

    fireEvent.change(selects[1], { target: { value: 'high' } });
    expect(onPriorityChange).toHaveBeenCalledWith('high');
  });
});

describe('TaskCard', () => {
  it('displays task information and triggers status changes and deletion', () => {
    const onStatusChange = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Sample Task')).toBeTruthy();
    expect(screen.getByText('Sample description')).toBeTruthy();
    expect(screen.getByText('work')).toBeTruthy();

    const forwardBtn = screen.getByRole('button', { name: /forward/i });
    fireEvent.click(forwardBtn);
    expect(onStatusChange).toHaveBeenCalledWith('task-123', 'in_progress');

    const deleteBtn = screen.getByTitle('Delete task');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('task-123');
  });
});

describe('KanbanColumn', () => {
  it('renders task cards and handles empty state', () => {
    const onDrop = vi.fn();
    const onStatusChange = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <KanbanColumn
        status="todo"
        label="To Do"
        tasks={[mockTask]}
        draggedId={null}
        onDrop={onDrop}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('To Do')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Sample Task')).toBeTruthy();

    rerender(
      <KanbanColumn
        status="todo"
        label="To Do"
        tasks={[]}
        draggedId={null}
        onDrop={onDrop}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Drop tasks here')).toBeTruthy();
  });
});
