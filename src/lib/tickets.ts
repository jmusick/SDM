import { ensureDB } from "./db";

export type TicketStatus = "open" | "in_progress" | "waiting_on_client" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high";

export interface TicketRecord {
  id: string;
  clientId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: number;
  updatedAt: number;
}

export interface TicketListItem extends TicketRecord {
  companyName: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorEmail: string;
  authorRole: UserRole;
  body: string;
  createdAt: number;
}

type TicketRow = {
  id: string;
  client_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: number;
  updated_at: number;
};

function toTicketRecord(row: TicketRow): TicketRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllTickets(locals: App.Locals): Promise<TicketListItem[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      `SELECT tickets.*, clients.company_name as company_name
       FROM tickets INNER JOIN clients ON clients.id = tickets.client_id
       ORDER BY tickets.updated_at DESC`
    )
    .all<TicketRow & { company_name: string }>();

  return results.map((row) => ({ ...toTicketRecord(row), companyName: row.company_name }));
}

export async function listTicketsByClient(locals: App.Locals, clientId: string): Promise<TicketRecord[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare("SELECT * FROM tickets WHERE client_id = ? ORDER BY updated_at DESC")
    .bind(clientId)
    .all<TicketRow>();

  return results.map(toTicketRecord);
}

export async function getTicketById(locals: App.Locals, id: string): Promise<TicketRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM tickets WHERE id = ? LIMIT 1").bind(id).first<TicketRow>();
  return row ? toTicketRecord(row) : null;
}

export async function listMessages(locals: App.Locals, ticketId: string): Promise<TicketMessage[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      `SELECT ticket_messages.id as id, ticket_messages.ticket_id as ticket_id,
              ticket_messages.author_user_id as author_user_id, ticket_messages.body as body,
              ticket_messages.created_at as created_at, users.email as author_email, users.role as author_role
       FROM ticket_messages
       INNER JOIN users ON users.id = ticket_messages.author_user_id
       WHERE ticket_messages.ticket_id = ?
       ORDER BY ticket_messages.created_at ASC`
    )
    .bind(ticketId)
    .all<{ id: string; ticket_id: string; author_user_id: string; body: string; created_at: number; author_email: string; author_role: UserRole }>();

  return results.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    authorUserId: row.author_user_id,
    authorEmail: row.author_email,
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function createTicket(
  locals: App.Locals,
  input: { clientId: string; authorUserId: string; subject: string; body: string; priority?: TicketPriority }
): Promise<string> {
  const db = ensureDB(locals);
  const ticketId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = Date.now();

  await db.batch([
    db
      .prepare(
        `INSERT INTO tickets (id, client_id, subject, status, priority, created_at, updated_at)
         VALUES (?, ?, ?, 'open', ?, ?, ?)`
      )
      .bind(ticketId, input.clientId, input.subject.trim(), input.priority ?? "normal", now, now),
    db
      .prepare("INSERT INTO ticket_messages (id, ticket_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(messageId, ticketId, input.authorUserId, input.body.trim(), now),
  ]);

  return ticketId;
}

export async function addMessage(
  locals: App.Locals,
  input: { ticketId: string; authorUserId: string; body: string }
): Promise<void> {
  const db = ensureDB(locals);
  const now = Date.now();
  await db.batch([
    db
      .prepare("INSERT INTO ticket_messages (id, ticket_id, author_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), input.ticketId, input.authorUserId, input.body.trim(), now),
    db.prepare("UPDATE tickets SET updated_at = ? WHERE id = ?").bind(now, input.ticketId),
  ]);
}

export async function updateTicketStatus(locals: App.Locals, ticketId: string, status: TicketStatus): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?").bind(status, Date.now(), ticketId).run();
}
