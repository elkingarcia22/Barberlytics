# Configuración

Investigación del 2026-10-03, módulo 05 del mapa de roles (`docs/ROLES_PLAN.md`). Cubre la pantalla
Configuración entera y lo que depende de ella: los 17 ajustes de producción uno por uno, la matriz de permisos,
Agendamiento online, Portal del cliente, Front Desk (kiosco), el Centro de notificaciones y las 17 secciones del
rediseño.

**Fuentes**

| Marca | Fuente | Archivos |
|---|---|---|
| **[P]** | Producción observada (dash.barberlytics.com, 2026-09-25 y 2026-09-30). Solo se vieron en pantalla **Dueño** y **Barbero por comisión**. | `centro-de-ayuda/casos/configuracion.md`, `casos/modelo-sucursales-roles-permisos.md` (§5, §6b), `casos/front-desk.md`, `casos/reserva-online.md`, `casos/produccion.md`, `content/es/{configuracion,agendamiento-online,front-desk,roles-y-permisos,sucursales,empezar,navegacion}/**` |
| **[M]** | Matriz de permisos de fábrica (Configuración › Permisos). Dice qué *puede* hacer el rol; no se vio la pantalla con ese rol. | `casos/modelo-sucursales-roles-permisos.md` §5, `content/es/roles-y-permisos/tabla-de-permisos-por-rol.md` |
| **[N]** | Notion (BarberOS Logic Library, QA Priority Stack), resumido en `docs/ROLES_PLAN.md`. | — |
| **[D]** | Decisión propuesta aquí, por confirmar con producto. | — |

**Celdas:** `✅` ve y edita/ejecuta · `👁` solo ve · `🔒 suyo` solo lo suyo (su persona, su silla o su sucursal) ·
`—` no lo ve · `?` sin dato. Cuando producción/matriz y propuesta difieren se escribe `valor actual → valor propuesto`
(p. ej. `✅ [M] → 👁 [D]`).

**«En Thema»:** `✓ (ruta)` existe la función · `parcial` existe a medias · `✗` no existe. **Ojo:** en Thema hoy
**ningún** ajuste mira el rol (ni menú, ni ruta, ni API): un `✓` dice que la pantalla existe, no que esté protegida.
Ver §6.

---

## 1. Resumen por rol

| Rol | Hoy en producción | Propuesta para el rediseño |
|---|---|---|
| **Dueño** (`owner`) | Ve los **17 ajustes** en cuatro grupos + **Eliminar cuenta** [P]. «Las cuentas de propietarios tienen acceso total al sistema» [P]. | Igual. Es el único que toca **dinero y contrato**: facturación del plan, Stripe, impuestos, moneda, precios, comisiones, modelo de negocio [N], permisos de fábrica y eliminar el negocio [D]. |
| **Administrador** (`admin`) | No visto. Matriz: **Configuraciones de la cuenta V·E·A**, **Permisos V·E·A**, **Fechas de cierre V·C·E·B·A**, **Nómina V·C·E** [M] → en teoría casi todo. | **Lo operativo de su sucursal** ✅ (horario y festivos de su sede, cierres, reservas online, datáfonos, propinas, avisos de su equipo, permisos de personas de su sede). **Lo de la empresa** solo 👁 (impuestos, moneda, comisiones, ciclo de nómina, datos legales). Sin facturación del plan, sin Stripe, sin eliminar el negocio [D]. |
| **Recepción** (`recepcion`) | No visto. Matriz: **Configuraciones de la cuenta V·E** (sin Activo) [M]; no se sabe qué tarjetas cubre. | Una Configuración **mínima y sin cifras** [N]: sus preferencias (formato de hora), **enlaces para copiar** (reserva, portal, kiosco), **activar el kiosco**, y 👁 horario/cierres/políticas para responder al cliente [D]. |
| **Barbero por comisión** (`barbero-comision`) | Solo **Formato de hora** (personal) y **Eliminar cuenta** [P] (§6b). Matriz: Configuraciones de la cuenta solo **V** [M]. | Sus **preferencias personales** (formato de hora, sus avisos), **su enlace de reserva** y 👁 cómo se calcula su comisión y su ciclo de pago. «Eliminar cuenta» pasa a ser **eliminar mi usuario**, no el negocio [D]. |
| **Barbero de renta** (`barbero-renta`) | No visto. Matriz: Configuraciones de la cuenta solo **V** (como comisión) [M]. Se infiere que ve lo mismo que comisión. | Lo de comisión **+ su mundo de negocio, recortado a él**: sus **datos bancarios**, su ciclo de renta 👁, su enlace de reserva; y abierto (`?`) si tiene reglas, datáfono o Stripe propios [D][N]. |

Notas transversales:

- **La fila que decide Configuración es «Negocio › Configuraciones de la cuenta»** (V·E·A). Con solo **V** (comisión,
  renta) se ven los ajustes *personales*; con **V·E·A** (dueño, admin) los de la cuenta [P]+[M]. Pero hay ajustes
  que no cuelgan de ninguna fila (Sucursales, Empresa, Comisiones, Impuestos, Stripe, Notificaciones): §5.
- **Configuración es de la empresa**: se ve igual en cualquier sucursal del selector [P]. Varias pantallas dicen
  «se puede ajustar para cada ubicación», pero no se encontró dónde [P]. El usuario cree que aparece «entrando con
  una persona que tenga permiso de edición de sucursal» (sin verificar).
- **iOS muestra «No permissions» en Settings** [N]: casi seguro el barbero (solo V) en una app que no sabe pintar
  los ajustes personales. En Thema, un rol sin ajustes de empresa debe ver los suyos, nunca un vacío.

---

## 2. Matriz de permisos de fábrica (§5, completa)

Copiada tal cual de `casos/modelo-sucursales-roles-permisos.md` §5 (= `content/es/roles-y-permisos/tabla-de-permisos-por-rol.md`).
V = Ver · C = Crear · E = Editar · B = Borrar · A = Activo. «no» = no permitido. «—» = la fila no aparece para ese
rol. «A» sola = la fila solo tiene el interruptor Activo. Orden de columnas como en la pantalla de producción.

