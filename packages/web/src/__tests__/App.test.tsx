/**
 * Tests for the root App component navigation and view rendering.
 *
 * Requirements: 1.6, 2.6, 3.10, 4.7
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Mock feature components to isolate tab navigation testing
vi.mock('../features/tasks/components/TaskBoard', () => ({
  TaskBoard: (): JSX.Element => <div data-testid="task-board">Task Board View</div>,
}));

vi.mock('../features/reminders/components/ReminderList', () => ({
  ReminderList: (): JSX.Element => <div data-testid="reminder-list">Reminder List View</div>,
}));

vi.mock('../features/habits/components/HabitTracker', () => ({
  HabitTracker: (): JSX.Element => <div data-testid="habit-tracker">Habit Tracker View</div>,
}));

vi.mock('../features/score/components/ProductivityScore', () => ({
  ProductivityScore: (): JSX.Element => (
    <div data-testid="productivity-score">Productivity Score View</div>
  ),
}));

describe('App navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Tasks tab as active by default', () => {
    render(<App />);

    expect(screen.getByTestId('task-board')).toBeTruthy();
    expect(screen.queryByTestId('reminder-list')).toBeNull();
    expect(screen.queryByTestId('habit-tracker')).toBeNull();
    expect(screen.queryByTestId('productivity-score')).toBeNull();

    const tasksBtn = screen.getByRole('button', { name: /tasks/i });
    expect(tasksBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to Reminders tab when clicked', () => {
    render(<App />);

    const remindersBtn = screen.getByRole('button', { name: /reminders/i });
    fireEvent.click(remindersBtn);

    expect(screen.getByTestId('reminder-list')).toBeTruthy();
    expect(screen.queryByTestId('task-board')).toBeNull();
    expect(remindersBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to Habits tab when clicked', () => {
    render(<App />);

    const habitsBtn = screen.getByRole('button', { name: /habits/i });
    fireEvent.click(habitsBtn);

    expect(screen.getByTestId('habit-tracker')).toBeTruthy();
    expect(screen.queryByTestId('task-board')).toBeNull();
    expect(habitsBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to Score tab when clicked', () => {
    render(<App />);

    const scoreBtn = screen.getByRole('button', { name: /score/i });
    fireEvent.click(scoreBtn);

    expect(screen.getByTestId('productivity-score')).toBeTruthy();
    expect(screen.queryByTestId('task-board')).toBeNull();
    expect(scoreBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('displays only the active feature view during sequential navigation', () => {
    render(<App />);

    // Start at Tasks
    expect(screen.getByTestId('task-board')).toBeTruthy();

    // Navigate to Reminders
    fireEvent.click(screen.getByRole('button', { name: /reminders/i }));
    expect(screen.getByTestId('reminder-list')).toBeTruthy();
    expect(screen.queryByTestId('task-board')).toBeNull();

    // Navigate to Habits
    fireEvent.click(screen.getByRole('button', { name: /habits/i }));
    expect(screen.getByTestId('habit-tracker')).toBeTruthy();
    expect(screen.queryByTestId('reminder-list')).toBeNull();

    // Navigate to Score
    fireEvent.click(screen.getByRole('button', { name: /score/i }));
    expect(screen.getByTestId('productivity-score')).toBeTruthy();
    expect(screen.queryByTestId('habit-tracker')).toBeNull();

    // Return to Tasks
    fireEvent.click(screen.getByRole('button', { name: /tasks/i }));
    expect(screen.getByTestId('task-board')).toBeTruthy();
    expect(screen.queryByTestId('productivity-score')).toBeNull();
  });
});
