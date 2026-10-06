"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSite } from "@/components/ui/SiteProvider";
const EMAIL = "lamsalgovinda25@gmail.com";
export function AuthForm({ setup = false }: { setup?: boolean }) {
  const [token, setToken] = useState(""),
    [ready, setReady] = useState(!setup),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { theme, toggleTheme } = useSite();
  useEffect(() => {
    if (setup) {
      const hash = new URLSearchParams(location.hash.slice(1)),
        value = hash.get("token");
      if (value) {
        setToken(value);
        history.replaceState(null, "", location.pathname);
      }
      setReady(true);
    } else {
      api("/api/auth/session")
        .then(() => location.replace("/dashboard/"))
        .catch(() => {});
    }
  }, [setup]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    if (setup && values.password !== values.confirm) {
      setError("The passwords must match.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/" + (setup ? "setup" : "login"), {
        method: "POST",
        body: JSON.stringify({
          email: EMAIL,
          password: values.password,
          ...(setup ? { token } : {}),
        }),
      });
      location.replace("/dashboard/");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-bar">
        <a className="brand" href="/">
          govinda<span>.</span>
        </a>
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? "☼" : "☾"}
        </button>
      </div>
      <div className="auth-card">
        <small>PRIVATE WORKSPACE</small>
        <h1>{setup ? "Set your superadmin password." : "Welcome back."}</h1>
        <p>
          {setup
            ? "Your one-time invitation activates the only administrator account."
            : "Manage your portfolio and contact inbox."}
        </p>
        {setup && ready && !token ? (
          <p role="alert" className="error">
            Open the private setup link provided to you. Account creation is not open to visitors.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label>
              Superadmin email
              <input type="email" name="email" value={EMAIL} readOnly autoComplete="username" />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                required
                minLength={setup ? 12 : 1}
                maxLength={128}
                autoComplete={setup ? "new-password" : "current-password"}
              />
            </label>
            {setup && (
              <>
                <small>Use at least 12 characters.</small>
                <label>
                  Confirm password
                  <input
                    type="password"
                    name="confirm"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>
              </>
            )}
            <button className="admin-primary" disabled={busy || !ready}>
              {busy ? "Please wait…" : setup ? "Activate superadmin" : "Sign in"}
            </button>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
        <a className="text-link" href="/">
          Return to portfolio ↗
        </a>
      </div>
    </main>
  );
}
