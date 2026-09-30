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
| POST | `/auth/otp/request` | `{ phone }` | `204` siempre (no revela si el número existe) · `422` · `429` bloqueado |
| POST | `/auth/otp/verify` | `{ phone, code }` | `200 { accessToken, user }` · `401` número no registrado, código incorrecto o vencido (`details.attemptsLeft`) · `429` bloqueado |
| POST | `/auth/signup` | `{ firstName, lastName, company, email, phone, barbers, country, timezone }` | `204` la barbería queda pendiente de activar · `422` (`email` ya registrado va en `fields`) |
| POST | `/support/tickets` | `{ name, company, email, phone, message, reason: "recovery" \| "lockout" \| "other" }` | `201 { id }` · `422`. Sin sesión. |
| POST | `/auth/oauth` | `{ provider: "google" | "microsoft", credential }` | `200 { accessToken, user }` · `401` si la cuenta no está vinculada · `422` |
| POST | `/auth/recovery/request` | `{ email }` | `204` siempre (no revela si el correo existe) · `422` |
| GET | `/auth/me` | — | `200 user` |
| POST | `/auth/logout` | — | `204` |

`user`: `{ id, name, phone, email, role: "admin" | "manager" | "member", avatarUrl?: string | null }`.

No hay contraseña: la llave de entrada es el **celular** en E.164 (`+573001234567`) y cada entrada se confirma con un
código de 6 dígitos por SMS que vence a los 10 minutos. Quien olvida su número lo pide por correo (`/auth/recovery/request`).
Tras **4 verificaciones fallidas seguidas** con un mismo celular, el backend lo bloquea: `otp/request` y `otp/verify`
responden `429` con `details: { reason: "locked" }` hasta que soporte lo libere. El front muestra el aviso de bloqueo y
ofrece abrir un ticket (`/support/tickets`, `reason: "lockout"`). Un acceso correcto pone el contador en cero. `country`
en `/auth/signup` es ISO 3166-1 alfa-2 y `timezone` un nombre IANA (`America/Bogota`).
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

## Métricas (`/metrics`)

`GET /metrics/business?granularity=day|week|month&date=YYYY-MM-DD&barberId=all|<id>` → cómo le fue a la
sucursal activa en el periodo que contiene `date`. `day` es ese día, `week` su semana de lunes a domingo y
`month` su mes natural. `previous` es el periodo justo anterior, con el que se calculan las variaciones. La
sucursal la fija la sesión (cabecera), no la consulta. `barbers` es la lista completa para el filtro y no
cambia con `barberId`.

```json
{
  "period": { "granularity": "month", "from": "2026-09-01", "to": "2026-09-30" },
  "previous": { "from": "2026-08-01", "to": "2026-08-31" },
  "barbers": [{ "id": "b4", "name": "Andrés Beltrán" }],
  "kpis": {
    "sales": { "value": 15642, "previous": 17130 },
    "averageTicket": { "value": 56.26, "previous": 58.85 },
    "transactions": { "value": 278, "previous": 291 },
    "tipsRate": { "value": 19.8, "previous": 19.1 },
    "tipsAmount": 2422,
    "cancellationRate": { "value": 26.8, "previous": 26.5 },
    "refunds": { "amount": 90, "rate": 0.6 },
    "discounts": { "amount": 120, "rate": 0.8 }
  },
  "trend": [{ "label": "1", "sales": 520, "appointments": 11 }],
  "income": [{ "id": "services", "amount": 12219 }],
  "appointments": {
    "total": 369, "clients": 303,
    "byStatus": [{ "id": "completed", "count": 247 }],
    "byMethod": [{ "id": "internal", "count": 322 }],
    "byDaypart": [{ "id": "morning", "count": 105 }],
    "byHour": [{ "hour": 9, "count": 22 }]
  },
  "payments": [{ "id": "card", "amount": 10975 }],
  "services": [{ "id": "maintenance", "name": "Corte de mantenimiento", "count": 148, "amount": 6660 }],
  "products": [{ "id": "pomade", "name": "Pomada mate", "count": 13, "amount": 286 }]
}
```

Enumeraciones: `income.id` ∈ `services | products | taxes | tips | fees | noShow`; `byStatus.id` ∈
`completed | pendingCollection | cancelled | noShow`; `byMethod.id` ∈ `internal | online | walkIn`;
`byDaypart.id` ∈ `morning | afternoon | evening`; `payments.id` ∈ `card | cash | transfer | giftCard`.
`trend` trae un punto por día del periodo (por hora, de 8 a 20, cuando el periodo es un día). Las tasas van
en porcentaje (0–100) y los importes en la moneda de la sucursal.

Las otras pestañas comparten los mismos parámetros (`granularity`, `date`, `barberId`) y devuelven `period` y
`previous` con la misma forma:

| Ruta | Devuelve |
|---|---|
| `GET /metrics/customers` | `clients`, `kpis: { retentionRate, avgIncomePerClient, onlineBookings, walkInRate }` (cada uno `{ value, previous }`), `byClientType: [{ id: new \| retainedNew \| repeat \| recovered, count }]`, `newVsReturning: { new, returning }`, `barberPreference: { withPreference, noPreference }`, `visitFrequency: [{ id: weekly \| biweekly \| monthly \| occasional, count }]`. |
| `GET /metrics/barbers` | `kpis: { totalNet, loyalty, avgOccupancy, avgTicket }`, `barbers: [{ id, name, net, services, occupancy, cancellationRate, tipsRate }]`. Con `barberId` la lista trae solo a esa persona. |
| `GET /metrics/marketing` | `kpis: { onlineBookings, bestChannel: string \| null, campaignBookings }`, `channels: [{ id, name, bookings, visits }]`, `campaigns: [{ id, name, bookings, revenue }]`. Sin datos, listas vacías (nunca ceros inventados). |
| `GET /metrics/insights` | Sin parámetros: diagnostica los últimos tres meses de la sucursal. `window: { from, to }`, `health: { score (0–100), completionRate, retentionRate, noShowRate, avgTicket }`, `risks: { churned, atRisk, overdue }`, `capacity: { hours: number[], rows: [{ day: 0–6 (lunes = 0), values: number[] (ocupación 0–100 por hora) }] }`, `suggestions: [{ id, group: clients \| growth \| operations, type: risk \| recommendation \| opportunity \| insight, tag, title, description, action, evidence? }]`. |

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

## Calendario

La agenda de una sucursal. Las horas de las citas viajan en **ISO local sin zona** (`2026-09-25T10:30:00`): la agenda es de la sucursal, no de UTC. `branchId` es la sucursal activa de la cabecera.

`barber`: `{ id, branchId, name, avatarUrl, level: "junior" | "senior" | "master", workingHours: { [díaDeLaSemana 0–6]: [{ start: "09:00", end: "19:00" }] }, acceptsWalkIns }`
`client`: `{ id, name, phone, type: "walkin" | "new" | "retained" | "frequent" | "vip", visits, cancellations, noShows, lastVisitAt, preferredBarberId, visitEveryDays, notes: [{ id, kind: "note" | "medication" | "allergy", text, createdAt }] }`
`service`: `{ id, name, category, durationMin, price }` · `product`: `{ id, name, category, price }`
`appointment`: `{ id, branchId, clientId, barberId, requestedBarberId, serviceIds, products: [{ productId, qty }], start, durationMin, status, barberReady, walkIn, source: "internal" | "online" | "walkin", repeat, seriesId, notes, createdAt, createdBy, history: [{ id, at, actor, event }], payment: { method, tip, tax, total, paidAt } | null }`
`status`: `scheduled` (agendada) → `arrived` (llegó) → `seated` (en silla) → `paid` (cobrada); fuera del camino, `no_show` y `cancelled`. Una cita `paid` ya no cambia de estado.
`block`: `{ id, branchId, barberId, category: "sick" | "vacation" | "holiday" | "lunch" | "meeting" | "business" | "personal", repeat: "none" | "daily" | "weekly" | "monthly", startDate, endDate, startTime, endTime, description }`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/calendar/catalog?branchId` | `{ barbers, clients, services, products }` de la sucursal. El cliente `cli_walkin` («Walk in») siempre va el primero. |
| GET | `/calendar/day?branchId&date=AAAA-MM-DD` | `{ date, appointments, blocks }`. Los bloqueos ya vienen resueltos para ese día (con su repetición aplicada). |
| GET | `/calendar/month?branchId&month=AAAA-MM&barberId?` | `{ month, days: [{ date, occupancy: 0–1 \| null, count }] }`. `occupancy` es minutos de cita sobre minutos de jornada; `null` si nadie trabaja. Sin `barberId`, todo el equipo. |
| POST | `/appointments` | `{ clientId, barberId, serviceIds, start, walkIn, repeat, requestedBarberId?, notes? }`. `201 appointment`. Con `repeat` distinto de `none` crea una serie de 12 con el mismo `seriesId` y devuelve la primera. `422`. |
| PATCH | `/appointments/:id` | Cualquiera de `{ status, barberReady, start, barberId, durationMin (15–480), serviceIds, notes }`. Cada cambio deja una línea en `history`. `422` · `404`. |
| POST | `/appointments/:id/checkout` | `{ serviceIds, products, tip, method: "cash" \| "card" \| "link" \| "mixed" }`. Cierra la cita como `paid` con su `payment`. `409` si ya estaba cobrada o anulada. |
| POST | `/clients/:id/notes` | `{ kind, text }`. `201 client` con la nota al frente. |
| POST | `/blocks` | El bloqueo de arriba, sin `id`. `201 block`. `422` si la hora de cierre no es posterior a la de inicio. |
| DELETE | `/blocks/:id` | `204`. |
| GET | `/waitlist?branchId&date?` | `{ items: [{ id, branchId, clientId, serviceId, barberId, slots: [{ date, time }], createdAt }] }`. |
| POST | `/waitlist` | `{ branchId, clientId, serviceId, barberId \| null, slots }`. `201`. |
| DELETE | `/waitlist/:id` | `204`. |
| POST | `/sales` | Venta rápida de productos: `{ branchId, items: [{ productId, qty }], method }`. `201 { id, items, method, total, paidAt }`. |

`history.event` es un código estable que el front traduce: `created`, `walkin`, `barber_ready`, `status:<estado>`, `moved:<inicio>`, `barber:<nombre>`, `duration:<min>`, `paid:<método>`.

El mock genera la agenda de cada día la primera vez que se pide, de forma determinista (la misma fecha y sucursal dan las mismas citas), y recuerda lo que se cambia durante la sesión.

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
