import type { APIRoute } from "astro";
import { requireUser } from "../../../lib/http";
import { verifyUserPassword, updateUserPassword } from "../../../lib/users";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (user instanceof Response) return user;

  const { request, locals, redirect } = context;
  const form = await request.formData();
  const backTo = String(form.get("backTo") ?? "") === "/dashboard/settings" ? "/dashboard/settings" : "/admin/settings";
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  if (newPassword.length < 10) {
    return redirect(`${backTo}?error=password_too_short`);
  }
  if (newPassword !== confirmPassword) {
    return redirect(`${backTo}?error=password_mismatch`);
  }

  const isCurrentValid = await verifyUserPassword(locals, user.id, currentPassword);
  if (!isCurrentValid) {
    return redirect(`${backTo}?error=wrong_password`);
  }

  await updateUserPassword(locals, user.id, newPassword);
  return redirect(`${backTo}?saved=password`);
};
