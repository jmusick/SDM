import type { APIRoute } from "astro";
import { requireUser } from "../../../lib/http";
import { updateUserProfile } from "../../../lib/users";

export const prerender = false;

/**
 * Always updates the logged-in user's own account (context.locals.user.id) —
 * never a userId taken from form input. This is self-service account
 * settings, not an admin-on-behalf-of edit.
 */
export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (user instanceof Response) return user;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const backTo = String(form.get("backTo") ?? "") === "/dashboard/settings" ? "/dashboard/settings" : "/admin/settings";
  const firstName = String(form.get("firstName") ?? "");
  const lastName = String(form.get("lastName") ?? "");
  const email = String(form.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return redirect(`${backTo}?error=invalid_email`);
  }

  const result = await updateUserProfile(locals, user.id, { firstName, lastName, email });
  if (!result.ok) {
    return redirect(`${backTo}?error=${result.error}`);
  }

  return redirect(`${backTo}?saved=1`);
};
