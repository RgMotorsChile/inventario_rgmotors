# Inventario RG Motors (Flutter)

Auth + Storage: **Supabase**. Stock/RPC: panel web (`/api/bodega/*`, `/api/rpc`).

```bash
flutter run \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=JEFATURA_WEB_URL=https://tu-panel-inventario
```

Opcional: `SUPABASE_URL`, `BODEGA_API_URL` (si difiere de la web de jefatura).

Crear jefatura una vez: `npm run create-admin` en `web/`.
