/**
 * Habit Tracker feature container component.
 *
 * Owns the useHabits hook and renders active habits with streak counts,
 * daily check-ins, and inline habit creation.
 *
 * Requirements: 3.10, 3.11
 */

import { useHabits } from '../hooks/useHabits';
import { HabitItem } from './HabitItem';
import { HabitForm } from './HabitForm';
import styles from './HabitTracker.module.css';

/**
 * Container component for tracking habits and checking in daily.
 *
 * @returns JSX Element for the HabitTracker view
 */
export function HabitTracker(): JSX.Element {
  const { habits, error, loading, addHabit, checkIn } = useHabits();

  const activeHabits = habits.filter((h) => h.active !== false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🔥 Habit Tracker</h2>
          <p className={styles.meta}>
            {habits.filter((h) => h.checkedInToday).length} / {activeHabits.length} checked in today
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <HabitForm onAdd={addHabit} />

      {loading && habits.length === 0 ? (
        <div className={styles.emptyState}>Loading habits...</div>
      ) : (
        <div className={styles.itemsList}>
          {activeHabits.map((habit) => (
            <HabitItem key={habit.id} habit={habit} onCheckIn={checkIn} />
          ))}

          {activeHabits.length === 0 && (
            <div className={styles.emptyState}>No active habits tracked</div>
          )}
        </div>
      )}
    </div>
  );
}
