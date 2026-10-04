import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { getClientById, resetClientPassword } from "../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const clientId = String(form.get("clientId") ?? "");

  const client = clientId ? await getClientById(locals, clientId) : null;
  if (!client) {
    return redirect("/admin/clients");
  }

  const flashId = await resetClientPassword(locals, client.userId);
  return redirect(`/admin/clients/${client.id}?pwflash=${flashId}`);
};
