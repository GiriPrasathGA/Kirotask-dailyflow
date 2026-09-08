# Implementation Plan: DailyFlow

## Overview

Implement the three data modules (Tasks, Reminders, Habits), Productivity Score, and Data Export for the DailyFlow personal productivity hub. The project is a TypeScript monorepo with an Express/SQLite API (`packages/api`) and a React/Vite frontend (`packages/web`). Existing scaffolding (db.ts, app.ts, shared types, export stub, streakUtils stub, TaskBoard monolith) is preserved and extended rather than replaced wholesale.

---

## Tasks

- [ ] 1. Install fast-check and extend database schema
  - [ ] 1.1 Install fast-check as a devDependency in `packages/api`
    - Run `npm install --save-dev fast-check@^3.19.0` inside `packages/api`
    - Verify it appears in `packages/api/package.json` devDependencies
    - _Requirements: 3.8, 4.2 (test infrastructure needed for property tests)_

  - [ ] 1.2 Extend `packages/api/src/db.ts` — add all four module tables
    - Append tasks, reminders, habits, and habit_completions DDL inside the existing `db.exec(...)` call in `initDb()`
    - Include all indexes specified in design.md (idx_tasks_status, idx_tasks_category, idx_tasks_priority, idx_reminders_due_at, idx_reminders_acknowledged, idx_habits_active, idx_habit_completions_habit_id)
    - Preserve the existing users table and pragma calls — do NOT remove them
    - Use `CREATE TABLE IF NOT EXISTS` for idempotency
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 2. Tasks module — types, service, and router
  - [ ] 2.1 Create `packages/api/src/modules/tasks/types.ts`
    - Export `TaskStatus`, `TaskPriority`, `TaskCategory` union types
    - Export `Task`, `CreateTaskDto`, `PatchTaskDto` interfaces as defined in design.md
    - _Requirements: 1.2_

  - [ ] 2.2 Create `packages/api/src/modules/tasks/service.ts`
    - Import `db` from `../../db` and types from `./types`
    - Implement `listTasks(page, pageSize, filters)` — returns `PaginatedResponse<Task>` with optional status/category/priority filtering; returns HTTP 400 for invalid pagination params (page < 1, pageSize outside 1–100)
    - Implement `createTask(dto: CreateTaskDto)` — generates UUID id, validates title (1–200 chars) and description (0–1000 chars), inserts row, returns `Task`
    - Implement `getTaskById(id: string)` — returns `Task` or null if not found
    - Implement `updateTask(id: string, dto: PatchTaskDto)` — validates supplied fields, applies partial update, returns updated `Task` or null if not found
    - Implement `deleteTask(id: string)` — returns true if deleted, false if not found
    - All DB calls use `better-sqlite3` synchronous API
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.5, 6.7_

  - [ ] 2.3 Create `packages/api/src/modules/tasks/router.ts`
    - Export `tasksRouter` as an Express Router
    - Wire `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id` to service functions
    - All responses use `ApiResponse<T>` envelope from `../../types/shared`
    - Return HTTP 201 on create, 400 on validation failure, 404 on missing id
    - For DELETE: return HTTP 204 with **no response body** — use `res.status(204).send()` (do NOT send an `ApiResponse` JSON envelope for 204 responses)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2, 6.5_

- [ ] 3. Checkpoint — Tasks backend
  - Ensure `npm run type-check -w packages/api` passes with no errors.
  - Ask the user if questions arise.

