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

## Variables

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Base de la API. |
| `VITE_USE_MOCKS` | `false` en producción (es el valor por defecto en build). |

Se leen en tiempo de build: cambiarlas requiere reconstruir.

## Service worker de mocks

`public/mockServiceWorker.js` se copia a `dist/` pero solo se registra cuando `VITE_USE_MOCKS=true`. Si prefieres no desplegarlo, elimínalo del build en el pipeline.

## Checklist antes de publicar

- [ ] `npm run verify` y `npm run e2e` en verde.
- [ ] `VITE_API_URL` apunta al entorno correcto.
- [ ] CSP con el `connect-src` real.
- [ ] Token en cookie `httpOnly` si el backend lo soporta (ver `docs/API_CONTRACT.md`).
