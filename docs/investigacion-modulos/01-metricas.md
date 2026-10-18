# Métricas — investigación

Investigación del 2026-10-17 sobre `/metricas` (`src/features/metrics`, `src/features/dashboard`, `src/mocks/metrics.ts`,
`src/mocks/metricsTabs.ts`). Lo marcado **(no verificado)** no se pudo confirmar con una fuente consultada.

## Resumen ejecutivo

- El tablero está **bien construido como interfaz**: cinco pestañas por rol, estado en la URL, comparación con el periodo anterior (producción no la tiene), franja de «lo que pide una mano» y mapa de capacidad. Está por encima de la media del sector en claridad.
- **No es confiable como fuente de verdad todavía**: moneda fija en USD, la sucursal no viaja en la consulta, el simulador no comparte datos con Calendario/Transacciones/Clientes, el desglose de ingresos no suma lo que dice el total y los dos atajos a otras pantallas llevan a parámetros que esas pantallas no leen.
- La pestaña **IA no es IA**: reglas fijas con cifras aleatorias en el mock, textos en español sin traducir, confianza «alta» escrita a mano y botones de acción que no hacen nada. Es la mayor deuda de confianza del módulo.
- Faltan los KPIs que el sector considera básicos para salones (re-reserva, ratio venta de producto/servicio, ocupación sobre el horario real) y el que más pide un dueño: **utilidad** (ventas − gastos − nómina), aunque Gastos y Nómina ya existen.
- El mercado 2025-2026 se movió de «reportes» a **asistentes que responden, avisan y actúan** (Square Managerbot, Toast IQ, Shopify Sidekick, Zenoti Zeenie, Genius AI Growth Analyst). En barberías aún no hay un líder claro en español: es la ventana.
- Recomendación: **Fase 1** datos correctos y coherentes; **Fase 2** resumen narrativo, alertas y resumen semanal por WhatsApp/correo; **Fase 3** Clipper con acceso a los datos, riesgo de abandono por cliente y pronóstico.

---

## 1. Qué tiene hoy

**Mercado que asume el código.** Idioma por defecto `es` con convención `es-CO` (`src/i18n/locales.ts:22`); también `en-US` y `fr-FR`. Las sucursales de la demo están en EE. UU. con moneda USD (`src/mocks/settings/seed.ts:87-90`), pero el catálogo de monedas incluye COP y MXN (`src/features/settings/settingsTypes.ts:138`) y las cifras vistas en producción («$120,000 frente a $10,260,490», `docs/roles/02-metricas-caja-nomina.md`) tienen magnitud de pesos colombianos. Conclusión: producto en español con foco Colombia/LatAm y presencia hispana en EE. UU.; **el módulo debe ser multimoneda**, y hoy no lo es.

### Rutas y acceso

| Elemento | Dónde |
|---|---|
| `/metricas` con guarda de área `metrics` | `src/app/router.tsx:71`; `canOpen` en `src/features/access/access.ts:115` (dueño/admin por matriz `kpis·active`; cualquier barbero ve las suyas; recepción no entra) |
| `/` aterriza según rol (`RoleHome`) | `src/app/router.tsx:69` |
| `/dashboard` redirige a `/metricas` | `src/app/router.tsx:73` |
| `DashboardPage` (plantilla genérica de «procesos») | `src/features/dashboard/DashboardPage.tsx`; exportada en `src/app/lazyPages.ts:4` pero **no se monta** en ninguna ruta |
| `GET /dashboard/summary` (usuarios por área, altas por mes) | `src/features/dashboard/api.ts`, `src/mocks/handlers.ts:318`; nadie lo consume: resto del esqueleto |

### Pestañas por rol (`useMetricsFilters.ts:16`)

| Rol | Negocio | Clientes | Barberos | Marketing | IA |
|---|---|---|---|---|---|
| Dueño / admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Barbero por comisión | sus cifras | sus cifras | solo su fila | — | — |
| Barbero de renta | sus cifras | sus cifras | solo su fila | sus cifras | — |
| Recepción | sin acceso | | | | |

Con alcance `own`, el barbero queda fijo en su ficha y `?barber=` se ignora (`useMetricsFilters.ts:52`).

### Filtros y estado

- Periodo día/semana/mes con flechas y «Hoy» (`PeriodNavigator`, `MetricsFilters.tsx`); selector de barbero (oculto para barberos). Todo en la URL (`?tab`, `?period`, `?date`, `?barber`), enlace reproducible.
- La sucursal no es un filtro de la pantalla: «la pone la cabecera» (`MetricsFilters.tsx:23`).
- `keepPreviousData` al cambiar de periodo y atenuación del tablero viejo (`queries.ts`, `MetricsPage.tsx:52`); esqueleto en la primera carga; errores vía `QueryBoundary`.
- La IA no lleva filtros: diagnostica «los últimos tres meses».

