import type { APIContext } from "astro";
import { getClientByUserId } from "./clients";

/**
 * These guards return a redirect Response on failure rather than throwing one.
 * Astro's page frontmatter only short-circuits rendering via `return <Response>`
 * (the documented `Astro.redirect()` pattern) — a thrown Response is not caught
 * by the renderer and surfaces as an unhandled 500 instead. Every call site must
 * check `if (result instanceof Response) return result;` before using the value.
 */

function forbidden(): Response {
  return new Response("Cross-origin request blocked.", { status: 403 });
}

/**
 * CSRF backstop. `SameSite=Lax` on the session cookie already stops the
 * cross-site POST, but it's a lone control — a future route that sets the
 * cookie differently would break the guarantee silently. This re-checks the
 * `Origin` header (falling back to `Referer`) on every state-changing request.
 * GET/HEAD are exempt. Returns a 403 `Response` on mismatch, else `null`.
 *
 * Folded into `requireUser` (and thus `ensureRole`/`ensureClientContext`), so
 * every guarded route gets it; the unguarded auth/setup routes call it directly.
 */
export function assertSameOrigin(context: APIContext): Response | null {
  const method = context.request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return null;

  const expected = context.url.origin;
  const origin = context.request.headers.get("origin");
  if (origin) {
    return origin === expected ? null : forbidden();
  }

  const referer = context.request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected ? null : forbidden();
    } catch {
      return forbidden();
    }
  }

  // Every current browser sends at least one of the two on a form POST
  // (Referrer-Policy here is strict-origin-when-cross-origin). Neither present
  // means it isn't a request we can vouch for.
  return forbidden();
}

export function requireUser(context: APIContext): UserRecord | Response {
  const csrf = assertSameOrigin(context);
  if (csrf) return csrf;

  const user = context.locals.user;
  if (!user) {
    return context.redirect("/login");
  }
  return user;
}

export function hasRole(user: UserRecord, allowed: UserRole[]): boolean {
  return allowed.includes(user.role);
}

export function ensureRole(context: APIContext, allowed: UserRole[]): UserRecord | Response {
  const user = requireUser(context);
  if (user instanceof Response) return user;
  if (!hasRole(user, allowed)) {
    return context.redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }
  return user;
}

/**
 * Resolves the client whose data a /dashboard/* request should render:
 * the logged-in client's own record, or — if an admin is impersonating —
 * the client they're viewing as. Redirects an admin with no active
 * impersonation away, since /dashboard has nothing to show them directly.
 */
export async function ensureClientContext(context: APIContext): Promise<ClientRecord | Response> {
  const user = requireUser(context);
  if (user instanceof Response) return user;

  if (user.role === "admin") {
    const impersonated = context.locals.impersonatedClient;
    if (!impersonated) {
      return context.redirect("/admin/clients");
    }
    return impersonated;
  }

  const client = await getClientByUserId(context.locals, user.id);
  if (!client) {
    return context.redirect("/login");
  }
  return client;
}
