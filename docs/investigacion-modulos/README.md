# Investigación por módulo — resumen transversal

2026-10-17 (11–14 el 2026-10-18 y 15–17 el 2026-10-19). Diecisiete investigaciones, una por módulo o tema. Cada una cubre cuatro análisis: qué tiene el módulo
hoy, qué le falta, cómo está frente a la competencia y el mercado, y qué IA de **cualquier industria** se aplica ahí.
Este archivo cruza las diez: lo que se repite, lo que hay que decidir antes y en qué orden atacarlo.

| # | Módulo | Informe | En una línea |
|---|---|---|---|
| 01 | Métricas | [01-metricas.md](01-metricas.md) | Buena interfaz, cifras no confiables; la pestaña «IA» son reglas con números al azar |
| 02 | Calendario | [02-calendario.md](02-calendario.md) | 70 % de la propuesta del 10-01 hecho; no sabe si el cliente confirmó ni programa recordatorios |
| 03 | Clientes | [03-clientes.md](03-clientes.md) | Buen directorio, pero la ficha no ve membresía/paquetes/reseñas y no se le puede escribir al cliente |
| 04 | Servicios y Productos | [04-servicios-productos.md](04-servicios-productos.md) | Catálogo único y bien conectado; sin precio por sede, impuestos partidos y sin existencias |
| 05 | Transacciones | [05-transacciones.md](05-transacciones.md) | Consulta bien hecha sin libro de pagos: una reserva pagada en línea se puede volver a cobrar |
| 06 | Gastos | [06-gastos.md](06-gastos.md) | Libreta correcta; la gran oportunidad es el estado de resultados, que nadie del sector tiene |
| 07 | Nómina y Mi pago | [07-nomina.md](07-nomina.md) | Reporte calculado al vuelo, sin cierre ni aprobación; cuatro errores de cálculo |
| 08 | Equipo | [08-equipo.md](08-equipo.md) | La ficha más completa del producto; la portada `/usuarios` es de datos fijos |
| 09 | Configuración | [09-configuracion.md](09-configuracion.md) | 20 ajustes bien hechos que en buena parte no llegan al resto del sistema |
| 10 | Reserva en línea | [10-reserva-en-linea.md](10-reserva-en-linea.md) | Casi todo lo de BOOKING_RESEARCH hecho; falta el mundo real (pagos, WhatsApp, zona horaria) |
| 11 | Agente IA (Clipper) | [11-agente-ia.md](11-agente-ia.md) | Buena interfaz sin modelo detrás; respondía con un guion de otro producto y prometía lo que no hace |
| 12 | Acceso y puesta en marcha | [12-acceso-y-puesta-en-marcha.md](12-acceso-y-puesta-en-marcha.md) | Toda la autorización vivía en la interfaz; sin puesta en marcha ni importación |
| 13 | Avisos y ayuda | [13-avisos-y-ayuda.md](13-avisos-y-ayuda.md) | La campana y Novedades eran de demo; el sistema sabía lo que pasaba y no avisaba a nadie |
| 14 | Experiencia del barbero | [14-experiencia-del-barbero.md](14-experiencia-del-barbero.md) | Dos «netos» distintos, sin estado del pago y la caja descuadraba con la renta |
| 15 | Marketing y fidelización | [15-marketing-y-fidelizacion.md](15-marketing-y-fidelizacion.md) | La reactivación por ritmo es mejor que la de la competencia; Métricas › Marketing reparte cifras al azar y la reserva mezcla reseñas de ejemplo |
| 16 | Front Desk (recepción y kiosco) | [16-front-desk.md](16-front-desk.md) | Producción tiene kiosco; Thema solo el enlace: no sabe su sede, la llegada no avisa a nadie y no hay cola de walk-ins |
| 17 | Paso a producción y legal | [17-paso-a-produccion-y-legal.md](17-paso-a-produccion-y-legal.md) | Backend real multi-barbería, tarjeta solo en los campos de la pasarela, endpoints pagos con sesión y contratos (DPA, políticas) |

