import type { APIContext } from "astro";
import { getClientByUserId } from "./clients";

/**
 * These guards return a redirect Response on failure rather than throwing one.
 * Astro's page frontmatter only short-circuits rendering via `return <Response>`
 * (the documented `Astro.redirect()` pattern) — a thrown Response is not caught
 * by the renderer and surfaces as an unhandled 500 instead. Every call site must
 * check `if (result instanceof Response) return result;` before using the value.
 */

export function requireUser(context: APIContext): UserRecord | Response {
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