- [ ] 4. Reminders module — types, service, and router
  - [ ] 4.1 Create `packages/api/src/modules/reminders/types.ts`
    - Export `Reminder`, `CreateReminderDto`, `PatchReminderDto` interfaces as defined in design.md
    - _Requirements: 2.2_

  - [ ] 4.2 Create `packages/api/src/modules/reminders/service.ts`
    - Import `db` from `../../db` and types from `./types`
    - Implement `listReminders(page, pageSize)` — returns `PaginatedResponse<Reminder>` ordered by `due_at` ASC; validates pagination params
    - Implement `createReminder(dto: CreateReminderDto)` — validates title (1–200 chars) and dueAt (must be valid ISO 8601 string); inserts row; returns `Reminder`
    - Implement `getReminderById(id: string)` — returns `Reminder` or null
    - Implement `updateReminder(id: string, dto: PatchReminderDto)` — validates supplied fields; applies partial update; returns updated `Reminder` or null
    - Implement `deleteReminder(id: string)` — returns true/false
    - Implement `acknowledgeReminder(id: string)` — sets `acknowledged = 1`; idempotent (returns current state if already true); returns updated `Reminder` or null if not found
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.5, 6.7_

  - [ ] 4.3 Create `packages/api/src/modules/reminders/router.ts`
    - Export `remindersRouter` as an Express Router
    - Wire `GET /reminders`, `POST /reminders`, `GET /reminders/:id`, `PATCH /reminders/:id`, `DELETE /reminders/:id`, `POST /reminders/:id/acknowledge` to service functions
    - All responses use `ApiResponse<T>` envelope
    - Return HTTP 201 on create, 400 on validation failure, 404 on missing id, 200 on acknowledge (including already-acknowledged case)
    - For DELETE: return HTTP 204 with **no response body** — use `res.status(204).send()` (do NOT send an `ApiResponse` JSON envelope for 204 responses)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.5_

- [ ] 5. Habits module — types, fix streakUtils, service, and router
  - [ ] 5.1 Create `packages/api/src/modules/habits/types.ts`
    - Export `HabitFrequency`, `Habit`, `HabitCompletion`, `CreateHabitDto` interfaces as defined in design.md
    - _Requirements: 3.2_

  - [ ] 5.2 ~~Fix `packages/api/src/modules/habits/streakUtils.ts`~~ — DEFERRED to Kiro Fix Power (Phase 6)
    - **DO NOT implement this task during normal implementation.**
    - The existing `computeStreak(completionDates: Date[])` bug is intentionally preserved until the Kiro Fix Power phase.
    - The habits service (task 5.3) and score service (task 7.1) must use the existing `computeStreak` signature `(completionDates: Date[]): number` from `streakUtils.ts` as-is — do not import `todayInTimezone` or the corrected string-based signature, as those do not exist yet.
    - The streak will return 0 for non-UTC timezones until Phase 6 fixes this deliberately.
    - _Reserved for: Kiro Fix Power — Phase 6_
    - _Requirements: 3.8 (deferred)_

  - [ ] 5.3 Create `packages/api/src/modules/habits/service.ts`
    - Import `db` from `../../db` and types from `./types`; import `computeStreak` from `./streakUtils` using the existing signature `(completionDates: Date[]): number` — the corrected timezone-aware version is deferred to Phase 6
    - Implement `listHabits(timezone, page, pageSize)` — returns `PaginatedResponse<Habit>` (active habits only); attaches `streak` to each habit by querying `habit_completions`; validates pagination params
    - Implement `createHabit(dto: CreateHabitDto)` — validates name (1–200 chars) and description (0–500 chars); inserts row with `active = 1`; returns `Habit`
    - Implement `getHabitById(id: string, timezone: string)` — returns `Habit` with `streak` or null
    - Implement `updateHabit(id: string, dto: { name?: string; description?: string })` — validates supplied fields; applies partial update; returns updated `Habit` or null
    - Implement `deactivateHabit(id: string)` — sets `active = 0` (soft-delete); returns true/false
    - Implement `checkIn(habitId: string, timezone: string)` — calls `todayInTimezone`; checks for existing completion (409 if duplicate); checks habit is active (409 if inactive); inserts `HabitCompletion`; returns inserted record
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.1_

  - [ ] 5.4 Create `packages/api/src/modules/habits/router.ts`
    - Export `habitsRouter` as an Express Router
    - Wire `GET /habits`, `POST /habits`, `GET /habits/:id`, `PATCH /habits/:id`, `DELETE /habits/:id`, `POST /habits/:id/check-in` to service functions
    - `GET /habits` and `GET /habits/:id` require `timezone` query param; return 400 if missing or invalid IANA string
    - `POST /habits/:id/check-in` reads `timezone` from query param
    - Return HTTP 201 on habit create and check-in create, 400 on validation failure, 404 on missing id, 409 on duplicate check-in or inactive habit
    - For DELETE (soft-delete): return HTTP 204 with **no response body** — use `res.status(204).send()` (do NOT send an `ApiResponse` JSON envelope for 204 responses)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 6.2_

