import assert from "node:assert/strict";
import { runtime, ids } from "./test-runtime.mjs";
const app = await runtime();
try {
  const attempts = await Promise.all(Array.from({ length: 24 }, () => app.login("unknown@example.test", "wrong")));
  assert.equal(attempts.filter((r) => r.status === 429).length, 8, "unknown identity limited atomically");
  for (const response of attempts.filter((r) => r.status === 429)) {
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.ok(Number(response.headers.get("retry-after")) > 0);
  }
  app.sql("DELETE FROM auth_rate_limits");
  const sources = await Promise.all(Array.from({ length: 48 }, (_, index) => app.login(`unknown${index}@example.test`, "wrong")));
  assert.equal(sources.filter((r) => r.status === 429).length, 8, "source limit spans different identities");
  app.sql("UPDATE auth_rate_limits SET expires_at=1");
  const login = await app.login("admin@example.test");
  assert.equal(login.headers.get("location"), "/admin", "expired window permits recovery");
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const sensitive = await Promise.all(Array.from({ length: 8 }, () => app.post("/api/settings/password", {
    currentPassword: "wrong", newPassword: "local-new-password-123", confirmPassword: "local-new-password-123",
  }, cookie)));
  assert.equal(sensitive.filter((r) => r.status === 429).length, 3);
  assert.equal((await app.post("/api/clients/reset-password", { clientId: ids.client }, cookie)).status, 429,
    "sensitive routes share the actor budget");
  const keys = app.query("SELECT bucket FROM auth_rate_limits");
  assert.ok(keys.every((row) => /^[a-f0-9]{64}$/.test(row.bucket)));
  console.log("PASS: shared atomic source/account budgets, unknown identities, reauth/reset coverage, expiry recovery and hashed keys");
} finally { app.close(); }
const restarted = await runtime({ reusePersistence: app.persistence });
try {
  const cookie = (await restarted.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  assert.equal((await restarted.post("/api/clients/reset-password", { clientId: ids.client }, cookie)).status, 429);
  console.log("PASS: limiter survives Worker process replacement");
} finally { restarted.close(); }