---

## 0. Antes de priorizar: ¿qué país?

Los diez agentes chocaron con lo mismo y ninguno pudo resolverlo desde el código:

- **Señales de Colombia/LatAm**: interfaz `es-CO`, celulares `+57` en cuentas y clientes, login con `3001234567`,
  COP y MXN en el catálogo de monedas, voz de Clipper en es-CO, cifras de producción con tamaño de pesos.
- **Señales de EE. UU.**: las cuatro sucursales de demo (Massachusetts, North Carolina, Rhode Island, Utah) con
  dirección de EE. UU., «LLC» y EIN, zona `America/New_York`, festivos de EE. UU., *sales tax* estatal del 6,25 %,
  Stripe como única pasarela (no opera para empresas colombianas), datáfonos con TPN, y el comentario de
  `src/features/branches/branches.ts` que dice que esos nombres son los que se verán en producción.

La lectura más probable es **barberías hispanohablantes en EE. UU. y en LatAm**. Pero casi la mitad de la hoja de
ruta cambia según la respuesta:

| Tema | Si es EE. UU. | Si es Colombia |
|---|---|---|
| Pagos | Stripe / Square Terminal | Wompi, Bold, Mercado Pago, PSE, Nequi, **Bre-B** |
| Factura | No aplica | Factura electrónica y POS electrónico DIAN (integrar Alegra/Siigo, no construir) |
| Nómina | Exportar a Gusto/Square; ley «No Tax on Tips» exige propina por barbero | Exportar novedades a Alegra/Siigo/Aleluya/Buk; Ley 2466 (recargo dominical, clasificación de estilistas) |
| Gastos | 1099, *sales tax* | Documento soporte DIAN (Res. 000167/2021) |
| Clientes | TCPA («Responde STOP») | Ley 1581 + Decreto 1377 (datos sensibles: alergias), Ley 2300 (horarios de contacto) |
| Festivos | Federales | Ley Emiliani |

**Recomendación**: sea cual sea la respuesta, el P0 técnico es el mismo: **moneda, impuestos, festivos, zona
horaria y pasarela por sucursal**, no fijos en código. Eso permite servir a los dos mercados.

---

## 1. Errores encontrados

Comprobados en el código al cerrar la investigación (✔) o reportados por el agente con archivo y línea.

