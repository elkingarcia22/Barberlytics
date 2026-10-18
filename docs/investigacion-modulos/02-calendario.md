# Calendario — investigación

Fecha: 2026-10-17. Módulo: `/calendario` (`src/features/calendar`, piezas en `src/components/scheduling`,
mock en `src/mocks/calendar`). Este documento **continúa** `docs/CALENDAR_AI_RESEARCH.md` (2026-10-01) y no repite
su análisis de Google Calendar, Outlook, Fantastical, Morgen, Reclaim, Motion, Akiflow, ClickUp, Vimcal y Sunsama.
Aquí se revisa qué de aquella propuesta ya está en el código, qué falta y qué se aprendió de otros sectores
(clínicas, restaurantes, aerolíneas, servicios de campo, recepcionistas de voz).

**Mercado.** La interfaz está en español (`es-CO` en `src/app/layouts/AppLayout.tsx` l. 145), los celulares de la
semilla son `+57` (`src/mocks/calendar/seed.ts` l. 244, `src/mocks/db.ts`) y Ajustes ofrece `COP` como moneda
(`src/features/settings/settingsTypes.ts` l. 138). Pero las sucursales de demostración están en Estados Unidos
(Massachusetts, North Carolina, Rhode Island, Utah; `src/mocks/settings/seed.ts` l. 87-90) y cobran en USD. El
cliente objetivo es, por tanto, **la barbería hispanohablante**: Colombia y Latinoamérica, más la barbería
latina en EE. UU. Las dos comparten WhatsApp como canal principal y una cultura de última hora y walk-ins.

**Método.** Lectura del código del worktree (rama a la altura de `90722e0`), de `ai-tools/CODEMAP.md`, de
`docs/roles/01-calendario.md`, `docs/BOOKING_RESEARCH.md`, `docs/API_CONTRACT.md` y de las notas de decisión
(`project-calendario*.md`). Búsqueda web y lectura de páginas oficiales y estudios. **La cuota de búsquedas web
de la sesión se agotó a mitad del trabajo**: Timely, Clockwise, Calendly, OpenTable, Zocdoc y Square quedaron sin
verificar de primera mano y se marcan «sin verificar». Lo de Booksy, Fresha, Mangomint, Boulevard, Vagaro,
GlossGenius, Squire, Zenoti y Square se apoya, además, en las fuentes ya citadas en `CALENDAR_AI_RESEARCH.md`.

---

## Resumen ejecutivo

1. **La propuesta del 2026-10-01 está implementada en un 70 %**: choques validados (cliente y mock con `409`),
   huecos sugeridos con su porqué, reacomodo por retraso en preview con deshacer, alerta en la columna al
   liberar un hueco, densidad, atajos, multiservicio, citas enlazadas y recorte por rol. Faltan ⌘K, preview al
   escribir, apertura/cierre del día, mover en táctil y un modelo de verdad (todo son reglas).
2. **El hueco grande ya no está en la rejilla, sino en lo que pasa fuera de ella**: la agenda no sabe si el
   cliente **confirmó** por WhatsApp, si dejó **anticipo**, ni avisa a la lista de espera. La reserva en línea sí
   programa esos mensajes (`db.booking.outbox`), el calendario no: dos caminos que no se hablan.
3. **La inasistencia es el problema de dinero n.º 1** y donde la IA de otros sectores tiene evidencia: las
   clínicas predicen con AUC ≈ 0,83 y sobreagendan solo donde hay riesgo (menos horas extra que el
   sobreagendamiento plano). Tenemos casi todos los datos; falta guardarlos por cita.
4. **Apuestas de IA, en orden**: riesgo de inasistencia con acción (confirmar / anticipo), relleno de huecos por
   WhatsApp con lista de espera priorizada, asistente de WhatsApp que agenda dentro de la política de Meta 2026,
   reasignación dinámica de citas sin preferencia, y precios por franja aplicados de verdad.

---

## 1. Qué tiene hoy

