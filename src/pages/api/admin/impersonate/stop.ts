import type { APIRoute } from "astro";
import { ensureRole } from "../../../../lib/http";
import { setImpersonation } from "../../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const guard = ensureRole(context, ["admin"]);
  if (guard instanceof Response) return guard;

  const { locals, redirect } = context;
  if (locals.session) {
    await setImpersonation(locals, locals.session.id, null);
  }
  return redirect("/admin/clients");
};
