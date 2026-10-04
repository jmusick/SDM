import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { getClientById, setClientActive } from "../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const clientId = String(form.get("clientId") ?? "");
  const isActive = String(form.get("isActive") ?? "") === "1";

  const client = clientId ? await getClientById(locals, clientId) : null;
  if (!client) {
    return redirect("/admin/clients");
  }

  await setClientActive(locals, client.userId, isActive);
  return redirect(`/admin/clients/${client.id}`);
};