- [ ] 6. Checkpoint — Habits and Reminders backend
  - Ensure `npm run type-check -w packages/api` passes with no errors.
  - Ask the user if questions arise.

- [ ] 7. Score and Export modules
  - [ ] 7.1 Create `packages/api/src/modules/score/service.ts`
    - Export `ScoreData` interface: `{ score, taskCompletionRate, reminderAckRate, habitStreakConsistency }`
    - Export `computeScore(timezone: string): ScoreData` implementing the formula from design.md:
      - TCR: `done_tasks / total_tasks` (0 if no tasks)
      - RAR: `acknowledged_past_reminders / total_past_reminders` where "past" means `due_at ≤ now` (0 if no past reminders)
      - HSC: `habits_with_streak_gte_1 / total_active_habits` (0 if no active habits)
      - Compute score as two explicit steps to avoid confusion:
        ```
        const rawScore = (tcr * 0.4 + rar * 0.3 + hsc * 0.3) * 100;
        const score = Math.round(rawScore * 100) / 100;
        ```
        (multiply by 100 to get the 0–100 range, then round to 2 decimal places)
    - Import `computeStreak` from `../habits/streakUtils` using the existing signature — do not use `todayInTimezone` (deferred to Phase 6)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 7.2 Create `packages/api/src/modules/score/router.ts`
    - Export `scoreRouter` as an Express Router
    - Wire `GET /score` to `computeScore`; read `timezone` query param (default to `'UTC'` if absent)
    - Return `ApiResponse<ScoreData>` with HTTP 200
    - _Requirements: 4.1, 6.2_

  - [ ] 7.3 Replace `packages/api/src/modules/export/router.ts` with real fs implementation
    - Remove the stub body; implement using Node's built-in `fs` module (`writeFileSync`, `mkdirSync`, `unlinkSync`, `existsSync`) and `path.join`
    - Import `computeScore` from `../score/service` and `db` from `../../db`
    - On `POST /export`: create `exports/` dir if needed; build timestamp filename (colons→hyphens); query all four tables; call `computeScore('UTC')`; write JSON with keys `exportedAt`, `tasks`, `reminders`, `habits`, `habitCompletions`, `score`; return `ApiResponse<{ filePath: string }>` with HTTP 200
    - On filesystem error: attempt to clean up partial file; return HTTP 500 with `ApiResponse<null>`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2_

- [ ] 8. Wire API routers into app.ts
  - Modify `packages/api/src/app.ts` to import `tasksRouter`, `remindersRouter`, `habitsRouter`, `scoreRouter`
  - Uncomment/replace the four commented-out `app.use(...)` lines with real registrations:
    - `app.use('/api/v1', tasksRouter)`
    - `app.use('/api/v1', remindersRouter)`
    - `app.use('/api/v1', habitsRouter)`
    - `app.use('/api/v1', scoreRouter)`
  - Keep existing `exportRouter` registration and health check unchanged
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.2_

- [ ] 9. Checkpoint — Full API
  - Ensure `npm run type-check -w packages/api` and `npm run build -w packages/api` both pass.
  - Ask the user if questions arise.

- [ ] 9.5 Frontend setup — create TypeScript CSS module declaration
  - Create `packages/web/src/vite-env.d.ts` with the single line:
    ```typescript
    /// <reference types="vite/client" />
    ```
  - This file enables TypeScript to resolve `*.module.css` imports (e.g., `import styles from './App.module.css'`) without type errors
  - Must be completed before any frontend component is written or type-checked
  - _Requirements: 6.3 (data persistence and API contract — build must pass)_

