# Roles · Métricas, Transacciones, Gastos y Nómina

Investigación del 2026-10-03. Baja al detalle de acción el resumen de `docs/ROLES_PLAN.md` (§3, filas Métricas,
Transacciones, Gastos y Nómina) para cinco roles: `owner` Dueño · `admin` Administrador de la locación ·
`recepcion` Recepción · `barbero-comision` Barbero por comisión · `barbero-renta` Barbero de renta.

**Celdas:** `✅` puede · `👁` solo ver · `🔒 suyo` solo lo suyo · `—` no lo ve · `?` sin dato.
**Marcas:** **[P]** visto en producción · **[M]** matriz de permisos de fábrica · **[N]** Notion · **[D]** decisión
propuesta aquí (por confirmar). Cuando la celda lleva dos marcas («— [N] / 👁 [M]») las fuentes chocan: está en §5.
**Permiso:** `bloque·fila·columna` con los ids de `src/features/team/permissionsCatalog.ts` (p. ej.
`metrics·kpis·active`). `(no existe)` = la matriz no tiene esa fila.
**En Thema:** `✓ (ruta)` existe · `parcial` existe pero distinto o sin recorte por rol · `✗` no existe. Hoy **ninguna**
pantalla de estos cuatro módulos mira el rol: todo lo que dice ✓ lo ve cualquiera que entre.

**Fuentes** (abreviadas en las tablas):

| Clave | Archivo |
|---|---|
| MSR | `centro-de-ayuda/casos/modelo-sucursales-roles-permisos.md` (§5 matriz, §6b perfil Barber comission) |
| PRD | `centro-de-ayuda/casos/produccion.md` (§Métricas) |
| GNT | `centro-de-ayuda/casos/gastos-nomina-transacciones.md` |
| CFG | `centro-de-ayuda/casos/configuracion.md` (Centro de notificaciones) |
| a:`ruta` | artículo `centro-de-ayuda/content/es/<ruta>.md` |
| RP | `docs/ROLES_PLAN.md` |
| N | resumen de Notion del encargo (BarberOS Logic Library, QA Priority Stack) |

No existe ningún `casos/metricas*.md`: lo de Métricas sale de PRD §Métricas, MSR §6b y los 21 artículos de
`content/es/metricas/`.

---

# Métricas / Inicio

`/` en producción (primer icono, «Inicio»), `/metricas` en Thema (`src/app/router.tsx:63` redirige el índice;
`/dashboard` también redirige; `src/features/dashboard/DashboardPage.tsx` es una plantilla que no se monta).

- **Dueño.** Las cinco pestañas (Negocio, Clientes, Barberos, Marketing, AI Insights) con filtro de sucursal (incluida
  «Todas las sucursales»), «Todo el equipo»/un barbero y periodo Hoy/Semana/Mes [P]. Es su pantalla de entrada [P].
  Notion le suma las alertas de negocio: churn, VIP en riesgo, concentración de ingresos, salida de un barbero [N].
- **Administrador.** Mismo tablero de su sucursal: la matriz le da `Indicadores clave de rendimiento empresariales`
  activo [M]. Nunca se vio con una cuenta real. Notion le da el **resumen semanal de coaching** [N]. Propuesta: sin
  «Todas las sucursales» salvo que esté activo en varias [D].
- **Recepción.** La matriz le da el KPI activo [M] pero Notion dice **sin métricas ni números** [N]. Propuesta: sin
  Métricas en el menú; aterriza en Calendario [D] (RP §3).
- **Barbero por comisión.** Visto en pantalla: tres pestañas (Negocio, Clientes, Barberos), **sin filtro de barbero**,
  cifras solo suyas ($120,000 frente a $10,260,490 del equipo) aunque la matriz no le da el KPI [P]. Sin Marketing ni AI
  Insights [P]. Notion le pone delante sus métricas de mérito (estado Earned = 80 % retención y 80 % ocupación en 60
  días, nivel, brecha al siguiente) [N] → «Lo que llevo» [D].
- **Barbero de renta.** De fábrica no tiene Métricas [M] y nunca se entró con su cuenta (a:`empezar/guia-del-barbero-de-renta`).
  Propuesta: sus cifras como **Mi negocio**, con la misma lógica que el dueño pero recortada a su silla [D] (RP §2).

## Inventario de acciones · Métricas

