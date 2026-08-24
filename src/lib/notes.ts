import { ensureDB } from "./db";
import { getDisplayName } from "./users";

export type NoteTable = "project_notes" | "task_notes";

export interface NoteRecord {
  id: string;
  parentId: string;
  authorUserId: string;
  authorName: string;
  authorRole: UserRole;
  body: string;
  createdAt: number;
  updatedAt: number;
}

type NoteRow = {
  id: string;
  parent_id: string;
  author_user_id: string;
  author_email: string;
  author_first_name: string | null;
  author_last_name: string | null;
  author_role: UserRole;
  body: string;
  created_at: number;
  updated_at: number;
};

function parentColumn(table: NoteTable): "project_id" | "task_id" {
  return table === "project_notes" ? "project_id" : "task_id";
}

function toNoteRecord(row: NoteRow): NoteRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
    authorUserId: row.author_user_id,
    authorName: getDisplayName({ firstName: row.author_first_name, lastName: row.author_last_name, email: row.author_email }),
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = (table: NoteTable, column: string) => `
  ${table}.id as id, ${table}.${column} as parent_id,
  ${table}.author_user_id as author_user_id, ${table}.body as body,
  ${table}.created_at as created_at, ${table}.updated_at as updated_at,
  users.email as author_email, users.first_name as author_first_name,
  users.last_name as author_last_name, users.role as author_role
`;

export async function listNotes(locals: App.Locals, table: NoteTable, parentId: string): Promise<NoteRecord[]> {
  const db = ensureDB(locals);
  const column = parentColumn(table);
  const { results } = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS(table, column)}
       FROM ${table}
       INNER JOIN users ON users.id = ${table}.author_user_id
       WHERE ${table}.${column} = ?
       ORDER BY ${table}.created_at ASC`
    )
    .bind(parentId)
    .all<NoteRow>();

  return results.map(toNoteRecord);
}

export async function getNoteById(locals: App.Locals, table: NoteTable, id: string): Promise<NoteRecord | null> {
  const db = ensureDB(locals);
  const column = parentColumn(table);
  const row = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS(table, column)}
       FROM ${table}
       INNER JOIN users ON users.id = ${table}.author_user_id
       WHERE ${table}.id = ?
       LIMIT 1`
    )
    .bind(id)
    .first<NoteRow>();

  return row ? toNoteRecord(row) : null;
}

export async function createNote(
  locals: App.Locals,
  table: NoteTable,
  input: { parentId: string; authorUserId: string; body: string }
): Promise<string> {
  const db = ensureDB(locals);
  const column = parentColumn(table);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO ${table} (id, ${column}, author_user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.parentId, input.authorUserId, input.body.trim(), now, now)
    .run();
  return id;
}

export async function updateNote(locals: App.Locals, table: NoteTable, id: string, body: string): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare(`UPDATE ${table} SET body = ?, updated_at = ? WHERE id = ?`)
    .bind(body.trim(), Date.now(), id)
    .run();
}

export async function deleteNote(locals: App.Locals, table: NoteTable, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}