| Gravedad | Módulo | Error | Dónde |
|---|---|---|---|
| Alta ✔ | Transacciones / Reserva | La reserva pagada en línea crea la cita con `payment: null`: sale «Por cobrar» por el total y se puede **cobrar dos veces**. Anticipos, cupones, regalos y paquetes no llegan a la caja | `src/mocks/booking/handlers.ts` (~l. 508) |
| Alta ✔ | Todos | El dinero se formatea siempre en **USD**, ignora la moneda de la sucursal | `src/features/calendar/calendarFormat.ts:15`, `src/features/metrics/metricsFormat.ts:5`, `TeamHomePage.tsx:128` |
| Alta ✔ | Catálogo / Reserva | Cada artículo guarda su `taxRate`, pero la reserva cobra todo con el **primer grupo de impuestos** | `src/mocks/booking/logic.ts:48` |
| Alta | Nómina | La escala toma el tramo según el **rango que se mira** (día/semana/mes), no según el ciclo de pago | `src/mocks/payroll/handlers.ts` (`rateOf`) |
| Alta | Nómina | Deducciones de renta pedidas en **%** y restadas como **dinero** por cita | `PaymentsForm.tsx` + `payroll/handlers.ts` |
| Media | Nómina | Comisión sobre precio de catálogo, no sobre lo cobrado ni el precio del barbero | `payroll/handlers.ts` (`priceOf`) |
| Media | Nómina / Configuración | Configuración › Comisiones y el ciclo de nómina **no se aplican** | `usePayrollFilters` siempre abre en semana |
| Media ✔ | Transacciones | Las devoluciones son **sintéticas** (1 de cada 45 por hash); las reales salen como «Anulada» | `src/mocks/transactions/handlers.ts:22` |
| Media | Transacciones | El cobro en caja guarda impuesto 0; el pago mixto no dice cuánto fue en efectivo y cuánto con tarjeta | `src/mocks/calendar/handlers.ts` (~l. 401) |
| Media ✔ | Métricas | Los atajos a otras pantallas llevan parámetros que esas pantallas **no leen** (`status/from/to`, `risk=churned`) | `src/features/metrics/sections/MetricsAlerts.tsx:38` |
| Media | Métricas | Tres totales distintos en Negocio (el desglose suma comisiones y no resta descuentos) | `src/mocks/metrics.ts` |
| Media | Gastos | «Lo que cuesta este mes» se presenta como punto de equilibrio y no incluye nómina, comisiones ni costo de producto | `src/features/expenses` |
| Media | Calendario | Crear, mover o anular desde recepción **no programa recordatorios** ni avisa a la lista de espera (la reserva sí) | `src/mocks/calendar/handlers.ts` |
| Media | Configuración | El selector de sucursal de la cabecera usa una lista fija: una sucursal creada no aparece | `src/features/branches/branches.ts` |
| Media | Reserva | `phone/check` devuelve nombre, última visita y barbero aunque el contrato dice que no revela si es cliente | `src/mocks/booking/handlers.ts` |
| Baja | Equipo | La portada de `/usuarios` es de datos fijos; varios botones no hacen nada | `src/features/team/teamHome.tsx` |
| Baja | Varios | Archivos por encima de 800 líneas: `CalendarPage.tsx` (1.057), `useChatBooking.ts` (1.017), `booking/handlers.ts` (805) | — |

---

## 2. Lo que se repite en todos los módulos

1. **Módulos bien hechos, desconectados entre sí.** Casi todos los informes llegan a la misma conclusión por caminos
   distintos: la pantalla está bien, el cable no. Configuración no llega a Catálogo, Nómina ni a la cabecera; la
   reserva no llega a Transacciones ni a la ficha del cliente; el simulador de Métricas no comparte datos con nadie.
   **Una misma fuente de datos para todos es la mejora con más retorno de todo el producto.**
2. **No hay registros que se cierren.** No hay libro de pagos (Transacciones), ni periodo aprobado (Nómina), ni gasto
   con fecha propia (Gastos). Todo se calcula al vuelo, así que cambiar una regla reescribe el pasado.
3. **WhatsApp está a medias.** Los recordatorios se programan en un `outbox` que nadie envía; Clientes no puede
   escribirle a nadie; Calendario no sabe si el cliente confirmó. Es el canal del cliente hispano y aparece en 7 de 10 informes.
4. **«IA» que son reglas.** La pestaña IA de Métricas y seis lugares del Calendario llevan `AiGeneratedBadge` sobre
   reglas fijas. Hay que quitar la etiqueta donde no hay modelo o poner el modelo. Prometer IA y no darla quita confianza.
5. **El dueño no puede ver la utilidad.** Ingresos, gastos, nómina y costo de producto existen en cuatro módulos, pero
   nadie los suma. El estado de resultados con punto de equilibrio aparece como oportunidad en Métricas, Gastos y
   Catálogo, y ningún competidor de agenda revisado lo ofrece.

---

## 3. IA: lo que se aprende de otras industrias

Los informes trajeron IA de clínicas, restaurantes, retail, fintech, RR. HH. y servicios de campo. Agrupando las
50 apuestas (top 5 × 10 módulos), salen **seis capacidades de plataforma**. Construir cada una una sola vez
alimenta a varios módulos:

