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
| POST | `/auth/otp/request` | `{ phone, channel?: "sms" \| "email" }` | `204` siempre (no revela si el número existe ni si tiene correo de respaldo) · `422` · `429` bloqueado o más de 5 códigos en 15 min (`details.reason: "too_many_codes"`) |
| POST | `/auth/otp/verify` | `{ phone, code }` | `200 { accessToken, user }` · `401` con el **mismo mensaje** para número no registrado y código malo (`details.attemptsLeft`) · `429` bloqueado (`details.retryAfterSeconds`) |
| POST | `/auth/step-up/request` | — (con sesión) | `200 { phoneHint }`: un código nuevo al celular de la cuenta, con los mismos topes y bloqueo que al entrar |
| POST | `/auth/step-up/verify` | `{ code }` (con sesión) | `200 { token, expiresAt }`: confirma la identidad por 5 minutos y solo para esa cuenta · `401`/`429` como al entrar |
| POST | `/auth/signup/code` | `{ phone }` | `204` manda el código al celular del registro (mismos topes y bloqueo que al entrar) · `422` celular inválido |
| POST | `/auth/signup` | `{ firstName, lastName, company, email, phone, barbers, country, timezone, acceptTerms, code }` | `204` con los términos y el tratamiento de datos aceptados (`acceptTerms: true`) y el celular verificado con el código: la barbería queda pendiente de activar · `422` (`email` ya registrado, `acceptTerms` o `code` faltante van en `fields`) · `401` código malo (cuenta para el bloqueo) |
| POST | `/support/tickets` | `{ name, company, email, phone, message, reason: "recovery" \| "lockout" \| "other" }` | `201 { id }` · `422`. Sin sesión. |
| POST | `/auth/oauth` | `{ provider: "google" | "microsoft", credential }` | `200 { accessToken, user }` · `401` si la cuenta no está vinculada · `422` |
| POST | `/auth/recovery/request` | `{ email }` | `204` siempre (no revela si el correo existe) · `422` |
| GET | `/auth/me` | — | `200 user` |
| GET | `/auth/backup-email` | — | `200 { email: string \| null }` |
| POST | `/auth/backup-email` | `{ email }` | `204` manda un código a ese correo; aún no lo activa · `422` |
| POST | `/auth/backup-email/verify` | `{ email, code }` | `200 { email }` queda activo · `409` no se pidió código para ese correo · `422` código incorrecto (`fields.code`) |
| DELETE | `/auth/backup-email` | — | `204` |
| POST | `/auth/logout` | — | `204` |

`user`: `{ id, name, phone, email, role: "admin" | "manager" | "member", avatarUrl?: string | null, teamRole, memberId }`. `teamRole` (`owner`, `admin`, `recepcion`, `barbero-comision`, `barbero-renta`) y `memberId` (su ficha de equipo) son con lo que el servidor recorta: ver «Permisos en el servidor».

No hay contraseña: la llave de entrada es el **celular** en E.164 (`+573001234567`) y cada entrada se confirma con un
código de 6 dígitos por SMS que vence a los 10 minutos. Quien olvida su número lo pide por correo (`/auth/recovery/request`).
Si el SMS no llega, el código se puede pedir al **correo de respaldo** (`otp/request` con `channel: "email"`): cada
persona lo configura y lo verifica en Configuración › Inicio de sesión (`/auth/backup-email`, con sesión). Es el mismo
código y vale igual en `otp/verify`; la respuesta no dice si la cuenta tiene respaldo, para no filtrar datos.
Tras **4 verificaciones fallidas seguidas** con un mismo celular, el backend lo bloquea **15 minutos**: `otp/request` y
`otp/verify` responden `429` con `details: { reason: "locked", retryAfterSeconds }`. No es indefinido a propósito: con
un bloqueo sin fin cualquiera podría dejar al dueño fuera con 4 códigos falsos. Pedir códigos tiene tope (5 cada 15
minutos por número), porque cada SMS cuesta y se abusa de él (SMS pumping). El front muestra el aviso de bloqueo y
ofrece abrir un ticket (`/support/tickets`, `reason: "lockout"`). Un acceso correcto pone el contador en cero. `country`
en `/auth/signup` es ISO 3166-1 alfa-2 y `timezone` un nombre IANA (`America/Bogota`).
`credential` en `/auth/oauth` es el ID token que entrega el SDK del proveedor en el navegador (Google Identity
Services, MSAL para Outlook/Microsoft); el backend lo valida contra el proveedor y busca la cuenta vinculada. El
mock ignora la credencial y entra con la primera cuenta que tenga ese proveedor (`admin` → Google, `lider` → Outlook).
En el mock el código por SMS es siempre `246810` y solo entran los celulares de las cuentas de demostración: dueño
`3001234567`, administrador `3007654321`, recepción `3005550103`, barbero por comisión `3005550104` y barbero de renta
`3005550130` (todos +57).

Recomendación de producción: emitir el token como cookie `httpOnly` + `SameSite=Lax` y dejar `sessionTokenStorage` sin uso (ver `src/features/auth/tokenStorage.ts`).

**Confirmar que eres tú.** Lo sensible pide el código otra vez: eliminar la barbería (`POST /account/delete`), guardar
la clave secreta de una pasarela (`POST`/`PATCH /settings/lists/gateways` con `secretKey`), crear a alguien con rol
de dueño o administrador (`POST /team/members`) y poner el correo de respaldo (`POST /auth/backup-email`). Sin la
cabecera `X-Step-Up` con un token vigente de `/auth/step-up/verify` responden `403 { code: "step_up_required" }`; la
app abre el diálogo del código y repite la petición una vez. El token vive en la memoria de la pestaña.

## Avisos (`/notifications`)

La campana. No hay tabla de avisos: salen de lo que pasó en la sucursal y cada rol ve los suyos.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/notifications?branchId&role&memberId?` | `{ items: [{ id, kind, at, href, tone: "info" \| "warning" \| "negative" \| "positive", params, read }], unread }`, los 30 más recientes. Cada aviso es un evento del catálogo de Configuración › Recordatorios y avisos para el destinatario de ese rol (`onlineBooking` → `bookingOnline`, `cancelled` → `appointmentCancelled`, `noShow` → `appointmentNoShow`, `lowStock`/`outOfStock` → `productLow`/`productOut`, `lowReview` → `badReview`, `absenceRequested` → `vacationRequested`, `absenceDecided` → `vacationApproved`/`vacationDenied`, y con su mismo nombre `whatsappFailed`, `registerDifference`, `registerOpen`, `payrollDue`, `payrollPaid`): si `<destinatario>.<evento>.push` («En la app») está apagado, no sale. |
| POST | `/notifications/read` | `{ ids }`. `204`. Lo leído se guarda por cuenta. |

`kind` y para quién: `onlineBooking`, `cancelled`, `noShow` (dueño, administrador, recepción y el barbero de la cita);
`waitlistJoined` (alguien se apuntó a la lista de espera en los últimos días: dueño, administrador y recepción, con
`client`, `service`, `day` y `time` de la primera franja);
`whatsappFailed` (dueño, administrador, recepción); `lowStock`, `outOfStock`, `registerDifference` (diferencia de 1 o
más en un cierre), `payrollDue` (el ciclo anterior terminó sin aprobar) (dueño y administrador); `registerOpen` (ayer
hubo cobros y nadie cerró la caja; dueño, administrador, recepción); `payrollPaid` (al barbero, con su neto);
`lowReview` (3 estrellas o menos; solo al dueño). `params` lleva lo necesario para escribirlo en el idioma de quien lee
(`client`, `day`, `time`, `product`, `count`, `amount`, `from`, `to`…); `href` abre lo que lo causó. El mock recibe
`role` y `memberId` por parámetro porque la sesión aún no trae el rol del equipo; el backend real los sacará de la sesión.

## Puesta en marcha (`/onboarding`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/onboarding?branchId` | `{ steps: [{ id, done, href }], done, total }`. Pasos: `company` (nombre y teléfono), `branch` (moneda, impuesto y zona horaria), `hours` (horario), `services` (alguno activo con precio), `team` (algún barbero), `payments` (pasarela conectada en la sucursal), `booking` (algún medio de pago en la reserva), `clients` (algún cliente). Nadie los marca: cada uno se da por hecho cuando el dato existe. |

## Permisos en el servidor

Cada endpoint recorta con el rol y la ficha de la sesión (`teamRole`, `memberId`), no con lo que la pantalla esconda:

- **Barbero** (comisión o renta): `GET /payroll` solo su nómina; `GET /customers` solo sus clientes. «Cliente suyo» es
  una sola regla, la misma en Clientes y en la agenda: lo prefiere, o lo atendió o lo tiene agendado en el último año,
  según el historial de la ficha o la agenda real (cita viva, no cancelada ni sin presentarse) y `GET /customers/:id` de otro es `403`; `GET /transactions` solo sus cuentas (sin ventas de
  mostrador); `GET /metrics/*` con el barbero fijo en él y `GET /metrics/insights` `403`; `GET /team/members` y
  `/team/members/:id` sin teléfono, correo, código, compensación ni pagos de los colegas; rendimiento solo el suyo.
- **Fichas del equipo**: crear, editar, desactivar y borrar las hace quien gestiona a esa persona (el dueño a todos;
  el administrador, de recepción para abajo); si no, `403`. En su propia ficha, quien no gestiona cambia solo cómo se
  presenta y su contacto (`firstName`, `lastName`, `phone`, `email`, `description`, `instagram`, `facebook`,
  `avatarUrl`, `skills`, `gallery`); mandar otro campo con un valor distinto es `403`. La cuenta bancaria
  (`payments.accountNumber`) sale siempre enmascarada («•••• 4471»); guardarla enmascarada la deja igual y cambiarla
  pide `X-Step-Up`.
- **Barbero en la agenda**: `GET /calendar/day`, `/calendar/appointments` y `/calendar/month` traen solo su columna
  (sus citas, sus bloqueos, su horario y su ocupación, pida el barbero que pida); `GET /calendar/catalog` trae solo a
  él en `barbers` y, en `clients`, la ficha completa de los suyos (la misma regla que Clientes) y de
  los demás solo nombre y foto (sin teléfono, notas ni historial); `GET /waitlist` las suyas y las de cualquier
  barbero. Escribe solo en lo suyo: crear, cambiar y cobrar citas de su columna (`403` si no; tampoco la pasa a otro
  barbero), sin `force` (se ignora: la agenda no lo deja pisar), notas solo en la ficha de sus clientes, lista de
  espera consigo; las devoluciones son de la caja (`403`). Bloqueos: el de comisión no los crea ni los borra (pide la
  ausencia en Equipo); el de renta, solo en su agenda.
- **Barbero por comisión**: `GET/POST /expenses` `403`. **De renta**: solo sus gastos (`ownerMemberId` = su ficha).
- **Solo dueño o administrador**: mover la nómina (ajustes, pagos de renta, aprobar, pagar, reabrir), escribir en
  Configuración, aprobar o rechazar ausencias, los avisos de negocio. **Solo el dueño**: eliminar la barbería.
- **Recepción**: `GET /payroll` `403` (lo que gana cada quien es del dueño, el administrador y cada barbero).
- **Caja**: no la cierra un barbero. **Avisos**: el rol sale de la sesión; solo quien gestiona puede pedir los de otro
  rol («ver como»).

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

`GET /metrics/business?granularity=day|week|month&date=YYYY-MM-DD&barberId=all|<id>&branchId` → cómo le fue a la
sucursal `branchId` (la de la cabecera) en el periodo que contiene `date`. `day` es ese día, `week` su semana de
lunes a domingo y `month` su mes natural. `previous` es el periodo justo anterior, con el que se calculan las
variaciones. `barbers` son los barberos de esa sucursal (ids del equipo) y no cambian con `barberId`.

**Las cifras salen de lo que pasó**: las citas de la agenda de esa sucursal, al precio del barbero y con el
impuesto registrado, sus ventas de mostrador y sus devoluciones. Para el mismo día, «Ventas» es lo cobrado en
Transacciones (total + propina). Lo que la agenda no registra todavía (canal de llegada, campañas, tipo de
cliente a lo largo del tiempo, ocupación sobre el horario real) se reparte sobre los totales reales.
`GET /metrics/insights?branchId` mira los últimos tres meses de esa sucursal.

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
| `GET /metrics/marketing` | `kpis: { onlineBookings, bestChannel: string \| null, campaignBookings }`, `channels: [{ id, name, bookings, visits: number \| null, funnelBookings: number \| null }]`, `campaigns: [{ id, name, bookings, revenue }]`, `visitsSample`. Sale de lo que guarda cada cita en línea (`appointment.utm`, los `utm_*` del enlace con que se reservó; la reserva los manda en `utm`): canal = `utm_source` normalizado (`ig` → instagram, `fb` → facebook, `wa` → whatsapp; sin él, `directo`), campaña = `utm_campaign` con su nombre legible e ingreso cobrado. `bestChannel` no cuenta «Directo». `visits` y `funnelBookings` son las sesiones que empezaron la reserva desde ese origen y cuántas reservaron (las dos del embudo, nunca cruzadas con las citas); `null` sin medir. Sin sesiones reales, la demo usa las de ejemplo y lo dice (`visitsSample: true`). Sin datos, listas vacías (nunca ceros inventados ni números al azar). |
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
`appointment`: `{ id, branchId, clientId, barberId, requestedBarberId, serviceIds, products: [{ productId, qty }], start, durationMin, status, barberReady, walkIn, source: "internal" | "online" | "walkin", repeat, seriesId, notes, createdAt, createdBy, history: [{ id, at, actor, event }], payment: { method, tip, tax, total, paidAt, prepaid? } | null, online?: { reservation, method, paid, tip, discount } | null, confirmation?: { status: "confirmed" | "declined", at, via: "link" | "reception" } | null }`

