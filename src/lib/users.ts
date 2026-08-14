import { ensureDB } from "./db";
import { verifyPassword } from "./auth";

export async function getUserCount(locals: App.Locals): Promise<number> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
  return row?.count ?? 0;
}

export async function verifyUserPassword(locals: App.Locals, userId: string, password: string): Promise<boolean> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1").bind(userId).first<{ password_hash: string }>();
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}
