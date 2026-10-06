"use client";
import { useRef } from "react";
import type * as THREE from "three";
import seed from "@/data/seed.json";
import { useSite } from "@/components/ui/SiteProvider";
import { useThreeScene } from "@/hooks/useThreeScene";
import { textSprite } from "./sprites";
export function ArchitectureScene({
  mode,
  selected,
  onSelect,
  pulse,
}: {
  mode: number;
  selected: number;
  onSelect: (index: number) => void;
  pulse: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    selectedRef = useRef(selected),
    pulseRef = useRef(pulse);
  selectedRef.current = selected;
  pulseRef.current = pulse;
  const { theme, paused, reduced } = useSite();
  const status = useThreeScene(
    ref,
    ({ T, scene, camera, host }) => {
      const dark = theme === "dark",
        config = seed.architectures[mode],
        group = new T.Group();
      scene.add(group);
      camera.position.set(0, 5.5, 8.4);
      camera.lookAt(0, 0.1, 0);
      const components: { platform: THREE.Group; highlight: THREE.LineSegments }[] = [];
      const material = (accent = false) =>
        new T.MeshStandardMaterial({
          color: accent ? 0xefaaa3 : dark ? 0x91a5bd : 0x405973,
          roughness: 0.45,
          metalness: 0.35,
        });
      const box = (w: number, h: number, d: number, accent = false) =>
        new T.Mesh(new T.BoxGeometry(w, h, d), material(accent));
      config.nodes.forEach((node, i) => {
        const platform = new T.Group();
        platform.position.set(...(node.position as [number, number, number]));
        platform.userData.component = i;
        const slab = box(1.02, 0.08, 0.85);
        slab.position.y = -0.53;
        platform.add(slab);
        const outline = new T.LineSegments(
          new T.EdgesGeometry(slab.geometry),
          new T.LineBasicMaterial({
            color: dark ? 0x6c819e : 0x657e99,
            transparent: true,
            opacity: 0.6,
          }),
        );
        outline.position.copy(slab.position);
        platform.add(outline);
        if (node.kind === "server") {
          const rack = box(0.55, 0.92, 0.45);
          rack.position.y = 0.02;
          platform.add(rack);
          for (let j = 0; j < 4; j++) {
            const drive = box(0.42, 0.045, 0.035, j === 0);
            drive.position.set(0, -0.28 + j * 0.18, 0.245);
            platform.add(drive);
          }
        } else if (node.kind === "database") {
          const db = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.82, 24), material());
          db.position.y = -0.05;
          platform.add(db);
          for (let j = 0; j < 3; j++) {
            const band = new T.Mesh(new T.TorusGeometry(0.345, 0.014, 6, 30), material(true));
            band.rotation.x = Math.PI / 2;
            band.position.y = -0.4 + j * 0.35;
            platform.add(band);
          }
        } else if (node.kind === "bucket") {
          const bucket = new T.Mesh(
            new T.CylinderGeometry(0.38, 0.28, 0.72, 20, 1, true),
            new T.MeshStandardMaterial({
              color: dark ? 0x91a5bd : 0x405973,
              side: T.DoubleSide,
              roughness: 0.4,
              metalness: 0.3,
            }),
          );
          bucket.position.y = -0.08;
          platform.add(bucket);
          const rim = new T.Mesh(new T.TorusGeometry(0.38, 0.025, 8, 32), material(true));
          rim.rotation.x = Math.PI / 2;
          rim.position.y = 0.28;
          platform.add(rim);
          const base = new T.Mesh(new T.CircleGeometry(0.28, 20), material());
          base.rotation.x = -Math.PI / 2;
          base.position.y = -0.44;
          platform.add(base);
        } else if (node.kind === "browser") {
          const screen = box(0.9, 0.63, 0.07);
          screen.position.y = 0.05;
          platform.add(screen);
          const display = box(0.78, 0.48, 0.018, true);
          display.position.set(0, 0.04, 0.05);
          platform.add(display);
          const stand = box(0.08, 0.2, 0.08);
          stand.position.y = -0.34;
          platform.add(stand);
          const foot = box(0.42, 0.04, 0.25);
          foot.position.y = -0.44;
          platform.add(foot);
          const glyph = textSprite(T, mode === 1 ? "JPG" : "</>", dark);
          glyph.scale.set(0.65, 0.18, 1);
          glyph.position.set(0, 0.03, 0.11);
          platform.add(glyph);
        } else if (node.kind === "router") {
          const hub = box(0.75, 0.2, 0.65, true);
          hub.position.y = -0.22;
          platform.add(hub);
          for (let j = 0; j < 3; j++) {
            const port = box(0.12, 0.04, 0.07);
            port.position.set(-0.22 + j * 0.22, -0.2, 0.36);
            platform.add(port);
          }
        } else if (node.kind === "function") {
          const fn = box(0.62, 0.64, 0.62, true);
          platform.add(fn);
          const glyph = textSprite(T, "λ", dark);
          glyph.scale.set(0.5, 0.4, 1);
          glyph.position.set(0, 0, 0.4);
          platform.add(glyph);
        } else {
          platform.add(box(0.62, 0.15, 0.62, true));
          for (let j = 0; j < 4; j++) {
            const pin = box(0.07, 0.03, 0.18);
            pin.position.set(-0.24 + j * 0.16, 0, 0.4);
            platform.add(pin);
          }
          const lens = new T.Mesh(new T.TorusGeometry(0.23, 0.026, 8, 28), material());
          lens.position.y = 0.38;
          platform.add(lens);
        }
        const title = textSprite(T, node.name, dark);
        title.position.set(0, 0.83, 0);
        platform.add(title);
        const highlight = new T.LineSegments(
          new T.EdgesGeometry(new T.BoxGeometry(1.12, 1.65, 1)),
          new T.LineBasicMaterial({ color: 0xefaaa3, transparent: true, opacity: 0.45 }),
        );
        highlight.position.y = 0.16;
        platform.add(highlight);
        components.push({ platform, highlight });
        group.add(platform);
      });
      config.edges.forEach(([a, b]) => {
        const from = new T.Vector3(...(config.nodes[a].position as [number, number, number])).add(
            new T.Vector3(0, -0.3, 0),
          ),
          to = new T.Vector3(...(config.nodes[b].position as [number, number, number])).add(
            new T.Vector3(0, -0.3, 0),
          );
        group.add(
          new T.Line(
            new T.BufferGeometry().setFromPoints([from, to]),
            new T.LineBasicMaterial({ color: dark ? 0x647b98 : 0x688097 }),
          ),
        );
        const arrow = new T.Mesh(new T.ConeGeometry(0.055, 0.16, 6), material(true));
        arrow.position.copy(from).lerp(to, 0.65);
        arrow.quaternion.setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          to.clone().sub(from).normalize(),
        );
        group.add(arrow);
      });
      const paths = config.routes.map((route) =>
        route.map((i) =>
          new T.Vector3(...(config.nodes[i].position as [number, number, number])).add(
            new T.Vector3(0, 0.35, 0),
          ),
        ),
      );
      const packets = Array.from(
        { length: matchMedia("(max-width:640px)").matches ? 2 : 4 },
        () => {
          const dot = new T.Mesh(
            new T.SphereGeometry(0.06, 8, 8),
            new T.MeshBasicMaterial({ color: 0xefaaa3 }),
          );
          group.add(dot);
          return dot;
        },
      );
      const ray = new T.Raycaster();
      const click = (event: MouseEvent) => {
        const r = host.getBoundingClientRect();
        ray.setFromCamera(
          new T.Vector2(
            ((event.clientX - r.left) / r.width) * 2 - 1,
            (-(event.clientY - r.top) / r.height) * 2 + 1,
          ),
          camera,
        );
        const hits = ray.intersectObjects(
          components.map((x) => x.platform),
          true,
        );
        if (hits.length) {
          let object: THREE.Object3D | null = hits[0].object;
          while (object && object.userData.component === undefined) object = object.parent;
          if (object) onSelect(object.userData.component);
        }
      };
      host.onclick = click;
      let lastPulse = pulseRef.current,
        start = -100;
      return ({ time, pointer, scroll, moving }) => {
        if (lastPulse !== pulseRef.current) {
          lastPulse = pulseRef.current;
          start = time;
        }
        group.rotation.y = reduced ? 0 : pointer.x * 0.13 + scroll * 0.1;
        group.rotation.x = reduced ? 0 : -pointer.y * 0.04;
        camera.position.y = 5.5 + (reduced ? 0 : scroll * 0.25);
        camera.lookAt(0, 0.1, 0);
        components.forEach((n, i) => (n.highlight.visible = i === selectedRef.current));
        packets.forEach((dot, i) => {
          const route = paths[i % paths.length],
            sending = time - start < 4;
          let progress = moving
            ? ((sending ? (time - start) / 4 : time * 0.1) + i * 0.22) % 1
            : i * 0.22;
          progress = Math.max(0, progress);
          const position = progress * (route.length - 1),
            segment = Math.min(Math.floor(position), route.length - 2);
          dot.position.copy(route[segment]).lerp(route[segment + 1], position - segment);
          dot.scale.setScalar(sending ? 1.65 : 1);
        });
      };
    },
    [theme, mode, paused, reduced, selected],
    paused,
    reduced,
  );
  return (
    <div ref={ref} className="hero-scene" aria-hidden="true">
      {status !== "ready" && (
        <div className="loader">
          {status === "loading"
            ? "Initializing architecture…"
            : "Explore the architecture using the component buttons below."}
        </div>
      )}
    </div>
  );
}