- [ ] 10. Frontend — Tasks feature
  - [ ] 10.1 Create `packages/web/src/features/tasks/types.ts`
    - Export `TaskStatus`, `TaskPriority`, `TaskCategory`, `Task`, `CreateTaskDto` types mirroring the API types (no backend import — frontend-local copy)
    - _Requirements: 1.2, 1.6_

  - [ ] 10.2 Create `packages/web/src/features/tasks/hooks/useTasks.ts`
    - Export `useTasks()` hook managing `tasks: Task[]`, `error: string | null`, `loading: boolean`
    - Implement `fetchTasks()` — GET `/api/v1/tasks?pageSize=100`; populates state
    - Implement `addTask(dto: CreateTaskDto)` — POST with optimistic prepend; rollback on error
    - Implement `moveTask(id, newStatus)` — PATCH optimistically; rollback on error
    - Implement `removeTask(id)` — DELETE optimistically; rollback on error
    - Follow optimistic update pattern from design.md: snapshot → apply → confirm/rollback
    - Call `fetchTasks()` on mount
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ] 10.3 Create `packages/web/src/features/tasks/components/TaskForm.tsx`
    - Controlled form with title (required), description, priority select, category select, dueDate input
    - On submit: calls `onAdd(dto)` prop and clears form; blocks empty title
    - On cancel: calls `onCancel()` prop
    - Props: `onAdd: (dto: CreateTaskDto) => void`, `onCancel: () => void`
    - _Requirements: 1.9_

  - [ ] 10.4 Create `packages/web/src/features/tasks/components/TaskFilters.tsx`
    - Two controlled `<select>` elements: category (all/work/personal/health) and priority (all/high/medium/low)
    - Props: `filterCategory`, `filterPriority`, `onCategoryChange`, `onPriorityChange`
    - _Requirements: 1.12_

  - [ ] 10.5 Create `packages/web/src/features/tasks/components/TaskCard.tsx`
    - Draggable card; shows priority dot (colour from PRIORITY_COLOURS map), title, description, category tag, due date
    - Back / Forward / Delete action buttons
    - Props: `task: Task`, `onStatusChange`, `onDelete`, `onDragStart`
    - Must be under 200 lines (ESLint max-lines rule enforced at build time)
    - _Requirements: 1.6, 1.7, 1.11_

  - [ ] 10.6 Create `packages/web/src/features/tasks/components/KanbanColumn.tsx`
    - Drop zone for one Kanban column; renders list of `TaskCard`
    - Shows empty-state placeholder when column has no cards
    - Props: `status: TaskStatus`, `label: string`, `tasks: Task[]`, `draggedId: string | null`, `onDrop`, `onStatusChange`, `onDelete`
    - Must be under 200 lines
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ] 10.7 Refactor `packages/web/src/features/tasks/components/TaskBoard.tsx`
    - Replace monolithic implementation (~280 lines) with state-management-only component (~80 lines)
    - Owns `useTasks` hook, filter state (`filterCategory`, `filterPriority`), and `draggedId` state
    - Computes `visibleTasks` and `completionRate` then delegates rendering to `TaskFilters`, `KanbanColumn` (×3), and `TaskForm`
    - Must be under 200 lines (resolves the ESLint build failure)
    - Preserve existing component JSDoc comment
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

- [ ] 11. Frontend — Reminders feature
  - [ ] 11.1 Create `packages/web/src/features/reminders/types.ts`
    - Export `Reminder` interface: `id`, `title`, `dueAt`, `acknowledged`, `createdAt`
    - _Requirements: 2.2_

  - [ ] 11.2 Create `packages/web/src/features/reminders/hooks/useReminders.ts`
    - Export `useReminders()` hook managing `reminders: Reminder[]`, `error: string | null`, `loading: boolean`
    - Implement `fetchReminders()` — GET `/api/v1/reminders?pageSize=100`
    - Implement `addReminder(dto)` — POST with optimistic append; rollback on error
    - Implement `removeReminder(id)` — DELETE optimistically; rollback on error
    - Implement `acknowledge(id)` — POST to `/api/v1/reminders/:id/acknowledge` optimistically; rollback on error
    - Call `fetchReminders()` on mount
    - _Requirements: 2.6, 2.7, 2.8, 2.9_

  - [ ] 11.3 Create `packages/web/src/features/reminders/components/ReminderItem.tsx`
    - Displays title, formatted due time, overdue indicator when `dueAt < now && !acknowledged`
    - "Acknowledge" button disabled when already acknowledged
    - Props: `reminder: Reminder`, `onAcknowledge: (id: string) => void`
    - _Requirements: 2.7, 2.8, 2.9_

  - [ ] 11.4 Create `packages/web/src/features/reminders/components/ReminderList.tsx`
    - Owns `useReminders` hook
    - Renders sorted list (by dueAt ascending) of `ReminderItem`
    - Includes inline create-reminder form (title + datetime input)
    - Shows error banner when `error !== null`
    - _Requirements: 2.6, 2.7, 2.8, 2.9_

