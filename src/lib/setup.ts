import { env as workerEnv } from "cloudflare:workers";

/**
 * `/admin/setup` (and `/api/setup/create-admin`) bootstrap the first admin.
 * Gating them on "zero users exist" alone is unsafe: per AGENTS.md the D1
 * binding is defined in wrangler.toml and a deploy can land on an empty
 * or freshly-rebound database, which would briefly reopen public admin
 * creation. So they also require an explicit opt-in env var — normally unset,
 * flipped to "true" in the dashboard only for a deliberate (re-)bootstrap.
 */
export function isSetupEnabled(): boolean {
  const config = workerEnv as unknown as { ADMIN_SETUP_ENABLED?: string; ADMIN_SETUP_SECRET?: string; ADMIN_SETUP_EXPIRES_AT?: string };
  const expiresAt = Date.parse(config.ADMIN_SETUP_EXPIRES_AT ?? "");
  const remaining = expiresAt - Date.now();
  return config.ADMIN_SETUP_ENABLED === "true" && typeof config.ADMIN_SETUP_SECRET === "string" &&
    config.ADMIN_SETUP_SECRET.length >= 32 && remaining > 0 && remaining <= 15 * 60 * 1000;
}

/** The operator provisions this secret separately; it is never rendered or logged. */
export async function verifySetupSecret(candidate: string): Promise<boolean> {
  const configured = (workerEnv as unknown as { ADMIN_SETUP_SECRET?: string }).ADMIN_SETUP_SECRET;
  if (!isSetupEnabled() || !configured || candidate.length > 512) return false;
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [actual, expected] = await Promise.all([digest(candidate), digest(configured)]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}