| Área | Estado (archivo) |
|---|---|
| **Vistas** | Agenda, Día, Semana, Mes (`types.ts` `CALENDAR_VIEWS`). Estado en la URL: `?fecha&vista&equipo&cita&foco&servicio&huecos&enlazadas` (`useCalendarState.ts`). |
| **Rejilla del día** | `ResourceDayGrid` (542 l.): columna por barbero, fuera de horario rayado, línea de «ahora», pasado atenuado, solapes, bloqueos, botones «ver más barberos» con 10-11 barberos, columna de horas fija. Densidad (`calendarDensity.ts`), ancho de columna ajustable (`calendarColumnWidths.ts`, `ColumnResizeHandle.tsx`), qué cuenta la tarjeta (`calendarCardPrefs.ts`), color por servicio (12 matices, `schedule.css`). |
| **Móvil** | Tira de barberos `md:hidden` para ver uno a la vez (`CalendarDayView.tsx` l. 194). El arrastre ignora el táctil a propósito (`useScheduleDrag.ts` l. 101). |
| **Crear cita** | `CreateAppointmentDrawer.tsx`: cliente (o walk-in), **varios servicios**, barbero, `TimeSlotPicker` y **huecos sugeridos** pintados como fantasmas en la rejilla con su porqué (`slotSuggestions.ts`), repetición (serie de 12), «sin cita previa», barbero pedido. Agendar escribiendo («corte para Martín mañana a las 4 con Nicolás») por regex (`bookingText.ts`). |
| **Mover / estirar** | Arrastre con imán, `validateDrop` + `onDropRejected`; el mock devuelve `409` si pisa cita o bloqueo (`mocks/calendar/handlers.ts` l. 263-264 y 362-364). Dueño, admin y recepción pueden forzar (`calendarAccess.ts` `followsAgendaRules`): el toast avisa sobre qué quedó. Todo cambio deja **Deshacer** en el toast y con la tecla Z (`CalendarPage.tsx` `patchWithUndo`, l. 239-268). |
| **Estados** | `scheduled → arrived → seated → paid`, más `no_show` y `cancelled` con confirmación; `barberReady` aparte. `appointmentPlaybook.ts` decide la acción siguiente por etapa (tarde: Llamar / WhatsApp / Ingresar; en silla: Cobrar; cobrada: Agendar próxima). |
| **Choques** | `clashingAppointments`, `clashingBlocks`, `placementProblem` (`calendarModel.ts`); `findConflicts` en `scheduleUtils.ts`. |
| **Reacomodo** | `reflowModel.ts`: al estirar una cita o desde el menú del barbero, corre la cola del mismo barbero respetando orden, bloqueos y cierre (marca `overflow`). Se ve en preview (`ReflowBanner.tsx` + fantasmas), se aplica con un botón y queda en el historial con `reason` y `actor: "assistant"`. |
| **Huecos y lista de espera** | `GapsDrawer` + `gapsModel.ts` (huecos desde ahora, qué cabe, cuánto se podría vender, a quién ofrecerlo; tecla H). «Solo huecos» (`?huecos=1`) pinta cada rato libre. Al anular una cita, `releaseSlot` busca en la lista de espera y deja una **alerta en la cabecera de la columna** que abre el alta prellenada (`CalendarPage.tsx` l. 629-663). `WaitlistDrawer` con «Ofrecer». |
| **Citas enlazadas** | `linkId` explícito; enlazar/desenlazar con deshacer; filtro «Ver citas enlazadas» con borde del color del grupo; el cobro trae las enlazadas. Mover juntas: **no**. |
| **Varios servicios** | Una tarjeta con tramos y bolita por servicio (`segments`, `serviceSlots`). |
| **Filtros** | `CalendarFilters.tsx`: estado, servicio del catálogo, tipo de cliente (multi-selección); `TeamPicker` multi-barbero. |
| **Paneles** | Todo en `SidePanelShell` (empuja la agenda), uno a la vez: cita (pestañas Resumen · Clipper · Notas · Cliente · Historial), crear, cobrar (propinas, recargo, vuelto), bloqueo, lista de espera, huecos, venta rápida, venta sin cita, lista de cobros, asistente. |
| **Roles** | `calendarAccess.ts`: barberos ven solo su columna (`scopeDay`, `scopeCatalog`), no fuerzan; recepción sin cifras (`showTotals`); contacto según «Información del cliente»; bloqueos por permiso. Detalle en `docs/roles/01-calendario.md`. |
| **«IA» (reglas)** | `appointmentInsights.ts` (riesgo de inasistencia ≥2 faltas y ≥20 %, barbero no pedido, primera visita, VIP, venta adicional, re-agendar por cadencia), `dayBrief.ts`, `waitlistMatch`, `slotSuggestions.ts`, `reflowModel.ts`, `gapsModel.ts`. Se muestran en la pestaña **Clipper** (`AIInsightCard`) y en el asistente; `AiGeneratedBadge` aparece en 6 sitios. No hay llamada a ningún modelo. |
| **Atajos** | C, T, A/D/W/M, `[` `]`, Z, I (asistente), H (huecos) — `useCalendarShortcuts.ts`. Sin paleta ⌘K. |
| **Pruebas** | `calendar.test.tsx` (888 l., ~53 casos) y pruebas de piezas en `scheduling`. |

### Estado de la propuesta del 2026-10-01

| Propuesta (sección 7 de `CALENDAR_AI_RESEARCH.md`) | Estado |
|---|---|
| Validación de choques, horario (cliente + mock) | ✅ hecho; **buffers por servicio: no** (no hay campo en servicios) |
| Deshacer en toast + Z | ✅ |
| Multiservicio en el alta | ✅ |
| Forma por naturaleza (sólido / punteado / candado) e iconos de esquina | Parcial: `flexible`, `ghost`, `locked` existen; los iconos se quitaron a pedido del usuario |
| Zoom de densidad y orden de columnas | Densidad ✅, ancho por columna ✅; orden lo fija Equipo |
| Preview en vivo al escribir sobre la rejilla | ❌ (el texto se interpreta en el asistente, sin fantasma) |
| Popover sobre el hueco | Sustituido por el panel lateral (decisión del usuario) |
| Huecos sugeridos rankeados con porqué | ✅ (`slotSuggestions.ts`) |
| Paleta ⌘K | ❌ (atajos de una letra sí) |
| Rellenar cancelaciones desde la cabecera | ✅ alerta en la columna; **sin mensaje al cliente** |
| Reacomodo por retraso con preview, permisos, explicación | ✅ |
| Riesgo anticipado («terminarías a las 19:40») | Parcial: `overflow` en el reacomodo; sin aviso general |
| Historial de quién movió qué | ✅ (`actor`, `reason`) |
| Apertura y cierre del día | ❌ |
| Táctil: long-press, botones ±30 | ❌ |
| LLM real | ❌ (reglas rotuladas como IA, justo lo que la sección 8 pedía no hacer) |

