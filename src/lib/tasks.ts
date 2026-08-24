import { ensureDB } from "./db";
import { getDisplayName } from "./users";

export type TaskType = "story" | "bug" | "task" | "chore";
export type TaskLane = "planning" | "to_do" | "in_progress" | "qa" | "done";
export type TaskPriority = "low" | "normal" | "high";

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  type: TaskType;
  lane: TaskLane;
  priority: TaskPriority;
  assignedToUserId: string | null;
  assignedToName: string | null;
  createdAt: number;
  updatedAt: number;
}

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: TaskType;
  lane: TaskLane;
  priority: TaskPriority;
  assigned_to_user_id: string | null;
  assigned_to_email: string | null;
  assigned_to_first_name: string | null;
  assigned_to_last_name: string | null;
  created_at: number;
  updated_at: number;
};

function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    type: row.type,
    lane: row.lane,
    priority: row.priority,
    assignedToUserId: row.assigned_to_user_id,
    assignedToName: row.assigned_to_user_id
      ? getDisplayName({ firstName: row.assigned_to_first_name, lastName: row.assigned_to_last_name, email: row.assigned_to_email! })
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_TASK = `
  SELECT tasks.*, assignee.email as assigned_to_email,
         assignee.first_name as assigned_to_first_name, assignee.last_name as assigned_to_last_name
  FROM tasks
  LEFT JOIN users assignee ON assignee.id = tasks.assigned_to_user_id
`;

export async function listTasksByProject(locals: App.Locals, projectId: string): Promise<TaskRecord[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(`${SELECT_TASK} WHERE tasks.project_id = ? ORDER BY tasks.created_at ASC`)
    .bind(projectId)
    .all<TaskRow>();

  return results.map(toTaskRecord);
}

export async function getTaskById(locals: App.Locals, id: string): Promise<TaskRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare(`${SELECT_TASK} WHERE tasks.id = ? LIMIT 1`).bind(id).first<TaskRow>();
  return row ? toTaskRecord(row) : null;
}

export async function createTask(
  locals: App.Locals,
  input: {
    projectId: string;
    title: string;
    description?: string;
    type: TaskType;
    priority: TaskPriority;
    assignedToUserId?: string | null;
  }
): Promise<string> {
  const db = ensureDB(locals);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO tasks (id, project_id, title, description, type, lane, priority, assigned_to_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'planning', ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.projectId,
      input.title.trim(),
      input.description?.trim() || null,
      input.type,
      input.priority,
      input.assignedToUserId || null,
      now,
      now
    )
    .run();
  return id;
}

export async function updateTask(
  locals: App.Locals,
  id: string,
  input: { title: string; description?: string; type: TaskType; priority: TaskPriority; assignedToUserId?: string | null }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare(
      "UPDATE tasks SET title = ?, description = ?, type = ?, priority = ?, assigned_to_user_id = ?, updated_at = ? WHERE id = ?"
    )
    .bind(
      input.title.trim(),
      input.description?.trim() || null,
      input.type,
      input.priority,
      input.assignedToUserId || null,
      Date.now(),
      id
    )
    .run();
}

export async function updateTaskLane(locals: App.Locals, id: string, lane: TaskLane): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("UPDATE tasks SET lane = ?, updated_at = ? WHERE id = ?").bind(lane, Date.now(), id).run();
}

export async function deleteTask(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
}
