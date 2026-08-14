import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { deleteInvoice } from "../../../lib/invoices";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const invoiceId = String(form.get("invoiceId") ?? "");

  if (invoiceId) {
    await deleteInvoice(locals, invoiceId);
  }

  return redirect("/admin/billing");
};
