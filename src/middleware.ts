import { defineMiddleware } from "astro:middleware";
import { env as workerEnv } from "cloudflare:workers";
import { getSessionAndUserByToken } from "./lib/auth";
import { getClientById } from "./lib/clients";
import { applySecurityHeaders } from "./lib/security-headers";
import { assertSameOrigin } from "./lib/http";

const SESSION_COOKIE = "sdm_session";

// Everything the Worker renders under these prefixes is per-user (or an auth
// flow), so no browser or shared cache may keep it — otherwise Back after
// Log Out, or a shared machine, can resurface portal pages.
const PRIVATE_PREFIXES = ["/admin", "/dashboard", "/api/", "/login"];

function finalize(path: string, response: Response): Response {
  if (PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`))) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return applySecurityHeaders(response);
}

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

  // Enforce view-only mode before any route can parse or mutate business data.
  // Use the session flag even if the selected client no longer resolves.
  const path = context.url.pathname;
  if (context.locals.user?.role === "admin" && context.locals.session?.impersonatingClientId) {
    const safeMethod = ["GET", "HEAD"].includes(context.request.method.toUpperCase());
    const ownAccountOrExit = ["/api/auth/logout", "/api/admin/impersonate/stop",
      "/api/settings/profile", "/api/settings/password"].includes(path);
    if (!safeMethod && !ownAccountOrExit) {
      return finalize(path, assertSameOrigin(context) ?? Response.json(
        { ok: false, error: "read_only_impersonation" }, { status: 403 }
      ));
    }
    // Admin business forms are unavailable until the admin exits view-only mode.
    if (safeMethod && (path === "/admin" || path.startsWith("/admin/")) && path !== "/admin/settings") {
      return finalize(path, context.redirect("/dashboard"));
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
      return finalize(path, context.redirect(`${target}?mustchange=1`));
    }
  }

  return finalize(context.url.pathname, await next());
});

export { SESSION_COOKIE };
