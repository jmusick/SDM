import type { APIRoute } from "astro";
import { ensureRole } from "../../../lib/http";
import { getClientById, resetClientPassword } from "../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const clientId = String(form.get("clientId") ?? "");

  const client = clientId ? await getClientById(locals, clientId) : null;
  if (!client) {
    return redirect("/admin/clients");
  }

  const temporaryPassword = await resetClientPassword(locals, client.userId);
  return redirect(`/admin/clients/${client.id}?tempPassword=${encodeURIComponent(temporaryPassword)}`);
};
