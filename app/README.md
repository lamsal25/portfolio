# Govinda Lamsal — dynamic portfolio
The application frontend lives in `next/`: Next.js App Router, React,
TypeScript, reusable portfolio/admin components and Three.js scenes.
See [next/README.md](next/README.md) for architecture and administration.

The hosting adapter builds a Next.js static export and serves it alongside
an authenticated Cloudflare Worker API. Persistent content, contacts and
sessions are stored in D1. There is exactly one superadmin account and no signup.

## Main directories
- `next/src/app`: Next.js routes and metadata
- `next/src/components`: portfolio sections, 3D scenes and admin dashboard
- `next/src/hooks`, `next/src/lib`: lifecycle hooks, typed models and API client
- `src/portfolio`: validated backend API and server-side authentication
- `migrations`: additive schema and initial content
- `scripts`: Next.js asset export adapter
- `tests`: isolated API security and browser integration tests

## Development
Frontend: `cd next && npm ci && npm run dev`.
Production: `bun install && bun run build` from this directory.
Database migrations are applied by hosting at deployment.
The frontend expects a same-origin `/api` backend; see tests for a local D1 harness.
No raw setup token, password or user session is committed to source.
Password recovery sends a single-use, 30-minute reset link through Resend.
Set the Worker secrets `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to a Resend API
key and verified sender address for the email to be delivered.
For local `wrangler dev`, configure them in the ignored `app/.dev.vars` file;
for deployment, add them as Worker secrets. See [next/README.md](next/README.md)
for the local variable format.
