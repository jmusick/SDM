import assert from "node:assert/strict";
import { runtime } from "./test-runtime.mjs";
const app = await runtime();
try {
  const check = async (body, expected, contentType = "application/x-www-form-urlencoded") => {
    const response = await fetch(`${app.origin}/api/auth/login`, {
      method: "POST", headers: { origin: app.origin, "content-type": contentType }, body,
      duplex: "half", redirect: "manual",
    });
    if (response.status !== expected) await new Promise((r) => setTimeout(r, 200));
    assert.equal(response.status, expected, `${await response.clone().text()}\n${app.output().slice(-2500)}`);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.ok(response.headers.get("content-security-policy"));
    await response.arrayBuffer();
  };
  const streamed = new ReadableStream({ start(controller) {
    for (let i = 0; i < 70; i++) controller.enqueue(new TextEncoder().encode("x".repeat(1024)));
    controller.close();
  } });
  await check(new URLSearchParams({ email: "admin@example.test", password: "x".repeat(1025) }), 400);
  await check("email=a&email=b&password=c", 400);
  await check(new URLSearchParams(Array.from({ length: 33 }, (_, i) => [`field${i}`, "x"])), 400);
  await check("{", 415, "application/json");
  const file = '--sdm-test\r\nContent-Disposition: form-data; name="password"; filename="password.txt"\r\nContent-Type: text/plain\r\n\r\ntest\r\n--sdm-test--\r\n';
  const response = await fetch(`${app.origin}/api/auth/login`, { method: "POST", headers: { origin: app.origin, "content-type": "multipart/form-data; boundary=sdm-test" }, body: file });
  assert.equal(response.status, 415, await response.clone().text());
  const legitimate = await app.login("unknown@example.test", "🔐".repeat(1024));
  assert.equal(legitimate.status, 302, "long Unicode password remains within bounds");
  assert.equal(legitimate.headers.get("location"), "/login?error=invalid");
  assert.equal(app.query("SELECT COUNT(*) AS count FROM sessions")[0].count, 0);
  await check(streamed, 413); // No Content-Length; count actual bytes.
  // Keep this last: Workers SDK #15709 can break a subsequent dev-proxy request
  // after rejecting a streamed body. This test does not establish hosted behavior.
  console.log("PASS: streamed byte cap, password/field bounds, duplicate fields, files, media types and long Unicode input");
} finally { app.close(); }
