# Calendarios con IA: investigación para el rediseño del calendario

Fecha: 2026-10-01. Alcance: Google Calendar (Gemini) y Outlook (Copilot), Fantastical, Amie, Notion
Calendar, Morgen, Reclaim, Motion, Akiflow, ClickUp Calendar, Vimcal, Sunsama, y la competencia
directa de barbería/salón (Fresha, Booksy, Square Appointments, Squire, Mangomint, Boulevard, Zenoti,
GlossGenius, Vagaro, Setmore). Todo contrastado con el estado actual de nuestro calendario
(`src/features/calendar` + `src/components/scheduling`, versión del checkout `levantalo-localhost-b22896`,
sin commit todavía).

Método: seis investigaciones en paralelo sobre webs oficiales, centros de ayuda, changelogs y reseñas
(TechCrunch, 9to5, MacStories, Zapier, Capterra, G2, Product Hunt). Las fuentes están al final. Lo que
no se pudo verificar en página completa va marcado como «indexado» o «no verificado» en la fuente.

---

## 1. Resumen ejecutivo

**Nadie en el segmento de barbería tiene un calendario «inteligente» de verdad.** La IA de Fresha,
Booksy, Squire, GlossGenius o Zenoti vive en la *recepcionista* (teléfono, SMS, Google AI Mode) y en el
marketing. Dentro de la agenda, lo más avanzado es Fresha *Dynamic Reassignment* (reasigna citas sin
barbero preferido), Mangomint *Intelligent Waitlist* (una cancelación dispara una alerta en la
cabecera del calendario con la reserva prellenada) y Boulevard *Precision Scheduling* (ordena los huecos
para no dejar gaps). Ninguno tiene resumen del día, reacomodo por retraso ni explicación de por qué
sugiere algo.

**Los calendarios de productividad sí tienen la IA madura, y tienen las lecciones de diseño.** Lo que
funciona y lo que falla ya está medido en sus reseñas:

- **Preview antes de aplicar** (Reclaim 2.0 *Preview Mode*, Morgen *AI Planner* con bloques que
  pulsan): la IA propone, el humano aplica. Motion, que mueve sin preguntar, acumula la queja «reorganiza
  sin criterio y sin Cmd+Z».
- **Estados visuales explícitos de fijo vs. movible** (Reclaim: contorno punteado = movible, sólido =
  defendido, candado = bloqueado por el usuario).
- **Botón efímero de reflow** (Akiflow *Schedule Optimizer*): tras un cambio manual aparece «Optimizar»
  unos segundos; si lo ignoras, tu cambio queda.
- **Explicar cada movimiento**: la queja número uno de Reclaim y Motion es «¿por qué cayó el jueves?».
- **IA en contexto, no en un chat**: en Google funciona «Suggested times» en el formulario y el banner
  «reprogramar con un clic»; el panel de chat de Gemini no mueve una reunión de hoy a mañana.
- **Crear por texto con preview en vivo** (Fantastical): mientras escribes, el bloque se dibuja en la
  rejilla y se puede arrastrar; el texto se reescribe.
- **Ritual de apertura y cierre del día** (Sunsama): una pantalla por paso, aviso de sobrecarga,
  «terminarías a las 19:40 vs. cierre 19:00», puntuación del día.
- **Paleta ⌘K con verbos del negocio** y atajos de una letra (Vimcal, Notion Calendar, Amie).

**Lo que ya tenemos nos deja bien parados.** Rejilla por barbero, pulso del día con filtro, tarjeta por
tamaño, playbook por estado, sugerencias por reglas, brief del día, lista de espera con hueco,
agendar por texto. Los huecos reales son cinco: (1) nada comprueba choques al crear ni al mover,
(2) ninguna sugerencia explica su «por qué» ni se puede previsualizar antes de aplicar, (3) no hay
reacomodo cuando un barbero se atrasa, (4) la rejilla no funciona en táctil ni en móvil, (5) no hay
apertura/cierre del día ni atajos. La propuesta de la sección 7 ataca exactamente eso.

---

## 2. Lo que tenemos hoy (inventario resumido)

Fuente: lectura del checkout `levantalo-localhost-b22896`.