| Bloque | Función | Administrador | Barbero comisión | Barbero renta | Recepción | Dueño |
|---|---|---|---|---|---|---|
| **Reservas y clientes** | Calendario | A | A | A | A | A |
| | Reservar citas | V C E B A | V C E B A | V C E B A | V C E B A | V C E B A |
| | Bloquear calendario | V C E B A | V A | V C E B A | V C E B A | V C E B A |
| | Clientes | V C E B A | V C A | V C E B A | V C E A | V C E B A |
| | Información del cliente | A | no | no | A | A |
| | Importar clientes | A | no | A | A | A |
| | Descarga de cliente | no | no | A | no | A |
| **Equipo** | Equipo | V C E B A | V | — | no | V C E B A |
| | Gerentes | V C E B A | no | — | no | V C E B A |
| | Sección de pagos de barberos | no | no | — | no | A |
| | Niveles | V C E B A | no | — | no | V C E B A |
| | Póngase en fila | V C E B A | no | — | no | V C E B A |
| | Ordenar barberos agendas | no | no | — | no | V C E B A |
| **Métricas** | Indicadores clave de rendimiento empresariales | A | no | — | A | A |
| **Inventarios** | Productos | V C E B A | no | — | V | V C E B A |
| | Categorías | V C E B A | no | — | V | V C E B A |
| **Servicios** | Servicios | V C E B A | no | — | no | V C E B A |
| | Categorías | V C E B A | no | — | no | V C E B A |
| | Póngase en fila | V E A | no | — | no | V E A |
| **POS** | Precios | A | A | A | A | A |
| **Negocio** | Fechas de cierre | V C E B A | no | — | no | V C E B A |
| | Nómina de sueldos | V C E | no | — | no | V C E |
| | Permisos | V E A | no | — | no | V E A |
| | Configuraciones de la cuenta | V E A | V | V | V E | V E A |
| | Gastos | V C E B A | V C E B A | V C E B A | no | V C E B A |

Cómo funciona [P]: es el **predeterminado del rol**; al crear a una persona se le **copia** y luego se personaliza en
su ficha (`Equipo › Ver › Permisos`). Quitar **Ver** oculta la sección del menú (confirmado por el usuario). El
dueño tiene acceso total aunque su pestaña exista. Sin comprobar: cómo se guarda, si cambiar el rol toca a quienes
ya lo tienen, y dónde se personaliza «por ubicación».

### 2b. La matriz en Thema no es la de producción

`src/features/team/permissionsCatalog.ts` (`ROLE_DEFAULT_PERMISSIONS`) y su gemelo del mock
`src/mocks/team/seed.ts:171` (`ROLE_PERMISSION_DEFAULTS`) difieren de §5 en estas celdas:

| Fila | Rol | Producción §5 | Thema hoy | Lectura |
|---|---|---|---|---|
| Bloquear calendario | Comisión | V A | V C E B A | **Invertido** con renta |
| Bloquear calendario | Renta | V C E B A | V (sin A) | **Invertido** con comisión (el de renta crea sus vacaciones sin aprobación [P]) |
| Clientes | Renta | V C E B A | V C A | Le faltan E y B |
| Clientes | Recepción | V C E A | V C E B A | Thema le da Borrar |
| Importar clientes | Renta | A | no | Falta |
| Descarga de cliente | Renta | A | no | Falta (el único barbero que descarga) |
| Descarga de cliente | Recepción | no | A | Sobra (`BOOKINGS_FULL` incluye `export-clients`) |
| Descarga de cliente | Admin | no | A | Sobra (el filtro solo excluye `barber-payments` y `barber-order`) |
| Servicios | Recepción | no | V A | Sobra |
| Productos / Categorías | Recepción | V | V A | Activo de más (menor) |
| Configuraciones de la cuenta | Recepción | V E | no | **Falta**: recepción se quedaría sin Configuración |
| Sección de pagos de barberos | (estructura) | solo A | V C E A | Thema le inventó columnas a la fila |

---

## 3. Inventario de ajustes y acciones

Columnas: Dueño · Admin · Recepción · Comisión · Renta · **Permiso** (bloque·columna que lo gobierna; «sin fila» =
no hay fila en la matriz) · **Fuente** de lo que dice la celda actual · **En Thema**.

### 3.0 Entrar a Configuración

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver «Configuración» en el menú | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [M] | Negocio·Config. cuenta V | P (dueño, comisión), M | ✓ (`/configuracion`, cabecera; sin filtro de rol) |
| Ver el índice con 4 grupos / 17 tarjetas | ✅ [P] | ✅ [M] → solo las de §3.x [D] | ? [M] → lista corta [D] | — [P] (2 tarjetas) | ? [M] → lista corta [D] | Config. cuenta V·E·A | P, M | ✓ (`SettingsPage`, sin filtro) |
| Ver solo ajustes personales (Formato de hora + Eliminar cuenta) | — | — | ? | ✅ [P] | ? [M] (misma fila que comisión) | Config. cuenta solo V | P §6b | ✗ |
| Igual en cualquier sucursal del selector | ✅ [P] | ? | ? | ? | ? | — | P | ✓ (no depende de sucursal) |
| Abrir un ajuste por URL sin permiso | n/a | → `/403` [D] | → `/403` [D] | → `/403` [D] | → `/403` [D] | — | D | ✗ (`/403` existe, no se usa) |
| Menú de configuración de la cabecera | ✅ | ✅ filtrado [D] | ✅ filtrado [D] | ✅ filtrado [D] | ✅ filtrado [D] | — | D | parcial (`AppLayout.tsx:88,211`, sin filtro) |

### 3.1 Detalles del negocio (`/business-details/{id}`) — Thema «Perfil del negocio»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver zona horaria, formato, semana, horario, festivos | ✅ [P] | ✅ [M] | ? [M] → 👁 [D] | — [P] | — [M] | Config. cuenta V | P, M | ✓ (`/configuracion/negocio`) |
| Editar **Zona horaria\*** | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] | — [D] | — [P] | — | Config. cuenta E | P, M | ✓ |
| Editar **Formato de hora\*** (del negocio) | ✅ [P] | ✅ [M] | — [D] | — [P] (tiene el suyo, §3.19) | — | Config. cuenta E | P | ✓ |
| Editar **Inicio de semana\*** | ✅ [P] | ✅ [M] | — [D] | — | — | Config. cuenta E | P | ✓ |
| Editar **Hora de inicio / fin** | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] | 👁 [D] | — | — | Config. cuenta E | P, D | ✓ |
| Elegir **Festivos no laborables** | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] («se puede ajustar para cada locación» [P]) | 👁 [D] | — | — | Config. cuenta E | P | parcial (festivos fijos de EE. UU., no por país) |
| Editar **Enlaces en línea** (Sitio Web, Instagram, Facebook, Google Maps) | ✅ [P] | ✅ [M] → 👁 [D] (marca de la empresa) | — | — | — | Config. cuenta E | P | ✓ |
| **Guardar** | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ |

### 3.2 Detalles de facturación y facturas (`/settings/billing-details`) — Thema «Plan y facturación»

Es el contrato de la barbería **con Barberlytics**, no las ventas del local.

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver plan, importe, datos de facturación | ✅ [P] | ✅ [M] → — [D] | — [D] | — [P] | — [M] | Config. cuenta V (sin fila propia) | P, M | ✓ (`/configuracion/facturacion`) |
| **Editar detalles de facturación** | ✅ [P] (no abierto) | ✅ [M] → — [D] | — | — | — | Config. cuenta E | P | ✓ |
| **Administrar métodos de pago** / **Añadir método de pago** | ✅ [P] (no abierto) | ✅ [M] → — [D] | — | — | — | Config. cuenta E | P | ✗ (`billing` solo acepta datos de facturación, `API_CONTRACT.md`) |
| Ver listado de facturas, filtrar Tipo/Año/Mes, **Descargar** | ✅ [P] | ✅ [M] → — [D] | — | — | — | Config. cuenta V | P | parcial (tabla sin filtros) |
| **Cambiar plan** (en Mi perfil, §3.20) | ✅ [P] | — [D] | — | — | — | sin fila | P | ✗ |

