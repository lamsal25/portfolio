# Govinda Lamsal portfolio
Next.js App Router frontend with React, TypeScript and Three.js.
The public site and private dashboard are separate routes and components.

## Structure
- src/app: public page, admin login/setup, dashboard, global styles and metadata.
- src/components/portfolio: public portfolio sections.
- src/components/three: architecture and skill scenes.
- src/components/admin: authentication, record editors, inbox and password settings.
- src/components/ui: theme and motion state.
- src/hooks: Three.js lifecycle and cleanup.
- src/lib: typed models and API client.
- src/data: initial public content and illustrative architecture definitions.

## Dynamic content
Skills, certificates, projects, education, experience and profile content load
from the database through /api/content. The contact form posts to /api/contact.
The deployed frontend uses Next.js static export for fast asset serving.
It is a Next.js frontend with a separate Cloudflare Worker backend, not a
Next.js SSR or Next.js API-route deployment. The server source is ../src/portfolio,
and the persistent D1 schema is ../migrations. Supabase credentials are not needed.

## Build
Use Node.js 22 or later.
Run npm ci and npm run build in this directory.
Run bun run build from the parent app directory to build the complete hosted app.
The parent build copies exported Next assets into the host's static asset directory.

## Administration
The only account is lamsalgovinda25@gmail.com, with superadmin access.
No public signup or role assignment exists. The account activates through a private,
one-time setup link. The raw setup token is not committed. Set your own password;
the database stores a salted PBKDF2-SHA256 hash. Sessions use opaque random tokens,
stored only as hashes in the database and sent in Secure, HttpOnly, SameSite=Strict
cookies with an eight-hour lifetime. Every private API validates the session.
All mutations validate origin and input, and authentication/contact routes are limited.
Changing your password revokes every existing session.

## Inbox
Messages include name, email, subject, body, time and status. Opening a new message
marks it read. Reply opens an email draft; marking replied is an explicit action.
Archive preserves a message, while Delete asks for confirmation and removes it.

## Checks
From the parent app directory:
- bun run typecheck
- npm --prefix next run typecheck
- bun run test:portfolio
- bun run test:browser (install Playwright Chromium first)
The integration and browser tests create isolated local D1 databases, never production.
Set PLAYWRIGHT_CHROMIUM_EXECUTABLE if Chromium is already installed.

## Production data
Migrations run only at deployment and seed records with INSERT OR IGNORE.
Redeployments do not overwrite dashboard edits. Container disks or browser storage
are never used for content, messages, passwords or sessions.