| Capacidad | Referentes de fuera del sector | Módulos que alimenta | ¿Tenemos los datos? |
|---|---|---|---|
| **A. Ritmo del cliente**: próxima visita, abandono e inasistencia | Marshfield Clinic (AUC 0,83 en no-show), Klaviyo, Zenoti, Booksy (cobro por riesgo) | Clientes, Calendario, Reserva, Métricas | Sí: `visitEveryDays`, `lastVisitAt`, `visitSuggestion()`, historial de no-show |
| **B. Hechos → narración**: se calcula con estadística y el LLM solo redacta | Tableau Pulse, Shopify Sidekick, Square Managerbot, Toast IQ | Métricas (resumen «Cómo te fue»), Equipo (coaching semanal), Nómina (explica «por qué me pagaron esto»), Gastos (CFO) | Sí, una vez arreglados los totales. Claude ya está conectado en `server/feedback/analysis.ts` |
| **C. Clipper como agente con herramientas**: con el alcance del rol aplicado en el servidor | Shopify Sidekick, Zenoti Zeenie, Gusto Gus, Intuit Assist | Reserva, Configuración (configurar por conversación), Métricas/Transacciones (preguntas sobre los datos) | Parcial: Clipper ya despacha las mismas acciones que las pantallas; falta el modelo detrás de `interpret` |
| **D. Agente de WhatsApp**: un asistente del negocio, no un chatbot genérico | Agentes de clínicas y restaurantes, Fresha AI receptionist (99,95 USD/local/mes), Podium | Reserva, Calendario (confirmaciones, huecos liberados), Clientes (reactivación), Gastos (captura de recibos) | Falta el envío real. Meta lo permite desde el 15-ene-2026 si es del negocio y hay salida a una persona |
| **E. Revisión antes de cerrar**: anomalías antes de pagar o de cerrar caja | Gusto, Rippling, Aleluya Pulso, Stripe Radar, Ramp | Nómina, Transacciones (cierre que detecta descuadres), Gastos (duplicados y atípicos) | Requiere primero los registros cerrados del punto 2.2 |
| **F. Margen y demanda**: margen por hora de silla, menu engineering, precio por franja, turnos según demanda | Restaurantes (menu engineering), aerolíneas, Fresha Smart pricing, 7shifts, Deputy | Catálogo, Calendario, Equipo, Configuración (`surge` ya existe y nadie lo aplica) | Sí: precio, costo, duración, preparación y comisión |

**Diferenciales que ningún competidor revisado documenta** (según los informes; varias celdas quedaron «?»):
reacomodo de la agenda por retraso, resumen del día, agente que cubre las ausencias de un barbero, simulador de
esquemas de comisión, auditoría de configuración con cifras propias («tu política de cancelación te cuesta X»),
estado de resultados con punto de equilibrio en cortes por día, y pronóstico de caja a partir de la agenda futura.

**Tendencia que cambia la reserva**: los agentes de terceros ya reservan en nombre del cliente. Google AI Mode busca
disponibilidad en Booksy; ChatGPT abre apps sobre MCP y cobra con ACP. Ser «reservable por agentes» (schema.org,
`llms.txt`, redirección de Google y, después, un servidor MCP público) es barato y ningún competidor latino lo tiene.

**Reglas comunes que proponen todos los informes**: el cálculo sigue siendo determinista y la IA solo explica,
propone o redacta. Lo que mueve dinero o escribe a un cliente lo aprueba el dueño. Se guarda desde ya el historial
por cita para entrenar modelos después. Se dejan para más adelante las ideas con riesgo alto: predicción de
rotación de personal, prueba virtual de cortes (datos biométricos) y precios dinámicos automáticos.

---

## 4. Hoja de ruta global

**Fase 0 — decidir** (una conversación): el país o los países, y si el mock pasa a ser una sola fuente de datos.

**Fase 1 — que los números cuadren** (P0, sin IA):
- Moneda, impuestos, festivos, zona horaria y pasarela por sucursal; sucursales reales en la cabecera.
- Libro de pagos: la reserva llega a la caja (anticipos, cupones, regalos), pagos divididos, devoluciones reales, exportar.
- Nómina con periodos (borrador → aprobado → pagado), foto fija al aprobar y ajustes manuales; corregir los cuatro errores de cálculo.
- Configuración que llega a los módulos (comisiones, ciclo, impuestos, avisos).
- Métricas sobre los mismos datos que el resto; arreglar los atajos y los totales; quitar «IA» donde no hay modelo.

