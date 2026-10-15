# Reserva en línea: versiones de la experiencia

2026-10-08. En `/reservar` la vista previa tiene un selector «Versión de la experiencia» (`?version=`)
con tres maneras de reservar. No son pieles de lo mismo: cada una parte de una pregunta distinta y
ordena el recorrido a partir de ella. Las tres comparten el motor (`useBookingEngine`: barbería,
catálogo, `bookingReducer`, cuentas) y el cobro (`usePaymentController` + `PaymentPanel`), así que el
dinero, los cupones, la lealtad, los paquetes, las tarjetas guardadas y la reserva salen iguales.

| | Paso a paso (`guided`) | Agenda en lista (`agenda-list`) | Conversación (`chat`) |
|---|---|---|---|
| Pregunta de partida | ¿Quién eres? | Arma tu cita | Dime qué necesitas |
| Identidad | Al entrar (celular + código) | Al final, al confirmar; opcional antes («Ya soy cliente») | Al entrar, como en WhatsApp |
| Recorrido | Sede → servicios → barbero → hora → resumen → pago, una decisión por pantalla | Una sola pantalla: sede, servicios y barbero en filas que aparecen de a una y abren su lista (en tablet y monitor, en su sitio); debajo el día en una tira y las horas por franja | Preguntas de a una, cada una con su tarjeta para responder tocando; también entiende texto libre |
| Para quién | Cliente que vuelve con «lo de siempre» | Quien busca hueco pronto, el monitor del local | Quien prefiere escribir o no sabe qué pedir |
| Varias citas / personas | «Agregar otra cita» en el resumen | Una sola cita: tocar otra hora la reemplaza | «Otra cita» en el chat |
| Código | `BookingFlow` › `GuidedFlow`, `steps/` | `variants/agenda/` | `variants/chat/` |

2026-10-09: se quitó la **Agenda abierta** (`agenda`: tira de chips, horas de todos los barberos «por
barbero / por hora» y carrito con varias citas). Un enlace viejo con `?version=agenda` cae en la versión
por defecto.

2026-10-13: se quitó la **Agenda en lista** (`agenda-select`: sede, servicios y barbero como tres
tarjetas numeradas en fila, con el día y la hora a la vista pero apagados). Queda la **Agenda en lista**,
que usa el mismo código (`variants/agenda/`) sin el modo: las preguntas van siempre en filas y de a una.
Un enlace viejo con `?version=agenda-select` cae en la versión por defecto.

## Terminar en la lista de espera (Paso a paso y Agenda en lista)

2026-10-09. Quien se apunta en la lista de espera y no aparta ninguna hora puede terminar ahí: lo
apuntado vive en la reserva (`state.waitlist`, acciones `waitlistJoined` / `waitlistLeft`) y
apuntarse lleva **directo** a su propia confirmación (paso `waitlisted`,
`WaitlistedStep`), sin botón «Finalizar» de por medio: qué quedó en espera (sede, servicio,
barbero o «cualquiera», día y franja), que se avisa por WhatsApp y que no se cobra nada; desde ahí,
«Salir de la lista» o «Ver otras horas». Si ya había una reserva armada (otra cita en el carrito, o la
que se estaba cambiando), «Seguir con tu reserva» suelta la cita en curso y vuelve al resumen para
pagarla; la entrada de la lista se queda.

## Agenda en lista (`agenda-list`)

- Abre con el servicio más pedido para enseñar horas sin preguntar nada (`agendaModel.defaultServiceId`).
- Una sola petición de disponibilidad por día (sin preferencia) trae quién puede a cada hora; el tablero
  la muestra por franja con las caras de quienes pueden (`timesByWindow`).
- «No soy yo» (`signOut`) olvida al cliente sin vaciar la reserva.
- Lo que se va a hacer se elige en un campo tipo select (`AgendaServiceField`, en
  `AgendaServicePicker.tsx`) que muestra lo elegido, cuánto dura y desde cuánto, y abre la carta:
  buscador si hay 7 o más, agrupada por categoría, una casilla por fila (se pueden varios). Se aplica
  con «Ver horas»; cerrar sin aplicar no cambia nada.

