"use client";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { useSite } from "@/components/ui/SiteProvider";
function safeLink(value: string | null) {
  try {
    return value && new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
export function Projects({ items }: { items: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null);
  const { reduced } = useSite();
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  function close() {
    dialog.current?.close();
    setSelected(null);
    trigger.current?.focus();
  }
  return (
    <section id="projects">
      <h2>Ideas made practical.</h2>
      <p className="section-intro">
        Development work, cloud labs and system concepts. Open a project to see the problem,
        architecture and contribution.
      </p>
      <div className="projects">
        {items.map((p, i) => (
          <button
            className="project"
            key={i}
            aria-haspopup="dialog"
            aria-label={"Open " + p.name + " details"}
            onClick={(e) => {
              trigger.current = e.currentTarget;
              setSelected(p);
            }}
            onPointerMove={(e) => {
              if (reduced || e.pointerType === "touch") return;
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.transform =
                "rotateX(" +
                (0.5 - (e.clientY - r.top) / r.height) * 5 +
                "deg) rotateY(" +
                ((e.clientX - r.left) / r.width - 0.5) * 5 +
                "deg)";
            }}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            <div className="project-art">
              <span className="art-label">{p.art}</span>
              <div className="mini-flow">
                {p.tags.slice(0, 3).map((t, j) => (
                  <span key={j} className="mini-node">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="project-copy">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="project-open">View project ↗</span>
            </div>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="project-title"
        onCancel={() => {
          setSelected(null);
          trigger.current?.focus();
        }}
      >
        <button className="icon-button close" onClick={close} aria-label="Close project details">
          ×
        </button>
        {selected && (
          <>
            <span className="dialog-status">{selected.kind}</span>
            <h2 id="project-title">{selected.name}</h2>
            <p>{selected.description}</p>
            <ul>
              {selected.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <div className="tags">
              {selected.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <p>
              <a
                className="text-link"
                href={
                  safeLink(selected.link) ||
                  "mailto:lamsalgovinda25@gmail.com?subject=" +
                    encodeURIComponent("About " + selected.name)
                }
                target={safeLink(selected.link) ? "_blank" : undefined}
                rel="noopener noreferrer"
              >
                {safeLink(selected.link) ? "Open project ↗" : "Ask about this project ↗"}
              </a>
            </p>
          </>
        )}
      </dialog>
    </section>
  );
}
