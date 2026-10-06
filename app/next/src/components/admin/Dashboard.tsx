"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSite } from "@/components/ui/SiteProvider";
import type { RecordItem } from "@/lib/types";
import { RecordEditor } from "./RecordEditor";
import { ContactInbox } from "./ContactInbox";
import { PasswordSettings } from "./PasswordSettings";
type Stats = {
  content: { collection: string; total: number }[];
  contacts: { total: number; unread: number | null };
};
const sections = [
  ["overview", "Overview"],
  ["profile", "Profile"],
  ["skills", "Skills"],
  ["certifications", "Certifications"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["inbox", "Contact inbox"],
  ["security", "Security"],
];
export function Dashboard() {
  const [tab, setTab] = useState("overview"),
    [records, setRecords] = useState<RecordItem[]>([]),
    [stats, setStats] = useState<Stats | null>(null),
    [email, setEmail] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editor, setEditor] = useState<{ item: RecordItem | null } | null>(null),
    [notice, setNotice] = useState("");
  const { theme, toggleTheme } = useSite();
  function handleError(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      location.replace("/admin/login/");
      return;
    }
    setError((e as Error).message);
  }
  async function load() {
    setError("");
    try {
      const [s, r, t] = await Promise.all([
        api<{ email: string }>("/api/auth/session"),
        api<{ records: RecordItem[] }>("/api/admin/records"),
        api<Stats>("/api/admin/stats"),
      ]);
      setEmail(s.email);
      setRecords(r.records);
      setStats(t);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      location.replace("/admin/login/");
    } catch (e) {
      handleError(e);
    }
  }
  async function remove(item: RecordItem) {
    if (!confirm("Permanently delete this " + item.collection.replace(/s$/, "") + "?")) return;
    try {
      await api("/api/admin/records/" + item.id, { method: "DELETE" });
      setNotice("Record deleted.");
      await load();
    } catch (e) {
      handleError(e);
    }
  }
  function saved() {
    setEditor(null);
    setNotice("Saved. Your portfolio reflects these changes.");
    load();
  }
  function navigate(next: string) {
    setTab(next);
    setEditor(null);
    setNotice("");
    setError("");
  }
  const filtered = records.filter((r) => r.collection === tab);
  if (loading)
    return (
      <main className="auth-page">
        <p role="status">Verifying superadmin access…</p>
      </main>
    );
  if (!email)
    return (
      <main className="auth-page">
        <p role="alert">{error || "Login is required."}</p>
        <a href="/admin/login/">Go to login</a>
      </main>
    );
  return (
    <div className="dashboard">
      <header className="admin-header">
        <a className="brand" href="/">
          govinda<span>.</span>
        </a>
        <div>
          <span>Superadmin</span>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "☼" : "☾"}
          </button>
          <button className="admin-quiet" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <div className="dashboard-grid">
        <aside className="sidebar">
          <div className="account">
            <strong>Portfolio workspace</strong>
            <small>{email}</small>
          </div>
          <nav className="admin-nav" aria-label="Dashboard navigation">
            {sections.map(([name, label]) => (
              <button
                key={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => navigate(name)}
              >
                {label}
                {name === "inbox" && !!stats?.contacts.unread && (
                  <span>{stats.contacts.unread}</span>
                )}
              </button>
            ))}
          </nav>
          <a className="view-site" href="/" target="_blank" rel="noopener noreferrer">
            View portfolio ↗
          </a>
        </aside>
        <main className="admin-main">
          <div className="admin-title">
            <small>YOUR PORTFOLIO, UNDER YOUR CONTROL</small>
            <h1>{sections.find((s) => s[0] === tab)?.[1]}</h1>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {tab === "overview" ? (
            <>
              <div className="overview-grid">
                {[
                  [
                    "Skills",
                    stats?.content.find((c) => c.collection === "skills")?.total || 0,
                    "skills",
                  ],
                  [
                    "Certifications",
                    stats?.content.find((c) => c.collection === "certifications")?.total || 0,
                    "certifications",
                  ],
                  [
                    "Projects",
                    stats?.content.find((c) => c.collection === "projects")?.total || 0,
                    "projects",
                  ],
                  ["New enquiries", stats?.contacts.unread || 0, "inbox"],
                ].map(([label, value, next]) => (
                  <button
                    className="stat-card"
                    key={String(label)}
                    onClick={() => navigate(String(next))}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>Manage ↗</small>
                  </button>
                ))}
              </div>
              <div className="admin-welcome">
                <h2>Keep your work current.</h2>
                <p>
                  Add a skill, publish a certification, update a project, or respond to someone who
                  reached out. Changes are saved to the database and appear on your public
                  portfolio.
                </p>
                <div className="quick-actions">
                  <button onClick={() => navigate("profile")}>Edit introduction ↗</button>
                  <button onClick={() => navigate("inbox")}>Open inbox ↗</button>
                </div>
              </div>
            </>
          ) : tab === "inbox" ? (
            <ContactInbox onError={handleError} onChanged={load} />
          ) : tab === "security" ? (
            <PasswordSettings onError={handleError} />
          ) : editor ? (
            <RecordEditor
              key={editor.item?.id || "new"}
              collection={tab}
              item={editor.item}
              onSaved={saved}
              onCancel={() => setEditor(null)}
              onError={handleError}
            />
          ) : tab === "profile" ? (
            <RecordEditor
              key="profile"
              collection="profile"
              item={filtered[0] || null}
              onSaved={saved}
              onCancel={() => navigate("overview")}
              onError={handleError}
            />
          ) : (
            <div className="records-panel">
              <div className="panel-heading">
                <p>{filtered.length} records. Use display order to control their position.</p>
                <button className="admin-primary" onClick={() => setEditor({ item: null })}>
                  Add {tab.replace(/s$/, "")}
                </button>
              </div>
              {!filtered.length && (
                <div className="empty-state">No records yet. Add your first item.</div>
              )}
              <div className="record-list">
                {filtered.map((item) => (
                  <div className="record-row" key={item.id}>
                    <div>
                      <strong>{String(item.data.name || item.data.title || "Untitled")}</strong>
                      <p>
                        {String(
                          item.data.domain ||
                            item.data.issuer ||
                            item.data.label ||
                            item.data.kind ||
                            "",
                        )}
                      </p>
                      <small>
                        {item.published ? "Published" : "Draft"} · Order {item.position}
                      </small>
                    </div>
                    <div className="record-actions">
                      <button onClick={() => setEditor({ item })}>Edit</button>
                      <button className="danger" onClick={() => remove(item)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