---

## 2. Análisis del módulo

### Fortalezas

- **Operación del día bien resuelta.** Playbook por estado, pulso por filtros, cobro con propina y vuelto, venta
  sin cita y lista de cobros: es más completo en el mostrador que Square o Booksy según sus centros de ayuda
  (ver documento anterior).
- **IA «honesta» en la forma**: todo lo que propone se ve en preview, explica el porqué, no toca lo que el cliente
  eligió (barbero pedido, en silla, cobrada) y se deshace. Es exactamente el patrón que funciona en Reclaim 2.0 y
  Akiflow, y que Fresha aplica en Dynamic Reassignment («nunca se mueven las citas con profesional elegido»).
- **Reglas por rol coherentes** y centralizadas en `calendarAccess.ts`; el barbero de comisión agenda con reglas,
  quien arregla el día puede forzar.
- **Lógica separada de la interfaz** (`*Model.ts`, `slotSuggestions`, `reflowModel`): se puede llevar al backend o
  reutilizar en la reserva en línea (lo propuso `BOOKING_RESEARCH.md` para «horas que no dejan huecos»).

### Huecos

1. **El calendario no ve la comunicación con el cliente.** `appointmentStatusSchema` no tiene «confirmada»; la
   reserva en línea programa confirmación con «Confirmo / Reprogramar» y recordatorios 24 h y 2 h
   (`docs/API_CONTRACT.md` l. 360-366, `mocks/booking/reminders.ts`), pero `mocks/calendar/handlers.ts` no escribe
   en el `outbox`: **una cita creada, movida o anulada desde el calendario no programa ni cancela recordatorios ni
   avisa a la lista de espera**. La tarjeta no puede decir «confirmó», «no contesta» o «pidió reprogramar».
2. **Sin protección contra inasistencias en la agenda.** Ajustes ya guarda `deposit { enabled, percent,
   newClients, afterNoShows }` (`settingsTypes.ts` l. 38) y la reserva calcula `depositRequired`, pero la cita del
   calendario no tiene campo de anticipo ni tarjeta en archivo, y el riesgo de inasistencia solo se lee en la
   pestaña Clipper, sin acción (ni «pedir anticipo», ni «confirmar por WhatsApp» desde la tarjeta).
3. **Lista de espera sin prioridad ni salida.** `releaseSlot` toma `matches[0]` (orden de llegada), no pondera
   valor, puntualidad ni cadencia; el estado `freed` vive en memoria (se pierde al recargar); y no se manda nada.
   Mangomint y SevenRooms avisan y priorizan a los clientes de más valor.
4. **Sin cola de walk-ins en vivo.** Hay «sin cita previa» y «venta sin cita» (registro a posteriori), pero no una
   fila de llegada con tiempo de espera estimado, que es el día a día de la barbería de barrio (y lo que
   SevenRooms resuelve en restaurantes con lista virtual y SMS).
5. **Sin buffers ni tiempos de limpieza** por servicio (Fresha los automatiza; `features/services` no tiene campo).
6. **Precio dinámico configurado pero no aplicado.** `surge` existe en Ajustes (`settingsTypes.ts` l. 34) y
   `BOOKING_RESEARCH.md` §4.5 ya avisó de que la reserva no lo aplica; el calendario tampoco lo muestra.
7. **Datos insuficientes para un modelo**: el cliente guarda contadores (`visits`, `cancellations`, `noShows`), no
   la secuencia por cita; no se guarda la antelación de reserva como dato analítico ni si respondió al
   recordatorio. El mock genera inasistencias al azar (6 %, `seed.ts` l. 448): no hay patrón que aprender.

### Deuda técnica

- **Moneda fija en USD**: `useMoney()` (`calendarFormat.ts` l. 15) ignora `pricing.currency` de Ajustes; una
  barbería en COP vería dólares. Lo mismo en `TeamHomePage.tsx` l. 128.
- `CalendarPage.tsx` tiene **1.057 líneas** (regla del repo: 800 máx.) y `calendarModel.ts` 630; el estado de
  paneles, reacomodo, huecos liberados y deshacer convive en un componente.
- Deshacer guarda **una sola** acción (`undoRef`); dos cambios seguidos pierden el primero.
- `SUGGESTION_STEP_MINUTES` = 15 vs. `TimeSlotPicker` cada 30 (anotado en la memoria del 2026-10-02).
- Reglas rotuladas como IA con `AiGeneratedBadge`: contradice la sección 8 del documento anterior y quema la
  credibilidad del día en que haya un modelo real.
