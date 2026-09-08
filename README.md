# Inventario RG Motors

Sistema de bodega para la automotora: cada salida queda atada a una **patente** o a un **trabajador**.

| Pieza | Quién la usa |
| --- | --- |
| `rg_inventario/` | App móvil del encargado de bodega |
| `web/` | Panel web de jefatura (métricas, rastro, Excel, catálogo, invitaciones) |
| `supabase/` | SQL para que armes la base |

Repositorio: [inventario_rgmotors](https://github.com/MathiasAlejandr0/inventario_rgmotors).

## Qué hace cada vista

**Bodega (celular)**  
Entrar con código de invitación. Usar pieza en una camioneta, asignar a un trabajador, escanear caja, foto de evidencia, ingreso suelto. Si no hay red, ve el último stock guardado.

**Jefatura (web)**  
Login solo si el perfil es `jefatura` y está activo. Métricas, alertas, rastro vehículo/trabajador, Excel de 6 hojas, alta de SKUs, patentes, trabajadores, cajas y códigos de acceso.

## Seguridad

- El rol **no** se elige en el celular. Sale del código de invitación o de lo que active jefatura.
- Las escrituras van por RPCs. Bodega no puede crear SKUs ni darse rol de jefatura.
- Cuentas sin código quedan `active = false`.
- RLS: solo personal activo lee; auditoría y códigos solo jefatura.

## Cómo levantarlo

1. Crea el proyecto en Supabase y corre `supabase/schema.sql` (tú haces la base).
2. Activa el primer usuario de jefatura (ver `supabase/README.md`).
3. Web: `cd web && cp .env.example .env.local && npm i && npm run dev`
4. App:

```bash
cd rg_inventario
flutter run --dart-define=SUPABASE_URL=https://xxx.supabase.co --dart-define=SUPABASE_ANON_KEY=eyJ... --dart-define=JEFATURA_WEB_URL=http://localhost:3000
```
