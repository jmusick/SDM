import { ensureDB } from "./db";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface InvoiceRecord {
  id: string;
  clientId: string;
  description: string;
  amountCents: number;
  status: InvoiceStatus;
  issuedDate: number | null;
  dueDate: number | null;
  paidDate: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceListItem extends InvoiceRecord {
  companyName: string;
}

type InvoiceRow = {
  id: string;
  client_id: string;
  description: string;
  amount_cents: number;
  status: InvoiceStatus;
  issued_date: number | null;
  due_date: number | null;
  paid_date: number | null;
  created_at: number;
  updated_at: number;
};

function toInvoiceRecord(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    description: row.description,
    amountCents: row.amount_cents,
    status: row.status,
    issuedDate: row.issued_date,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllInvoices(locals: App.Locals): Promise<InvoiceListItem[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare(
      `SELECT invoices.*, clients.company_name as company_name
       FROM invoices INNER JOIN clients ON clients.id = invoices.client_id
       ORDER BY invoices.updated_at DESC`
    )
    .all<InvoiceRow & { company_name: string }>();

  return results.map((row) => ({ ...toInvoiceRecord(row), companyName: row.company_name }));
}

export async function listInvoicesByClient(locals: App.Locals, clientId: string): Promise<InvoiceRecord[]> {
  const db = ensureDB(locals);
  const { results } = await db
    .prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY updated_at DESC")
    .bind(clientId)
    .all<InvoiceRow>();

  return results.map(toInvoiceRecord);
}

export async function getInvoiceById(locals: App.Locals, id: string): Promise<InvoiceRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1").bind(id).first<InvoiceRow>();
  return row ? toInvoiceRecord(row) : null;
}

export async function createInvoice(
  locals: App.Locals,
  input: { clientId: string; description: string; amountCents: number; status: InvoiceStatus; issuedDate?: number | null; dueDate?: number | null; paidDate?: number | null }
): Promise<string> {
  const db = ensureDB(locals);
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO invoices (id, client_id, description, amount_cents, status, issued_date, due_date, paid_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.clientId, input.description.trim(), input.amountCents, input.status, input.issuedDate ?? null, input.dueDate ?? null, input.paidDate ?? null, now, now)
    .run();
  return id;
}

export async function updateInvoice(
  locals: App.Locals,
  id: string,
  input: { description: string; amountCents: number; status: InvoiceStatus; issuedDate?: number | null; dueDate?: number | null; paidDate?: number | null }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare(
      `UPDATE invoices SET description = ?, amount_cents = ?, status = ?, issued_date = ?, due_date = ?, paid_date = ?, updated_at = ? WHERE id = ?`
    )
    .bind(input.description.trim(), input.amountCents, input.status, input.issuedDate ?? null, input.dueDate ?? null, input.paidDate ?? null, Date.now(), id)
    .run();
}

export async function deleteInvoice(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
}
