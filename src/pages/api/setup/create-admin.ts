import type { APIRoute } from "astro";
import { createSession, hashPassword } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { getUserCount } from "../../../lib/users";
import { isSetupEnabled, verifySetupSecret } from "../../../lib/setup";
import { assertSameOrigin } from "../../../lib/http";
import { SESSION_COOKIE } from "../../../middleware";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, locals, cookies, url, redirect } = context;

  const csrf = assertSameOrigin(context);
  if (csrf) return csrf;

  if (!isSetupEnabled()) {
    return redirect("/login");
  }

  const existingCount = await getUserCount(locals);
  if (existingCount > 0) {
    return redirect("/login");
  }

  const form = await request.formData();
  if (!(await verifySetupSecret(String(form.get("operatorSecret") ?? "")))) {
    return new Response("Setup authorization failed.", { status: 403 });
  }
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || password.length < 10) {
    return redirect("/admin/setup?error=invalid");
  }

  const db = ensureDB(locals);
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  if (!isSetupEnabled()) return redirect("/login");

  const created = await db
    .prepare(`INSERT INTO users (id, email, password_hash, role, is_active, created_at)
      SELECT ?, ?, ?, 'admin', 1, ? WHERE NOT EXISTS (SELECT 1 FROM users)
      RETURNING id`)
    .bind(userId, email, passwordHash, Date.now())
    .first<{ id: string }>();
  if (!created) return redirect("/login");

  const session = await createSession(locals, userId);
  if (!session) return redirect("/login");
  cookies.set(SESSION_COOKIE, session.token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    expires: new Date(session.expiresAt),
  });

  return redirect("/admin");
};
