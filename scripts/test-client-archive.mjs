import assert from "node:assert/strict";
import { runtime, ids } from "./test-runtime.mjs";

const app = await runtime();
try {
  const adminCookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  const clientCookie = (await app.login("client@example.test")).headers.get("set-cookie").split(";")[0];
  await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "0" }, adminCookie);
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM sessions WHERE user_id='${ids.user}'`)[0].count, 0);
  assert.equal((await app.login("client@example.test")).headers.get("location"), "/login?error=invalid");
  await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "1" }, adminCookie);
  const old = await fetch(`${app.origin}/dashboard`, { headers: { cookie: clientCookie }, redirect: "manual" });
  assert.equal(old.headers.get("location"), "/login", "reactivation cannot revive old token");
  assert.equal((await app.login("client@example.test")).headers.get("location"), "/dashboard");
  const reset = await app.post("/api/clients/reset-password", { clientId: ids.client }, adminCookie);
  const flashId = new URL(reset.headers.get("location"), app.origin).searchParams.get("pwflash");
  const temporary = app.query(`SELECT temp_password FROM password_flash WHERE id='${flashId}'`)[0].temp_password;
  await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "0" }, adminCookie);
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM password_flash WHERE user_id='${ids.user}'`)[0].count, 0);
  await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "1" }, adminCookie);
  assert.equal((await app.login("client@example.test", temporary)).headers.get("location"), "/login?error=invalid");
  assert.equal(app.query(`SELECT COUNT(*) AS count FROM clients WHERE id='${ids.client}'`)[0].count, 1);
  assert.equal((await app.post("/api/clients/reset-password", { clientId: ids.client }, adminCookie)).status, 302);
  console.log("PASS: archive revocation, reactivation needs login, temp credential invalidation, business profile preserved");
} finally { app.close(); }
