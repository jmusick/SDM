import type { APIRoute } from "astro";
import { createSession, verifyPassword, verifyPasswordDummy } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { getLoginLockout, recordFailedLogin, resetLoginLockout } from "../../../lib/users";
import { assertSameOrigin } from "../../../lib/http";
import { SESSION_COOKIE } from "../../../middleware";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, locals, cookies, url, redirect } = context;

  const csrf = assertSameOrigin(context);
  if (csrf) return csrf;

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return redirect("/login?error=invalid");
  }

  const db = ensureDB(locals);
  const user = await db
    .prepare("SELECT id, password_hash, role, is_active, must_change_password FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; password_hash: string; role: UserRole; is_active: number; must_change_password: number }>();

  if (!user || user.is_active === 0) {
    // Burn the same PBKDF2 time as a real verify so login latency doesn't
    // reveal whether the email belongs to an account.
    await verifyPasswordDummy(password);
    return redirect("/login?error=invalid");
  }

  const lockedUntil = await getLoginLockout(locals, user.id);
  if (lockedUntil) {
    return redirect("/login?error=locked");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await recordFailedLogin(locals, user.id);
    return redirect("/login?error=invalid");
  }

  await resetLoginLockout(locals, user.id);

  const session = await createSession(locals, user.id);
  cookies.set(SESSION_COOKIE, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    expires: new Date(session.expiresAt),
  });

  if (user.must_change_password === 1) {
    return redirect(user.role === "admin" ? "/admin/settings?mustchange=1" : "/dashboard/settings?mustchange=1");
  }

  return redirect(user.role === "admin" ? "/admin" : "/dashboard");
};
