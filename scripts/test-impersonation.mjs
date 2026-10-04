import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { runtime, ids } from "./test-runtime.mjs";

const app = await runtime();
try {
  const cookie = (await app.login("admin@example.test")).headers.get("set-cookie").split(";")[0];
  assert.equal((await app.post("/api/admin/impersonate/start", { clientId: ids.client }, cookie)).status, 302);
  const allowed = ["/api/auth/logout", "/api/admin/impersonate/stop", "/api/settings/profile", "/api/settings/password"];
  const files = readdirSync("src/pages/api", { recursive: true }).filter((file) => file.endsWith(".ts"));
  let blocked = 0;
  for (const file of files) {
    if (!readFileSync(`src/pages/api/${file}`, "utf8").includes("export const POST")) continue;
    const route = `/api/${file.replaceAll("\\", "/").replace(/\.ts$/, "")}`;
    if (allowed.includes(route)) continue;
    const response = await app.post(route, { clientId: ids.client }, cookie);
    if (response.status !== 403) await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(response.status, 403, `${route}: ${await response.clone().text()}\n${app.output().slice(-7000)}`);
    assert.equal((await response.json()).error, "read_only_impersonation", route);
    blocked++;
  }
  assert.equal(app.query(`SELECT is_active FROM users WHERE id='${ids.user}'`)[0].is_active, 1);
  const adminPage = await fetch(`${app.origin}/admin/clients/${ids.client}`, { headers: { cookie }, redirect: "manual" });
  assert.equal(adminPage.headers.get("location"), "/dashboard", "hide business forms");
  const settings = await fetch(`${app.origin}/admin/settings`, { headers: { cookie } });
  assert.ok((await settings.text()).includes("your own administrator account"));
  const saved = await app.post("/api/settings/profile", { email: "admin@example.test", firstName: "Own account" }, cookie);
  assert.equal(saved.status, 302);
  assert.equal(app.query(`SELECT first_name FROM users WHERE id='${ids.admin}'`)[0].first_name, "Own account");
  assert.equal((await app.post("/api/admin/impersonate/stop", {}, cookie)).status, 302);
  assert.equal((await app.post("/api/clients/set-active", { clientId: ids.client, isActive: "0" }, cookie)).status, 302);
  assert.equal(app.query(`SELECT is_active FROM users WHERE id='${ids.user}'`)[0].is_active, 0);
  await app.post("/api/admin/impersonate/start", { clientId: ids.client }, cookie);
  assert.equal((await app.post("/api/auth/logout", {}, cookie)).status, 302);
  console.log(`PASS: ${blocked} mutation routes blocked, forms hidden, own-account exception, exit and logout`);
} finally { app.close(); }