| Área | Estado actual |
|---|---|
| Vistas | Agenda, Día (por defecto, filtro «Trabajando»), Semana (barbero × día con % de carga), Mes (ocupación por día). URL: `?fecha&vista&equipo&cita&foco&cliente`. |
| Rejilla del día | `ResourceDayGrid`: columna por barbero (mín. 9,5 rem, scroll horizontal), franjas de 30 min de 56 px, fuera de horario sombreado, línea roja de «ahora» con pastilla de hora, autoscroll, solapes en subcolumnas, bloqueos rayados al fondo. Arrastrar/estirar con imán a la franja (solo ratón y lápiz). Cabecera con avatar, barra de ocupación y «Libre {hora} · N citas». |
| Tarjeta de cita | `ScheduleEventCard`: <45 min una línea; ≥45 badge de cliente + servicios · precio; ≥60 rango horario; ≥75 detalle. Tono por estado (scheduled primary, arrived info, seated warning, paid positive, no_show negative, cancelled neutral). `urgent` «N min tarde» (≥5 min, solo hoy). Una sola alerta (alergia gana a «pidió a otro barbero»). Acción en la esquina (Check-in / Sentar / Cobrar). `faded` fuera de foco, `locked` si pagada o anulada. |
| Pulso del día | `pulseModel`: late, toCollect, waiting, seated, upcoming, paid; `collected` y `expected`. Chips urgentes «Tarde» y «Por cobrar»; menú radio con todos los estados. En Día apaga las demás tarjetas; en Agenda las oculta. |
| Drawers | Crear (cliente, un solo servicio, barbero, `TimeSlotPicker` 28 días, «Más»), Detalle (bloque «Ahora», stepper, botones del `appointmentPlaybook` por estado, edición en línea que guarda al cambiar, pestañas Resumen/Notas/Cliente/Historial), Cobro (propinas y recargo de Configuración, cambio, «agendar la próxima»), Bloqueo (choques), Lista de espera («Ofrecer» hueco de hoy), Venta rápida, Venta sin cita (barberos por quién queda libre antes), Lista de cobros, Asistente. Solo un panel a la vez. |
| «IA» (reglas, sin LLM) | `appointmentInsights`: riesgo de no-show, barbero no pedido, primera visita, VIP, upsell, re-agendar por cadencia. `dayBrief`: tarde, por cobrar, alergias, barbero ocioso (<40 %) o lleno (≥85 %), VIP y nuevos. `waitlistMatch`: primer hueco de hoy. `bookingText`: parser regex «Corte para Martín mañana a las 4 con Nicolás». `CalendarAssistantDrawer`: «Entendí: …» + «Hoy conviene mirar». Se rotula «Sugerencias de IA» con `AiGeneratedBadge`. |
| Estados | scheduled → arrived → seated → paid; no_show / cancelled con confirmación. Sin retroceso. `barberReady` aparte. |
| Deuda visible | Sin validación de choques (ni al crear, ni al arrastrar, ni en el mock); se agenda fuera de horario; alta de un solo servicio; sin táctil ni teclado para mover; sin vista móvil de un barbero; `waitlistMatch` y «Libre a las» solo para el día en pantalla; sin deshacer tras arrastrar; sin atajos; «IA» aplicado a reglas fijas. |

---

## 3. Qué hace cada producto

### 3.1 Google Calendar (Gemini) y Outlook (Copilot)

**IA en Google.** Panel lateral de Gemini (sparkle arriba a la derecha): crea, busca y consulta; no
añade invitados ni edita ubicación. «Add to Calendar» desde Gmail. «Help me schedule» en el redactor:
detecta que coordinas una reunión, sugiere huecos según tu agenda y el contexto («30 min la semana que
viene» → solo huecos de media hora esa semana), los inserta como chips; el destinatario elige. «Suggested
times» al crear reuniones (cruza zonas, horario laboral y conflictos) y banner de reprogramación con un
clic cuando varios rechazan. Daily Brief matinal en la app Gemini. Todo de pago salvo el brief.

**IA en Outlook.** «Schedule with Copilot» desde un hilo. Calendar Instructions: reglas en lenguaje
natural («bloquea 2 h los martes», «si tengo 3 reuniones seguidas sugiere una pausa»). «Automatically
reschedule with Copilot»: toggle por evento + «Acceptable times», solo 1:1, <5 h, máximo 5 reintentos,
elige la hora libre más cercana a la original y avisa en notificaciones. Agente «always-on» en beta.

**No-IA relevante.** Google *appointment schedules*: duración, antelación mínima, buffers, máximo por
día, co-anfitriones, formulario propio, Stripe solo de pago. Tasks que reservan tiempo como «ocupado».
Focus time con auto-rechazo. Outlook *Scheduling Assistant* (rejilla libre/ocupado de todos) y *Split
view* (columna por calendario, ahora por defecto). Bookings con personal, servicios con buffer antes y
después, sin cobro nativo.

**Diseño.** Google: Material 3, sidebar colapsable con «Create» en pastilla, mini-calendario, lista de
calendarios con casillas de color; rejilla con eventos rellenos del color del calendario, texto blanco,
30 min en una línea, solapes repartidos en ancho; línea de «ahora» roja con punto; clic-arrastre abre
popover (chips Evento/Tarea/Cumpleaños/Horario de citas, «Find a time» superpone calendarios); «z»
deshace; pasado atenuado. Outlook: eventos con **contorno y relleno** del color del calendario, días
pasados sombreados, badges «+N fuera de vista», panel «My Day» a la derecha.

**Críticas.** Google: tareas básicas, sin «gestión de capacidad», IA que no mueve una reunión de hoy a
mañana, bajo contraste. Outlook: «My Day» no se fija ni sigue al día seleccionado; en el formulario los
iconos cambian solos mientras escribes aunque Copilot esté apagado; Bookings pierde huecos por la
«lógica de carga de trabajo».

### 3.2 Fantastical, Amie y Notion Calendar

**Fantastical.** Parser de reglas («/trabajo» calendario, «at» lugar, «with» invitado, `!!!`
prioridad, repeticiones complejas, comillas para texto ambiguo); con Apple Intelligence el campo muestra
un **rainbow glow** mientras interpreta. Reenviar correos a `email@fantastical.app` (Gemini extrae
eventos y la app pide aprobar/editar/descartar). Extraer eventos de fotos y documentos. Conector MCP para
Claude y servidor MCP en la app (huecos libres, resumir la semana). *Openings*: enlaces de reserva con
varias duraciones, intervalo de inicio distinto de la duración, break time, lead time, límite por
día/semana, preguntas, aprobación manual, white-label, webhooks. *Proposals* (varias horas, el consenso
confirma). *Meet With* (superpone temporalmente la agenda de un compañero). *Calendar Sets* con atajo y
cambio automático por hora o lugar.

