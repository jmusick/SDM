import type { APIRoute } from "astro";
import { readForm } from "../../../lib/request-body";
import { requireUser } from "../../../lib/http";
import { verifyUserPassword, updateUserPassword } from "../../../lib/users";
import { passwordError } from "../../../lib/password-policy";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (user instanceof Response) return user;

  const { locals, redirect } = context;
  const form = readForm(context);
  const backTo = String(form.get("backTo") ?? "") === "/dashboard/settings" ? "/dashboard/settings" : "/admin/settings";
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  const policyError = passwordError(newPassword);
  if (policyError) return redirect(`${backTo}?error=${policyError}`);
  if (newPassword.normalize("NFC") !== confirmPassword.normalize("NFC")) {
    return redirect(`${backTo}?error=password_mismatch`);
  }

  const isCurrentValid = await verifyUserPassword(locals, user.id, currentPassword);
  if (!isCurrentValid) {
    return redirect(`${backTo}?error=wrong_password`);
  }

  await updateUserPassword(locals, user.id, newPassword, locals.session?.id);
  return redirect(`${backTo}?saved=password`);
};
