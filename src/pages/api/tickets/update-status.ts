import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { updateTicketStatus, type TicketStatus } from "../../../lib/tickets";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const ticketId = String(form.get("ticketId") ?? "");
  const status = String(form.get("status") ?? "") as TicketStatus;

  if (ticketId && status) {
    await updateTicketStatus(locals, ticketId, status);
  }

  return redirect(`/admin/tickets/${ticketId}`);
};
