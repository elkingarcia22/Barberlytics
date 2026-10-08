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
| POST | `/auth/otp/request` | `{ phone, channel?: "sms" \| "email" }` | `204` siempre (no revela si el número existe ni si tiene correo de respaldo) · `422` · `429` bloqueado |
| POST | `/auth/otp/verify` | `{ phone, code }` | `200 { accessToken, user }` · `401` número no registrado, código incorrecto o vencido (`details.attemptsLeft`) · `429` bloqueado |
| POST | `/auth/signup` | `{ firstName, lastName, company, email, phone, barbers, country, timezone }` | `204` la barbería queda pendiente de activar · `422` (`email` ya registrado va en `fields`) |
| POST | `/support/tickets` | `{ name, company, email, phone, message, reason: "recovery" \| "lockout" \| "other" }` | `201 { id }` · `422`. Sin sesión. |
| POST | `/auth/oauth` | `{ provider: "google" | "microsoft", credential }` | `200 { accessToken, user }` · `401` si la cuenta no está vinculada · `422` |
| POST | `/auth/recovery/request` | `{ email }` | `204` siempre (no revela si el correo existe) · `422` |
| GET | `/auth/me` | — | `200 user` |
| GET | `/auth/backup-email` | — | `200 { email: string \| null }` |
| POST | `/auth/backup-email` | `{ email }` | `204` manda un código a ese correo; aún no lo activa · `422` |
| POST | `/auth/backup-email/verify` | `{ email, code }` | `200 { email }` queda activo · `409` no se pidió código para ese correo · `422` código incorrecto (`fields.code`) |
| DELETE | `/auth/backup-email` | — | `204` |
| POST | `/auth/logout` | — | `204` |

`user`: `{ id, name, phone, email, role: "admin" | "manager" | "member", avatarUrl?: string | null }`.

No hay contraseña: la llave de entrada es el **celular** en E.164 (`+573001234567`) y cada entrada se confirma con un
código de 6 dígitos por SMS que vence a los 10 minutos. Quien olvida su número lo pide por correo (`/auth/recovery/request`).
Si el SMS no llega, el código se puede pedir al **correo de respaldo** (`otp/request` con `channel: "email"`): cada
persona lo configura y lo verifica en Configuración › Inicio de sesión (`/auth/backup-email`, con sesión). Es el mismo
código y vale igual en `otp/verify`; la respuesta no dice si la cuenta tiene respaldo, para no filtrar datos.
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

