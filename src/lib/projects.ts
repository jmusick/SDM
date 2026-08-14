import { ensureDB } from "./db";

export type ProjectStatus = "planning" | "in_progress" | "review" | "completed" | "on_hold";

export interface ProjectRecord {
  id: string;
  clientId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: number | null;
  targetDate: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectListItem extends ProjectRecord {
  companyName: string | null;
}

type ProjectRow = {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: number | null;
  target_date: number | null;
  created_at: number;
  updated_at: number;
};

function toProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    targetDate: row.target_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllProjects(locals: App.Locals): Promise<ProjectListItem[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      `SELECT projects.*, clients.company_name as company_name
       FROM projects LEFT JOIN clients ON clients.id = projects.client_id
       ORDER BY projects.updated_at DESC`
    )
    .all<ProjectRow & { company_name: string | null }>();

  return results.map((row) => ({ ...toProjectRecord(row), companyName: row.company_name }));
}

export async function listProjectsByClient(locals: App.Locals, clientId: string): Promise<ProjectRecord[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY updated_at DESC")
    .bind(clientId)
    .all<ProjectRow>();

  return results.map(toProjectRecord);
}

export async function getProjectById(locals: App.Locals, id: string): Promise<ProjectRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(id).first<ProjectRow>();
  return row ? toProjectRecord(row) : null;
}

export async function createProject(
  locals: App.Locals,
  input: { clientId: string | null; name: string; description?: string; status: ProjectStatus; startDate?: number | null; targetDate?: number | null }
): Promise<string> {
  const db = ensureDB(locals);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO projects (id, client_id, name, description, status, start_date, target_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.clientId, input.name.trim(), input.description?.trim() || null, input.status, input.startDate ?? null, input.targetDate ?? null, now, now)
    .run();
  return id;
}

export async function updateProject(
  locals: App.Locals,
  id: string,
  input: { name: string; description?: string; status: ProjectStatus; startDate?: number | null; targetDate?: number | null }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare(
      `UPDATE projects SET name = ?, description = ?, status = ?, start_date = ?, target_date = ?, updated_at = ? WHERE id = ?`
    )
    .bind(input.name.trim(), input.description?.trim() || null, input.status, input.startDate ?? null, input.targetDate ?? null, Date.now(), id)
    .run();
}

export async function deleteProject(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}