[D] Por qué solo el dueño: es la tarjeta y el plan del dueño; un admin que cambia de plan compromete dinero que no es
suyo. Hoy la matriz no lo separa porque todo cuelga de «Configuraciones de la cuenta».

### 3.3 Agendamiento online (`/online-booking`, «Reserva online») — Thema «Reservas online»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la tarjeta | ✅ [P] | ✅ [M] | ? [M] → ✅ [D] | — [P] («Un barbero por comisión no ve esta tarjeta») | — [M] | Config. cuenta V | P | ✓ (`/configuracion/agendamiento`) |
| Copiar fragmento **Panel lateral** (`data-mode="floating"`) | ✅ [P] | ✅ [M] | 👁 copiar [D] | — | — | Config. cuenta V | P | ✓ (`?vista=enlaces`) |
| Copiar fragmento **Abrir desde enlace** (`data-trigger`) | ✅ [P] | ✅ [M] | 👁 copiar [D] | — | — | Config. cuenta V | P | ✓ |
| Copiar fragmento **Reserva embebida** (`data-mode="inline"`) | ✅ [P] | ✅ [M] | 👁 copiar [D] | — | — | Config. cuenta V | P | ✓ |
| Copiar **Enlace directo de reserva** (`/book/…`) | ✅ [P] | ✅ [M] | ✅ [D] (lo manda por WhatsApp) | — [P] → 🔒 su enlace (con él preseleccionado) [D] | — [M] → 🔒 su enlace [D] | Config. cuenta V | P, D | ✓ (sin enlace por barbero) |
| **Seguimiento UTM** (Fuente, Medio, Campaña) | ✅ [P] | ✅ [M] | ✅ [D] | — → 🔒 su enlace [D] | — → 🔒 su enlace [D] | Config. cuenta V | P | ✓ (`bookingUtils.buildBookingUrl`) |
| Copiar **Enlace del kiosco front desk** | ✅ [P] | ✅ [M] | ✅ [D] | — | — | Config. cuenta V | P | ✓ |
| **Anticipación mínima para agendar\*** + **Unidad** | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] | 👁 [D] | — | — → ? (¿reglas propias?) [D] | Config. cuenta E | P | ✓ (`minNotice`, `minNoticeUnit`) |
| **Franjas horarias disponibles** («No más de N semanas en el futuro») | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] | 👁 [D] | — | — → ? [D] | Config. cuenta E | P | ✗ (no está en `bookingSchema`) |
| **Intervalo de franja horaria por defecto** (15/30/45/60) | ✅ [P] | ✅ [M] | 👁 [D] | — (cada usuario puede hacer zoom [P]) | — | Config. cuenta E | P | ✓ (`slotInterval`, con 10 y 20 de más) |
| **Aumento de precios**: Nivel de ocupación\*, Aumentar el valor %/$ | ✅ [P] | ✅ [M] → 👁 [D] (el dueño aprueba precios [N]) | — [N] (sin cifras) | — | — → ? (sus precios, [N]) [D] | Config. cuenta E | P, N | ✓ (`surge`, con interruptor extra) |
| **Lista de espera**: Minutos para aceptar\*, Minutos para llegar\* | ✅ [P] | ✅ [M] | 👁 [D] | — | — | Config. cuenta E | P | ✓ (`waitlist`) |
| **Métodos de pago aceptados** (pago en el local, Stripe) | ✅ [P] | ✅ [M] | 👁 [D] | — | — | Config. cuenta E | P | ✓ (`paymentMethods`) |
| **Cancelación y reprogramación**: horas, **Cargo por cancelación tardía\***, **Máx. cancelaciones\*** | ✅ [P] | ✅ [M] (cargo → 👁 [D]) | 👁 [D] (para explicarlo) | — | — | Config. cuenta E | P | ✓ |
| **Vista previa de políticas** (`<<time_for_cancel>>` …) | ✅ [P] | ✅ [M] | 👁 [D] | — | — | Config. cuenta V | P | parcial (Thema la deja editar como texto; producción solo la previsualiza) |
| **Guardar** (uno para todos los bloques de reglas) | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ |
| Ajustar por ubicación («se pueden configurar individualmente para cada ubicación») | ? [P] | ? → 🔒 su sucursal [D] | — | — | — | ? | P | ✗ |

### 3.4 Portal del cliente (`/client-portal`)

Sin **Guardar**: solo copia fragmentos. Sus reglas son las de §3.3 [P].

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la tarjeta y «Qué puede hacer tu cliente» | ✅ [P] | ✅ [M] | ? → ✅ [D] | — [P] | — [M] | Config. cuenta V | P | parcial (dentro de Reservas online › Enlaces, `BookingSettings.tsx:247`) |
| Copiar **Dentro de una página** (`data-bl-widget="appointments"`) | ✅ [P] | ✅ [M] | 👁 copiar [D] | — | — | Config. cuenta V | P | ✓ |
| Copiar **Abrir desde un enlace** (`#mis-citas`) | ✅ [P] | ✅ [M] | 👁 copiar [D] | — | — | Config. cuenta V | P | ✓ |
| Copiar **Enlace del portal** (`/portal/…`) | ✅ [P] (devuelve **404**, fallo) | ✅ [M] | ✅ [D] | — → 👁 copiar [D] | — → 👁 copiar [D] | Config. cuenta V | P | ✓ (mock) |
| Colores `data-accent` / `data-primary` | ✅ [P] (solo texto) | ✅ [M] | — | — | — | — | P | ✗ |

### 3.5 Períodos de cierre del negocio (`/business-closed`) — Thema «Horarios y cierres»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver el listado de cierres | ✅ [P] | ✅ [M] | no [M] → 👁 [D] (para no agendar) | no [M] | — [M] | Negocio·Fechas de cierre V | P, M | ✓ (`/configuracion/cierres`) |
| **Añadir periodo cerrado**: inicio\*, fin\*, **Seleccione ubicaciones\***, descripción | ✅ [P] | ✅ [M] → 🔒 solo su sucursal en «ubicaciones» [D] | no [M] | no [M] | — [M] | Fechas de cierre C | P, M | ✓ (`branchIds`) |
| Editar un cierre | ? [P] | ✅ [M] → 🔒 [D] | no | no | — | Fechas de cierre E | M | ✓ |
| Borrar un cierre | ? [P] | ✅ [M] → 🔒 [D] | no | no | — | Fechas de cierre B | M | ✓ |
| Efecto: sin reserva online en esas fechas | ✅ [P] | — | — | — | — | — | P | ? |