- Citas enlazadas no se mueven juntas; el reacomodo no mira el enlace (puede separar a padre e hijo).
- El panel de chat de Clipper y un `SidePanelShell` abiertos a la vez quedan en dos columnas (sin resolver).

### Fricciones de UX

- En móvil solo se **ve**: no se mueve una cita sin teclado/ratón (no hay long-press ni «±30 / otro barbero»).
- La acción ante riesgo de inasistencia está a tres toques (abrir cita → pestaña Clipper → leer), sin botón.
- La alerta de hueco liberado abre el alta, pero el siguiente paso real (escribir al cliente) queda fuera de la app.
- Muchas capacidades viven en atajos (I, H) o en «⋯»: quien atiende en tablet no las descubre.
- No hay vista de «qué falta confirmar mañana», que es la tarea de las 6 p. m. de cualquier recepción.

---

## 3. Qué le falta (tabla priorizada)

Impacto: en ingresos recuperados o tiempo de recepción. Esfuerzo: S (días), M (1-2 semanas), L (más).

| P | Qué | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | **Estado de confirmación en la cita** (`confirmation: pending / confirmed / reschedule_requested / no_answer`) y en la tarjeta; filtro «Sin confirmar mañana» | Es la primera palanca contra la inasistencia y ya se envía desde la reserva | Alto | S-M |
| **P0** | **Un solo motor de mensajes**: crear/mover/anular desde el calendario programa y cancela recordatorios (el `outbox` de la reserva) | Hoy las citas de recepción no reciben recordatorio | Alto | M |
| **P0** | **Anticipo / tarjeta en archivo visibles y accionables en la cita** (pagado, pendiente, exento; «Pedir anticipo» por enlace) usando la regla de Ajustes | Booksy: 20 % menos cancelaciones con cargo; pre-autorización en reservas de riesgo | Alto | M |
| **P0** | Moneda de la sucursal en `useMoney` | Bloquea Colombia | Medio | S |
| **P1** | **Riesgo de inasistencia en la tarjeta con acción** (icono + «Confirmar por WhatsApp» / «Pedir anticipo») | Pasar de saber a hacer | Alto | S |
| **P1** | **Lista de espera priorizada y con envío** (oferta por WhatsApp a N clientes, gana el primero; prioridad configurable: llegada, valor, cadencia vencida) y `freed` persistido | Mangomint, SevenRooms, la reserva ya lo hace con `slotFreed` | Alto | M |
| **P1** | **Cola de walk-ins** con espera estimada por barbero y aviso por WhatsApp «te toca en 10 min» | Cultura de barbería sin cita | Alto | M |
| **P1** | Buffers y limpieza por servicio, respetados por choques, sugerencias y reacomodo | Agendas «optimistas» (crítica a ClickUp) | Medio | S-M |
| **P1** | Mover en táctil (long-press → «−15 / +15 / otro barbero») y teclado | La deuda más visible del documento anterior | Medio | M |
| **P1** | Partir `CalendarPage.tsx` (paneles, reacomodo, huecos liberados en hooks propios); pila de deshacer | Mantenibilidad | Medio | M |
| **P1** | Quitar `AiGeneratedBadge` de lo que es regla; «Sugerencia» + la regla en una línea | Credibilidad | Bajo | S |
| **P2** | Apertura y cierre del día (pendientes de ayer, sin confirmar, caja, highlights) | Ritual; convierte el brief en hábito | Medio | M |
| **P2** | Paleta ⌘K con verbos del negocio y preview al escribir | Velocidad de recepción | Medio | M |
| **P2** | Precio por franja aplicado (reserva y tarjeta) | Llenar valles | Medio | M |
| **P2** | Mover citas enlazadas juntas; el reacomodo respeta enlaces | Coherencia | Bajo | S-M |
| **P2** | Duración aprendida por servicio × barbero | Menos retrasos en cascada | Medio | M (requiere datos) |

---

## 4. Benchmark

Leyenda: ✅ lo tiene (fuente leída) · ◐ parcial · ❌ no · ? sin verificar. «Doc. ant.» = verificado en
`CALENDAR_AI_RESEARCH.md`.

### 4.1 Sector barbería y salón

