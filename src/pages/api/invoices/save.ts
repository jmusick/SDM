import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { createInvoice, updateInvoice, type InvoiceStatus } from "../../../lib/invoices";

export const prerender = false;

function parseDate(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const ms = new Date(`${str}T00:00:00Z`).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function parseAmountCents(value: FormDataEntryValue | null): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const invoiceId = String(form.get("invoiceId") ?? "");
  const description = String(form.get("description") ?? "").trim();
  const amountCents = parseAmountCents(form.get("amount"));
  const status = String(form.get("status") ?? "draft") as InvoiceStatus;
  const issuedDate = parseDate(form.get("issuedDate"));
  const dueDate = parseDate(form.get("dueDate"));
  const paidDate = parseDate(form.get("paidDate"));

  if (!description || amountCents === null) {
    return redirect(invoiceId ? `/admin/billing/${invoiceId}?error=invalid` : "/admin/billing/new?error=invalid");
  }

  if (invoiceId) {
    await updateInvoice(locals, invoiceId, { description, amountCents, status, issuedDate, dueDate, paidDate });
    return redirect(`/admin/billing/${invoiceId}`);
  }

  const clientId = String(form.get("clientId") ?? "");
  if (!clientId) {
    return redirect("/admin/billing/new?error=invalid");
  }

  const newId = await createInvoice(locals, { clientId, description, amountCents, status, issuedDate, dueDate });
  return redirect(`/admin/billing/${newId}`);
};