`barberId` acepta el id de métricas (`b4`…) o el de equipo (`team-04`…): el barbero que mira sus cifras manda el suyo.
En el simulador, `team-04`…`team-08` son las mismas personas que `b4`…`b8`; cualquier otro barbero del equipo
(p. ej. `team-30`) se simula aparte y no suma a «todo el equipo» (`resolveMetricsBarber` en `src/mocks/metrics.ts`).

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
| GET | `/calendar/catalog?branchId` | `{ barbers, clients, services, products }` de la sucursal. El cliente `cli_walkin` («Walk in») siempre va el primero. `services` son los del catálogo (sección «Servicios») activos en la sucursal; `products`, los de «Productos» activos y a la venta. |
| GET | `/calendar/day?branchId&date=AAAA-MM-DD` | `{ date, appointments, blocks }`. Los bloqueos ya vienen resueltos para ese día (con su repetición aplicada). |
| GET | `/calendar/month?branchId&month=AAAA-MM&barberId?` | `{ month, days: [{ date, occupancy: 0–1 \| null, count }] }`. `occupancy` es minutos de cita sobre minutos de jornada; `null` si nadie trabaja. Sin `barberId`, todo el equipo. |
| POST | `/appointments` | `{ clientId, barberId, serviceIds, start, walkIn, repeat, requestedBarberId?, notes? }`. `201 appointment`. Con `repeat` distinto de `none` crea una serie de 12 con el mismo `seriesId` y devuelve la primera. `422`. `409 conflict` si el tramo pisa otra cita viva o un bloqueo del barbero (el mensaje dice con quién), salvo con `force: true`, que usan los roles que agendan sin reglas (dueño, administrador, recepción, barbero de renta). |
| PATCH | `/appointments/:id` | Cualquiera de `{ status, barberReady, start, barberId, durationMin (15–480), serviceIds, notes, reason?, actor? }`. Cada cambio deja una línea en `history`; `reason` («Movida 15 min porque la cita anterior se alargó») se guarda tal cual como `reason:…` y `actor: "assistant"` firma la línea como «Asistente» en vez de la persona de la sesión. `409 conflict` si al cambiar `start`, `barberId` o `durationMin` el tramo pisa otra cita viva o un bloqueo, salvo con `force: true`. `422` · `404`. |
| POST | `/appointments/:id/checkout` | `{ serviceIds, products, tip, method: "cash" \| "card" \| "link" \| "mixed", surcharge? }`. `surcharge` (el recargo por tarjeta de Configuración) solo cuenta con `card` y se suma al total. Cierra la cita como `paid` con su `payment`. `409` si ya estaba cobrada o anulada. |
| POST | `/clients/:id/notes` | `{ kind, text }`. `201 client` con la nota al frente. |
| PATCH | `/clients/:id/notes/:noteId` | Cualquiera de `{ kind, text }`; conserva `createdAt`. `200 client`. `422` · `404`. |
| DELETE | `/clients/:id/notes/:noteId` | `200 client` sin la nota. `404`. |
| POST | `/blocks` | El bloqueo de arriba, sin `id`. `201 block`. `422` si la hora de cierre no es posterior a la de inicio. |
| DELETE | `/blocks/:id` | `204`. |
| GET | `/waitlist?branchId&date?` | `{ items: [{ id, branchId, clientId, serviceId, barberId, slots: [{ date, time }], createdAt }] }`. |
| POST | `/waitlist` | `{ branchId, clientId, serviceId, barberId \| null, slots }`. `201`. |
| DELETE | `/waitlist/:id` | `204`. |
| POST | `/sales` | Venta rápida de productos: `{ branchId, items: [{ productId, qty }], method }`. `201 { id, items, method, total, paidAt }`. |

`history.event` es un código estable que el front traduce: `created`, `walkin`, `barber_ready`, `status:<estado>`, `moved:<inicio>`, `barber:<nombre>`, `duration:<min>`, `paid:<método>`.

El mock genera la agenda de cada día la primera vez que se pide, de forma determinista (la misma fecha y sucursal dan las mismas citas), y recuerda lo que se cambia durante la sesión.

## Clientes (`/customers`)

El directorio de clientes y la ficha de cada uno. Un cliente es **el mismo** `client` del calendario (mismo `id`): aquí se le suma lo que la agenda no necesita —contacto, dirección, en qué momento de la relación está y su historial—.