- Orden de la pantalla: «¿Para quién es la cita?» primero; luego «¿Dónde quieres que te atendamos?»,
  «¿Qué te vas a hacer?» y «¿Con quién te quieres atender?», cada una un campo que abre su lista; y al
  final «¿Qué día y a qué hora?», solo con las horas (sin «Por barbero / Por hora»): las del barbero
  elegido o, sin preferencia, las de todos (`AgendaSelectFields`).
- Sede y barbero tienen «Ver detalle» / «Ver perfil» en cada fila: el perfil se abre **dentro** de la
  misma ventana, con «Volver» a la lista y el botón de elegir en el pie (`PickerOverlay` con `onBack` y
  `view`; los cuerpos `BranchProfileBody` y `BarberProfileBody` son los mismos de los cajones).
- El barbero vive en `draft.barberId`; si los servicios nuevos no los hace o se cambia de sede, vuelve a
  «Sin preferencia». La siguiente cita sigue con el mismo barbero.
- Título «Arma tu cita» (no «¿Cuándo puedes venir?»: aquí no se empieza por la fecha). Sin cuenta no
  se pregunta «¿Para quién es la cita?»: el nombre y los datos se piden al final.
- **Una sola cita**: tocar otra hora reemplaza la anterior (`AgendaFlow` deja solo la última); la hora
  elegida se queda a la vista marcada (`TimeWindows selectedTime`) y no sale aviso.
- Si el barbero elegido no tiene horas ese día, debajo salen otros parecidos con sus primeras horas
  (`AlternativeBarbers`, el mismo de Paso a paso). Solo se recomienda a quien hace lo pedido, comparte
  al menos una habilidad y tiene horas; tocar una hora de otro día lleva la agenda a ese día.
- Cierre propio (`AgendaSelectCheckout`): la cita en una tarjeta arriba (con a nombre de quién y «No soy
  yo»), sin «Tus citas» repetidas ni «Volver a la agenda» (la flecha de la cabecera); nota y foto en una
  fila hasta usarlas; la tienda como campo con modal (`AgendaProductField`, cantidad en la misma fila);
  y `PaymentPanel compact`: propina en una fila, cupón y tarjeta de regalo como enlaces en una línea,
  formas de pago en filas cortas con el detalle solo de la elegida, y en «Tu orden» solo las cuentas.
- La sede tampoco va en un select junto al título: es una tarjeta igual (foto del local, nombre y
  dirección) que abre la lista de sedes con horario y barberos (`AgendaBranchField`). Tocar una la elige
  y cierra; con citas apartadas queda marcada y el pie pide confirmar, porque cambiar vacía la reserva.
  En monitor sede y servicios van lado a lado. Campo, ventana y filas son piezas compartidas
  (`AgendaPicker.tsx`: `PickerField`, `PickerOverlay`, `PickerRow`).
- Celular y widget: hoja desde abajo (`DrawerShell side="bottom"`), al alcance del pulgar.
- Tablet y monitor: modal centrado (una hoja a lo ancho de una tablet se ve estirada); en tablet,
  filas y miniaturas más grandes para el dedo.
- El foco al abrir va a la primera fila elegida, no al buscador: en táctil el teclado taparía la lista.
- Las dos ventanas se abren dentro de la reserva (el marco del dispositivo), no en la ventana.

## Según el cliente (`mixed`)

2026-10-13. Una mezcla de las dos anteriores que decide la portada: con el celular se sabe si es
cliente (`POST /booking/phone/check`, sin código). Quien vuelve entra a la **Agenda en lista** con su
sede y «Lo de siempre»; el cliente nuevo va **Paso a paso** («Conozcámonos», sede, servicios, barbero,
hora). Los dos cierran igual: «Confirma tu cita» y el pago de la Agenda (`AgendaSelectCheckout`,
`AgendaSelectPay`), que antes de cobrar pide el código. Código: `MixedFlow` en `BookingFlow.tsx`.