| Función | Barberlytics hoy | Booksy | Fresha | Boulevard | Mangomint | Vagaro | GlossGenius | Zenoti | Phorest | AgendaPro | Square |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Columna por profesional, arrastrar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ? | ✅ |
| Validar choques + buffers / limpieza | ◐ sin buffers | ? | ✅ buffers y procesamiento | ? | ? | ? | ? | ? | ? | ? | ? |
| Recursos (sillas, salas) aparte del personal | ❌ | ? | ✅ (may-2026) | ? | ? | ? | ? | ? | ? | ? | ? |
| Huecos sin gaps / precision scheduling | ✅ reglas | ◐ Smart Schedule | ? | ✅ | ? | ✅ Minimize Gaps | ? | ? | ? | ? | ? |
| Reasignación dinámica (citas sin preferencia) | ❌ | ? | ✅ | ? | ? | ? | ? | ? | ? | ? | ? |
| Reacomodo por retraso en preview | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ? | ? | ? | ❌ |
| Lista de espera que avisa al liberar | ◐ alerta interna | ✅ | ✅ | ◐ manual | ✅ Intelligent Waitlist | ✅ | ? | ? | ? | ◐ Sofía reprograma | ? |
| Anticipo / tarjeta en archivo | ◐ solo reserva | ✅ | ✅ | ✅ | ? | ? | ✅ | ? | ? | ✅ (doc. reserva) | ✅ |
| Pre-autorización según riesgo / cliente de confianza | ❌ | ✅ (abr-2026) / ✅ Trusted Client | ? | ? | ? | ? | ◐ solo nuevos | ? | ? | ? | ? |
| Predicción de inasistencia | ◐ regla | ? (fuente no oficial) | ? | ? | ? | ? | ? | ✅ AI Retention Manager | ? | ? | ? |
| Confirmación por WhatsApp con botones | ◐ solo reserva | ? | ? | ? | ? | ? | ? | ? | ? | ✅ Sofía IA | ❌ (SMS) |
| Recepcionista IA que agenda en la llamada | ❌ | ✅ | ✅ AI Concierge 99,95 USD/local | ❌ Beau manda enlace | ❌ | ❌ Vera no agenda | ✅ Reception | ✅ | ◐ Front Desk AI (jun-2026, en desarrollo) | ◐ por WhatsApp | ◐ Assistant SMS |
| Precio dinámico por franja | ◐ configurado, no aplicado | ? | ✅ Intelligent Pricing | ? | ? | ? | ? | ✅ | ? | ? | ? |
| Resumen del día / brief | ✅ reglas | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ Growth Analyst | ◐ Zeenie | ◐ Cheatsheet (resumen del cliente) | ? | ❌ |
| API pública para terceros | — | ? | ❌ (solo Data Connector) | ◐ solo Enterprise | ? | ◐ solo lectura | ? | ? | ? | ? | ✅ Bookings API |

Timely: no se pudo verificar ninguna función de IA (la búsqueda no devolvió fuentes).

### 4.2 Fuera del sector

| Producto | Qué hace que nos sirva | Lección |
|---|---|---|
| **Clínicas** (Marshfield Clinic, Mayo/Huang & Hanauer) | Modelo de inasistencia por cita; sobreagendar solo sobre citas de riesgo | Predicción individual > regla plana; la confirmación es de los 3 predictores más fuertes |
| **Doctolib** (compró Aaron.ai, 2024) | Asistente telefónico que agenda, reprograma y cancela | La voz ya es estándar en salud europea |
| **SevenRooms** (restaurantes) | Lista virtual con SMS y tiempo de espera, QR para walk-ins, alertas de prioridad al liberar mesa (VIP primero), retención de tarjeta, Voice AI | El walk-in y el VIP se gestionan con la misma lista |
| **Aerolíneas** | Sobreventa con pronóstico de inasistencia; voluntarios primero; compensación | Sobreagendar tiene un costo visible si falla: hay que tener «plan B» |
| **ServiceTitan Dispatch Pro** | Restricciones duras primero, luego predicción de valor por técnico; modo Asistido (aprueba el despachador) y Auto (re-optimiza cada 10 min); «nunca anula una decisión humana» | Dos modos y respeto a lo fijado a mano: el mismo contrato que nuestro reacomodo |
| **Cal.com (Cal.ai)** | Agente de voz que llama para confirmar, recordar o reagendar tras una inasistencia; 0,29 USD/min | La llamada saliente disparada por eventos de la agenda es barata y configurable |
| **Google, Motion, Reclaim, Akiflow** | Ver documento anterior | Preview, explicar, deshacer |
| Clockwise, Calendly, OpenTable, Zocdoc | Sin verificar en esta ronda | — |

### Hallazgos

- **Fresha se movió en mayo de 2026** hacia el «calendario adaptativo»: reasignación dinámica, buffers y
  procesamiento automáticos, recursos (salas, equipos) y precios inteligentes por demanda; y un recepcionista IA
  de pago (99,95 USD/local/mes) que agenda, mueve y cancela en el calendario, siempre identificándose como IA.
  No publica métricas. Es el competidor a mirar.
- **Booksy endurece la protección contra inasistencias**: pre-autorización solo en reservas de riesgo (abr-2026),
  tarjeta que no se puede borrar mientras cubre una cita con cargo (ago-2026), «Trusted Client» exento. Su
  página dice 20 % menos cancelaciones con cargos (dato propio, «promedio de uso»).
- **La recepcionista de voz es la IA que el sector vende**, pero solo funciona bien si escribe en el calendario
  nativo: según JustCall, de los recepcionistas de terceros casi ninguno agenda en Vagaro, Fresha o Boulevard por
  falta de API. Los de plataforma (Fresha, Booksy, GlossGenius, Squire) sí. **Ser dueños del calendario es la
  ventaja**: nuestro asistente puede escribir directo.
- **Nadie del sector tiene reacomodo por retraso** ni brief del día: siguen siendo diferenciales nuestros.
- **En LatAm el canal es WhatsApp**, no la llamada: AgendaPro vende «Sofía IA», que recuerda, insiste cuando el
  cliente no responde, propone horas hasta confirmar y reprograma al cancelar, desde el número del negocio. No
  publica métricas ni precio.

---