### Contenido por pestaña

| Pestaña | KPIs (con variación vs. periodo anterior) | Gráficas y bloques | Archivo |
|---|---|---|---|
| Negocio | Ventas (+ sparkline), ticket promedio, citas (+ anillo de completadas), tasa de cancelación (métrica invertida) | Franja de atención (por cobrar, canceladas, no-show); serie ventas+citas; desglose de ingresos; propinas, reembolsos, descuentos; donas de estado de cita, método de pago y canal de reserva; tráfico por hora con pico; reparto mañana/tarde/noche; ventas por servicio y por producto | `sections/MetricsPulse.tsx`, `MetricsAlerts.tsx`, `SalesSection.tsx`, `AppointmentsSection.tsx`, `CatalogSection.tsx` |
| Clientes | Retención, ingreso por cliente, % reservas online, % walk-in | Dona por tipo (nuevo, retenido nuevo, recurrente, recuperado); nuevos vs. recurrentes; con/sin preferencia de barbero; frecuencia de visita | `tabs/CustomersDashboard.tsx` |
| Barberos | Neto del equipo, lealtad, ocupación media, ticket medio | Neto por barbero, servicios por barbero, tabla (neto, servicios, ocupación, cancelación, propinas) | `tabs/BarbersDashboard.tsx` |
| Marketing | % online, mejor canal, reservas por campaña | Reservas por canal, conversión por canal, campañas con ingreso | `tabs/MarketingDashboard.tsx` |
| IA | Puntaje de salud 0–100 + completadas, retención, no-show, ticket | Franja de riesgo (perdidos, en riesgo, vencidos) → `/clientes?risk=`; mapa de capacidad día×hora; sugerencias agrupadas (clientes, crecimiento, operación) con `AIInsightCard` | `tabs/InsightsDashboard.tsx` |

### Datos

Contrato con Zod en `types.ts` y `docs/API_CONTRACT.md` §Métricas. Cinco endpoints (`api.ts`): `business`, `customers`, `barbers`, `marketing` (con `granularity`, `date`, `barberId`) e `insights` (sin parámetros). Los mocks son **simulaciones deterministas propias** (`src/mocks/metrics.ts`, `metricsTabs.ts`): cinco barberos con ids `b4…b8`, seis servicios a $30–80, tres productos, citas por hora con pesos, comisión fija del 40 % y 10 cupos por silla al día.

Pruebas: 13 casos en `metrics.test.tsx` (URL, pestañas por rol, que un enlace ajeno no abra datos, cuadres del mock). E2E: solo comprueba que el login aterriza en `/metricas`.

---

## 2. Análisis del módulo

### Fortalezas

1. **Lectura antes que datos.** Cuatro cifras arriba con su variación, y la cancelación tratada como métrica invertida (`MetricsPulse.tsx:337`). Producción no compara con el periodo anterior.
2. **Del número a la acción.** La franja de atención y los riesgos de clientes son botones, no leyendas mudas (`MetricsAlerts.tsx`, `InsightsDashboard.tsx:806`). La intención es correcta (ver deuda abajo).
3. **Estado en la URL y periodo estable.** Enlaces compartibles, «atrás» funciona, sin parpadeo a esqueletos.
4. **Recorte por rol pensado**: el barbero no ve el neto de los demás (`BarbersDashboard.tsx:542`), la IA es solo del dueño, y hay pruebas que lo cubren.
5. **Sistema de diseño de verdad**: `MetricCard`, `ChartCard`, `CompositionDonut`, `HeatmapMatrix`, `AttentionStrip`; vacíos que explican qué falta (`CatalogSection.tsx:176`, `MarketingDashboard.tsx:945`).
6. **Mapa de capacidad día×hora**: el bloque más accionable para una barbería y pocos competidores lo enseñan así.

### Huecos e inconsistencias (con evidencia)