**Una sola cara.** Los pasos del cliente nuevo se pintan con la de la Agenda (`BookingSkinContext` =
«agenda», que pone `GuidedFlow` en esta versión): la cabecera con el logo a la izquierda, «Agenda con
Clipper» en los primeros pasos, «Empezar de nuevo» y el progreso fino debajo; los pasos de elegir
(sede, servicios, barbero, hora) sobre la foto con el título en vidrio (`AgendaCover`, la misma pieza
del tablero), y la hora con la tira de días grande y las horas por franja. El orden de los pasos no
cambia. Paso a paso, por sí sola, sigue con su cara.

**Un solo lenguaje de elegir.** Toda opción —tarjeta o fila de lista— lleva al lado la misma marca
(`SelectMark`): círculo si se elige una (sede, barbero), casilla si se pueden varias (servicios), vacía
mientras no se elige y rellena con su check al elegirla. La usan las tarjetas de Paso a paso y las
filas de las hojas de la Agenda (`PickerRow`). El perfil del barbero y de la sede es un enlace bajo el
texto, igual en las dos. El calendario trae lo mismo en Agenda en lista y en «Según el cliente»:
título del día (`ScheduleHeading`), «Lo antes posible», la tira de días, las horas por franja con la
cara del barbero, «Avísame si se libera una hora» y «¿No encuentras horario?» (`CallCard`).
## Conversación

- Se siente como un chat, sin formularios dentro del hilo: lo que se escribe (el celular **solo con
  números**, el código, nombre y apellido, el correo, el CVC, una nota o una frase como «corte mañana a
  las 5 con Andrés») va en la caja. El código y el CVC se ven como «••••••».
- Cada elección llega como una pregunta en lista (`ChatQuestionCard` con título, ayuda, buscador,
  descripción y foto o emoji por opción, y varias a la vez para servicios y productos). Se responde
  tocando, con el número o escribiendo parte de la opción; al responder, la tarjeta se va y queda la
  pregunta y la respuesta como mensajes. Sin pastillas de atajos bajo los mensajes (confundían): lo que
  hacían se escribe («reenviar», «cambiar número», «mis citas», «¿dónde quedan?») y «Mis citas» y
  «Empezar de nuevo» están en la cabecera.
- `useChatBooking` (la reserva) y `chatCheckout` (propina, cupón o tarjeta de regalo, cómo paga, el
  resumen para confirmar, después de reservar y «Mis citas»: mover o cancelar con reembolso) no guardan
  la reserva aparte: despachan las acciones del `bookingReducer` y cobran con `usePaymentController`.
  La tarjeta nueva también se pide conversando (`chatCard`): número, nombre como aparece en la tarjeta,
  vencimiento (vale «0829», «08 29» u «08/2029») y CVC, uno por mensaje y revisados al llegar; en el hilo
  el número queda «•••• 4242» y el CVC «•••». Al final pregunta si se guarda (solo marca, últimos 4 y
  vencimiento). «Cancelar» a mitad vuelve a la forma de pago. El descuento de primera visita se aplica
  solo al llegar al pago, como en las otras versiones.
- Conocer antes de elegir (`chatProfiles`): las listas de sedes y de barberos traen al final «Conocer una
  sede» / «Ver el perfil de un barbero» para escribir de cuál; también vale escribirlo en la caja
  («perfil de Andrés», «cómo es la sede Utah», «¿dónde quedan?»). El detalle llega como mensaje con sus
  fotos (se abren en la galería): la sede con su estado de hoy, dirección y «Cómo llegar», teléfono,
  redes, horario de la semana, quién atiende (nombre, nivel y nota; su perfil se pide por nombre) y cierres; el barbero con nivel, nota, habilidades, lo que cobra por lo
  elegido, Instagram y dos reseñas. Después pregunta si se elige («¿Te agendo con Andrés?», «¿Prefieres
  reservar en esta sede?», que avisa que cambiar de sede quita lo apartado) o retoma la pregunta que
  quedó pendiente («¿Seguimos donde íbamos?»).
