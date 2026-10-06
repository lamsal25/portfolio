import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, extname } from "node:path";
import { createHash } from "node:crypto";
import http from "node:http";
import { Miniflare } from "miniflare";
import { build } from "esbuild";
import { chromium } from "playwright";
const temp = await mkdtemp(join(tmpdir(), "portfolio-browser-")),
  entry = join(temp, "entry.ts"),
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
let server, browser;
try {
  const db = await mf.getD1Database("DB"),
    schema = await readFile("migrations/0002_portfolio_cms.sql", "utf8");
  let current = "",
    quoted = false;
  const statements = [];
  for (let i = 0; i < schema.length; i++) {
    const c = schema[i];
    current += c;
    if (c === "'") {
      if (quoted && schema[i + 1] === "'") current += schema[++i];
      else quoted = !quoted;
    }
    if (c === ";" && !quoted) {
      statements.push(current.trim());
      current = "";
    }
  }
  await db.batch(statements.map((s) => db.prepare(s)));
  const token = "browser-test-only-token";
  await db
    .prepare("UPDATE portfolio_admin SET setup_hash=? WHERE id=1")
    .bind(createHash("sha256").update(token).digest("hex"))
    .run();
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost:8080");
    if (url.pathname.startsWith("/api/")) {
      const parts = [];
      for await (const part of req) parts.push(part);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers))
        if (v) headers.set(k, Array.isArray(v) ? v.join("; ") : v);
      headers.set("cf-connecting-ip", "127.0.0.1");
      const response = await mf.dispatchFetch(url.href, {
        method: req.method,
        headers,
        ...(parts.length ? { body: Buffer.concat(parts) } : {}),
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    try {
      let path = decodeURIComponent(url.pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = resolve("next/out", "." + path);
      if (!file.startsWith(resolve("next/out") + "/")) throw new Error();
      const data = await readFile(file);
      const type =
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".txt": "text/plain",
          ".json": "application/json",
        }[extname(file)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(8080, resolve));
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8080/admin/setup/#token=" + token);
  await page.getByLabel("Password", { exact: true }).fill("Browser-test-password-123");
  await page.getByLabel("Confirm password").fill("Browser-test-password-123");
  await page.getByRole("button", { name: "Activate superadmin" }).click();
  await page.waitForURL("**/dashboard/");
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  await page.getByRole("button", { name: "Add skill", exact: true }).click();
  await page.getByLabel("Skill", { exact: true }).fill("Browser test skill");
  await page.getByLabel("Domain", { exact: true }).fill("Testing");
  await page.getByLabel("Experience level").fill("Integration test");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Browser test skill", { exact: true }).waitFor();
  console.log("PASS: one-time setup, superadmin login and skill editor.");
  await page.goto("http://localhost:8080/");
  await page.getByRole("button", { name: "Browser test skill: Integration test" }).waitFor();
  await page.locator("canvas").first().waitFor();
  for (const mode of ["Three-tier app", "Image converter", "Image analysis"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.getByLabel("Your name", { exact: true }).fill("Browser Contact");
  await page.getByLabel("Your email").fill("browser@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Testing the private inbox");
  await page
    .getByLabel("What are you working on?")
    .fill("Testing contact form persistence and private access.");
  await page.getByRole("button", { name: "Send message", exact: false }).click();
  await page.getByText("Thanks for reaching out. Your message has been received.").waitFor();
  await page.goto("http://localhost:8080/dashboard/");
  await page.getByRole("button", { name: /Contact inbox/ }).click();
  await page.getByRole("button", { name: /Browser Contact/ }).click();
  await page.getByText("browser@example.com", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Mark replied", exact: true }).click();
  await page.waitForTimeout(150);
  console.log("PASS: live public content, contact submission and inbox status update.");
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "Dashboard overflow at " + width,
    );
  }
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/admin/login/");
  await page.goto("http://localhost:8080/dashboard/");
  await page.waitForURL("**/admin/login/");
  console.log("PASS: sign-out, session expiry guard and dashboard responsive layout.");
  await page.goto("http://localhost:8080/");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "Portfolio overflow at " + width,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "Image converter", exact: true }).click();
  assert.deepEqual(errors, []);
  console.log("PASS: public mobile layout, reduced motion and no client exceptions.");
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await mf.dispose();
  await rm(temp, { recursive: true, force: true });
}
