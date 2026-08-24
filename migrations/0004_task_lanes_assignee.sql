-- Expand task lanes to Planning/To Do/In Progress/QA/Done, and allow assigning a task to an admin user.
PRAGMA foreign_keys=OFF;

CREATE TABLE tasks_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('story', 'bug', 'task', 'chore')) DEFAULT 'task',
  lane TEXT NOT NULL CHECK (lane IN ('planning', 'to_do', 'in_progress', 'qa', 'done')) DEFAULT 'planning',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal',
  assigned_to_user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO tasks_new (id, project_id, title, description, type, lane, priority, assigned_to_user_id, created_at, updated_at)
SELECT
  id,
  project_id,
  title,
  description,
  type,
  CASE lane
    WHEN 'planned' THEN 'to_do'
    ELSE lane
  END,
  priority,
  NULL,
  created_at,
  updated_at
FROM tasks;

DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to_user_id);

PRAGMA foreign_keys=ON;
