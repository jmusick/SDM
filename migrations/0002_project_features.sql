-- Projects may now be internal (no client) — SQLite requires a table rebuild to drop NOT NULL.
PRAGMA foreign_keys=OFF;

CREATE TABLE projects_new (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold')) DEFAULT 'planning',
  start_date INTEGER,
  target_date INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

INSERT INTO projects_new (id, client_id, name, description, status, start_date, target_date, created_at, updated_at)
SELECT id, client_id, name, description, status, start_date, target_date, created_at, updated_at FROM projects;

DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id);

PRAGMA foreign_keys=ON;

-- Features (user stories) belonging to a project
CREATE TABLE IF NOT EXISTS project_features (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'in_progress', 'done')) DEFAULT 'backlog',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS project_features_project_idx ON project_features(project_id);