`customer`: `{ id, name, phone, email, branchId, segment, blocked, ltv, visits, cancellations, noShows, lastVisitAt, visitEveryDays, preferredBarber (nombre \| null), birthDate (AAAA-MM-DD \| null), createdAt, medicalNotes }`
`segment`: `new` · `retained` · `frequent` · `vip` (cuánto viene) · `atRisk` (dos ciclos de su ritmo sin volver) · `lost` (meses sin venir) · `recovered` (volvió tras perderse) · `blocked` (decisión del negocio; manda sobre los demás). Lo calcula el backend.
`medicalNotes`: cuántas notas `medication` o `allergy` tiene; la lista lo señala sin traer las notas.
`customerDetail`: `customer` + `{ country, state, city, address, zipcode, onlineOnly, stats: { avgTicket, transactions, completedRate, cancelledRate, noShowRate, rebookRate, leadTimeDays }, notes, guests: [{ id, name, relation, visits }], appointments: [{ id, service, start, barber, source: "internal" \| "online" \| "walkin", requestedBarber, status: "scheduled" \| "completed" \| "cancelled" \| "no_show", total }], lastAppointmentId, payments: [{ id, date, status: "paid" \| "refunded", amount, method: "cash" \| "card" \| "link", reference }], products: [{ id, name, units, total, lastBoughtAt }] }`. Las tasas son porcentajes (0–100) sobre las citas reservadas; `appointments` va de la más reciente a la más antigua, con la próxima (`scheduled`) primero si existe.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/customers` | `{ items: customer[] }`, por nombre. Sin paginar: el front filtra por segmento y busca en memoria. |
| GET | `/customers/:id` | `customerDetail`. `404` si no existe. |
| POST | `/customers` | `{ firstName, lastName, phone, email, branchId, country?, state?, city?, address?, zipcode?, birthDate?, onlineOnly? }`. `201 customerDetail`. `422` con `fields` si falta nombre, apellido, celular o correo válidos, si el celular ya es de otro cliente o si la fecha de nacimiento es futura. |
| PATCH | `/customers/:id` | Los mismos campos del alta, o solo `{ blocked: boolean }` para bloquear y desbloquear sin reenviar la ficha. Devuelve `customerDetail`. `422` · `404`. |
| POST | `/customers/:id/guests` | `{ name, relation? }`. `201 customerDetail`. Un invitado solo necesita nombre: la cita queda a nombre del titular. |
| DELETE | `/customers/:id/guests/:guestId` | `customerDetail` sin ese invitado. `404`. |

Las notas se crean, corrigen y borran con `/clients/:id/notes` (sección Calendario): son las mismas que se ven al abrir una cita.

## Servicios (`/services`)

El catálogo de lo que se ofrece. Es la **fuente de lo que la agenda puede agendar**: `GET /calendar/catalog` devuelve como `services` los de aquí que están activos en la sucursal (servicios y combos, con el nombre de su categoría en `category`). Un servicio se crea una vez y cada sucursal decide si lo ofrece.

`category`: `{ id, name, description, visibility: "public" | "private" }`. `cat_none` («Sin categoría») existe siempre y no se puede borrar.
`service`: `{ id, kind: "service" | "combo", name, description, categoryId, price, cost (\| null), durationMin, taxRate (0–100 \| null), visibility, active, multiservice, prep: { enabled, minutes, position: "start" | "end" }, giftCards, includes: string[] (solo combos), createdAt, offeredBy, teamSize }`. `active` es relativo al `branchId` de la petición; `offeredBy` / `teamSize` cuentan los barberos de esa sucursal que lo ofrecen.
`serviceDetail`: `service` + `team: [{ memberId, name, avatarUrl, offered, price, durationMin, custom }]`. `price` y `durationMin` son los efectivos de esa persona (los suyos o los del catálogo); `custom` dice si tiene valores propios. Los valores propios se editan en la ficha del miembro (`PATCH /team/members/:id`, `services`).

| Método | Ruta | Notas |
|---|---|---|
| GET | `/services?branchId` | `{ categories, items }`, los dos en el orden de la reserva en línea. |
| GET | `/services/:id?branchId` | `serviceDetail`. `404`. |
| POST | `/services` | `{ kind, name, categoryId, price, durationMin (5–480), branchId, description?, cost?, taxRate?, visibility?, multiservice?, prep?, giftCards?, includes? }`. `201 serviceDetail`, activo solo en `branchId`. `422` con `fields`: nombre repetido, precio o duración fuera de rango, categoría inexistente, combo con menos de dos servicios, preparación fuera de 1–60 min. |
| PATCH | `/services/:id?branchId` | Los mismos campos; `kind` no cambia. `serviceDetail`. `422` · `404`. |
| DELETE | `/services/:id` | `204`. `409` si está dentro de un combo o tiene citas por atender. |
| PUT | `/services/activation` | `{ branchId, serviceIds, active }`: activa o desactiva varios en la sucursal. Devuelve el catálogo. Desactivar no toca las citas ya agendadas. |
| PUT | `/services/:id/team` | `{ branchId, memberIds }`: quién lo ofrece en la sucursal. No toca los valores propios de nadie. `serviceDetail`. |
| PUT | `/services/order?branchId` | `{ categoryIds, serviceIds }` en el orden nuevo; lo que no venga se queda al final. Devuelve el catálogo. |
| POST | `/service-categories` | `{ name, description?, visibility? }`. `201 category`. `422` si el nombre falta o se repite. |
| PATCH | `/service-categories/:id` | Igual. `category`. |
| DELETE | `/service-categories/:id` | `204`; sus servicios pasan a `cat_none`. `409` para `cat_none`. |

## Productos (`/products`)

El catálogo de lo que se vende en mostrador. Como el de servicios, es la **fuente de lo que la caja puede cobrar**: `GET /calendar/catalog` devuelve como `products` los de aquí que están activos en la sucursal **y** a la venta (`sellable`). No hay inventario: el contrato no lleva existencias.

`category`: `{ id, name, description }`. `pcat_none` («Sin categoría») existe siempre y no se puede borrar.
`product`: `{ id, name, description, categoryId, price (venta), cost (compra \| null), taxRate (0–100 \| null), sku (\| null), brand (\| null), distributor (\| null), visibility: "public" | "private", sellable, active, createdAt }`. `visibility` dice si el cliente lo ve al reservar en línea; `sellable`, si el equipo puede venderlo (uno de uso interno va en `false`); `active` es relativo al `branchId` de la petición.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/products?branchId` | `{ categories, items }`. |
| GET | `/products/:id?branchId` | `product`. `404`. |
| POST | `/products` | `{ name, categoryId, price, branchId, description?, cost?, taxRate?, sku?, brand?, distributor?, visibility?, sellable? }`. `201 product`, activo solo en `branchId`. `422` con `fields`: nombre o SKU repetidos, precio o impuesto fuera de rango, categoría inexistente. |
| PATCH | `/products/:id?branchId` | Los mismos campos. `product`. `422` · `404`. |
| DELETE | `/products/:id` | `204`. `409` si está en una cita por cobrar. |
| PUT | `/products/activation` | `{ branchId, productIds, active }`: activa o desactiva varios en la sucursal. Devuelve el catálogo. |
| POST | `/product-categories` | `{ name, description? }`. `201 category`. `422` si el nombre falta o se repite. |
| PATCH | `/product-categories/:id` | Igual. `category`. |
| DELETE | `/product-categories/:id` | `204`; sus productos pasan a `pcat_none`. `409` para `pcat_none`. |

