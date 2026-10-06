"use client";
import { useState } from "react";
import { useSite } from "@/components/ui/SiteProvider";
export function Navigation() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useSite();
  return (
    <>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <header>
        <div className="nav wrap">
          <a className="brand" href="#home" aria-label="Govinda Lamsal home">
            govinda<span>.</span>
          </a>
          <nav className={open ? "open" : ""} id="main-nav" aria-label="Main navigation">
            {[
              ["about", "About"],
              ["skills", "Skills"],
              ["projects", "Projects"],
              ["experience", "Journey"],
              ["certifications", "Credentials"],
              ["contact", "Get in touch"],
            ].map(([id, label]) => (
              <a key={id} href={"#" + id} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="tools">
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " mode"}
            >
              {theme === "dark" ? "☼" : "☾"}
            </button>
            <button
              className="icon-button menu"
              aria-label="Toggle navigation"
              aria-controls="main-nav"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