- Sin horas con el barbero elegido ese día: recomienda otros que hacen lo mismo (`/booking/alternatives`:
  habilidades y nivel parecidos) con su primer día libre y sus primeras horas, y debajo «Con quien esté
  libre», «Ver otro día con …», «Probar con otro barbero» y la lista de espera.
- Volver y cambiar escribiendo, en cualquier momento (`chatIntents`): «volver», «espera, quiero
  volver», «me equivoqué» regresan un paso (barbero → servicios, día → barbero, hora → día; en el pago,
  la pregunta anterior); «mejor con otro barbero», «cambiar el servicio», «otra hora», «prefiero otra
  sede» reabren lo ya apartado en ese punto.
- Preguntas de pasada que responde sin perder el hilo y luego retoma la pregunta abierta: el perfil
  del barbero «que elegí» (el de la cita en curso, el asignado si ya reservó, o el de su última visita),
  el detalle de su sede, la dirección («¿cómo llego?»), el horario, el teléfono, «¿a qué hora es mi
  cita?», «¿cuánto llevo?» (con paquete, membresía, descuento, impuestos y propina), precios,
  saludos, gracias y «¿eres un bot?». Si no entiende, lo dice y vuelve a mostrar la pregunta.
- Las opciones también se responden con otras palabras: si ni el número ni el texto coinciden, gana la
  que comparte más palabras («mándame el recibo» → «Enviarme el recibo por correo»), y solo después de
  descartar que sea una petición de pasada.
- Productos de la tienda con su cantidad: en la lista, cada producto elegido trae su − cantidad +
  (`ChatQuestionCard` con `quantity`) y queda como «Cera mate × 2».
- La nota para el barbero puede llevar hasta **3 fotos** del corte (`chatExtras`): mientras se escribe la
  nota, la caja muestra el botón de imagen (`ChatComposer attachKind="photos"`), las fotos se ven en
  miniatura antes de mandar y en la burbuja del cliente después, y llegan a la cita en `referencePhotos`
  (las otras versiones también aceptan hasta 3 en «Agregar foto del corte»).
- Tarjeta nueva: el vencimiento dice qué está mal («30 no es un mes: va de 01 a 12», «escribiste solo el
  año», vencida, año demasiado lejos) en vez de un error genérico.
- Después de reservar, «Agregar al calendario» deja el `.ics` como adjunto descargable dentro del chat.
  «Enviar recibo» (por correo o por SMS) abre una lista de **varios a la vez** (`chatReceipt`): mi correo,
  SMS a mi celular (el que verificó), a otro correo y a otro número; los «otros» se piden en la caja y al
  final dice a dónde llegó. También se escribe: «a los dos», «por SMS», un correo o un celular.
- «Dejarla fija» tiene su «No, solo esta cita».
- Lo que el asistente pide va resaltado en negrita («tu **nombre y apellido**», «el **CVC**»…).
- `parseBookingText` entiende servicios por su nombre de a pie («corte y barba» → combo), el barbero por
  su nombre o «cualquiera», días («mañana», «el viernes», «20 de octubre») y horas («a las 5» = 17:00,
  «10 y media», «en la tarde»), además de intenciones sueltas. Sin modelo de lenguaje: lo que no entiende
  lo vuelve a preguntar.
- Fuera de la conversación quedan la foto de referencia del corte y las compras de regalo y paquetes
  (se abren como pantalla aparte desde la bienvenida).

## Una visita en partes (todas las versiones)

Poco frecuente pero posible: en la misma visita, cada servicio con su barbero u hora (el corte con
Emilio a las 10:00 y la barba con Andrés justo después). Hay dos entradas:

- **Desde Servicios**: con dos o más marcados, el pie trae «Cada servicio con su barbero u hora».
  Encendido, «Elegir barbero» arma una parte por servicio, una tras otra (barbero → hora → la
  siguiente); Barbero y Hora dicen «Parte N de M de tu visita · servicio». Volver a Servicios desde
  la primera parte los junta otra vez.
- **Desde el resumen**: en una cita con varios servicios, cada uno trae «Separar». Sale a su propia
  parte (la cita conserva barbero y hora) y se abre desde el barbero; echarse atrás lo devuelve.

