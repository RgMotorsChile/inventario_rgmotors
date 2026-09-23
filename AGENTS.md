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
