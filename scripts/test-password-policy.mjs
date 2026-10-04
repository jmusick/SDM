import assert from "node:assert/strict";
import { runtime, ids, password } from "./test-runtime.mjs";

const app = await runtime();
const composed = "é" + "🦉".repeat(14);
const decomposed = "e\u0301" + "🦉".repeat(14);
try {
  const cookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  const change = (next, confirm = next) => app.post("/api/settings/password", {
    currentPassword: password, newPassword: next, confirmPassword: confirm,
  }, cookie);
  assert.equal((await change("🦉".repeat(14))).headers.get("location"), "/admin/settings?error=password_too_short",
    "length counts code points, not UTF-16 units");
  assert.equal((await change("123456789123456789")).headers.get("location"), "/admin/settings?error=password_common");
  assert.equal((await change("StoneDragonMedia")).headers.get("location"), "/admin/settings?error=password_common");
  assert.ok(app.query(`SELECT password_hash FROM users WHERE id='${ids.admin}'`)[0].password_hash.startsWith("pbkdf2$"),
    "rejections leave legacy credential intact");
  assert.equal((await change(composed, decomposed)).headers.get("location"), "/admin/settings?saved=password");
  assert.ok(app.query(`SELECT password_hash FROM users WHERE id='${ids.admin}'`)[0].password_hash.startsWith("pbkdf2-nfc$"));
  assert.equal((await app.login("admin@example.test", decomposed)).headers.get("location"), "/admin");
  assert.equal((await app.login("client@example.test")).headers.get("location"), "/dashboard", "legacy hash still works");
  const page = await (await fetch(`${app.origin}/admin/settings`, { headers: { cookie } })).text();
  assert.ok(page.includes('aria-describedby="password-policy"'));
  assert.ok(page.includes("15–1,024"));
  console.log("PASS: shared password policy, common/context passwords, Unicode length/NFC confirmation and login, legacy hashes, accessible hints");
} finally { app.close(); }

const operatorSecret = "synthetic-operator-secret-for-local-tests";
const setup = await runtime({ vars: { ADMIN_SETUP_ENABLED: "true", ADMIN_SETUP_SECRET: operatorSecret,
  ADMIN_SETUP_EXPIRES_AT: new Date(Date.now() + 15 * 60 * 1000).toISOString() } });
try {
  setup.sql("DELETE FROM users");
  const create = (next) => setup.post("/api/setup/create-admin", { operatorSecret, email: "owner@example.test", password: next });
  assert.equal((await create("🦉".repeat(14))).headers.get("location"), "/admin/setup?error=password_too_short");
  assert.equal((await create("123456789123456789")).headers.get("location"), "/admin/setup?error=password_common");
  assert.equal(setup.query("SELECT COUNT(*) AS count FROM users")[0].count, 0);
  assert.equal((await create("🦉".repeat(1024))).headers.get("location"), "/admin", "long Unicode passphrase works at upper bound");
  assert.equal((await setup.login("owner@example.test", "🦉".repeat(1024))).headers.get("location"), "/admin");
  console.log("PASS: setup uses the same policy and supports 1,024 Unicode code points");
} finally { setup.close(); }