| # | Problema | Evidencia | Impacto |
|---|---|---|---|
| 1 | **Moneda fija en USD** | `metricsFormat.ts:5` (`const CURRENCY = "USD"`); igual en `calendarFormat.ts:15` | Una barbería en Colombia vería «US$» en todas las cifras. Bloqueante para LatAm. |
| 2 | **La sucursal no viaja** | `MetricsParams` no tiene `branchId` (`types.ts:157`); el cliente HTTP no añade cabecera de sucursal (`src/lib/api` sin referencias a `branch`) | Cambiar de sucursal en la cabecera no cambia las cifras. No hay «Todas las sucursales» (producción sí la tiene). |
| 3 | **Simulador aislado** | `src/mocks/metrics.ts` no lee `db` salvo para resolver barberos; Transacciones sí deriva de citas (`appointmentsOn`) | Ventas de Métricas ≠ total de Transacciones ≠ citas del Calendario para el mismo día. En una demo, el dueño lo nota. |
| 4 | **El desglose de ingresos no cuadra con «Ventas»** | `sales = gross + tips + taxes` (sin `fees`), pero la lista suma también `fees` y no resta descuentos (`metrics.ts:170-172`, `:264-271`); `SalesSection.tsx:436` pone `kpis.sales` como total de esa lista | La suma de barras no es el número de arriba. «Comisiones» (tarifa de procesamiento) puede confundirse con la comisión del barbero. |
| 5 | **El total de la dona de pagos ≠ ventas** | `payments` solo suma servicio + propina de citas completadas, sin productos (`metrics.ts:274`) | Tres «totales» distintos en la misma pantalla. |
| 6 | **Atajos rotos** | `MetricsAlerts.tsx:228` navega a `/calendario?status=&from=&to=`; el calendario lee `fecha`, `vista`, `foco`, `tipo`… (`useCalendarState.ts:31-45`). `InsightsDashboard.tsx:806` navega a `/clientes?risk=churned`; Clientes lee `tipo` y `aviso` (`CustomersPage.tsx:99-100`) y sus segmentos son `atRisk`/`lost`, no `churned`/`overdue` | La mejor idea del módulo (de la cifra a la lista) aterriza en una pantalla sin filtrar. |
| 7 | **IA simulada que se presenta como IA** | Riesgos con `rand()` (`metricsTabs.ts:258-260`); sugerencias con textos en español escritos en el mock (`:269-315`); `confidence="high"` fijo (`InsightsDashboard.tsx:847`); `actionLabel` sin `onAction` (botón que no hace nada); `AiGeneratedBadge` | Riesgo de confianza: usuarios en inglés/francés ven español; cifras de riesgo no coinciden con los segmentos de Clientes; el botón «Lanzar campaña» no lanza nada. |
| 8 | **Recorte por rol solo en el cliente** | El handler acepta cualquier `barberId` (`handlers.ts:351-362`) | El backend real debe imponer el alcance; si copia el mock, un barbero puede pedir las cifras de otro. |
| 9 | **Ocupación con constantes** | `CHAIR_SLOTS_PER_DAY = 10`, `CHAIRS = 3`, comisión 40 % (`metricsTabs.ts:99-100`, `:229`) | Ignora horarios reales (`WorkHoursPage`, `team/schedule`) y la compensación de cada barbero (Nómina). |
| 10 | **Renta mezclada en el neto del equipo** | Señalado en `docs/roles/02-metricas-caja-nomina.md` (Valeria y Tomás son de renta en el seed del equipo) | El «neto del equipo» suma producción que no es de la barbería. |
| 11 | **Retención sin definición de cohorte** | Hint: «clientes que ya habían venido antes sobre todos los atendidos» (`es.ts:365`) | El sector suele medir retención como primeras visitas que vuelven en 90 días (Mangomint usa 90/180). Nuestra cifra no es comparable. |
| 12 | **Marketing con datos que no existen** | Canales y campañas fijos en el mock (`metricsTabs.ts:153-163`); «visitas» para la conversión no tienen origen | En producción no habrá visitas sin seguimiento de la página de reserva. |
| 13 | **Sin dato de frescura** | No hay «actualizado hace…» ni en Negocio ni en IA | Boulevard lo muestra; en caja abierta es clave saber si el día está completo. |
| 14 | **Código muerto** | `features/dashboard` completo (página, consulta, esquema de usuarios) | Ruido para quien busca «el dashboard»; `CODEMAP` lo lista como home. |
| 15 | **`transactions` sin tarjeta, ventas de bonos/regalo ausentes** | `docs/roles/02-…` (filas «Transacciones», «Ventas físicas») | Paridad incompleta con producción. |

### Fricciones de UX

- **Densidad de Negocio**: ~15 bloques y tres donas seguidas. El dueño entra a diario para responder «¿cómo voy?»; hoy tiene que leer y sacar la conclusión él mismo. No hay una frase arriba que lo diga.
- **Sin metas**: la variación compara con el mes pasado, no con lo que el dueño quería vender. Un barbero por comisión pide «cuánto me falta» (Notion: estado Earned de 80 % retención y 80 % ocupación, recogido en `docs/roles/02-…`).
- **Sin rango libre ni comparación interanual**: un diciembre se compara con noviembre, no con el diciembre anterior.
- **Sin exportar**: el contable o el socio piden CSV/PDF; todos los competidores revisados exportan.
- **La lista de barberos depende de la consulta de Negocio** (`MetricsPage.tsx:156`): en otras pestañas se hace una petición extra solo para llenar el selector; debería salir del equipo.

---

## 3. Qué le falta (priorizado)

Esfuerzo: S ≤ 1 semana, M 2–4 semanas, L > 1 mes (estimación sobre el front + contrato; el backend real no está en este repo).