Diseño: **DayTicker** en iPhone (cinta de días con guiones de color cuya longitud es la duración de las
citas; lista debajo con hora encima del título). En Mac, ⌘N abre un campo de texto y el **preview se
dibuja en vivo** sobre la rejilla; se puede arrastrar el preview y el texto se reescribe. Imán de 15 min
(Shift lo quita), ⌥-arrastrar duplica. Iconos de disponibilidad: punto sólido ocupado, círculo libre,
prohibido no disponible. Lo «premium» es densidad alta pero legible, el color en bloques y guiones, la
animación del preview y la coherencia nativa.

Críticas: precio y que casi todo útil sea Premium; glitches que pesan en un negocio; Liquid Glass se
percibe como «cromo nuevo sobre interfaz cuadrada».

**Amie.** Tres paneles (inbox de tareas, rejilla, filtros). Chat contextual que crea eventos y redacta
correos. Grabador de reuniones sin bot. 11 colores + **emoji como icono** del evento; eventos completados
tachados; doble clic crea y autorrellena a partir de eventos parecidos. Críticas: bugs de sync, lag, sin
Android, IA de scheduling inmadura.

**Notion Calendar.** Gratis. Paleta ⌘K; D/W/M vistas; «.» salta a una fecha escrita; S comparte
disponibilidad arrastrando huecos y pegando un snippet; Z para zonas horarias. La IA vive en Notion Agent
(abril 2026): sugerencias de hora **rankeadas con rejilla de disponibilidad interactiva** y reserva en un
clic. Crítica: «muestra el trabajo pero no lo hace».

### 3.3 Morgen, Reclaim, Motion y Akiflow (planificadores con IA)

| | Quién decide | Cómo se ve lo propuesto | Reacomodo | Explica |
|---|---|---|---|---|
| **Morgen** AI Planner | Propone; el usuario aprueba | Eventos en preview que **pulsan**, no tocan el calendario real | Solo al volver a pulsar | No |
| **Reclaim** Agents / 2.0 | Actúa sola en ~15 s; en 2.0 todo cae en **Preview Mode** (sandbox con cascadas visibles, «Apply changes») | 🆓 contorno punteado = movible · 🛡️ sólido = defendido · 🔒 bloqueado | Automático; lo bloqueado nunca se mueve | Débil (queja principal) |
| **Motion** | Actúa sola, sin confirmación | Evento = «AT» fijo, tarea = «BY» flexible; exclamación roja si ya no cabe | Automático; lo no hecho rueda al día siguiente | No; sin Cmd+Z |
| **Akiflow** | Manual; *Aki* por chat/WhatsApp/Siri | Botón efímero **«Optimize schedule»** tras un cambio manual; reflow con deshacer en toast | Solo si aceptas | Conserva el orden relativo |

Motor: prioridades con empate explícito (Reclaim: Smart Meetings > Habits > Tasks > due más cercano;
eventos externos = P1), duración obligatoria con padding (Morgen +20 %), ventanas (Morgen *Frames* por
tipo de trabajo), buffers (decompression, travel), deadlines con «riesgo anticipado» (Motion avisa días
antes). Reclaim MCP tiene **permisos por tipo de acción**: auto-aprobar / necesita aprobación / bloquear;
las lecturas responden al instante, las escrituras caen en preview.

Diseño: panel de tareas a la izquierda + rejilla a la derecha en los cuatro; línea de «ahora»; «Up
Next» arriba a la derecha (Motion); arrastrar una tarea al calendario la **bloquea** (Reclaim añade el
candado). Ninguno documenta rayado: el patrón real es borde discontinuo + menos opacidad.

Críticas: «reprogramó una reunión que fijé», «hábitos eliminados sin razón», «reorganiza sin criterio»,
no re-optimiza sola (Morgen), «impuesto de replanificación manual» (Akiflow), facturación.

### 3.4 ClickUp Calendar, Vimcal y Sunsama

**ClickUp.** *Planner Sidebar* con las tareas en cuatro grupos; al pasar por una tarea aparece un **icono
de rayo**; la IA pinta huecos recomendados con borde y se confirma pulsando uno («Confirm work session»).
Orden: prioridades personales → urgente → vencimiento → normal → baja. Brain es una página completa de
chat («¿cuándo estoy libre?»), Brain MAX con *Talk to Text*. AI Notetaker de pago. Críticas que hay que
evitar: «agendas tremendamente optimistas», parte una tarea en trocitos durante el día, sin buffers,
duplicados con Google Calendar, IA de pago aparte, tareas vencidas ocultas bajo las de hoy.

**Vimcal.** Respuesta <100 ms; atajos para todo (M crear, T hoy, S cambiar vista, ? lista); *Command
Center* ⌘K con lenguaje natural; **Slots**: arrastras huecos sobre el calendario, ⌘C, y pegas en un
mensaje una lista de horas clicables con *holds* que se borran al confirmar; *Time Travel* por ciudad;
*Meet With*; dossier del asistente en el panel del evento. Crítica: «confunde productividad con atajos»
y no se pueden personalizar.

**Sunsama.** Poca IA por decisión: estimación de duración aprendida del histórico y etiquetado automático
de canal. Lo valioso es el **ritual**: planificación en pasos (revisar ayer → añadir tareas → carga
prevista con aviso de sobrecarga y «acabarías a las X vs. tu hora de cierre», teclas D aplazar y Z
backlog → ordenar y timeboxear → compartir) y **shutdown** a la hora elegida (hechas/no hechas, mover a
mañana, reflexión, highlights, puntuación, «Done for the day»). Crítica: «puede sentirse demasiado
estructurado».

### 3.5 Competencia directa de barbería y salón

