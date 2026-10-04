import type { APIRoute } from "astro";
import { readForm } from "../../../../lib/request-body";
import { ensureRole } from "../../../../lib/http";
import { setImpersonation } from "../../../../lib/auth";
import { getClientById } from "../../../../lib/clients";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const clientId = String(form.get("clientId") ?? "");

  const client = clientId ? await getClientById(locals, clientId) : null;
  if (!client || !locals.session) {
    return redirect("/admin/clients");
  }

  await setImpersonation(locals, locals.session.id, client.id);
  return redirect("/dashboard");
};