| Prioridad | Qué | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | Moneda de la sucursal en todos los formateadores | Bloquea venta en Colombia/México | Alto | S |
| P0 | `branchId` en el contrato + «Todas las sucursales» para dueño | Producción lo tiene; sin ello las cifras son de nadie | Alto | M |
| P0 | Un solo modelo de ventas: definición escrita de Ventas, Ingresos, Neto y que el desglose cuadre | Tres totales distintos destruyen la confianza en el tablero | Alto | S |
| P0 | Arreglar los atajos (Calendario y Clientes) con los parámetros reales | La acción es el diferencial del módulo | Alto | S |
| P0 | Quitar la apariencia de IA donde no la hay, o dar a las sugerencias acción real e i18n | Riesgo reputacional; base para la IA de verdad | Alto | S–M |
| P0 | Alcance por rol impuesto en el servidor (contrato + prueba) | Seguridad: cifras de otros barberos | Alto | S |
| P1 | **Utilidad del periodo**: ventas − gastos − nómina − tarifas, con margen | Gastos y Nómina ya existen; es la pregunta n.º 1 del dueño | Alto | M |
| P1 | KPIs de salón estándar: re-reserva (citas futuras al salir), ratio producto/servicio, ocupación sobre horario real, retención por cohorte a 90 días | Son los cinco KPIs de referencia del sector (Phorest/Salon Today) | Alto | M |
| P1 | Simulador sobre la misma `db` que Calendario y Transacciones | Coherencia entre módulos en demos y pruebas | Medio | M |
| P1 | Metas por sucursal y por barbero con «ritmo a la meta» | Convierte el tablero en guía; insumo de «Lo que llevo» | Alto | M |
| P1 | Exportar (CSV/PDF) y rango libre + interanual | Paridad con todo el mercado | Medio | S–M |
| P1 | Separar producción de sillas en renta | Neto honesto | Medio | S |
| P1 | Sello «actualizado hace…» | Confianza en el dato del día | Bajo | S |
| P2 | Comparar sucursales (tabla y ranking) | Dueños con varias sedes | Medio | M |
| P2 | LTV y valor de cliente por canal de adquisición | Decide en qué canal invertir | Medio | M |
| P2 | Marketing real: UTM/enlaces por canal, campañas conectadas a su módulo | Hoy son datos inventados | Medio | L |
| P2 | Vistas guardadas / tablero personalizable | Útil, pero Boulevard tampoco lo deja y no es lo que se pide | Bajo | M |
| P2 | Borrar `features/dashboard` y `/dashboard/summary` | Higiene | Bajo | S |

---

## 4. Benchmark

Fuentes primarias: centros de ayuda y páginas de producto (enlaces al final). Leyenda: ✓ confirmado en la fuente · — la fuente no lo menciona · ? no verificado.

| Función | Fresha | Booksy | Boulevard | Vagaro | Mangomint | Zenoti | Genius AI (GlossGenius) | AgendaPro | Square | Toast | Shopify | **Barberlytics hoy** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Panel de KPIs del periodo | ✓ | ✓ | ✓ (2 paneles) | ✓ | ? | ? | ? | ✓ | ✓ (snapshot en «Ideas») | ? | ? | ✓ |
| Comparación con periodo anterior | ? | ? | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ✓ |
| Filtro por profesional | ✓ | ✓ | ✓ | ? | ✓ | ✓ | ? | ✓ (comisiones) | ? | ? | n/a | ✓ |
| Varias sedes / «todas» | ✓ | ? | ✓ | ✓ | ? | ✓ | ? | ? | ✓ | ? | — | ✗ |
| Ocupación / horas pico | ✓ | ✓ | ? | ? | ? | ? | ? | ? | ? | — | — | ✓ (constantes) |
| Retención / re-reserva | ✓ | ✓ | ? | ? | ✓ (90/180 d) | ✓ (re-reserva) | ? | ? | ? | — | ✓ (cohortes) | parcial |
| Comisiones y propinas | ✓ | ✓ | ? | ? | ✓ | ? | ? | ✓ (con proyección) | ✓ | — | — | parcial |
| Exportar | ✓ (PDF/CSV/XLSX) | ✓ | ✓ (CSV/Excel/PDF/PNG) | ? | ? | ? | ? | ? | ✓ (CSV en el chat, según búsqueda) | ? | ? | ✗ |
| Informes personalizados | ✓ (Insights, pago) | — | ✓ (vistas guardadas) | ✓ (Tableau/Power BI) | ? | ? | ? | ? | ✓ | ? | ✓ (ShopifyQL) | ✗ |
| Pronóstico | ✓ (ventas 7 días, Marketplace) | ? | ? | ? | ✓ («future forecasts») | ? | ? | ✓ (comisiones proyectadas) | ? | ? | ? | ✗ |
| Preguntas en lenguaje natural | ? | ? | en desarrollo | ? | — | ✓ (Zeenie) | ✓ (Growth Analyst) | ? | ✓ (Managerbot) | ✓ (Toast IQ) | ✓ (Sidekick) | ✗ (el chat existe, sin datos) |
| Ideas proactivas | ? | ? | ? | ? | — | ✓ | ✓ | ? («reportes con IA», sin detalle) | ✓ («Ideas») | ✓ («For you») | ? | parcial (reglas) |
| Comparación con negocios parecidos | ? | ? | ? | ? | — | ? | ✓ | ? | ? | ? | retirada en 2026 (fuente no oficial) | ✗ |
| Ejecutar acciones desde el insight | ? | ? | ? | ? | — | ? | ✓ (agentes) | ? | ✓ | ✓ | ? | ✗ |

