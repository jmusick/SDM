import assert from "node:assert/strict";
import { runtime, ids, password } from "./test-runtime.mjs";
const app = await runtime();
try {
  const cookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  const issue = async () => {
    const response = await app.post("/api/clients/reset-password", { clientId: ids.client }, cookie);
    const id = new URL(response.headers.get("location"), app.origin).searchParams.get("pwflash");
    return app.query(`SELECT temp_password FROM password_flash WHERE id='${id}'`)[0].temp_password;
  };
  const first = await issue();
  assert.match(first, /^[A-Za-z0-9_-]{24}$/);
  const login = await app.login("client@example.test", first);
  assert.equal(login.headers.get("location"), "/dashboard/settings?mustchange=1");
  const clientCookie = login.headers.get("set-cookie").split(";")[0];
  app.sql(`UPDATE users SET temporary_password_expires_at=1 WHERE id='${ids.user}'`);
  assert.equal((await app.login("client@example.test", first)).headers.get("location"), "/login?error=invalid");
  const second = await issue();
  assert.notEqual(first, second);
  assert.equal((await app.login("client@example.test", first)).headers.get("location"), "/login?error=invalid");
  const secondLogin = await app.login("client@example.test", second);
  assert.equal(secondLogin.headers.get("location"), "/dashboard/settings?mustchange=1");
  const changed = await app.post("/api/settings/password", {
    currentPassword: second, newPassword: password, confirmPassword: password, backTo: "/dashboard/settings",
  }, secondLogin.headers.get("set-cookie").split(";")[0]);
  assert.equal(changed.headers.get("location"), "/dashboard/settings?saved=password");
  assert.equal(app.query(`SELECT temporary_password_expires_at FROM users WHERE id='${ids.user}'`)[0].temporary_password_expires_at, null);
  assert.equal((await app.login("client@example.test")).headers.get("location"), "/dashboard");
  const oldSession = await fetch(`${app.origin}/dashboard`, { headers: { cookie: clientCookie }, redirect: "manual" });
  assert.equal(oldSession.headers.get("location"), "/login");
  console.log("PASS: fixed 144-bit temp credentials, deadline, reissuance, password-change clearing and old-session rejection");
} finally { app.close(); }