### 3.6 Dispositivos de pago (`/devices`) — Thema «Datáfonos»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver listado de dispositivos | ✅ [P] | ✅ [M] | ? → 👁 [D] (sabe con qué terminal cobra) | — [P] | — [M] → ? (datáfono propio) [D] | Config. cuenta V | P, M | ✓ (`/configuracion/dispositivos`) |
| **Agregar dispositivo**: Nombre\*, Serial\*, TPN\*, Clave de autenticación | ✅ [P] | ✅ [M] → 🔒 su sucursal [D] | — [D] | — | ? [D] | Config. cuenta E | P | ✓ (la clave no vuelve: `hasAuthKey`) |
| Editar / borrar un dispositivo | ? [P] | ✅ [M] → 🔒 [D] | — | — | ? | Config. cuenta E | — | ✓ |

### 3.7 Sucursales (`/companies/locations`)

No hay fila en la matriz para sucursales [M].

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver lista (Nombre, Equipo, País, Estado, Ciudad, fecha, Estado) + buscar | ✅ [P] | ? → 🔒 la suya [D] | — [D] | — [P] | — | sin fila | P | ✓ (`/configuracion/sucursales`) |
| **Crear Sucursal** (14 campos + Fotos 0/5) | ✅ [P] (no guardado) | ? → — [D] (afecta licencia/plan) | — | — | — | sin fila | P | ✓ (sin fotos) |
| **Ver** detalle (Clientes, Equipo, **Licencia**) | ✅ [P] | ? → 🔒 la suya, sin licencia [D] | — | — | — | sin fila | P | ✗ (sin ficha de detalle) |
| **Editar Sucursal** (moneda, idioma, zona horaria…) | ✅ [P] | ? → 🔒 la suya [D] | — | — | — | sin fila | P | ✓ |
| **Inactivar** | ✅ [P] (no pulsado) | — [D] | — | — | — | sin fila | P | parcial (hay `status`, sin acción) |
| **Borrar** | ✅ [P] (no pulsado) | — [D] | — | — | — | sin fila | P | ✓ (`409` si es la última o tiene equipo activo) |

### 3.8 Empresa (`/companies`) — Thema «Datos legales»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver lista de empresas / ver una | ✅ [P] | ? → 👁 [D] | — | — | — | sin fila | P | parcial (un documento, no lista) |
| **Editar** empresa | ✅ [P] | ? → — [D] | — | — | — | sin fila | P | ✓ (`/configuracion/empresa`) |

### 3.9 Permisos (`/team-permission`)

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la tarjeta y las 5 pestañas por rol | ✅ [P] | ✅ [M] | no [M] | no [M] | — [M] | Negocio·Permisos V | P, M | ✗ (la tarjeta se quitó, `settingsCatalog.ts:38`) |
| Editar la matriz predeterminada de un rol | ✅ [P] | ✅ [M] → 👁 [D] (no reescribe el rol de fábrica de toda la empresa) | no | no | — | Permisos E | P, M | ✗ |
| Editar la pestaña **Dueño** | 👁 [D] («acceso total», no se recorta) | — [D] | — | — | — | Permisos E | P, D | ✗ |
| Guardar (botón o al vuelo) | ? [P] | ? | — | — | — | Permisos E | P | ✗ |
| Personalizar la matriz **de una persona** (ficha › Permisos) | ✅ [P] | ✅ [M] → 🔒 personas de su sucursal, nunca dueño/admin ni a sí mismo [D] | — | — | — | Permisos E | P, M | parcial (`/usuarios/miembros/:id` › Permisos, `PermissionsForm.tsx`, con «restaurar del rol») |
| Personalizar «por ubicación» | ? [P] | ? | — | — | — | ? | P | ✗ |
| Ver mis propios permisos (solo lectura) | ✅ | ✅ | — [P] → 👁 [D] | — [P] → 👁 [D] | — → 👁 [D] | — | D | ✗ |

[D] Por qué el admin no edita el predeterminado del rol: es empresa entera y puede subirse permisos a sí mismo. Que
ajuste a las personas de **su** sede ya cubre «gestionar una locación».

### 3.10 Nómina — ciclo de pago (`/settings/payroll`) — Thema «Ciclo de nómina»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver ciclo y día de inicio | ✅ [P] | ✅ [M] | no [M] | no [M] → 👁 [D] (cuándo le pagan) | — [M] → 👁 [D] (cuándo paga renta) | Negocio·Nómina V | P, M | ✓ (`/configuracion/nomina`) |
| Elegir **Ciclo de pago\*** (SEMANAL · QUINCENAL · MENSUAL) | ✅ [P] | ✅ [M] (C·E) → 👁 [D] (cambia la liquidación de toda la empresa) | no | no | — | Nómina E | P, M | ✓ |
| **Día de inicio del ciclo** + **Guardar** | ✅ [P] | ✅ [M] → 👁 [D] | no | no | — | Nómina E | P, M | ✓ |

### 3.11 Comisiones (`/team-commission`)

No hay fila en la matriz [M] (la más cercana es Equipo·Sección de pagos de barberos, solo dueño).

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver las cuatro deducciones | ✅ [P] | ? → 👁 [D] | — | — [P] → 👁 [D] (transparencia de su pago) | — (no aplica) | sin fila → Pagos de barberos [D] | P | ✓ (`/configuracion/comisiones`) |
| **Deducir descuentos / impuestos / costo del servicio / costo del producto** + **Guardar** | ✅ [P] | ? → — [D] | — | — | — | sin fila | P, N | ✓ |
| Ajustar por ubicación | ? [P] | ? | — | — | — | ? | P | ✗ |

### 3.12 Impuestos (`/sales-taxes`)

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver listado de impuestos | ✅ [P] | ✅ [M] → 👁 [D] | — | — | — → ? [D] | Config. cuenta V | P, M | ✓ (`/configuracion/impuestos`) |
| **Añadir impuesto** (grupo, nombre fiscal, tasa, otra línea) | ✅ [P] | ✅ [M] → — [D] | — | — | ? | Config. cuenta E | P | ✓ |
| Editar / borrar un grupo | ? [P] | ✅ [M] → — [D] | — | — | ? | Config. cuenta E | — | ✓ |
| Ajustar por ubicación | ? [P] | ? → 🔒 su sucursal [D] | — | — | — | ? | P | ✗ |

### 3.13 Tarifa por uso de tarjeta de crédito (`/credit-card`) — Thema «Recargo por tarjeta»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver si está habilitada, nombre y tasa | ✅ [P] | ✅ [M] → 👁 [D] | — (la aplica al cobrar) | — | — → ? [D] | Config. cuenta V | P | ✓ (`/configuracion/tarifa-tarjeta`) |
| **Habilitar esta opción**, **Nombre\***, **Tasa\*** (%/$), **Guardar** | ✅ [P] | ✅ [M] → — [D] | — | — | ? | Config. cuenta E | P | ✓ |

### 3.14 Propinas (`/sales-tips`)

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver opciones de propina | ✅ [P] | ✅ [M] | — → 👁 [D] (cobra) | — | — | Config. cuenta V | P | ✓ (`/configuracion/propinas`) |
| **Porcentaje de propina\***, **Agregar nueva opción**, **Guardar** | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ (un solo guardar) |
| **Selección predeterminada** + **Guardar selección predeterminada** | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ |
| **Comportamiento**: Mostrar en el cobro (Sin configurar · Solo monto · Solo porcentaje · Monto y porcentaje) + **Guardar comportamiento** | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ |
| Ajustar por ubicación | ? [P] | ? → 🔒 [D] | — | — | — | ? | P | ✗ |

