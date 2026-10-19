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

`frame-src` solo admite los campos alojados de las pasarelas (Stripe, Wompi, Mercado Pago): la tarjeta
se escribe en ellos y a nuestro servidor solo llega un token (`src/features/payments/gateway.ts`, hoy
simulada). Al conectar una pasarela real, añade su script a `script-src` (p. ej. `https://js.stripe.com`)
y deja en `frame-src` solo la que uses.

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

La voz de Clipper (`api/tts`, `server/tts/tts.ts`) habla con voz neural natural si hay una de estas
claves: `GEMINI_API_KEY` (la elegida: gratis con una clave de Google AI Studio, sin tarjeta; voz Achird
en español e inglés; el PCM que devuelve se envuelve en WAV), `ELEVENLABS_API_KEY` (la voz «Eric» de Clipper,
plan gratuito limitado),
`AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (capa gratuita mensual; Gonzalo y Andrew por defecto) u
`OPENAI_API_KEY` (`gpt-4o-mini-tts`, voz onyx). Con varias, `TTS_PROVIDER` elige; `TTS_VOICE`,
`TTS_VOICE_ES` y `TTS_VOICE_EN` cambian la voz. Sin ninguna, la app usa la voz del navegador. El
idioma lo pone la app (español o inglés según su configuración). En local, `npm run dev` atiende
`/api/tts` con el mismo código (`vite.config.ts`): basta con poner la clave en `.env.local`. `Permissions-Policy` permite el
micrófono al propio sitio (`microphone=(self)`): sin eso el modo voz no escucha. La CSP permite
`media-src 'self' blob:` porque el audio de la voz natural se reproduce desde un `blob:`.

### Sesión firmada de las funciones que cuestan dinero

La voz (`/api/tts`), Clipper (`/api/clipper`, `/api/clipper/feedback`), la narración (`/api/narrative`)
y la cola de WhatsApp (`/api/whatsapp/queue`) piden `Authorization: Bearer <token>`: un JWT HS256
firmado con `SESSION_SECRET` (ver `server/auth/session.ts`). Cada sesión tiene cupo por minuto y por
día, además del tope por IP. Sin `SESSION_SECRET` esas funciones responden 503: mejor no atender que
atender a cualquiera.

| Variable (servidor) | Para qué |
|---|---|
| `SESSION_SECRET` | Firma las sesiones. 32 caracteres o más: `openssl rand -base64 48`. En `npm run dev` se usa uno al azar por proceso. |
| `SESSION_DEMO_LOGIN` | `off` apaga `POST /api/session`, que emite la sesión a las cuentas de la demo con su código. Apágalo cuando el backend real emita el token al entrar (con el mismo secreto). |
| `DEMO_OTP_CODE` | El código de la demo para esa emisión (por defecto `246810`). |

El cliente de la reserva en línea pide `POST /api/session/guest`: media hora, solo la voz, con tope por IP.

### Cola de WhatsApp

La app ya no envía mensajes: los encola en `/api/whatsapp/queue` y el cron `/api/cron/whatsapp`
(cada 5 minutos, `vercel.json`) envía lo que toca con hasta 3 intentos. La cola necesita un almacén
compartido; sin él, en Vercel responde 501 y los mensajes quedan como simulados.

| Variable (servidor) | Para qué |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Dónde vive la cola (Upstash Redis por REST; la integración de Vercel las pone sola). En local se usa la memoria del servidor de desarrollo, que hace de cron cada 30 s. |
| `CRON_SECRET` | Vercel lo manda al cron como `Authorization: Bearer`; sin él, el cron no atiende. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | La cuenta de WhatsApp Cloud API. Sin ellas los mensajes se dan por enviados en modo simulado. |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | El webhook (`/api/whatsapp/webhook`) que recibe las respuestas de los clientes y el estado de lo enviado. En Meta › WhatsApp › Configuración se pone la URL `https://<dominio>/api/whatsapp/webhook`, el token de verificación y se suscribe a `messages`. Sin ellos el webhook no atiende. |

Las plantillas deberían llevar botones de respuesta rápida con payload `CONFIRM`, `RESCHEDULE` y `CANCEL`: se
entienden sin adivinar. El texto libre también se clasifica (reglas en `server/whatsapp/inbound.ts`).

En el plan Hobby de Vercel los crons corren como mucho una vez al día: para recordatorios a tiempo
hace falta Pro (o un cron externo que llame a la ruta con el `CRON_SECRET`).

## Service worker de mocks

`public/mockServiceWorker.js` se copia a `dist/` pero solo se registra cuando `VITE_USE_MOCKS=true`. Si prefieres no desplegarlo, elimínalo del build en el pipeline.

## Checklist antes de publicar

- [ ] `npm run verify` y `npm run e2e` en verde.
- [ ] `VITE_API_URL` apunta al entorno correcto.
- [ ] CSP con el `connect-src` real.
- [ ] Token en cookie `httpOnly` si el backend lo soporta (ver `docs/API_CONTRACT.md`).
- [ ] Si hay campaña de feedback activa: variables del servidor definidas y hoja creada (`docs/FEEDBACK_LOOP.md`).
- [ ] Voz de Clipper: clave del servicio de voz definida (si no, habla con la voz del navegador).
- [ ] `SESSION_SECRET` definido (sin él, voz, Clipper, narración y WhatsApp responden 503) y `SESSION_DEMO_LOGIN=off` si ya hay backend real.
- [ ] WhatsApp: Upstash y `CRON_SECRET` definidos, plan con crons cada 5 minutos.
- [ ] Pasarela real conectada en `tokenizeCard` y su script en la CSP; el número de tarjeta nunca llega al servidor.
