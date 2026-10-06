"use client";
import { useEffect, useState } from "react";
import type { Skill } from "@/lib/types";
import { useSite } from "@/components/ui/SiteProvider";
import { SkillsScene } from "@/components/three/SkillsScene";
export function Skills({ items }: { items: Skill[] }) {
  const [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState(0);
  const { paused, toggleMotion } = useSite();
  useEffect(() => {
    setSelected(0);
    setFilter("All");
  }, [items]);
  const filters = ["All", ...new Set(items.map((s) => s.domain))];
  return (
    <section id="skills">
      <h2>A connected skill universe.</h2>
      <p className="section-intro">
        Explore the constellation or select a skill below. Every tool has a place in the bigger
        picture.
      </p>
      <div className="skills-layout">
        <div>
          <SkillsScene items={items} selected={selected} filter={filter} onSelect={setSelected} />
          <div className="motion-controls">
            <button onClick={toggleMotion} aria-pressed={paused}>
              {paused ? "Resume scene motion" : "Pause scene motion"}
            </button>
          </div>
        </div>
        <div>
          <div className="filter-row" role="group" aria-label="Filter skills by domain">
            {filters.map((f) => (
              <button
                key={f}
                className="filter"
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                  setSelected(
                    Math.max(
                      0,
                      items.findIndex((s) => f === "All" || s.domain === f),
                    ),
                  );
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="skill-list">
            {items.map(
              (s, i) =>
                (filter === "All" || s.domain === filter) && (
                  <button
                    key={i}
                    className={"skill-chip" + (i === selected ? " selected" : "")}
                    title={s.level}
                    aria-label={s.name + ": " + s.level}
                    onMouseEnter={() => setSelected(i)}
                    onFocus={() => setSelected(i)}
                    onClick={() => setSelected(i)}
                  >
                    {s.name}
                  </button>
                ),
            )}
          </div>
          <p className="hint">Hover, tap or focus a skill to reveal its experience level.</p>
        </div>
      </div>
    </section>
  );
}
