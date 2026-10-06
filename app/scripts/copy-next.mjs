import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
for (const entry of [
  "index.html",
  "_next",
  "admin",
  "dashboard",
  "404.html",
  "404",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
]) {
  if (existsSync("public/" + entry)) rmSync("public/" + entry, { recursive: true, force: true });
  if (existsSync("next/out/" + entry)) {
    mkdirSync("public", { recursive: true });
    cpSync("next/out/" + entry, "public/" + entry, { recursive: true });
  }
}