### 3.15 Precios (`/sales-pricing`) — Thema «Precios y moneda»

No confundir con **POS·Precios** (Activo en los cinco roles), que es poder aplicar precios al cobrar, no este ajuste.

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver moneda y cálculo de impuestos | ✅ [P] | ✅ [M] → 👁 [D] | — | — | — | Config. cuenta V | P | ✓ (`/configuracion/precios`) |
| **Moneda\*** | ✅ [P] | ✅ [M] → — [D] (la moneda también vive en la sucursal [P]) | — | — | — | Config. cuenta E | P | ✓ |
| **Los precios (no) incluyen impuestos** + **Guardar** | ✅ [P] | ✅ [M] → — [D] | — | — | — | Config. cuenta E | P | ✓ |

### 3.16 Integración de pagos (`/payment-integration`) — Thema «Pasarela de pago»

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Elegir sucursal («Por ubicación») | ✅ [P] | ✅ [M] → 🔒 la suya [D] | — | — | — | Config. cuenta V | P | ✗ (sin selector de sucursal) |
| Ver si Stripe está conectado | ✅ [P] | ✅ [M] → 👁 [D] | — | — | — → ? (Stripe propio) [D] | Config. cuenta V | P | ✓ (`/configuracion/pagos`) |
| **Clave pública de prueba\*** / **Clave secreta de prueba\*** | ✅ [P] | ✅ [M] → — [D] (secreto) | — | — | ? | Config. cuenta E | P | ✓ (la secreta no vuelve) |
| **Probar conexión** | ✅ [P] (no pulsado) | ✅ [M] → 👁 [D] | — | — | — | Config. cuenta V | P | ✓ (`POST /settings/payments/test`) |
| **Guardar** | ✅ [P] | ✅ [M] → — [D] | — | — | — | Config. cuenta E | P | ✓ |

### 3.17 Centro de notificaciones (`/notifications-center`) — Thema «Recordatorios y avisos»

«Esta configuración es general y se aplica a todas las ubicaciones» [P]. Los artículos de ayuda la marcan para
`roles: [owner, admin]`.

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la tarjeta y las 5 pestañas por rol | ✅ [P] | ✅ [M] | — [D] | — [P] | — [M] | sin fila (Config. cuenta) | P | ✓ (`/configuracion/centro-notificaciones`, 6 pestañas con «Clientes») |
| Encender/apagar **Correo** y **Push** por aviso, pestaña **Dueño** | ✅ [P] | ✅ [M] → 👁 [D] | — | — | — | Config. cuenta E | P | ✓ |
| Ídem pestañas **Administrador**, **Recepción**, **Comisión**, **Renta** | ✅ [P] | ✅ [M] (Administrador: 👁 [D]) | — | — | — | Config. cuenta E | P | ✓ |
| Ajustar el **[Porcentaje]** (ocupación, retención) | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ (`thresholds`) |
| Mensajes a **clientes** (confirmación, recordatorio…) | ? [P] (dependen de este centro, `casos/reserva-online.md:94`) | ? | — | — | — | ? | P | ✓ (pestaña «Clientes», correo/SMS) |
| **Guardar** | ✅ [P] | ✅ [M] | — | — | — | Config. cuenta E | P | ✓ |
| Silenciar **mis** avisos (preferencia personal, sin tocar la del rol) | ✗ (no existe) → ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | — | D | ✗ |
| Por sucursal | — [P] («general») | — | — | — | — | — | P | ✓ (general) |

**Avisos por destinatario.** Producción lista los mismos grupos en cada pestaña (no se comparó aviso por aviso,
`notificaciones-por-rol.md`). Thema ya los reparte por audiencia (`notificationCatalog.ts`). Notion fija el destino
de las alertas. La columna «Propuesta» combina las tres:

| Aviso | Producción [P] | Thema hoy (audiencias) | Notion [N] | Propuesta [D] |
|---|---|---|---|---|
| Importación de clientes falla / termina | Clientes | owner, admin, barberRent | — | Quien importó + dueño |
| Mala reseña de un cliente | Clientes | admin | — | Dueño, admin y el barbero de esa cita |
| Cliente pasa a **Churn** (perdido) | Clientes | admin, barberRent | **Solo dueño** | Dueño (+admin); **quitar al de renta** |
| Cliente pasa a **Pre-Churn** / «En riesgo» | Clientes | admin, barberRent | Barbero + dueño | Dueño, admin y **el barbero de ese cliente** (comisión y renta) |
| Cliente «Recuperado» | Clientes | admin, barberRent | — | Dueño, admin y su barbero |
| Cliente «VIP» | Clientes | admin, barberRent | **VIP en riesgo: solo dueño** | Dueño; añadir «VIP en riesgo» |
| Un miembro bloquea a un cliente | Clientes | owner, admin | — | Dueño, admin |
| Pocas unidades / agotado (productos y combos) | Productos | owner, admin | — | Dueño, admin (+recepción si vende [D]) |
| Importación de productos | Productos | owner, admin | — | Dueño, admin |
| Barbero con agenda > [%] | Calendario | admin | — | Admin, dueño |
| Barbería con ocupación del día > [%] | Calendario | owner, admin | — | Dueño, admin |
| Un barbero crea un bloqueo | Calendario | owner, admin, frontDesk | — | Admin, recepción |
| Un barbero solicita vacaciones | Calendario | owner, admin | — | Quien aprueba (dueño/admin) |
| Un barbero de renta crea vacaciones | Calendario | owner, admin | — | Dueño, admin, recepción |
| Métrica de salud baja / sube | Métricas | owner, admin, barberCommission, barberRent | — | Dueño, admin; al barbero **solo de sus métricas** |
| Retención trimestral de un barbero > / < [%] | Métricas | owner, admin | Coaching semanal al admin | Dueño, admin |
| Resúmenes diario…anual, sugerencia de subir precios | Reportes | owner, admin | — | Dueño (admin sin «subir precios») |
| **Cliente por volver** | ✗ | ✗ | **Solo barbero** | Nuevo, comisión y renta |
| **No-shows** | ✗ | frontDesk (`appointmentNoShow`) | **Solo barbero** | Barbero de la cita + recepción |
| **Recompra baja** | ✗ | ✗ | Barbero + dueño | Nuevo |
| **Concentración** (dependencia de un barbero) | ✗ | ✗ | Solo dueño | Nuevo |
| **Salida de un barbero** | ✗ | ✗ | Solo dueño | Nuevo |
| Primera visita (por barbero) | ✗ | `appointmentNewClient` a barberos | **No se muestra al barbero individual** (no culparlo) | Ojo: el aviso «cita con cliente nuevo» es operativo, no de culpa; mantenerlo pero sin métrica de primera visita por barbero |
| Check-in del cliente en el kiosco | ✅ «se notifica al barbero según Configuración» [P] | ✗ | — | Barbero de la cita (+recepción) |
| Cambios/cancelaciones de cita, recordatorio, lista de espera | ? | barberos, frontDesk | — | Barbero de la cita, recepción |

