"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { RecordItem } from "@/lib/types";
type Field = { key: string; label: string; kind?: "long" | "lines" | "tags" | "link" };
const F = (key: string, label: string, kind?: Field["kind"]): Field => ({ key, label, kind });
export const fields: Record<string, Field[]> = {
  profile: [
    F("name", "Name"),
    F("title", "Professional title"),
    F("location", "Location"),
    F("tagline", "Tagline", "long"),
    F("about", "About paragraphs (one per line)", "lines"),
    F("email", "Contact email"),
    F("phone", "Phone"),
    F("github", "GitHub URL", "link"),
    F("linkedin", "LinkedIn URL", "link"),
  ],
  skills: [F("name", "Skill"), F("domain", "Domain"), F("level", "Experience level")],
  certifications: [
    F("title", "Certification title"),
    F("code", "Code"),
    F("issuer", "Issuer"),
    F("description", "Description", "long"),
    F("seal", "Short label (up to 8 characters)"),
  ],
  projects: [
    F("name", "Project name"),
    F("kind", "Project status"),
    F("art", "Visual caption"),
    F("description", "Description", "long"),
    F("tags", "Technologies (comma separated)", "tags"),
    F("points", "Details (one per line)", "lines"),
    F("link", "Project URL (optional)", "link"),
  ],
  experience: [
    F("title", "Role"),
    F("label", "Company or context"),
    F("text", "Description", "long"),
  ],
  education: [
    F("title", "Degree"),
    F("label", "Status or institution"),
    F("text", "Description", "long"),
  ],
};
export function RecordEditor({
  collection,
  item,
  onSaved,
  onCancel,
  onError,
}: {
  collection: string;
  item: RecordItem | null;
  onSaved: () => void;
  onCancel: () => void;
  onError: (e: unknown) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form),
      data: Record<string, unknown> = {};
    for (const f of fields[collection]) {
      const raw = String(values.get(f.key) || "").trim();
      data[f.key] =
        f.kind === "lines"
          ? raw
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : f.kind === "tags"
            ? raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : f.key === "link"
              ? raw || null
              : raw;
    }
    const payload = {
      collection,
      data,
      position: Number(values.get("position")) || 0,
      published: collection === "profile" || values.get("published") === "on",
    };
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/records" + (item ? "/" + item.id : ""), {
        method: item ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor-panel">
      <div className="panel-heading">
        <h2>
          {item ? "Edit" : "Add"}{" "}
          {collection === "profile" ? "profile" : collection.replace(/s$/, "")}
        </h2>
        <button className="admin-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <form onSubmit={save}>
        <div className="editor-grid">
          {fields[collection].map((f) => {
            const value = item?.data[f.key];
            const formatted = Array.isArray(value)
              ? value.join(f.kind === "tags" ? ", " : "\n")
              : String(value ?? "");
            const required = !["code", "link", "seal", "phone"].includes(f.key);
            return (
              <label className={f.kind === "long" || f.kind === "lines" ? "wide" : ""} key={f.key}>
                {f.label}
                {f.kind === "long" || f.kind === "lines" ? (
                  <textarea
                    name={f.key}
                    defaultValue={formatted}
                    required={required}
                    maxLength={12000}
                  />
                ) : (
                  <input
                    name={f.key}
                    defaultValue={formatted}
                    type={f.kind === "link" ? "url" : f.key === "email" ? "email" : "text"}
                    required={required}
                    maxLength={f.key === "seal" ? 8 : 1000}
                  />
                )}
              </label>
            );
          })}
        </div>
        {collection !== "profile" && (
          <div className="editor-options">
            <label>
              Display order
              <input
                type="number"
                name="position"
                min={0}
                max={100000}
                defaultValue={item?.position || 0}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="published"
                defaultChecked={item ? Boolean(item.published) : true}
              />
              Published on portfolio
            </label>
          </div>
        )}
        <button className="admin-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
