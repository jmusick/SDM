import type { APIRoute } from "astro";
import { ensureClientContext } from "../../../lib/http";
import { createTicket, type TicketPriority } from "../../../lib/tickets";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const clientResult = await ensureClientContext(context);
  if (clientResult instanceof Response) return clientResult;
  const client = clientResult;

  const { request, locals, redirect } = context;

  // Impersonation is view-only — an admin viewing as a client cannot open tickets on their behalf.
  if (locals.impersonatedClient) {
    return redirect("/dashboard/tickets");
  }

  const form = await request.formData();
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const priority = String(form.get("priority") ?? "normal") as TicketPriority;

  if (!subject || !body) {
    return redirect("/dashboard/tickets/new?error=invalid");
  }

  const user = locals.user!;
  const ticketId = await createTicket(locals, { clientId: client.id, authorUserId: user.id, subject, body, priority });
  return redirect(`/dashboard/tickets/${ticketId}`);
};
