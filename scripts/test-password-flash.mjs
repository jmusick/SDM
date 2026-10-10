import assert from "node:assert/strict";
import { runtime, ids, password } from "./test-runtime.mjs";

const app = await runtime();
try {
  const cookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  const issue = async () => {
    const response = await app.post("/api/clients/reset-password", { clientId: ids.client }, cookie);
    assert.equal(response.status, 302);
    const id = new URL(response.headers.get("location"), app.origin).searchParams.get("pwflash");
    const row = app.query(`SELECT temp_password FROM password_flash WHERE id='${id}'`)[0];
    assert.ok(row);
    return { id, password: row.temp_password };
  };
  const reveal = async (flash, client = ids.client) => {
    const response = await fetch(`${app.origin}/admin/clients/${client}?pwflash=${flash.id}`, {
      headers: { cookie }, redirect: "manual",
    });
    assert.equal(response.status, 200);
    return response.text();
  };
  const created = await app.post("/api/clients/save", {
    email: "other@example.test", companyName: "Other synthetic client",
  }, cookie);
  assert.equal(created.status, 302);
  const createdUrl = new URL(created.headers.get("location"), app.origin);
  const otherClient = createdUrl.pathname.split("/").at(-1);
  const otherFlashId = createdUrl.searchParams.get("pwflash");
  const otherFlash = app.query(`SELECT temp_password FROM password_flash WHERE id='${otherFlashId}'`)[0];
  assert.ok(otherFlash);

  const first = await issue();
  assert.ok(!(await reveal(first, otherClient)).includes(first.password));
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE id='${first.id}'`)[0].count, 1);
  // Concurrent authenticated requests exercise the actual built Worker and local D1.
  const readers = await Promise.all(Array.from({ length: 8 }, () => reveal(first)));
  assert.equal(readers.filter(html => html.includes(first.password)).length, 1);
  assert.ok(!(await reveal(first)).includes(first.password));

  const expired = await issue();
  app.sql(`UPDATE password_flash SET expires_at=1 WHERE id='${expired.id}'`);
  assert.ok(!(await reveal(expired)).includes(expired.password));
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE id='${expired.id}'`)[0].count, 0);

  const stale = await issue();
  const replacement = await issue();
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE user_id='${ids.user}'`)[0].count, 1);
  assert.ok(!(await reveal(stale)).includes(stale.password));
  const login = await app.login("client@example.test", replacement.password);
  const changed = await app.post("/api/settings/password", {
    currentPassword: replacement.password, newPassword: password, confirmPassword: password, backTo: "/dashboard/settings",
  }, login.headers.get("set-cookie").split(";")[0]);
  assert.equal(changed.headers.get("location"), "/dashboard/settings?saved=password");
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE user_id='${ids.user}'`)[0].count, 0);
  assert.ok(!(await reveal(replacement)).includes(replacement.password));
  // Rotating one client's password must leave another client's pending reveal alone.
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE id='${otherFlashId}'`)[0].count, 1);
  assert.ok((await reveal({ id: otherFlashId }, otherClient)).includes(otherFlash.temp_password));
  console.log("PASS: exactly one concurrent reveal, client binding, expiry, reset reissue and self-service invalidation");
} finally { app.close(); }
