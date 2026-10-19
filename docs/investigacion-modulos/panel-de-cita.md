# El panel de una cita: benchmark y cinco propuestas

2026-10-17. Qué se abre al tocar una cita en el calendario. Se investigaron 20 programas de barbería y
salón y 25 de otras industrias (calendarios, salud, restaurantes, hoteles, servicios de campo, estudios
de fitness y productos como Linear o Notion). Con eso se construyeron **cinco versiones** del panel
que se pueden comparar en la app, más la actual.

**Cómo verlas:** abre una cita en `/calendario`; arriba del panel está el selector «Diseño del panel».
La elección se recuerda por persona (`localStorage`) y un enlace con `?panel=cards|moment`
abre directo una versión. Código en `src/features/calendar/appointmentPanel/`.

> **2026-10-18: segunda ronda.** Las cinco versiones de la sección 4 (Como la reserva, Mostrador, Ficha
> del cliente, Recorrido y Modo silla) se reemplazaron por otras cinco que siguen las reglas del usuario.
> Están en la sección 7; la 4 queda como historia.
>
> **2026-10-18, elección:** quedan **Pestañas (actual)**, **Arma la cita** y **Tarjeta del momento**.
> Se quitaron «Lo de ahora + índice», «Pestañas por estado» y «Paso a paso» (código incluido); su
> descripción sigue en la tabla de la sección 7.

---

## 1. Qué le pasa al panel de hoy

| Problema | Por qué importa |
|---|---|
| **«Cobrar» queda debajo del pliegue.** Con citas enlazadas, la acción principal está al final de Resumen y hay que bajar para verla. | Es lo único que se hace en cada cita. Booksy, Boulevard y Cloudbeds la ponen fija abajo. |
| **Cinco pestañas.** Clipper, notas, cliente e historial esconden lo que en el mostrador se quiere de un vistazo. | Phorest, AgendaPro y Google resuelven el día a día en un solo nivel; las pestañas son para el detalle. |
| **Las alertas se pierden al bajar.** La alergia es un `Alert` más en el scroll. | Epic (Storyboard), Cerner y Cliniko las dejan fijas: es seguridad, no información. |
| **El avance no guarda horas.** El `Stepper` dice «Llegó», pero no a qué hora ni cuánto esperó. | Housecall Pro y Open Dental guardan la hora de cada paso: con eso salen esperas, retrasos y la duración real (nómina, métricas). |
| **Agendar la próxima es un solo botón genérico.** | Boulevard ofrece 4/6/8 semanas en el cobro y Mangomint el rebook al terminar: en barbería la frecuencia es el motor del ingreso. |
| **Nota de la visita y nota del cliente mezcladas.** | Resy, Cliniko y Phorest las separan: «viene con su hijo» no es «piel sensible». |
| **El cliente casi no se ve.** Visitas, ritmo y cumplimiento viven en la pestaña Cliente. | Nadie en barbería pone valor y fiabilidad dentro de la cita (AgendaPro los manda a la ficha); es una oportunidad. |

## 2. Lo que hace el mercado

### Barbería y salón