### Hallazgos

1. **Lo estándar ya es amplio.** Booksy anuncia más de 50 informes con filtros por fecha, profesional y métrica, horas pico y comisiones/propinas por barbero; Fresha 44 informes gratis y un panel con resumen de negocio, equipo (ocupación, mejores profesionales) y clientes (nuevos vs. recurrentes y de dónde vienen). Nuestro tablero cubre la mayoría de esas lecturas, pero no exporta ni filtra por sede.
2. **Los paneles no se personalizan; los informes sí.** Boulevard lo dice explícitamente: sus dos paneles solo se filtran (fecha, sede, profesional) y cada widget abre el informe de origen. Es un buen modelo para nosotros: tablero fijo y opinado + «ver detalle».
3. **Lo premium es el pronóstico y el valor del cliente.** Fresha enseña LTV y ventas previstas a 7 días (en su resumen de Marketplace) y vende «Insights» como complemento de pago; Mangomint pone «future forecasts» y pre-reservas en su inteligencia de negocio.
4. **La IA conversacional ya es estándar fuera del sector y entra en él.** Square (Managerbot: ventas, personal, clientes, inventario, con «Ideas» proactivas y acciones reversibles), Toast IQ (oct. 2025: preguntas, feed «For you» y cambios de menú/turnos desde el chat), Shopify (oct. 2025: preguntas → informes en ShopifyQL), Stripe Sigma (preguntas → SQL, consultas programadas por correo o webhook). En belleza: Zenoti Zeenie (2024: cobros por método de pago, re-reserva por profesional, comparar sedes) y Genius AI, que tiene en producción desde enero de 2026 un «Growth Analyst» que compara con negocios parecidos de la zona.
5. **LatAm.** AgendaPro, el referente regional, vende comisiones con proyección según la agenda, control de caja y «reportes de ventas con IA» (sin detalle público verificable). Ningún actor revisado ofrece en español un analista conversacional para barberías con datos propios: **hueco aprovechable**.
6. **Patrón técnico que vale copiar** (Tableau Pulse): primero modelos estadísticos deterministas producen «hechos» (cambio vs. periodo, valores inesperados, principales impulsores/detractores, concentración, ritmo a la meta, pronóstico), y el LLM solo redacta sobre esos hechos, respetando los permisos de quien pregunta. Así se evita que la IA invente cifras.

---

## 5. Mercado y tendencias

**Tendencias 2025-2026 (con fuente):**

- **Del informe al asistente.** Toast lanzó ToastIQ (mayo 2025) y su asistente conversacional (octubre 2025); Shopify abrió los informes a preguntas en lenguaje natural (octubre 2025); Square tiene Managerbot en POS y Dashboard; Square AI salió como beta abierta en mayo de 2025 (según su propio blog, visto en búsqueda).
- **De la respuesta a la acción.** Toast edita menús y turnos desde el chat; Managerbot «puede empezar tareas desde los insights» y deshacerlas; Genius AI combina analista, recepcionista y «marketer» que reactiva clientes.
- **Feeds proactivos y resúmenes programados**: «For you» de Toast, «Ideas» de Square, resúmenes de Tableau Pulse por Slack y correo, consultas programadas de Stripe.
- **Comparación con pares** como valor de red (Genius AI); a la vez, Shopify habría retirado sus benchmarks en mayo de 2026 (solo fuentes de terceros): el valor existe, pero exige volumen y cuidado con la privacidad.
- **Los KPIs del salón se consolidan** alrededor de retención, re-reserva, gasto medio por cliente, ratio producto/servicio y ocupación (guía patrocinada por Phorest en Salon Today).

**Particularidades LatAm / Colombia** (mezcla de verificado y no verificado):

