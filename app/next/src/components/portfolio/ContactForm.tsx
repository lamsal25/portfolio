"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";
export function ContactForm({ profile }: { profile: Profile }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/api/contact", { method: "POST", body: JSON.stringify(data) });
      setMessage("Thanks for reaching out. Your message has been received.");
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="contact">
      <div className="contact-layout">
        <div>
          <h2>
            Let’s build
            <br />
            something useful.
          </h2>
          <p>
            Have a development project, cloud architecture question or training opportunity? Get in
            touch.
          </p>
          <a className="email" href={"mailto:" + profile.email}>
            {profile.email}
          </a>
          <div className="socials">
            <a href={profile.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
            <a href={"tel:+977" + profile.phone}>Call {profile.phone}</a>
          </div>
        </div>
        <form onSubmit={submit}>
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={200} />
          </label>
          <label>
            Your email
            <input name="email" type="email" autoComplete="email" required maxLength={200} />
          </label>
          <label>
            Subject
            <input name="subject" maxLength={200} />
          </label>
          <label>
            What are you working on?
            <textarea name="message" required minLength={10} maxLength={3000} />
          </label>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <button className="form-submit" disabled={busy}>
            {busy ? "Sending…" : "Send message ↗"}
          </button>
          <small className="hint">
            Your details are stored privately so I can respond to your enquiry.
          </small>
          {message && <p role="status">{message}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
