import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { ensureRole } from "../../../lib/http";
import { deleteClient } from "../../../lib/clients";
import { verifyUserPassword } from "../../../lib/users";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;
  const admin = guard;

  const { locals, redirect } = context;
  const form = readForm(context);
  const clientId = String(form.get("clientId") ?? "");
  const password = String(form.get("adminPassword") ?? "");

  if (!clientId) {
    return redirect("/admin/clients");
  }

  if (!password || !(await verifyUserPassword(locals, admin.id, password))) {
    return redirect(`/admin/clients/${clientId}?error=password`);
  }

  await deleteClient(locals, clientId);
  return redirect("/admin/clients");
};