## 5. Mercado y tendencias 2025-2026

1. **Del calendario pasivo al adaptativo.** Fresha (may-2026) y Boulevard (precision scheduling) llevan la
   optimización a la agenda; ServiceTitan la lleva al extremo con re-optimización continua. El patrón común:
   restricciones duras primero, luego optimizar, y nunca mover lo que el cliente o una persona fijó.
2. **La inasistencia se cobra.** Depósito, tarjeta en archivo, cargo tardío y, cada vez más, **condicionales al
   riesgo** (Booksy pre-autoriza solo a quien tiene historial de fallos; GlossGenius solo a nuevos). Ajustes ya
   tiene la regla «después de N inasistencias»: falta que la agenda la use.
3. **Recepcionista IA como add-on de pago** (Fresha 99,95 USD; GlossGenius ~50 USD según el documento anterior;
   Phorest Front Desk AI en jun-2026). El valor está en agendar dentro de la llamada, no en mandar un enlace.
4. **Precio por demanda llega al salón**: Zenoti (reglas por día, hora, festivos, tendencia de reservas, precio
   visible en el momento de reservar, auditoría), Salonized (bloques de descuento o recargo en el calendario,
   solo para reserva en línea, el recargo no se muestra como porcentaje), Fresha Intelligent Pricing. Riesgo
   reconocido por el propio Zenoti: clientela acostumbrada a precio fijo.
5. **WhatsApp cambia las reglas en 2026.** Desde el 15-ene-2026 Meta prohíbe en la API de WhatsApp Business los
   chatbots de IA de propósito general, pero **permite** el asistente de un negocio para sus propios clientes
   (reservas, consultas, avisos). Precio por mensaje desde el 1-jul-2025: las plantillas de utilidad
   (confirmación, recordatorio) son **gratis dentro de la ventana de 24 h** abierta por el cliente y se cobran
   fuera de ella; Colombia subió tarifas de utilidad el 1-oct-2025 y desde el 1-abr-2026 se puede facturar en
   COP. Consecuencia de diseño: **pedir que el cliente responda** (botón «Confirmo») abre la ventana y abarata
   todo lo que sigue ese día.
6. **Particularidades LatAm** (ya parcialmente en `BOOKING_RESEARCH.md`): pagos locales (PSE, Nequi) para el
   anticipo, consentimiento expreso para mensajes de marketing (Ley 1581), el recordatorio es de utilidad, no de
   marketing. Walk-in y «¿hay turno?» por WhatsApp son tan frecuentes como la cita. **No se encontró una cifra
   verificable de tasa de inasistencia en barberías colombianas**; la semilla usa 6 %, igual al estudio rural de
   EE. UU. — conviene medirla en producción antes de prometer ahorros.

---

## 6. IA

