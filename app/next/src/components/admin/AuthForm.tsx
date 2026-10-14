"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSite } from "@/components/ui/SiteProvider";
const EMAIL = "lamsalgovinda25@gmail.com";
type Mode = "login" | "setup" | "forgot" | "reset";
export function AuthForm({ setup = false }: { setup?: boolean }) {
  const [token, setToken] = useState(""),
    [mode, setMode] = useState<Mode>(setup ? "setup" : "login"),
    [ready, setReady] = useState(!setup),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const { theme, toggleTheme } = useSite();
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1)),
      value = hash.get("token");
    if (value) {
      setToken(value);
      history.replaceState(null, "", location.pathname);
      if (!setup) {
        setMode("reset");
        setReady(true);
        return;
      }
    }
    if (setup) {
      setReady(true);
    } else {
      api("/api/auth/session")
        .then(() => location.replace("/dashboard/"))
        .catch(() => { });
    }
  }, [setup]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    setNotice("");
    if ((mode === "setup" || mode === "reset") && values.password !== values.confirm) {
      setError("The passwords must match.");
      return;
    }
    setBusy(true);
    try {
      const endpoint =
        mode === "setup"
          ? "setup"
          : mode === "forgot"
            ? "forgot-password"
            : mode === "reset"
              ? "reset-password"
              : "login";
      await api("/api/auth/" + endpoint, {
        method: "POST",
        body: JSON.stringify({
          ...(mode === "login" || mode === "forgot" || mode === "setup" ? { email: EMAIL } : {}),
          ...(mode === "forgot" ? {} : { password: values.password }),
          ...(mode === "setup" || mode === "reset" ? { token } : {}),
        }),
      });
      if (mode === "login" || mode === "setup") {
        location.replace("/dashboard/");
      } else if (mode === "reset") {
        setMode("login");
        setNotice("Your password has been reset. Please sign in.");
      } else {
        setNotice(
          "If this email belongs to the superadmin account, a password reset link has been sent.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const isSetup = mode === "setup",
    isForgot = mode === "forgot",
    isReset = mode === "reset";
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
        <h1>
          {isSetup
            ? "Set your superadmin password."
            : isForgot
              ? "Reset your password."
              : isReset
                ? "Choose a new password."
                : "Welcome back."}
        </h1>
        <p>
          {isSetup
            ? "Your one-time invitation activates the only administrator account."
            : isForgot
              ? "We’ll email a one-time reset link to the registered superadmin email."
              : isReset
                ? "Choose a new password for your superadmin account."
                : "Manage your portfolio and contact inbox."}
        </p>
        {isSetup && ready && !token ? (
          <p role="alert" className="error">
            Open the private setup link provided to you. Account creation is not open to visitors.
          </p>
        ) : (
          <>
            {!notice && (
              <form onSubmit={submit}>
                {!isSetup && !isReset && (
                  <label>
                    Superadmin email
                    <input
                      type="email"
                      name="email"
                      value={EMAIL}
                      readOnly
                      autoComplete="username"
                    />
                  </label>
                )}
                {!isForgot && (
                  <label>
                    {isReset ? "New password" : "Password"}
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={isSetup || isReset ? 12 : 1}
                      maxLength={128}
                      autoComplete={isSetup || isReset ? "new-password" : "current-password"}
                    />
                  </label>
                )}
                {(isSetup || isReset) && (
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
                  {busy
                    ? "Please wait…"
                    : isSetup
                      ? "Activate superadmin"
                      : isForgot
                        ? "Send reset link"
                        : isReset
                          ? "Reset password"
                          : "Sign in"}
                </button>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
            {!isSetup && !isReset && !isForgot && (
              <button
                className="text-link auth-mode-link"
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setNotice("");
                }}
              >
                Forgot password?
              </button>
            )}
            {(isForgot || isReset) && (
              <button
                className="text-link auth-mode-link"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setNotice("");
                }}
              >
                Return to sign in
              </button>
            )}
          </>
        )}
        <a className="text-link" href="/">
          Return to portfolio ↗
        </a>
      </div>
    </main>
  );
}