| Producto | IA real en la agenda | Dónde está la IA | Cómo pinta la cita |
|---|---|---|---|
| **Fresha** | *Dynamic Reassignment* (reasigna citas sin profesional preferido, nunca las de profesional elegido; queda en el activity log); *Intelligent Processing Time*; waitlist que avisa al cliente | AI Concierge telefónico (99,95 USD/local/mes) | Color por **estado**: azul Booked, morado Confirmed, naranja Arrived, verde Started, gris Completed, rojo No-show. Día / 3 días / Semana / Mes, zoom Small/Large, orden de columnas por drag, la cita se ve en la columna del profesional y en la del recurso |
| **Booksy** | *Smart Schedule* (reglas que evitan huecos), waitlist automática, pre-autorización de tarjeta en reservas de riesgo | Google AI Mode reserva en su calendario | Icono $ verde al cobrar; filtro pagadas/no pagadas |
| **Square** | No | *Square Assistant* por SMS (confirma/reagenda) — los usuarios piden apagarlo | «Mark as No-Show» desde el detalle |
| **Squire** | *Smart Rebooking* (aprende la cadencia y manda el recordatorio en el momento justo) | SQUIRE AI contesta llamadas perdidas (add-on ~99 USD, no verificado) | Commander en iPad |
| **Mangomint** | **Intelligent Waitlist**: una cancelación o cambio de turno dispara alerta en la cabecera del calendario + email, reserva prellenada, cierre con *Express Booking* por SMS | Ninguna generativa | Color e iconos por estado; vista «checked in»; iPad para el cliente |
| **Boulevard** | *Precision Scheduling* (ordena huecos pegados a citas o que dejan gap útil de 30/60/90) | Billie, chatbot de soporte | Color por profesional + color tags; **iconos en la esquina**: Confirmed, Arrived, Paid, New, Staff requested, mensaje, memo, forms, Member, No-show; **Front Desk view** = kanban Arrived / Checked In / In Service / Completed, soltar en Completed abre el cobro |
| **Zenoti** | *Zeenie* (lenguaje natural dentro del producto, prompts de upsell/rebooking en el appointment book), *AI Retention Manager* (predice no-shows), *AI Employee Scheduler* | AI Receptionist 24/7 | — |
| **GlossGenius** | *AI Growth Analyst* (preguntas sobre datos) | *Reception* llamadas y SMS (50 USD/mes desde dic-2026) | Color por categoría de servicio, móvil-first |
| **Vagaro** | *Minimize Gaps*, *Fill My Books* | Vera Receptionist (manda enlace, no completa) | Calendario rediseñado mar-2026 con checkout desde el calendario |

Flujos: crear en un clic sobre el hueco (todos); reagendar por arrastre (Booksy, Boulevard, Mangomint,
Fresha); cobrar desde la cita (Booksy botón al pie, Boulevard con prebooking +4/+6/+8 semanas, Zenoti
autopuebla el ticket). **Nadie ofrece resumen del día** generado en la agenda.

Lo que valoran los barberos: «sleek», calendario claro, recordatorios. Lo que critican: precio y
«nickel and diming» (Squire), comisiones de Boost (Booksy), soporte, bots que responden «basura» y tapan
preguntas reales (Square Assistant), funciones que están en móvil y no en escritorio o viceversa.

---

## 4. Patrones transversales de diseño

1. **Columna por recurso, día como vista principal.** Todos los de barbería; Google solo lo tiene en Día
   y Outlook en Split view. Nuestra `ResourceDayGrid` ya es esto. Fresha añade zoom de densidad y orden de
   columnas por drag; Boulevard limita a 3 profesionales en Semana y 6 en 4 días.
2. **La tarjeta dice el estado con la forma, no solo con el color.** Outlook: contorno + relleno.
   Reclaim: punteado / sólido / candado. Boulevard: iconos en la esquina. Fresha: color por estado.
   Amie: tachado al completar. Fantastical: punto / círculo / prohibido.
3. **Línea de «ahora» + pasado atenuado + «Up Next».** Google y Outlook atenúan el pasado; Motion y
   Fantastical tienen «siguiente» arriba a la derecha.
4. **Creación en dos velocidades.** Popover rápido (Google) o campo de texto con preview en vivo
   (Fantastical) y «Más opciones» para el formulario completo. Nosotros ya tenemos el drawer completo y el
   parser; falta el preview sobre la rejilla.
5. **Paleta de comandos y atajos de una letra.** Notion, Vimcal, Amie, Google (c, t, d/w/m, z deshacer).
   Nosotros no tenemos ninguno.
6. **Panel lateral que empuja, no que tapa**, para tareas o IA (Morgen, Reclaim, ClickUp). Es lo que ya
   hace nuestro `SidePanelShell`.
7. **Disponibilidad copiable** (Vimcal Slots, Notion snippet, Google «Help me schedule» con chips).
8. **Rituales con pasos** (Sunsama) en vez de un tablero con todo a la vez.
9. **Nada de IA decorativa.** Lo que mejor valoran las reseñas son acciones en contexto con un
   resultado visible (Suggested times, banner de reprogramar, rayo de ClickUp). Lo peor: chats que no
   hacen, iconos que cambian solos, bots que responden mal.

## 5. Patrones transversales de IA (qué decide sola, qué pide, cómo explica)

