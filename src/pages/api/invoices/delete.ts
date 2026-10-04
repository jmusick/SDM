import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { deleteInvoice } from "../../../lib/invoices";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const invoiceId = String(form.get("invoiceId") ?? "");

  if (invoiceId) {
    await deleteInvoice(locals, invoiceId);
  }

  return redirect("/admin/billing");
};