| Producto | Forma | Acción principal | Lo único |
|---|---|---|---|
| Mangomint | Agenda y cobro en una pantalla | Checkout | Sala de espera con «Notify» al cliente; rebook justo después de cobrar ([fuente](https://www.mangomint.com/learn/waiting-room/)) |
| Boulevard | Ventana con botones en secuencia | Confirmed → Arrived → Checkout | Prebook 4w/6w/8w dentro del cobro ([fuente](https://support.boulevard.io/en/articles/5941405-prebooking-appointments)); banner rojo de alerta |
| Fresha | Vista de cita: cliente a la izquierda, acciones a la derecha | Estado arriba a la derecha | No-show solo después de la hora ([fuente](https://www.fresha.com/help-center/knowledge-base/calendar/600-update-appointment-statuses)); staff alerts |
| Vagaro | Menú de estado + popup de cobro | Change Status | «Show» avisa al barbero por push; notas de alergia y fórmula; popup notes ([fuente](https://support.vagaro.com/hc/en-us/articles/28544779074971)) |
| Phorest | Un clic: barra de acciones; doble clic: editor | Check In | Últimas 10 notas de cita con fecha; naranja = pasó la hora sin llegar ([fuente](https://support.phorest.com/hc/en-us/articles/360016457700)) |
| Timely | Menú rápido + editar y guardar | Desplegable de estado | Antipatrón: marcar «llegó» pide editar, elegir y guardar ([fuente](https://help.gettimely.com/hc/en-gb/articles/27958234739351)) |
| Booksy | Pantalla de detalle (app) | Checkout al pie | Cliente de confianza tras N visitas; protección contra plantones |
| Zenoti | Menú contextual + perfil lateral compacto o expandido | Estados en fila | Hasta 4 iconos configurables (alergia, fidelidad, gasto) |
| Meevo | «Smart Assistant» | Check Out | Estado «Running Late» |
| AgendaPro | Cuadro resumen + doble clic | Estado + pago | WhatsApp sin entrar a la cita ([fuente](https://ayuda.agendapro.com/es/articles/6493471-como-modificar-o-editar-una-cita)) |
| Square | Página de detalle | More → No-show | No tiene check-in: lo piden desde 2024 |
| Squire, theCut, GlossGenius | App del barbero a pantalla completa | Cobrar / Tap to Pay | Ticket armado desde la agenda; notas de máquina y estilo |

Quejas que se repiten: «demasiados clics», el panel se queda abierto después de pagar (Mangomint), reprogramar es difícil y el gris se lee mal (Squire), falta ver quién movió o canceló (Boulevard).

### Otras industrias

| De dónde | Qué se lleva una barbería |
|---|---|
| Google Calendar, Outlook, Open Dental | **Dos niveles**: un vistazo rápido y el detalle aparte. Editar nunca es lo primero. |
| Cloudbeds (calendario nuevo), Jane App | **El botón principal cambia según el estado y la hora**; en Jane «Llegó» se aplica y se deshace con un clic, y la tarjeta dice si debe o pagó ([fuente](https://jane.app/guide/patient-arrivals-no-shows)). |
| Housecall Pro, ServiceTitan | **Pasos en secuencia con hora guardada** (On my way → Start → Finish) ([fuente](https://help.housecallpro.com/en/articles/5416935-tracking-time-on-jobs)). |
| Epic Storyboard, Cerner, Cliniko | **Alertas siempre visibles**, con texto (no solo icono) y visibilidad por rol ([fuente](https://ehealth.connect-care.ca/epic-systems/epic-modules/storyboard)). |
| SevenRooms, Resy, Mariana Tek, Mews | **Etiquetas junto al nombre**, automáticas y con umbral (primera visita, frecuente, membresía); nota de visita aparte de la del cliente; resumen antes del turno ([fuente](https://helpdesk.resy.com/en_us/how-to-add-visit-notes-and-guest-notes-in-resyos-BkmZfvmI_.md)). |
| Mews | **«Smart tips» y resumen con IA bajo pedido**, no siempre a la vista ([fuente](https://help.mews.com/s/article/The-Smart-detail-window-in-the-Timeline)). |
| Morgen | **La IA propone en vista previa y la persona aprueba.** |
| Notion, Linear, Apple Calendar | **Peek lateral** que cambia de contenido al elegir otro elemento sin cerrarse; J/K para recorrer; tres tamaños (lateral, centro, página) ([fuente](https://linear.app/docs/peek)). |
| Intercom | **Disposición del panel por rol.** |

Antipatrones a evitar: abrir un formulario para mirar; alertas que se pierden con el scroll o que solo son un icono; etiquetas que se fían de un solo dato (OpenTable marca «alto gasto» por una cena de empresa); botones al mismo nivel sin uno principal; IA que escribe sin preguntar; modal centrado que tapa la agenda; depender de arrastrar en el móvil.

## 3. Lo que debe tener el panel, por orden de importancia

1. **Quién, qué, cuándo y con quién** en una línea: nombre y foto, servicio, hora, barbero.
2. **El estado**, con el mismo color de la tarjeta de la agenda.
3. **Una sola acción siguiente** según estado y hora (Ingresar → Sentar → Cobrar → Agendar próxima), **siempre a la vista**.
4. **Alertas críticas fijas** (alergia, medicación), con texto.
5. **Etiquetas del cliente pegadas al nombre**: primera visita, pidió a este barbero, plantones, membresía, en línea, trae foto.
6. **Cobrar con el ticket armado** (servicios, productos, propina) sin salir de la agenda.
7. **Contacto a un toque**: llamar y WhatsApp.
8. **Cuánto falta o cuánto lleva**: «empieza en 12 min», «esperando hace 6 min», «se pasó 10 min».
9. **Hora real de cada paso**: llegó, silla, cobro.
10. **Agendar la próxima en un toque**: por su ritmo o a 3/4/6 semanas.
11. **Nota de la visita aparte de la del cliente**, y la foto de referencia.
12. **Fiabilidad y valor del cliente**: visitas, ritmo, última vez, cumplimiento, membresía.
13. **No-show y cancelación al menú**, en rojo, habilitados solo cuando tienen sentido.
14. **Historial de cambios**: quién la creó, movió o canceló.
15. **Lo que sabe Clipper**, bajo pedido y marcado como IA.

## 4. Las cinco propuestas

Todas leen la cita con `useAppointmentModel` (mismos datos, mismo playbook, mismas acciones) y comparten
piezas (`PanelParts.tsx`): etiquetas, alertas, membresía, notas separadas, atajos de reagendar. Cambian el
orden, el peso y la pregunta que responden primero.

| | 1 · Como la reserva en línea | 2 · Mostrador | 3 · Ficha del cliente | 4 · Recorrido de la visita | 5 · Modo silla |
|---|---|---|---|---|---|
| **Pregunta** | ¿Qué reservó? | ¿Qué hago ahora? | ¿Quién es? | ¿Cómo va la visita? | ¿Qué le hago? |
| **Para** | Recepción que atiende una llamada sobre una reserva; coherencia con lo que ve el cliente | Recepción con fila | Dueño, barbero que fideliza | Dueño que revisa, disputas, retrasos | Barbero en la tablet |
| **Se inspira en** | Nuestra reserva en línea (tarjeta, membresía, atajos, «Tu orden») | Epic, Jane, Housecall Pro, Cloudbeds, SevenRooms | SevenRooms, Mews, Jane, Attio | Housecall Pro, Open Dental, ServiceTitan | Housecall Pro, Mariana Tek, pre-shift de SevenRooms |
| **Arriba** | Número de reserva y de dónde salió | Alergias fijas + etiquetas | Etiquetas + 4 números | Servicio, barbero, precio | La foto de lo que pidió |
| **Centro** | La tarjeta de la reserva, atajos en tarjetas, nota, membresía, «La cuenta» como ticket | Estado + reloj, avance con horas reales, la cita en filas, notas separadas | Membresía, esta cita en una fila, preferencias, próxima visita con atajos, Clipper bajo pedido | Línea de tiempo: reservó, cambios, llegó (antes o después de su hora), silla (cuánto esperó), termina, cobro, próxima | Servicio grande, reloj, «No olvides», «Antes de empezar» con Clipper |
| **Acción** | Botón ancho fijo abajo, como «Continuar» de la reserva | Pie fijo: llamar, WhatsApp, acción grande, menú | Pie: «Abrir ficha» + acción | El botón vive en el paso en curso; el pie solo trae lo raro | Un solo botón grande, sin importe |
| **Dinero** | Sí, el ticket completo | Precio en filas | Precio en la fila | Cobro con método y propina | No (es de la caja) |
| **Riesgo** | Más largo; repite lo que ya dice la tarjeta de la agenda | Denso para el barbero | La cita queda en segundo plano | Menos directo para quien solo quiere cobrar | Pobre para recepción |

### Recomendación

**Mostrador como panel por defecto**, porque responde lo que se pregunta en el mostrador y arregla los tres
problemas grandes (acción fuera de vista, alertas que se pierden, sin horas reales). **Modo silla** para
el rol barbero (la disposición por rol de Intercom), y **Ficha del cliente** como vista ampliada desde
«Abrir ficha». Del **Recorrido** conviene llevarse la línea de tiempo con horas a la pestaña Historial;
de **Como la reserva**, la tarjeta y «La cuenta», para que recepción y cliente hablen de lo mismo.

## 5. Lo que se hizo además

- La semilla del simulador guarda la **hora real de llegada, silla y cobro** de cada cita empezada
  (`visitSteps` en `src/mocks/calendar/seed.ts`; sale del id, no cambia la agenda). `SCHEMA_VERSION` pasó a 26.
- La próxima visita sugerida se cuenta **desde esta cita** más el ritmo del cliente.
- La membresía usa la regla de Configuración (un corte de cortesía cada 10 visitas).

## 6. Lo que queda fuera (y conviene después)

- **Vistazo al pasar el ratón** sobre la tarjeta (Google, Open Dental): complemento de cualquier versión.
- **J/K para recorrer citas** con el panel abierto y atajos propios del panel (L llegó, C cobrar).
- **Deshacer un cambio de estado** con un clic (Jane): hoy el cambio de estado no se deshace.
- **Avisar al barbero que llegó su cliente** (Vagaro «Show», Mangomint «Notify»).
- **Motivo al cancelar o marcar plantón** (ServiceTitan) y **política de cobro** en el mismo paso.
- **Depósito, deuda y saldo** en la cita: el contrato del calendario aún no los trae.
- **Gasto total y ticket medio** del cliente: tampoco están en el contrato; los números de la ficha usan
  visitas, ritmo, última vez y cumplimiento.
- **Elegir la versión por rol** desde Configuración, en vez de por persona.

---

## 7. Segunda ronda (2026-10-18): lo que pidió el usuario

Al ver la primera ronda, el usuario pidió:

1. **La primera pantalla depende del estado.** Si ya se cobró, lo que se necesita en ese momento es
   agendar la próxima para decírselo al cliente. Si aún no ha ingresado, la cita se cambia rápido, en
   los mismos campos, con tarjetas como en la reserva en línea.
2. **Clipper como botón que abre su panel lateral**, donde se escribe y se pregunta sobre la cita y el
   cliente.
3. **La nota y la foto de la reserva en línea a la vista** antes de ingresar y en la silla.
4. **El avance (stepper) arriba**, como en el panel actual, y **navegar a otros elementos**, por ejemplo
   un botón de cliente que abra su detalle.
5. **La membresía va con el cliente.** La información tiene que estar ordenada y agrupada: primero lo
   que se necesita en ese momento y estado de la cita, y luego opciones para ver más y entrar al detalle
   sin salir del panel.
6. **Acciones rápidas en tarjetas, como en la reserva en línea.** Si el cliente va tarde: llamar,
   escribir, «No asistió» o cancelar, aunque la acción principal siga siendo Ingresar.
7. **Revisar la traducción de «no show».** Ahora es «No asistió»; «Marcar plantón» desaparece y
   «Plantones» pasa a «Inasistencias».
8. **Parecerse de verdad a la reserva en línea.** La versión de la primera ronda no se parecía.

### Lo que comparten las cinco

| Pieza | Qué hace | Archivo |
|---|---|---|
| Avance con horas | Agendada · Llegó · En silla · Cobrada, con la hora real de cada paso | `PanelShared.tsx` (`PanelStepper`) |
| Titular del momento | En la letra de la reserva: «Llega a las 9:30», «Va 12 min tarde», «Llegó hace 3 min», «En la silla con Paola», «Listo para cobrar», «Cobrada US$ 45», «No asistió» | `StageParts.tsx` + `stageTitle` |
| Lo que pidió al reservar | Nota entre comillas y fotos del corte, con el origen («Reservó en línea hace 2 días»). Se ve antes de ingresar, esperando y en la silla | `BookingRequest` |
| Ticket | «La cuenta» con el `OrderSummary` de la reserva, al terminar | `TicketSummary` |
| ¿Le agendamos la próxima? | Cobrada o cerrada sin atender: abre en el día que toca por su ritmo (o a 4 semanas), muestra solo las horas libres de su barbero y la agenda con un toque | `NextVisitBooker` + `useFreeSlots` |
| La cita en tarjetas | Servicios, barbero y día y hora como los campos de «Arma tu cita», que abren su lista en su sitio (título serif, filas con foto, pie con el botón). Antes de ingresar se cambia todo; después, barbero y hora llevan candado y los servicios se pueden sumar hasta cobrar | `AppointmentFields` + `bookingStyle.tsx` |
| Atajos en tarjetas | `ActionTile` apiladas con icono en círculo, como «Lo que puedes hacer» de la confirmación. Tarde: llamar, WhatsApp, No asistió, cancelar. Por llegar: llamar, WhatsApp, cambiar, cancelar. Esperando: barbero listo, sumar servicio, WhatsApp, cancelar. Silla o por cobrar: sumar servicio, Clipper. Cobrada: WhatsApp, Clipper | `QuickTiles` + `quickActions` |
| Cliente agrupado | Una fila con el anillo de la membresía lleva a su página: membresía, su ritmo (viene, última, próxima), ¿cumple? (visitas, inasistencias, cancelaciones), lo que hay que cuidar, preferencias y contacto, y «Abrir ficha» | `ClientPage.tsx` |
| Historial | La línea de tiempo con horas reales de la primera ronda, ahora como página | `HistoryTimeline.tsx` |
| Pregúntale a Clipper | Abre el panel del agente con la cita como foco. Llega con la primera pregunta hecha y contesta alertas, lo que pidió, ritmo, si cumple, membresía, próxima, barbero, qué ofrecer, contacto y precio. Lo que no es de la cita lo responde la ayuda | `appointmentAgent.ts`, `src/lib/chat/agentFocus.ts`, `AppLayout` |
| Pie | La acción principal ancha y dorada, como «Continuar»; lo raro, al menú | `PanelFooter` |

### Las cinco versiones

| | 1 · Lo de ahora + índice | 2 · Arma la cita | 3 · Pestañas por estado | 4 · Tarjeta del momento | 5 · Paso a paso |
|---|---|---|---|---|---|
| **Idea** | Arriba solo lo del momento; debajo, un índice que abre cada cosa en su página con «Volver» (side peek de Notion, ajustes de iOS) | La cara de «Arma tu cita»: preguntas con su campo-tarjeta siempre a la vista | El panel de siempre, pero la primera pestaña es «Ahora» y cambia con el estado | Una tarjeta grande teñida por el estado, con lo esencial y el botón dentro | El avance es el menú: cada paso hecho y el actual se tocan y muestran lo suyo |
| **Cambiar la cita** | En la página «La cita» | En su sitio, en la pantalla principal | Pestaña «La cita» | Página «La cita» | Paso «Agendada» (o «En silla» para sumar) |
| **Cliente** | Fila del índice → página | Tarjeta «¿Quién viene?» → página | Pestaña «Cliente» | Tarjeta «Cliente» → página | Fila → página |
| **Acción principal** | Pie | Pie | Pie | Dentro de la tarjeta | Pie |
| **Para quién** | Recepción que quiere poco a la vista | Quien ya conoce la reserva en línea; cambiar citas por teléfono | Quien está acostumbrado al panel actual | Mostrador con prisa; tablet | Dueño o barbero que revisa cómo fue la visita |

Cobrada, cancelada o «No asistió»: el pie desaparece porque la próxima se agenda en el cuerpo.

### Pendiente

- La próxima agendada no se recuerda al reabrir el panel: si el cliente ya tiene una cita futura, el
  panel debería decirlo en vez de ofrecer otra. El contrato del día no trae las citas futuras del
  cliente.
- En «Paso a paso», el stepper no marca qué paso se está mirando; una línea lo avisa.
- Con el panel de Clipper y el de la cita abiertos a la vez, la agenda se estrecha mucho por debajo de
  1280 px.
- Clipper contesta con reglas por palabras (`topicOf`). Con un modelo detrás, el foco (`AgentFocus`) es
  el mismo y solo cambia `answer`.

## 8. Ajustes tras la elección (2026-10-18)

- **Cobrada, no asistió o cancelada** (`AfterVisit.tsx`): solo lo que sigue con el cliente. Arriba
  *Enviar recibo* (WhatsApp con el detalle), *Ver recibo* y *Devolver* (la cuenta en Transacciones, con
  permiso de editar transacciones); luego *¿Le agendamos la próxima?*, *Lo que se cobró*, las citas
  enlazadas y el cliente. Se quitan la cita editable, la nota para el barbero y las alertas.
- **Origen** visible y discreto bajo el titular: «Reserva en línea · hace 9 días», «Con cita previa ·
  agendada hace 8 días» o «Sin cita previa». Las etiquetas del cliente van en la vista principal, no
  dentro de su página.
- **Productos** de la cita (los de la reserva en línea o los sumados en caja) como tarjetas.
- **Tarjetas de la cita** neutras en reposo; el filo y el tinte de marca solo en la que está abierta.
- **Notas del cliente**: sin notas de un tipo, un estado vacío con «Agregar nota» en el mismo recuadro.
- **Buscador** (`CalendarSearch`, `searchModel.ts`): lupa a la izquierda de «Día» que se abre en un
  campo; busca por nombre, celular, barbero, servicio, estado, tipo, origen, notas, día y hora entre un
  mes atrás y 45 días adelante (`GET /calendar/appointments`).
- **Foto del corte** en la demo: las citas cuya nota dice «Trae foto de referencia» la traen.
- **2026-10-18, más tarde:** se quitó el diseño de **pestañas** (quedan «Arma la cita», por defecto, y
  «Tarjeta del momento»). Ya en la barbería (esperando, en silla, por cobrar) no hay atajos: la acción
  es la del pie y lo raro queda en «⋯». Clipper va siempre como su botón, también en la cobrada. Del
  panel de pestañas se conservan la confirmación y los mensajes de WhatsApp (`AppointmentMessages`) y
  el cobro por lo que falta (`appointmentBill`: impuesto de la sucursal, menos lo pagado en línea).

## 9. Tercera versión y «Fijar la cita» (2026-10-18, noche)

- **«Tarjeta + Arma la cita»** (`?panel=mix`, `MixVersion` en `PanelVersions.tsx`): el paso a paso
  arriba; la tarjeta del momento con *¿Qué se va a hacer?* editable en las mismas tarjetas de «Arma la
  cita» y la acción principal dentro; debajo, alertas, *Comentarios y foto del corte*, los atajos, la
  confirmación por WhatsApp, enlazadas y *¿Quién viene?* como en «Arma la cita»; Clipper y la actividad
  de la cita como en «Tarjeta». Cobrada, no asistió o cancelada: igual que en «Tarjeta».
- **Fijar la cita** (`PinSeries.tsx` + `pinPlan.ts`), como en la reserva en línea: atajo «Fijar» en la
  cobrada (las tres versiones). Cada 1–4 semanas (por defecto, el ritmo del cliente), 2/3/4/6 más, y
  *Así quedarían* antes de confirmar. Para cada fecha se pide la agenda del día: misma hora si el
  barbero está libre; si no, la libre más cercana (marcada «Otra hora»); «Sin hueco» si no cabe, y «Ya
  agendada» si el cliente ya tiene cita ese día. Solo se agendan las que caben; mientras se fija,
  *¿Le agendamos la próxima?* se oculta.

## 10. Una sola versión (2026-10-18, noche)

- El usuario se quedó con **«Tarjeta + Arma la cita»**: se borraron «Arma la cita», «Tarjeta del
  momento», el selector y `panelVersion.ts`. El cuerpo vive en `appointmentPanel/PanelBody.tsx`.
- **Cabecera**: ya no es el cliente sino cuándo es la cita (día; hora de inicio a fin y duración).
- **El cliente es una tarjeta** bajo *¿Quién viene?*, arriba de *¿Qué se va a hacer?* (tipo y
  celular). Abierta, «Sobre {nombre}»: membresía y ritmo (lleva a su página), visitas, última visita,
  barbero de siempre y contacto; al pie, *Ver todo del cliente*. También en la cobrada.
- **Comentarios y foto del corte** es una tarjeta más, debajo de *Día y hora*: cerrada muestra el
  comentario y la primera foto; abierta, todo y *Editar*; vacía, abre el formulario.
- **WhatsApp → SMS o correo** en todo el calendario: el atajo *Escribir* y *Enviar recibo* abren un
  menú SMS / Correo (`sms:` y `mailto:` con el recibo ya escrito; con un solo canal, va directo). La
  acción `whatsapp` pasó a `message`. El cliente de la agenda tiene `email` (la demo lo saca del
  nombre; uno de cada cinco no lo dejó). Los mensajes automáticos se titulan «Correo y SMS».
- Lo raro (cancelar, no asistió… ya en la barbería) va al «⋯» junto a la acción principal, sin repetir
  lo que ya está en los atajos.

## 11. Alertas juntas, cambiar el cliente y «Ver en la agenda» (2026-10-19)

- **Atención** (`CareAlerts.tsx`): el riesgo de no venir, las alergias y los medicamentos van juntos,
  bajo las etiquetas, como píldoras cortas con la misma cara (qué es y el comienzo del texto). Lo
  completo —las razones del riesgo y qué hacer, la nota entera— va en el tooltip. El riesgo bajo no se
  muestra. Los mensajes de la cita ya no repiten el riesgo, y el aviso de envíos simulados es un icono
  con tooltip.
- **Cambiar el cliente** desde su tarjeta (`ClientField.tsx`), solo mientras la cita sigue agendada:
  buscar por nombre o celular y tocarlo. En cuanto llega, la visita es de quien vino y no cambia. La
  API acepta `clientId` en el PATCH (solo `scheduled`): quita la confirmación y pasa los avisos al nuevo.
- **Ver en la agenda** (citas enlazadas) además de resaltarlas lleva la rejilla hasta la primera:
  antes el filtro se activaba pero las citas quedaban fuera de la vista.

## 12. Cabecera con iconos, confirmación como estado y enlazar desde «⋯» (2026-10-19)

- **Cabecera**: *Actividad de la cita* (reloj) y *Pregúntale a Clipper* son botones terciarios solo
  icono, con su nombre en el tooltip (`headerActions` de `DrawerShell` y `SidePanelShell`). Ya no van
  al final del panel.
- **Comentarios y foto del corte** solo aparece si hay algo; sin nada no se ofrece dejarlos.
- **Tintes de la cerrada**: verde cobrada, rojo cancelada, ámbar si no asistió.
- **Confirmación**: un estado con interruptor («Confirmada · por el enlace / por recepción» o «Sin
  confirmar»), no un botón. Debajo, los mensajes de correo y SMS si los hay.
- **Enlazar con otra cita** es una opción del «⋯» junto a la acción principal (solo si hay con cuál);
  abre la lista en su sitio. La sección de citas enlazadas aparece solo si la cita tiene enlazadas.

## 13. Confirmar en popover y la cerrada más corta (2026-10-19)

- **Cancelar y «No asistió»** se confirman en un popover junto al botón que lo pidió (el atajo o el
  «⋯»), no en un modal encima del panel (`StatusConfirm.tsx`). Al confirmar, el panel se queda y muestra
  la cita cerrada. El clic derecho de la agenda sigue con el diálogo (ahí no hay panel debajo).
- **No asistió** se tiñe de rojo, como la cancelada.
- **La cerrada**: sin *Lo que se cobró* (está en *Ver recibo*) ni el agendador de la próxima a la
  vista; el botón principal es **Reagendar**, que lo abre debajo. *Fijar* abre lo suyo (uno a la vez).
- Los tres iconos de la cabecera (actividad, Clipper, cerrar) miden lo mismo (16 px).

## 14. Todo dentro de la tarjeta (2026-10-19)

- *Día y hora* ya no cambia la duración (la ponen los servicios): solo mueve la cita.
- **Confirmación** y **Citas enlazadas** son tarjetas como las de la cita, dentro de la tarjeta grande.
  La de confirmación lleva su interruptor y, plegados, los mensajes de correo y SMS. La de enlazadas
  dice qué van juntas y su total; abierta, la lista, el total y *Ver en la agenda*. Solo salen si
  aplican.
- Al final de la tarjeta, los atajos (si hacen falta) **encima** de la acción principal y su «⋯». Fuera
  de la tarjeta solo queda el paso a paso.

## 15. Permisos por rol, confirmada al llegar y restringir al cliente (2026-10-19)

- **Confirmación**: en cuanto el cliente llega, la cita sale *Confirmada · Ya llegó a la barbería*, sin
  interruptor.
- **Candados** (`CalendarAccess.locksAfterCheckIn`): solo el barbero de comisión ve el barbero, la hora y
  el cliente con candado tras ingresar. Dueño, administrador, recepción y barbero de renta cambian la
  cita en cualquier estado hasta cobrar (el PATCH acepta `clientId` mientras no esté cerrada).
- **No asistió / cancelada**: junto a Llamar y Escribir, *Prepago* (el ajuste «Reserva y pago solo en
  línea» de la ficha: solo reserva pagando por adelantado) y *Bloquear* (con popover de confirmación);
  cada uno se deshace desde el mismo atajo. Solo para quien puede (`canRestrictClients`: todos menos el
  barbero de comisión). Las etiquetas *Bloqueado* y *Paga por adelantado* lo dicen en la tarjeta.

## 16. Caja y estados (2026-10-19)

- **Precio editable al cobrar** (`CheckoutPrice.tsx`): cada servicio y producto del cobro muestra su
  precio con lápiz; se cambia ahí y debajo queda «De lista …». Viaja como `servicePrices` (en el orden de
  los servicios) y `productPrices` (unitario) y queda en la cita (Transacciones lo usa). Todos menos el
  barbero de comisión (`canEditPrices`; el servidor lo rechaza con `403`).
- **Volver al estado anterior**: en el «⋯», «Volver a «Pendiente»» (si ya llegó) o «Volver a «Llegó»»
  (si está en silla); en la cancelada o que no asistió, «Reactivar la cita». Cobrada no se deshace (es
  una devolución).
- **Aviso al cobrar**: si el barbero tiene otra cita que ya sentó antes y sigue sin cobrar, un diálogo lo
  dice («Cobrar la de Mariana primero» / «Seguir con esta»). No frena.
- **Terminó sin cobrar**: la tarjeta de la agenda lleva una píldora ámbar «Terminó hace 15 min · sin
  cobrar».

## 17. El cobro en dos pasos (2026-10-19)

`CheckoutDrawer` + `checkout/` (`useCheckout`, `BillStep`, `PayStep`, `allocate`): como el pago de la
reserva, dentro del mismo panel y con el ticket abajo.

1. **La cuenta**: las citas que se cobran juntas (las de su visita, marcadas, y *Sumar otra cita sin
   cobrar* de las que ya están en la barbería), servicios con precio editable, productos con cantidad y
   precio, *Vender una tarjeta de regalo* (monto y para quién) y *Agregar un descuento* (% o $ con motivo).
2. **¿Cómo paga?**: propina, *¿Paga con tarjeta de regalo?* (código; cubre hasta su saldo) y el método:
   efectivo (con el cambio), tarjeta (eligiendo el datáfono de Configuración; la demo trae dos), link de
   pago (se manda por SMS o correo y el botón pasa a «Ya pagó · registrar»), mixto (efectivo + tarjeta) o
   en partes (2–4, cada una con su método y su datáfono; tienen que cuadrar). Con varias citas, las partes
   se reparten en orden (`allocateParts`).

## 18. Cobro en una pantalla, devolver y borrar la venta (2026-10-19)

- **Cobro en una sola pantalla** con la cara del pago de la reserva (el usuario no quiso dos pasos): lo
  que se cobra, enlaces «¿Agregar un descuento?», «¿Tiene una tarjeta de regalo?» y «¿Vender una
  tarjeta de regalo?», «¿Cómo paga?» en `OptionTile` de 3 columnas (y los datáfonos igual), y «Tu
  orden». **La propina se pregunta al pulsar «Cobrar»**, en su ventana, como en la reserva; al elegirla
  se cobra (en partes, se suma a la última).
- **Devolver** es una página dentro del panel (`RefundPage`): se marca cada servicio, los productos con
  cuántos (vuelven al inventario) y la propina; sale el monto con su descuento e impuesto, o se escribe
  otro; a dónde vuelve y por qué. Lo ya devuelto se descuenta.
- **Borrar la venta** (dueño y administrador) en el «⋯» de la cobrada, con motivo: la cita vuelve a «en
  silla» sin pago.

## 19. Reagendar varias y que el cliente reagende (2026-10-19)

- **Reagendar** (cita cerrada) con varias citas en la visita: «Reagendar también la otra cita de la
  visita» (encendido por defecto) las agenda todas a la misma distancia, con sus barberos y servicios, y
  quedan enlazadas otra vez.
- **¿Prefiere elegir él?**: se le manda por SMS o correo el enlace de la reserva en línea
  (`features/booking/rebookLink.ts`: `/reservar?reagendar=1&servicios=…&barbero=…&sucursal=…`). Al
  identificarse cae directo en elegir la hora con su servicio y barbero puestos, y paga como en cualquier
  reserva.

## 20. Ausencias y bloqueos en la agenda (2026-10-19)

- **Ausencias y bloqueos** (acción de la barra, `timeOff/TimeOffDrawer`): panel junto a la agenda con lo
  que falta aprobar primero; filtros por estado (por aprobar, aprobadas, todas) y por tipo (vacaciones,
  incapacidad, permiso, bloqueos); *Agregar ausencia* en su sitio (quién, qué, desde–hasta y nota; el
  dueño y el administrador la dejan aprobada, el resto queda por aprobar).
- **Revisar** (`TimeOffReview`): quién, qué y cuándo; días, citas ya agendadas y días que trabaja; aviso
  si el equipo queda corto (menos de la mitad); sus citas por día (tocar una la abre para moverla); el
  equipo cada día (cuántos trabajan y quién más falta); *Aprobar* o *Rechazar* con motivo. Deciden dueño,
  administrador y recepción.
- **En la rejilla**: la ausencia por aprobar se ve rayada en la columna del barbero; tocarla abre su
  revisión. Al aprobarse queda el bloqueo de siempre.
- **Bloqueos con aprobación**: Configuración › Agendamiento › *Los bloqueos de los barberos necesitan
  aprobación*. Encendido, el bloqueo que pone un barbero queda rayado («… · por aprobar») hasta que lo
  aprueban; rechazarlo lo borra.

## 21. Panel del día, día suave o pesado y recursos especiales (2026-10-19)

- **Panel del día.** En Semana y Mes, tocar un día (o una celda de un barbero) ya no salta a la rejilla: abre a la derecha el resumen del día y la semana o el mes siguen a la izquierda. Trae la marca del día, cifras (citas frente a lo que suele tener, por atender o sin cobrar, canceladas o no vino, lo del día y lo cobrado), el equipo con su carga y quién falta (tocar a un barbero abre su día), lo que pide atención (los mismos avisos que el resumen de Clipper) y pestañas Citas, Clientes, Bloqueos y Ausencias. Una cita se abre junto a la semana sin cambiar de vista; «Abrir el día» lleva a la rejilla y «Agendar este día» al alta. Código: `features/calendar/dayPanel/`.
- **Día suave o pesado.** `GET /calendar/rhythm` promedia las citas de cada día de la semana en las últimas 8 semanas; `dayWeightOf` marca pesado desde un 110 % del promedio y suave hasta un 90 %. Es un pronóstico: un día que suele ser pesado lo sigue siendo aunque aún tenga pocas reservas. Sale con su tooltip (cuántas suele tener y cuántas lleva) en la cabecera de la Semana, en cada día del Mes (`MonthOccupancyGrid` ganó `marker`), junto a la fecha en Día y Lista, y en el panel del día.
- **Recursos especiales.** Viven en Servicios («Recursos especiales» en la barra): nombre, cuántos hay y qué servicios lo ocupan. En la agenda, el filtro tiene un grupo «Recursos especiales»: marcar uno filtra por sus servicios (la Lista queda con solo esas citas) y cada fila dice cuántas citas de hoy lo ocupan y cuántos choques hay —momentos en que se piden más unidades de las que hay—. El recurso se ocupa solo durante el tramo de su servicio (`resourceModel.ts`).
- **Pendiente.** Que el alta y el mover avisen al chocar con un recurso (hoy solo lo dice el filtro) y que la semilla de la demo agende respetando los recursos: con un solo sillón de lavado salen varios choques al día.