| Principio | Quién lo hace bien | Qué pasa si no |
|---|---|---|
| Proponer en preview y aplicar con un botón | Morgen, Reclaim 2.0, ClickUp (huecos con borde), Notion Agent (rejilla rankeada) | Motion y Reclaim 1.x: «me movió lo que yo fijé» |
| Estados visuales de fijo / movible / bloqueado | Reclaim | Nadie sabe qué puede tocar la IA |
| Nunca mover lo que el cliente ya eligió | Fresha (solo citas sin profesional preferido), Reclaim (externos = P1) | Reasignaciones que el cliente no pidió |
| Reflow opcional y efímero tras un cambio manual | Akiflow | Replanificar a mano toda la tarde |
| Deshacer siempre | Akiflow (toast), Google («z») | Motion: sin Cmd+Z |
| Explicar cada movimiento y dejar rastro | Fresha (activity log) | Queja n.º 1 de Reclaim y Motion |
| Permisos por tipo de acción | Reclaim MCP (auto / aprobar / bloquear) | Todo o nada |
| Riesgo anticipado | Motion (exclamación roja), Zenoti (no-show predictivo), Booksy (pre-auth en riesgo) | Te enteras cuando ya pasó |
| Buffers y antelación por servicio | Google appointment schedules, Fantastical Openings, Fresha processing time | ClickUp: «agendas optimistas» sin buffers |
| Duración aprendida, no la del catálogo | Sunsama AI estimates | Citas que siempre se alargan |
| Llenar cancelaciones desde la lista de espera con un toque | Mangomint | Waitlist que hay que revisar a mano (Boulevard) |

---

## 6. Dónde estamos frente a ellos

| Capacidad | Mejor referente | Nosotros hoy | Hueco |
|---|---|---|---|
| Columna por barbero, ocupación, «Libre a las» | Fresha, Boulevard | ✅ | Zoom de densidad, orden de columnas |
| Pulso del día con filtro | Nadie lo tiene así | ✅ | — |
| Tarjeta por tamaño y estado | Boulevard (iconos), Outlook (contorno) | ✅ color por estado, una alerta | Forma por fijo/movible, varias alertas, iconos de origen (online, walk-in, nuevo) |
| Playbook por estado en el detalle | Boulevard Front Desk | ✅ | — |
| Crear por texto | Fantastical | ✅ parser regex, «Entendí: …» | Preview en vivo sobre la rejilla, multiservicio, ambigüedades |
| Validar choques, horario y buffers | Google, Fresha | ❌ | Crear, mover y mock sin validación |
| Sugerir huecos | Boulevard, ClickUp, Notion Agent | Parcial (`waitlistMatch` solo hoy) | Huecos rankeados con borde en la rejilla, buffers, cualquier día |
| Rellenar cancelaciones | Mangomint | Parcial («Ofrecer» en el drawer) | Alerta en la cabecera al cancelar, reserva prellenada, aviso al cliente |
| Reacomodo por retraso | Akiflow, Reclaim 2.0 | ❌ | Preview de cascada, botón efímero, deshacer, explicación |
| Riesgo de no-show | Zenoti, Booksy | ✅ regla (≥2 y ≥20 %) | Acción (confirmar, pre-autorizar), icono en la tarjeta |
| Resumen / brief | Google Daily Brief, Sunsama highlights | ✅ `dayBrief` | Apertura y cierre del día como ritual |
| Explicabilidad | Fresha activity log | ❌ | «Por qué» en cada sugerencia, log de quién movió qué |
| Atajos y paleta | Vimcal, Notion | ❌ | ⌘K con verbos del negocio, C/T/1-5/? |
| Táctil y móvil | Mangomint, GlossGenius | ❌ arrastre solo ratón | Vista de un barbero, long-press, botones de mover |
| Disponibilidad copiable | Vimcal Slots | ❌ | Seleccionar huecos y copiar para WhatsApp |
| Reglas en lenguaje natural por barbero | Outlook Calendar Instructions | ❌ | Fase posterior |

---

## 7. Propuesta de rediseño

Principios, en línea con lo ya acordado para el calendario (operación primero, piezas del sistema, IA en
panel aparte, nada de tableros apilados) y con `docs/DESIGN.md` (sin glassmorphism ni gradientes).

### 7.1 Principios

1. **La rejilla es la pantalla.** Todo lo demás (pulso, IA, drawers) es periférico y empuja, no tapa.
2. **La IA propone en la rejilla, no en un chat.** Cada sugerencia se ve como bloque con borde
   discontinuo y menos opacidad, con un botón «Aplicar» y otro «Descartar», y un «por qué» de una línea.
3. **Lo que el cliente eligió no se mueve solo.** Barbero pedido, hora confirmada por el cliente y citas
   cobradas son sólidas; la IA solo propone sobre citas sin preferencia o internas.
4. **Deshacer siempre.** Cualquier cambio (arrastre, reacomodo, reasignación) deja un toast con «Deshacer»
   y una entrada en el historial de la cita que dice quién lo hizo (persona o asistente) y por qué.
5. **Nada se agenda sobre otra cita ni fuera de horario sin avisar.** Validación de choques y buffers en
   el cliente y en el mock.

### 7.2 Arquitectura de la pantalla

- **Cabecera**: fecha con flechas y «Hoy», segmentado de vistas, selector de equipo, **pulso** como
  chips (como hoy), y a la derecha «Siguiente» (próxima cita que llega, por barbero al pasar el ratón).
- **Rejilla** (`ResourceDayGrid` evolucionada):
  - Zoom de densidad (compacta 40 px / normal 56 px / amplia 72 px por media hora), como Fresha.
  - Orden de columnas por arrastre y recordado por sucursal.
  - **Forma por naturaleza de la cita**: sólida (confirmada por el cliente o cobrada), contorno punteado
    (movible: sin barbero preferido, interna, lista de espera), candado pequeño (bloqueada a mano).
  - Iconos en la esquina (Boulevard): origen online / walk-in, cliente nuevo, pidió barbero, nota, alergia,
    pagada. Varias alertas, no una.
  - Pasado atenuado y «+N fuera de vista» al final de una columna con scroll.
  - Bloques de **sugerencia**: borde discontinuo + opacidad 60 % + etiqueta «Sugerido» con el «por qué».
