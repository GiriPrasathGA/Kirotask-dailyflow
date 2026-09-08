/**
 * Service layer for the Export module.
 *
 * Handles the business logic for assembling all application data, formatting
 * the export JSON payload, and writing it to the local filesystem.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import * as repo from './repository';
import { computeScore } from '../score/service';

/**
 * Result returned by the export data operation.
 */
export interface ExportResult {
  filePath: string;
}

/**
 * Exports all user data (tasks, reminders, habits, habit completions, and productivity score)
 * to a timestamped JSON file inside the ./exports/ directory.
 *
 * Creates the exports directory if it does not exist.
 * On filesystem error, attempts to clean up any partially written file.
 *
 * @returns Object containing the absolute filePath of the exported JSON file
 * @throws Error if the export fails due to a filesystem or data serialization error
 */
export function exportData(): ExportResult {
  const exportsDir = join(process.cwd(), 'exports');

  // Ensure exports directory exists (Requirement 5.6)
  mkdirSync(exportsDir, { recursive: true });

  // Timestamp: colons and periods replaced with hyphens for filesystem compatibility (Requirement 5.2)
  const now = new Date();
  const ts = now.toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const filename = `export-${ts}.json`;
  const filePath = join(exportsDir, filename);

  try {
    const tasks = repo.getAllTasks();
    const reminders = repo.getAllReminders();
    const habits = repo.getAllHabits();
    const habitCompletions = repo.getAllHabitCompletions();
    // Score uses UTC for export (Requirement 5.1, 5.5)
    const score = computeScore('UTC');

    const payload = {
      exportedAt: now.toISOString(),
      tasks,
      reminders,
      habits,
      habitCompletions,
      score,
    };

    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return { filePath };
  } catch (err) {
    // Clean up partial file if it was created (Requirement 5.4)
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        /* best-effort cleanup */
      }
    }
    throw err;
  }
}