- [ ] 12. Frontend — Habits feature
  - [ ] 12.1 Create `packages/web/src/features/habits/types.ts`
    - Export `Habit` interface: `id`, `name`, `description`, `frequency`, `active`, `createdAt`, `streak?: number`, `checkedInToday?: boolean`
    - _Requirements: 3.2_

  - [ ] 12.2 Create `packages/web/src/features/habits/hooks/useHabits.ts`
    - Export `useHabits()` hook managing `habits: Habit[]`, `error: string | null`, `loading: boolean`
    - Detect timezone once via `Intl.DateTimeFormat().resolvedOptions().timeZone`
    - Implement `fetchHabits()` — GET `/api/v1/habits?timezone=<tz>&pageSize=100`
    - Implement `addHabit(dto)` — POST; refresh list on success
    - Implement `checkIn(id)` — POST to `/api/v1/habits/:id/check-in?timezone=<tz>` optimistically (increment streak, set checkedInToday); rollback on error; refresh list after success
    - Call `fetchHabits()` on mount
    - _Requirements: 3.10, 3.11_

  - [ ] 12.3 Create `packages/web/src/features/habits/components/HabitItem.tsx`
    - Displays habit name, current streak count (with 🔥 icon), "Check In" button
    - Button disabled when `habit.checkedInToday === true`
    - Props: `habit: Habit`, `onCheckIn: (id: string) => void`
    - _Requirements: 3.10, 3.11_

  - [ ] 12.4 Create `packages/web/src/features/habits/components/HabitTracker.tsx`
    - Owns `useHabits` hook
    - Renders list of `HabitItem` for active habits
    - Includes inline create-habit form (name + optional description)
    - Shows error banner when `error !== null`
    - _Requirements: 3.10, 3.11_

- [ ] 13. Frontend — Score and Export feature
  - [ ] 13.1 Create `packages/web/src/features/score/hooks/useScore.ts`
    - Export `useScore()` hook managing `scoreData: ScoreData | null`, `error: string | null`, `loading: boolean`
    - `ScoreData`: `{ score, taskCompletionRate, reminderAckRate, habitStreakConsistency }`
    - Implement `fetchScore()` — GET `/api/v1/score?timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`; detect timezone once at hook initialization using `Intl.DateTimeFormat().resolvedOptions().timeZone` so the score endpoint receives the user's local IANA timezone for accurate Habit_Streak_Consistency calculation
    - Call `fetchScore()` on mount
    - _Requirements: 4.7, 4.8, 4.9_

  - [ ] 13.2 Create `packages/web/src/features/score/components/ExportButton.tsx`
    - Button that calls `POST /api/v1/export`
    - On HTTP 200: show success banner with returned `filePath` (dismissible)
    - On error: show error banner with message from `ApiResponse.error`
    - Banner dismissed on next export attempt
    - _Requirements: 5.7, 5.8_

  - [ ] 13.3 Create `packages/web/src/features/score/components/ProductivityScore.tsx`
    - Owns `useScore` hook
    - Displays numeric score value and `<progress>` bar (value=score, max=100)
    - Displays three component rates as individual numeric values with labels
    - Shows error banner (no stale score) when `error !== null`
    - Renders `ExportButton`
    - _Requirements: 4.7, 4.8, 4.9_

- [ ] 14. Wire frontend — update App.tsx
  - Modify `packages/web/src/App.tsx` to import and render `ReminderList`, `HabitTracker`, and `ProductivityScore`
  - Replace the three placeholder `<div>` blocks for reminders, habits, and score tabs with the real components
  - Keep `TaskBoard` render and tab navigation unchanged
  - _Requirements: 1.6, 2.6, 3.10, 4.7_

- [ ] 15. Checkpoint — Full frontend build
  - Ensure `npm run type-check -w packages/web` passes and `npm run build -w packages/web` succeeds (ESLint max-lines rule must pass — TaskBoard.tsx must be under 200 lines).
  - Ask the user if questions arise.

