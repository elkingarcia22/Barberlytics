# Contrato de API

Lo que el front espera del backend. El backend simulado (`src/mocks/handlers.ts`) implementa exactamente esto, así que sirve de referencia ejecutable.

## Convenciones

- Base: `VITE_API_URL` (por defecto `/api`). JSON en ambos sentidos, `Accept: application/json`.
- Autenticación: `Authorization: Bearer <accessToken>`. Un `401` en cualquier endpoint cierra la sesión en el cliente.
- Fechas en ISO 8601 UTC. Ids como cadenas opacas.
- Listados devuelven siempre el mismo sobre:

```json
{ "items": [ … ], "meta": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
```

- Parámetros de listado: `page`, `pageSize` (máx. 100), `search`, `sort` (`campo` o `-campo` para descendente) y filtros propios de cada recurso.

## Errores

Cualquier estado ≥ 400 devuelve:

```json
{ "code": "validation", "message": "Revisa los campos marcados.", "fields": { "email": ["Ya existe una persona con ese correo."] } }
```

| HTTP | `code` | Uso |
|---|---|---|
| 400 / 422 | `validation` | `fields` con mensajes por campo; el formulario los pinta en su sitio. |
| 401 | `unauthorized` | Token ausente, inválido o caducado. |
| 403 | `forbidden` | El rol no puede hacer esto. |
| 404 | `not_found` | |
| 409 | `conflict` | Edición concurrente. |
| 429 | `rate_limited` | |
| 5xx | `server` | El cliente reintenta dos veces con espera creciente. |

`message` debe ser una frase apta para mostrar; el front la usa tal cual cuando existe.

## Auth

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/otp/request` | `{ phone }` | `204` siempre (no revela si el número existe) · `422` |
| POST | `/auth/otp/verify` | `{ phone, code }` | `200 { accessToken, user }` · `401` número no registrado, código incorrecto o vencido |
| POST | `/auth/oauth` | `{ provider: "google" | "microsoft", credential }` | `200 { accessToken, user }` · `401` si la cuenta no está vinculada · `422` |
| POST | `/auth/recovery/request` | `{ email }` | `204` siempre (no revela si el correo existe) · `422` |
| GET | `/auth/me` | — | `200 user` |
| POST | `/auth/logout` | — | `204` |

`user`: `{ id, name, phone, email, role: "admin" | "manager" | "member", avatarUrl?: string | null }`.

No hay contraseña: la llave de entrada es el **celular** en E.164 (`+573001234567`) y cada entrada se confirma con un
código de 6 dígitos por SMS que vence a los 10 minutos. Quien olvida su número lo pide por correo (`/auth/recovery/request`).
`credential` en `/auth/oauth` es el ID token que entrega el SDK del proveedor en el navegador (Google Identity
Services, MSAL para Outlook/Microsoft); el backend lo valida contra el proveedor y busca la cuenta vinculada. El
mock ignora la credencial y entra con la primera cuenta que tenga ese proveedor (`admin` → Google, `lider` → Outlook).
En el mock el código por SMS es siempre `246810` y solo entran los celulares de las cuentas de demostración.

Recomendación de producción: emitir el token como cookie `httpOnly` + `SameSite=Lax` y dejar `sessionTokenStorage` sin uso (ver `src/features/auth/tokenStorage.ts`).

## Dashboard

`GET /dashboard/summary` →

```json
{
  "kpis": { "totalUsers": 57, "activeUsers": 44, "invitedUsers": 7, "activationRate": 77 },
  "byArea": [{ "area": "Ventas", "count": 12 }],
  "signups": [{ "month": "Sep", "count": 8 }]
}
```

## Personas (`/users`)

`user`: `{ id, name, email, area, role, status: "active" | "invited" | "inactive", createdAt, lastActiveAt: string | null, avatarUrl: string | null }`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/users` | Filtros: `search` (nombre, correo, área), `status`; `sort`: `name`, `-name`, `createdAt`, `-createdAt`. |
| GET | `/users/:id` | |
| POST | `/users` | `{ name, email, area, role, status }`. Requiere rol admin o manager. `201`. |
| PATCH | `/users/:id` | Parcial. Correo único. |
| DELETE | `/users/:id` | Solo admin. `204`. |

## Identidad de la empresa (`/company/branding`)

`branding`: `{ name: string | null, logo: string | null, logoDark: string | null, updatedAt: string | null }`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/company/branding` | El logo que pinta el menú lateral. `logo: null` = se usa la marca Barberlytics. |
| PUT | `/company/branding` | `{ name, logo, logoDark }`. Reemplaza el conjunto; `null` borra. Solo admin. |

- `name` (1–60 caracteres) acompaña a los logos cuadrados y es su texto alternativo.

- `logo` es la versión para fondos claros; `logoDark`, opcional, para fondos oscuros. Sin `logoDark`, el front pone `logo` sobre una placa clara en modo oscuro. No se acepta `logoDark` sin `logo`.
- Hoy viajan como data URL (`data:image/png|svg+xml|jpeg|webp;base64,…`) de hasta 1 MB. Un backend real puede devolver una URL de su almacenamiento en su lugar; el front solo la usa como `src` de un `<img>`, que no ejecuta scripts de un SVG, pero el backend debe sanear los SVG igualmente.

## Feedback de campañas (`/feedback`)

`POST /feedback` → `200 { "ok": true }`. Guarda el comentario en la hoja de la campaña activa.

```json
{
  "campaignId": "rediseno-barberlytics-2026-09",
  "campaign": "Rediseño de Barberlytics",
  "page": "/dashboard",
  "pageLabel": "Métricas",
  "section": "Calendario y agenda",
  "comment": "Falta la vista semanal",
  "user": "Ana Ruiz",
  "email": "ana@barberia.co",
  "role": "Administrador",
  "timestamp": "2026-09-29T15:00:00.000Z"
}
```

| Código | Cuándo |
|---|---|
| `422 validation_error` | El comentario no tiene entre 5 y 1000 caracteres, o el cuerpo no cuadra con el esquema. |
| `404 not_found` | `campaignId` no es el de la campaña activa (o no hay ninguna). |
| `403 forbidden` | Petición desde otro origen. |
| `503 server` | El servidor no tiene configurada la cuenta de Google. |
| `502 server` | No se pudo escribir en la hoja. |

- En producción lo atiende la función de Vercel `api/feedback` (ver `docs/FEEDBACK_LOOP.md`); en
  desarrollo, el mock.
- Endpoints de administración, con `Authorization: Bearer <FEEDBACK_ADMIN_KEY>`:
  `POST /feedback/activate` crea y comparte la hoja de la campaña activa; `POST|GET /feedback/analyze`
  resume con Claude los comentarios nuevos (el cron de Vercel lo llama cada viernes).
- `user`, `email` y `role` los manda el cliente; no son una identidad verificada.

## Pendientes de contrato

Hoy el shell muestra notificaciones y novedades de demostración. Cuando existan `GET /notifications` y `GET /news`, se inyectan por `ShellConfig` en `src/app/layouts/AppLayout.tsx` sin tocar el shell.