- Uso digital alto: 77,3 % de la población colombiana usa internet y hay 36,8 millones de identidades en redes sociales (DataReportal, enero 2025). La cuota de WhatsApp no aparece en esa fuente **(no verificado)**, aunque la propia investigación de reservas del repo (`docs/BOOKING_RESEARCH.md`) ya trata WhatsApp como canal principal de recordatorios.
- **Efectivo y pagos locales** (Nequi, Daviplata, PSE, Bre-B) pesan más que en EE. UU. **(no verificado en esta sesión)**: el desglose por método de pago debe aceptar métodos configurables, no un enum cerrado de cuatro (`types.ts:22`).
- **Barbero de renta / silla alquilada** es común en la región y en barberías hispanas de EE. UU.; separar su producción del neto de la casa no es un detalle (ya señalado en `docs/roles`).
- **Factura electrónica DIAN y cierre de caja** son preocupaciones diarias del dueño colombiano **(no verificado)**: el tablero debería conectar con Caja/Transacciones, no duplicarlas.
- El dueño mira el negocio **desde el celular** y entre cortes: el resumen corto y el aviso por WhatsApp valen más que un tablero de escritorio.

---

## 6. IA

### Casos de uso en el dominio

Tipo: **Pred** predictiva · **Gen** generativa · **Conv** conversacional · **Ag** agéntica. «¿Datos?»: ✓ los tenemos en el modelo actual · ◐ en parte · ✗ no.

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos que necesita · ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | Resumen narrativo del periodo | 3–4 frases: qué cambió, por qué y qué hacer | Tableau Pulse (hechos deterministas + LLM) | «Vendiste 8 % menos que en septiembre: el sábado cayó 22 % porque Tomás faltó dos sábados. Reprograma…» | KPIs comparados, desglose por día/barbero/servicio · ✓ | Gen | M | Inventar causas; mitigar: solo redacta sobre hechos calculados y cita la cifra |
| 2 | Detección de anomalías y alertas | Avisa cuando una métrica sale de su rango esperado | Tableau Pulse («Unexpected values», «Trend change») | Cancelaciones de un barbero al doble de su media; un martes sin citas; ticket que cae | Serie diaria por barbero/servicio · ◐ (simulada) | Pred | M | Fatiga de alertas; umbrales con estacionalidad semanal |
| 3 | Preguntas en lenguaje natural | Responde con cifra, gráfica y tabla | Square Managerbot, Toast IQ, Shopify Sidekick, Zenoti Zeenie, Stripe Sigma | «¿Quién vendió más barbas este mes?», «¿cuánto me dejó el Instagram?» | Capa semántica sobre los endpoints · ✓ (chat `src/lib/chat` + `server/feedback/analysis.ts` ya llama a Claude) | Conv | M–L | Respuestas erróneas; usar herramientas sobre endpoints con permisos, no SQL libre; mostrar la consulta |
| 4 | Feed proactivo de ideas | Tarjetas priorizadas con acción | Square «Ideas», Toast «For you» | Sustituye a las sugerencias de reglas actuales | Igual que 1–2 · ◐ | Gen + Pred | M | Ideas genéricas; medir clic y resultado |
| 5 | Riesgo de abandono por cliente | Probabilidad de que no vuelva, según su ritmo | Phorest (texto cuando el cliente suele re-reservar, según GetApp); Zenoti (prospectos de membresía) | «23 habituales pasaron su ritmo; 8 son de Andrés» → lista y mensaje | Historial de visitas por cliente · ◐ (Clientes tiene segmentos; Métricas no los usa) | Pred | M | Contacto excesivo; consentimiento (Ley 1581) |
| 6 | Pronóstico de ingresos y ocupación | Ventas/ocupación esperadas de las próximas semanas con banda | Fresha (ventas 7 días), Mangomint, Tableau Pulse (Forecast, Pace to goal) | «Esta semana vas al 72 % de la meta; el jueves tiene 14 huecos» | Citas futuras + histórico + horario real · ◐ | Pred | M | Falsa precisión; mostrar rango |
| 7 | Impulsores y detractores | Explica qué dimensión movió la métrica | Tableau Pulse («Top drivers/detractors», «Concentrated contribution») | «El 60 % del alza viene de Corte + barba»; «dos barberos hacen el 55 % del neto» | Ventas por servicio/barbero/canal · ✓ | Pred (estadística) | S | Poco; es cálculo |
| 8 | Recomendación de huecos y precios | Propone promociones o precio por franja | ToastIQ (upsells de menú) — análogo; en barberías **(no verificado)** | «Martes 10–12 al 30 %: promo de barba» | Mapa de capacidad · ✓ | Pred + Gen | M | Canibalizar precio |
| 9 | Agente que ejecuta | Crea la campaña, el recordatorio o el cambio de turno con aprobación | Toast IQ, Square Managerbot, Genius AI | «Envía el recordatorio a los 23» → WhatsApp con plantilla aprobada | Canal de mensajes, plantillas · ✗ | Ag | L | Acciones irreversibles; siempre confirmar y registrar |
| 10 | Comparación con barberías parecidas | Percentil frente a pares por ciudad/tamaño | Genius AI Growth Analyst; Shopify Benchmarks (retirado) | «Tu re-reserva está en el percentil 30 de Bogotá» | Datos agregados de muchos clientes · ✗ | Pred | L | Privacidad, volumen mínimo por cohorte |
| 11 | Resumen semanal por WhatsApp/correo | Lo de 1+2 enviado el lunes | Tableau Pulse (digest Slack/correo), Stripe (consultas programadas) | Dueño y barberos (cada uno lo suyo) | ✓ + canal de envío | Gen | S–M | Spam; opt-in |
| 12 | Coaching por barbero | Resumen individual con brecha a su meta | Zeenie (re-reserva por profesional); Notion del producto (coaching semanal del admin) | «Te faltan 6 pp de retención para Earned» | Métricas por barbero + metas · ◐ | Gen | M | Tono; no exponer cifras de otros |

