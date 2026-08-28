import { env as workerEnv } from "cloudflare:workers";

/**
 * `/admin/setup` (and `/api/setup/create-admin`) bootstrap the first admin.
 * Gating them on "zero users exist" alone is unsafe: per AGENTS.md the D1
 * binding lives in the Cloudflare dashboard and a deploy can land on an empty
 * or freshly-rebound database, which would briefly reopen public admin
 * creation. So they also require an explicit opt-in env var — normally unset,
 * flipped to "true" in the dashboard only for a deliberate (re-)bootstrap.
 */
export function isSetupEnabled(): boolean {
  const value = ((workerEnv as unknown) as { ADMIN_SETUP_ENABLED?: string }).ADMIN_SETUP_ENABLED;
  return value === "true";
}
