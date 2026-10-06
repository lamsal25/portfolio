// Next.js produces the frontend; this edge API owns persistence and authorization.
import { bindings } from "./lib/bindings.server";
import { apiRoute } from "./portfolio/api.server";
import { HttpError, session } from "./portfolio/auth.server";
function secure(response: Response, api = false) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (api) headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}
export default {
  async fetch(request: Request) {
    try {
      const env = bindings(),
        url = new URL(request.url),
        path = url.pathname;
      if (path.startsWith("/api/")) {
        if (!env.DB) throw new HttpError(503, "The database is not available yet.");
        return secure(await apiRoute(env.DB, request), true);
      }
      if (
        (path === "/dashboard" || path.startsWith("/dashboard/")) &&
        env.DB &&
        !(await session(env.DB, request))
      ) {
        return secure(Response.redirect(new URL("/admin/login/", request.url).href, 302));
      }
      const assets = (env as unknown as { ASSETS?: { fetch(r: Request): Promise<Response> } })
        .ASSETS;
      if (!assets)
        throw new HttpError(503, "The application is starting. Please try again shortly.");
      if (
        path === "/" ||
        path === "/dashboard" ||
        path === "/dashboard/" ||
        path === "/admin/login" ||
        path === "/admin/login/" ||
        path === "/admin/setup" ||
        path === "/admin/setup/"
      ) {
        const asset = new URL(request.url);
        asset.pathname = path === "/" ? "/index.html" : path.replace(/\/$/, "") + "/index.html";
        return secure(
          await assets.fetch(new Request(asset, request)),
          path.startsWith("/dashboard") || path.startsWith("/admin"),
        );
      }
      return secure(await assets.fetch(request));
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof HttpError ? error.message : "The request could not be completed.";
      return secure(Response.json({ error: message }, { status }), true);
    }
  },
};
