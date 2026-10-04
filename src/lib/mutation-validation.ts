import { ensureDB } from "./db";

const fields: Record<string, string[]> = {
  "/api/auth/login": ["email", "password"],
  "/api/auth/logout": [],
  "/api/admin/impersonate/start": ["clientId"],
  "/api/admin/impersonate/stop": [],
  "/api/setup/create-admin": ["operatorSecret", "email", "password"],
  "/api/settings/profile": ["backTo", "firstName", "lastName", "email"],
  "/api/settings/password": ["backTo", "currentPassword", "newPassword", "confirmPassword"],
  "/api/clients/save": ["clientId", "companyName", "contactName", "phone", "email"],
  "/api/clients/delete": ["clientId", "adminPassword"],
  "/api/clients/reset-password": ["clientId"],
  "/api/clients/set-active": ["clientId", "isActive"],
  "/api/projects/save": ["projectId", "clientId", "name", "description", "status", "startDate", "targetDate"],
  "/api/projects/delete": ["projectId"],
  "/api/tasks/save": ["projectId", "taskId", "title", "description", "type", "priority", "assignedToUserId"],
  "/api/tasks/delete": ["projectId", "taskId"],
  "/api/project-notes/save": ["projectId", "noteId", "body"],
  "/api/project-notes/delete": ["projectId", "noteId"],
  "/api/task-notes/save": ["projectId", "taskId", "noteId", "body"],
  "/api/task-notes/delete": ["projectId", "taskId", "noteId"],
  "/api/time-entries/save": ["projectId", "taskId", "date", "amount", "unit", "note"],
  "/api/time-entries/delete": ["projectId", "taskId", "entryId"],
  "/api/invoices/save": ["invoiceId", "clientId", "description", "amount", "status", "issuedDate", "dueDate", "paidDate"],
  "/api/invoices/delete": ["invoiceId"],
  "/api/tickets/create": ["subject", "body", "priority"],
  "/api/tickets/reply": ["ticketId", "body"],
  "/api/tickets/update-status": ["ticketId", "status"],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => uuid.test(value);
const priorities = ["low", "normal", "high"];
const enums: Record<string, Record<string, string[]>> = {
  "/api/projects/save": { status: ["planning", "in_progress", "review", "completed", "on_hold"] },
  "/api/tasks/save": { type: ["story", "bug", "task", "chore"], priority: priorities },
  "/api/tickets/create": { priority: priorities },
  "/api/tickets/update-status": { status: ["open", "in_progress", "waiting_on_client", "resolved", "closed"] },
  "/api/invoices/save": { status: ["draft", "sent", "paid", "overdue", "void"] },
  "/api/time-entries/save": { unit: ["hours", "minutes"] },
  "/api/clients/set-active": { isActive: ["0", "1"] },
};

export function dateValue(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || text.startsWith("0000-")) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? date.getTime() : null;
}

/** Parse decimal dollars exactly, with no exponent, rounding or unsafe integer. */
export function amountCents(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}

export function timeMinutes(amount: FormDataEntryValue | null, unit: string): number | null {
  const text = String(amount ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text) || !["hours", "minutes"].includes(unit)) return null;
  const minutes = Math.round(Number(text) * (unit === "hours" ? 60 : 1));
  return Number.isSafeInteger(minutes) && minutes > 0 ? minutes : null;
}

export function validMutationFields(path: string, form: FormData): boolean {
  const allowed = fields[path];
  if (!allowed) return false; // New form mutations must deliberately define their fields.
  for (const [name, raw] of form.entries()) {
    if (!allowed.includes(name) || typeof raw !== "string") return false;
    const text = raw.trim();
    if ((name.endsWith("Id") || name === "assignedToUserId") && text && !uuid.test(raw)) return false;
    if (name === "email" && text && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) || text.length > 320)) return false;
    if ((name.endsWith("Date") || name === "date") && text && dateValue(raw) === null) return false;
    if (enums[path]?.[name] && !enums[path][name].includes(raw)) return false;
    if (name === "backTo" && raw && !["/admin/settings", "/dashboard/settings"].includes(raw)) return false;
    const cap = name === "phone" ? 64 : ["name", "title", "subject", "companyName", "contactName", "firstName", "lastName"].includes(name) ? 200 : 4096;
    if (!/password/i.test(name) && Array.from(raw).length > cap) return false;
  }
  if (path === "/api/invoices/save" && amountCents(form.get("amount")) === null) return false;
  if (path === "/api/time-entries/save" &&
    (timeMinutes(form.get("amount"), String(form.get("unit") ?? "hours")) === null || dateValue(form.get("date")) === null)) return false;
  return true;
}

/** Only authenticated admins resolve business IDs; client ownership stays in guards. */
export async function validAdminRelationships(locals: App.Locals, path: string, form: FormData): Promise<boolean> {
  if (locals.user?.role !== "admin") return true;
  const db = ensureDB(locals);
  const value = (name: string) => String(form.get(name) ?? "");
  const exists = async (sql: string, ...ids: string[]) => !!(await db.prepare(sql).bind(...ids).first());
  const projectId = value("projectId"), taskId = value("taskId"), noteId = value("noteId"), entryId = value("entryId");
  const childRoute = /^\/api\/(tasks|project-notes|task-notes|time-entries)\//.test(path);
  if (childRoute && !await exists("SELECT 1 FROM projects WHERE id=?", projectId)) return false;
  if (childRoute && taskId && !await exists("SELECT 1 FROM tasks WHERE id=? AND project_id=?", taskId, projectId)) return false;
  if (/^\/api\/(task-notes|time-entries)\//.test(path) && !taskId) return false;
  if (noteId && path.startsWith("/api/project-notes/") &&
    !await exists("SELECT 1 FROM project_notes WHERE id=? AND project_id=?", noteId, projectId)) return false;
  if (noteId && path.startsWith("/api/task-notes/") &&
    !await exists("SELECT 1 FROM task_notes WHERE id=? AND task_id=?", noteId, taskId)) return false;
  if (entryId && !await exists("SELECT 1 FROM time_entries WHERE id=? AND task_id=?", entryId, taskId)) return false;
  const assignee = value("assignedToUserId");
  if (assignee && !await exists("SELECT 1 FROM users WHERE id=? AND role='admin' AND is_active=1", assignee)) return false;
  // No user-supplied table names: every query/table below is fixed application code.
  const references = [["clientId", "clients"], ["invoiceId", "invoices"], ["ticketId", "tickets"]] as const;
  for (const [field, table] of references) {
    if (value(field) && !await exists(`SELECT 1 FROM ${table} WHERE id=?`, value(field))) return false;
  }
  if (!childRoute && projectId && !await exists("SELECT 1 FROM projects WHERE id=?", projectId)) return false;
  return true;
}