`online` es lo que dejó resuelto la reserva en línea (lo pagado —tarjeta, anticipo, saldo o tarjeta de regalo—, la propina y lo descontado —cupón, cortesía o paquete—), repartido entre sus citas. Una cita reservada y pagada no se vuelve a cobrar: la caja cobra `total − online.paid`.
`status`: `scheduled` (agendada) → `arrived` (llegó) → `seated` (en silla) → `paid` (cobrada); fuera del camino, `no_show` y `cancelled`. Una cita `paid` ya no cambia de estado.
`block`: `{ id, branchId, barberId, category: "sick" | "vacation" | "holiday" | "lunch" | "meeting" | "business" | "personal", repeat: "none" | "daily" | "weekly" | "monthly", startDate, endDate, startTime, endTime, description }`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/calendar/catalog?branchId` | `{ barbers, clients, services, products }` de la sucursal. El cliente `cli_walkin` («Walk in») siempre va el primero. `services` son los del catálogo (sección «Servicios») activos en la sucursal; `products`, los de «Productos» activos y a la venta. |
| GET | `/calendar/day?branchId&date=AAAA-MM-DD` | `{ date, appointments, blocks }`. Cada cita por atender (agendada, no de paso, que no pasó hace más de una hora) trae `risk: { level: "low" \| "medium" \| "high", probability, reasons: ("pastNoShows" \| "cancels" \| "newClient" \| "farAhead" \| "unconfirmed" \| "prepaid" \| "confirmed")[] }`: una estimación por su historial (regresión logística con pesos fijados a mano: plantones previos, cancelaciones, cliente nuevo, reservó hace más de 14 días, sin confirmar a menos de 24 h; bajan el riesgo el anticipo y la confirmación). `high` ≥ 30 %, `medium` ≥ 15 %. Cuando haya historia, los pesos se entrenan por barbería sin cambiar la forma. Los bloqueos ya vienen resueltos para ese día (con su repetición aplicada). |
| GET | `/calendar/appointments?branchId&from=AAAA-MM-DD&to=AAAA-MM-DD` | `{ from, to, items }`: las citas de la sucursal en el rango, de la más antigua a la más nueva, con la misma forma que las del día. De 1 a 92 días, `422` fuera de eso. Es lo que usa el buscador del calendario (nombre, teléfono, barbero, servicio, estado, notas…), que filtra en la pantalla. |
| GET | `/calendar/month?branchId&month=AAAA-MM&barberId?` | `{ month, days: [{ date, occupancy: 0–1 \| null, count }] }`. `occupancy` es minutos de cita sobre minutos de jornada; `null` si nadie trabaja. Sin `barberId`, todo el equipo. |
| GET | `/calendar/rhythm?branchId` | `{ weeks, average, weekdays: [{ weekday: 0–6, average, samples }] }`: cuántas citas vivas suele tener cada día de la semana en las últimas `weeks` semanas (sin hoy; un día sin citas cuenta como cerrado). De ahí sale «día pesado / suave». Un barbero recibe el de su columna. |
| POST | `/appointments` | `{ clientId, barberId, serviceIds, start, walkIn, repeat, requestedBarberId?, notes?, branchId? }`. `201 appointment`. Va a `branchId` (la sede donde se crea) si el barbero trabaja ahí; si no, a la primera del barbero. Un walk-in (`walkIn: true`, sin repetir) de hoy nace `arrived` («llegó»), no `scheduled`. Con `repeat` distinto de `none` crea una serie de 12 con el mismo `seriesId` y devuelve la primera. `422`. `409 conflict` si el tramo pisa otra cita viva o un bloqueo del barbero (el mensaje dice con quién), o si pide un recurso especial (`/service-resources`) que a esa hora ya está completo, salvo con `force: true`, que usan los roles que agendan sin reglas (dueño, administrador, recepción, barbero de renta). |
| PATCH | `/appointments/:id` | Cualquiera de `{ status, barberReady, start, barberId, clientId, durationMin (15–480), serviceIds, notes, referencePhotos, reason?, actor? }`. `clientId` cambia de cliente mientras la cita no esté cerrada (cobrada, cancelada o sin presentarse: `422`): quita la confirmación, anula los avisos del anterior y se los programa al nuevo. `referencePhotos` reemplaza las fotos del corte (hasta 3 data URL de imagen, las mismas reglas que en la reserva en línea; `422` si alguna no sirve). Cada cambio deja una línea en `history`; `reason` («Movida 15 min porque la cita anterior se alargó») se guarda tal cual como `reason:…` y `actor: "assistant"` firma la línea como «Asistente» en vez de la persona de la sesión; `actor: "clipper"`, como «Clipper · persona de la sesión» (el cambio lo propuso Clipper y lo aprobó ella). `409 conflict` si al cambiar `start`, `barberId` o `durationMin` el tramo pisa otra cita viva, un bloqueo o un recurso especial completo, o si una cita cancelada o sin presentarse vuelve a `scheduled` sobre un hueco ya ocupado, salvo con `force: true`. `status: "paid"` no se acepta aquí (`422`): una cita queda cobrada solo con `POST /appointments/:id/checkout`, que guarda el pago. `422` · `404`. |
| POST | `/appointments/:id/checkout` | `{ serviceIds, products, tip, method: "cash" \| "card" \| "link" \| "mixed", surcharge?, split?, servicePrices?, productPrices? }`. `servicePrices` (en el orden de `serviceIds`, `null` = el de lista) y `productPrices` (`{ productId: precio unitario }`) cambian el precio en la caja y quedan en la cita; el barbero de comisión no puede (`403`). Además: `discount: { type: "percent" | "amount", value, reason? }` (sobre la cuenta antes de impuestos; queda como `checkoutDiscount`), `giftCode` + `giftAmount` (paga con una tarjeta de regalo: se descuenta su saldo), `giftSale: { amount, recipientName, recipientContact? }` (vende una tarjeta de regalo en el mismo cobro), `deviceId` (el datáfono) y `parts: [{ method: "cash" | "card" | "link", amount, deviceId? }]` (pago dividido, al menos dos partes que sumen lo que se cobra; con métodos distintos, `method: "mixed"`). Todo queda en `payment` (`discount`, `discountReason`, `gift`, `giftSale`, `parts`, `deviceId`). `422` si algo no cuadra. Con `mixed`, `split: { cash, card }` tiene que sumar lo que se cobra ahora (saldo + propina + recargo): si no, `422`; el recargo va solo sobre la parte de tarjeta. `surcharge` (el recargo por tarjeta de Configuración) solo cuenta con `card` y se suma al total. Cierra la cita como `paid` con su `payment`: `tax` es el de la sucursal y, si la cita vino de la reserva en línea, `payment.prepaid` es lo que ya estaba pagado (su `online.paid` + `online.tip`): en caja se cobra solo el resto. `409` si ya estaba cobrada o anulada. |
| POST | `/clients/:id/notes` | `{ kind, text }`. `201 client` con la nota al frente. `kind: "allergy" \| "medication"` es dato de salud: `409 health_consent_required` si el cliente no dio el permiso aparte (`PATCH /customers/:id/consent { health }`). |
| PATCH | `/clients/:id/notes/:noteId` | Cualquiera de `{ kind, text }`; conserva `createdAt`. `200 client`. `422` · `404` · `409 health_consent_required` (igual que al crear). |
| DELETE | `/clients/:id/notes/:noteId` | `200 client` sin la nota. `404`. |
| POST | `/blocks` | El bloqueo de arriba, sin `id`. `201 block`. `422` si la hora de cierre no es posterior a la de inicio. |
| DELETE | `/blocks/:id` | `204`. |
| GET | `/calendar/blocks?branchId` | `{ items: [timeBlock] }`: todos los bloqueos de la sucursal (un barbero, solo los suyos), para la lista de ausencias y bloqueos. Un bloqueo puede traer `status: "pending"` y `requestedBy`. |
| POST | `/blocks/:id/approve` | Aprueba un bloqueo pendiente (dueño, administrador o recepción; `403` a los barberos). Con `booking.blocksNeedApproval` encendido en Configuración, el bloqueo que crea un barbero nace `pending`; rechazarlo es `DELETE`. |
| GET | `/waitlist?branchId&date?` | `{ items: [{ id, branchId, clientId, serviceId, barberId, slots: [{ date, time }], createdAt }] }`. |
| POST | `/waitlist` | `{ branchId, clientId, serviceId, barberId \| null, slots }`. `201`. |
| DELETE | `/waitlist/:id` | `204`. |
| POST | `/sales` | Venta rápida de productos: `{ branchId, items: [{ productId, qty }], method, sellerId? }`. `201 { id, items, method, total, paidAt, sellerId }`. `sellerId` (quién vendió) comisiona en su nómina; el barbero vende siempre a su nombre; sin él, la venta es de la barbería. |

`history.event` es un código estable que el front traduce: `created`, `walkin`, `barber_ready`, `status:<estado>`, `moved:<inicio>`, `barber:<nombre>`, `duration:<min>`, `paid:<método>`.

El mock genera la agenda de cada día la primera vez que se pide, de forma determinista (la misma fecha y sucursal dan las mismas citas), y recuerda lo que se cambia durante la sesión.

## Mensajes al cliente (WhatsApp)

Cada cita que no es de paso y tiene teléfono deja sus mensajes en la cola (`db.booking.outbox`): la confirmación al
crearla, la reprogramación si se mueve, los recordatorios y, al cancelar, el aviso de hueco libre a la lista de
espera. Los recordatorios salen a las horas de Configuración › Recordatorios (`notifications.reminderHours`, hasta 3,
de 1 a 168 h; por defecto 24 y 2): a 24 h es `reminder24h`, a 2 h `reminder2h` y a otra hora `reminder` con
`hoursBefore` (plantilla `cita_recordatorio`, la hora como último valor). Lo que esté apagado para el cliente por
WhatsApp (`clients.bookingConfirmed.whatsapp`, `clients.bookingReminder.whatsapp`, `clients.bookingRescheduled.whatsapp`)
no se programa. Cancelar o marcar «no vino» anula los que faltaban. Cada mensaje: `{ id, appointmentId, to, channel,
kind, sendAt, status: "scheduled" | "sent" | "failed" | "cancelled", sentAt?, simulated?, providerId?, error? }`.

| Método | Ruta | Notas |
|---|---|---|
| POST | `/messages/dispatch` | Con sesión. Pone el outbox al día con la cola de WhatsApp del servidor: encola lo programado (`queued: true`), anula en la cola lo cancelado, refleja lo que ya salió y aplica las respuestas de los clientes (`/api/whatsapp/inbox`, desde `inboxCursor`). Sin cola, lo que ya toca queda `sent` con `simulated: true`. `{ sent, simulated, failed, replies }` de lo que cambió. Cada respuesta va a la cita del mensaje que contesta o, sin él, a la próxima cita del cliente por su celular: «Confirmo» → `confirmation: { status: "confirmed", via: "whatsapp" }`; otra hora → `reschedule_requested`; no puede venir → `declined` (la cita **no** se cancela sola: recepción decide); BAJA → `marketingConsent.accepted: false` con `source: "whatsapp"`; todo queda en el historial («Cliente (respondió el mensaje)») y lo que hay que resolver (otra hora, no puede, otra cosa) avisa a recepción (`whatsappReply`). La app lo llama cada minuto mientras hay sesión; el backend real encola al programar y no lo necesita. |
| GET | `/appointments/:id/messages` | Con sesión. `{ items, replies: [{ id, at, intent, text }] }` de esa cita, del más reciente al más viejo. |
| POST | `/appointments/:id/messages` | Con sesión. `{ kind: "receipt" \| "rebookLink", channel: "email" \| "sms", to, body }`: lo que el equipo manda desde el panel de la cita (el recibo o el enlace para reagendar). Sale en el momento y queda en los mensajes de la cita con `status: "sent"`. `201 { channel, to }`. `422` con `fields.to` si el correo o el celular no sirven; `409` si se manda el recibo de una cita sin cobrar; `409 sms_stopped` por SMS si el cliente respondió STOP (hasta ALTA). Todo SMS lleva al final «Responde STOP o BAJA para no recibir más SMS.». Para mandar por los dos, una llamada por canal. |
| POST | `/appointments/:id/simulate-reply` | Solo el backend simulado (demo). `{ intent }` como si el cliente respondiera por WhatsApp; pasa por la misma función que aplica las respuestas reales. |
| POST | `/booking/confirm` | Público. `{ token }` (el `confirmToken` de la cita, que va en el botón del mensaje). `200 { start, client, branch, confirmedAt }` y la cita queda `confirmation: { status: "confirmed", via: "link" }`. `404` si el token no existe · `409` si la cita está cancelada o marcada «no vino». Lo usa `/reservar/confirmar?t=`. |
| PATCH | `/appointments/:id` | Además de lo de Calendario, `confirmation: "confirmed" \| "pending"` la confirma desde recepción (`via: "reception"`) o lo quita. |

El envío lo hace el servidor con una cola (`server/whatsapp/queue.ts`; en local, el middleware de Vite). El
navegador nunca envía: encola y consulta, con la sesión firmada del equipo (ver «Sesión firmada»).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/whatsapp/queue` | `{ items: [{ id, to, kind, params: string[] (≤ 8), buttonParam?, sendAt, consent?, place? }] }` (hasta 50). Encola o reprograma; un mensaje que ya salió no se vuelve a enviar. `kind: "reactivation"` es marketing y exige `consent: { version, at }` (el permiso del cliente) y `place: { country: "CO" \| "US" \| "MX" \| "GENERIC", state?, timeZone }` (la sede): sale en la **franja legal** de esa hora (ver abajo); si `sendAt` cae fuera, la cola lo deja para la próxima apertura. **Tope por cliente**: una promoción por número cada 30 días (antes o después de la que se encola; lo anulado o fallido no cuenta): la que pase el tope va a `rejected`. `200 { items: [{ id, status, providerId, error, sentAt, attempts }], rejected: [{ id, message }] }`. |
| DELETE | `/api/whatsapp/queue?ids=a,b` | Anula los que aún no salieron (`status: "cancelled"`). |
| GET | `/api/whatsapp/queue?ids=a,b` | En qué va cada uno: `scheduled`, `sent`, `simulated`, `failed`, `cancelled`. |
| GET | `/api/cron/whatsapp` | El cron de Vercel (cada 5 min), con `Authorization: Bearer <CRON_SECRET>`: envía lo que ya toca. `{ sent, simulated, failed, retried, deferred, cancelled }`: justo antes de enviar una promoción vuelve a mirar la BAJA (`cancelled`) y la franja (`deferred`, a la próxima apertura). |
| GET | `/api/whatsapp/webhook` | La verificación de Meta: con `hub.mode=subscribe` y `hub.verify_token` igual a `WHATSAPP_VERIFY_TOKEN` devuelve `hub.challenge`; si no, `403`. Sin el token configurado, `503`. |
| POST | `/api/whatsapp/webhook` | Lo que manda Meta, firmado con `X-Hub-Signature-256` (HMAC SHA-256 con `WHATSAPP_APP_SECRET`; sin firma válida `401`, sin secreto `503`). Respuestas de los clientes: se clasifican con reglas (botón `CONFIRM`/`RESCHEDULE`/`CANCEL`/`STOP` o texto: «Confirmo», «otra hora», «no puedo ir», BAJA/STOP, ALTA/START; lo demás `other`), se ligan al mensaje al que responden (`context.id` → el id de la app) y se guardan una sola vez en la bandeja de la barbería. BAJA/STOP bloquea en ese momento las promociones a ese número (`422`/`rejected` al encolar). Estados: `delivered`/`read` quedan en el mensaje (`delivery`); `failed` lo deja fallido con su motivo. `200 { saved, optOuts, statuses }`. |
| GET | `/api/whatsapp/inbox?after=N` | Con sesión del equipo. Las respuestas que llegaron después de `N`: `{ events: [{ seq, wamid, at, from, intent: "confirm" \| "reschedule" \| "cancel" \| "stop" \| "start" \| "help" \| "other", text, messageId, channel? }], cursor }` (hasta 100). `channel: "sms"` en lo que llegó por SMS. |
| POST | `/api/sms/inbound` | El webhook de SMS (formato Twilio: formulario `From`, `To`, `Body`, `MessageSid`), firmado con `X-Twilio-Signature` (HMAC SHA-1 con `SMS_AUTH_TOKEN` sobre `SMS_WEBHOOK_URL` y los parámetros ordenados; sin firma `401`, sin token `503`). STOP/BAJA (y STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT): ese número no recibe más SMS ni promociones; START/ALTA devuelve los SMS; HELP/AYUDA contesta quién escribe, para qué y cómo darse de baja (`SMS_BRAND_NAME`, `SMS_HELP_CONTACT`). Lo demás se clasifica como en WhatsApp. Va a la bandeja una sola vez (`wamid: "sms:<MessageSid>"`). Responde TwiML (`<Response><Message>…`), en inglés si la palabra fue en inglés. La barbería sale de `To` = `SMS_FROM_NUMBER`. |

