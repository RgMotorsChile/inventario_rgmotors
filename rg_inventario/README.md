# App móvil · encargado de bodega

Jefatura no entra aquí: usa `../web`.

```bash
flutter pub get
flutter run --dart-define=INSFORGE_URL=https://TU-PROYECTO.insforge.app --dart-define=INSFORGE_ANON_KEY=TU_ANON_KEY --dart-define=JEFATURA_WEB_URL=https://tu-web.vercel.app
```

El primer acceso pide un **código de invitación** generado en la web (Equipo).

Para ingresar mercadería: pestaña **Ingreso** → foto del elemento → elegir el nombre de la lista → cantidad.
