# Web jefatura · RG Motors

Panel de control para jefatura. Bodega usa la app Flutter.

## Arranque

1. Copia `.env.example` a `.env.local` con URL y anon key de InsForge.
2. En InsForge ya debe estar corrido `../insforge/schema.sql`.
3. Crea el primer usuario en Auth y actívalo:

```sql
update public.profiles
set role = 'jefatura', active = true
where id = '<uuid-del-usuario>';
```

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Producción (Vercel)

Variables: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`.

En la app móvil:

```
--dart-define=JEFATURA_WEB_URL=https://tu-dominio.vercel.app
```