### 3.18 Eliminar cuenta

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la tarjeta | ✅ [P] | ? [M] | ? [M] | ✅ [P] (botón **Editar**) | ? [M] | Config. cuenta V | P §6b | ✓ (`/configuracion/eliminar-cuenta`) |
| **Eliminar la cuenta del negocio** («todos los datos asociados a tu negocio», irreversible) | ✅ [P] (no pulsado) | ? → — [D] | — [D] | ? [P] (el texto dice «negocio») → — [D] | — [D] | sin fila | P, D | ✓ (escribir el nombre de la empresa, `POST /account/delete`) |
| **Eliminar mi usuario** (solo mi acceso, el historial queda) | — (no existe) | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | — | D | ✗ |

[D] Por qué partirlo: el barbero ve hoy una tarjeta que, por su texto, borraría el negocio entero. La ayuda le dice
«antes, habla con el dueño: él puede inactivar tu perfil» (`eliminar-tu-cuenta.md`). Un barbero solo puede salir;
borrar el negocio es del dueño.

### 3.19 Formato de hora personal (solo visto con el barbero)

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Formato de hora\*** («solo se reflejarán en tu calendario, no en el de la peluquería ni el de tus clientes») | — (usa el del negocio) → ✅ [D] | ? → ✅ [D] | ? → ✅ [D] | ✅ [P] | ? [M] → ✅ [D] | Config. cuenta V (personal) | P §6b | ✗ (solo `business.timeFormat`) |

### 3.20 Mi perfil (`/profile`, menú de la cuenta)

Fuera de Configuración, pero comparte facturación.

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Información de la cuenta** (nombre, celular, idioma, zona horaria) | ✅ [P] | ? → ✅ 🔒 [D] | ? → ✅ 🔒 [D] | ? → ✅ 🔒 [D] | ? → ✅ 🔒 [D] | — | P | ✗ |
| **Plan actual** + **Cambiar plan** | ✅ [P] | ? → — [D] | — [D] | — [D] | — [D] | — | P | parcial (plan en Facturación) |
| **Métodos de pago** › **Gestionar** | ✅ [P] | — [D] | — | — | — | — | P | ✗ |
| **Historial de facturas** | ✅ [P] | — [D] | — | — | — | — | P | ✓ (en Facturación) |
| Cambiar de perfil (Business ↔ Barber comission) | ✅ [P] | ? | ? | ✅ [P] | ? | — | P | parcial («Ver como», no se guarda) |

### 3.21 Front Desk — kiosco (`fd.barberlytics.com/front-desk/{enlace}`)

Es **para los clientes**, en una tablet del local; «no hay reglas ni roles especiales», no caduca [P]. No es una
pantalla del dash: el rediseño solo da el enlace.

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Copiar el enlace (Configuración › Agendamiento online) | ✅ [P] | ✅ [M] | ✅ [D] | — [P] | — | Config. cuenta V | P | ✓ |
| **Activar kiosco** con **Teléfono del personal** + OTP | ✅ [P] | ✅ («alguien del equipo con cuenta» [P]) | ✅ [P] | ? [P] → — [D] | ? [P] → — [D] | sin fila → Front Desk·Activo [D] | P | ✗ (fuera del dash) |
| **Ingresar con Barberlytics** (si hay sesión en el navegador) | ✅ [P] | ✅ | ✅ | ? → — [D] | ? → — [D] | idem | P | ✗ |
| Activar con **código del personal** estilo Square | ✗ | → ✅ [N][D] | → ✅ [N][D] | — | — | idem | N | ✗ |
| **Pantalla completa** | cualquiera en la tablet [P] | | | | | — | P | ✗ |
| **Bloquear** (sin confirmación) | cualquiera en la tablet [P] → pedir código para reactivar [D] | | | | | — | P | ✗ |
| Cliente: **Check in** con cita → cita «Ingresado» y aviso al barbero | cliente [P] | | | | | — | P | ✗ |
| Cliente sin cita: **Unirse a la lista de espera** (servicio → barbero → confirmar) | cliente [P] (sin «sin preferencia», fallo) | | | | | — | P | ✗ |
| Cliente sin cita: **Reservar una cita** (ofrece **todas** las sedes, fallo) | cliente [P] | | | | | — | P | ✗ |
| Cliente nuevo: **Conozcámonos** (nombre, apellido, correo) | cliente [P] | | | | | — | P | ✗ |
| Dash: Lista de espera › **Ingresar** → crea la cita | ✅ [P] | ✅ [M] | ✅ [M] | ? → 🔒 la suya [D] | ? → 🔒 [D] | Reservas·Reservar citas C | P, M | ✓ (módulo Calendario) |

### 3.22 Ajustes que solo existen en Thema

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Identidad de marca**: subir logo (claro/oscuro) y nombre | ✅ [D] | 👁 [D] | — | — | — | Config. cuenta E | D | ✓ (`/configuracion/identidad`, `features/branding`) |
| **Personalización** (tema, densidad, acciones en barra o layout) | ✅ por persona | ✅ | ✅ | ✅ | ✅ | — | D | ✓ (menú de la cabecera, `PersonalizationMenu.tsx`) |
| **Ayuda** (`/ayuda`) y cajón «Ayuda» | ✅ | ✅ | ✅ | ✅ | ✅ (filtrar artículos por `roles` [D]) | — | D | ✓ (`HelpRole` sin «renta» ni distinción comisión/renta) |
| **Feedback** (diálogo + campaña) | ✅ | ✅ | ✅ | ✅ | ✅ | — | D | ✓ (manda `role` en texto libre) |

### 3.23 Ajustes nuevos que piden las fuentes

| Ajuste / acción | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Modelo de negocio** (comisión / híbrido / renta) con **fecha efectiva**, por barbería y por barbero | ✅ [N] | 👁 [D] | — | 👁 el suyo [D] | 👁 el suyo [D] | Equipo·Pagos de barberos A | N | ✗ |
| **Códigos del personal** (uno por persona, estilo Square) para kiosco y caja | ✅ gestionar [N] | ✅ 🔒 su sede [D] | 🔒 ver/cambiar el suyo [D] | 🔒 el suyo [D] | 🔒 el suyo [D] | nueva fila [D] | N | ✗ (el «Código» ya existe en la ficha, `casos/.../§6`) |
| **Datos bancarios** del barbero de renta (banco, número) | ✅ [P] (en su ficha › Pagos) | ? | — | — | — [P] → ✅ 🔒 suyos [D] | Pagos de barberos | P, D | parcial (`payroll`/`team` modelan la renta, no la vista del barbero) |
| **Mi enlace de reserva** (con el barbero preseleccionado) | — | — | — | ✅ 🔒 [D] | ✅ 🔒 [D] | Config. cuenta V | D | ✗ |
| **Reglas propias del de renta** (anticipación, cancelación, precios) | 👁 [D] | 👁 | — | — | ? [N][D] | ? | N | ✗ |

