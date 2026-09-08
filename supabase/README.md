# Base de datos (tú la creas)

1. Proyecto nuevo en [supabase.com](https://supabase.com).
2. SQL Editor → pega y ejecuta `schema.sql`.
3. Opcional para demo: ejecuta `seed.sql`.
4. Authentication → Users → Add user (el de jefatura).
5. SQL:

```sql
update public.profiles
set role = 'jefatura', active = true
where id = '<uuid>';
```

6. Authentication → Providers → Email:
   - Confirm email: apagado mientras pruebas, encendido en producción.
   - El registro público puede quedar activo: **sin código de invitación la cuenta nace inactiva**.
7. Copia Project URL y anon key. Nunca subas la service role key al repo.

Desde la web de jefatura (Equipo) generas códigos para bodega.