- [ ] 16. Unit and property-based tests — API
  - [ ] 16.1 Create `packages/api/src/modules/habits/__tests__/streakUtils.test.ts`
    - Unit tests: zero completions returns 0; single completion today returns 1; single completion yesterday returns 1; gap breaks streak; streak of 3 consecutive days; most-recent date two days ago returns 0
    - _Requirements: 3.8_

  - [ ]* 16.2 Write property tests for `streakUtils` (P8, P9)
    - **Property 8: `computeStreak` returns correct consecutive count** — for any streak length L (0–30) and boolean anchor (today/yesterday), build L consecutive dates and assert `computeStreak` returns L (or 0 when L=0)
    - **Property 9: `todayInTimezone` returns correct local date** — for a set of representative IANA timezones, assert the returned string matches `Intl.DateTimeFormat` output
    - File: `packages/api/src/modules/habits/__tests__/streakUtils.property.test.ts`
    - Tag each test: `// Feature: dailyflow, Property 8:` / `Property 9:`
    - _Requirements: 3.8_

  - [ ] 16.3 Create `packages/api/src/modules/tasks/__tests__/service.test.ts`
    - Unit tests: create task succeeds with valid dto; create task fails with empty title (400); create task fails with title >200 chars (400); create task fails with description >1000 chars (400); getTaskById returns null for unknown id; updateTask updates only supplied fields; deleteTask returns false for unknown id; listTasks returns paginated result; listTasks with status filter returns only matching tasks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 16.4 Write property tests for tasks service (P1, P2, P3, P4)
    - **Property 1: Task creation round-trip** — create then get returns same field values
    - **Property 2: Task validation rejects all invalid inputs** — any title with trimmed length 0 or raw length >200 yields 400; description >1000 yields 400
    - **Property 3: Partial update preserves omitted fields** — PATCH with any subset of fields leaves other fields unchanged
    - **Property 4: Task filter returns only matching tasks** — for any category+priority combination, filtered list contains only matching tasks
    - File: `packages/api/src/modules/tasks/__tests__/service.property.test.ts`
    - Tag each test: `// Feature: dailyflow, Property 1:` through `Property 4:`
    - _Requirements: 1.2, 1.3, 1.4, 1.12_

  - [ ] 16.5 Create `packages/api/src/modules/reminders/__tests__/service.test.ts`
    - Unit tests: create reminder succeeds; create fails with empty title; create fails with invalid dueAt; acknowledge sets flag to true; acknowledge is idempotent (second call returns 200, no error); getReminder returns null for unknown id; listReminders is sorted by dueAt ASC
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 16.6 Write property tests for reminders service (P5, P6, P7)
    - **Property 5: Reminder creation round-trip** — create then get returns matching title, dueAt, acknowledged=false
    - **Property 6: Acknowledge is idempotent** — calling acknowledge N times always leaves acknowledged=true with no error
    - **Property 7: Reminder list sorted by dueAt ascending** — for any set of reminders, GET /reminders items are ordered dueAt ASC
    - File: `packages/api/src/modules/reminders/__tests__/service.property.test.ts`
    - Tag each test: `// Feature: dailyflow, Property 5:` through `Property 7:`
    - _Requirements: 2.2, 2.4, 2.6_

  - [ ] 16.7 Create `packages/api/src/modules/habits/__tests__/service.test.ts`
    - Unit tests: create habit succeeds; create fails with empty name; check-in records completion; duplicate check-in on same day returns 409; check-in on inactive habit returns 409; deactivate sets active=false; listHabits returns only active habits with streak attached
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 16.8 Write property tests for habits (P10, P11)
    - **Property 10: Duplicate check-in rejected and leaves exactly one record** — two check-ins same day → second is 409; habit_completions has exactly one record for that habit+date
    - **Property 11: Habit creation round-trip** — create then get returns matching name, description, frequency='daily', active=true
    - File: `packages/api/src/modules/habits/__tests__/service.property.test.ts`
    - Tag each test: `// Feature: dailyflow, Property 10:` / `Property 11:`
    - _Requirements: 3.2, 3.5_

  - [ ]* 16.9 Write property tests for score service (P12)
    - **Property 12: Score formula and bounds** — for any (tcr, rar, hsc) in [0,1], computed score equals `Math.round((tcr*0.4 + rar*0.3 + hsc*0.3)*100*100)/100` and is in [0,100]; all-zeros → 0; all-ones → 100; zero-denominator inputs → corresponding rate is 0
    - File: `packages/api/src/modules/score/__tests__/service.property.test.ts`
    - Tag: `// Feature: dailyflow, Property 12:`
    - `numRuns: 1000` for formula coverage
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 16.9.1 Create `packages/api/src/modules/score/__tests__/service.test.ts`
    - Unit tests covering:
      - Known-input formula: given `tcr=1`, `rar=1`, `hsc=1` → `score = 100.00`
      - Known-input formula: given `tcr=0.5`, `rar=0`, `hsc=0` → `score = 20.00` (0.5 × 0.4 × 100)
      - Known-input formula: given `tcr=0`, `rar=1`, `hsc=0` → `score = 30.00` (1 × 0.3 × 100)
      - Known-input formula: given `tcr=0`, `rar=0`, `hsc=1` → `score = 30.00` (1 × 0.3 × 100)
      - Exact weights: verify coefficients are 0.4 (tasks), 0.3 (reminders), 0.3 (habits)
      - Zero-denominator: no tasks in DB → `taskCompletionRate = 0`
      - Zero-denominator: no past reminders in DB → `reminderAckRate = 0`
      - Zero-denominator: no active habits in DB → `habitStreakConsistency = 0`
      - Score range: score is always between 0 and 100 inclusive for all component rate combinations
      - Two decimal places: score is rounded to exactly 2 decimal places
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 16.10 Create `packages/api/src/modules/export/__tests__/router.test.ts`
    - Unit tests: POST /export writes a valid JSON file to exports/; returned filePath resolves to the written file; written JSON has all required top-level keys; partial file is cleaned up when writeFileSync throws
    - Use a temp exports dir to avoid polluting workspace
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 16.11 Write property tests for export (P13)
    - **Property 13: Export file contains all records with required structure** — for any db state, exported JSON is parseable, has exactly the required keys, and each array length matches the table count
    - File: `packages/api/src/modules/export/__tests__/router.property.test.ts`
    - Tag: `// Feature: dailyflow, Property 13:`
    - _Requirements: 5.1, 5.5_

