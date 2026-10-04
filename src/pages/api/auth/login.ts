import type { APIRoute } from "astro";
import { createSession, verifyPassword, verifyPasswordDummy } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { getLoginLockout, recordFailedLogin, resetLoginLockout } from "../../../lib/users";
import { assertSameOrigin } from "../../../lib/http";
import { SESSION_COOKIE } from "../../../middleware";

export const prerender = false;

/**
 * Failed sign-ins are written to Workers Logs (enabled via `[observability]` in
 * wrangler.toml) as one JSON line each, so they're searchable in the dashboard
 * under Workers → sdm → Logs — filter on `event = "login_failed"`. The D1
 * counter only drives the lockout; this is the record of who tried what.
 * Never log the password.
 */
function logFailedLogin(
  request: Request,
  email: string,
  reason: "unknown_or_inactive" | "bad_password" | "locked",
  extra: Record<string, unknown> = {}
) {
  console.warn(
    JSON.stringify({
      event: "login_failed",
      reason,
      email,
      ip: request.headers.get("CF-Connecting-IP"),
      country: request.headers.get("CF-IPCountry"),
      userAgent: request.headers.get("User-Agent"),
      ...extra,
    })
  );
}

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
    .prepare("SELECT id, password_hash, role, is_active, must_change_password, temporary_password_expires_at FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; password_hash: string; role: UserRole; is_active: number; must_change_password: number; temporary_password_expires_at: number | null }>();

  if (!user || user.is_active === 0 || (user.must_change_password === 1 &&
      (user.temporary_password_expires_at === null || user.temporary_password_expires_at <= Date.now()))) {
    // Burn the same PBKDF2 time as a real verify so login latency doesn't
    // reveal whether the email belongs to an account.
    await verifyPasswordDummy(password);
    logFailedLogin(request, email, "unknown_or_inactive");
    return redirect("/login?error=invalid");
  }

  const lockedUntil = await getLoginLockout(locals, user.id);
  if (lockedUntil) {
    logFailedLogin(request, email, "locked", { lockedUntil: new Date(lockedUntil).toISOString() });
    return redirect("/login?error=locked");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    const { attempts, lockedUntil: nowLockedUntil } = await recordFailedLogin(locals, user.id);
    logFailedLogin(request, email, "bad_password", {
      attempts,
      lockedUntil: nowLockedUntil ? new Date(nowLockedUntil).toISOString() : null,
    });
    return redirect("/login?error=invalid");
  }

  if (!(await resetLoginLockout(locals, user.id))) {
    logFailedLogin(request, email, "locked");
    return redirect("/login?error=locked");
  }

  const session = await createSession(locals, user.id);
  if (!session) return redirect("/login?error=invalid");
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
