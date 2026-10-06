"use client";
import { useRef } from "react";
import { useSite } from "@/components/ui/SiteProvider";
import { useThreeScene } from "@/hooks/useThreeScene";
import { textSprite } from "./sprites";
import type { Skill } from "@/lib/types";
export function SkillsScene({
  items,
  selected,
  filter,
  onSelect,
}: {
  items: Skill[];
  selected: number;
  filter: string;
  onSelect: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme, paused, reduced } = useSite();
  const status = useThreeScene(
    ref,
    ({ T, scene, camera, host }) => {
      camera.position.z = 9.7;
      const group = new T.Group();
      scene.add(group);
      const nodes = items.map((s, i) => {
        const y = 1 - (2 * (i + 0.5)) / items.length,
          r = Math.sqrt(1 - y * y),
          angle = i * Math.PI * (3 - Math.sqrt(5));
        const position = new T.Vector3(
          Math.cos(angle) * r * 2.8,
          y * 2.8,
          Math.sin(angle) * r * 2.8,
        );
        const node = new T.Mesh(
          new T.OctahedronGeometry(0.075),
          new T.MeshStandardMaterial({ color: 0xefaaa3, roughness: 0.4 }),
        );
        node.position.copy(position);
        node.userData.index = i;
        node.visible = filter === "All" || s.domain === filter;
        node.scale.setScalar(i === selected ? 2.4 : 1);
        group.add(node);
        const label = textSprite(T, s.name, theme === "dark", 27);
        label.scale.set(1.55, 0.25, 1);
        label.position.copy(position).add(new T.Vector3(0, 0.17, 0));
        label.material.opacity = i === selected ? 1 : 0.68;
        label.visible = node.visible;
        group.add(label);
        return node;
      });
      group.add(
        new T.Mesh(
          new T.IcosahedronGeometry(0.52, 1),
          new T.MeshStandardMaterial({
            color: 0x8090a8,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          }),
        ),
      );
      const ray = new T.Raycaster();
      host.onclick = (e) => {
        const r = host.getBoundingClientRect();
        ray.setFromCamera(
          new T.Vector2(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            (-(e.clientY - r.top) / r.height) * 2 + 1,
          ),
          camera,
        );
        const hits = ray.intersectObjects(nodes.filter((n) => n.visible));
        if (hits.length) onSelect(hits[0].object.userData.index);
      };
      const active = nodes[selected]?.position,
        angle = active ? Math.atan2(active.x, active.z) : 0;
      return ({ time, moving }) => {
        group.rotation.y = -angle + (moving ? Math.sin(time * 0.2) * 0.025 : 0);
      };
    },
    [items, theme, paused, reduced, selected, filter],
    paused,
    reduced,
  );
  return (
    <div className="skill-scene" ref={ref}>
      {status !== "ready" && (
        <div className="loader">
          {status === "loading"
            ? "Building skill constellation…"
            : "Select a skill below to explore."}
        </div>
      )}
      <div className="skill-detail" aria-live="polite">
        <strong>{items[selected]?.name || "Skills"}</strong>
        <span>{items[selected]?.level || "New skills will appear here."}</span>
      </div>
    </div>
  );
}