- **Panel lateral** (`SidePanelShell`, uno a la vez, como hoy) para detalle, crear, cobrar, lista de
  espera y **asistente**.
- **Paleta ⌘K** con verbos del negocio: nueva cita, cobrar, mover a {barbero}, buscar cliente, ir a
  fecha («.» como Notion), bloquear, abrir/cerrar el día. Atajos: C crear, T hoy, D/W/M vistas, 1-9
  barbero, ? lista, Z deshacer. Remapeables (queja de Vimcal).

### 7.3 Crear en dos velocidades

- **Campo de texto con preview en vivo** (Fantastical): al escribir «Corte y barba para Martín mañana
  10:30 con Nicolás», el bloque se dibuja punteado en la columna de Nicolás; se puede arrastrar el preview
  y el texto se reescribe. Si falta algo (barbero, servicio ambiguo), el campo lo pide con chips, no falla.
  Mientras un modelo interpreta, el campo lleva un halo discreto (el «rainbow glow» de Fantastical, con
  nuestros tokens de motion).
- **Popover sobre el hueco** (Google): cliente + servicio + duración real sugerida; «Más opciones» abre el
  drawer completo con lo elegido.
- **Multiservicio** desde el alta, con duración sumada y buffer de limpieza por servicio.

### 7.4 La IA: cinco capacidades, en este orden

1. **Huecos sugeridos** (ClickUp + Boulevard + Notion Agent). Al crear o al ofrecer a la lista de espera,
   2-3 huecos resaltados con borde en las columnas, rankeados por: respeta el barbero pedido > deja menos
   gap (Precision Scheduling) > más cerca de la hora pedida. Buffers por servicio. Cualquier día, no solo
   hoy. Se confirma tocando el hueco.
2. **Rellenar cancelaciones** (Mangomint). Al cancelar o marcar no-show aparece una **alerta en la cabecera
   de esa columna**: «Hueco de 45 min a las 15:00 · 2 en lista de espera encajan». Un toque abre la
   reserva prellenada y propone el mensaje de WhatsApp al cliente.
3. **Reacomodo por retraso** (Akiflow + Reclaim 2.0). Si una cita se alarga o un barbero llega tarde,
   aparece durante unos segundos «Reacomodar el resto»; al pulsarlo se ve la **cascada en preview** (solo
   citas movibles, mismo barbero, orden relativo intacto, nunca más de X min sin confirmar al cliente),
   con «Aplicar» y «Deshacer». Cada cita movida guarda «movida 15 min porque la anterior se alargó».
   Permisos por acción: automático ≤10 min dentro del mismo barbero; confirmación para cambiar de barbero,
   cancelar o avisar al cliente.
4. **Riesgo anticipado** (Motion + Zenoti + Booksy). Icono rojo en la cita que, con el retraso acumulado,
   ya no cabe antes del cierre («terminarías a las 19:40 vs. cierre 19:00», Sunsama). El no-show de riesgo
   (regla actual) ofrece acción: confirmar por WhatsApp o pedir anticipo.
5. **Apertura y cierre del día** (Sunsama). Apertura en pasos: pendientes de ayer (cobros abiertos,
   no-shows sin marcar) → agenda por barbero con carga prevista y avisos → ajustar → «Abrir el día».
   Cierre a la hora configurada: cobradas / pendientes / no-shows, caja, highlights automáticos («14
   cortes, ticket medio, mejor hora, 2 clientes nuevos») y «Día cerrado». El `dayBrief` actual se convierte
   en estos dos rituales.

Después, no ahora: reglas en lenguaje natural por barbero (Outlook), duración aprendida por servicio ×
barbero × cliente (Sunsama), disponibilidad copiable para WhatsApp (Vimcal Slots), conector MCP para que un
asistente externo consulte y cree citas (Fantastical, Reclaim).

### 7.5 Táctil y móvil

- Vista de **un barbero** por defecto por debajo de `md`, con tira de barberos arriba (como el DayTicker
  de Fantastical, con guiones de color por ocupación).
- Mover una cita en táctil: long-press → modo mover con botones «−30 / +30 / otro barbero», sin arrastre.
- Lo mismo con teclado para accesibilidad.

### 7.6 Fases sugeridas

| Fase | Qué entra | Qué desbloquea |
|---|---|---|
| **A. Base sólida** | Validación de choques, horario y buffers (cliente + mock); deshacer en toast; multiservicio en el alta; forma por naturaleza de la cita e iconos de esquina; zoom y orden de columnas; pasado atenuado | Sin esto la IA propone sobre arena |
| **B. Crear rápido** | Preview en vivo del texto sobre la rejilla; popover sobre el hueco; huecos sugeridos rankeados; paleta ⌘K y atajos | La velocidad que valoran de Vimcal y Fantastical |
| **C. IA que propone** | Rellenar cancelaciones desde la cabecera; reacomodo por retraso con preview, permisos y explicación; riesgo anticipado; historial de quién movió qué | Lo que nadie en barbería tiene |
| **D. Rituales** | Apertura y cierre del día; highlights | Convierte el brief en hábito |
| **E. Táctil y móvil** | Vista de un barbero, long-press, teclado | Hoy es la deuda más visible |

