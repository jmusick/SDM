import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { updateTicketStatus, type TicketStatus } from "../../../lib/tickets";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const ticketId = String(form.get("ticketId") ?? "");
  const status = String(form.get("status") ?? "") as TicketStatus;

  if (ticketId && status) {
    await updateTicketStatus(locals, ticketId, status);
  }

  return redirect(`/admin/tickets/${ticketId}`);
};