**Fase 2 — operación conectada**:
- WhatsApp real: enviar el `outbox`, estado «confirmada» en la agenda, `wa.me` con el mensaje ya escrito desde Clientes.
- Ficha 360 del cliente (membresía, paquetes, regalos, reseñas, consentimiento visible y revocable).
- Estado de resultados con punto de equilibrio; gastos con categoría, fecha, comprobante y proveedor.
- Inventario ligero (existencias por sede, descuento al vender, alerta, ocultar agotados en línea).
- Equipo: ausencias con aprobación, fila de walk-ins en vivo, pestaña Rendimiento, portada con datos reales.
- Puesta en marcha guiada e importación por CSV.

**Fase 3 — IA** (en este orden, porque cada una reutiliza la anterior):
1. **A. Ritmo del cliente**: próxima visita + reactivación aprobada + riesgo de inasistencia en la tarjeta.
2. **B. Hechos → narración**: «Cómo te fue» semanal por WhatsApp/correo y explicación de la nómina al barbero.
3. **F. Margen por hora de silla** y menu engineering.
4. **E. Revisión antes de cerrar** (nómina y caja).
5. **D + C. Clipper en WhatsApp** con modelo detrás de `interpret`, empezando por las respuestas a los recordatorios.
6. Reservable por agentes externos (schema.org → MCP).

---

## 5. Lo que cruzan los informes 15–17 (2026-10-19)

Tres temas sin informe hasta ahora. Lo que se repite entre ellos y con los anteriores:

1. **Lo que cuesta dinero o toca a terceros tiene que vivir en el servidor, con sesión.** `/api/whatsapp/send`,
   `/api/clipper`, `/api/tts` y `/api/narrative` solo miran `Origin`/`Referer` (`server/http/request.ts`), que un
   script falsifica: con las claves puestas se podrían mandar plantillas (también la de marketing) a cualquier
   número o gastar Claude y voz. La cola de WhatsApp corre en el navegador. Es el mismo hallazgo de 13 y 15, y P0 en 17.
2. **La tarjeta no debe pasar por Barberlytics.** La reserva, los paquetes y las tarjetas de regalo mandan número y
   vencimiento al backend propio, y la versión Conversación pide el número y el CVC como mensajes de chat (17). En
   producción, la tarjeta se escribe solo en los campos de la pasarela (Stripe Elements, Wompi, Bold): así PCI queda
   en SAQ A. En el mock es una simulación; la regla es para el backend real.
3. **Datos honestos.** Métricas › Marketing reparte al azar canales y campañas aunque la reserva guarda la UTM real de
   cada cita (15); la reserva pública mezcla reseñas de ejemplo con las reales. **Las reseñas y campañas de ejemplo
   son de la demo y no viajan a producción** (la FTC prohíbe reseñas falsas y Google premios por reseñas).
4. **Horario legal y baja de verdad.** Los mensajes de promoción respetan la franja de cada país (Ley 2300 en
   Colombia, TCPA y leyes estatales en EE. UU.), un tope por cliente y la baja con STOP/BAJA leída por webhook (15, 17).
5. **El kiosco es un dispositivo de la sede.** Cada tablet de recepción va ligada a una sucursal con su propio token
   (revocable), el check-in pasa la cita a «Llegó» y avisa al barbero, y en modo kiosco no se muestra nada de otro
   cliente: solo nombre y hora, y la pantalla vuelve sola al inicio (16).
6. **Contratos antes que clientes.** Términos, política de privacidad, política de tratamiento (Colombia), acuerdo
   de encargo (DPA) con cada barbería y la lista de subencargados (Anthropic, Meta, ElevenLabs, Vercel…), permiso
   aparte para alergias y medicamentos, y borrar y exportar un cliente (17). No es asesoría legal: lo valida un abogado
   de cada país.

