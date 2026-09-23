# Inventario RG Motors

Panel web (jefatura) + app Flutter (bodega). Backend: **Supabase** (`tuybpizjeszgwtcvunmp`, tenant `rg-motors`).

| Carpeta | Uso |
|---------|-----|
| `web/` | Next.js — panel, RPC, snapshot bodega |
| `rg_inventario/` | Flutter — escaneo, entregas, evidencias |
| `insforge/` | Histórico SQL (ya no activo) |
| `docs/SUPABASE-CUTOVER.md` | Cutover y checklist |

## Panel web

```bash
cd web
cp .env.example .env.local   # completar SUPABASE_*
npm i
npm run create-admin         # primera jefatura
npm run dev
```

## Flutter

```bash
cd rg_inventario
flutter pub get
flutter run \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=JEFATURA_WEB_URL=https://tu-panel
```
