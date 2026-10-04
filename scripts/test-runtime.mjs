// Built Worker tests use disposable local D1 state; never developer or remote data.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
export const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  user: "00000000-0000-4000-8000-000000000002",
  client: "00000000-0000-4000-8000-000000000003",
};
export const password = "local-test-passphrase-123";

export async function runtime({ noDb = false, vars = {} } = {}) {
  const persistence = mkdtempSync(join(tmpdir(), "sdm-test-"));
  const cli = (args) => execFileSync(process.execPath, [wrangler, ...args], {
    encoding: "utf8", env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  });
  cli(["d1", "migrations", "apply", "DB", "--local", "--persist-to", persistence]);
  const salt = randomBytes(16);
  const hash = `pbkdf2$100000$${salt.toString("base64")}$${pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("base64")}`;
  cli(["d1", "execute", "DB", "--local", "--persist-to", persistence, "--command",
    `INSERT INTO users (id,email,password_hash,role,created_at) VALUES
      ('${ids.admin}','admin@example.test','${hash}','admin',0),
      ('${ids.user}','client@example.test','${hash}','client',0);
     INSERT INTO clients (id,user_id,company_name,created_at) VALUES
      ('${ids.client}','${ids.user}','Synthetic client',0);`]);
  const files = readdirSync(join(persistence, "v3", "d1", "miniflare-D1DatabaseObject"));
  const databasePath = join(persistence, "v3", "d1", "miniflare-D1DatabaseObject", files.find((f) => f.endsWith(".sqlite")));
  // Read-only inspection, writes always go through the local D1 API.
  const sql = (statement) => cli(["d1", "execute", "DB", "--local", "--persist-to", persistence, "--command", statement]);
  const query = (statement) => {
    const db = new DatabaseSync(databasePath, { readOnly: true });
    try { return db.prepare(statement).all().map((row) => ({ ...row })); } finally { db.close(); }
  };
  const configArgs = [];
  for (const [key, value] of Object.entries(vars)) configArgs.push("--var", `${key}:${value}`);
  if (noDb) {
    const configPath = join(persistence, "no-db.json");
    writeFileSync(configPath, JSON.stringify({ name: "sdm-no-db-test", main: resolve("dist/server/entry.mjs"),
      no_bundle: true, compatibility_date: "2026-08-13", compatibility_flags: ["nodejs_compat"],
      rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
      assets: { binding: "ASSETS", directory: resolve("dist/client") } }));
    configArgs.push("--config", configPath);
  }
  const child = spawn(process.execPath, [wrangler, "dev", ...configArgs, "--local", "--ip", "127.0.0.1", "--port", "4331",
    "--inspector-port", "0", "--persist-to", persistence, "--show-interactive-dev-session=false"], {
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (data) => { output += data; });
  child.stderr.on("data", (data) => { output += data; });
  const origin = "http://127.0.0.1:4331";
  const close = () => {
    if (process.platform === "win32") {
      try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
    } else child.kill("SIGTERM");
  };
  try {
    const deadline = Date.now() + 30000;
    while (!output.includes(`Ready on ${origin}`)) {
      if (child.exitCode !== null || Date.now() > deadline) throw new Error(`Worker did not start: ${output}`);
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (error) { close(); throw error; }
  const post = (path, fields, cookie = "", extraHeaders = {}) => fetch(`${origin}${path}`, {
    method: "POST", redirect: "manual", headers: { origin, cookie, ...extraHeaders },
    body: new URLSearchParams(fields),
  });
  const login = (email, candidate = password) => post("/api/auth/login", { email, password: candidate });
  return { origin, post, login, query, sql, close, output: () => output };
}
