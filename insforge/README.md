# Base de datos InsForge

1. Crea el proyecto en [insforge.dev](https://insforge.dev).
2. SQL Editor (o migración CLI) → ejecuta `schema.sql`.
3. Opcional para demo: ejecuta `seed.sql`.
4. Auth → Users → crea el usuario de jefatura.
5. Corre `activar_jefatura.sql` con su UUID.
6. Storage → crea el bucket privado `box-evidence`.
7. Copia Project URL y anon key a `web/.env.local` y a los `--dart-define` de Flutter.

Desde la web de jefatura (Equipo) generas códigos para bodega.