- [ ] 17. Final checkpoint — All tests pass
  - Run `npm run test -w packages/api` and ensure all non-optional tests pass.
  - Run `npm run build` from the workspace root and ensure both packages build cleanly.
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they add property-based coverage but are not required for functional correctness.
- Each task references specific requirements for traceability.
- The design.md file contains the authoritative SQLite DDL, streak algorithm, score formula, optimistic update patterns, and export implementation — consult it during implementation.
- The ESLint `max-lines: 200` rule is enforced as a **build error** via vite-plugin-eslint. Task 10.7 (refactoring TaskBoard.tsx) must be completed before `npm run build -w packages/web` can succeed.
- fast-check integrates natively with Vitest — no extra configuration needed beyond installation.
- All `better-sqlite3` calls are synchronous; do not use async/await in API service files.
- Frontend hooks use `fetch` directly (no extra HTTP client library needed).
- **Single-user design:** DailyFlow intentionally supports only one user. The shared `User` type in `packages/api/src/types/shared.ts` and the `users` table in `db.ts` represent this single user as the canonical user model. The `tasks`, `reminders`, `habits`, and `habit_completions` tables do **not** include a `user_id` foreign key — this is a deliberate design choice for the current single-user scope, not an omission. If multi-user support were added in the future, `user_id` FKs would be introduced at that point.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "4.2", "5.2"] },
    { "id": 3, "tasks": ["2.3", "4.3", "5.3"] },
    { "id": 4, "tasks": ["5.4", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3"] },
    { "id": 6, "tasks": ["8", "9.5"] },
    { "id": 7, "tasks": ["10.1", "11.1", "12.1"] },
    { "id": 8, "tasks": ["10.2", "11.2", "12.2"] },
    { "id": 9, "tasks": ["10.3", "10.4", "10.5", "10.6", "11.3", "11.4", "12.3", "12.4", "13.1"] },
    { "id": 10, "tasks": ["10.7", "13.2"] },
    { "id": 11, "tasks": ["13.3"] },
    { "id": 12, "tasks": ["14"] },
    { "id": 13, "tasks": ["16.1", "16.3", "16.5", "16.7", "16.9.1", "16.10"] },
    { "id": 14, "tasks": ["16.2", "16.4", "16.6", "16.8", "16.9", "16.11"] }
  ]
}
```