Las partes comparten `visitId` (`DraftItem`) y se agrupan en el resumen bajo «Tu visita en N partes»
con «Juntar de nuevo» (vuelve una sola cita y pide la hora). **Cada parte puede ser de alguien
distinto** (yo el corte, mi hijo el suyo): con el interruptor encendido, Servicios esconde «¿Para
quién es la cita?» y cada parte lo pregunta en su tarjeta (`VisitPartNote`: un talón dorado —la piel
2a de la pestaña «Propuestas»— con «Parte N de M», el servicio, lo que sigue, «Juntar todo» y
«¿Para quién es este servicio?»). «Juntar
todo» sale del «por separado» a mitad de camino: todas las partes vuelven a una sola cita (acción
`exitVisit`). Mientras se está por separado, el interruptor no se muestra.
El cuerpo del talón va en grafito y es corto: «Para mí / Otra persona» en una fila (elegida otra
persona, la ficha lleva su nombre y la abre). En Paso a paso, una línea («Listo: Corte clásico ·
10:00 a. m. · Ver») abre la hoja con las partes ya apartadas, y «Atrás» desde el barbero reabre la
parte anterior en su hora para corregirla: el servicio de ahora vuelve a la cola (acción
`previousPart`). La cabecera trae «Empezar de nuevo» (a la derecha) mientras se arma la reserva:
vuelve a cero sin olvidar quién es, con «Deshacer» (`startOver` / `restoreState`).
«Cambiar» en «Revisa tu reserva» abre esa cita en su barbero (no todos los servicios); «Editar» en la
hoja de las apartadas reabre esa parte (`reopenPart`). La hoja de «¿Para quién más?» trae «Para mí».
En la Agenda, por separado, el talón reemplaza a «Ya tienes N citas listas», «Atrás» vuelve entre
partes, la cabecera trae «Empezar de nuevo», no hay «Lo de siempre» y, al cambiar de parte, el
talón, los campos y las horas entran en cascada. «Confirma tu cita» lleva arriba fecha, barbero y
precio, y debajo la lista de servicios con su «Separar». En la Agenda el interruptor va pegado debajo de Servicios. Al elegir la hora se propone «justo después / justo antes» de la otra parte.

**Una misma persona no está en dos sillas**: las horas que se cruzan con otra cita suya del carrito
no salen (vale para cualquier cita, no solo las partes) y el servidor responde `409` si llegan. En el
Calendario las partes quedan enlazadas como toda cita de una misma reserva (`linkId`) y anotadas
«Visita en N partes». La lógica pura vive en `src/features/booking/visit.ts`.

En las demás versiones:

- **Agenda en lista**: en «Confirma tu cita», «Separar» y «Juntar de nuevo» vuelven al tablero (la
  parte se elige como otra cita; «Atrás» deja el carrito como estaba). En el tablero, con dos o más
  servicios, el mismo interruptor; al apartar una parte, la siguiente se suma en vez de reemplazarla
  (`AgendaFlow` sube `heldCount`). Las partes se añaden al final del carrito: la Agenda cuenta las
  guardadas por posición, y el resumen las agrupa igual.
- **Según el cliente**: usa el «Confirma tu cita» de la Agenda; separar y juntar siguen por los pasos
  de Paso a paso.
- **Conversación**: en «¿Con quién?» aparece «Cada servicio con alguien distinto» (con dos o más
  servicios); al anotar una parte sigue con la siguiente. «Cambiar una cita» trae «Separar un
  servicio», y frases como «la barba con otro barbero» o «por separado» hacen lo mismo. Las horas que
  se cruzan con otra cita de la misma persona no se ofrecen.

## Pendiente

- Elegir una versión por barbería (Configuración › Reservas) en lugar de solo en la vista previa; hoy
  el enlace público la lleva en `?version=`.
- El intérprete de la conversación es por reglas; un modelo real entraría detrás de `interpret`.
- Medir en el embudo qué versión convierte mejor (hoy todas cuentan en los mismos pasos).