### 6.1 Casos de uso

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos que necesita · ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Predicción de inasistencia** | Probabilidad por cita; dispara confirmación reforzada, anticipo o sobrecupo | Marshfield Clinic: 1,26 M citas, 6 % inasistencia, XGBoost AUC 0,83; predictores: inasistencias previas, tipo de seguro, **confirmación**. Booksy (no oficial) | Icono en la tarjeta + acción: «Confirmar por WhatsApp», «Pedir anticipo», y a la noche lista «riesgo mañana» | Faltas previas ✅ (contador), antelación ✅ (`createdAt`), origen ✅ (`source`), día/hora ✅, respuesta al recordatorio ❌, historial por cita ❌, clima ❌ | Predictiva | M (empezar con regresión logística por sucursal; la regla actual sirve de base) | Sesgo contra barrios o clientes nuevos; falsa alarma que molesta al cliente fiel; no exponer la «puntuación» al cliente |
| 2 | **Sobrecupo inteligente** | Agendar encima solo de citas de alto riesgo | Clínicas: 1 sobrecupo por cada 6 citas de riesgo, máx. 2/día (Marshfield); −27 % horas extra frente a sobrecupo plano (Huang & Hanauer); aerolíneas (Delta usa algoritmos e incentivos a voluntarios) | Ofrecer el hueco «probable» a walk-ins o lista de espera con aviso «puede haber espera», no a citas | Lo del caso 1 + cola de walk-ins ❌ | Predictiva + reglas | M | Cliente que espera de más; el barbero de comisión que pierde el corte; reputación (caso United) — **solo con consentimiento y nunca en cita pagada/con anticipo** |
| 3 | **Relleno de huecos con lista de espera** | Al liberarse un hueco, ofrece a N candidatos priorizados por WhatsApp; gana el primero | Mangomint Intelligent Waitlist; SevenRooms (VIP primero); AgendaPro Sofía; nuestra reserva (`slotFreed` a 3) | Ya existe la alerta; falta priorizar (cadencia vencida, valor, cercanía) y enviar | Lista de espera ✅, cadencia ✅ (`visitEveryDays`), valor ✅, plantillas ❌ en calendario | Predictiva ligera + agéntica | S-M | Oferta a dos personas para un hueco (bloqueo optimista); spam |
| 4 | **Reasignación dinámica** | Mueve citas sin barbero preferido para abrir el hueco que pide otro cliente | Fresha Dynamic Reassignment (nunca las de profesional elegido; límite de antelación configurable) | Online: «con Nicolás no hay a las 4» → se mueve una cita «cualquiera» de Nicolás a Juan | `requestedBarberId` ✅ (pero «sin preferencia» explícito ❌, ver roles §2.4), habilidades por barbero ◐ (nivel) | Optimización (reglas) | M | Cambiar el barbero sin avisar; comisiones entre barberos |
| 5 | **Autoscheduling / reacomodo** | Planifica y re-planifica la cola | Reclaim, Motion, Akiflow (doc. ant.); ServiceTitan Auto/Assist | Ya hecho por retraso; ampliar a «el barbero se va a las 3»: repartir su tarde entre los demás en preview | ✅ | Optimización | S-M (reutiliza `reflowModel` + `suggestSlots`) | Mover sin preguntar (lección Motion) |
| 6 | **Optimización de turnos y capacidad** | Predice demanda por franja y propone horarios de barberos | ServiceTitan (predicción de valor por técnico); Zenoti AI Employee Scheduler (doc. ant.) | «Los sábados de 10 a 13 rechazas 9 reservas: suma un barbero» — usa reservas fallidas de la reserva en línea | Ocupación ✅, demanda rechazada ◐ (embudo de la reserva, `GET /booking/funnel`), turnos ✅ (Equipo) | Predictiva | M-L | Pronóstico con poca historia en sucursales pequeñas |
| 7 | **Recepcionista conversacional (WhatsApp/voz)** | Agenda, reprograma, cancela y confirma escribiendo en el calendario | Fresha AI Concierge, Booksy, GlossGenius Reception, Doctolib (Aaron.ai), Cal.ai (voz saliente), AgendaPro Sofía (WhatsApp), SevenRooms Voice AI | WhatsApp primero (LatAm), voz después (EE. UU.); reutiliza el chat de la reserva («Conversación») y Clipper | Catálogo, disponibilidad, políticas ✅; proveedor WhatsApp Business ❌; LLM ❌ | Conversacional + agéntica | L | Política de Meta (solo asistente propio, ✅ caso permitido); errores de agenda; debe identificarse como IA (Fresha lo fuerza); datos personales (Ley 1581) |
| 8 | **Precio dinámico por franja** | Descuento en valles, recargo en picos o por ocupación | Fresha Intelligent Pricing, Zenoti, Salonized | Mostrar en la reserva y en la tarjeta; sugerir el descuento de martes 10-12 a partir de la ocupación histórica | `surge` en Ajustes ✅ (sin aplicar), ocupación ✅ | Predictiva + reglas | M | Clientes fieles molestos; barberos que cobran por comisión; transparencia (Salonized oculta el % del recargo: no copiar) |
| 9 | **Duración aprendida** | Duración real por servicio × barbero × cliente | Sunsama (doc. ant.) | Agendas que no se atrasan; mejor reacomodo | Inicio/fin real ◐ (`seated`→`paid` en historial, sin hora de fin de servicio) | Predictiva | M | Penalizar al barbero lento en público |
| 10 | **Brief generativo y cierre del día** | Resumen en lenguaje natural y preguntas sobre la agenda | Phorest Cheatsheet/Insights AI, GlossGenius Growth Analyst, Zenoti Zeenie | Pasar `dayBrief` por un LLM con datos estructurados; «¿quién no confirmó mañana?» | ✅ | Generativa | S-M | Inventar cifras: el texto solo debe narrar números calculados |

### 6.2 Top 5 apuestas

1. **Inasistencias: confirmar, puntuar y actuar** (casos 1 + parte de 2). Empezar sin modelo: estado de
   confirmación + regla actual en la tarjeta + acciones (WhatsApp, anticipo con la regla de Ajustes). Guardar
   desde ya el historial por cita (antelación, origen, respuesta al recordatorio) para entrenar en 3-6 meses una
   regresión logística por sucursal. Es donde hay evidencia externa y dinero directo.
2. **Hueco liberado → WhatsApp → cita** (caso 3). Unir `releaseSlot` con el `outbox`: oferta a 3 candidatos
   priorizados (cadencia vencida, valor, barbero pedido), el primero que confirma se lo queda, y la columna lo
   refleja. Aprovecha que la confirmación abre la ventana gratuita de 24 h.
3. **Clipper en WhatsApp como asistente propio** (caso 7). Dentro del margen que Meta permite en 2026: agendar,
   reprogramar, confirmar y «¿hay turno ahora?» con la cola de walk-ins. Escribe en el calendario con
   `actor: "assistant"` y el mismo preview/deshacer. La voz para EE. UU. después (Cal.ai muestra un costo de
   referencia de ~0,29 USD/min).
4. **Reasignación dinámica + reparto de la tarde** (casos 4 y 5). Extender `slotSuggestions` y `reflowModel`
   con la regla de Fresha (solo citas «sin preferencia», con antelación mínima) y los dos modos de ServiceTitan
   (Asistido por defecto; Auto solo ≤10 min en el mismo barbero, como ya proponía el documento anterior).
