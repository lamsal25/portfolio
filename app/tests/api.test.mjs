// Integration tests use an isolated local D1 database; never production data.
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { Miniflare } from "miniflare";
import { build } from "esbuild";
const temp = await mkdtemp(join(tmpdir(), "portfolio-api-"));
const entry = join(temp, "entry.ts"),
  bundle = join(temp, "worker.js");
await writeFile(
  entry,
  "import {apiRoute} from " +
    JSON.stringify(resolve("src/portfolio/api.server.ts")) +
    ";import {HttpError} from " +
    JSON.stringify(resolve("src/portfolio/auth.server.ts")) +
    ";export default {async fetch(request,env){try{return await apiRoute(env.DB,request)}catch(e){return Response.json({error:e.message},{status:e instanceof HttpError?e.status:500})}}};",
);
await build({
  entryPoints: [entry],
  outfile: bundle,
  bundle: true,
  format: "esm",
  platform: "browser",
});
const mf = new Miniflare({
  modules: true,
  modulesRoot: temp,
  scriptPath: bundle,
  compatibilityDate: "2025-05-01",
  d1Databases: ["DB"],
});
try {
  const db = await mf.getD1Database("DB");
  const schema = await readFile("migrations/0002_portfolio_cms.sql", "utf8");
  // Parse SQL statement boundaries without splitting semicolons in JSON strings.
  const statements = [];
  let current = "",
    quoted = false;
  for (let i = 0; i < schema.length; i++) {
    const ch = schema[i];
    current += ch;
    if (ch === "'") {
      if (quoted && schema[i + 1] === "'") {
        current += schema[++i];
      } else quoted = !quoted;
    }
    if (ch === ";" && !quoted) {
      statements.push(current.trim());
      current = "";
    }
  }
  await db.batch(statements.map((s) => db.prepare(s)));
  const setup = "local-test-only-setup-token";
  await db
    .prepare("UPDATE portfolio_admin SET setup_hash=? WHERE id=1")
    .bind(createHash("sha256").update(setup).digest("hex"))
    .run();
  let cookie = "";
  const request = async (
    path,
    method = "GET",
    data,
    authenticated = false,
    origin = "https://portfolio.test",
  ) => {
    const headers = { "cf-connecting-ip": "192.0.2.1" };
    if (method !== "GET") {
      headers.Origin = origin;
      headers["Content-Type"] = "application/json";
    }
    if (authenticated) headers.Cookie = cookie;
    return mf.dispatchFetch("https://portfolio.test" + path, {
      method,
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  };
  assert.equal((await request("/api/admin/records")).status, 401);
  assert.equal((await request("/api/admin/contacts")).status, 401);
  assert.equal((await request("/api/admin/records", "POST", {})).status, 401);
  assert.equal(
    (await request("/api/auth/login", "POST", {}, false, "https://attacker.test")).status,
    403,
  );
  assert.equal(
    (
      await request("/api/auth/setup", "POST", {
        email: "attacker@example.com",
        token: setup,
        password: "Strong-test-password-123",
      })
    ).status,
    403,
  );
  const activation = await request("/api/auth/setup", "POST", {
    email: "lamsalgovinda25@gmail.com",
    token: setup,
    password: "Strong-test-password-123",
  });
  assert.equal(activation.status, 200);
  cookie = activation.headers.get("set-cookie").split(";")[0];
  assert.match(activation.headers.get("set-cookie"), /HttpOnly/);
  assert.match(activation.headers.get("set-cookie"), /Secure/);
  assert.match(activation.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(
    (
      await request("/api/auth/setup", "POST", {
        email: "lamsalgovinda25@gmail.com",
        token: setup,
        password: "Strong-test-password-123",
      })
    ).status,
    403,
  );
  assert.equal((await request("/api/auth/session", "GET", undefined, true)).status, 200);
  assert.equal(
    (
      await request("/api/auth/login", "POST", {
        email: "someone@example.com",
        password: "Strong-test-password-123",
      })
    ).status,
    401,
  );
  const draft = {
    collection: "skills",
    data: { name: "Integration test skill", domain: "Tests", level: "Testing" },
    position: 999,
    published: false,
  };
  const created = await request("/api/admin/records", "POST", draft, true);
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  let publicContent = await (await request("/api/content")).json();
  assert.equal(
    publicContent.skills.some((s) => s.name === "Integration test skill"),
    false,
  );
  const published = await request(
    "/api/admin/records/" + id,
    "PUT",
    { ...draft, published: true },
    true,
  );
  assert.equal(published.status, 200);
  publicContent = await (await request("/api/content")).json();
  assert.equal(
    publicContent.skills.some((s) => s.name === "Integration test skill"),
    true,
  );
  assert.equal(
    (
      await request(
        "/api/admin/records/" + id,
        "PUT",
        { ...draft, data: { ...draft.data, role: "superadmin" } },
        true,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/contact", "POST", {
        name: "Contact Test",
        email: "contact@example.com",
        subject: "Private enquiry",
        message: "A parameterized message with a quote '; DROP TABLE portfolio_contacts; --",
        website: "",
      })
    ).status,
    201,
  );
  const inbox = await (await request("/api/admin/contacts", "GET", undefined, true)).json();
  assert.equal(inbox.total, 1);
  assert.equal(inbox.contacts[0].email, "contact@example.com");
  assert.equal(
    JSON.stringify(await (await request("/api/content")).json()).includes("contact@example.com"),
    false,
  );
  const contactId = inbox.contacts[0].id;
  assert.equal(
    (await request("/api/admin/contacts/" + contactId, "PATCH", { status: "replied" }, true))
      .status,
    200,
  );
  assert.equal(
    (await request("/api/admin/records/profile", "DELETE", undefined, true)).status,
    400,
  );
  assert.equal((await request("/api/admin/records/" + id, "DELETE", undefined, true)).status, 200);
  const admin = await db
    .prepare("SELECT password_hash,salt,setup_hash FROM portfolio_admin WHERE id=1")
    .first();
  assert.notEqual(admin.password_hash, "Strong-test-password-123");
  assert.equal(admin.setup_hash, null);
  assert.equal(admin.password_hash.length, 64);
  assert.equal((await request("/api/auth/logout", "POST", {}, true)).status, 200);
  assert.equal((await request("/api/auth/session", "GET", undefined, true)).status, 401);
  console.log(
    "PASS: superadmin-only auth, one-time setup, CSRF, cookie security, private inbox, parameterized writes, draft publishing and logout.",
  );
} finally {
  await mf.dispose();
  await rm(temp, { recursive: true, force: true });
}
