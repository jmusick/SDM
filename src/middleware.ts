import { defineMiddleware } from "astro:middleware";
import { env as workerEnv } from "cloudflare:workers";
import { getSessionAndUserByToken } from "./lib/auth";
import { getClientById } from "./lib/clients";

const SESSION_COOKIE = "sdm_session";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;
  context.locals.impersonatedClient = null;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token && ((workerEnv as unknown) as { DB?: unknown }).DB) {
    try {
      const { session, user } = await getSessionAndUserByToken(context.locals, token);
      context.locals.session = session;
      context.locals.user = user;

      if (user?.role === "admin" && session?.impersonatingClientId) {
        context.locals.impersonatedClient = await getClientById(context.locals, session.impersonatingClientId);
      }
    } catch {
      context.cookies.delete(SESSION_COOKIE, { path: "/" });
    }
  }

  // A client with a temporary password (admin-created account, or admin-reset
  // password) must set a real one before using the portal. Pin them to the
  // settings page — and the password + logout endpoints — until they do.
  const user = context.locals.user;
  if (user?.mustChangePassword) {
    const path = context.url.pathname;
    const allowed =
      path === "/dashboard/settings" ||
      path === "/admin/settings" ||
      path === "/api/settings/password" ||
      path === "/api/auth/logout";
    const guarded = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/");
    if (guarded && !allowed) {
      const target = user.role === "admin" ? "/admin/settings" : "/dashboard/settings";
      return context.redirect(`${target}?mustchange=1`);
    }
  }

  return next();
});

export { SESSION_COOKIE };