Todo queda dentro de la barbería de la sesión (`tid`). La plantilla sale por WhatsApp Cloud API (`WHATSAPP_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_<KIND>`; ver `.env.example`): sin llaves queda `simulated`; si WhatsApp
o la red fallan se reintenta a los 5, 10 y 20 minutos (3 intentos) y luego queda `failed` con el motivo; si el
mensaje está mal (`400`), `failed` sin reintento. La cola vive en Upstash Redis (`UPSTASH_REDIS_REST_*`); en
Vercel sin Upstash responde `501 queue_not_configured` y la app deja los mensajes como simulados.

**Franja legal de las promociones** (`src/features/legal/sendWindow.ts`, compartido por la app y el servidor), a la
hora de la sede: **Colombia** (Ley 2300 de 2023) lunes a viernes 7:00–19:00, sábado 8:00–15:00, nunca domingos ni
festivos (calculados con la Ley Emiliani y Semana Santa); **EE. UU.** (TCPA) 8:00–21:00, con Florida, Oklahoma,
Maryland y Washington hasta las 20:00, Connecticut 9:00–20:00 y Texas 9:00–21:00 (domingo desde las 12:00);
**México y el resto** lunes a sábado 9:00–20:00. Tampoco en festivos: los de EE. UU. (los 11 federales, el día y el
observado) y los de México (descanso obligatorio, LFT art. 74) por regla de producto. Solo las promociones: los mensajes de una cita salen cuando tocan.
Reglas de producto que confirma el abogado de cada país.

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
| POST | `/customers` | `{ firstName, lastName, phone, email?, branchId, country?, state?, city?, address?, zipcode?, birthDate?, onlineOnly? }`. `201 customerDetail`. El celular identifica al cliente (dos números son el mismo sin contar el indicativo del país, 57 o 1) y el correo es opcional. `422` con `fields` si falta nombre, apellido o celular válidos, si el correo escrito no es válido o si la fecha de nacimiento es futura; si el celular ya es de otro cliente, además `details.duplicateOf: { id, name }` para ofrecer su ficha. Lo mismo al editar (`PATCH`). |
| PATCH | `/customers/:id` | Los mismos campos del alta, o solo `{ blocked: boolean }` para bloquear y desbloquear, o solo `{ onlineOnly: boolean }` para «Reserva y pago solo en línea» (lo pone la agenda tras un «No asistió»), sin reenviar la ficha. Devuelve `customerDetail`. `422` · `404`. |
| POST | `/customers/:id/messages` | `{ purpose: "thanks" \| "rebook" \| "birthday" \| "free", body }`. Anota un mensaje que el equipo abrió en WhatsApp (`wa.me`) desde la ficha; queda en su historial (`kind: "manual"`). `rebook` y `birthday` son promoción: `409 no_consent` si el cliente no aceptó promociones `409 promo_cap` si ya tiene una promoción a menos de 30 días (automática o escrita a mano) y `409 outside_window` fuera de la franja legal de su sede. `201` con la relación. |
| GET | `/customers/:id/next-visit` | `{ suggestion: { everyDays, lastVisitAt, dueDate, isOverdue, usualTime, branchId, options: [{ start, barberId, barberName, sameBarber }] } \| null }`: cuándo le toca según su frecuencia y huecos reales con su barbero, a su hora de siempre. |
| GET | `/customers/reactivation?branchId` | Solo dueño o administrador. `{ items: [{ clientId, name, segment, everyDays, daysSince, consent, hasPhone, recentlyContacted, offer: { start, barberId, barberName, branchId } \| null }] }`: los que se pasaron de su ritmo (le toca volver, en riesgo o perdidos). `window: { allowed, nextAt }`: la franja legal de promociones en la sede. |
| POST | `/customers/reactivation` | Solo dueño o administrador. `{ branchId, clientIds }`. Pone en la cola de WhatsApp (`kind: "reactivation"`, plantilla `reactivacion_cliente` con el hueco) a los que aceptaron promociones, tienen celular, hay hueco y no se les escribió en 30 días. `{ queued, skipped: [{ clientId, reason: "noConsent" \| "recent" \| "noPhone" \| "noSlot" }], sendAt }`: `sendAt` es cuándo salen (ahora o la próxima apertura de la franja legal de la sede). |
| POST | `/customers/import` | `{ branchId, rows: [{ name, phone, email?, birthDate? (AAAA-MM-DD), note? }] (1–2.000), dryRun? }`. El celular se lleva a E.164 con el indicativo del país de la sucursal (+57 Colombia, +1 por defecto). `{ batchId, created, rejected: [{ row, name, reason: "name" \| "phone" \| "email" \| "birthDate" \| "duplicate" }] }`; con `dryRun` revisa sin crear (`batchId: null`). Repetido = mismo celular que un cliente o que otra fila del archivo. `201`. |
| DELETE | `/customers/import/:batchId` | Deshace la tanda: borra sus clientes que aún no tienen citas. `{ removed, kept }`. `404`. |
| POST | `/customers/:id/guests` | `{ name, relation? }`. `201 customerDetail`. Un invitado solo necesita nombre: la cita queda a nombre del titular. |
| DELETE | `/customers/:id/guests/:guestId` | `customerDetail` sin ese invitado. `404`. |

La relación que la reserva ya conoce va aparte, para no cargar la ficha:

| Método | Ruta | Notas |
|---|---|---|
| GET | `/customers/:id/relationship` | `{ membership: { every, progress, available, reward, rewardValue } \| null, packages: [{ id, name, service, remaining, total, expiresAt }], credit, giftCards: [{ code, recipientName, initial, balance, createdAt }] (las que compró), cards: [{ id, brand, last4, expMonth, expYear }], reviews: [{ id, rating, comment, barber, createdAt }], waitlist: [{ id, branchId, service, barber, slots, createdAt }] (solo huecos por venir), messages: [{ id, appointmentId, kind, channel, status: "sent" \| "failed", at, simulated, error }] (los 12 últimos), consent: { marketing: { accepted, at, source: "booking" \| "app" } \| null, health: { accepted, at, source, version, by } \| null } }`. `404`. `consent.smsStop: { at } | null` si respondió STOP por SMS; `promoWindow: { allowed, nextAt, timeZone }`: si ahora se puede mandar una promoción en su sede y, si no, desde cuándo; `promoCap: { sendAt } | null`: la promoción que ya tiene a menos de 30 días (el tope). |
| PATCH | `/customers/:id/consent` | `{ marketing?: boolean, health?: boolean }` (al menos uno). Guarda el permiso de promociones con la fecha y `source: "app"` (recepción) y devuelve la relación. Retirarlo siempre se puede; darlo, solo si el cliente lo dijo (Ley 1581: previo, expreso, informado y demostrable). Los mensajes de sus citas no dependen de este permiso. El permiso guarda también `version` y `country`: con qué texto se aceptó (el del país de la sede del cliente). **`health`** es el permiso aparte para anotar alergias y medicamentos (dato sensible; Ley 1581 art. 6, facultativo): lo anota recepción o gerencia (`403` al barbero) con `version: "health-…"` y quién lo anotó; retirarlo **borra** las notas `allergy` y `medication`. Retirar cualquiera de los dos queda en el registro de solicitudes (`type: "revoke"`, resuelta). `422` sin ninguno · `404`. |

Las notas se crean, corrigen y borran con `/clients/:id/notes` (sección Calendario): son las mismas que se ven al abrir una cita.

### Datos y privacidad

Los derechos del cliente sobre sus datos (`src/mocks/customers/privacy.ts`). Cada solicitud queda en un registro con su
plazo según el país de la sede: **Colombia** 10 días hábiles para consultas (`access`, `export`) y 15 para reclamos
(`rectify`, `erase`, `revoke`); **México** 20 hábiles; **EE. UU.** y el resto, 45 días. Los festivos aún no se descuentan.

