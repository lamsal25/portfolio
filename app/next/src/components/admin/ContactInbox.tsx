"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Contact } from "@/lib/types";
export function ContactInbox({
  onError,
  onChanged,
}: {
  onError: (e: unknown) => void;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<Contact[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Contact | null>(null),
    [error, setError] = useState("");
  async function load() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ contacts: Contact[]; total: number }>(
        "/api/admin/contacts?page=" + page + (filter ? "&status=" + filter : ""),
      );
      setItems(r.contacts);
      setTotal(r.total);
    } catch (e) {
      setError((e as Error).message);
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, [page, filter]);
  async function update(item: Contact, status: string) {
    setBusy(true);
    try {
      await api("/api/admin/contacts/" + item.id, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSelected({ ...item, status: status as Contact["status"] });
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: Contact) {
    if (!confirm("Permanently delete this contact message?")) return;
    setBusy(true);
    try {
      await api("/api/admin/contacts/" + item.id, { method: "DELETE" });
      setSelected(null);
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="inbox">
      <div className="panel-heading">
        <div>
          <h2>Contact inbox</h2>
          <p>{total} messages</p>
        </div>
        <button className="admin-quiet" onClick={load} disabled={busy}>
          Refresh
        </button>
      </div>
      <div className="inbox-filters">
        {[
          ["", "All"],
          ["new", "New"],
          ["read", "Read"],
          ["replied", "Replied"],
          ["archived", "Archived"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="inbox-layout">
        <div className="inbox-list">
          {!items.length && !busy && <div className="empty-state">No messages in this view.</div>}
          {items.map((item) => (
            <button
              key={item.id}
              className={"message-row" + (selected?.id === item.id ? " active" : "")}
              onClick={() => {
                setSelected(item);
                if (item.status === "new") update(item, "read");
              }}
            >
              <span>
                <strong>{item.name}</strong>
                <small>{item.status}</small>
              </span>
              <p>{item.subject || item.message.slice(0, 75)}</p>
              <time>{new Date(item.created_at + "Z").toLocaleDateString()}</time>
            </button>
          ))}
          <div className="pagination">
            <button disabled={page === 1 || busy} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button disabled={page * 20 >= total || busy} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
        <div className="message-detail">
          {selected ? (
            <>
              <small>{selected.status}</small>
              <h3>{selected.subject || "Portfolio enquiry"}</h3>
              <p>
                <strong>{selected.name}</strong>
                <br />
                <a href={"mailto:" + selected.email}>{selected.email}</a>
              </p>
              <p className="message-body">{selected.message}</p>
              <div className="message-actions">
                <a
                  className="admin-primary"
                  href={
                    "mailto:" +
                    selected.email +
                    "?subject=" +
                    encodeURIComponent("Re: " + (selected.subject || "Portfolio enquiry"))
                  }
                >
                  Reply by email ↗
                </a>
                <button disabled={busy} onClick={() => update(selected, "replied")}>
                  Mark replied
                </button>
                <button disabled={busy} onClick={() => update(selected, "archived")}>
                  Archive
                </button>
                <button className="danger" disabled={busy} onClick={() => remove(selected)}>
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">Select a message to see its details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
