# Requirements Document

## Introduction

DailyFlow is a personal productivity hub for a single user. It is composed of three data modules — Tasks, Reminders, and Habits — that together feed a single computed Productivity Score. The application exposes a REST API (Express/TypeScript) consumed by a React/Vite frontend. All data is persisted in a local SQLite database. Users may export their complete data to a local JSON file at any time.

This document captures the full functional requirements for the DailyFlow application: the Tasks module, the Reminders module, the Habits module, the Productivity Score, and the Data Export capability.

---

## Glossary

- **System**: The DailyFlow backend API and its associated frontend application, taken together.
- **API**: The Express/TypeScript REST backend running on port 3001.
- **UI**: The React/Vite frontend running on port 5173.
- **User**: The single local user of the DailyFlow application.
- **Task**: A unit of work with a title, optional description, status, priority, category, and optional due date.
- **Reminder**: A scheduled alert with a title, due date-time, and acknowledgement state.
- **Habit**: A recurring activity tracked by daily completion check-ins.
- **Habit_Completion**: A record of a single check-in for a Habit on a specific calendar day.
- **Streak**: The number of consecutive calendar days (in the user's local timezone) on which a Habit was completed at least once, ending on today or yesterday.
- **Productivity_Score**: A composite score (0–100) computed from task completion rate, reminder acknowledgement rate, and habit streak consistency.
- **Task_Completion_Rate**: The ratio of Tasks with status `done` to total Tasks, expressed as a value between 0 and 1.
- **Reminder_Ack_Rate**: The ratio of acknowledged Reminders to total Reminders whose due date-time has passed, expressed as a value between 0 and 1.
- **Habit_Streak_Consistency**: The ratio of Habits with a current Streak ≥ 1 to total active Habits, expressed as a value between 0 and 1.
- **ApiResponse**: The standard JSON envelope `{ data: T | null, error: string | null }` returned by every API endpoint.
- **Export_File**: A timestamped JSON file written to the local `./exports/` directory containing all User data.

---

## Requirements

### Requirement 1: Task Management

**User Story:** As a User, I want to create, view, update, and delete Tasks, so that I can track my work across a Kanban board with three status columns.

#### Acceptance Criteria

1. THE API SHALL expose CRUD endpoints for Tasks under the path `/api/v1/tasks`, where creating a Task uses POST, retrieving all Tasks uses GET, retrieving a single Task uses GET with the Task `id`, updating a Task uses PATCH with the Task `id`, and deleting a Task uses DELETE with the Task `id`.
2. WHEN a request is made to create a Task, THE API SHALL persist the Task with fields: `id` (UUID), `title` (required, non-empty string of 1–200 characters), `description` (optional string of 0–1000 characters), `status` (one of `todo`, `in_progress`, `done`, defaulting to `todo`), `priority` (one of `low`, `medium`, `high`), `category` (one of `work`, `personal`, `health`), `dueDate` (optional ISO 8601 calendar date string in `YYYY-MM-DD` format), and `createdAt` (ISO 8601 timestamp set at creation time and not modifiable thereafter).
3. WHEN a request to create a Task is received with a missing or empty `title`, or with a `title` exceeding 200 characters, or with a `description` exceeding 1000 characters, THE API SHALL return HTTP 400 with an `ApiResponse` whose `error` field describes the validation failure.
4. WHEN a request to update a Task is received, THE API SHALL accept any combination of the patchable fields `title`, `description`, `status`, `priority`, `category`, and `dueDate`, validate each supplied field against the same rules defined in criterion 2, and persist only the supplied fields while leaving omitted fields unchanged.
5. IF a request references a Task `id` that does not exist, THEN THE API SHALL return HTTP 404 with an `ApiResponse` whose `error` field is set.
6. THE UI SHALL render Tasks in a Kanban board with three columns labelled "To Do", "In Progress", and "Done".
7. WHEN the User drags a Task card from one column and drops it onto another column, THE UI SHALL send a status update request to THE API and, upon a successful response, update the Task card's column to match the target column without a full page reload.
8. IF THE API returns an error response to a status update request initiated by a drag-and-drop, THEN THE UI SHALL revert the Task card to its original column and display an error message indicating the update failed.
9. WHEN the User submits the new-Task form with a valid `title`, THE UI SHALL send a create request to THE API and, upon a successful response, add the resulting Task card to the "To Do" column without a full page reload.
10. IF THE API returns an error response to a create or delete request, THEN THE UI SHALL not modify the board state and SHALL display an error message indicating the operation failed.
11. WHEN the User deletes a Task, THE UI SHALL send a delete request to THE API and, upon a successful response, remove the Task card from the board without a full page reload.
12. THE UI SHALL allow the User to filter the visible Task cards by `category` and by `priority` simultaneously, where selecting no value for a filter dimension displays Tasks of all values for that dimension, and only Tasks matching all active filter selections are shown.

---

### Requirement 2: Reminder Engine

**User Story:** As a User, I want to create, view, and acknowledge Reminders with a specific date and time, so that I receive timely alerts for upcoming events or deadlines.

#### Acceptance Criteria

1. THE API SHALL expose CRUD endpoints for Reminders under the path `/api/v1/reminders`, where creating a Reminder uses POST, retrieving all Reminders uses GET, retrieving a single Reminder uses GET with the Reminder `id`, updating a Reminder uses PATCH with the Reminder `id`, and deleting a Reminder uses DELETE with the Reminder `id`.
2. WHEN a request is made to create a Reminder, THE API SHALL persist the Reminder with fields: `id` (UUID), `title` (required, non-empty string of 1–200 characters), `dueAt` (required ISO 8601 date-time string), `acknowledged` (boolean, defaulting to `false`), and `createdAt` (ISO 8601 timestamp set at creation and not modifiable thereafter).
3. WHEN a request to create a Reminder is received with a missing or empty `title`, a `title` exceeding 200 characters, a missing `dueAt`, or a `dueAt` that is not a valid ISO 8601 date-time string, THE API SHALL return HTTP 400 with an `ApiResponse` whose `error` field describes the validation failure.
4. WHEN a request is made to acknowledge a Reminder, THE API SHALL set the Reminder's `acknowledged` field to `true` and persist the change; IF the Reminder is already acknowledged, THE API SHALL return HTTP 200 without error and leave the `acknowledged` field unchanged.
5. IF a request references a Reminder `id` that does not exist, THEN THE API SHALL return HTTP 404 with an `ApiResponse` whose `error` field is set.
6. THE UI SHALL display all Reminders in a list sorted by `dueAt` in ascending order.
7. WHEN a Reminder's `dueAt` is in the past and the Reminder is not yet acknowledged, THE UI SHALL render that Reminder with a visible overdue indicator (such as a distinct colour, icon, or label) that is not applied to future or acknowledged Reminders.
8. WHEN the User clicks the acknowledge button on a Reminder, THE UI SHALL send an acknowledge request to THE API and, upon a successful response, update the Reminder's visual state to reflect acknowledgement without a full page reload.
9. IF THE API returns an error response to an acknowledge request, THEN THE UI SHALL leave the Reminder's visual state unchanged and display an error message indicating the acknowledgement failed.

---

### Requirement 3: Habit Tracker

**User Story:** As a User, I want to define Habits and record daily check-ins, so that I can build consistent routines and monitor my streaks.

#### Acceptance Criteria

1. THE API SHALL expose endpoints for Habits under the path `/api/v1/habits`, where creating a Habit uses POST, retrieving all active Habits uses GET, retrieving a single Habit uses GET with the Habit `id`, updating a Habit uses PATCH with the Habit `id`, and deleting a Habit uses DELETE with the Habit `id` (which sets `active` to `false` rather than permanently removing the record).
2. WHEN a request is made to create a Habit, THE API SHALL persist the Habit with fields: `id` (UUID), `name` (required, non-empty string of 1–200 characters), `description` (optional string of 0–500 characters), `frequency` (one of `daily`, defaulting to `daily`), `active` (boolean, defaulting to `true`), and `createdAt` (ISO 8601 timestamp set at creation and not modifiable thereafter).
3. IF a request to create a Habit is received with a missing or empty `name`, or with a `name` exceeding 200 characters, or with a `description` exceeding 500 characters, THEN THE API SHALL return HTTP 400 with an `ApiResponse` whose `error` field describes the validation failure.
4. THE API SHALL expose an endpoint `POST /api/v1/habits/:id/check-in` that accepts an IANA timezone string via a required `timezone` query parameter and records a Habit_Completion for the current calendar day in that timezone.
5. IF a check-in request is received for a Habit that has already been checked in on the current calendar day in the supplied timezone, THEN THE API SHALL return HTTP 409 with an `ApiResponse` whose `error` field indicates a duplicate check-in.
6. IF a check-in request is received for a Habit whose `active` field is `false`, THEN THE API SHALL return HTTP 409 with an `ApiResponse` whose `error` field indicates that check-in on an inactive Habit is not permitted.
7. WHEN the User requests the list of Habits via GET `/api/v1/habits`, THE API SHALL accept an IANA timezone string via a required `timezone` query parameter and include the current Streak for each Habit computed using calendar days in that timezone.
8. THE Streak_Calculator SHALL compute the Streak by counting consecutive calendar days — using the IANA timezone supplied by the caller, not UTC — ending on today or yesterday in that timezone, on which the Habit was completed at least once; a Habit with no completions SHALL have a Streak of 0.
9. IF a request references a Habit `id` that does not exist, THEN THE API SHALL return HTTP 404 with an `ApiResponse` whose `error` field describes the missing resource.
10. THE UI SHALL display each active Habit with its name, current Streak count, and a "Check In" button that is disabled for Habits already checked in today (determined using the user's local timezone as reported by the browser).
11. WHEN the User clicks "Check In" for a Habit, THE UI SHALL send a check-in request to THE API (including the user's IANA timezone) and, upon a successful response, update the displayed Streak count and disable the "Check In" button for that Habit without a full page reload.

---

### Requirement 4: Productivity Score

**User Story:** As a User, I want to see a single Productivity Score that reflects my overall performance across Tasks, Reminders, and Habits, so that I can gauge my daily productivity at a glance.

#### Acceptance Criteria

1. THE API SHALL expose a read-only endpoint `GET /api/v1/score` that returns the current Productivity_Score and its three component rates computed at the moment of the request.
2. THE API SHALL compute Productivity_Score using the formula: `Score = ((Task_Completion_Rate × 0.4) + (Reminder_Ack_Rate × 0.3) + (Habit_Streak_Consistency × 0.3)) × 100` where each component rate is a value between 0 and 1 inclusive and the resulting Score is a value between 0 and 100 inclusive.
3. IF there are no Tasks in the database, THEN THE API SHALL use 0 as the value of Task_Completion_Rate.
4. IF there are no Reminders whose `dueAt` has passed at the time of the request, THEN THE API SHALL use 0 as the value of Reminder_Ack_Rate.
5. IF there are no active Habits (i.e., Habits with `active` set to `true`), THEN THE API SHALL use 0 as the value of Habit_Streak_Consistency.
6. THE API SHALL return the Productivity_Score value rounded to two decimal places.
7. THE UI SHALL display the Productivity_Score as a numeric value between 0 and 100 and as a visual progress bar or gauge whose filled proportion corresponds to the score value.
8. THE UI SHALL display the three component rates (Task_Completion_Rate, Reminder_Ack_Rate, Habit_Streak_Consistency) alongside the overall score as individual numeric values so the User can identify which area needs improvement.
9. IF THE API returns an error response from the score endpoint, THEN THE UI SHALL display an error message and SHALL NOT display a stale score value.

---

### Requirement 5: Data Export

**User Story:** As a User, I want to export all my data to a local JSON file, so that I can keep an offline backup of my Tasks, Reminders, Habits, and Productivity Score.

#### Acceptance Criteria

1. THE API SHALL expose an endpoint `POST /api/v1/export` that collects all User data (Tasks, Reminders, Habits, Habit_Completions, and the current Productivity_Score snapshot) and writes it to the `./exports/` directory as a JSON file.
2. WHEN the export endpoint is called, THE API SHALL name the Export_File using the pattern `export-<ISO-8601-timestamp>.json` where the timestamp reflects the moment the export operation begins, formatted as `YYYY-MM-DDTHH-mm-ss-mssZ` with colons replaced by hyphens to ensure filesystem compatibility.
3. WHEN the export file is written successfully, THE API SHALL return HTTP 200 with an `ApiResponse` whose `data` field contains the absolute Export_File path as a string.
4. WHEN the export fails due to a filesystem error, THE API SHALL return HTTP 500 with an `ApiResponse` whose `error` field contains a message indicating the nature of the filesystem failure, and no partial file shall remain in the `./exports/` directory.
5. THE Export_File SHALL be valid JSON with a top-level structure containing exactly the keys `exportedAt` (ISO-8601 string), `tasks` (array), `reminders` (array), `habits` (array), `habitCompletions` (array), and `score` (object representing the current Productivity_Score snapshot); each array SHALL contain all records currently stored for that entity, with an empty array when no records exist.
6. IF the `./exports/` directory does not exist at the time of export, THEN THE API SHALL create it before writing the Export_File.
7. THE UI SHALL provide an "Export Data" button that calls the export endpoint and, upon receiving HTTP 200, displays the returned file path in a success banner that remains visible until dismissed by the User or a new export action is initiated.
8. IF the export endpoint returns an error, THEN THE UI SHALL display a message indicating the export failed, derived from the `error` field of the `ApiResponse`, and SHALL NOT display a success banner.

---

### Requirement 6: Data Persistence and API Contract

**User Story:** As a User, I want all my data to be persisted across application restarts, so that I do not lose my Tasks, Reminders, or Habits when the server is restarted.

#### Acceptance Criteria

1. THE API SHALL persist all Tasks, Reminders, Habits, and Habit_Completions in the SQLite database located at `./data/db.sqlite`.
2. THE API SHALL wrap every response in the `ApiResponse` envelope `{ data: T | null, error: string | null }`, returning `error: null` on success and `data: null` on failure.
3. WHEN the API server starts, THE API SHALL initialise the database schema using `IF NOT EXISTS` guards so the operation is idempotent across restarts.
4. WHEN the API server starts, THE API SHALL enable SQLite foreign key enforcement (`PRAGMA foreign_keys = ON`) and WAL journal mode (`PRAGMA journal_mode = WAL`) before accepting any requests.
5. WHEN the API returns a list of records, THE API SHALL wrap the list in a `PaginatedResponse` envelope containing `items` (array of records for the current page) and `meta` (object with `page` (1-indexed integer, defaulting to 1), `pageSize` (integer between 1 and 100, defaulting to 20), and `total` (integer count of all matching records)).
6. IF the SQLite database file cannot be opened or created on startup, THEN THE API SHALL log the error and exit the process with a non-zero exit code.
7. IF a pagination request is received with a `page` value less than 1 or a `pageSize` value outside the range 1–100, THEN THE API SHALL return HTTP 400 with an `ApiResponse` whose `error` field describes the invalid parameter.