**Total mapeado:** 26 ajustes/pantallas (17 de producción + Formato de hora, Mi perfil, Front Desk, Identidad,
Personalización, Ayuda, Feedback y los nuevos) con **126 acciones**, más **25 avisos** repartidos por destinatario
en §3.17.

---

## 4. Mapa producción ↔ rediseño

| # | Producción (grupo › tarjeta, ruta) | Thema (grupo › sección, ruta) | Estado | Notas |
|---|---|---|---|---|
| 1 | Cuenta › **Detalles del negocio** `/business-details/{id}` | Negocio › **Perfil del negocio** `/configuracion/negocio` | ✓ | Festivos fijos de EE. UU.; sin ajuste por sucursal |
| 2 | Cuenta › **Detalles de facturación y facturas** `/settings/billing-details` | Cuenta › **Plan y facturación** `/configuracion/facturacion` | parcial | Sin administrar tarjetas ni filtros de facturas |
| 3 | Cuenta › **Agendamiento online** `/online-booking` | Negocio › **Reservas online** `/configuracion/agendamiento` (vistas Reglas / Enlaces) | parcial | Falta «franjas: N semanas en el futuro»; política editable (en prod solo vista previa) |
| 4 | Cuenta › **Portal del cliente** `/client-portal` | Dentro de **Reservas online › Enlaces** | parcial (fusionado) | Decisión del rediseño: «es la misma pregunta: cómo llega el cliente» (`BookingSettings.tsx:24`) |
| 5 | Cuenta › **Períodos de cierre del negocio** `/business-closed` | Negocio › **Horarios y cierres** `/configuracion/cierres` | ✓ | — |
| 6 | Cuenta › **Dispositivos de pago** `/devices` | Cobros › **Datáfonos** `/configuracion/dispositivos` | ✓ | — |
| 7 | Cuenta › **Sucursales** `/companies/locations` | Negocio › **Sucursales** `/configuracion/sucursales` | parcial | Sin ficha «Ver» (licencia, cifras) ni «Inactivar»; sin fotos |
| 8 | Cuenta › **Empresa** `/companies` | Negocio › **Datos legales** `/configuracion/empresa` | ✓ | Una empresa, no lista |
| 9 | Equipo › **Permisos** `/team-permission` | — (sacado; solo por persona en `/usuarios/miembros/:id`) | ✗ | Falta el editor del predeterminado por rol |
| 10 | Equipo › **Nomina** `/settings/payroll` | Pagos al equipo › **Ciclo de nómina** `/configuracion/nomina` | ✓ | — |
| 11 | Equipo › **Comisiones** `/team-commission` | Pagos al equipo › **Comisiones** `/configuracion/comisiones` | ✓ | — |
| 12 | Ventas › **Impuestos** `/sales-taxes` | Cobros › **Impuestos** `/configuracion/impuestos` | ✓ | — |
| 13 | Ventas › **Tarifa por uso de tarjeta** `/credit-card` | Cobros › **Recargo por tarjeta** `/configuracion/tarifa-tarjeta` | ✓ | — |
| 14 | Ventas › **Propinas** `/sales-tips` | Cobros › **Propinas** `/configuracion/propinas` | ✓ | Tres guardados → uno |
| 15 | Ventas › **Precios** `/sales-pricing` | Cobros › **Precios y moneda** `/configuracion/precios` | ✓ | `API_CONTRACT.md` dice «precios por nivel, redondeo»: desactualizado |
| 16 | Ventas › **Integración de pagos** `/payment-integration` | Cobros › **Pasarela de pago** `/configuracion/pagos` | parcial | Sin selector de sucursal (en prod es por ubicación) |
| 17 | Notificaciones › **Centro de notificaciones** `/notifications-center` | Negocio › **Recordatorios y avisos** `/configuracion/centro-notificaciones` | ✓ (ampliado) | + pestaña Clientes, SMS, umbrales, catálogo distinto por audiencia |
| — | **Eliminar cuenta** (pie) | Cuenta › **Eliminar cuenta** `/configuracion/eliminar-cuenta` | ✓ | Solo borra el negocio; no hay «eliminar mi usuario» |
| — | **Formato de hora** (personal, barbero) | — | ✗ | — |
| — | **Mi perfil** `/profile` | — | ✗ | Plan e historial viven en Facturación |
| — | — | Negocio › **Identidad de marca** `/configuracion/identidad` | solo Thema | Producción: logo/fotos en la sucursal |
| — | Kiosco `fd.barberlytics.com/front-desk` | Solo el enlace | fuera de alcance | La app del kiosco no es del dash |

Thema tiene 17 secciones: Negocio (7) · Cobros (6) · Pagos al equipo (2) · Cuenta (2). Pierde **Permisos** y
**Portal del cliente** como tarjetas y gana **Identidad de marca**.

---

## 5. Contradicciones y pendientes

1. **Qué cubre «Configuraciones de la cuenta».** Es la única fila de la matriz para Configuración, pero hay
   ajustes que no son «de la cuenta» (Sucursales, Empresa, Comisiones, Stripe, Notificaciones). Con V sola el barbero
   ve dos ajustes personales [P]; con V·E (recepción) no se sabe qué ve. *«Las configuraciones que aquí se establezcan
   serán las opciones predeterminadas…»* (`casos/configuracion.md:155`).
2. **Eliminar cuenta en el perfil de barbero.** La tarjeta dice *«Elimina permanentemente tu cuenta y todos los datos
   asociados a tu negocio»* y el barbero la ve con botón **Editar** (`casos/configuracion.md:35-39`). ¿Borra su
   usuario o intenta borrar el negocio? No se pulsó.
3. **Ajuste «por ubicación».** Comisiones, Impuestos, Propinas, Cierres, Agendamiento y Permisos dicen que se ajustan
   por sucursal; *«No se encontró dónde se ajusta por ubicación»* (`modelo-sucursales-roles-permisos.md:50`). Hipótesis
   del usuario: aparece con una persona con permiso de edición de sucursal. Sin verificar.
4. **Notificaciones: ¿la misma lista en cada pestaña?** *«no se comparó aviso por aviso»* (`notificaciones-por-rol.md`).
   Thema inventó un reparto por audiencia que **contradice a Notion**: da Churn y VIP al barbero de renta (Notion: solo
   dueño) y no da «en riesgo» al barbero por comisión (Notion: barbero + dueño) (`notificationCatalog.ts:52-54`).
5. **Matriz de Thema ≠ §5**: bloqueo de calendario invertido entre comisión y renta, recepción sin «Configuraciones de la
   cuenta», descarga de clientes repartida al revés (§2b).