`privacyRequest`: `{ id, clientId, clientName, type: "access" | "export" | "rectify" | "erase" | "revoke" | "other", channel: "app" | "phone" | "email" | "in_person" | "whatsapp", status: "open" | "done", note, requestedAt, dueAt, doneAt | null, by, overdue }`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/customers/:id/export?channel` | Dueño o administrador. Todo lo del cliente en JSON: datos, permisos, notas, invitados, citas (servicios, barbero, cobro), mensajes, respuestas, reseñas, tarjetas (marca y últimos 4) y saldo, y sus solicitudes. Anota una solicitud `export` resuelta. `403` · `404` (también si ya se borró). |
| POST | `/customers/:id/erase` | Dueño o administrador, con `X-Step-Up`. `{ channel?, note? }`. **Anonimiza**: nombre «Cliente borrado», sin celular, correo, dirección, cumpleaños, invitados, notas, permisos ni tarjetas; borra el texto y el destino de sus mensajes, sus respuestas, el nombre de sus reseñas, notas y fotos de sus citas y su lugar en la cola. Las citas y los cobros quedan (contabilidad) sin datos personales. Anota la solicitud `erase` antes de borrar (con el nombre que tenía). `200 { erasedAt }` · `403 step_up_required` · `404`. |
| POST | `/customers/:id/privacy-requests` | Recepción o gerencia. `{ type, channel, note? }`: lo que pidió por teléfono, correo o en el local; queda abierta con `dueAt`. `201` · `422` sin `type` o `channel`. |
| GET | `/privacy-requests?clientId&status` | Recepción o gerencia. `{ items, open }` (las más nuevas primero; `overdue` si sigue abierta y venció). `403` al barbero. |
| POST | `/privacy-requests/:id/done` | Dueño o administrador. `{ note? }` (se suma a la nota). `200 privacyRequest` · `404`. |

## Servicios (`/services`)

El catálogo de lo que se ofrece. Es la **fuente de lo que la agenda puede agendar**: `GET /calendar/catalog` devuelve como `services` los de aquí que están activos en la sucursal (servicios y combos, con el nombre de su categoría en `category`). Un servicio se crea una vez y cada sucursal decide si lo ofrece.

`category`: `{ id, name, description, visibility: "public" | "private" }`. `cat_none` («Sin categoría») existe siempre y no se puede borrar.
`service`: `{ id, kind: "service" | "combo", name, description, categoryId, price, branchPrice (\| null), cost (\| null), durationMin, taxRate (0–100 \| null), visibility, active, multiservice, prep: { enabled, minutes, position: "start" | "end" }, giftCards, includes: string[] (solo combos), createdAt, offeredBy, teamSize }`. `active` y `branchPrice` son relativos al `branchId` de la petición; `offeredBy` / `teamSize` cuentan los barberos de esa sucursal que lo ofrecen.

**Precio por sucursal.** `price` es el general; `branchPrice` el de la sucursal de la petición si tiene uno propio (otra tarifa u otra moneda). `POST` y `PATCH` aceptan `branchPrice` (número para fijarlo, `null` para volver al general) y solo tocan esa sucursal. Lo que se cobra es, en orden: el precio del barbero en Equipo, el de la sucursal, el general. Así cobran la agenda, la caja, la reserva, Transacciones, Nómina y Métricas.
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
| GET | `/service-resources` | `{ items: [{ id, name, description, units, serviceIds }] }`: los recursos especiales del local (un sillón de lavado, el vaporizador). Un servicio borrado sale de `serviceIds`. |
| POST | `/service-resources` | `{ name, description?, units (1–20), serviceIds (≥1) }`. `201 resource`. `422` si falta el nombre, se repite, las unidades no caben o ningún servicio existe. |
| PATCH | `/service-resources/:id` | Igual. `resource`. `404` si no existe. |
| DELETE | `/service-resources/:id` | `204`. Los servicios no cambian. |

## Productos (`/products`)

El catálogo de lo que se vende en mostrador. Como el de servicios, es la **fuente de lo que la caja puede cobrar**: `GET /calendar/catalog` devuelve como `products` los de aquí que están activos en la sucursal **y** a la venta (`sellable`). Las existencias van aparte, en «Inventario».

`category`: `{ id, name, description }`. `pcat_none` («Sin categoría») existe siempre y no se puede borrar.
`product`: `{ id, name, description, categoryId, price (venta), branchPrice (venta en la sucursal de la petición \| null), cost (compra \| null), taxRate (0–100 \| null), sku (\| null), brand (\| null), distributor (\| null), visibility: "public" | "private", sellable, active, createdAt }`. `visibility` dice si el cliente lo ve al reservar en línea; `sellable`, si el equipo puede venderlo (uno de uso interno va en `false`); `active` es relativo al `branchId` de la petición.

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

## Inventario (`/inventory`)

Existencias ligeras por sucursal de los productos activos y a la venta. Se mueven solas: el cobro de una cita descuenta sus productos, la venta rápida (`POST /sales`) los suyos y la reserva en línea **aparta** los que lleva desde que se reserva (vuelven si se cancela o se marca «no vino»; al cobrar solo se descuenta la diferencia, ver `stockTaken` en la cita). En mostrador se puede vender aunque el sistema diga 0 (queda en negativo: toca contar); en línea no: lo agotado no sale en `GET /booking/catalog` y `POST /booking/reservations` responde `409 out_of_stock` si no alcanza.

`stockItem`: `{ productId, name, sku, categoryId, imageUrl, onHand, min, status: "ok" | "low" | "out", sold30, daysLeft (\| null), lastMovementAt (\| null) }`. `low` es `onHand ≤ min`; `sold30`, lo vendido en 30 días (citas cobradas y ventas rápidas); `daysLeft`, para cuántos días alcanza a ese ritmo.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/inventory?branchId` | `{ items: stockItem[], low }` (`low`: cuántos están por reponer o agotados). |
| POST | `/inventory/movements` | `{ branchId, productId, kind: "receive" \| "count" \| "waste" \| "internal", qty, note? }`. Entrada suma; conteo fija lo que hay (`qty` ≥ 0) y anota la diferencia; merma y uso interno restan y piden `note`. `201 stockItem`. `422` con `fields`. |
| PATCH | `/inventory/:productId` | `{ branchId, min }` (0–1.000). `stockItem`. `404` si no se vende en la sucursal. |
| GET | `/inventory/:productId/movements?branchId` | `{ items: [{ id, delta, onHand, reason: "sale" \| "online" \| "return" \| "receive" \| "count" \| "waste" \| "internal", ref, note, at, by }] }`, los 50 últimos. |

## Transacciones (`/transactions`)

Las cuentas de un periodo. Es de **solo lectura**: una cuenta no se crea aquí —cada cita es una cuenta y cada venta de mostrador (`POST /sales`) es otra—, y cobrar, cancelar o mover una cita se hace por los endpoints del calendario.

`account`: `{ id, kind: "appointment" | "sale", date, invoice (\| null), client: { id, name, phone } (\| null), barber (nombre \| null), openedBy (\| null), chargedBy (\| null), status, appointmentStatus (\| null), source (\| null), lines: [{ kind: "service" | "product", name, qty, amount }], subtotal, discount, tax, tip, total, prepaid, onlineMethod (\| null), collected, refunded, balance, method (\| null), split ({ cash, card } \| null), refunds: [{ amount, to: "cash" | "card" | "credit", reason, at, by }], paidAt (\| null), reference, appointmentId (\| null), durationMin (\| null) }`
`status`: `open` (cita agendada o en curso, sin cobrar) · `paid` (cobrada) · `refunded` (se devolvió algo de verdad: desde la caja o al cancelar la reserva en línea; ya no hay devoluciones de muestra) · `void` (cita cancelada o a la que no se presentaron, sin devolución).
`total` = `subtotal − discount + tax` (con `pricing.taxInclusive`, el impuesto va dentro y no se suma). La cuenta va al precio del barbero que atendió; cobrada, con el impuesto que se registró al cobrar, y abierta, con el de su sucursal hoy. La propina (`tip`) va aparte y no entra en `collected`. `prepaid` es lo que ya se pagó al reservar en línea (`onlineMethod` dice con qué). `collected` es lo que se quedó la barbería: `prepaid` si está `open`; si no, lo cobrado (o lo pagado en línea de una cita anulada) menos `refunded`. `balance` es `total − prepaid` solo si está `open`. `invoice` existe desde que se cobra. En una venta de mostrador `client`, `barber`, `appointmentStatus` y `appointmentId` son `null`; lleva el impuesto de su sucursal.

| Método | Ruta | Notas |
|---|---|---|
| POST | `/appointments/:id/refund` | `{ amount, reason, to: "cash" \| "card", items? }`: devuelve una cuenta cobrada, entera o en parte, hasta `total + tip − refunded`. `items: [{ kind: "service" \| "product" \| "tip", id, qty, amount }]` dice qué se devuelve: los productos vuelven al inventario (no más de lo vendido menos lo ya devuelto: `422`). Responde la cita con `refunds`. `409` si no está cobrada; `422` con `fields`. La nómina deja de comisionar lo devuelto. |
| POST | `/appointments/:id/void-payment` | `{ reason }`. Borra una venta hecha por error: la cita vuelve a `seated` sin `payment`, lo vendido vuelve al inventario, la tarjeta de regalo usada recupera su saldo y la vendida queda sin saldo. Solo dueño y administrador (`403`); `409` si no está cobrada o ya tiene devoluciones; `422` sin motivo. |
| GET | `/transactions?branchId&from=AAAA-MM-DD&to=AAAA-MM-DD` | `{ from, to, items: account[] }`, de la más reciente a la más antigua. Sin paginar: el front resume, filtra por estado y busca en memoria. `422` si el rango es inválido, va al revés o pasa de 62 días. |

Las cifras de arriba de la pantalla (facturado, cobrado, por cobrar, propinas, devuelto) se calculan en el front sobre `items`; si el backend real pagina, tendrá que devolverlas en un `summary` aparte.

## Libro de pagos (`/payments`)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/payments?branchId&from&to` | `{ from, to, entries: [{ id, at, kind: "charge" \| "online" \| "tip" \| "refund" \| "sale" \| "void", method, amount, by, concept, appointmentId, saleId }], totals: { in, out, net, byMethod, byKind } }`, en orden de `at`. Cada movimiento de dinero del periodo (hasta 62 días): el cobro de la cita (uno por medio si fue mixto, sin lo ya pagado en línea), lo pagado en línea al reservar (`online`, con el medio de la pasarela), la propina (`tip`), cada devolución (`refund`, en negativo, con su destino) y cada venta de mostrador. `by` es quien lo registró (la línea `status:paid` del historial). Es de solo lectura y **solo se agrega**: una corrección es otro movimiento. Borrar una venta (`POST /appointments/:id/void-payment`) no saca su cobro: queda con su fecha y se suma un `void` en negativo con quién lo anuló y por qué (en `concept`); si después se cobra bien, es otro `charge`. Dueño, administrador y recepción ven todo; el barbero de renta, sus cuentas sin ventas de mostrador; el de comisión, `403`. |

## Caja (`/register`)

El cierre de caja de una sucursal y un día: lo que debía haber en efectivo según las cuentas frente a lo que se contó.

