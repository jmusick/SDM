import type { APIContext } from "astro";
import { ensureDB } from "./db";

type Scope = "login" | "reauth" | "setup" | "client_write";
const WINDOW_MS = 15 * 60 * 1000;
const LIMITS: Record<Scope, { source: number; account: number }> = {
  login: { source: 40, account: 16 },
  reauth: { source: 20, account: 5 },
  setup: { source: 10, account: 10 },
  client_write: { source: 40, account: 20 },
};

/** Shared D1 counters, including unknown emails. Never trust X-Forwarded-For. */
export async function limitWork(context: APIContext, scope: Scope, identity: string): Promise<Response | null> {
  const db = ensureDB(context.locals);
  const now = Date.now();
  // Missing edge metadata shares one conservative bucket instead of bypassing limits.
  const source = context.request.headers.get("CF-Connecting-IPv6") ??
    context.request.headers.get("CF-Connecting-IP") ?? "unknown-source";
  const digest = async (value: string) => {
    const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };
  const keys = await Promise.all([digest(`${scope}:source:${source}`), digest(`${scope}:account:${identity}`)]);
  const limits = [LIMITS[scope].source, LIMITS[scope].account];
  const updates = keys.map((key, index) => db.prepare(`
    INSERT INTO auth_rate_limits (bucket, attempts, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      attempts = CASE WHEN expires_at <= ? THEN 1 ELSE MIN(attempts + 1, ?) END,
      expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
    RETURNING attempts, expires_at`).bind(key, now + WINDOW_MS, now, limits[index] + 1, now));
  const results = await db.batch<{ attempts: number; expires_at: number }>([
    db.prepare("DELETE FROM auth_rate_limits WHERE expires_at <= ?").bind(now), ...updates,
  ]);
  let retryAt = 0;
  for (let i = 0; i < limits.length; i++) {
    const row = results[i + 1].results[0];
    if (!row) throw new Error("Rate limit unavailable");
    if (row.attempts > limits[i]) retryAt = Math.max(retryAt, row.expires_at);
  }
  return retryAt ? Response.json({ ok: false, error: "too_many_requests" }, {
    status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((retryAt - now) / 1000))) },
  }) : null;
}
