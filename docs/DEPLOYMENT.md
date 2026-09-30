# Despliegue

## Build

```bash
npm ci --legacy-peer-deps
VITE_API_URL=https://api.tu-dominio.com/v1 npm run build
```

`dist/` es estático: cualquier CDN o servidor de archivos sirve. La app usa rutas limpias (`/usuarios`), así que el servidor debe reescribir todo a `index.html`. `vercel.json` ya lo hace y añade cabeceras de seguridad.

## Cabeceras y CSP

`vercel.json` define HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` y una CSP. Ajusta `connect-src` a la URL real de la API y, si el backend usa cookies, sirve API y front bajo el mismo sitio o configura CORS con `credentials`.

Los estilos usan `'unsafe-inline'` porque Tailwind y los tokens del tema se aplican en línea; los scripts no lo necesitan.

Las tipografías del selector de tema se cargan bajo demanda desde dos proveedores, así que la CSP los
incluye: Google Fonts (`fonts.googleapis.com` para el CSS, `fonts.gstatic.com` para los archivos) y
Fontshare (`api.fontshare.com` y `cdn.fontshare.com`), este último solo por Satoshi. Si prefieres no
depender de terceros, autoaloja los `woff2` y sustituye la URL de `stylesheet` en
`src/themes/fonts.ts`; Geist ya funciona así, empaquetada con la aplicación.

## Variables

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Base de la API. |
| `VITE_USE_MOCKS` | `false` en producción (es el valor por defecto en build). |

Se leen en tiempo de build: cambiarlas requiere reconstruir.

### Funciones de servidor (`api/`)

El feedback masivo usa funciones de Vercel (`api/feedback/*`) y un cron semanal (`vercel.json`).
Sus variables son **del servidor** —sin prefijo `VITE_`—: `GOOGLE_SERVICE_ACCOUNT_JSON`,
`ANTHROPIC_API_KEY`, `FEEDBACK_SHARE_WITH`, `FEEDBACK_ADMIN_KEY` y `CRON_SECRET`. Qué es cada una y
cómo prepararlas: `docs/FEEDBACK_LOOP.md`. `vercel.json` no reescribe `/api/*` a `index.html`.

## Service worker de mocks

`public/mockServiceWorker.js` se copia a `dist/` pero solo se registra cuando `VITE_USE_MOCKS=true`. Si prefieres no desplegarlo, elimínalo del build en el pipeline.

## Checklist antes de publicar

- [ ] `npm run verify` y `npm run e2e` en verde.
- [ ] `VITE_API_URL` apunta al entorno correcto.
- [ ] CSP con el `connect-src` real.
- [ ] Token en cookie `httpOnly` si el backend lo soporta (ver `docs/API_CONTRACT.md`).
- [ ] Si hay campaña de feedback activa: variables del servidor definidas y hoja creada (`docs/FEEDBACK_LOOP.md`).
