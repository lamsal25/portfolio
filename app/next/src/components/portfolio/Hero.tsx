"use client";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import seed from "@/data/seed.json";
import { useSite } from "@/components/ui/SiteProvider";
import { ArchitectureScene } from "@/components/three/ArchitectureScene";
export function Hero({ profile }: { profile: Profile }) {
  const [mode, setMode] = useState(0),
    [selected, setSelected] = useState(0),
    [pulse, setPulse] = useState(0);
  const { paused, toggleMotion, reduced } = useSite();
  const flow = seed.architectures[mode],
    component = flow.nodes[selected],
    names = profile.name.split(" ");
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="eyebrow">Cloud · Development · Education</div>
        <h1>
          {names[0]}
          <br />
          <span>{names.slice(1).join(" ")}.</span>
        </h1>
        <p className="roles">
          {profile.title} {profile.tagline}
        </p>
        <div className="actions">
          <a className="primary" href="#projects">
            Explore projects ↗
          </a>
          <a className="text-link" href="#contact">
            Get in touch
          </a>
        </div>
        <div className="hero-proof">
          <strong>AWS Certified Solutions Architect · NVIDIA-Certified Associate</strong>Cloud
          architecture, full-stack development and data science.
        </div>
      </div>
      <div className="hero-studio">
        <div className="studio-top">
          <strong>The architecture studio</strong>
          <div className="studio-actions">
            <button
              className="hero-pause"
              aria-label={paused ? "Resume scene motion" : "Pause scene motion"}
              aria-pressed={paused}
              onClick={toggleMotion}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              className="send-request"
              onClick={() => {
                setPulse((p) => p + 1);
                if (reduced || paused) setSelected(flow.nodes.length - 1);
              }}
            >
              Send a request ↗
            </button>
          </div>
        </div>
        <div className="architecture-tabs" role="group" aria-label="Choose architecture">
          {seed.architectures.map((a, i) => (
            <button
              key={a.name}
              aria-pressed={i === mode}
              onClick={() => {
                setMode(i);
                setSelected(0);
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
        <ArchitectureScene mode={mode} selected={selected} onSelect={setSelected} pulse={pulse} />
        <div className="flow-steps" role="group" aria-label="Architecture components">
          {flow.nodes.map((n, i) => (
            <button
              className={"flow-step" + (selected === i ? " selected" : "")}
              key={i}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
            >
              {n.name}
            </button>
          ))}
        </div>
        <div className="flow-detail" aria-live="polite">
          <strong>{component.name}</strong>
          <p>{component.description}</p>
        </div>
        <div className="scene-caption">
          Illustrative architectures, inspired by my projects. Move to inspect. Select to
          understand.
        </div>
      </div>
    </section>
  );
}
