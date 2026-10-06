"use client";
import { useEffect, useState } from "react";
import seed from "@/data/seed.json";
import { api } from "@/lib/api";
import type { Content } from "@/lib/types";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { About } from "./About";
import { Skills } from "./Skills";
import { Projects } from "./Projects";
import { Journey } from "./Journey";
import { Certifications } from "./Certifications";
import { ContactForm } from "./ContactForm";
const initial: Content = {
  profile: seed,
  skills: seed.domains.flatMap((d) =>
    d.skills.map((name) => ({ name, domain: d.name, level: d.level })),
  ),
  certifications: seed.certifications,
  projects: seed.projects,
  experience: seed.experience,
  education: seed.education,
};
export function PortfolioHome() {
  const [content, setContent] = useState(initial),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const next = await api<Content>("/api/content");
        if (!cancelled) {
          setContent(next);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <>
      <Navigation />
      <main className="wrap">
        {failed && (
          <p role="alert" className="notice">
            Live updates are temporarily unavailable. Please refresh shortly.
          </p>
        )}
        <Hero profile={content.profile} />
        <div className="divider">
          <span>{content.profile.location}</span>
          <span>Code → Cloud → Classroom</span>
          <span>Built with curiosity</span>
        </div>
        <About profile={content.profile} education={content.education} />
        <Skills items={content.skills} />
        <Projects items={content.projects} />
        <Journey experience={content.experience} education={content.education} />
        <Certifications items={content.certifications} />
        <ContactForm profile={content.profile} />
      </main>
      <footer className="wrap">
        <span>
          © {new Date().getFullYear()} {content.profile.name}
        </span>
        <a href="/admin/login/">Superadmin</a>
        <a href="#home">Back to top ↑</a>
      </footer>
    </>
  );
}
