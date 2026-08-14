import { ensureDB } from "./db";

export type FeatureStatus = "backlog" | "in_progress" | "done";

export interface FeatureRecord {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  createdAt: number;
  updatedAt: number;
}

type FeatureRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  created_at: number;
  updated_at: number;
};

function toFeatureRecord(row: FeatureRow): FeatureRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFeaturesByProject(locals: App.Locals, projectId: string): Promise<FeatureRecord[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare("SELECT * FROM project_features WHERE project_id = ? ORDER BY created_at ASC")
    .bind(projectId)
    .all<FeatureRow>();

  return results.map(toFeatureRecord);
}

export async function getFeatureById(locals: App.Locals, id: string): Promise<FeatureRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM project_features WHERE id = ? LIMIT 1").bind(id).first<FeatureRow>();
  return row ? toFeatureRecord(row) : null;
}

export async function createFeature(
  locals: App.Locals,
  input: { projectId: string; title: string; description?: string; status: FeatureStatus }
): Promise<string> {
  const db = ensureDB(locals);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO project_features (id, project_id, title, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.projectId, input.title.trim(), input.description?.trim() || null, input.status, now, now)
    .run();
  return id;
}

export async function updateFeature(
  locals: App.Locals,
  id: string,
  input: { title: string; description?: string; status: FeatureStatus }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare("UPDATE project_features SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ?")
    .bind(input.title.trim(), input.description?.trim() || null, input.status, Date.now(), id)
    .run();
}

export async function deleteFeature(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM project_features WHERE id = ?").bind(id).run();
}
