/**
 * Tests for Reminder feature UI components (ReminderItem, ReminderForm).
 *
 * Requirements: 2.3, 2.4, 2.5, 2.7, 2.8, 2.9
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReminderItem } from '../components/ReminderItem';
import { ReminderForm } from '../components/ReminderForm';
import type { Reminder } from '../types';

const futureReminder: Reminder = {
  id: 'rem-1',
  title: 'Team Standup',
  dueAt: new Date(Date.now() + 3600000).toISOString(),
  acknowledged: false,
  createdAt: '2026-09-01T00:00:00Z',
};

const pastReminder: Reminder = {
  id: 'rem-2',
  title: 'Submit Report',
  dueAt: new Date(Date.now() - 3600000).toISOString(),
  acknowledged: false,
  createdAt: '2026-09-01T00:00:00Z',
};

const ackedReminder: Reminder = {
  id: 'rem-3',
  title: 'Doctor Appointment',
  dueAt: new Date(Date.now() + 7200000).toISOString(),
  acknowledged: true,
  createdAt: '2026-09-01T00:00:00Z',
};

describe('ReminderItem', () => {
  it('renders reminder details and handles acknowledge and delete', () => {
    const onAcknowledge = vi.fn();
    const onDelete = vi.fn();

    render(
      <ReminderItem
        reminder={futureReminder}
        onAcknowledge={onAcknowledge}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Team Standup')).toBeTruthy();

    const ackBtn = screen.getByRole('button', { name: /^acknowledge$/i });
    expect((ackBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(ackBtn);
    expect(onAcknowledge).toHaveBeenCalledWith('rem-1');

    const deleteBtn = screen.getByTitle('Delete reminder');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('rem-1');
  });

  it('renders overdue badge for past unacknowledged reminders', () => {
    const onAcknowledge = vi.fn();
    render(
      <ReminderItem reminder={pastReminder} onAcknowledge={onAcknowledge} />,
    );

    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders acknowledged state with disabled button and checkmark', () => {
    const onAcknowledge = vi.fn();
    render(
      <ReminderItem reminder={ackedReminder} onAcknowledge={onAcknowledge} />,
    );

    expect(screen.getByText('✓ Acknowledged')).toBeTruthy();
    const ackBtn = screen.getByRole('button', { name: /acknowledged/i });
    expect((ackBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ReminderForm', () => {
  it('does not submit when fields are empty', () => {
    const onAdd = vi.fn();
    render(<ReminderForm onAdd={onAdd} />);

    fireEvent.submit(screen.getByRole('button', { name: /\+ add reminder/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits valid title and dueAt datetime', () => {
    const onAdd = vi.fn();
    render(<ReminderForm onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText(/reminder title/i), {
      target: { value: 'Buy groceries' },
    });
    const dateInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-10-10T14:30' } });

    fireEvent.submit(screen.getByRole('button', { name: /\+ add reminder/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith({
      title: 'Buy groceries',
      dueAt: new Date('2026-10-10T14:30').toISOString(),
    });
  });
});
