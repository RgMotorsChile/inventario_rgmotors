# Inventario → Supabase (cutover completo)

Tenant: `rg-motors`  
Proyecto: `tuybpizjeszgwtcvunmp`  
Sheet: pestaña **RG MOTORS**.

## Estado verificado (2026-09-22)

| Pieza | Backend | Datos |
|-------|---------|-------|
| Auth panel + Flutter | Supabase Auth | **profiles = 0** → falta `npm run create-admin` |
| Inventario / RPCs | Supabase | 66 items, 63 patentes bodega, 19 categorías |
| Evidencias Storage | `box-evidence` | 0 fotos (nada legacy que migrar) |
| Catálogo vitrina RG/UC | `catalog_vehicles` | 41 RG + 18 UC (sin espejo KV) |

InsForge **retirado** del código de app. Carpeta `insforge/` = histórico SQL.

## Env (Vercel + local)

```
NEXT_PUBLIC_SUPABASE_URL=https://tuybpizjeszgwtcvunmp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
```

Flutter:

```
--dart-define=SUPABASE_ANON_KEY=...
--dart-define=JEFATURA_WEB_URL=https://tu-panel
```

## Primera jefatura

```bash
cd web
INV_ADMIN_EMAIL=... INV_ADMIN_PASSWORD='...' INV_ADMIN_NAME='...' npm run create-admin
```

## QA

1. `create-admin` → login panel
2. Flutter: login + snapshot + foto evidencia → thumb en Cajas
3. Sync patentes Sheet desde panel
4. Vitrina RG/UC lee `catalog_vehicles`

## Residual manual

- [ ] Crear jefatura (`create-admin`) — **bloquea login hasta hacerlo**
- [ ] Confirmar env Supabase en Vercel del panel inventario
- [ ] Apagar proyecto InsForge en dashboard cuando no haya deploys legacy
