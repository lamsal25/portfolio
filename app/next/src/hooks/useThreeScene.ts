"use client";
import { useEffect, useState, type RefObject, type DependencyList } from "react";
import type * as THREE from "three";
type Frame = { time: number; pointer: { x: number; y: number }; scroll: number; moving: boolean };
export type SceneContext = {
  T: typeof THREE;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  host: HTMLDivElement;
};
export function useThreeScene(
  ref: RefObject<HTMLDivElement | null>,
  build: (context: SceneContext) => ((frame: Frame) => void) | void,
  dependencies: DependencyList,
  paused: boolean,
  reduced: boolean,
) {
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let cancelled = false,
      visible = false,
      raf = 0,
      last = 0,
      time = 0;
    let renderer: THREE.WebGLRenderer | undefined, scene: THREE.Scene | undefined;
    const pointer = { x: 0, y: 0 };
    const cleanups: (() => void)[] = [];
    import("three")
      .then((T) => {
        if (cancelled) return;
        try {
          scene = new T.Scene();
          const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
          camera.position.z = 9;
          const compact = matchMedia("(max-width:640px)").matches;
          renderer = new T.WebGLRenderer({
            alpha: true,
            antialias: !compact,
            powerPreference: "low-power",
          });
          renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.25 : 1.75));
          host.append(renderer.domElement);
          scene.add(new T.AmbientLight(0xffffff, 1.5));
          const light = new T.DirectionalLight(0xffffff, 3);
          light.position.set(4, 6, 5);
          scene.add(light);
          const fill = new T.PointLight(0xefaaa3, 16);
          fill.position.set(-3, 1, 4);
          scene.add(fill);
          const update = build({ T, scene, camera, renderer, host });
          const frame = (now: number) => {
            raf = 0;
            if (cancelled || document.hidden || !visible) return;
            const dt = Math.min((now - (last || now)) / 1000, 0.04);
            last = now;
            if (!paused && !reduced) time += dt;
            update?.({
              time,
              pointer,
              scroll: Math.min(scrollY / Math.max(1, innerHeight), 2),
              moving: !paused && !reduced,
            });
            renderer!.render(scene!, camera);
            if (!paused && !reduced) wake();
          };
          function wake() {
            if (!raf && !cancelled && !document.hidden && visible)
              raf = requestAnimationFrame(frame);
          }
          const resize = () => {
            renderer!.setSize(host!.clientWidth, host!.clientHeight);
            camera.aspect = host!.clientWidth / Math.max(1, host!.clientHeight);
            camera.updateProjectionMatrix();
            wake();
          };
          const move = (e: PointerEvent) => {
            const rect = host!.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = (-(e.clientY - rect.top) / rect.height) * 2 + 1;
            wake();
          };
          const visibility = () => {
            last = 0;
            wake();
          };
          const leave = () => {
            pointer.x = 0;
            pointer.y = 0;
            wake();
          };
          const lost = (e: Event) => {
            e.preventDefault();
            visible = false;
            setStatus("fallback");
          };
          const ro = new ResizeObserver(resize);
          ro.observe(host);
          resize();
          const io = new IntersectionObserver(
            ([e]) => {
              visible = e.isIntersecting;
              wake();
            },
            { rootMargin: "100px" },
          );
          io.observe(host);
          host.addEventListener("pointermove", move);
          host.addEventListener("pointerleave", leave);
          host.addEventListener("webglcontextlost", lost, true);
          window.addEventListener("scroll", wake, { passive: true });
          document.addEventListener("visibilitychange", visibility);
          cleanups.push(() => {
            ro.disconnect();
            io.disconnect();
            host.removeEventListener("pointermove", move);
            host.removeEventListener("pointerleave", leave);
            host.removeEventListener("webglcontextlost", lost, true);
            window.removeEventListener("scroll", wake);
            document.removeEventListener("visibilitychange", visibility);
          });
          setStatus("ready");
          wake();
        } catch {
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      if (scene) {
        const dispose = new Set<{ dispose: () => void }>();
        scene.traverse((o: any) => {
          if (o.geometry) dispose.add(o.geometry);
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            if (m) {
              dispose.add(m);
              if (m.map) dispose.add(m.map);
            }
        });
        dispose.forEach((x) => x.dispose());
      }
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, dependencies);
  return status;
}