`expected`: `{ cash, card, link, online, refundsCash, refundsCard, accounts, renterCash, movementsIn, movementsOut }`. `cash` ya suma las entradas y resta las salidas de efectivo del día (`movements`). El efectivo que cobra un barbero de renta es suyo y no se espera en el cajón: va en `renterCash` (la misma regla que la nómina, `collectedBy: "barber"`). En efectivo: lo cobrado en caja ese día (la parte en efectivo de un pago mixto incluida, sin lo que ya estaba pagado en línea) y las ventas de mostrador en efectivo, menos lo devuelto en efectivo. Tarjeta y enlace se informan para cuadrar con el datáfono y la pasarela; `online` no pasa por la caja.
`closure`: `{ id, date, opening, expectedCash, counted, difference, note, closedAt, closedBy, denominations (\| null), blind }`. `difference` = `counted − (opening + expectedCash)`: positivo sobra, negativo falta.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/register?branchId&date=AAAA-MM-DD` | `{ branchId, date, blind, expected, closure (\| null), movements: [{ id, type: "in" \| "out", amount, reason, at, by }] }`. **A ciegas**: para quien no es dueño ni administrador y mientras el día no esté cerrado, `blind: true` y `expected.cash: null` (cuenta sin ver lo esperado). `422` sin sucursal o con fecha inválida. |
| POST | `/register/movements` | `{ branchId, date, type: "in" \| "out", amount, reason }`: efectivo que entra o sale del cajón sin ser un cobro (sencillo, pago a un proveedor, retiro). Mueve `expected.cash`. Recepción, administrador o dueño (barbero `403`); `422` sin motivo o con monto ≤ 0; `409` con el día cerrado. `201 movement`. |
| POST | `/register/:id/shortage` | `{ memberId }`. Dueño o administrador. Carga el faltante del cierre (diferencia negativa) como ajuste `shortage` en la nómina del ciclo de esa fecha y lo anota en `closure.shortage`. `409` sin faltante, ya cargado o con la nómina del ciclo aprobada. |
| POST | `/register/close` | `{ branchId, date, opening, counted, note, denominations? }` → `201 closure`. Con `denominations` (`{ "20": 3, "0.25": 4 }`), el servidor suma lo contado y no se fía de `counted`. Quien ve lo esperado explica la diferencia (`422` sin `note`); quien cuenta a ciegas cierra igual y la diferencia queda con `blind: true` para que la revise gerencia. `422` con valores negativos; `409` si ese día ya está cerrado. |

## Gastos (`/expenses`)

Lo que sale de caja en una sucursal. Un gasto **fijo** se repite con una frecuencia; uno **variable** pasó una vez.

`expense`: `{ id, branchId, ownerMemberId (\| null), kind: "fixed" | "variable", name, amount, frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual" (\| null en los variables), description, createdAt, date, endDate (\| null), categoryId, paymentMethod: "cash" | "bank" | "card" | "wallet" (\| null), supplier, attachments: [{ id, name, type, dataUrl }], createdBy, dueDay (\| null) }`. `amount` es lo que vale **cada vez que se paga**. `date` (AAAA-MM-DD) es, en un variable, cuándo se gastó (no puede ser futura) y, en un fijo, desde cuándo corre; un fijo con `endDate` deja de contar después de esa fecha. `categoryId`: `rent`, `utilities`, `internet`, `supplies`, `resale`, `cleaning`, `maintenance`, `advertising`, `software`, `taxes`, `other`. `attachments`: hasta 3 fotos (png, jpeg, webp, heic) o PDF de ~1 MB como data URL.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/expenses/categories` | `{ defaults: string[], custom: [{ id, name, createdAt }] }`: las de siempre (la app las traduce) y las propias de la barbería. |
| POST | `/expenses/categories` | `{ name }` (2–40). Dueño o administrador. `201 { id: "cat_…", name, createdAt }`; `409` si ya existe (sin distinguir mayúsculas) o pasan de 30. |
| DELETE | `/expenses/categories/:id` | Dueño o administrador. Sus gastos pasan a `other`. `204` · `404`. |
| GET | `/expenses?branchId&ownerMemberId?&from?&to?` | `{ items: expense[] }`, del más reciente al más antiguo. Sin paginar. Con `from` y `to` (AAAA-MM-DD), solo lo vivo en el periodo: los variables de esas fechas y los fijos que corrían algún día de él. Sin `ownerMemberId`, los de la sucursal (`ownerMemberId: null`); con él, solo los de ese barbero de renta (lo que compra para su silla). Un gasto sin el campo cuenta como de la sucursal. |
| POST | `/expenses` | `{ kind, name, amount, branchId, frequency? (obligatoria si es `fixed`), description?, ownerMemberId?, date?, categoryId? (de siempre o `cat_…`; una desconocida queda `other`), dueDay? (1–31, solo fijos: el día del mes en que se paga), paymentMethod?, supplier?, attachments? }`. `201 expense`. `422` con `fields`: nombre corto, valor que no es mayor que cero, fijo sin frecuencia. |
| PATCH | `/expenses/:id` | `{ name, amount, frequency?, description? }`. `kind` no cambia aunque se mande. `expense`. `422` · `404`. |
| POST | `/expenses/:id/end` | `{ endDate? }` (hoy por defecto; `null` lo reactiva). Solo fijos (`409` si no). Termina el gasto sin borrarlo: los meses pasados lo siguen contando. `422` si es antes de su `date`. |
| DELETE | `/expenses/:id` | `204`. `404`. |

El «por mes» de un fijo (`amount × pagos al año ÷ 12`) y el resumen del mes los calcula el front sobre `items`.

## Reportes (`/reports`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/reports/income?branchId&month=AAAA-MM` | Estado de resultados del mes, hasta hoy si es el mes en curso. `{ month, days, elapsedDays, revenue: { services, products, rent, refunds, total }, costs: { products, commissions, salaries, adjustments, expensesFixed, expensesVariable }, contribution, fixedCosts, net, marginPercent, breakEven: { revenue, perDay, servicesPerDay, actualPerDay, avgTicket, openDays, contributionPercent } \| null, previous: { month, elapsedDays, revenue, net } }`. `422` sin sucursal o mes. |
| GET | `/reports/menu?branchId&days=30\|90\|180` | Solo dueño o administrador. Margen por hora de silla y matriz del catálogo: `{ days, avgMarginPerHour, chairHours, margin, units, costCoverage: { withCost, total }, items: [{ serviceId, name, units, popularity (% de unidades), avgPrice, unitCost, unitCommission, unitMargin, minutesPerUnit, hours, marginPerHour, hasCost, quadrant: "star" \| "plowhorse" \| "puzzle" \| "dog", targetPrice (\| null) }] }`. Margen = precio cobrado (el del barbero) − costo de insumos − comisión real de Nómina repartida por servicio; horas = (duración + preparación) × vendidos. Popular si vende al menos el 70 % del promedio por servicio; rentable si su margen por hora supera el promedio ponderado por horas (Kasavana y Smith). `targetPrice`: el precio con el que llegaría al promedio con la misma comisión y costo. No cuenta lo de barberos de renta. Un servicio sin costo cuenta cero (por eso `costCoverage`). |

Todo va sin impuesto ni propina. **Ingresos**: lo cobrado por el equipo propio (servicios y productos, también ventas de mostrador) más la renta de sillas y las deducciones de los barberos de renta (lo que ellos cobran es suyo), menos devoluciones. **Variables** (crecen con lo vendido): costo del producto vendido (`products.cost`) y comisiones. **Fijos**: salarios, bonos y ajustes de nómina, gastos fijos de la sucursal llevados al mes —en proporción a los días vividos si el mes va a medias— y gastos variables del mes. `contribution = revenue − variables`; `net = contribution − fixedCosts`. **Punto de equilibrio**: lo fijo del mes completo ÷ (`contribution / revenue`); `servicesPerDay` lo divide por el ticket promedio y los días con agenda; `actualPerDay` es lo que se lleva. Un mes a medias se compara con el mismo tramo del anterior (`previous.elapsedDays`).

## Equipo en operación (`/team`)

Además de las fichas (`/team/members`), niveles, orden y horarios:

| Método | Ruta | Notas |
|---|---|---|
| POST | `/team/members/remind` | `{ ids }`. Recuerda la invitación a los invitados que gestiona quien llama, una vez cada 24 h (al crear a alguien ya sale la primera). `{ sent, simulated, skipped: [{ id, name, reason: "notInvited" \| "recent" \| "forbidden" }] }`. |
| POST | `/team/members/deactivate` | `{ ids }`. Pasa a `inactive` (con `deactivatedAt`) y apaga su lugar en la fila sin cita y en «sin preferencia»; su historia y su nómina quedan. `{ deactivated: [{ id, name, upcoming }], skipped: [{ id, name, reason: "self" \| "forbidden" \| "inactive" }] }`; `upcoming` son sus citas por venir, para reasignarlas. |
| POST | `/team/members/import` | `{ branchId, items: [{ firstName, lastName, phone, email, role }] }` (hasta 100). Solo `barbero-comision`, `barbero-renta` y `recepcion`; entran `invited` con el primer nivel si atienden. `201 { created: [{ id, name }], rejected: [{ row, message }] }` (celular o correo repetido, datos inválidos, rol que no gestiona). |
| GET | `/team/members/:id/bank` | Quien gestiona a esa persona o ella misma, con `X-Step-Up`. `{ bankName, accountNumber }` completo. |
| GET | `/team/lineup/turn?branchId&kind=walkIn\|noPreference` | `{ kind, next, items: [{ memberId, name, avatarUrl, position, count, working, free }] }`. A quién le toca: los encendidos en esa fila que trabajan hoy, primero quien menos clientes de ese tipo lleva hoy y, a igualdad, el que va antes en la fila; `next` es el primero libre ahora. La venta sin cita lo preselecciona y la reserva «sin preferencia» reparte en ese orden. |
| GET | `/team/home?branchId` | La portada: `members` (cada persona con `chair`, `occupancy`, `services` y `revenue` de la semana, `payout`, `retention` a 90 días, `rentDueOffset`, `openRegisters`), `openShifts` (turnos de la semana que viene sin cubrir por una ausencia aprobada), `series` (7 semanas de ocupación, servicios y turnos), `pendingAbsences`, `absentToday`. |
| GET | `/team/members/:id/performance?branchId` | Últimos 90 días: `services`, `occupancy`, `rebookRate` (dejó otra cita con él en la semana), `retention`, `avgTicket` (sin impuesto), `productsPerService`, `tips`, `noShows`, `noShowRate`, `rating`, `reviews`. Un barbero solo el suyo (`403`). |
| GET | `/team/absences?branchId` | `{ items: [{ id, memberId, memberName, branchId, kind: "vacation" \| "sick" \| "personal", startDate, endDate, note, status: "pending" \| "approved" \| "rejected", requestedBy, requestedAt, decidedBy, decidedAt, reason, affected: [{ id, start, client }] }] }`. Un barbero solo las suyas. `affected` son sus citas por atender esos días. |
| POST | `/team/absences` | `{ branchId, kind, startDate, endDate?, note?, memberId? }`. Comisión, salario y recepción la piden para sí: queda `pending`. El barbero de renta y quien gestiona (para cualquiera, con `memberId`): queda `approved`. `409` si se cruza con otra. |
| POST | `/team/absences/:id/approve` · `/reject` | Dueño, administrador o recepción (los barberos no). Aprobar crea un bloqueo diario en su agenda (`vacation`, `sick` o `personal`); rechazar pide `{ reason }`. `409` si ya se decidió. |
| DELETE | `/team/absences/:id` | La propia pendiente, o cualquiera si gestiona; quita su bloqueo. |

## Recepción y kiosco (`/front-desk`, `/kiosk`)

Un kiosco es una tablet de recepción **atada a una sede**, con su propio token (no es la sesión de nadie). Ver
docs/investigacion-modulos/16-front-desk.md.

**Kioscos (Configuración).** Solo dueño o administrador (`403` para los demás).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/front-desk/devices?branchId?` | `{ items: [{ id, branchId, branchName, name, status: "pending" \| "active" \| "revoked", pairingCode, pairingExpiresAt, createdAt, createdBy, pairedAt, lastSeenAt }] }`. Nunca devuelve el token. |
| POST | `/front-desk/devices` | `{ branchId, name? }` → `201` el kiosco con `pairingCode` (6 dígitos, 10 minutos, una sola vez). `422` sin sede válida. |
| POST | `/front-desk/devices/:id/code` | Un código nuevo; el token anterior deja de valer (cambiar de tablet). |
| DELETE | `/front-desk/devices/:id` | Lo desactiva: su token deja de valer al momento (`204`). |

**El kiosco.** Manda `X-Kiosk-Token`; sin token o desactivado, `401 kiosk_unauthorized` (la tablet vuelve a pedir código).

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/kiosk/pair` | `{ code }` → `{ token, device: { id, name }, branch: { id, name } }`. `422 invalid_code` si no existe, venció o ya se usó; 10 intentos por minuto. |
| GET | `/kiosk/me` | `{ device, branch, phoneCountry, shopName, services: [{ id, name, durationMin }], barbers: [{ id, firstName, avatarUrl }], queue: { waiting, waitMin, waitMax } }` (los barberos que atienden sin cita hoy; la espera si alguien se uniera ahora). |
| POST | `/kiosk/lookup` | `{ phone }` → `{ appointments: [{ id, time, firstName }] }`: las citas «programadas» de hoy en la sede de ese celular, desde 2 h antes hasta 1 h después de su hora. **Solo nombre de pila y hora**: nada de correo, teléfono ni barbero. Un número desconocido devuelve la lista vacía (no dice si es cliente). 20 por minuto por kiosco. |
| POST | `/kiosk/check-in` | `{ appointmentId, phone }` (se vuelve a comprobar el celular) → `{ firstName, time, barberFirstName }`; la cita pasa a `arrived` con «Kiosco · nombre» en el historial y avisa a su barbero y a recepción (`clientArrived`). `404` si no es de ese celular, no es de hoy en esa sede o ya no está «programada». |
| GET | `/kiosk/board` | La pantalla de turnos (`/turnos`, el televisor de la sala, con el token de un kiosco de la sede): `{ branch, shopName, called: [{ id, firstName, barberFirstName, calledAt }] (los 3 llamados en los últimos 10 min), next: [{ id, position, firstName, waitMin, waitMax }] (los 8 siguientes), waiting }`. Sin celular ni servicio. |
| POST | `/kiosk/queue` | `{ firstName, phone?, serviceIds, barberId? }` → `201 { id, firstName, position, waitMin, waitMax, barberFirstName }`. `409 already_waiting` si ese celular ya está en la fila; `409 queue_full` con 40 esperando; `422` sin nombre o servicio. |

**La fila sin cita (Calendario › Fila sin cita).** Con sesión. Todos la ven (el barbero, sin la ficha del cliente);
la mueven recepción, dueño y administrador (`403` para un barbero).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/front-desk/queue?branchId` | `{ branchId, waiting: [{ id, firstName, clientId, hasPhone, services, serviceIds, barberId, barberName, joinedAt, source: "kiosk" \| "reception", position, waitMin, waitMax, suggestedBarberId, suggestedBarberName }], served, left }` de hoy en la sede. |
| POST | `/front-desk/queue` | `{ branchId, firstName, phone?, serviceIds, barberId? }`: recepción suma a alguien. `201` la fila. |
| POST | `/front-desk/queue/:id/call` | `{ barberId? }` → `{ appointment, queue }`: crea una cita `walkIn` en estado `arrived` ahora, con el barbero elegido, el que pidió, el que le tocaba según la espera o el siguiente de la fila de Equipo. `409 no_barber` si no hay nadie. |
| POST | `/front-desk/queue/:id/leave` | `{ reason: "left" \| "removed" }`: se fue sin atender (cuenta en `left`) o se quitó. |

**«Ya casi te toca».** A quien dejó su celular, una sola vez, cuando es el primero de la fila o le faltan 15 minutos
o menos (y lleva al menos 5 minutos en la fila): un mensaje `kind: "queueAlmost"` (plantilla `fila_casi_tu_turno`
con nombre, sede y espera; botones «Voy» / «Ya no voy») por la misma cola de WhatsApp. Se revisa cada vez que la
fila cambia o alguien la mira (recepción, kiosco, pantalla de turnos). «Ya no voy» lo saca de la fila (`left`).

**Espera estimada.** Simulación, no modelo (`src/mocks/frontDesk/estimate.ts`): la fila se reparte en orden entre los
barberos que atienden sin cita hoy (fila de Equipo, sin ausencias), cada uno cuando se libera (lo que le queda a quien
está en la silla y sus citas de hoy), con la duración de catálogo del servicio. Quien pidió un barbero espera a ese.
Se da como rango de 10 minutos; `null` si hoy ya no alcanza.

## Legal (`/legal`)

Los documentos (`src/features/legal/documents/`) son datos versionados y públicos en `/legal/<slug>`: términos
(`terminos`, `terms-2026-10`), privacidad (`privacidad`, `privacy-2026-10`), tratamiento de datos de Colombia
(`tratamiento-datos`, `data-policy-co-2026-10`), acuerdo de encargo (`encargo`, `dpa-2026-10`) y subencargados
(`subencargados`). Son borradores de producto: un abogado de cada país los aprueba antes de publicarse.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/signup` | Además de `acceptTerms: true`, `termsVersion`, `privacyVersion` y `dpaVersion` iguales a las vigentes; si no, `422` en `fields.acceptTerms` («los términos cambiaron»). El backend real guarda las tres versiones con la fecha. |
| GET | `/legal/acceptances` | Dueño o administrador. `{ current: { terms, privacy, dpa }, dpa: { version, at, by } \| null, terms: … \| null }`. |
| POST | `/legal/dpa/accept` | Dueño o administrador. `{ version }` igual a la vigente (si no, `422 outdated_version`) → la misma vista con la aceptación guardada (versión, fecha y quién). |

El aviso de privacidad de la reserva (`consentPack`, versiones `…-2026-10b`) cierra con el contacto de la sede (su
teléfono), que los datos se guardan en servidores de proveedores en EE. UU. y el enlace a `/legal/privacidad`.

## Sesión firmada de las funciones de servidor

La voz (`/api/tts`), Clipper (`/api/clipper`, `/api/clipper/feedback`), la narración (`/api/narrative`) y la
cola de WhatsApp (`/api/whatsapp/queue`) cuestan dinero: piden `Authorization: Bearer <token>`, un JWT HS256
firmado con `SESSION_SECRET` (`server/auth/session.ts`) con `{ sub, tid, role, mid?, scope: "staff" | "guest", iat, exp, jti }`.
Sin token `401 unauthorized`; firma mala o caducado `401 session_expired` (la app lo olvida); alcance que no
alcanza `403`; sin secreto en el servidor `503 session_not_configured`. Cada sesión tiene cupo por minuto y
por día (`429 quota_exceeded`) además del tope por IP (`429 rate_limited`):

| Función | Por minuto | Por día | Alcance |
|---|---|---|---|
| `/api/tts` | 30 | 600 | equipo o invitado |
| `/api/clipper` | 30 | 400 | equipo (el rol sale del token, no del cuerpo) |
| `/api/clipper/feedback` | 30 | 300 | equipo |
| `/api/narrative` | 10 | 100 | equipo |
| `/api/whatsapp/queue` | 60 | 3000 | equipo |

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/session` | `{ phone, code }` de una cuenta de la demo → `{ token, expiresIn }` (8 h). La app lo pide al entrar con el código y lo guarda en `sessionStorage`; se borra al salir. `401 invalid_code`; `404` con `SESSION_DEMO_LOGIN=off` (el backend real emite el token al entrar, con el mismo secreto). 10 intentos por minuto por IP. |
| POST | `/api/session/guest` | → `{ token, expiresIn }` (30 min, `scope: "guest"`): el cliente de la reserva en línea, solo para la voz. 5 por IP cada 10 minutos. |

## Clipper (`/api/clipper`, función de servidor)

Clipper responde con los datos de la barbería usando herramientas **de consulta** y **propone cambios** que la
persona aplica. El servidor guarda la clave
(`ANTHROPIC_API_KEY`; modelo en `CLIPPER_MODEL`, por defecto `claude-sonnet-5-5`), elige qué herramientas ve el modelo
según el rol (`src/lib/clipper/toolCatalog.ts`) y hace **un paso** de la conversación. La app ejecuta las consultas
con la sesión de quien pregunta, así que cada endpoint aplica su permiso (ver «Permisos en el servidor»).

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/clipper` | Cuerpo `{ context: { locale, role, today, branch, currency, userName, turnId? }, messages }`. `200 { kind: "tools", content, calls: [{ id, name, input }], usage }` si pide consultas, o `200 { kind: "answer", text, model, usage }` (`usage: { input, output }` en tokens). `400` conversación inválida; `501 not_configured` sin clave (la app responde con el centro de ayuda); `502 unsafe_output` si pidió una herramienta que no es de su rol o si la respuesta trae cifras que no salen de las consultas; `401`/`403`/`429` según «Sesión firmada». |
| POST | `/api/clipper/feedback` | `{ turnId, value: "up" \| "down" \| null, reasons?, comment?, share?, question?, answer? }` → `204`. El 👍/👎 de una respuesta; la pregunta y la respuesta solo se guardan con `share: true`. `400` sin `turnId`; sesión y cupos como en «Sesión firmada». |

`messages` es la conversación en el formato de Claude: el usuario manda texto y `tool_result`; el asistente, texto y
`tool_use`. Hasta 40 mensajes y 200 KB; cada resultado, hasta 12 000 caracteres. Debe empezar y terminar en el usuario.

Herramientas: `agenda_del_dia`, `cuentas_del_periodo`, `buscar_cliente`, `proxima_visita_cliente` y `buscar_ayuda`
(todos); `caja_del_dia`, `turno_sin_cita` y `revision_antes_de_cerrar` (dueño, administrador, recepción); `nomina`
(dueño, administrador y barberos, la suya); `resumen_semana`, `clientes_para_reactivar` y `rentabilidad_servicios`
(dueño y administrador); `catalogo_de_la_sucursal` (todos: barberos y servicios con sus ids). Cada una devuelve un
resumen con los conteos y totales ya hechos.

**Propuestas** (`kind: "propose"`): `proponer_mover_cita`, `proponer_cita`, `proponer_cancelar_cita` y
`proponer_bloqueo` (dueño, administrador, recepción); `proponer_nota_cliente` (todos). No cambian nada: la app valida,
mira la agenda para avisar de choques y deja en la respuesta una tarjeta (`ChatAction`: título, filas con antes y
después, avisos) con «Aplicar». Al modelo le vuelve que la propuesta espera a la persona; nunca dice que ya está hecho.
«Aplicar» usa los endpoints de siempre (`PATCH /appointments/:id`, `POST /appointments`, `POST /blocks`,
`POST /clients/:id/notes`) con `actor: "clipper"`, que deja **«Clipper · quien aprobó»** en el historial de la cita (y
en `createdBy` de la cita nueva); el servidor sigue negándose a pisar otra cita (`409`) y la tarjeta muestra el motivo.
«Deshacer» devuelve lo que había: la hora y el barbero, el estado anterior (una cita cancelada vuelve a agendada si
nadie tomó el hueco; si no, `409`), cancela la cita creada, borra el bloqueo o la nota.

**Registro.** Cada pregunta lleva un `turnId` que une sus pasos. Cada paso deja una línea JSON en los logs del
servidor (`type: "clipper_step"`: `turnId`, `role`, `locale`, `outcome` —`tools`, `answer`, `corrected`, `unsafe_tool`,
`unsafe_numbers`, `provider_error`, `not_configured`, `invalid`—, `tools`, `model`, `inputTokens`, `outputTokens`, `ms`)
sin la pregunta ni la respuesta, que pueden traer datos de clientes; cada 👍/👎 deja `type: "clipper_feedback"`.

**Evaluación.** `src/features/clipper/evals/questions.ts` tiene 60 preguntas (español de Colombia, de EE. UU. con
spanglish e inglés; los cinco roles) con la herramienta que debe usar o si debe proponer o mandar a la ayuda. Con
`ANTHROPIC_API_KEY`, `npx vitest run src/features/clipper/evals/runEvals.test.tsx` pregunta al modelo con la demo y
exige 90 % bien; sin clave se salta.

**Cifras verificadas**: cada número de la respuesta tiene que aparecer en los resultados de las consultas o en lo que
preguntó la persona (en cualquiera de sus lecturas: `1.239` puede ser mil doscientos treinta y nueve o uno coma dos;
se admite el redondeo a entero o a un decimal). Los enteros sueltos hasta 10 no necesitan consulta. Si alguno no
cuadra, el servidor le pide al modelo una corrección sin herramientas; si insiste, `502` y la app usa el centro de ayuda.

## Narración (`/api/narrative`, función de servidor)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/reports/week?branchId` | Solo dueño o administrador. Las cifras de «Cómo te fue»: los últimos 7 días contra los 7 anteriores. `{ from, to, revenue, revenuePrev, services, servicesPrev, occupancy, noShows, products, topBarber: { name, revenue } \| null, bestDay: { day, revenue } \| null, atRisk }`. |
| POST | `/api/narrative` | `{ kind: "week" \| "pay", locale: "es" \| "en", facts: { [clave]: { label, value } } }` (hasta 20; claves alfanuméricas, etiquetas de 80 y valores de 40 caracteres) → `{ text, model }`. Claude redacta **con marcadores** (`{revenue}`) y sin dígitos; el servidor rechaza la respuesta si trae un dígito o un marcador desconocido (`502 unsafe_output`) y pone él las cifras. Sin `ANTHROPIC_API_KEY`, `501`. En cualquier fallo la app muestra su resumen automático con las mismas cifras. Modelo: `NARRATIVE_MODEL` (por defecto `claude-haiku-5-5`). Con sesión firmada del equipo y cupo por sesión. |

## Revisión antes de cerrar (`/payroll/review`, `/register/review`)

Antes de aprobar una nómina o de cerrar la caja, lo raro frente al historial y a las reglas. Son reglas
explicables, no un modelo: cada alerta dice qué pasó y con quién. No bloquean: con una alerta `high`,
la app pide marcar «Lo revisé» antes de aprobar o cerrar.

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/payroll/review?branchId&from&to` | `{ items: Finding[] }`. Dueño y administrador; los demás, `403`. Periodo inválido: `422`. |
| GET | `/register/review?branchId&date=AAAA-MM-DD` | `{ items: Finding[] }`. Recepción, administrador y dueño; el barbero, `403`. |

`Finding`: `{ id, severity: "high" | "medium" | "info", kind, params, appointmentId?, date?, memberId? }`, de lo
grave a lo informativo. `params` lleva los datos del texto (nombres y cifras; las cifras de dinero en la moneda
de la sucursal). `date` es el día de `appointmentId`, para abrirla en la agenda.

Nómina (`kind`): `netChange` (neto ±40 % frente al promedio de los 4 periodos de igual duración anteriores, con
al menos 3 con citas; no aplica a renta), `salaryNoServices` (salario sin citas atendidas), `rentOwed` (renta
pendiente después de los pagos del periodo), `tipOutlier` (propina > 50 % del servicio), `zeroSale` (cita cobrada
sin valor de servicio), `newClientRepeat` (comisión de cliente nuevo pagada a quien ya vino en esos 4 periodos;
una alerta con los nombres), `bigAdjustment` (ajuste > 50 % de lo ganado), `duplicateAdjustment` (`high`: misma
persona, tipo y valor dos veces).

Caja (`kind`): `duplicateCharge` (`high`: mismo cliente, barbero, servicios y total el mismo día, sin contar las
citas enlazadas), `duplicateSale` (`high`: dos ventas de mostrador iguales a menos de 10 minutos),
`openAccounts` (`high`: clientes que llegaron o están en la silla y no se cobraron), `tipOutlier`,
`bigDiscount` (> 30 % del subtotal), `bigRefund` (> 50 % de lo cobrado), `selfRefund` (devolución en efectivo
hecha por quien cobró).

## Nómina (`/payroll`)

Lo que se le paga a cada barbero en un periodo. **Abierto**, se calcula sobre las citas **cobradas** del rango y la compensación de cada persona (su ficha en Equipo, `compensation` y `payments`) y admite ajustes. **Aprobado**, queda una foto fija: lo que cambie después en citas o reglas ya no la mueve. **Pagado**, además se sabe con qué se pagó. La renta y el salario son **por semana**; un rango de N días son N/7 semanas.

Cómo se calcula (para que cuadre con la caja):

- La base de la comisión (`line.sale`) es lo cobrado de los servicios **al precio del barbero que los hizo** (el mismo de la reserva y de la caja), menos lo que pide Configuración › Comisiones: el descuento que se le hizo al cliente (`deductDiscounts`), el impuesto si va incluido en el precio (`deductTaxes`), el costo del servicio (`deductServiceCost`). La de productos, igual con `deductProductCost`.
- En escala, el tramo sale de lo vendido en el **ciclo de pago** que contiene la cita (Configuración › Nómina: semanal o quincenal desde un día de la semana, o mensual desde un día del mes), no del rango consultado.
- Las deducciones de la renta (`payments.*Deduction`) son un **porcentaje** de la venta de esa cita.
- **Renta**: importa quién tiene el dinero. Lo que entró por la caja de la barbería (tarjeta, enlace, la parte de tarjeta de un pago mixto, lo pagado en línea) es del barbero y la barbería se lo guarda (`line.collectedBy: "shop"`, `line.held`); lo que cobró él en efectivo ya lo tiene (`"barber"`). Su `net` = `held − rent − deductions + adjustmentsTotal`. Además llegan `rentPaid` (lo que pagó de renta en el periodo), `rentPayments` y `balance` = `net + rentPaid` (negativo: debe; positivo: la barbería le debe).

`member`: `{ memberId, name, avatarUrl, payout: "commission" | "rent" | "salary", rules (\| null), rentBase (\| null), salaryBase (\| null), services, serviceSales, productSales, serviceCommission, productCommission, tips, salary, rent, deductions, adjustments: adjustment[], adjustmentsTotal, net, lines }`
`rules` (solo comisión): `{ type: "commission" | "scale", basic, recurring, walkIn, noPreference, newClient, productPercent, scale: [{ from, percent }] }` en porcentajes; una regla `null` usa la básica.
`line`: `{ appointmentId, date, client, service, rule: "walkIn" | "noPreference" | "newClient" | "recurring" | "basic", rate (\| null), sale, commission, tip, deduction }`. La regla sale de quién trajo al cliente, de la más específica a la menos: sin cita → sin preferencia → cliente nuevo → cliente que repite → básica. Un cliente es nuevo una sola vez: con la etiqueta «nuevo», solo su primera cita cobrada del periodo paga como `newClient`; las siguientes, como `recurring`.
`adjustment`: `{ id, kind: "bonus" | "deduction" | "advance" | "shortage" | "loan", amount, note, createdAt, createdBy, closureId?, loanId? }`. El bono suma; el descuento, el adelanto, el faltante de caja (`shortage`, con el cierre de donde sale) y la cuota de préstamo restan. La cuota (`loan`, id `loan:<préstamo>:<n>`) la pone el sistema en cada ciclo: no se crea ni se borra por `/payroll/adjustments`.
**Ventas de mostrador**: las de `POST /sales` con `sellerId` comisionan para esa persona como producto (`productSales`, `productCommission`; `counterSales` = cuántas), con la misma base que un producto en una cita.
**Ciclo de pago** (Configuración › Nómina): semanal desde el día de la semana; **quincenal = del día elegido a 14 días después y de ahí al día anterior del mes siguiente** (con el día 1: del 1 al 15 y del 16 a fin de mes, como se paga en Colombia y México); mensual desde el día del mes (`src/features/payroll/payCycle.ts`). La pantalla abre en el ciclo en curso.
`net` = `serviceCommission + productCommission + tips + salary − rent − deductions + adjustmentsTotal`. **Positivo**: la barbería le paga. **Negativo**: el barbero (de renta) le debe a la barbería.
`run`: `{ id, status: "approved" | "paid", approvedAt, approvedBy, paidAt, paidBy, method, reference } | null` (`null` = abierto). `history`: `[{ at, actor, event: "approved" | "paid" | "reopened", reason }]`.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/payroll?branchId&from=AAAA-MM-DD&to=AAAA-MM-DD&memberId?` | `{ from, to, weeks, run, history, members: member[] }` con los barberos de la sucursal en su orden de calendario; aprobado o pagado, la foto fija. Con `memberId`, solo esa persona («Lo que llevo» / «Mi negocio» del barbero). `422` si el rango es inválido, va al revés o pasa de 62 días. |
| POST | `/payroll/adjustments` | `{ branchId, from, to, memberId, kind, amount, note }` → `201 adjustment`. `422` con `fields` (valor ≤ 0, motivo corto, persona que no existe); `409` si el periodo ya está aprobado. |
| DELETE | `/payroll/adjustments/:id` | `204`. `409` si el periodo ya está aprobado; `404`. |
| GET | `/payroll/loans?branchId&memberId?` | `{ items: [{ id, memberId, amount, installments, startDate, note, createdAt, createdBy, cancelledAt }] }`. El barbero ve solo los suyos. |
| POST | `/payroll/loans` | `{ branchId, memberId, amount, installments (1–24), startDate?, note }`. Dueño o administrador. El dinero se entrega aparte; se descuenta en cuotas iguales (la última con el redondeo), una por ciclo desde el de `startDate`. `201`. `409` si ese ciclo ya está aprobado. |
| POST | `/payroll/loans/:id/cancel` | Deja de cobrar desde el ciclo en curso (las cuotas ya descontadas quedan). `200 loan`. |
| POST | `/payroll/runs` | `{ branchId, from, to }`: aprueba el periodo y guarda la foto. `201 run`. `409` si ya estaba aprobado o `409 overlap` si se cruza con otro periodo aprobado (pagaría dos veces el mismo trabajo). |
| POST | `/payroll/rent-payments` | `{ branchId, memberId, amount, method, date?, note? }`: un pago de renta de un barbero de renta. `201`. `422` si la persona no paga renta, el valor no es mayor que cero o falta el medio. Se cuenta en el periodo de su `date` aunque la nómina esté aprobada. |
| DELETE | `/payroll/rent-payments/:id` | `204`. `404`. |
| POST | `/payroll/runs/:id/pay` | `{ method, reference? }` → `run` pagado. `409` si ya estaba pagado. |
| POST | `/payroll/runs/:id/reopen` | `{ reason }` (5+ caracteres): vuelve a abierto y queda en `history`. `204`. `409` si ya está pagado (se corrige con un ajuste en el siguiente periodo); `422` sin motivo. |

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
| `POST` | `/settings/gateways/test` | `{ provider, publicKey, secretKey? }`: prueba las claves de una pasarela (sin `secretKey`, la guardada de la que tiene esa clave pública). `200 { ok, message }`. |
| `POST` | `/account/delete` | Elimina la cuenta. Cuerpo `{ confirmation }`. `204`. |

Secciones (`:section`): `business` (zona horaria, horario por día, festivos, enlaces), `booking`
(reglas de la reserva en línea, política de cancelación, portal del cliente), `pricing` (precios
por nivel, redondeo), `tips` (propinas sugeridas), `cardFee` (recargo por tarjeta), `commissions`
(qué se descuenta antes de comisionar), `payrollCycle` (cada cuánto y desde qué día se paga),
`notifications` (`toggles` por `destinatario.evento.canal` y `thresholds`),
`company` (razón social, moneda, contacto) y `billing` (plan y datos de facturación).

Listas (`:list`): `branches`, `closures`, `taxGroups`, `devices`, `gateways`.

**Cada sucursal cobra con lo suyo.** Una barbería puede tener sucursales en Estados Unidos y en
Colombia, así que la moneda, el impuesto y la pasarela son de la sucursal, no del negocio:

- `branches[]` lleva `currency`, `taxGroupId` (su impuesto: el estatal, el IVA…; `null` = sin
  impuesto) y `gatewayId` (con qué pasarela cobra en línea; `null` = solo se paga en la barbería).
  `pricing.currency` es solo la moneda con la que nace una sucursal nueva.
- Un servicio o producto con `taxRate` usa el suyo (`0` = exento); con `taxRate: null`, el de la
  sucursal donde se cobra. Una cuenta con tasas distintas se grava con su tasa media ponderada.
  `pricing.taxInclusive` dice si los precios ya traen el impuesto (se informa, no se suma).
- `gateways[]`: `{ id, provider: "stripe" | "square" | "wompi" | "bold" | "mercadopago", name,
  publicKey, hasSecret, connected }`. Los métodos que ofrece la reserva salen del proveedor:
  tarjeta y billetera en todos; PSE y Nequi en Wompi y Bold; PSE en Mercado Pago.

Reglas que el cliente da por hechas:

- `booking.links` (enlace de reserva, del portal, del kiosco y el widget) lo pone el servidor: un
  `PUT` que lo traiga se ignora.
- `gateways` nunca devuelve la clave secreta: responde `hasSecret`. Un `PATCH` sin `secretKey`
  conserva la que había; el proveedor no cambia al editar. Las claves deben tener la forma del
  proveedor (`pk_`/`sk_` en Stripe, `pub_`/`prv_` en Wompi…): si no, `422`.
- `devices` tampoco devuelve su clave de acceso: responde `hasAuthKey`.
- `billing` solo acepta los datos de facturación; el plan y el medio de pago no se cambian por aquí.
- `cardFee` exige nombre cuando está encendido; `closures` exige `endDate >= startDate`; un
  `taxGroup` necesita al menos una tasa con nombre.
- `DELETE /settings/lists/branches/:id` responde `409 conflict` si es la última sucursal o si
  todavía tiene equipo activo. Borrar un `taxGroup` o una `gateway` que una sucursal usa también da `409`.
- `POST /account/delete` responde `422` si `confirmation` no es exactamente el nombre de la empresa.

Los permisos por rol no están aquí: viven en Equipo.

## Reserva en línea (`/booking`)

**Texto del consentimiento según el país.** El permiso de promociones y el aviso de privacidad salen de
`src/features/legal/consent.ts`, según el país de la sede: Colombia (Ley 1581 de 2012: autorización previa, expresa e
informada, responsable, finalidades y derechos), Estados Unidos (TCPA: consentimiento escrito, no es condición de
compra, frecuencia, tarifas y STOP), México (LFPDPPP: finalidad secundaria voluntaria y derechos ARCO) y uno general.
Cada texto lleva su versión (`co-2026-10`…), que el servidor guarda con la aceptación (`marketingConsent.version` y
`country`) como prueba; la sede viaja en `POST /booking/customers` como `branchId` y cada sede del catálogo trae
`country`. Es texto de producto escrito a partir de esas normas: debe revisarlo un abogado de cada país antes de
producción.

**Hora de la sede.** Las horas viajan como hora local de la sucursal sin zona (`2026-10-20T10:30:00`), y la zona es la de
la sucursal (`timezone` en Configuración › Sucursales; si no tiene, la del negocio). «Hoy», las horas que ya pasaron, la
antelación mínima, las condiciones de cancelación y el instante de cada recordatorio se calculan con esa zona, no con
la de quien reserva ni la del servidor (`src/lib/time/zoned.ts`). Cada cita del cliente trae `timeZone`: el `.ics` la
usa en `DTSTART;TZID=…`, el enlace de Google en `ctz` y el de Outlook pone la hora con su desfase.

La cara pública de la barbería: la abre el cliente desde el enlace, la tablet del local o el widget
del sitio (`/reservar` en la app). **No lleva la sesión de la app.** El cliente se identifica con
su celular y un código (WhatsApp o SMS). El código se manda a cualquier número y la respuesta no
dice si es cliente: el perfil (correo, personas, tarjetas, saldo) solo sale al verificarlo. Al
verificar recibe un token propio que viaja en `x-booking-token`; todo lo que actúa en su nombre
(crear el perfil, la propuesta, reservar, cobrar una tarjeta guardada, la lista de espera, «Mis
citas») toma al cliente de ese token, nunca de un id del cuerpo. Sin token válido responde `403
booking_session` (nunca `401`, que cerraría la sesión de quien esté dentro de la app en el mismo
navegador). Límites: 5 códigos por celular cada 10 minutos y 5 intentos fallidos por código (`429`).

**Mensajes al cliente.** Al reservar, el servidor programa por cada cita la confirmación (WhatsApp,
con «Confirmo» / «Reprogramar») y los recordatorios a las horas de Configuración (24 h y 2 h por defecto), solo los que aún estén en el
futuro. Reprogramar los mueve (y avisa del cambio); cancelar anula los pendientes. Al cancelar, la hora se ofrece a la lista de espera: hasta 3 clientes de ese día cuya franja la incluye (mismo barbero si lo pidieron y servicio que quepa) reciben `kind: slotFreed` con `offer: { start, barberId, branchId }`; el primero que reserva se la queda. En el mock quedan
en `db.booking.outbox` (`{ appointmentId, to, channel, kind: confirmation|rescheduled|reminder24h|reminder2h|reminder, hoursBefore?, sendAt, status }`);
el backend real los entrega con su proveedor (WhatsApp Business / SMS). El `.ics` de la confirmación
trae sus propias alarmas (`VALARM` el día antes y 2 h antes).

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/booking/shop` | La barbería: nombre, logo, moneda por defecto, `taxInclusive`, anticipación mínima, franjas, política de cancelación (`cancelHours`, `lateFeePercent`, `maxCancellations`, `policy`), propinas, formas de pago, `cardFee` (el recargo por tarjeta encendido en Configuración, o `null`), `deposit` (`{ percent }` si la barbería pide anticipo para pagar en el local, o `null`) y sedes con su horario de hoy, su `currency`, su `taxPercent` y sus `onlineMethods` (`card`, `wallet`, `pse`, `nequi`: lo que deja su pasarela; vacío = solo pago en la barbería). Sale de Configuración. |
| `GET` | `/booking/branches/:id` | El perfil de una sede: `description`, dirección completa, `phone`, `mapsUrl`, `gallery`, `hours` (siete entradas, `opensAt`/`closesAt` nulos si ese día cierra), número de barberos y los `closures` que vienen. La descripción, dirección y teléfono son los de Configuración › Sucursales; el horario de cada día sale del equipo que trabaja ese día. `404` si no existe o está inactiva. |
| `GET` | `/booking/catalog?branchId` | Lo reservable en la sede: servicios públicos y activos, barberos visibles con lo que cobra cada uno por servicio (`prices`), galería y valoración, y productos visibles y vendibles. Cada servicio y producto trae `taxPercent`: la tasa con la que se cobra en esa sede. |
| `GET` | `/booking/availability?branchId&date&serviceIds&barberId&exclude` | Las horas libres del día, `{ time, barberIds }`. Sin `barberId`, cualquier barbero que haga todos los servicios. `exclude` es la cita que se está moviendo. Respeta horario, citas, bloqueos, cierres y anticipación mínima. |
| `GET` | `/booking/alternatives?branchId&date&serviceIds&barberId` | Cuando el barbero no tiene horas: hasta 3 barberos que hacen todos los servicios, saben de lo mismo (al menos una habilidad que cubre lo pedido o que comparten con el elegido) y tienen horas, `{ barberId, skills, date, times }`; sin eso no se recomiendan. Se ordenan por quién tiene hora ese día, luego por parecido (habilidades que cubren lo pedido ×3, las compartidas con el elegido ×2, menos la distancia de nivel). Si no tienen ese día, traen su próximo día libre (hasta 7). Las habilidades del equipo se leen en servicios (`SKILL_SERVICES`). |
| `GET` | `/booking/earliest?branchId&serviceIds&barberId` | «Lo antes posible»: el primer hueco desde hoy (hasta 14 días) `{ slot: { date, time, barberId } \| null }`. Sin `barberId`, el primer barbero libre que haga todo. |
| `POST` | `/booking/waitlist` | Con token. `{ branchId, date, serviceIds, barberId, window: morning\|afternoon\|evening\|any }` → `201 { id, date, window }`. Se apunta en la lista de espera del Calendario: una entrada con una hora en punto por cada hora de la franja (mañana hasta las 12, tarde 12–18, noche desde las 18; «noche» solo si la sede cierra después de las 18). |
| `DELETE` | `/booking/waitlist/:id` | Con token. Salir de la lista. `404` si la entrada no existe o es de otro cliente. |
| `PATCH` | `/booking/me/cards/:id` | Con token. `{ holder, expMonth, expYear }` → `200` el perfil (`BookingCustomer`) con sus tarjetas al día. Solo cambia titular y vencimiento: el número queda en la pasarela. `422` si el titular tiene menos de 3 letras o el vencimiento ya pasó; `404` si la tarjeta no es suya. |
| `DELETE` | `/booking/me/cards/:id` | Con token. Quita una tarjeta guardada → `200` el perfil con la lista al día. Pagar después con ese `savedCardId` da `422 card_invalid`. `404` si la tarjeta no es suya. |
| `GET` | `/booking/me/suggestion` | Con token. | La próxima visita según su frecuencia (FOV): `{ suggestion: { everyDays, lastVisitAt, dueDate, isOverdue, usualTime, branchId, serviceIds, options[{ start, barberId, sameBarber }] } }`, o `suggestion: null` si aún no tiene ritmo. El día es la última visita + `everyDays`; la hora, la mediana de sus citas; con su barbero si tiene hueco en 10 días, si no con cualquiera. |
| `POST` | `/booking/customers` | Con el token de un celular nuevo. Crea el cliente `{ firstName, lastName, email, marketing }`; el celular es el verificado. Guarda el permiso de promociones con fecha (`marketingConsent`). La misma sesión pasa a ser la del cliente. `201`. |
| `POST` | `/booking/promo` | Token opcional (para saber si es su primera visita). `{ code, appointments }` → el cupón, o `422 promo_invalid` con `problem` (`unknown`, `firstVisitOnly`, `minAppointments`). |
| `POST` | `/booking/reservations` | Con token. Reserva y cobra. Cuerpo: `branchId`, `items[]` (`guestId` o `guestName`+`guestRelation`, `serviceIds`, `barberId` o `null` = sin preferencia, `start` y, opcional, `visitId`: las partes de una misma visita —un servicio separado para otro barbero u otra hora— comparten ese id y quedan anotadas «Visita en N partes» en la agenda), `products[]`, `tipId`, `promoCode`, `method` (`card`, `wallet`, `pse`, `nequi`, `shop`, `credit`; los en línea, solo si la pasarela de la sede los tiene: si no, `422`) y `card` (el token de la pasarela: `{ token, brand, last4, expMonth, expYear, name, save }`) o `savedCardId` (una tarjeta guardada). **El número y el CVC nunca viajan a este servidor**: se escriben en los campos de la pasarela, que devuelve el token (`src/features/payments/gateway.ts`; simulada, `tok_sim_ok_…` o `tok_sim_decline_…` para la tarjeta de prueba rechazada `4000 0000 0000 0002`). Un `card` con `number`, `cvc`, `cvv` o `pan` se rechaza con `422 raw_card_rejected`; un token que no es de la pasarela, `422 card_invalid`. `save` guarda solo marca, últimos 4 y vencimiento, que vuelven en `customer.cards`. Lo mismo vale para `/booking/packages/buy` y `/booking/gift-cards`. `201` con el recibo. Los totales traen `fee` y `feeName`: el recargo por tarjeta, sobre el subtotal, solo con `card` o `wallet`. `utm` (opcional, `{ source, medium, campaign }` del enlace) queda en la reserva. `useReward: true` usa una cortesía de la membresía (`customer.loyalty: { every, progress, available, rewardServiceId, rewardName, rewardValue }`, de Ajustes › Reservas › Membresía): se descuenta `rewardValue` de los servicios (`totals.reward`) y queda una menos. `referencePhotos` (opcional, hasta 3): las fotos del corte que quiere, cada una como data URL JPEG/PNG/WebP de hasta ~1,5 MB (el celular las reduce a 1024 px); quedan en la cita (`referencePhotos`) y el barbero la ve en el panel del Calendario; si no es una imagen válida, `422`. Con `giftCode`, la tarjeta de regalo paga primero (`totals.gift`; `total` es lo que queda) y lo que sobra queda en ella; si cubre todo, `payment.method` es `gift`. Una misma persona (quien reserva o cada invitado) no puede tener dos citas que se crucen: `409 conflict`. Con `method: "shop"` y `customer.depositRequired` (cliente nuevo o con inasistencias, según Ajustes › Reservas › Anticipo), hay que mandar `card` o `savedCardId`: se cobra el anticipo (el porcentaje de subtotal + impuesto) y `payment` queda `pending` con `paid` = anticipo; sin tarjeta, `422 card_required`. |
| `POST` | `/booking/phone/check` | `{ phone }` → `{ returning, token, customer }`. Cliente nuevo: `{ returning: false, token: null, customer: null }` y arma la cita sin código. Cliente de siempre: se le reconoce sin código para su bienvenida: `customer` sin lo sensible (`email` vacío, sin `cards`, `credit` 0, sin `packages` ni `loyalty`) y un `token` de **vista previa** que solo vale para `GET /booking/me/suggestion`; todo lo demás con sesión (pagar, lista de espera, «Mis citas», paquetes, tarjetas de regalo) responde `403` hasta verificar el código (`otp/verify` devuelve el perfil completo y la sesión de verdad). Un número bloqueado responde `{ returning: true, token: null, customer: null }` y lo sabe tras el código. `429 rate_limited` tras 20 consultas en 10 minutos desde el mismo origen. |
| `POST` | `/booking/otp/request` | `{ phone }` → `{ sentTo, channel }` (enmascarado), igual para cualquier número. `429 rate_limited` tras 5 en 10 minutos. |
| `POST` | `/booking/otp/verify` | `{ phone, code }` → `{ status: "known", token, customer }`, `{ status: "new", token, customer: null }` o `{ status: "blocked", token: null, customer: null }`. `422 otp_invalid` con `attemptsLeft`; `429 otp_locked` tras 5 fallos (hay que pedir otro). |
| `POST` | `/booking/appointments/:id/repeat` | Con token. Deja la cita fija: `{ everyWeeks: 1–4, count: 1–6 }` → `201 { created: BookedAppointment[], skipped: [fecha] }`. Las próximas con el mismo barbero a la misma hora (o la más cercana ese día, ±1 h); sin hueco, se salta. Entran como serie (`seriesId`, `repeat`), se pagan en la barbería y llevan sus recordatorios. |
| `GET` | `/booking/barbers/:id/reviews?limit` | Reseñas públicas del barbero: `{ items: [{ id, clientName («Marcela G.»), rating, comment, createdAt, sample }], total }`, de la más nueva. El `rating`/`reviews` del catálogo salen de aquí (con `ratingSample`). Las de ejemplo (`sample: true`) existen solo en la demo (`VITE_SAMPLE_DATA`, encendido por defecto) y **nunca se mezclan con las reales**: con la primera reseña de un cliente, el barbero muestra solo las suyas. Sin reseñas, `reviews: 0` y la reserva no muestra calificación. |
| `POST` | `/booking/appointments/:id/review` | Con token. `{ rating: 1–5, comment? }` → `201`. Solo citas que ocurrieron (`409 not_completed`) y una vez (`409 already_reviewed`). La cita trae `review: { rating } \| null`. |
| `POST` | `/booking/packages/buy` | Sesión. `{ packageId, savedCardId? \| card? }` → `201 { package: { id, name, serviceId, remaining, total, expiresAt }, paidWith }`; `404` si ya no se vende, `422 card_required`. Los paquetes a la venta vienen en `GET /booking/shop` (`packages`) y los del cliente en su perfil (`packages`, solo vigentes y con visitas). En `POST /booking/reservations`, `usePackages: true` paga con una visita cada servicio cubierto (al precio del barbero asignado) y lo devuelve en `totals.prepaid`. |
| `POST` | `/booking/gift-cards/check` | `{ code }` → `{ code, balance }`; `404 gift_invalid`, `422 gift_empty`. El código no distingue mayúsculas ni guiones. |
| `POST` | `/booking/gift-cards` | Con token. Comprar una tarjeta de regalo `{ amount (10–500), recipientName, recipientContact, message?, card \| savedCardId }` → `201 { code, amount, sentTo, paidWith }`. El código le llega a quien la recibe por WhatsApp. |
| `POST` | `/booking/events` | Público, anónimo: `{ sessionId, step, surface: link\|widget\|preview, source }` → `204`. Un evento por paso al que llega la sesión; la vista previa del panel no cuenta. |
| `GET` | `/booking/funnel?days` | Con la sesión de la app (es del dueño). `{ days, demo, started, bookings, conversion, steps: [{ step, sessions, rate }], sources: [{ source, sessions, bookings }] }`. Sin datos reales, `demo: true` con un embudo de ejemplo. |
| `GET` | `/booking/me/appointments` | Con token: `{ upcoming, past, reservations }`. |
| `PATCH` | `/booking/appointments/:id` | Con token: `{ start, barberId }`. `409 too_late` dentro del plazo de cambio; `409 conflict` si la hora ya no está. |
| `POST` | `/booking/appointments/:id/cancel` | Con token: `{ refundTo: "card" \| "credit" }` → `{ appointment, fee, refund, refundTo }`. `409 limit` al llegar a `maxCancellations`. |
| `POST` | `/booking/reservations/:id/details` | Con token. Nota y fotos para el barbero con la reserva ya hecha: `{ notes?, referencePhotos? (hasta 3, data URL) }` → `{ saved: true }`. Se suman a las de sus citas. `404` si la reserva no es del cliente. |
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