Cada fase se cierra con `npm run check`, `npm run verify`, claro/oscuro y 375 px, y actualiza la página de
la doc del grupo `scheduling`.

---

## 8. Lo que no vamos a copiar

- **Chat como puerta principal de la IA** (Gemini, Brain): no mueve una cita; la IA va en contexto.
- **IA que mueve sin preguntar** (Motion, Reclaim 1.x) o que **parte una cita en trozos** (ClickUp).
- **Iconos que cambian solos** mientras escribes (Outlook) y **bots que responden mal** (Square Assistant).
- **Liquid Glass / glassmorphism y gradientes**: fuera por `docs/DESIGN.md`.
- **IA de pago aparte** o funciones que están en móvil y no en escritorio (Squire, ClickUp): una sola
  experiencia.
- **Atajos no remapeables** (Vimcal) y **rituales obligatorios** (Sunsama): el cierre del día se puede
  saltar.
- **Rotular «IA» a reglas fijas**: donde sea regla, se dice «Sugerencia» y se explica la regla; el badge
  de IA se reserva para lo que pase por un modelo.

---

## 9. Fuentes

### Google Calendar y Outlook
- https://workspaceupdates.googleblog.com/2025/10/help-me-schedule-meeting-gmail-calendar.html (2025-10-13)
- https://workspaceupdates.googleblog.com/2026/03/use-help-me-schedule-in-gmail-to-easily-set-up-a-meeting-time-with-multiple-guests.html (2026-03)
- https://workspaceupdates.googleblog.com/2026/01/improved-meeting-suggestions-gemini-calendar.html (2026-01-26)
- https://techcrunch.com/2025/03/07/google-adds-a-gemini-panel-to-calendar-to-help-you-manage-your-schedule/ (2025-03-07)
- https://9to5google.com/2025/03/10/gmail-add-to-calendar/ (2025-03-10)
- https://workspaceupdates.googleblog.com/2025/11/block-time-for-tasks-google-calendar.html (2025-11-06)
- https://workspaceupdates.googleblog.com/2025/08/pre-configured-appointment-booking-calendar.html (2025-08)
- https://support.google.com/calendar/answer/10729749 · /6110849 · /37034 (2026-10-01)
- https://chromeunboxed.com/google-is-rolling-out-gemini-daily-brief-to-free-users-dropping-the-paid-ai-requirement/ (2026-09-09)
- https://www.thurrott.com/cloud/312116/google-calendar-web-app-gets-refreshed-ui-and-dark-mode (2024-10-24)
- https://9to5google.com/2025/08/07/google-calendar-material-3-expressive-redesign/ (2025-08-07)
- https://www.usecarly.com/blog/google-calendar-ai-features/ (2026-03-09)
- https://www.capterra.com/p/213340/Google-Calendar/reviews (2026)
- https://techcommunity.microsoft.com/blog/microsoft365insiderblog/copilot-can-reschedule-conflicting-events-in-outlook/4471514 (2026-02-27)
- https://support.microsoft.com/en-us/office/automatically-reschedule-events-with-copilot-in-microsoft-outlook-and-microsoft-teams (2026-10-01)
- https://www.flotek.io/blog/microsoft-copilot-outlook-email-priority-calendar-instructions (2026)
- https://msftnewsnow.com/copilot-in-outlook-always-on-email-calendar-agent/ (2026-04-27)
- https://support.microsoft.com/en-us/office/outlook-calendar-has-a-new-look-1c04e438-d84a-44fc-a404-170c9007e65c (2026-10-01)
- https://techcommunity.microsoft.com/discussions/outlookgeneral/significant-changes-to-the-new-outlook-calendar-event-user-interface/4465236 (2025-10)
- https://learn.microsoft.com/en-us/answers/questions/5687366/can-i-pin-the-my-day-window-instead-of-having-it-d (2025)
- https://meetergo.com/en/magazine/microsoft-bookings (2026) · https://learn.microsoft.com/en-us/answers/questions/5642980/ (2025-12-02)

### Fantastical, Amie, Notion Calendar
- https://flexibits.com/blog/2025/09/apple-os-26-updates-starring-fantastical-4-1-and-cardhop-2-4/ (2025-09-15)
- https://flexibits.com/blog/2026/03/feature-spotlight-introducing-the-fantastical-connector-mcp-for-claude/ (2026-03-17)
- https://flexibits.com/blog/2026/03/new-feature-roundup-volume-3/ (2026-03-31)
- https://flexibits.com/blog/2026/07/new-feature-roundup-you-asked-we-built/ (2026-07-28)
- https://flexibits.com/blog/2026/09/apples-latest-dropped-and-so-did-fantastical-4-2-cardhop-2-5/ (2026-09-14)
- https://flexibits.com/help/adding-events-and-tasks · /help/openings · /help/calendar-sets · /help/keyboard-shortcuts · /help/calendar-views
- https://9to5mac.com/2025/05/27/fantastical-can-now-turn-your-email-into-calendar-events-using-ai/ (2025-05-27)
- https://www.macstories.net/reviews/the-new-fantastical-review/ · https://developer.apple.com/design/new-design-gallery-2026
- https://thesweetbits.com/tools/fantastical-review/ (2025-11-20) · https://www.capterra.com/p/210207/Fantastical/reviews/ (2026)
- https://amie.so/ · https://amie.so/changelog (#117–#132) · https://ellieplanner.com/comparisons/amie-calendar-review (2026-09-30) · https://clickup.com/blog/amie-calendar-review/ (2025-03-31) · https://www.producthunt.com/products/amie-2/reviews
- https://www.notion.com/product/calendar · https://www.notion.com/help/time-zones · https://www.notion.com/releases/2026-04-15 · /2026-04-17
- https://medium.com/vertical-bar-media/notion-calendar-introduces-scheduling-vbm-5ca12ed5571f (2025-04) · https://digitalbydefault.ai/blog/notion-calendar (2026-04-13)