**Arquitectura recomendada (17):** Vercel (front y API) + Postgres en Supabase con el id de la barbería en cada tabla
y seguridad por fila + Inngest o QStash para recordatorios y webhooks + Upstash Redis para los topes + Sentry +
Resend. Costo aproximado por barbería y mes: 25–45 USD en EE. UU. y 12–35 en Colombia (sin verificar del todo las
tarifas de WhatsApp en Colombia ni el precio de los modelos); fijo para empezar, 250–450 USD al mes.

**Siguiente, por orden:** (1) endpoints pagos con sesión y la cola de WhatsApp en el servidor; (2) tarjeta solo en
los campos de la pasarela; (3) kiosco por sede con check-in que avisa y privacidad; (4) Métricas › Marketing con la
UTM real y sin reseñas de ejemplo fuera de la demo; (5) cola de walk-ins con espera estimada; (6) contratos y
políticas; (7) el backend real (fase «escudo» de 6–8 semanas en 17) y un piloto con 3–5 barberías.

---

## Límites de esta investigación

- El cupo de búsquedas web de la sesión (200, compartido) se agotó a mitad del trabajo de la mayoría de los agentes.
  En las tablas de benchmark, «?» quiere decir **no verificado**, no que la función falte. Cada informe separa las
  fuentes leídas de las vistas solo en el buscador y marca como «declarado» lo que un proveedor dice de sí mismo.
- Quedaron sin verificar, entre otros: Timely, Clockwise, Calendly, OpenTable, Zocdoc, Amplitude, ThoughtSpot,
  Lightspeed, Mindbody, Clover, SumUp, Siigo POS, Nequi Negocios, Rippling, BambooHR, Odoo, Expensify SmartScan
  (de primera mano), Uber/Rappi/Airbnb/Resy, las tarifas de IVA vigentes y el artículo exacto de la Ley 2466 sobre estilistas.
- El análisis del código se hizo sobre `main` en `90722e0`. Las tareas en otras copias que `main` aún no tiene no
  se revisaron.

---

## Estado de la hoja de ruta (2026-10-18)

Lo implementado desde la investigación, todo en `main` con pruebas:

- **Fase 1 — que los números cuadren**: moneda, impuesto y pasarela por sucursal; la reserva llega a la caja (sin
  doble cobro); devoluciones reales; pago mixto; precio por sucursal; nómina con periodos (abierto, aprobado, pagado),
  ajustes y renta de silla completa; cierre de caja; Métricas sobre la agenda real.
- **Fase 2 — operación conectada**: WhatsApp real (cola, plantillas de la Cloud API, confirmación por enlace y en la
  cita, mensajes 1 a 1 desde la ficha con permiso); ficha 360; estado de resultados con punto de equilibrio; gastos con
  fecha, categoría, proveedor y comprobantes; inventario ligero; importación de clientes por CSV; puesta en marcha.
- **De los informes 11–14**: «ver como» solo hacia abajo y rol desconocido sin acceso; código de entrada endurecido
  (respuesta única, bloqueo de 15 minutos, tope de envíos); `/api/tts` y `/api/whatsapp/send` con origen obligatorio y
  tope por IP; CSV sin fórmulas; Clipper sin guion de demo, sin adjuntos que descarta y con historial que se borra al
  salir; bandeja de avisos real por rol; «Mi pago» con estado y movimientos; un solo neto del barbero; la caja no
  espera el efectivo del barbero de renta; no se aprueban periodos de nómina cruzados.

- **Equipo y permisos (2026-10-18)**: ausencias con aprobación (bloquean la agenda), fila viva que gobierna la venta sin
  cita y la reserva sin preferencia, pestaña Rendimiento, portada con datos de la agenda; la sesión trae `teamRole` y
  `memberId` y el servidor recorta nómina, clientes, transacciones, métricas, gastos, equipo, configuración y avisos.

