import { ensureDB } from "./db";
import { hashPassword } from "./auth";

type ClientRow = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
};

function toClientRecord(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
  };
}

export interface ClientListItem extends ClientRecord {
  email: string;
  isActive: boolean;
}

export async function listClients(locals: App.Locals): Promise<ClientListItem[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      `SELECT clients.id as id, clients.user_id as user_id, clients.company_name as company_name,
              clients.contact_name as contact_name, clients.phone as phone,
              users.email as email, users.is_active as is_active
       FROM clients
       INNER JOIN users ON users.id = clients.user_id
       ORDER BY clients.company_name COLLATE NOCASE ASC`
    )
    .all<ClientRow & { email: string; is_active: number }>();

  return results.map((row) => ({ ...toClientRecord(row), email: row.email, isActive: row.is_active === 1 }));
}

export async function getClientById(locals: App.Locals, id: string): Promise<ClientRecord | null> {
  const db = ensureDB(locals);
  const row = await db
    .prepare("SELECT id, user_id, company_name, contact_name, phone FROM clients WHERE id = ? LIMIT 1")
    .bind(id)
    .first<ClientRow>();

  return row ? toClientRecord(row) : null;
}

export async function getClientWithAccountById(
  locals: App.Locals,
  id: string
): Promise<(ClientListItem) | null> {
  const db = ensureDB(locals);
  const row = await db
    .prepare(
      `SELECT clients.id as id, clients.user_id as user_id, clients.company_name as company_name,
              clients.contact_name as contact_name, clients.phone as phone,
              users.email as email, users.is_active as is_active
       FROM clients
       INNER JOIN users ON users.id = clients.user_id
       WHERE clients.id = ?
       LIMIT 1`
    )
    .bind(id)
    .first<ClientRow & { email: string; is_active: number }>();

  return row ? { ...toClientRecord(row), email: row.email, isActive: row.is_active === 1 } : null;
}

export async function getClientByUserId(locals: App.Locals, userId: string): Promise<ClientRecord | null> {
  const db = ensureDB(locals);
  const row = await db
    .prepare("SELECT id, user_id, company_name, contact_name, phone FROM clients WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<ClientRow>();

  return row ? toClientRecord(row) : null;
}

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 12);
}

export async function createClient(
  locals: App.Locals,
  input: { email: string; companyName: string; contactName?: string; phone?: string }
): Promise<{ clientId: string; temporaryPassword: string }> {
  const db = ensureDB(locals);
  const email = input.email.trim().toLowerCase();
  const temporaryPassword = generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const userId = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  const now = Date.now();

  await db.batch([
    db
      .prepare("INSERT INTO users (id, email, password_hash, role, is_active, created_at) VALUES (?, ?, ?, 'client', 1, ?)")
      .bind(userId, email, passwordHash, now),
    db
      .prepare("INSERT INTO clients (id, user_id, company_name, contact_name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(clientId, userId, input.companyName.trim(), input.contactName?.trim() || null, input.phone?.trim() || null, now),
  ]);

  return { clientId, temporaryPassword };
}

export async function updateClient(
  locals: App.Locals,
  clientId: string,
  input: { companyName: string; contactName?: string; phone?: string }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare("UPDATE clients SET company_name = ?, contact_name = ?, phone = ? WHERE id = ?")
    .bind(input.companyName.trim(), input.contactName?.trim() || null, input.phone?.trim() || null, clientId)
    .run();
}

export async function setClientActive(locals: App.Locals, userId: string, isActive: boolean): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("UPDATE users SET is_active = ? WHERE id = ?").bind(isActive ? 1 : 0, userId).run();
}

/**
 * Deletes the client's login user, which cascades (via ON DELETE CASCADE
 * foreign keys) through sessions, the client profile, and everything keyed
 * to that client — projects, invoices, tickets, and ticket messages.
 */
export async function deleteClient(locals: App.Locals, clientId: string): Promise<void> {
  const db = ensureDB(locals);
  const client = await getClientById(locals, clientId);
  if (!client) return;
  await db.prepare("DELETE FROM users WHERE id = ?").bind(client.userId).run();
}

export async function resetClientPassword(locals: App.Locals, userId: string): Promise<string> {
  const db = ensureDB(locals);
  const temporaryPassword = generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  // Kill every session for this account — an admin reset is a response to a lost
  // or compromised credential, so any existing login must not survive it.
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
  ]);
  return temporaryPassword;
}