## Transacciones (`/transactions`)

Las cuentas de un periodo. Es de **solo lectura**: una cuenta no se crea aquí —cada cita es una cuenta y cada venta de mostrador (`POST /sales`) es otra—, y cobrar, cancelar o mover una cita se hace por los endpoints del calendario.

`account`: `{ id, kind: "appointment" | "sale", date, invoice (\| null), client: { id, name, phone } (\| null), barber (nombre \| null), openedBy (\| null), chargedBy (\| null), status, appointmentStatus (\| null), source (\| null), lines: [{ kind: "service" | "product", name, qty, amount }], subtotal, tax, tip, total, collected, refunded, balance, method (\| null), paidAt (\| null), reference, appointmentId (\| null), durationMin (\| null) }`
`status`: `open` (cita agendada o en curso, sin cobrar) · `paid` (cobrada) · `refunded` (se cobró y se devolvió) · `void` (cita cancelada o a la que no se presentaron: no se factura).
`total` = `subtotal + tax`; la propina (`tip`) va aparte y no entra en `collected`. `collected` es `total` solo si está `paid`; `balance` es `total` solo si está `open`; `refunded` es `total` solo si está `refunded`. `invoice` existe desde que se cobra. En una venta de mostrador `client`, `barber`, `appointmentStatus` y `appointmentId` son `null`.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/transactions?branchId&from=AAAA-MM-DD&to=AAAA-MM-DD` | `{ from, to, items: account[] }`, de la más reciente a la más antigua. Sin paginar: el front resume, filtra por estado y busca en memoria. `422` si el rango es inválido, va al revés o pasa de 62 días. |

Las cifras de arriba de la pantalla (facturado, cobrado, por cobrar, propinas, devuelto) se calculan en el front sobre `items`; si el backend real pagina, tendrá que devolverlas en un `summary` aparte.

## Gastos (`/expenses`)

Lo que sale de caja en una sucursal. Un gasto **fijo** se repite con una frecuencia; uno **variable** pasó una vez.

`expense`: `{ id, branchId, ownerMemberId (\| null), kind: "fixed" | "variable", name, amount, frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual" (\| null en los variables), description, createdAt }`. `amount` es lo que vale **cada vez que se paga**; en un variable, `createdAt` hace de fecha del gasto.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/expenses?branchId&ownerMemberId?` | `{ items: expense[] }`, del más reciente al más antiguo. Sin paginar. Sin `ownerMemberId`, los de la sucursal (`ownerMemberId: null`); con él, solo los de ese barbero de renta (lo que compra para su silla). Un gasto sin el campo cuenta como de la sucursal. |
| POST | `/expenses` | `{ kind, name, amount, branchId, frequency? (obligatoria si es `fixed`), description?, ownerMemberId? }`. `201 expense`. `422` con `fields`: nombre corto, valor que no es mayor que cero, fijo sin frecuencia. |
| PATCH | `/expenses/:id` | `{ name, amount, frequency?, description? }`. `kind` no cambia aunque se mande. `expense`. `422` · `404`. |
| DELETE | `/expenses/:id` | `204`. `404`. |

El «por mes» de un fijo (`amount × pagos al año ÷ 12`) y el resumen del mes los calcula el front sobre `items`.

## Nómina (`/payroll`)

Lo que se le paga a cada barbero en un periodo. Es de **solo lectura** y no se guarda: se calcula sobre las citas **cobradas** del rango y la compensación de cada persona (su ficha en Equipo, `compensation` y `payments`). La renta y el salario son **por semana**; un rango de N días son N/7 semanas.

`member`: `{ memberId, name, avatarUrl, payout: "commission" | "rent" | "salary", rules (\| null), rentBase (\| null), salaryBase (\| null), services, serviceSales, productSales, serviceCommission, productCommission, tips, salary, rent, deductions, net, lines }`
`rules` (solo comisión): `{ type: "commission" | "scale", basic, recurring, walkIn, noPreference, newClient, productPercent, scale: [{ from, percent }] }` en porcentajes; una regla `null` usa la básica.
`line`: `{ appointmentId, date, client, service, rule: "walkIn" | "noPreference" | "newClient" | "recurring" | "basic", rate (\| null), sale, commission, tip, deduction }`. La regla sale de quién trajo al cliente, de la más específica a la menos: sin cita → sin preferencia → cliente nuevo → cliente que repite → básica.
`net` = `serviceCommission + productCommission + tips + salary − rent − deductions`. **Positivo**: la barbería le paga. **Negativo**: el barbero (de renta) le debe a la barbería.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/payroll?branchId&from=AAAA-MM-DD&to=AAAA-MM-DD&memberId?` | `{ from, to, weeks, members: member[] }` con los barberos de la sucursal en su orden de calendario; con `memberId`, solo esa persona («Lo que llevo» / «Mi negocio» del barbero). `422` si el rango es inválido, va al revés o pasa de 62 días. |

Los impuestos que muestra producción no se modelan: el mock no los cobra.

## Configuración (`/settings`)

Dos formas, y nada más: **documentos** (un objeto por sección, se lee y se guarda entero) y
**listas** (registros que se crean, editan y borran uno a uno).

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/settings/:section` | El documento de la sección. |
| `PUT` | `/settings/:section` | Lo reemplaza y devuelve el guardado. `422` con `fieldErrors` si algo no cuadra. |
| `GET` | `/settings/lists/:list` | Todos los registros de la lista (sin paginar: son pocos). |
| `POST` | `/settings/lists/:list` | Crea uno. `201`. |
| `PATCH` | `/settings/lists/:list/:id` | Edita uno. |
| `DELETE` | `/settings/lists/:list/:id` | Borra uno. `204`. |
| `POST` | `/settings/payments/test` | Prueba la conexión con la pasarela. `200 { ok }` o `409` si faltan las claves. |
| `POST` | `/account/delete` | Elimina la cuenta. Cuerpo `{ confirmation }`. `204`. |

Secciones (`:section`): `business` (zona horaria, horario por día, festivos, enlaces), `booking`
(reglas de la reserva en línea, política de cancelación, portal del cliente), `pricing` (precios
por nivel, redondeo), `tips` (propinas sugeridas), `cardFee` (recargo por tarjeta), `commissions`
(qué se descuenta antes de comisionar), `payrollCycle` (cada cuánto y desde qué día se paga),
`payments` (pasarela), `notifications` (`toggles` por `destinatario.evento.canal` y `thresholds`),
`company` (razón social, moneda, contacto) y `billing` (plan y datos de facturación).

Listas (`:list`): `branches`, `closures`, `taxGroups`, `devices`.

Reglas que el cliente da por hechas:

- `booking.links` (enlace de reserva, del portal, del kiosco y el widget) lo pone el servidor: un
  `PUT` que lo traiga se ignora.
- `payments` nunca devuelve la clave secreta: responde `{ provider, publicKey, secretKeySet,
  connected }`. Un `PUT` sin `secretKey` conserva la que había.
- `devices` tampoco devuelve su clave de acceso: responde `hasAuthKey`.
- `billing` solo acepta los datos de facturación; el plan y el medio de pago no se cambian por aquí.
- `cardFee` exige nombre cuando está encendido; `closures` exige `endDate >= startDate`; un
  `taxGroup` necesita al menos una tasa con nombre.
- `DELETE /settings/lists/branches/:id` responde `409 conflict` si es la última sucursal o si
  todavía tiene equipo activo.
- `POST /account/delete` responde `422` si `confirmation` no es exactamente el nombre de la empresa.

Los permisos por rol no están aquí: viven en Equipo.

## Reserva en línea (`/booking`)

La cara pública de la barbería: la abre el cliente desde el enlace, la tablet del local o el widget
del sitio (`/reservar` en la app). **No lleva la sesión de la app.** El cliente se identifica con
su celular y un código (WhatsApp o SMS). El código se manda a cualquier número y la respuesta no
dice si es cliente: el perfil (correo, personas, tarjetas, saldo) solo sale al verificarlo. Al
verificar recibe un token propio que viaja en `x-booking-token`; todo lo que actúa en su nombre
(crear el perfil, la propuesta, reservar, cobrar una tarjeta guardada, la lista de espera, «Mis
citas») toma al cliente de ese token, nunca de un id del cuerpo. Sin token válido responde `403
booking_session` (nunca `401`, que cerraría la sesión de quien esté dentro de la app en el mismo
navegador). Límites: 5 códigos por celular cada 10 minutos y 5 intentos fallidos por código (`429`).

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/booking/shop` | La barbería: nombre, logo, moneda, impuesto, anticipación mínima, franjas, política de cancelación (`cancelHours`, `lateFeePercent`, `maxCancellations`, `policy`), propinas, formas de pago, `cardFee` (el recargo por tarjeta encendido en Configuración, o `null`) y sedes con su horario de hoy. Sale de Configuración. |
| `GET` | `/booking/branches/:id` | El perfil de una sede: `description`, dirección completa, `phone`, `mapsUrl`, `gallery`, `hours` (siete entradas, `opensAt`/`closesAt` nulos si ese día cierra), número de barberos y los `closures` que vienen. La descripción, dirección y teléfono son los de Configuración › Sucursales; el horario de cada día sale del equipo que trabaja ese día. `404` si no existe o está inactiva. |
| `GET` | `/booking/catalog?branchId` | Lo reservable en la sede: servicios públicos y activos, barberos visibles con lo que cobra cada uno por servicio (`prices`), galería y valoración, y productos visibles y vendibles. |
| `GET` | `/booking/availability?branchId&date&serviceIds&barberId&exclude` | Las horas libres del día, `{ time, barberIds }`. Sin `barberId`, cualquier barbero que haga todos los servicios. `exclude` es la cita que se está moviendo. Respeta horario, citas, bloqueos, cierres y anticipación mínima. |
| `GET` | `/booking/alternatives?branchId&date&serviceIds&barberId` | Cuando el barbero no tiene horas: hasta 3 barberos que hacen todos los servicios, `{ barberId, skills, date, times }`. Se ordenan por quién tiene hora ese día, luego por parecido (habilidades que cubren lo pedido ×3, las compartidas con el elegido ×2, menos la distancia de nivel). Si no tienen ese día, traen su próximo día libre (hasta 7). Las habilidades del equipo se leen en servicios (`SKILL_SERVICES`). |
| `POST` | `/booking/waitlist` | Con token. `{ branchId, date, serviceIds, barberId, window: morning\|afternoon\|evening\|any }` → `201 { id, date, window }`. Se apunta en la lista de espera del Calendario: una entrada con una hora en punto por cada hora de la franja (mañana hasta las 12, tarde 12–18, noche desde las 18; «noche» solo si la sede cierra después de las 18). |
| `DELETE` | `/booking/waitlist/:id` | Con token. Salir de la lista. `404` si la entrada no existe o es de otro cliente. |
| `GET` | `/booking/me/suggestion` | Con token. | La próxima visita según su frecuencia (FOV): `{ suggestion: { everyDays, lastVisitAt, dueDate, isOverdue, usualTime, branchId, serviceIds, options[{ start, barberId, sameBarber }] } }`, o `suggestion: null` si aún no tiene ritmo. El día es la última visita + `everyDays`; la hora, la mediana de sus citas; con su barbero si tiene hueco en 10 días, si no con cualquiera. |
| `POST` | `/booking/customers` | Con el token de un celular nuevo. Crea el cliente `{ firstName, lastName, email, marketing }`; el celular es el verificado. Guarda el permiso de promociones con fecha (`marketingConsent`). La misma sesión pasa a ser la del cliente. `201`. |
| `POST` | `/booking/promo` | Token opcional (para saber si es su primera visita). `{ code, appointments }` → el cupón, o `422 promo_invalid` con `problem` (`unknown`, `firstVisitOnly`, `minAppointments`). |
| `POST` | `/booking/reservations` | Con token. Reserva y cobra. Cuerpo: `branchId`, `items[]` (`guestId` o `guestName`+`guestRelation`, `serviceIds`, `barberId` o `null` = sin preferencia, `start`), `products[]`, `tipId`, `promoCode`, `method` (`card`, `wallet`, `shop`, `credit`) y `card` (`number`, `name`, `expiry`, `save`) o `savedCardId` (una tarjeta guardada). El CVC nunca viaja a este servidor (va a la pasarela); `save` guarda solo marca, últimos 4 y vencimiento, que vuelven en `customer.cards`. `201` con el recibo. Los totales traen `fee` y `feeName`: el recargo por tarjeta, sobre el subtotal, solo con `card` o `wallet`. |
| `POST` | `/booking/otp/request` | `{ phone }` → `{ sentTo, channel }` (enmascarado), igual para cualquier número. `429 rate_limited` tras 5 en 10 minutos. |
| `POST` | `/booking/otp/verify` | `{ phone, code }` → `{ status: "known", token, customer }`, `{ status: "new", token, customer: null }` o `{ status: "blocked", token: null, customer: null }`. `422 otp_invalid` con `attemptsLeft`; `429 otp_locked` tras 5 fallos (hay que pedir otro). |
| `GET` | `/booking/me/appointments` | Con token: `{ upcoming, past, reservations }`. |
| `PATCH` | `/booking/appointments/:id` | Con token: `{ start, barberId }`. `409 too_late` dentro del plazo de cambio; `409 conflict` si la hora ya no está. |
| `POST` | `/booking/appointments/:id/cancel` | Con token: `{ refundTo: "card" \| "credit" }` → `{ appointment, fee, refund, refundTo }`. `409 limit` al llegar a `maxCancellations`. |
| `POST` | `/booking/reservations/:id/receipt` | `{ channel: "email" \| "sms", to }` → `{ channel, to }`. |

Reglas que el cliente da por hechas:

- Las citas se crean en la agenda con `source: "online"` y `createdBy: "Reserva en línea"`: aparecen
  en el Calendario. Una cita para un invitado va a nombre de quien reserva con la nota «Para Santi
  (Hijo)», y el invitado nuevo queda guardado en la ficha del cliente.
- Sin preferencia, el servidor asigna el primer barbero libre en el orden del calendario; dos citas
  de la misma reserva a la misma hora nunca caen en el mismo barbero.
- El total lo calcula el servidor con `src/features/booking/pricing.ts` (el mismo módulo que usa la
  pantalla): descuento sobre servicios y productos, impuesto sobre lo comprado ya descontado y
  propina aparte, sobre los servicios.
- `shop` no se ofrece si la barbería lo apaga o si el cliente es «solo en línea» (`onlineOnly`).
  `credit` solo si el saldo a favor cubre el total. `402 card_declined` si el banco rechaza.
- Cancelar dentro del plazo (`cancelHours` antes) es gratis y devuelve todo lo pagado; después se
  descuenta `lateFeePercent` del precio de la cita. `refundTo: "credit"` deja el reembolso como
  saldo a favor al instante.
- Errores al reservar: «Ese horario acaba de ser tomado…», «El barbero no está disponible a esa
  hora…» (`409 conflict`) y «Esa hora ya no se puede reservar» si quedó dentro de la anticipación.
- En la demo: `+57 320 217 2738` es un cliente que vuelve, `+57 300 999 9999` está bloqueado, el
  código es `246810` y la tarjeta `4000 0000 0000 0002` se rechaza.

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
  "type": "bug",
  "canContact": true,
  "attachments": ["1AbCdEfGhIjKlMnOpQrStUv"],
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

- `type` es `improvement` (por defecto), `bug` o `idea`. `page` vale `-` si la persona desmarcó
  «incluir la página». `attachments` son ids de Drive, hasta 4, obtenidos antes con la subida:

  `POST /feedback/attachments` con `{ campaignId, name, mimeType, size }` → `{ ok, uploadUrl }`.
  Acepta `image/png` e `image/jpeg` (5 MB) y `video/webm` y `video/mp4` (30 MB). El navegador hace
  `PUT uploadUrl` con los bytes —van directo a Drive, no pasan por la función— y recibe `{ id }`.
  Contesta `422` si el tipo o el tamaño no valen, `404` si la campaña no está abierta y `503` si
  falta `FEEDBACK_DRIVE_FOLDER_ID`.
- En producción lo atiende la función de Vercel `api/feedback` (ver `docs/FEEDBACK_LOOP.md`); en
  desarrollo, el mock.
- Endpoints de administración, con `Authorization: Bearer <FEEDBACK_ADMIN_KEY>`:
  `POST /feedback/activate` crea y comparte la hoja de la campaña activa; `POST|GET /feedback/analyze`
  resume con Claude los comentarios nuevos (el cron de Vercel lo llama cada viernes).
- `user`, `email` y `role` los manda el cliente; no son una identidad verificada.

## Pendientes de contrato

Hoy el shell muestra notificaciones y novedades de demostración. Cuando existan `GET /notifications` y `GET /news`, se inyectan por `ShellConfig` en `src/app/layouts/AppLayout.tsx` sin tocar el shell.
