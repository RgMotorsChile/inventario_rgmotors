# Web jefatura · RG Motors

Panel de control para jefatura. Bodega usa la app Flutter.

## Arranque

1. Copia `.env.example` a `.env.local` con URL y anon key de Supabase.
2. En Supabase ya debe estar corrido `../supabase/schema.sql`.
3. Crea el primer usuario en Authentication y actívalo:

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

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Authentication → URL Configuration: agrega el dominio de Vercel en Redirect URLs.

En la app móvil:

```
--dart-define=JEFATURA_WEB_URL=https://tu-dominio.vercel.app
```
