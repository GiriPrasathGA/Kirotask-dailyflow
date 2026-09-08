/**
 * Habit Item component representing a single habit and its streak status.
 *
 * Requirements: 3.10, 3.11
 */

import type { Habit } from '../types';
import styles from './HabitTracker.module.css';

/**
 * Props for the HabitItem component.
 */
export interface HabitItemProps {
  habit: Habit;
  onCheckIn: (id: string) => void;
}

/**
 * Renders a habit item showing its name, streak count with flame icon, and check-in button.
 *
 * @param props - Component props containing the habit entity and check-in callback
 * @returns JSX Element for the habit item
 */
export function HabitItem({ habit, onCheckIn }: HabitItemProps): JSX.Element {
  const streakCount = habit.streak ?? 0;

  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{habit.name}</span>
        {habit.description && <p className={styles.itemDesc}>{habit.description}</p>}
        <div className={styles.streakMeta}>
          <span>🔥 {streakCount} {streakCount === 1 ? 'day streak' : 'days streak'}</span>
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          className={styles.checkInBtn}
          onClick={(): void => onCheckIn(habit.id)}
          disabled={habit.checkedInToday === true}
        >
          {habit.checkedInToday ? '✓ Checked In' : 'Check In'}
        </button>
      </div>
    </div>
  );
}