6. **Front Desk: quién puede activarlo.** *«El de alguien del equipo con cuenta en Barberlytics»*
   (`front-desk/activar-el-kiosco.md`) frente a *«No hay reglas ni roles especiales»* (`casos/front-desk.md`). ¿Un
   barbero puede activar o bloquear el kiosco? No probado. Tampoco qué sede usa: el enlace es el mismo en dos sedes
   (`casos/front-desk.md`, «Dónde está el enlace (comprobado)»).
7. **Fallos de producción que tocan roles**: enlace del portal 404; kiosco sin «sin preferencia», «Reservar una cita»
   con todas las sedes, la tarjeta de lista de espera sin barbero; iOS «No permissions» en Settings [N].
8. **Cambiar el predeterminado de un rol** ¿alcanza a quienes ya existen? Sin comprobar
   (`cambiar-los-permisos-de-un-rol.md`).
9. **Admin y dinero**: la matriz le da Configuraciones de la cuenta V·E·A (facturación, Stripe, impuestos, moneda)
   pero no «Sección de pagos de barberos». La QA de Notion pide que vea compensación y nómina [N]. Este documento
   propone 👁 en lo de empresa y ✅ en lo operativo; por confirmar.
10. **Barbero de renta como negocio** [N]: ¿tiene datáfono, Stripe, impuestos o reglas de reserva propios? Producción
    no lo modela (la cuenta bancaria la ve y edita el dueño, `guia-del-barbero-de-renta.md:65`).
11. **Recepción y cifras**: Notion dice «sin métricas ni números», la matriz le da KPIs Activo [M]. En Configuración
    afecta a propinas, recargo y aumento de precios: aquí se propone 👁 solo de lo que necesita para cobrar.
12. **Contrato de Thema desactualizado**: `API_CONTRACT.md` describe `pricing` como «precios por nivel, redondeo» y
    `company` con «moneda», pero `settingsTypes.ts` no tiene nada de eso.

---

## 6. Cambios necesarios en Thema

Por orden de dependencia. Todo depende de la fase 1 de `ROLES_PLAN.md` (`useAccess()` con rol, `memberId`, permisos
y `scope`).

1. **Corregir la matriz de fábrica** — `src/features/team/permissionsCatalog.ts` (`ROLE_DEFAULT_PERMISSIONS`,
   `barber-payments` solo `active`) y `src/mocks/team/seed.ts:171` (`ROLE_PERMISSION_DEFAULTS`) a los valores de §2;
   mejor que el mock importe el catálogo en vez de duplicarlo. Prueba que compare celda a celda con §5.
2. **Permiso por ajuste** — `src/features/settings/settingsCatalog.ts`: añadir a `SettingsItemTemplate` un
   `access: { view: Rule; edit: Rule }` (rol o fila de la matriz: `account-settings`, `closures`, `payroll`,
   `permissions`, `barber-payments`, `owner-only`) y un `scope?: "company" | "branch" | "self"`; `buildSettingsGroups(t,
   access)` filtra. Ajustes nuevos con `scope: "self"`: **Mis preferencias** (formato de hora, avisos) y **Mi enlace
   de reserva**.
3. **Menú y pantalla filtrados** — `src/app/layouts/AppLayout.tsx:88,211` pasa los grupos ya filtrados al shell;
   `SettingsPage.tsx` pinta solo los visibles y, si no queda ninguno de empresa, la vista personal (nunca un vacío:
   el bug «No permissions» de iOS).
4. **Guarda de ruta y modo lectura** — `SettingsSectionPage.tsx`: id sin `view` → `/403`; con `view` sin `edit` →
   formulario en solo lectura (`SettingsDocument` y `SettingsList` en `SettingsFormParts.tsx`/`SettingsListParts.tsx`
   con `readOnly`: sin Guardar, sin alta/borrado). Migas: «Inicio» según el rol, no `/metricas` fijo.
5. **API con 403** — `src/mocks/settings/handlers.ts`: `PUT /settings/:section`, `POST/PATCH/DELETE
   /settings/lists/*`, `POST /settings/payments/test` y `POST /account/delete` responden `403 forbidden` según el rol
   de la sesión. `GET` de `tips` y `cardFee` debe seguir abierto a quien cobra (lo lee `CheckoutDrawer.tsx:17`).
   Documentarlo en `docs/API_CONTRACT.md` (§Configuración) y corregir allí `pricing` y `company`.
6. **Recorte a la sucursal del admin** — `ClosuresSettings.tsx` (solo su sede en `branchIds`), `BranchesSettings.tsx`
   (solo la suya; sin crear/borrar/inactivar), `PaymentsSettings.tsx` (selector de sucursal, como producción),
   `DevicesSettings.tsx`, `BusinessSettings.tsx` (horario y festivos por sede).
7. **Editor de permisos por rol** — recuperar la pantalla de producción como pestaña en Equipo
   (`/usuarios/permisos`, reutilizando `PermissionMatrix` y `PERMISSION_BLOCKS`): dueño edita, admin ve, pestaña Dueño
   bloqueada. `PermissionsForm.tsx`: el admin no edita dueño/admin ni a sí mismo. Añadir filas nuevas a
   `PERMISSION_BLOCKS`: **Transacciones**, **Front Desk (activar kiosco)**, **Reservas online (enlaces / reglas)**,
   **Notificaciones**, **Facturación del plan**.
8. **Notificaciones** — `notificationCatalog.ts`: reparto de la tabla de §3.17 (quitar Churn/VIP al de renta, dar
   «en riesgo» a comisión, añadir cliente por volver, no-show al barbero, recompra baja, concentración, salida de
   barbero, check-in del kiosco). `NotificationSettings.tsx`: admin sin editar la pestaña Dueño; nueva capa de
   **preferencias personales** (`/me/notifications`) para que cada persona silencie lo suyo.
9. **Eliminar cuenta en dos** — `DeleteAccountSettings.tsx`: dueño = negocio (como hoy); resto = **eliminar mi
   usuario** (`POST /me/delete`, nuevo en el contrato).
10. **Preferencias personales** — formato de hora personal (prop `timeFormat` en el usuario o en
    `PersonalizationMenu.tsx`), que el calendario use antes que `business.timeFormat`.
11. **Reservas online** — `settingsTypes.ts`/`BookingSettings.tsx`: añadir «franjas disponibles» (semanas en el
    futuro); política en vista previa con etiquetas como producción; enlace por barbero (`bookingUrl?barber=`) para
    comisión y renta; recepción solo vista Enlaces + reglas en lectura.
12. **Nuevos ajustes** — **Modelo de negocio** con fecha efectiva (grupo Pagos al equipo, solo dueño) [N]; **Códigos
    del personal** [N]; **Mis datos bancarios** para el de renta (sobre `features/team` `payments`).
13. **Ayuda y feedback** — `src/lib/help/types.ts` (`HelpRole`): distinguir `barbero-comision` / `barbero-renta` para
    filtrar artículos; `FeedbackHost`: mandar el rol efectivo (`TeamRole`), no la etiqueta.
14. **Catálogo y mapa** — `npm run catalog` y `npm run codemap` tras tocar rutas o exports; actualizar
    `docs/ROLES_PLAN.md` §3 (fila Configuración) con este detalle.
