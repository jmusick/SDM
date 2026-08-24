-- Rename project_features -> tasks (adds type/lane/priority, drops status), plus notes and time tracking.
PRAGMA foreign_keys=OFF;

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('story', 'bug', 'task', 'chore')) DEFAULT 'task',
  lane TEXT NOT NULL CHECK (lane IN ('planned', 'in_progress', 'qa', 'done')) DEFAULT 'planned',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO tasks (id, project_id, title, description, type, lane, priority, created_at, updated_at)
SELECT
  id,
  project_id,
  title,
  description,
  'story',
  CASE status
    WHEN 'backlog' THEN 'planned'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'done' THEN 'done'
    ELSE 'planned'
  END,
  'normal',
  created_at,
  updated_at
FROM project_features;

DROP TABLE project_features;

CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);

-- Notes on a project
CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS project_notes_project_idx ON project_notes(project_id);

-- Notes on a task
CREATE TABLE IF NOT EXISTS task_notes (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS task_notes_task_idx ON task_notes(task_id);

-- Individual logged-time entries on a task
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  entry_date INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS time_entries_task_idx ON time_entries(task_id);

PRAGMA foreign_keys=ON;
