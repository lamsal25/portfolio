# Govinda Lamsal: managed portfolio
User-directed migration to a professionally structured Next.js application.
Next App Router, TypeScript, React components, isolated hooks and lazy Three.js.
Architecture studio and existing public design preserved.
Next exported pages use the host's asset service; live data comes from protected APIs.
Persistent D1 database; no Supabase credentials required.
Public contact form writes private enquiries into an inbox.
Dashboard manages profile, skills, certifications, projects, education and experience.
Only the fixed superadmin account can authenticate; no visitor signup.
Private one-time setup link, salted password hashes, secure cookies, origin validation,
rate limits, parameterized database operations, validated fields and session revocation.
Browser storage only stores theme preference, never secrets or portfolio content.
No privately seeded password or raw token appears in source.
