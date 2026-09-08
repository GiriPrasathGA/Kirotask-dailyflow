import { useState } from 'react';
import { TaskBoard } from './features/tasks/components/TaskBoard';
import { ReminderList } from './features/reminders/components/ReminderList';
import { HabitTracker } from './features/habits/components/HabitTracker';
import { ProductivityScore } from './features/score/components/ProductivityScore';
import styles from './App.module.css';

type ActiveTab = 'tasks' | 'reminders' | 'habits' | 'score';

/**
 * Root application component.
 * Renders the navigation header and the currently active feature module.
 *
 * Requirements: 1.6, 2.6, 3.10, 4.7
 *
 * @returns The main DailyFlow application layout
 */
export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>◈</span>
          <h1 className={styles.title}>DailyFlow</h1>
        </div>
        <nav className={styles.nav} aria-label="Main Navigation">
          {(['tasks', 'reminders', 'habits', 'score'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              className={`${styles.navBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={(): void => setActiveTab(tab)}
              aria-selected={activeTab === tab}
              type="button"
            >
              {tab === 'tasks' && '📝 '}
              {tab === 'reminders' && '⏰ '}
              {tab === 'habits' && '🔥 '}
              {tab === 'score' && '📊 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        {activeTab === 'tasks' && <TaskBoard />}
        {activeTab === 'reminders' && <ReminderList />}
        {activeTab === 'habits' && <HabitTracker />}
        {activeTab === 'score' && <ProductivityScore />}
      </main>
    </div>
  );
}
