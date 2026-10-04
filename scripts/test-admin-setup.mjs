import assert from "node:assert/strict";
import { runtime, password } from "./test-runtime.mjs";
// Public synthetic fixture, never a deployment credential.
const operatorSecret = "synthetic-operator-secret-for-local-tests";
const app = await runtime({ vars: { ADMIN_SETUP_ENABLED: "true", ADMIN_SETUP_SECRET: operatorSecret,
  ADMIN_SETUP_EXPIRES_AT: new Date(Date.now() + 15 * 60 * 1000).toISOString() } });
try {
  app.sql("DELETE FROM users");
  const form = { email: "owner@example.test", password };
  assert.equal((await app.post("/api/setup/create-admin", form)).status, 403);
  assert.equal(app.query("SELECT COUNT(*) AS count FROM users")[0].count, 0);
  const page = await fetch(`${app.origin}/admin/setup`);
  assert.equal(page.status, 200);
  assert.ok(!(await page.text()).includes(operatorSecret), "secret never rendered");
  const attempts = await Promise.all(Array.from({ length: 8 }, (_, index) => app.post("/api/setup/create-admin", {
    ...form, email: `owner${index}@example.test`, operatorSecret,
  })));
  assert.equal(app.query("SELECT COUNT(*) AS count FROM users")[0].count, 1);
  assert.equal(attempts.filter((r) => r.headers.get("location") === "/admin").length, 1);
  assert.equal((await app.post("/api/setup/create-admin", { ...form, operatorSecret })).headers.get("location"), "/login");
  console.log("PASS: setup needs operator secret, concurrent creation admits exactly one, setup closes afterward");
} finally { app.close(); }
const disabled = await runtime({ vars: { ADMIN_SETUP_ENABLED: "true" } });
try {
  disabled.sql("DELETE FROM users");
  assert.equal((await disabled.post("/api/setup/create-admin", { email: "owner@example.test", password })).headers.get("location"), "/login");
  console.log("PASS: flag without a provisioned secret keeps setup disabled");
} finally { disabled.close(); }
const expired = await runtime({ vars: { ADMIN_SETUP_ENABLED: "true", ADMIN_SETUP_SECRET: operatorSecret,
  ADMIN_SETUP_EXPIRES_AT: new Date(1).toISOString() } });
try {
  expired.sql("DELETE FROM users");
  assert.equal((await expired.post("/api/setup/create-admin", { email: "owner@example.test", password, operatorSecret })).headers.get("location"), "/login");
  console.log("PASS: expired operator authorization keeps setup disabled");
} finally { expired.close(); }
