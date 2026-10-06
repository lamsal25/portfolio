"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export function PasswordSettings({ onError }: { onError: (e: unknown) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    if (v.password !== v.confirm) {
      setError("Passwords must match.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: v.currentPassword, password: v.password }),
      });
      location.replace("/admin/login/");
    } catch (e) {
      setError((e as Error).message);
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor-panel">
      <h2>Account security</h2>
      <p>Changing your password signs out every active session.</p>
      <form onSubmit={submit}>
        <label>
          Current password
          <input type="password" name="currentPassword" required autoComplete="current-password" />
        </label>
        <label>
          New password
          <input
            type="password"
            name="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            name="confirm"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <button className="admin-primary" disabled={busy}>
          {busy ? "Updating…" : "Change password"}
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