### Las 5 apuestas recomendadas

1. **«Cómo te fue», el resumen narrativo con hechos verificables** (casos 1 + 7). Arriba de Negocio y en la IA. Arquitectura Pulse: un módulo determinista calcula cambio vs. periodo, impulsores, concentración y anomalías; Claude (ya integrado en `server/feedback/analysis.ts`) solo redacta, y cada frase enlaza a su bloque. Barato, alto impacto diario, y sienta la capa de «hechos» que usan las demás apuestas.
2. **Alertas proactivas + resumen semanal por WhatsApp/correo** (casos 2 + 11). Umbrales con estacionalidad semanal por sucursal y barbero; un resumen el lunes, opt-in, recortado por rol. Responde a cómo trabaja el dueño en LatAm: en el celular, entre cortes.
3. **Riesgo de abandono por cliente con acción** (caso 5, y luego 9). Unifica los riesgos de IA con los segmentos de Clientes (hoy son dos verdades), calcula el ritmo de cada cliente y ofrece «enviar recordatorio con su barbero» con aprobación. Mide resultado (clientes recuperados, ingreso recuperado), que es lo que Genius AI ya enseña como «revenue recovered».
4. **Pregúntale a Clipper sobre tus números** (caso 3). El chat y la voz ya existen; falta darle herramientas tipadas sobre los cinco endpoints (más utilidad y metas), con el alcance del rol aplicado en el servidor y la consulta visible. Empezar con 15–20 preguntas frecuentes evaluadas antes de abrirlo.
5. **Ritmo a la meta y pronóstico de la semana** (caso 6 + metas). Con citas ya agendadas + histórico + horario real: «vas al 72 %, te faltan X; estos huecos lo cierran». Alimenta «Lo que llevo» del barbero y el mapa de capacidad.

Fuera del top 5 por ahora: comparación con pares (necesita volumen de clientes y política de privacidad) y agentes que ejecutan sin aprobación.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Datos en los que se puede confiar (4–6 semanas)

- Moneda de la sucursal en `metricsFormat.ts` (y `calendarFormat.ts`); métodos de pago configurables.
- `branchId` en el contrato, «Todas las sucursales» para el dueño, alcance por rol en el servidor con prueba.
- Glosario de cifras (Ventas, Ingresos, Neto, Utilidad, Retención a 90 días, Ocupación) escrito en `docs/API_CONTRACT.md` y en la ayuda; que el desglose cuadre.
- Simulador sobre la misma `db` que Calendario/Transacciones/Clientes; ocupación sobre el horario real; renta separada.
- Atajos arreglados (`/calendario?fecha&tipo…`, `/clientes?tipo=atRisk|lost`).
- IA honesta: sugerencias traducidas, sin confianza fija, con acción real o sin botón; riesgos leídos de los segmentos de Clientes.
- Utilidad del periodo (con Gastos y Nómina), re-reserva, ratio producto/servicio, tarjeta de transacciones.
- Exportar CSV, sello «actualizado hace…», borrar `features/dashboard`.

**Hecho cuando**: el total de Ventas de un día coincide con Transacciones y con el Calendario; un dueño en COP ve pesos; un barbero no puede leer cifras ajenas ni con la API.

### Fase 2 — Proactivo (6–8 semanas)

- Capa de «hechos» determinista (cambio, impulsores, concentración, anomalías, ritmo a la meta).
- Resumen narrativo «Cómo te fue» en Negocio y por barbero.
- Metas por sucursal y barbero; «Lo que llevo» con brecha.
- Alertas con umbral estacional y centro de notificaciones; resumen semanal por correo y WhatsApp (opt-in).
- Comparación entre sucursales; rango libre e interanual.

**Hecho cuando**: el dueño entiende su semana sin abrir un gráfico, y se mide la tasa de apertura del resumen y los clics en alertas.

### Fase 3 — Conversacional y agéntico (8–12 semanas)

- Clipper con herramientas sobre las métricas, permisos por rol y consulta visible; conjunto de evaluación con preguntas reales.
- Riesgo de abandono por cliente con acción aprobada (recordatorio por WhatsApp) y medición de ingreso recuperado.
- Pronóstico de ingresos/ocupación y huecos sugeridos conectados al Calendario (que ya tiene «huecos sugeridos»).
- Explorar comparación con pares cuando haya volumen y política de datos.

