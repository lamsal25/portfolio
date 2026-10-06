"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type State = {
  theme: string;
  toggleTheme: () => void;
  paused: boolean;
  toggleMotion: () => void;
  reduced: boolean;
};
const Context = createContext<State>({
  theme: "dark",
  toggleTheme: () => {},
  paused: false,
  toggleMotion: () => {},
  reduced: false,
});
export function SiteProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("dark"),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("govinda-theme");
    } catch {}
    setTheme(saved || (matchMedia("(prefers-color-scheme:light)").matches ? "light" : "dark"));
    const query = matchMedia("(prefers-reduced-motion:reduce)");
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("govinda-theme", theme);
    } catch {}
  }, [theme]);
  return (
    <Context.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        paused,
        toggleMotion: () => setPaused((p) => !p),
        reduced,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSite = () => useContext(Context);
