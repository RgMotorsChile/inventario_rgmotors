# Inventario RG Motors — notas para agentes

## Backend

**Supabase** (proyecto compartido `tuybpizjeszgwtcvunmp`, tenant `rg-motors`).

- Panel web: `@supabase/ssr` + service role en server
- Flutter: `supabase_flutter` + puente `JEFATURA_WEB_URL` → `/api/bodega/*` y `/api/rpc`
- Storage evidencias: bucket `box-evidence`
- Schema: migraciones en `rgmotors/supabase/migrations/` (no en InsForge)

La carpeta `insforge/` es **histórico**. No uses `@insforge/sdk` ni `insforge_flutter`.

## Credenciales

- Web: `.env.local` con `NEXT_PUBLIC_SUPABASE_*` y `SUPABASE_SERVICE_ROLE_KEY`
- Flutter: `--dart-define=SUPABASE_ANON_KEY=... --dart-define=JEFATURA_WEB_URL=...`
- Primera jefatura: `npm run create-admin` en `web/`

## Docs

Ver `docs/SUPABASE-CUTOVER.md` y `rgmotors/docs/SUPABASE-MULTITENANT.md`.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **InventarioRGmotors** (API base `https://mnbxih89.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
