import type { D1Database } from "@cloudflare/workers-types";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const COOKIE = "__Host-portfolio_session";
export const ADMIN_EMAIL = "lamsalgovinda25@gmail.com";
const encoder = new TextEncoder();
export async function sha256(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function secureEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function randomToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100000 },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function requireOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new HttpError(403, "This action must come from this website.");
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A request body is required.");
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 32768) {
      await reader.cancel();
      throw new HttpError(413, "The submitted content is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    const json = JSON.parse(new TextDecoder().decode(bytes));
    if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error();
    return json;
  } catch {
    throw new HttpError(400, "Submit a valid JSON object.");
  }
}
export async function rateLimit(
  db: D1Database,
  request: Request,
  action: string,
  limit: number,
  seconds: number,
) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(action + ":" + ip);
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      "INSERT INTO portfolio_rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END, expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING hits",
    )
    .bind(key, now + seconds, now, now)
    .first<{ hits: number }>();
  if (!row || row.hits > limit)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
export async function session(db: D1Database, request: Request) {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  return db
    .prepare(
      "SELECT a.id,a.email FROM portfolio_sessions s JOIN portfolio_admin a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>? AND a.password_hash IS NOT NULL AND a.id=1 AND a.email=?",
    )
    .bind(await sha256(raw), Math.floor(Date.now() / 1000), ADMIN_EMAIL)
    .first<{ id: number; email: string }>();
}
export async function requireAdmin(db: D1Database, request: Request) {
  const admin = await session(db, request);
  if (!admin) throw new HttpError(401, "Superadmin login is required.");
  return admin;
}
export async function newSession(db: D1Database) {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare("DELETE FROM portfolio_sessions WHERE expires_at<=?").bind(now),
    db
      .prepare("INSERT INTO portfolio_sessions(token_hash,admin_id,expires_at) VALUES(?,1,?)")
      .bind(await sha256(token), now + 28800),
  ]);
  return COOKIE + "=" + token + "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800";
}
export const clearCookie = COOKIE + "=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0";
export function validPassword(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    throw new HttpError(400, "Use a password between 12 and 128 characters.");
  return value;
}
export async function authRoute(db: D1Database, request: Request, path: string): Promise<Response> {
  if (path === "/api/auth/session" && request.method === "GET") {
    const admin = await session(db, request);
    if (!admin) throw new HttpError(401, "Superadmin login is required.");
    return Response.json({ email: admin.email });
  }
  if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
  requireOrigin(request);
  await rateLimit(db, request, "auth", 10, 900);
  const input = await body(request);
  if (path === "/api/auth/setup") {
    if (input.email !== ADMIN_EMAIL || typeof input.token !== "string" || input.token.length > 100)
      throw new HttpError(403, "The setup link is invalid or has already been used.");
    const hash = await sha256(input.token);
    const admin = await db
      .prepare("SELECT setup_hash,password_hash FROM portfolio_admin WHERE id=1")
      .first<{ setup_hash: string | null; password_hash: string | null }>();
    if (!admin?.setup_hash || admin.password_hash || !secureEqual(hash, admin.setup_hash))
      throw new HttpError(403, "The setup link is invalid or has already been used.");
    const password = validPassword(input.password),
      salt = randomToken();
    const passhash = await passwordHash(password, salt);
    const result = await db
      .prepare(
        "UPDATE portfolio_admin SET password_hash=?,salt=?,setup_hash=NULL,activated_at=datetime('now') WHERE id=1 AND password_hash IS NULL AND setup_hash=?",
      )
      .bind(passhash, salt, hash)
      .run();
    if (!result.meta.changes) throw new HttpError(409, "The account is already activated.");
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await newSession(db) } });
  }
  if (path === "/api/auth/login") {
    const admin = await db
      .prepare("SELECT email,password_hash,salt FROM portfolio_admin WHERE id=1")
      .first<{ email: string; password_hash: string | null; salt: string | null }>();
    const password =
      typeof input.password === "string" && input.password.length <= 128 ? input.password : "";
    const actual = await passwordHash(password, admin?.salt || "unactivated-account");
    if (
      input.email !== ADMIN_EMAIL ||
      !admin?.password_hash ||
      !secureEqual(actual, admin.password_hash)
    )
      throw new HttpError(401, "The email or password is incorrect.");
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await newSession(db) } });
  }
  if (path === "/api/auth/logout") {
    const raw = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(COOKIE + "="))
      ?.slice(COOKIE.length + 1);
    if (raw)
      await db
        .prepare("DELETE FROM portfolio_sessions WHERE token_hash=?")
        .bind(await sha256(raw))
        .run();
    return Response.json({ ok: true }, { headers: { "Set-Cookie": clearCookie } });
  }
  if (path === "/api/auth/password") {
    await requireAdmin(db, request);
    const admin = await db
      .prepare("SELECT password_hash,salt FROM portfolio_admin WHERE id=1")
      .first<{ password_hash: string; salt: string }>();
    if (
      !admin ||
      typeof input.currentPassword !== "string" ||
      input.currentPassword.length > 128 ||
      !secureEqual(await passwordHash(input.currentPassword, admin.salt), admin.password_hash)
    )
      throw new HttpError(400, "Your current password is incorrect.");
    const password = validPassword(input.password),
      salt = randomToken();
    await db.batch([
      db
        .prepare("UPDATE portfolio_admin SET password_hash=?,salt=? WHERE id=1")
        .bind(await passwordHash(password, salt), salt),
      db.prepare("DELETE FROM portfolio_sessions WHERE admin_id=1"),
    ]);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": clearCookie } });
  }
  throw new HttpError(404, "Not found.");
}
