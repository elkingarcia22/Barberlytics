# El panel de una cita: benchmark y cinco propuestas

2026-10-17. Qué se abre al tocar una cita en el calendario. Se investigaron 20 programas de barbería y
salón y 25 de otras industrias (calendarios, salud, restaurantes, hoteles, servicios de campo, estudios
de fitness y productos como Linear o Notion). Con eso se construyeron **cinco versiones** del panel
que se pueden comparar en la app, más la actual.

**Cómo verlas:** abre una cita en `/calendario`; arriba del panel está el selector «Diseño del panel».
La elección se recuerda por persona (`localStorage`) y un enlace con `?panel=booking|desk|client|visit|chair`
abre directo una versión. Código en `src/features/calendar/appointmentPanel/`.

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
