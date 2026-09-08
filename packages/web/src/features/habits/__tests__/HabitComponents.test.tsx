/**
 * Tests for Habit feature UI components (HabitItem, HabitForm).
 *
 * Requirements: 3.2, 3.3, 3.10, 3.11
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HabitItem } from '../components/HabitItem';
import { HabitForm } from '../components/HabitForm';
import type { Habit } from '../types';

const mockHabit1: Habit = {
  id: 'habit-1',
  name: 'Morning Meditation',
  description: '10 minutes of mindfulness',
  frequency: 'daily',
  streak: 1,
  active: true,
  checkedInToday: false,
  createdAt: '2026-09-01T00:00:00Z',
};

const mockHabitPlural: Habit = {
  id: 'habit-2',
  name: 'Read 20 pages',
  description: 'Non-fiction books',
  frequency: 'daily',
  streak: 7,
  active: true,
  checkedInToday: true,
  createdAt: '2026-09-01T00:00:00Z',
};

describe('HabitItem', () => {
  it('renders habit details with flame icon and singular streak format', () => {
    const onCheckIn = vi.fn();
    render(<HabitItem habit={mockHabit1} onCheckIn={onCheckIn} />);

    expect(screen.getByText('Morning Meditation')).toBeTruthy();
    expect(screen.getByText('10 minutes of mindfulness')).toBeTruthy();
    expect(screen.getByText(/🔥 1 day streak/)).toBeTruthy();

    const checkInBtn = screen.getByRole('button', { name: /^check in$/i });
    expect((checkInBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(checkInBtn);
    expect(onCheckIn).toHaveBeenCalledWith('habit-1');
  });

  it('renders plural streak and disabled checked in state', () => {
    const onCheckIn = vi.fn();
    render(<HabitItem habit={mockHabitPlural} onCheckIn={onCheckIn} />);

    expect(screen.getByText('Read 20 pages')).toBeTruthy();
    expect(screen.getByText(/🔥 7 days streak/)).toBeTruthy();

    const checkInBtn = screen.getByRole('button', { name: /✓ checked in/i });
    expect((checkInBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('HabitForm', () => {
  it('does not submit when habit name is empty', () => {
    const onAdd = vi.fn();
    render(<HabitForm onAdd={onAdd} />);

    fireEvent.submit(screen.getByRole('button', { name: /\+ add habit/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits valid name and optional description', () => {
    const onAdd = vi.fn();
    render(<HabitForm onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText(/habit name/i), {
      target: { value: 'Hydrate' },
    });
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: 'Drink 2L of water daily' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /\+ add habit/i }));

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Hydrate',
      description: 'Drink 2L of water daily',
      frequency: 'daily',
    });
  });
});