Pendiente, por orden:

1. **WhatsApp en producción**: plantillas aprobadas en Meta, claves en Vercel y la cola corriendo en el servidor (cron),
   no en el navegador; leer las respuestas (webhook).
2. **Equipo, segunda parte**: «Mi ficha» editable por el barbero, fichaje, turnos abiertos e intercambio, metas y
   niveles con criterios, cambio de modelo comisión ↔ renta con fecha.
3. ~~**Calendario recortado en el servidor**~~ **hecho**: el barbero recibe su columna y solo el nombre de los clientes
   ajenos; escribe solo en lo suyo, sin forzar; el de comisión no bloquea y el de renta solo su agenda.
4. **Fase 3 — IA, lo que queda**: reservable por agentes; evaluaciones con preguntas reales y registro de cada turno;
   revisión de Gastos (duplicados y atípicos); acciones de Clipper fuera de la agenda (configuración, avisos por
   WhatsApp). **Acciones con vista previa hechas**: mover, crear o cancelar una cita, bloquear un rato y anotar en la
   ficha; tarjeta con antes y después, «Aplicar» y «Deshacer», y «Clipper · quien aprobó» en el historial.
   **C hecha**: Clipper con modelo (`/api/clipper`) y 12 herramientas de solo lectura que la app ejecuta con la sesión
   de quien pregunta; cifras verificadas contra lo consultado; sin clave, responde el centro de ayuda. Hechos el 2026-10-18: **A. ritmo del cliente**
   (próxima visita con huecos reales, reactivación aprobada por el dueño solo a quien aceptó, riesgo de inasistencia en
   la cita con sus razones) y **B. hechos → narración** («Cómo te fue» en Métricas y «¿Por qué esta cifra?» en Mi pago;
   Claude redacta con marcadores y el servidor pone las cifras; sin clave, resumen automático) y **F. margen por hora
   de silla y matriz del catálogo** (Servicios › Rentabilidad: estrellas, caballos de tiro, enigmas y perros, con el
   precio que llevaría cada uno al promedio) y **E. revisión antes de cerrar** (al aprobar la nómina y al cerrar la
   caja: neto fuera de lo normal, ajustes repetidos, propinas atípicas, comisión de cliente nuevo a quien ya vino,
   doble cobro, ventas duplicadas, devoluciones grandes o hechas por quien cobró, clientes sin cobrar; lo grave pide
   «Lo revisé»). La nómina ya paga «cliente nuevo» solo en la primera cita del periodo.
5. **Fase 3 — IA** (orden original) en el orden de §4: ritmo del cliente, hechos → narración, margen por hora de silla, revisión antes de
   cerrar, Clipper con modelo y herramientas de solo lectura, reservable por agentes.
5. Integraciones que no se hacen en el mock: factura y documento soporte DIAN (Alegra o Siigo), Bre-B, push web (PWA).
6. **P0 sin integraciones cerrados el 2026-10-19**: recordatorios a las horas de Configuración y con WhatsApp como
   canal; el celular identifica al cliente (duplicados con «Abrir la ficha», correo opcional); la campana respeta lo
   apagado en Configuración; la reserva, los recordatorios y el `.ics` usan la zona de la sede; libro de pagos en
   Transacciones; confirmar la identidad en lo sensible (`/auth/step-up`); el registro verifica el celular y pide
   aceptar los términos; consentimiento con texto versionado según el país (Colombia, EE. UU., México y general;
   pendiente de revisión de un abogado); registro de cada paso de Clipper, 👍/👎 al servidor y conjunto de 60
   preguntas con corredor contra el modelo real. Quedan: estados de confirmación y anticipo en el panel de la cita
   (otra sesión lo está rediseñando), correr la evaluación con una clave real, y abrir sesión con una barbería nueva
   al registrarse (necesita el backend real, el mock tiene una sola barbería).

