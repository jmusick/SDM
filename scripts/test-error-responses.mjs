import assert from "node:assert/strict";
import { runtime, ids } from "./test-runtime.mjs";

const app = await runtime();
try {
  const cookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  const safeHeaders = (response) => {
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.ok(response.headers.get("content-security-policy"));
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  };
  for (const body of ["null", "[]", "true", '"text"', "{", '{"taskId":{},"lane":"qa"}']) {
    const response = await fetch(`${app.origin}/api/tasks/update-lane`, {
      method: "POST", headers: { cookie, origin: app.origin, "content-type": "application/json" }, body,
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("content-type"), "application/json");
    safeHeaders(response);
    assert.equal((await response.json()).ok, false);
  }
  const unsupported = await app.post("/api/tasks/update-lane", {}, cookie);
  assert.equal(unsupported.status, 415);
  safeHeaders(unsupported);
  // Synthetic CHECK failure exercises real D1 exception handling, no private data.
  const failure = await app.post("/api/projects/save", { name: "Failure fixture", status: "invalid" }, cookie);
  assert.equal(failure.status, 500);
  assert.deepEqual(await failure.json(), { ok: false, error: "service_unavailable" });
  safeHeaders(failure);
  assert.equal(app.query("SELECT COUNT(*) AS count FROM projects")[0].count, 0);
  // Breaking session resolution must not leave a partially authenticated admin.
  app.sql("DROP TABLE sessions");
  const denied = await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "0" }, cookie);
  assert.equal(denied.status, 503);
  safeHeaders(denied);
  assert.equal(app.query(`SELECT is_active FROM users WHERE id='${ids.user}'`)[0].is_active, 1);
  console.log("PASS: JSON shapes/types, media types, D1 failures, fail-closed session resolution and private security headers");
} finally { app.close(); }

const unbound = await runtime({ noDb: true });
try {
  const failure = await unbound.login("admin@example.test");
  assert.equal(failure.status, 500);
  assert.equal(failure.headers.get("cache-control"), "private, no-store");
  assert.ok(failure.headers.get("content-security-policy"));
  assert.deepEqual(await failure.json(), { ok: false, error: "service_unavailable" });
  console.log("PASS: missing D1 binding returns a controlled private error");
} finally { unbound.close(); }
