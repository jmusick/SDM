import type { APIRoute } from "astro";
import { requireUser } from "../../../lib/http";
import { addMessage, getTicketById } from "../../../lib/tickets";
import { getClientByUserId } from "../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = requireUser(context);
  if (guard instanceof Response) return guard;
  const user = guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const ticketId = String(form.get("ticketId") ?? "");
  const body = String(form.get("body") ?? "").trim();

  const backTo = user.role === "admin" ? `/admin/tickets/${ticketId}` : `/dashboard/tickets/${ticketId}`;

  if (!ticketId || !body) {
    return redirect(backTo);
  }

  const ticket = await getTicketById(locals, ticketId);
  if (!ticket) {
    return redirect(user.role === "admin" ? "/admin/tickets" : "/dashboard/tickets");
  }

  // Impersonation is view-only — never let a reply post while an admin is wearing a client's identity.
  if (locals.impersonatedClient) {
    return redirect(backTo);
  }

  if (user.role === "client") {
    const client = await getClientByUserId(locals, user.id);
    if (!client || client.id !== ticket.clientId) {
      return redirect("/dashboard/tickets");
    }
  }

  await addMessage(locals, { ticketId, authorUserId: user.id, body });
  return redirect(backTo);
};
