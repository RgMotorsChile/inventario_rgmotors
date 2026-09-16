# Inventario RG Motors

Sistema de bodega para la automotora: cada salida queda atada a una **patente** o a un **trabajador**.

| Pieza | Quién la usa |
| --- | --- |
| `rg_inventario/` | App móvil del encargado de bodega |
| `web/` | Panel web de jefatura (métricas, rastro, Excel, catálogo, invitaciones) |
| `insforge/` | SQL para que armes la base en InsForge |

Repositorio: [inventario_rgmotors](https://github.com/MathiasAlejandr0/inventario_rgmotors).

## Qué hace cada vista

**Bodega (celular)**  
Vista principal: lista de todo el inventario, búsqueda y botón para sumar (foto + nombre + cantidad). El resto (salidas, trabajadores) está en Más.

**Jefatura (web)**  
Login solo si el perfil es `jefatura` y está activo. Métricas, alertas, rastro vehículo/trabajador, Excel, alta de SKUs, patentes, trabajadores y códigos de acceso.

## Seguridad

- El rol **no** se elige en el celular. Sale del código de invitación o de lo que active jefatura.
- Las escrituras van por RPCs. Bodega no puede crear SKUs ni darse rol de jefatura.
- Cuentas sin código quedan `active = false`.
- RLS: solo personal activo lee; auditoría y códigos solo jefatura.

## Cómo levantarlo

1. Crea el proyecto en [InsForge](https://insforge.dev) y corre `insforge/schema.sql`.
2. Activa el primer usuario de jefatura (ver `insforge/README.md`).
3. Web: `cd web && cp .env.example .env.local && npm i && npm run dev`
4. App:

```bash
cd rg_inventario
flutter run --dart-define=INSFORGE_URL=https://xxx.insforge.app --dart-define=INSFORGE_ANON_KEY=... --dart-define=JEFATURA_WEB_URL=http://localhost:3000
```
