import { ensureDB } from "./db";
import { hashPassword, verifyPassword } from "./auth";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}

export interface AdminUserOption {
  id: string;
  email: string;
  displayName: string;
}

/**
 * A user's first/last name are optional — prefer showing the name wherever a
 * user's identity is displayed (task assignee, note author, time entry
 * "logged by"), falling back to email only when no name is set.
 */
export function getDisplayName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export async function getUserById(locals: App.Locals, id: string): Promise<UserProfile | null> {
  const db = ensureDB(locals);
  const row = await db
    .prepare("SELECT id, email, role, first_name, last_name FROM users WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string; email: string; role: UserRole; first_name: string | null; last_name: string | null }>();
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, firstName: row.first_name, lastName: row.last_name };
}

export async function listAdminUsers(locals: App.Locals): Promise<AdminUserOption[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      "SELECT id, email, first_name, last_name FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY email ASC"
    )
    .all<{ id: string; email: string; first_name: string | null; last_name: string | null }>();

  return results
    .map((row) => ({
      id: row.id,
      email: row.email,
      displayName: getDisplayName({ firstName: row.first_name, lastName: row.last_name, email: row.email }),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

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

/**
 * Updates a user's own profile (name + login email). Always call with the
 * session's own user id — never a userId sourced from form input — since
 * this is meant for self-service account settings, not admin-on-behalf-of
 * edits.
 */
export async function updateUserProfile(
  locals: App.Locals,
  userId: string,
  input: { firstName?: string; lastName?: string; email: string }
): Promise<{ ok: true } | { ok: false; error: "email_taken" }> {
  const db = ensureDB(locals);
  const email = input.email.trim().toLowerCase();

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1")
    .bind(email, userId)
    .first<{ id: string }>();
  if (existing) {
    return { ok: false, error: "email_taken" };
  }

  await db
    .prepare("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?")
    .bind(input.firstName?.trim() || null, input.lastName?.trim() || null, email, userId)
    .run();
  return { ok: true };
}

export async function updateUserPassword(locals: App.Locals, userId: string, newPassword: string): Promise<void> {
  const db = ensureDB(locals);
  const passwordHash = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId).run();
}

const LOGIN_LOCK_THRESHOLD = 8;
const LOGIN_LOCK_DURATION_MS = 1000 * 60 * 15;

/**
 * Called at the top of login, before verifying the password. If the account
 * is currently locked out, returns the lockout expiry instead of touching
 * password_hash — the caller should reject the attempt without a PBKDF2
 * verify.
 */
export async function getLoginLockout(locals: App.Locals, userId: string): Promise<number | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT locked_until FROM users WHERE id = ? LIMIT 1").bind(userId).first<{ locked_until: number | null }>();
  const lockedUntil = row?.locked_until ?? null;
  return lockedUntil && lockedUntil > Date.now() ? lockedUntil : null;
}

/**
 * Increments the failed-attempt counter and locks the account once it hits
 * LOGIN_LOCK_THRESHOLD. Call on every wrong-password login attempt.
 */
export async function recordFailedLogin(locals: App.Locals, userId: string): Promise<void> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT failed_attempts FROM users WHERE id = ? LIMIT 1").bind(userId).first<{ failed_attempts: number }>();
  const attempts = (row?.failed_attempts ?? 0) + 1;
  const lockedUntil = attempts >= LOGIN_LOCK_THRESHOLD ? Date.now() + LOGIN_LOCK_DURATION_MS : null;
  await db
    .prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?")
    .bind(attempts, lockedUntil, userId)
    .run();
}

/** Call on a successful login to clear any accumulated failed attempts. */
export async function resetLoginLockout(locals: App.Locals, userId: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?").bind(userId).run();
}