### Morgen, Reclaim, Motion, Akiflow
- https://www.morgen.so/guides/plan-your-day-using-the-ai-planner · /guides/how-to-use-frames · /ai-planner · /for-ai (2026-10-01)
- https://changelog.morgen.so/ · https://thesweetbits.com/tools/morgen-review/ (2026) · https://www.morgen.so/blog-posts/akiflow-vs-motion (2026-01-13)
- https://help.reclaim.ai/en/articles/6207587 · /14846468-reclaim-ai-2-0-overview · /15280604-reclaim-2-0-faq · https://reclaim.ai/integrations/claude (2026)
- https://www.g2.com/products/reclaim-ai/reviews?qs=pros-and-cons · https://thebusinessdive.com/reclaim-ai-review (2026)
- https://www.usemotion.com/help/time-management/auto-scheduling/reference-auto-scheduling/how-auto-scheduling-works-behind-the-scenes · …/free-vs-busy-tasks-in-motion
- https://hirekai.ai/blog/motion-app-review (2026) · https://juliety.com/motion-app-review
- https://product.akiflow.com/changelog/sunny-akiflow-summer-release (2026-06-25) · https://product.akiflow.com/en/help/articles/3161671-schedule-optimizer · https://www.usecarly.com/blog/akiflow-review/ (2026)
- https://zapier.com/blog/best-ai-scheduling/ (2026-09) · https://flowsavvy.app/ai-calendar-apps (2026-09-28)

### ClickUp, Vimcal, Sunsama
- https://techcrunch.com/2025/03/13/clickup-is-launching-a-revamped-calendar-tool-for-task-and-meeting-management (2025-03-13)
- https://help.clickup.com/hc/en-us/articles/35975611704087-Schedule-tasks-from-your-Planner · /29051586233879-What-is-the-Planner (indexado; 403 a fetch)
- https://releasebot.io/updates/clickup (2025-12 → 2026-08) · https://www.zenpilot.com/blog/clickup-4-review/ (2026-07-06) · https://www.zenpilot.com/clickup-ai/
- https://www.meetjamie.ai/blog/clickup-ai-note-taker-review (2026-01-09) · https://feedback.clickup.com/feature-requests/p/enhance-ai-time-blocking-with-smarter-scheduling-features (2025-06 → 2026-04)
- https://www.g2.com/products/clickup/reviews (2026-09) · https://www.producthunt.com/products/clickup/launches/brain-max-by-clickup (2025-07-16)
- https://vimcal.com · https://makerstack.co/reviews/vimcal-review/ (2026-07-20) · https://theeacampus.com/blog/review-of-vimcal-ea/ (2025-04-01) · https://www.producthunt.com/products/vimcal/reviews
- https://www.sunsama.com/features/ai · https://help.sunsama.com/docs/usage-guides/daily-planning/ · https://roadmap.sunsama.com/changelog/daily-shutdown · https://thebusinessdive.com/sunsama-review (2026-05-28) · https://dhruvirzala.com/sunsama-review/ (2026-05-22)

### Barbería y salón
- https://www.fresha.com/blog/fresha-ai-powered-intelligent-scheduling-beauty-wellness (2026-05-08) · https://www.fresha.com/blog/Up-Next-2026 (2025-12-19)
- https://www.fresha.com/help-center/knowledge-base/calendar/101735-set-up-dynamic-reassignment-for-appointments · /600-update-appointment-statuses · /16-manage-your-calendar-display-settings- · /290-customize-your-calendar-view-1
- https://www.usecarly.com/blog/fresha-ai/ · /booksy-ai/ · /boulevard-ai/ · /vagaro-ai/ (2026-07)
- https://biz.booksy.com/features/calendar-scheduling · https://biz.booksy.com/en-us/whats-new (2026-01 → 04) · https://biz.booksy.com/blog/booksy-google-ai-mode-integration · https://support.booksy.com/hc/en-us/articles/16465470458642
- https://squareup.com/us/en/appointments/scheduling-features/square-assistant · https://community.squareup.com/t5/Appointments-Bookings/If-I-turn-Square-Assistant-off/m-p/774754
- https://getsquire.com/business-edge/introducing-squire-ai (2025-08-11) · /engage-with-smart-rebooking · https://www.capterra.com/p/153899/Squire-Barber-Appointment-App/reviews/
- https://www.mangomint.com/blog/intelligent-waitlist-is-here/ · https://www.mangomint.com/features/scheduling/ · https://www.mangomint.com/blog/best-new-mangomint-features-of-2025/
- https://support.boulevard.io/en/articles/5941397-using-the-calendar-view · /5941417-appointment-status-icons · /5941360-using-the-front-desk-view · https://thesalonbusiness.com/boulevard-software-review/
- https://www.zenoti.com/ai-first-lp · https://www.zenoti.com/press/zenoti-expands-its-ai-workforce-purpose-built-ai-agents-for-every-medspa-workflow (2026-04-28)
- https://genius.ai/reception · https://mastra.ai/customers/glossgenius · https://www.vagaro.com/pro/updates/updated-calendar (2026-03-02)
- https://www.capterra.com/p/142741/Booksy/ · /142138/Shedul-com/ · /122035/SetMore/reviews/