5. **Precio por franja, sugerido por la ocupación** (caso 8). Aplicar `surge` y añadir descuento en valles,
   siempre visible al reservar; la IA solo **propone** la regla («los martes de 10 a 12 llenas el 35 %: −10 %»)
   y el dueño la activa.

---

## 7. Hoja de ruta en 3 fases

| Fase | Contenido | Criterio de salida |
|---|---|---|
| **1. Que la agenda sepa lo que pasa fuera** (4-6 semanas) | Moneda de la sucursal; estado de confirmación en el contrato, la tarjeta y el filtro «Sin confirmar mañana»; un solo motor de mensajes para calendario y reserva (crear/mover/anular programan y cancelan); anticipo y tarjeta en archivo visibles en la cita con «Pedir anticipo»; riesgo de inasistencia en la tarjeta con acción; quitar el rótulo de IA a las reglas; guardar historial por cita (antelación, origen, respuesta) | `npm run check` y `verify` en verde; una cita creada en recepción tiene sus recordatorios en el `outbox`; la doc del grupo `scheduling` y `API_CONTRACT.md` actualizadas |
| **2. Rellenar y fluir** (6-8 semanas) | Lista de espera priorizada con oferta por WhatsApp y `freed` persistido; cola de walk-ins con espera estimada; buffers por servicio; táctil (long-press, ±15, otro barbero); partir `CalendarPage.tsx` y pila de deshacer; mover citas enlazadas juntas; reasignación dinámica en modo Asistido | Hueco liberado → oferta enviada → cita creada sin salir de la app; 375 px usable para mover |
| **3. IA de verdad** (8-12 semanas) | Modelo de inasistencia por sucursal (con datos de la fase 1) y sobrecupo opcional solo para walk-ins; Clipper en WhatsApp (asistente propio, política Meta 2026); brief y cierre del día generativos sobre cifras calculadas; precio por franja sugerido; duración aprendida; ⌘K | Métrica de inasistencia medida antes/después por sucursal; cada acción de IA con preview, porqué, deshacer y `actor` en el historial |

---

## Fuentes

**Leídas (página abierta en esta investigación)**

- https://www.fresha.com/blog/fresha-ai-powered-intelligent-scheduling-beauty-wellness (2026-05-08)
- https://www.usecarly.com/blog/fresha-ai/ (AI Concierge, precio, sin API pública)
- https://biz.booksy.com/en-us/features/no-show-protection
- https://biz.booksy.com/whats-new/fixed-cancellation-fees-now-more-reliable (2026-08-10; pre-autorización 2026-04-03)
- https://agendapro.com/co/sofia-ia-recordatorios
- https://sevenrooms.com/platform/reservations-waitlist/
- https://help.servicetitan.com/docs/dispatch-pro-overview.md (marcada como desactualizada por el propio sitio)
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10503036/ (Marshfield Clinic, BMC Health Services Research 2023)
- https://mayoclinic.elsevierpure.com/en/publications/patient-no-show-predictive-model-development-using-multiple-data- (Huang & Hanauer 2014)
- https://en.wikipedia.org/wiki/Overselling (sobreventa en aerolíneas)
- https://cal.com/ai (Cal.ai)
- https://www.zenoti.com/platform/dynamic-pricing
- http://help.salonized.com/en/articles/6563442-how-can-i-use-dynamic-pricing-to-optimise-my-salon-s-schedule
- https://justcall.io/blog/best-ai-receptionists-for-hair-salons.html (comparativa de recepcionistas IA e integraciones)
- https://www.stork.ai/en/phorest (fuente secundaria: Phorest AI, jun-2026)
- https://developers.facebook.com/docs/whatsapp/pricing (precio por mensaje, Colombia, COP)
- https://www.eluniversal.com.co/tecnologia/2025/12/10/whatsapp-pondra-fin-a-los-chatbots-de-ia-en-2026-esta-es-la-verdadera-razon/ (política de Meta desde el 2026-01-15)

**Vistas solo en resultados de búsqueda (no abiertas; se usan como indicio)**

- https://servicetitan.com/features/pro/dispatch · https://www.servicetitan.com/blog/success-story-besser-garage-door-ai-powered-dispatching
- https://app.dealroom.co/news/note/doctolib-acquires-aaron-ai (Doctolib compra Aaron.ai, 2024)
- https://www.ki-syndikat.de/tools/booksy/ (IA de Booksy limitada a predicción de inasistencias y huecos; no oficial)
- https://www.stork.ai/en/fresha-ai-concierge · https://www.zenoti.com/blogs/dynamic-pricing-how-this-popular-pricing-model-works-for-salons-and-spas
- https://hostie.ai/resources/cut-restaurant-no-shows-30-percent-ai-confirmations-smart-waitlists (marketing de proveedor; cifras no usadas)

**Del documento anterior** (`docs/CALENDAR_AI_RESEARCH.md`, §9): Google, Outlook, Fantastical, Morgen, Reclaim,
Motion, Akiflow, ClickUp, Vimcal, Sunsama, Mangomint, Boulevard, Vagaro, GlossGenius, Squire, Square y Zenoti.

**Sin verificar en esta ronda** (cuota de búsqueda agotada): Timely, Clockwise, Calendly, OpenTable, Zocdoc, cifras
de inasistencia en barberías de Colombia.