### Acceso, marco y filtros

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver «Inicio/Métricas» en el menú | ✅ [P] | ✅ [M] | — [N] / ✅ [M] | ✅ [P] (sin el permiso) | — [M] → 🔒 suyo [D] | `metrics·kpis·active` | MSR §5, §6b; a:`roles-y-permisos/permisos-recepcion` | parcial (`/metricas`, sin guarda; `src/app/navigation.ts:40`) |
| Aterrizar en Métricas al entrar / cambiar de perfil | ✅ [P] | ✅ [D] | — (Calendario) [D] | — (Calendario) [P] | — (Calendario) [D] | — | MSR §6b | parcial (`/` → `/metricas` para todos; `router.tsx:63`) |
| Pestaña **Negocio** | ✅ [P] | ✅ [M] | — [D] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | PRD §Métricas; MSR §6b | ✓ (`/metricas`) sin recorte |
| Pestaña **Clientes** | ✅ [P] | ✅ [M] | — [D] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | MSR §6b | ✓ (`/metricas?tab=customers`) sin recorte |
| Pestaña **Barberos** | ✅ [P] | ✅ [M] | — [D] | 🔒 suyo (solo su barra) [P] → «Mi rendimiento» [D] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/total-neto-del-equipo` | ✓ (`?tab=barbers`) sin recorte |
| Pestaña **Marketing** | ✅ [P] | ✅ [M] | — [D] | — [P] | ? → 🔒 suyo (sus citas online) [D] | `metrics·kpis·active` | a:`metricas/marketing-canales-y-campanas` | ✓ (`?tab=marketing`) |
| Pestaña **AI Insights** / IA | ✅ [P] | ✅ [M] | — [D] | — [P] | — [D] (ver alertas propias abajo) | `metrics·kpis·active` | a:`metricas/puntaje-de-salud` | ✓ (`?tab=insights`) |
| Filtro **sucursal** | ✅ con «Todas las sucursales» [P] | 👁 solo las suyas [D] | — | — (la de su perfil) [D] | — [D] | (no existe) | a:`metricas/filtrar-por-sucursal-equipo-y-periodo` | parcial (selector de la cabecera, `useBranchId`; **sin «Todas»** y Métricas no manda `branchId`, `features/metrics/api.ts`) |
| Filtro **Todo el equipo / un barbero** | ✅ [P] | ✅ [D] | — | — (no aparece) [P] | — [D] | (no existe) | MSR §6b; a:`metricas/filtrar-…` | parcial (`MetricsFilters.tsx:47`, para todos) |
| Periodo **Hoy / Semana / Mes** y flechas | ✅ [P] | ✅ [M] | — | ✅ [P] | ✅ [D] | — | a:`metricas/filtrar-…` | ✓ (`PeriodNavigator`, `?period=&date=`) |
| Rango de fechas libre | ✗ en producción [P] | — | — | — | — | — | a:`metricas/filtrar-…` (nota) | ✗ |
| Comparar con el periodo anterior (píldora de variación) | ✗ en producción | ✅ [D] | — | 🔒 suyo [D] | 🔒 suyo [D] | — | — | ✓ (`Compared` en `metrics/types.ts`) |
| **Exportar / descargar** Métricas | — (no hay botón) [P] | — [P] | — | — | — | — | a:`metricas/como-leer-metricas` FAQ | ✗ |
| Enlace compartible del tablero (URL con filtros) | ? | ? | — | 🔒 [D] (el enlace no debe abrir datos de otro barbero) | 🔒 [D] | — | — | ✓ (`useMetricsFilters.ts`; `?barber=` se puede escribir a mano) |

### Pestaña Negocio

Producción: «Con el perfil de barbero ves solo tus cifras» en todas las tarjetas de Negocio (a:`metricas/ticket-promedio-…`,
`ventas-e-ingresos`, `metodo-de-agendamiento-y-citas`, `horas-de-solicitud-de-citas`, `distribucion-de-pagos-…`,
`ventas-por-servicio-…`).

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Ticket promedio** (por transacción) | ✅ [P] | ✅ [M] | — [N] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/ticket-promedio-cancelacion-y-propinas` | ✓ (`MetricsPulse.tsx`) |
| **Tasa de cancelación** (canceladas + no-show) | ✅ [P] | ✅ [M] | — [N] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`MetricsPulse.tsx`) |
| **% de propinas** | ✅ [P] | ✅ [M] | — [N] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`SalesSection.tsx`, `kpi.tips`) |
| **Ventas** (total, % servicios / productos) | ✅ [P] | ✅ [M] | — [N] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/ventas-e-ingresos` | ✓ (`MetricsPulse` + serie `trend` en `SalesSection`) |
| **Ingresos** (servicios, productos, impuestos, propinas, tarifas, no se presentaron) | ✅ [P] | ✅ [M] | — [N] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`income` en `SalesSection`) |
| **Método de agendamiento** (interno / online / sin cita) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/metodo-de-agendamiento-y-citas` | ✓ (`AppointmentsSection.tsx`) |
| **Citas** (completadas, pendientes de cobro, canceladas, no se presentaron) | ✅ [P] | ✅ [M] | 👁 conteo del día sin dinero [D] | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`AppointmentsSection.tsx`) |
| **Horas de solicitud de citas** + tráfico hora a hora | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/horas-de-solicitud-de-citas` | ✓ (`daypart`, `traffic`) |
| **Distribución de pagos** (por método) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/distribucion-de-pagos-reembolsos-y-descuentos` | ✓ (`payments.title`) |
| **Transacciones** (número de cobros) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | parcial (`kpis.transactions` llega en el contrato; no hay tarjeta propia) |
| **Reembolsos** (monto y %) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`kpi.refunds`) |
| **Descuentos** (monto y %) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`kpi.discounts`) |
| **Ventas por servicio** | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/ventas-por-servicio-y-de-productos` | ✓ (`CatalogSection.tsx`) |
| **Ventas físicas** (tarjeta de regalo / productos) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✗ (no hay tarjeta; `giftCard` solo como método de pago) |
| **Ventas de productos** (unidades) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`CatalogSection.tsx`) |
| Franja **«Lo que pide una mano»** (por cobrar, canceladas, no-show → abre el calendario filtrado) | ✗ en producción | ✅ [D] | ✅ solo conteos, sin dinero [D] | 🔒 suyo [D] | 🔒 suyo [D] | `bookings·appointments·view` | — | ✓ (`MetricsAlerts.tsx:37`, navega a `/calendario?status=`) |

### Pestaña Clientes

Producción: responden al filtro de barbero; «con el perfil de barbero ves solo tus clientes / tus citas»
(a:`metricas/clientes-*`).

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Tasa de retención** (clientes recurrentes) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-tasa-de-retencion` | ✓ (`CustomersDashboard.tsx`) |
| **Ingreso promedio / cliente** | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-ingreso-promedio-por-cliente` | ✓ |
| **Reservas online** (vs. presenciales) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-reservas-online-y-rate-walk-in` | ✓ |
| **Rate walk-in** | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] (le resta: son deducciones) | `metrics·kpis·active` | ídem | ✓ |
| **Preferencia de barbero** (con / sin) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-preferencia-de-barbero` | ✓ |
| **Citas por tipo de cliente** (nuevos, retención de nuevos, recurrentes, recuperados) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-citas-por-tipo-de-cliente` | ✓ |
| **Nuevos vs recurrentes** | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ |
| **Frecuencia de visita** | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/clientes-frecuencia-de-visita` | ✓ |

### Pestaña Barberos

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Total neto del equipo** (cifra) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] (la tarjeta muestra su cifra) | 🔒 suyo [D] | `metrics·kpis·active` | a:`metricas/total-neto-del-equipo` | ✓ (`BarbersDashboard.tsx`, `totalNet`) |
| **Total neto por barbero** (barras, ranking) | ✅ [P] | ✅ [M] | — | 🔒 solo su barra [P] | 🔒 solo la suya [D] | `metrics·kpis·active` | ídem | ✓ (`netByBarber`; con `barberId` la lista trae solo a esa persona, `docs/API_CONTRACT.md` §Métricas) |
| **Lealtad al barbero** (% con preferencia) | ✅ [P] | ✅ [M] | — | 🔒 suyo [P] | 🔒 suyo [D] | `metrics·kpis·active` | ídem | ✓ (`loyalty`) |
| Ocupación media | ✗ en producción | ✅ [D] | — | 🔒 suya [D] (insumo de Earned) | 🔒 suya [D] | `metrics·kpis·active` | [N] Earned | ✓ (`avgOccupancy`) |
| Ticket medio por barbero | ✗ en producción | ✅ [D] | — | 🔒 suyo [D] | 🔒 suyo [D] | `metrics·kpis·active` | — | ✓ (`avgTicket`) |
| Servicios por barbero (barras) | ✗ en producción | ✅ [D] | — | 🔒 suyo [D] | 🔒 suyo [D] | `metrics·kpis·active` | — | ✓ (`servicesByBarber`) |
| Tabla por barbero (servicios, ocupación, cancelación, propinas) | ✗ en producción | ✅ [D] | — | 🔒 solo su fila [D] | 🔒 solo su fila [D] | `metrics·kpis·active` | — | ✓ (`metrics.barbers.table`) |
| Mezclar barberos de renta en el «total neto del equipo» | ? | ? | — | — | — | — | — | parcial: el mock (`src/mocks/metrics.ts:14`) cuenta a Valeria Marín y Tomás Peña, que son de renta en `src/mocks/team/seed.ts:296-297`, sin distinguirlos [D: separar «producción de sillas en renta»] |

### Pestaña Marketing

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Reservas online** | ✅ [P] | ✅ [M] | — | — [P] | 🔒 suyas [D] | `metrics·kpis·active` | a:`metricas/marketing-canales-y-campanas` | ✓ (`MarketingDashboard.tsx`) |
| **Mejor canal** | ✅ [P] | ✅ [M] | — | — [P] | 🔒 suyo [D] | ídem | ídem | ✓ |
| **Canales digitales** (`direct_link`, `website`) | ✅ [P] | ✅ [M] | — | — [P] | 🔒 suyos [D] | ídem | ídem | ✓ |
| **Rendimiento de campañas** | ✅ [P] | ✅ [M] | — | — [P] | ? (las campañas son de la barbería) | ídem | ídem | ✓ (`campaigns`) |
| **Conversión por canal** | ✅ [P] | ✅ [M] | — | — [P] | ? | ídem | ídem | ✓ (`conversion`) |
| Reservas por campaña (KPI) | ✗ en producción | ✅ [D] | — | — | ? | ídem | — | ✓ (`campaignBookings`) |

### Pestaña AI Insights (IA)

Producción: «Con el perfil de barbero esta pestaña no aparece»; el único filtro es la sucursal; mira los últimos 3 meses
(a:`metricas/como-leer-metricas`).

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Puntaje de salud** (0-100 + completación, retención, no asistió, ticket) | ✅ [P] | ✅ [M] | — | — [P] | — [D] | `metrics·kpis·active` | a:`metricas/puntaje-de-salud` | ✓ (`InsightsDashboard.tsx`, `MetricDial`) |
| **Alertas de riesgo de clientes** (perdidos / en riesgo / vencidos + lista) | ✅ [P] | ✅ [M] | — | — [P] → 🔒 sus clientes [N] | 🔒 sus clientes [N][D] | `metrics·kpis·active` | a:`metricas/alertas-de-riesgo-de-clientes`; [N] | ✓ (contadores; abren `/clientes?risk=`, `InsightsDashboard.tsx:89`) |
| **Mapa de capacidad** (día × hora) | ✅ [P] | ✅ [M] | — | — [P] | — [D] | ídem | a:`metricas/mapa-de-capacidad` | ✓ (`HeatmapMatrix`) |
| **Recomendaciones inteligentes** (Negocio / Clientes / Crecimiento, prioridad, acción) | ✅ [P] | ✅ [M] | — | — [P] | — [D] | ídem | a:`metricas/recomendaciones-inteligentes` | ✓ (`AIInsightCard`, grupos `clients/growth/operations`) |
| Filtro de periodo o barbero en IA | — (no existe) [P] | — | — | — | — | — | a:`metricas/como-leer-metricas` | ✓ (igual: sin filtros, `MetricsPage.tsx:145`) |

### Alertas y avisos de métricas

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Aviso «indicador de salud baja a amarillo/rojo» o «sube a verde» (correo/push) | ✅ [P] | ? (pestaña de rol propia) | ? | ? | ? | Centro de notificaciones por rol | CFG; a:`configuracion/notificaciones-de-metricas` | ✗ (no hay envío) |
| Aviso trimestral «retención de un barbero > / < [Porcentaje]» | ✅ [P] | ? | — [D] | 🔒 de sus métricas si se enciende en su pestaña [P-ayuda] | 🔒 [D] | ídem | ídem («cada barbero se entera de sus propias métricas») | ✗ |
| Reportes diario / semanal / mensual / trimestral / anual | ✅ [P] | ? | — [D] | ? | ? | ídem | CFG §Reportes | ✗ |
| Alerta **churn** / **VIP en riesgo** | ✅ [N] | ? | — | 🔒 sus clientes [N] | 🔒 sus clientes [N] | — | N; CFG (estados de clientes Churn, Pre-Churn, VIP) | parcial (contadores de riesgo en IA; sin VIP ni aviso) |
| Alerta **concentración de ingresos** (un barbero pesa demasiado) | ✅ [N] | ? | — | — | — | — | N | ✗ |
| Alerta **salida de un barbero** (clientes con preferencia expuestos) | ✅ [N] | ? | — | — | — | — | N | ✗ |
| **Resumen semanal de coaching** del equipo | ✅ [D] | ✅ [N] | — | — | — | — | N | ✗ |
| Alerta de **primera visita** individual | ✅ [N] | ✅ [N] | — | — (para no culparlo) [N] | — [N] | — | N; RP §3 | ✗ |
| **Mis métricas de mérito**: estado Earned (80 % retención + 80 % ocupación en 60 días), nivel, brecha al siguiente | 👁 de todos [D] | 👁 de su sucursal [D] | — | 🔒 suyo [N] | — (no aplica: no tiene niveles de comisión) [D] | — | N | ✗ (hay niveles en `team/types.ts:19` y `levelId` en el seed; no hay estado Earned ni tabla nivel→%) |

---

# Transacciones

`/transactions` en producción (GNT §Transacciones), `/transacciones` en Thema (`src/features/transactions/`). Es de
**consulta** en los dos: no se cobra ni se crea nada aquí (`docs/API_CONTRACT.md` §Transacciones). La matriz de permisos
**no tiene fila** de Transacciones (MSR §5; RP §4.8): el menú del dueño la tiene y el del barbero por comisión no [P].

- **Dueño.** Todo: rango, estados, cinco tarjetas (Facturado, Cobrado, Por cobrar, Propinas, Devuelto), tabla y detalle
  [P]. Debería ser quien devuelve y reasigna el crédito de un cobro, con auditoría [N].
- **Administrador.** Sin dato en producción: no hay fila en la matriz y nadie entró con ese rol. Propuesta: igual que
  el dueño en su sucursal, con devolución y reasignación de crédito auditadas [N][D].
- **Recepción.** Sin dato. Notion le da el cobro pero **sin números** [N]. Propuesta: las cuentas **del día** para
  cerrar caja (quién debe, estado, método), sin las tarjetas de totales ni el periodo [D] (RP §3).
- **Barbero por comisión.** No ve Transacciones [P]. Propuesta: sus cuentas (las que atendió) dentro de «Lo que llevo»,
  sin la pantalla de caja [D].
- **Barbero de renta.** Sin dato [M]. Propuesta: **sus transacciones** completas (es su caja) dentro de «Mi negocio» [D].

## Inventario de acciones · Transacciones

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver **Transacciones** en el menú | ✅ [P] | ? → ✅ [D] | ? → 👁 del día [D] | — [P] | ? → 🔒 suyo (en Mi negocio) [D] | (no existe) → `business·transactions·view` [D] | MSR §6b; RP §3 | parcial (`/transacciones`, sin guarda) |
| Encabezado «sucursal · rango · N cuentas» | ✅ [P] | ✅ [D] | — [D] | — | 🔒 [D] | ídem | GNT | parcial (sin encabezado de conteo; el conteo va en la ficha «Todas») |
| **Periodo**: DESDE/HASTA (prod., del 1 del mes a hoy) · Día/Semana/Mes (Thema, hoy) | ✅ [P] | ✅ [D] | — fijo en hoy [D] | — | 🔒 [D] | ídem | GNT; a:`transacciones/filtrar-transacciones` | parcial (`PeriodNavigator`, por defecto **hoy**, máx. 62 días) |
| Filtro **Estado de la cuenta** (Todos · Por cobrar · Cobrada · Devuelta) | ✅ [P] | ✅ [D] | ✅ [D] | — | 🔒 [D] | ídem | GNT | ✓ (fichas `OptionTile`; además **Anulada** `void`) |
| Filtro **Estado de la cita** (Agendada … Cancelada) | ✅ [P] | ✅ [D] | ✅ [D] | — | 🔒 [D] | ídem | GNT | ✓ (`Select`, `?estadoCita=`) |
| Botón **Aplicar** | ✅ [P] | — | — | — | — | — | GNT | ✗ (no hace falta: filtra al vuelo) |
| **Buscar** (lupa) | ✅ [P] | ✅ [D] | ✅ [D] | — | 🔒 [D] | ídem | a:`transacciones/buscar-una-transaccion` | ✓ (cliente, teléfono, factura, barbero, líneas) |
| **Recargar** | ✅ [P] | ✅ [D] | ✅ [D] | — | 🔒 [D] | ídem | GNT | ✓ (`transactions-refresh`) |
| Tarjeta **FACTURADO** | ✅ [P] | ✅ [D] | — [N] | — | 🔒 lo suyo [D] | ídem | a:`transacciones/las-cinco-tarjetas-de-transacciones` | ✓ |
| Tarjeta **COBRADO** | ✅ [P] | ✅ [D] | — [N] | — | 🔒 [D] | ídem | ídem | ✓ (con anillo % de lo facturado) |
| Tarjeta **POR COBRAR** | ✅ [P] | ✅ [D] | 👁 solo el número de cuentas abiertas [D] | — | 🔒 [D] | ídem | ídem | ✓ |
| Tarjeta **PROPINAS** | ✅ [P] | ✅ [D] | — [N] | 🔒 las suyas (en Lo que llevo) [D] | 🔒 las suyas [D] | ídem | ídem | ✓ |
| Tarjeta **DEVUELTO** | ✅ [P] | ✅ [D] | — [N] | — | 🔒 [D] | ídem | ídem | parcial (va como pie de la tarjeta Propinas) |
| Tabla: Fecha · Factura · Cliente · Atendió · Estado · Total · Cobrado · Método | ✅ [P] | ✅ [D] | 👁 sin Total/Cobrado del periodo [D] | 🔒 sus filas [D] | 🔒 sus filas [D] | ídem | GNT | ✓ (+ columnas ocultas Cita y Propina, `transactionsHome.tsx:65-74`) |
| Teléfono del cliente en la fila | 👁 ? (prod. muestra «nombre y teléfono») | 👁 enmascarado [D] | 👁 enmascarado [D] | 👁 enmascarado [D] | 👁 enmascarado [D] | `bookings·client-info·active` | GNT; RP §3 (Teléfonos) | ✓ enmascarado para todos (`maskPhone`) |
| Ordenar columnas | ✅ [P] | ✅ [D] | ✅ [D] | — | 🔒 [D] | — | GNT | ✓ (`DataListBlock`) |
| **Detalle de la cuenta** (líneas, subtotal, impuesto, total, propina, saldo, método, abrió, cobró, referencia) | ✅ [P] (fila desplegable, contenido no visto) | ✅ [D] | 👁 [D] | 🔒 las suyas [D] | 🔒 las suyas [D] | ídem | a:`transacciones/ver-el-detalle-de-una-cuenta` | ✓ (`AccountDrawer.tsx`, `?cuenta=`) |
| Ir a la **ficha del cliente** desde la cuenta | ✅ [D] | ✅ [D] | ✅ [D] | 🔒 si es su cliente [D] | 🔒 si es su cliente [D] | `bookings·clients·view` | — | ✓ (`AccountDrawer.tsx:46`) |
| Ir a la **cita** en el calendario | ✅ [D] | ✅ [D] | ✅ [D] | 🔒 si es suya [D] | 🔒 si es suya [D] | `bookings·appointments·view` | — | ✓ (`AccountDrawer.tsx:51`) |
| **Cobrar** una cuenta por cobrar desde aquí | — (no se vio botón) [P] | — | — | — | — | `bookings·appointments·edit` | a:`transacciones/una-cuenta-quedo-por-cobrar` | ✗ a propósito (se cobra en el calendario) |
| **Devolver / reembolsar** un pago | ? (estado Devuelta existe, botón no encontrado) [P] | ✅ con motivo [D] | — [D] | — [D] | — (lo pide al dueño) [D] | (no existe) → `business·transactions·edit` [D] | a:`transacciones/devolver-un-pago` | parcial (estado `refunded` en el mock, sin flujo) |
| Devolución **parcial** | ? [P] | ? | — | — | — | ídem | ídem | ✗ |
| **Anular** una cuenta | — (no existe como acción) | ? | — | — | — | ídem | a:`transacciones/estados-de-una-cuenta` | parcial (`void` sale solo de cita cancelada / no-show) |
| **Reasignar el crédito** de un cobro a otro barbero | ✅ con auditoría [N] | ✅ con auditoría [N] | — [N] | — [N] | — [N] | (no existe) → `business·transaction-credit·edit` [D] | N | ✗ |
| **Historial / auditoría** de cambios de una cuenta | ✅ [N] | ✅ [N] | — | 🔒 ver cambios en sus cuentas [D] | 🔒 [D] | ídem | N | parcial (`openedBy`, `chargedBy`; la cita tiene `history`, la cuenta no) |
| Ver **propina** por cuenta | ✅ [P] | ✅ [D] | 👁 [D] | 🔒 suya [D] | 🔒 suya [D] | ídem | a:`nomina/propinas-en-la-nomina` | ✓ (columna oculta + detalle) |
| Ver **método de pago** (Efectivo, Crédito/Débito, Link, Mixto) | ✅ [P] | ✅ [D] | ✅ [D] (para cuadrar caja) | 🔒 [D] | 🔒 [D] | ídem | a:`transacciones/metodos-de-pago-aceptados` | ✓ (`METHOD_KEYS`) |
| Filtrar por **barbero** o por **método** | — (no existe) [P] | — | — | — | — | — | a:`transacciones/filtrar-transacciones` FAQ | parcial (solo por búsqueda de texto) |
| Ventas de mostrador (sin cita, sin barbero) | ✅ [P] | ✅ [D] | ✅ [D] | — [D] | ? (¿son suyas si las vende él?) | ídem | — | ✓ (`kind: "sale"`, `barber: null`) |
| Clientes «Walk in» | ✅ [P] | ✅ [D] | ✅ [D] | 🔒 [D] | 🔒 [D] | ídem | a:`transacciones/clientes-walk-in-en-transacciones` | ✓ |
| **Exportar** transacciones | — (no hay botón) [P] | ? | — | — | 🔒 las suyas [D] | ídem | GNT | ✗ |

---

# Gastos

`/expenses` en producción (GNT §Gastos), `/gastos` en Thema. La matriz da **Gastos VCEB A** a Dueño, Administrador,
Barbero por comisión y Barbero de renta, y nada a Recepción [M]. El perfil de comisión **ve y puede editar los gastos de
la sucursal** (p. ej. «Renta · Semanal · $4,534,534.00») [P] (MSR §6b; RP §4.3).

- **Dueño.** Todos los gastos de cada sucursal (fijos y variables), crear, ver, editar, borrar [P].
- **Administrador.** Igual en su sucursal [M]; QA de Notion lo quiere a cargo de la operación [N].
- **Recepción.** No ve Gastos [M] (a:`gastos/gastos-fijos-y-variables` FAQ).
- **Barbero por comisión.** Hoy ve y edita los de la sucursal [P][M]: es un **error de privacidad** (renta del local,
  sueldos). Propuesta: sin Gastos [D]; si se quiere que registre una compra del local, que la cree sin ver la lista [D].
- **Barbero de renta.** Hoy la matriz le da Gastos completo [M], pero sobre la lista de la sucursal. Propuesta: **sus
  propios gastos** (productos, herramientas) dentro de «Mi negocio», sin ver los de la barbería [D].

## Inventario de acciones · Gastos

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver **Gastos** en el menú | ✅ [P] | ✅ [M] | — [M] | ✅ [P] → — [D] | ✅ [M] → 🔒 suyo [D] | `business·expenses·view` | MSR §5, §6b | parcial (`/gastos`, sin guarda; `navigation.ts:52`) |
| Lista **Fijos** (Nombre · Frecuencia · Valor · Acciones) | ✅ [P] | ✅ [M] | — | 👁 los de la sucursal [P] → — [D] | 🔒 suyos [D] | `business·expenses·view` | GNT | ✓ (pestaña Fijos; + columnas Tipo, «Por mes», Registrado) |
| Lista **Variables** (Nombre · Valor · Acciones) | ✅ [P] | ✅ [M] | — | 👁 [P] → — [D] | 🔒 suyos [D] | ídem | GNT | ✓ (pestaña Variables) |
| Pestaña **Todos** | ✗ en producción | ✅ [D] | — | — | 🔒 [D] | ídem | — | ✓ (`ExpensesPage.tsx:189`) |
| Tarjetas de resumen (total del mes, fijos por mes, variables del mes) | ✗ en producción | ✅ [D] | — | — [D] | 🔒 suyas [D] | ídem | — | ✓ (`ExpensesPage.tsx:161-178`) |
| **Buscar** | ✅ [P] | ✅ [M] | — | 👁 [P] → — [D] | 🔒 [D] | ídem | a:`gastos/la-lista-de-gastos` | ✓ |
| Paginación «Rows per page» | ✅ [P] | ✅ | — | 👁 [P] | 🔒 | — | ídem | ✓ (`DataListBlock`) |
| **Crear gasto fijo** (Nombre, Valor, Frecuencia, Descripción, fotos 0/3) | ✅ [P] | ✅ [M] | — | ✅ [M] → — [D] | ✅ [M] → 🔒 a su nombre [D] | `business·expenses·create` | GNT; a:`gastos/crear-un-gasto-fijo` | ✓ (`ExpenseFormDrawer.tsx`, sin fotos) |
| **Crear gasto variable** (Nombre, Valor, Descripción, fotos) | ✅ [P] | ✅ [M] | — | ✅ [M] → — [D] | ✅ [M] → 🔒 [D] | ídem | a:`gastos/crear-un-gasto-variable` | ✓ (sin fotos) |
| Frecuencia (Semanal · Cada 2 semanas · Mensual · Trimestral · Semestral · Anual) | ✅ [P] | ✅ | — | ✅ [M] | ✅ [M] | ídem | a:`gastos/frecuencia-de-un-gasto-fijo` | ✓ (`expenseFrequencySchema`) |
| **Fotos** del gasto (comprobante, 0/3) | ✅ [P] | ✅ [M] | — | ✅ [M] | ✅ [M] | ídem | GNT | ✗ |
| **Ver** un gasto (ficha de solo lectura) | ✅ [P] | ✅ [M] | — | 👁 [P] → — [D] | 🔒 [D] | `business·expenses·view` | a:`gastos/editar-o-borrar-un-gasto` | parcial (la fila abre directo el editor) |
| **Editar** un gasto | ✅ [P] | ✅ [M] | — | ✅ los de la sucursal [M] → — [D] | ✅ [M] → 🔒 solo los suyos [D] | `business·expenses·edit` | ídem | ✓ (barra: `edit`, `ExpensesPage.tsx:120`; sin guarda) |
| Cambiar el **tipo** fijo ↔ variable | — (no se vio) [P] | — | — | — | — | — | a:`gastos/crear-un-gasto-variable` FAQ | — (el `PATCH` ignora `kind`) |
| **Borrar** un gasto (con confirmación) | ✅ [P] | ✅ [M] | — | ✅ [M] → — [D] | ✅ [M] → 🔒 solo los suyos [D] | `business·expenses·delete` | ídem | ✓ (`ConfirmDialog`; sin guarda) |
| Gastos de **otra sucursal** (cambiar en la cabecera) | ✅ [P] | ? (solo las suyas) [D] | — | — [D] | — | (no existe) | a:`gastos/la-lista-de-gastos` FAQ | ✓ (`useBranchId`) |
| Ver todas las sucursales juntas | — (no existe) [P] | — | — | — | — | — | ídem | ✗ |
| **Categorías** de gasto | ? (no se vieron) | ? | — | — | ? | — | GNT | ✗ |
| Quién **registró** el gasto | ? | ? | — | — | — | — | — | ✗ (`expense` no tiene `createdBy`) |
| Gasto **de un barbero de renta** (separado del de la barbería) | — (no existe) | — | — | — | 🔒 [D] | `business·expenses·*` + alcance `own` [D] | RP §2 | ✗ (`expense` no tiene `ownerMemberId`) |
| Exportar gastos | ? (no se vio botón) | ? | — | — | 🔒 los suyos [D] | — | GNT | ✗ |

---

# Nómina

`/payroll` en producción (GNT §Nómina), `/nomina` en Thema. Es **de consulta** en los dos: se calcula sobre las citas
cobradas y la compensación de cada ficha (`docs/API_CONTRACT.md` §Nómina). La matriz da **Nómina de sueldos V C E**
a Dueño y Administrador y nada a los demás [M]; **Sección de pagos de barberos** (la pestaña Compensación/Pagos de la
ficha) es **solo del dueño** [M].

- **Dueño.** Todo: tres pestañas (comisión, renta, salario), sucursal, rango, fila **All**, descarga CSV/Excel/PDF [P].
  Edita las reglas de pago en la ficha de cada barbero [M].
- **Administrador.** Ve y calcula la nómina de su sucursal (V C E) [M]; QA de Notion pide que vea compensación y
  nómina [N]. No edita la compensación (no tiene «Sección de pagos de barberos») [M].
- **Recepción.** — [M].
- **Barbero por comisión.** No ve Nómina [P] («Tu pago lo ve el dueño», a:`empezar/guia-del-barbero-por-comision`).
  Propuesta: **su propio pago del periodo** (comisiones de servicio y producto + propinas, regla aplicada por cita) en
  «Lo que llevo» [N][D].
- **Barbero de renta.** No ve Nómina [M]. Propuesta: **su renta, sus deducciones y su pago neto** —también el negativo,
  lo que le debe a la barbería— en «Mi negocio» [N][D].

## Inventario de acciones · Nómina

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver **Nómina** en el menú | ✅ [P] | ✅ [M] | — [M] | — [P] | — [M] | `business·payroll·view` | MSR §5, §6b | parcial (`/nomina`, sin guarda; `navigation.ts:53`) |
| Pestaña **Barbero por comisión** | ✅ [P] | ✅ [M] | — | 🔒 su fila (en Lo que llevo) [D] | — | ídem | GNT | ✓ (`?pago=commission`) |
| Pestaña **Barbero de renta** | ✅ [P] | ✅ [M] | — | — | 🔒 su fila (en Mi negocio) [D] | ídem | GNT | ✓ (`?pago=rent`) |
| Pestaña **Barbero por salario** | ✅ [P] | ✅ [M] | — | 🔒 su fila si es de salario [D] | — | ídem | GNT | ✓ (`?pago=salary`) |
| Comisión **de escala** (sin pestaña: va en comisión) | ✅ [P] | ✅ [M] | — | 🔒 su tramo y lo que falta para el siguiente [D] | — | ídem | a:`nomina/la-nomina-no-coincide-con-lo-que-espero` | ✓ (tramos en el detalle, `payroll.detail.tier`) |
| Filtro **Sucursal** | ✅ [P] | 👁 solo la suya [D] | — | — | — | (no existe) | a:`nomina/filtrar-la-nomina-por-fechas-y-sucursal` | parcial (cabecera, sin «Todas») |
| **Rango de fechas** + flechas + «15 Dias» | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | `business·payroll·view` | ídem | parcial (`PeriodNavigator` Día/Semana/Mes, por defecto **semana**, máx. 62 días) |
| Periodo por defecto = **ciclo de pago** (Configuración › Nomina) | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | — | a:`nomina/ciclo-de-pago` | ✗ (`PayrollCycleSettings` existe pero `usePayrollFilters.ts:17` no lo lee) |
| Fila **All** (total del equipo de la pestaña) | ✅ [P] | ✅ [M] | — | — [D] | — [D] | ídem | GNT | parcial (no hay fila; cuatro tarjetas arriba: A pagar, A cobrar por rentas, Comisiones, Propinas) |
| Tarjetas **A pagar al equipo / A cobrar por rentas / Comisiones / Propinas** | ✗ en producción | ✅ [D] | — | — [D] | — [D] | ídem | — | ✓ (`PayrollPage.tsx:138-141`) |
| Columnas comisión: Miembro · Servicios · Venta servicios · Venta productos · Comisión servicios · Comisión productos · **Total comisiones** · **Impuestos** · Propinas · Pago neto | ✅ [P] | ✅ [M] | — | 🔒 su fila [D] | — | ídem | GNT; a:`nomina/nomina-barberos-por-comision` | parcial (sin Total comisiones ni Impuestos; `payrollHome.tsx:16`) |
| Columnas renta: Miembro · Servicios · Venta servicios · Venta productos · Comisión servicios · Comisión productos · Total comisiones · Propinas · **Renta fija** · Pago neto | ✅ [P] | ✅ [M] | — | — | 🔒 su fila [D] | ídem | GNT; a:`nomina/nomina-barberos-de-renta` | parcial (Thema: Servicios · Venta servicios · Propinas · Renta · **Deducciones** · Neto; sin productos; `payrollHome.tsx:17`) |
| Columnas salario: Miembro · Venta productos · Comisión productos · Impuestos · Propinas · Salario · Pago neto | ✅ [P] | ✅ [M] | — | 🔒 su fila [D] | — | ídem | GNT; a:`nomina/nomina-barberos-por-salario` | parcial (sin Impuestos; con Servicios; `payrollHome.tsx:18`) |
| **Buscar** un miembro | ? | ✅ [D] | — | — | — | ídem | — | ✓ |
| **Detalle por miembro** (reglas, la cuenta suma/resta, cita por cita con regla aplicada) | ? (no se vio) [P] | ✅ [D] | — | 🔒 el suyo [D] | 🔒 el suyo [D] | ídem | GNT §No visto | ✓ (`PayrollMemberDrawer.tsx`, `?miembro=`) |
| Ir a **las reglas** del barbero (Compensación / Pagos de su ficha) | ✅ [P] (Equipo) | 👁 [M] (sin «Sección de pagos») | — | 👁 sus porcentajes, sin editar [D] | 👁 su base y deducciones, sin editar [D] | `team·barber-payments·view/edit` (dueño) | MSR §5, §6 | ✓ (`PayrollMemberDrawer.tsx:39`, navega a la ficha) |
| **Editar** compensación / base de renta / deducciones | ✅ [M] | — [M] | — | — | — | `team·barber-payments·edit` | MSR §5 | parcial (ficha de Equipo, sin guarda) |
| **Descargar** CSV · Excel · PDF | ✅ [P] | ✅ [D] | — | 🔒 su liquidación en PDF [D] | 🔒 su liquidación en PDF [D] | `business·payroll·view` | a:`nomina/descargar-la-nomina` | parcial (solo **CSV** de la pestaña visible, `PayrollPage.tsx:120`) |
| **«Crear»** en Nómina de sueldos (columna C de la matriz) | ✅ [M] | ✅ [M] | — | — | — | `business·payroll·create` | MSR §5 | ? (no se sabe qué crea: no hay botón en producción ni en Thema) |
| **Marcar pagado** / cerrar el periodo | ? (no se vio) | ? | — | 👁 estado «pagado» de su periodo [D] | 👁 «pagó su renta» [D] | `business·payroll·edit` [D] | GNT §No visto | ✗ |
| Registrar **cobro de la renta** al barbero (lo que debe) | ? | ? | — | — | 👁 [D] | ídem | a:`nomina/mi-pago-neto-sale-negativo` («¿La app le cobra al barbero por su cuenta?») | ✗ |
| **Pago neto negativo** (renta > lo generado) | ✅ [P] | ✅ [M] | — | — (no aplica) [P-ayuda] | 🔒 el suyo, explicado [D] | ídem | a:`nomina/mi-pago-neto-sale-negativo` | ✓ («Le debe X», `PayrollPage.tsx:180`) |
| **Propinas** por barbero | ✅ [P] | ✅ [M] | — | 🔒 suyas [D] | 🔒 suyas [D] | ídem | a:`nomina/propinas-en-la-nomina` | ✓ (columna + por cita) |
| **Deducciones** de renta (sin cita, cliente nuevo, sin preferencia) | ✅ [P] (en la ficha; no hay columna) | ✅ [M] | — | — | 🔒 suyas, cita por cita [D] | ídem | a:`nomina/como-se-calcula-la-renta` | parcial (columna y detalle; **monto fijo por cita**, no %) |
| Deducciones antes de comisionar (descuentos, impuestos, costo de servicio/producto) | ✅ [P] (Configuración › Comisiones) | ? | — | 👁 cuáles se le aplican [D] | — | `business·account-settings·edit` | CFG; a:`nomina/como-se-calcula-una-comision` | parcial (ajuste existe en Configuración; el mock de nómina no lo aplica) |
| **Adelantos, préstamos, ajustes manuales** | ? | ? | — | 👁 [D] | 👁 [D] | — | — | ✗ |
| **Datos bancarios** del barbero | ✅ [P] (ficha de renta) | ? | — | ? | 👁 / ✅ los suyos [D] (RP §3 Configuración) | `team·barber-payments` | MSR §6; a:`empezar/guia-del-barbero-de-renta` FAQ | parcial (`payments.bankName/accountNumber` en la ficha) |

---

# Vistas propias del barbero

## «Lo que llevo» (barbero por comisión) [D]

Una pantalla (o la primera pestaña de su Inicio) que responde «cuánto llevo ganado este periodo y qué me falta para
subir». Sustituye a la pestaña Barberos de su Métricas y le da lo que hoy no tiene: su pago.

| Bloque | Qué muestra | Dato que ya existe en Thema | Falta |
|---|---|---|---|
| Ganado del periodo | Comisión de servicios + comisión de productos + propinas = pago neto | `GET /payroll` → `member.serviceCommission`, `productCommission`, `tips`, `net` (`src/mocks/payroll/handlers.ts`) | Filtrar por `memberId = yo` en el servidor; periodo = ciclo de pago |
| Cita por cita | Fecha, cliente, servicio, regla aplicada (recurrente, nuevo, sin cita, sin preferencia, básica), % y comisión | `member.lines[]` (`rule`, `rate`, `sale`, `commission`, `tip`) | — |
| Mis reglas | Sus cinco porcentajes y el de productos; tramos si es de escala | `member.rules` | Solo lectura |
| Por cobrar | Citas suyas atendidas sin cobrar (no entran en la nómina) | `GET /transactions` (`status: "open"`) | `barberId` en la cuenta (hoy solo el nombre) |
| Mérito | Estado Earned (80 % retención + 80 % ocupación, ventana 60 días), nivel actual, % de comisión del nivel (40–65 %) y brecha al siguiente [N] | Ocupación y retención por barbero: `GET /metrics/barbers?barberId` (`occupancy`), `GET /metrics/customers?barberId` (`retentionRate`); nivel: `member.levelId` | Ventana fija de 60 días; tabla nivel → %; cálculo del estado |
| Mis clientes por volver | En riesgo / vencidos / no-shows propios [N] | Contadores de riesgo de `GET /metrics/insights` (de toda la sucursal) | Versión por barbero; sin alertas de primera visita [N] |

## «Mi negocio» (barbero de renta) [D]

«Lo mismo que un dueño, recortado a su silla» (RP §2). Responde «cuánto facturé, cuánto le pago a la barbería y cuánto me
queda».

| Bloque | Qué muestra | Dato que ya existe en Thema | Falta |
|---|---|---|---|
| Ventas | Servicios + productos del periodo, ticket, citas | `member.serviceSales`, `productSales`, `services` de `/payroll`; `GET /metrics/business?barberId` | Que `/metrics` use el id del equipo (`team-30`…) y la sucursal |
| Renta | Renta fija del periodo (base × semanas) | `member.rent`, `rentBase` | Reparto según el ciclo (pendiente en producción) |
| Deducciones | Por cliente que trajo la barbería: sin cita, nuevo, sin preferencia, cita por cita | `member.deductions`, `lines[].deduction` + `rule` | Aplicar como % (ver §5) |
| Propinas | Las suyas | `member.tips` | — |
| Pago neto | Positivo: la barbería le paga · negativo: le debe | `member.net` | Decidir la fórmula (ver §5) y el estado «pagado» |
| Sus transacciones | Sus cuentas con estado y método | `GET /transactions` | `barberId` en la cuenta y filtro en el servidor |
| Sus gastos | Lo que compra para su silla | `GET /expenses` (por sucursal) | `ownerMemberId` en el gasto y filtro |
| Sus clientes y métricas | Retención, ocupación, ticket, reservas online | `/metrics/*?barberId` | Ídem ids |
| Datos bancarios | Banco y cuenta | `payments.bankName`, `accountNumber` | Que los vea/edite él (RP §3) |

---

# Datos que se recortan a «lo suyo»

Hoy **ningún** endpoint recorta por persona: la sesión no sabe qué miembro del equipo es quien entra
(`src/features/auth/types.ts:4`, `role: admin | manager | member`, sin `memberId`; RP §5). El recorte tiene que pasar
en el servidor, no solo esconderse en la pantalla.

| Dato | Endpoint | Campo para recortar hoy | Problema | Recorte propuesto [D] |
|---|---|---|---|---|
| Métricas (4 pestañas) | `GET /metrics/{business,customers,barbers,marketing}` | `barberId` (parámetro) | Lo pone el cliente desde `?barber=` (`useMetricsFilters.ts:29`); ids `b4…b8` (`src/mocks/metrics.ts:14`) ≠ ids del equipo `team-04…` (`src/mocks/team/seed.ts:258`); **no lleva `branchId`** | El servidor fuerza `barberId = sesión.memberId` cuando el alcance es `own` e ignora el parámetro |
| Métricas IA | `GET /metrics/insights` | ninguno | Siempre de toda la barbería | `403` para comisión, renta y recepción; o versión `?barberId` solo con sus clientes |
| Lista de barberos del filtro | `metrics/business` → `barbers[]` | — | Revela nombres del equipo aunque no se use | Vacío cuando el alcance es `own` |
| Transacciones | `GET /transactions` | `account.barber` (**nombre**) | No hay id; el mock tiene `appointment.barberId` pero no lo expone (`src/mocks/transactions/handlers.ts:71`) | Añadir `barberId` a `account`; filtrar por él; las ventas de mostrador (`barber: null`) solo para dueño/admin/recepción |
| Totales de caja | calculados en el front (`summarize`) | — | Recepción los vería | No mandar `collected/tip/total` agregados a recepción, o esconder tarjetas |
| Gastos | `GET /expenses` | `branchId` | Sin dueño del gasto: comisión y renta ven los de la sucursal | Añadir `ownerMemberId` (`null` = barbería) y `createdBy`; renta → solo los suyos; comisión → `403` |
| Nómina | `GET /payroll` | `memberId` en cada fila | Devuelve a todo el equipo de la sucursal | `?memberId` forzado por la sesión para comisión y renta; `403` para recepción |
| Detalle de nómina | `member.lines[].client` | nombre del cliente | Correcto para el propio barbero | — |
| Riesgo de clientes | `/metrics/insights` → `risks` | — | Cuenta clientes de toda la sucursal | Por `preferredBarberId` o por última cita con él |

---

# Cifras y privacidad

1. **Recepción sin dinero** [N]: ni Métricas, ni tarjetas de Transacciones, ni Nómina, ni Gastos. Para cerrar caja ve
   cuentas del día, estado y método, sin total del periodo [D]. Choca con la matriz de producción, que le da el KPI
   activo [M] (§5).
2. **Comisión ve solo sus cifras** [P]: hoy producción lo hace bien en Métricas (sin filtro de barbero, cifra propia)
   pero lo hace **mal en Gastos** (ve la renta del local de la sucursal) [P]. Propuesta: fuera de Gastos [D].
3. **Ranking**: el barbero no debe ver el total neto ni la barra de otros [P] (solo su barra). Tampoco el «total neto
   del equipo» como cifra de contexto [D]: le da a entender cuánto factura la barbería.
4. **Renta ve su negocio, no el de la barbería** [N][D]: ni la renta de otros, ni la nómina, ni los gastos de la
   barbería. Notion dice que la barbería ve su actividad **agregada** [N]: hay que decidir si el dueño ve el detalle de
   las cuentas de un barbero de renta (§5).
5. **Teléfonos enmascarados** en todas las listas para todos los roles [P] (`+57******2020`); Thema ya enmascara en
   Transacciones (`maskPhone`).
6. **Primera visita** no se alerta al barbero de forma individual, para no culparlo [N].
7. **Datos sensibles** de la ficha (código de la persona, banco, número de cuenta) no se copian a la ayuda (MSR
   «Pendiente» 10) y no deben salir en la exportación de nómina de otros [D].
8. **Exportaciones**: la nómina es lo único que se descarga en producción [P]. Una descarga debe respetar el mismo
   recorte que la pantalla [D] (hoy el CSV de Thema baja lo que hay en la pestaña, sin mirar el rol).
9. **El enlace no es permiso**: los filtros viven en la URL (`?barber=`, `?miembro=`, `?cuenta=`). Abrir un enlace
   ajeno no debe mostrar datos de otra persona: el servidor responde `403` (`docs/API_CONTRACT.md` ya define
   `403 forbidden`, «El rol no puede hacer esto»).

---

# Contradicciones y pendientes de confirmar

1. **Métricas de recepción.** Matriz: «Indicadores clave de rendimiento empresariales … A» para Recepción (MSR §5) y la
   guía lo repite («Ver **Métricas**», a:`empezar/guia-de-recepcion`). Notion: recepción «sin métricas ni números» [N].
   → Decidir; propuesta [D]: sin Métricas.
2. **Métricas del barbero por comisión.** Matriz: KPI «no» (MSR §5). Pantalla: tres pestañas con sus cifras (MSR §6b).
   Las métricas personales no dependen de ese permiso (RP §4.1). → Confirmar que «suyo» no lleva permiso.
3. **Gastos del barbero por comisión.** Matriz «VCEB A» (MSR §5) y en pantalla «ve los de la sucursal» (MSR §6b). →
   ¿Es intencional? Propuesta [D]: quitarlo.
4. **Fórmula del pago neto de renta.** Producción: «Cuando la renta supera lo generado, el **Pago neto** sale negativo»
   (a:`nomina/como-se-calcula-la-renta`) y la pestaña trae **Comisión de servicios / Total comisiones** (GNT). Thema:
   `net = serviceCommission + productCommission + tips + salary − rent − deductions` con comisión 0 para renta
   (`docs/API_CONTRACT.md` §Nómina; `src/mocks/payroll/handlers.ts`), o sea, **sus ventas no cuentan**: supone que el
   barbero cobra directo. Notion: «se queda el 100 %» [N]. → ¿Quién recibe el dinero de las citas del de renta? Si entra
   a la caja de la barbería, el neto debe sumar sus ventas.
5. **Deducciones de renta: % o monto.** Producción: «Un porcentaje que la barbería descuenta por cada cliente…»
   (a:`empezar/guia-del-barbero-de-renta`). Thema: el formulario las pide en `%` (`src/features/team/forms/PaymentsForm.tsx:39`)
   pero el mock las resta como **monto fijo por cita** (`src/mocks/payroll/handlers.ts:79`, con valores 20/20/15). Además
   «sobre qué monto se aplican» está pendiente en producción (a:`nomina/como-se-calcula-la-renta`, nota).
6. **Renta: semanal o por ciclo.** Thema: «Renta por semana» (`payroll/types.ts:45`). Producción: «Lo que pagas por la
   silla en cada ciclo» y «cómo se reparte según el ciclo, pendiente» (a:`nomina/nomina-barberos-de-renta`). Notion:
   semanal o mensual [N].
7. **Columna Impuestos.** Producción la tiene en comisión y salario (GNT); Thema no la modela («Los impuestos que muestra
   producción no se modelan», `docs/API_CONTRACT.md` §Nómina).
8. **Administrador y nómina.** Matriz: «Nómina de sueldos V C E» (MSR §5); QA de Notion pide que vea compensación [N];
   pero «Sección de pagos de barberos» es solo del dueño (MSR §5). → ¿El admin ve los porcentajes y la base de renta de
   cada barbero (solo lectura)?
9. **Qué es «Crear» en Nómina** (matriz V **C** E). No hay botón en producción ni en Thema. ¿Ajustes manuales, cierre de
   periodo, pagos?
10. **Transacciones no está en la matriz** (MSR §5; RP §4.8). No se sabe si admin, recepción o renta la ven hoy. →
    Añadir la fila.
11. **Devolución.** Existen el estado **Devuelta**, la tarjeta **DEVUELTO** y el KPI **Reembolsos**, pero «no apareció
    ningún botón de devolución» (a:`transacciones/devolver-un-pago`). Quién puede, si es parcial y si le quita la
    comisión al barbero: pendiente.
12. **Reasignar el crédito de un cobro** (dueño/admin con auditoría) existe solo en Notion [N]; ni producción ni Thema
    lo tienen.
13. **«Actividad agregada» del de renta** [N] frente a la fila por barbero de renta que hoy ve el dueño en Nómina [P]. ¿El
    dueño ve el detalle cita por cita de un barbero de renta?
14. **Total neto del equipo con barberos de renta.** Qué descuenta el «neto» y si coincide con la base de la nómina está
    pendiente (a:`metricas/total-neto-del-equipo`, nota); en Thema el mock suma barberos de renta como si su venta fuera de
    la barbería (`src/mocks/metrics.ts:14` frente a `src/mocks/team/seed.ts:296-297`).
15. **Periodo por defecto.** Producción: Transacciones del 1 del mes a hoy (GNT); Nómina con el ciclo. Thema:
    Transacciones **hoy**, Nómina **semana**, Métricas **mes** (`useTransactionsFilters.ts:25`, `usePayrollFilters.ts:17`,
    `useMetricsFilters.ts:27`).
16. **Avisos de métricas por rol.** El Centro de notificaciones tiene una pestaña por rol (CFG), pero qué recibe cada rol
    por defecto no se vio.
17. **Administrador y otras sucursales**: ¿ve «Todas las sucursales»? (a:`empezar/guia-del-administrador` FAQ remite a
    «De qué depende lo que ves»; RP §4.5).
18. **Mérito Earned** (80/80 en 60 días) y comisión 40–65 % por nivel solo en Notion [N]; en producción el % es por tipo de
    cliente y no por nivel (MSR §6). ¿Conviven las dos lógicas?
19. **Matriz de Thema ≠ matriz de producción** en filas vecinas: el admin recibe `export-clients` (producción: no) y la
    recepción `services·view` (producción: no) en `permissionsCatalog.ts:108-109`; el de renta pierde `block-calendar`
    completo, `import/export-clients` y `clients·edit/delete` (`:111`, frente a MSR §5). Afecta a otros informes pero
    conviene corregirlo junto.

---

# Cambios necesarios en Thema

Por fases, siguiendo RP §5. Todo lo marcado [D] depende de las decisiones de §5.

**Acceso (base para todo lo demás)**
- `src/features/auth/types.ts`: `role: TeamRole` (los cinco de `src/features/team/types.ts:10`) y `memberId` en el usuario;
  un solo enum.
- Nuevo `useAccess()` (p. ej. `src/features/access/`): rol efectivo (incluido «Ver como» de `src/app/layouts/AppLayout.tsx`),
  `memberId`, permisos y `scope: "all" | "own"`.
- `src/features/team/permissionsCatalog.ts`: filas nuevas `business·transactions` (`view`, `edit` = devolver, `active`) y
  `business·transaction-credit` (`edit`, reasignar) [D]; corregir defaults según §5.19; decidir si Métricas personales
  depende de `kpis` (§5.2).
- `src/app/navigation.ts`: `permission` en `inicio`, `gastos`, `nomina`, `transacciones`; entradas nuevas «Lo que llevo» y
  «Mi negocio» solo para su rol.
- `src/app/router.tsx`: guarda `RequirePermission` → `/403`; índice según el rol (Calendario para recepción y barberos);
  rutas `/lo-que-llevo` y `/mi-negocio` [D].

**Métricas**
- `src/features/metrics/useMetricsFilters.ts` y `MetricsPage.tsx`: `METRICS_TABS` según el rol (comisión: Negocio,
  Clientes, Mi rendimiento; sin Marketing ni IA), `barberId` fijo en `own`.
- `src/features/metrics/MetricsFilters.tsx`: prop para ocultar el selector de barbero.
- `src/features/metrics/api.ts`, `types.ts`: mandar `branchId`; aceptar «todas las sucursales» para el dueño.
- `src/features/metrics/tabs/BarbersDashboard.tsx`: modo `own` sin «del equipo» ni ranking; separar barberos de renta.
- `src/features/metrics/tabs/InsightsDashboard.tsx`: fuera para barberos o versión con sus clientes.
- `src/features/metrics/sections/MetricsAlerts.tsx`: en recepción, solo conteos.
- `src/mocks/metrics.ts`, `src/mocks/metricsTabs.ts`, `src/mocks/handlers.ts:286-313`: ids del equipo (`team-xx`), por
  sucursal, `403`/recorte por sesión, renta aparte.

**Transacciones**
- `src/features/transactions/types.ts` y `docs/API_CONTRACT.md`: `barberId` en `account`; historial de la cuenta.
- `src/mocks/transactions/handlers.ts`: exponer `barberId`, filtrar por sesión, `403`.
- `src/features/transactions/TransactionsPage.tsx`: recepción sin tarjetas y fijo en hoy; renta solo lo suyo.
- `src/features/transactions/AccountDrawer.tsx`: acciones **Devolver** y **Reasignar crédito** con motivo, solo dueño/admin
  [N][D]; endpoints nuevos (`POST /transactions/:id/refund`, `PATCH /transactions/:id/credit`) en el contrato y el mock.

**Gastos**
- `src/features/expenses/types.ts`, `src/mocks/expenses/{seed,handlers}.ts`, `docs/API_CONTRACT.md`: `ownerMemberId` y
  `createdBy`; filtro y `403` por sesión.
- `src/features/expenses/ExpensesPage.tsx`: acciones de la barra (`create`, `edit`, `delete`, líneas 119-121) según
  `expenses·create/edit/delete`; renta solo los suyos; comisión fuera [D].
- `src/features/expenses/ExpenseFormDrawer.tsx`: fotos del comprobante (0/3) como en producción.

**Nómina**
- `src/mocks/payroll/handlers.ts` y `docs/API_CONTRACT.md` §Nómina: `?memberId` forzado por sesión; deducciones como %
  (§5.5); fórmula del neto de renta (§5.4); impuestos (§5.7); periodo según `payrollCycle`.
- `src/features/payroll/usePayrollFilters.ts`: periodo por defecto = ciclo de Configuración.
- `src/features/payroll/payrollHome.tsx`: columnas de producción (Total comisiones, Impuestos, ventas de producto en renta).
- `src/features/payroll/PayrollPage.tsx`: fila «All» o equivalente; descarga Excel/PDF; recorte por rol en la descarga.
- `src/features/payroll/PayrollMemberDrawer.tsx`: «Ver reglas» solo con `team·barber-payments`.
- Nuevas pantallas `src/features/payroll/MyEarningsPage.tsx` («Lo que llevo») y `MyBusinessPage.tsx` («Mi negocio») [D],
  armadas con `usePayrollQuery`, `useTransactionsQuery`, `useExpensesQuery` y las consultas de métricas con `barberId`.

**Cierre**
- `src/app/i18n/es.ts`, `en.ts`: textos nuevos.
- Pruebas por rol en `metrics.test.tsx`, `transactions.test.tsx`, `expenses.test.tsx`, `payroll.test.tsx`.
- `npm run codemap` (rutas y endpoints nuevos) y la página de la doc que cuente los roles (`src/docs/pages/guides/`).
- Centro de ayuda: no se toca hasta que llegue a producción (RP §5, fase 6).
