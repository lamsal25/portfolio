import type { D1Database } from "@cloudflare/workers-types";
import { HttpError, authRoute, requireAdmin, requireOrigin, rateLimit, body } from "./auth.server";
import { contactSchema, recordSchema } from "./validation.server";
type ApiEnv = { RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string };
type Row = {
  id: string;
  collection: string;
  data: string;
  position: number;
  published: number;
  updated_at: string;
};
const parseRow = (row: Row) => ({ ...row, data: JSON.parse(row.data) });
function invalid(message: string): never {
  throw new HttpError(400, message);
}
export async function apiRoute(
  db: D1Database,
  request: Request,
  env: ApiEnv = {},
): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  if (path.startsWith("/api/auth/")) return authRoute(db, request, path, env);
  if (path === "/api/content" && method === "GET") {
    const { results } = await db
      .prepare("SELECT * FROM portfolio_records WHERE published=1 ORDER BY position,id")
      .all<Row>();
    const content: Record<string, unknown> = {
      profile: null,
      skills: [],
      certifications: [],
      projects: [],
      education: [],
      experience: [],
    };
    for (const row of results) {
      if (row.collection === "profile") content.profile = JSON.parse(row.data);
      else (content[row.collection] as unknown[]).push(JSON.parse(row.data));
    }
    return Response.json(content);
  }
  if (path === "/api/contact" && method === "POST") {
    requireOrigin(request);
    await rateLimit(db, request, "contact", 5, 3600);
    const input = await body(request);
    if (typeof input.website === "string" && input.website) return Response.json({ ok: true });
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) invalid(parsed.error.issues[0]?.message || "Check the contact form.");
    const data = parsed.data,
      id = crypto.randomUUID();
    await db
      .prepare("INSERT INTO portfolio_contacts(id,name,email,subject,message) VALUES(?,?,?,?,?)")
      .bind(id, data.name, data.email, data.subject, data.message)
      .run();
    return Response.json({ ok: true }, { status: 201 });
  }
  if (!path.startsWith("/api/admin/")) throw new HttpError(404, "Not found.");
  await requireAdmin(db, request);
  if (method !== "GET") {
    requireOrigin(request);
    await rateLimit(db, request, "admin", 120, 60);
  }
  if (path === "/api/admin/records" && method === "GET") {
    const { results } = await db
      .prepare("SELECT * FROM portfolio_records ORDER BY collection,position,id")
      .all<Row>();
    return Response.json({ records: results.map(parseRow) });
  }
  if (path === "/api/admin/stats" && method === "GET") {
    const content = await db
      .prepare("SELECT collection,COUNT(*) as total FROM portfolio_records GROUP BY collection")
      .all();
    const contact = await db
      .prepare(
        "SELECT COUNT(*) AS total,SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS unread FROM portfolio_contacts",
      )
      .first();
    return Response.json({ content: content.results, contacts: contact });
  }
  const recordMatch = path.match(/^\/api\/admin\/records\/([a-zA-Z0-9-]{1,80})$/);
  if ((path === "/api/admin/records" && method === "POST") || (recordMatch && method === "PUT")) {
    const input = await body(request),
      parsed = recordSchema.safeParse(input);
    if (!parsed.success) invalid(parsed.error.issues[0]?.message || "Check the record fields.");
    const { collection, data, position, published } = parsed.data;
    if (collection === "profile" && !published) invalid("The profile must stay published.");
    const id = recordMatch?.[1] || (collection === "profile" ? "profile" : crypto.randomUUID());
    if (collection === "profile" && id !== "profile") invalid("Only one profile is allowed.");
    if (method === "PUT") {
      const row = await db
        .prepare("SELECT collection FROM portfolio_records WHERE id=?")
        .bind(id)
        .first<{ collection: string }>();
      if (!row) throw new HttpError(404, "Record not found.");
      if (row.collection !== collection) invalid("The collection cannot be changed.");
      await db
        .prepare(
          "UPDATE portfolio_records SET data=?,position=?,published=?,updated_at=datetime('now') WHERE id=?",
        )
        .bind(JSON.stringify(data), position, published ? 1 : 0, id)
        .run();
    } else {
      if (collection === "profile") throw new HttpError(409, "Edit the existing profile.");
      await db
        .prepare(
          "INSERT INTO portfolio_records(id,collection,data,position,published) VALUES(?,?,?,?,?)",
        )
        .bind(id, collection, JSON.stringify(data), position, published ? 1 : 0)
        .run();
    }
    return Response.json({ ok: true, id }, { status: method === "POST" ? 201 : 200 });
  }
  if (recordMatch && method === "DELETE") {
    if (recordMatch[1] === "profile") invalid("The profile cannot be deleted.");
    const result = await db
      .prepare("DELETE FROM portfolio_records WHERE id=?")
      .bind(recordMatch[1])
      .run();
    if (!result.meta.changes) throw new HttpError(404, "Record not found.");
    return Response.json({ ok: true });
  }
  if (path === "/api/admin/contacts" && method === "GET") {
    const statuses = ["new", "read", "replied", "archived"];
    const status = url.searchParams.get("status");
    if (status && !statuses.includes(status)) invalid("Invalid inbox status.");
    const page = Math.min(100000, Math.max(1, Number(url.searchParams.get("page")) || 1)),
      offset = (Math.floor(page) - 1) * 20;
    const where = status ? "WHERE status=?" : "";
    const select = db.prepare(
      "SELECT id,name,email,subject,message,status,created_at FROM portfolio_contacts " +
        where +
        " ORDER BY created_at DESC,id LIMIT 20 OFFSET ?",
    );
    const count = db.prepare("SELECT COUNT(*) as total FROM portfolio_contacts " + where);
    const [rows, total] = await Promise.all([
      status ? select.bind(status, offset).all() : select.bind(offset).all(),
      status ? count.bind(status).first() : count.first(),
    ]);
    return Response.json({
      contacts: rows.results,
      total: (total as { total: number })?.total || 0,
      page,
    });
  }
  const contactMatch = path.match(/^\/api\/admin\/contacts\/([a-zA-Z0-9-]{1,80})$/);
  if (contactMatch && method === "PATCH") {
    const input = await body(request);
    if (!["new", "read", "replied", "archived"].includes(String(input.status)))
      invalid("Invalid inbox status.");
    const result = await db
      .prepare("UPDATE portfolio_contacts SET status=? WHERE id=?")
      .bind(input.status, contactMatch[1])
      .run();
    if (!result.meta.changes) throw new HttpError(404, "Message not found.");
    return Response.json({ ok: true });
  }
  if (contactMatch && method === "DELETE") {
    const result = await db
      .prepare("DELETE FROM portfolio_contacts WHERE id=?")
      .bind(contactMatch[1])
      .run();
    if (!result.meta.changes) throw new HttpError(404, "Message not found.");
    return Response.json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
}
