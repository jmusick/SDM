import assert from "node:assert/strict";
import { runtime, ids } from "./test-runtime.mjs";

const app = await runtime();
try {
  const account = () => app.query(`SELECT failed_attempts,locked_until FROM users WHERE id='${ids.admin}'`)[0];
  await Promise.all(Array.from({ length: 12 }, () => app.login("admin@example.test", "wrong-password")));
  const locked = account();
  assert.ok(locked.failed_attempts >= 8 && locked.failed_attempts <= 12);
  assert.ok(locked.locked_until > Date.now());
  assert.equal((await app.login("admin@example.test")).headers.get("location"), "/login?error=locked");
  await app.login("admin@example.test", "wrong-password");
  assert.deepEqual(account(), locked, "blocked requests must not extend a lock");
  app.sql(`UPDATE users SET locked_until=1 WHERE id='${ids.admin}'; DELETE FROM auth_rate_limits;`);
  await app.login("admin@example.test", "wrong-password");
  assert.deepEqual(account(), { failed_attempts: 1, locked_until: null });
  await Promise.all(Array.from({ length: 6 }, () => app.login("admin@example.test", "wrong-password")));
  assert.equal(account().failed_attempts, 7, "concurrent failures must not lose increments");
  assert.equal(account().locked_until, null);
  await app.login("admin@example.test", "wrong-password");
  assert.ok(account().locked_until > Date.now(), "eighth failure locks the account");
  app.sql(`UPDATE users SET locked_until=1 WHERE id='${ids.admin}'; DELETE FROM auth_rate_limits;`);
  const success = await app.login("admin@example.test");
  assert.equal(success.headers.get("location"), "/admin");
  assert.ok(success.headers.get("set-cookie")?.includes("sdm_session="));
  assert.deepEqual(account(), { failed_attempts: 0, locked_until: null });
  console.log("PASS: concurrent increments, threshold, fixed expiry, expiry reset and successful login");
} finally { app.close(); }