**Hecho cuando**: ≥ 90 % de acierto en el conjunto de preguntas evaluado, y cada acción del agente queda registrada y se puede deshacer.

---

## Fuentes

Consultadas en esta sesión (página abierta o resultado de búsqueda con contenido citado). La búsqueda web se agotó a mitad de la investigación: **Amplitude, ThoughtSpot, Lightspeed, Mindbody, Square Appointments (informes), Timely, Treatwell y SimplyBook no se verificaron** y no se afirman en la tabla.

- Fresha — Performance insights: https://www.fresha.com/help-center/knowledge-base/reports/100652-access-your-performance-insights
- Fresha — Reporting and analytics overview: https://www.fresha.com/help-center/knowledge-base/reports/614-reporting-and-analytics-overview
- Booksy — Stats and reports: https://biz.booksy.com/en-us/features/stats-and-reports
- Boulevard — Getting started with reporting: https://intercom.help/joinboulevard/en/articles/15608565-getting-started-with-boulevard-reporting
- Boulevard — Salon reports (blog, vista en búsqueda): https://www.joinblvd.com/blog/salon-reports
- Vagaro — Business Performance (Tableau Exchange): https://exchange.tableau.com/products/991
- Mangomint — Reporting: https://www.mangomint.com/features/reporting.md
- Zenoti — Top 10 uses for Zeenie: https://www.zenoti.com/blog/zeenie-salon-and-spa-ai-assistant-top-10-uses
- Zenoti — Comunicado de junio 2024 (vista en búsqueda): https://www.zenoti.com/press/zenoti-unveils-groundbreaking-ai-features-to-transform-salons-spas-med-spas-and-gyms
- Genius AI (GlossGenius) en Mastra: https://mastra.ai/customers/genius-ai
- Genius AI — Serie D y cambio de nombre (vista en búsqueda): https://fortune.com/press-releases/genius-ai-glossgenius-series-d-valuation-2026-07-21/
- AgendaPro — Reportes de gestión: https://agendapro.com/ar/reportes-de-gestion
- AgendaPro — Página de Ecuador (vista en búsqueda, «reportes de ventas con IA»): https://agendapro.com/ec
- Square — Managerbot / insights (centro de ayuda): https://squareup.com/help/us/en/article/8516-use-ask-ai-to-get-insights-about-your-business
- Square — Building Square AI (blog, vista en búsqueda): https://squareup.com/gb/en/the-bottom-line/inside-square/building-square-ai
- Toast IQ asistente conversacional (oct. 2025): https://restauranttechnologynews.com/2025/10/toast-launches-conversational-ai-assistant-to-help-restaurant-operators-work-faster-and-smarter/
- ToastIQ (mayo 2025, vista en búsqueda): https://www.businesswire.com/news/home/20250501039656/en/toast-launches-toastiq-to-superpower-the-future-of-restaurants
- Shopify — Changelog, preguntas en lenguaje natural (oct. 2025): https://changelog.shopify.com/posts/turn-business-questions-into-analytics-reports-with-natural-language-queries
- Shopify — Benchmarks (blog, vista en búsqueda): https://www.shopify.com/blog/benchmarks
- Retirada de Benchmarks (tercero, vista en búsqueda): https://powercommerce.com/blogs/shopify-updates/shopify-removes-benchmark-comparison-from-analytics-what-merchants-should-do-before-may-19-2026
- Tableau Pulse — Insight types: https://help.tableau.com/current/online/en-us/pulse_insights_platform_insight_types.htm
- Tableau Pulse — TechTarget (vista en búsqueda): https://www.techtarget.com/searchBusinessAnalytics/news/366571065/Tableau-launches-Pulse-a-GenAI-fueled-insight-generator
- Stripe Sigma — Write queries: https://docs.stripe.com/stripe-data/write-queries
- Salon Today / Phorest — 5 KPIs: https://www.salontoday.com/whitepapers/5-essential-hair-beauty-industry-kpis-and-how-to-master-them
- Phorest en GetApp (vista en búsqueda): https://www.getapp.com.au/reviews/101061/phorest-salon-software
- Squire en GetApp (vista en búsqueda): https://www.getapp.com/barbershop-software/a/squire
- DataReportal — Digital 2025 Colombia: https://datareportal.com/reports/digital-2025-colombia

Fuentes internas: `docs/roles/02-metricas-caja-nomina.md`, `docs/API_CONTRACT.md` §Métricas, `docs/BOOKING_RESEARCH.md`, `ai-tools/CODEMAP.md`, notas `project-app-barberia`, `project-roles-plataforma`, `project-chat-ia`, `project-modulo-transacciones`.
