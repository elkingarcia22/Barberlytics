# Reserva en línea: versiones de la experiencia

2026-10-08. En `/reservar` la vista previa tiene un selector «Versión de la experiencia» (`?version=`)
con tres maneras de reservar. No son pieles de lo mismo: cada una parte de una pregunta distinta y
ordena el recorrido a partir de ella. Las tres comparten el motor (`useBookingEngine`: barbería,
catálogo, `bookingReducer`, cuentas) y el cobro (`usePaymentController` + `PaymentPanel`), así que el
dinero, los cupones, la lealtad, los paquetes, las tarjetas guardadas y la reserva salen iguales.

| | Paso a paso (`guided`) | Agenda abierta (`agenda`) | Conversación (`chat`) |
|---|---|---|---|
| Pregunta de partida | ¿Quién eres? | ¿Cuándo puedes venir? | Dime qué necesitas |
| Identidad | Al entrar (celular + código) | Al final, al confirmar; opcional antes («Ya soy cliente») | Al entrar, como en WhatsApp |
| Recorrido | Sede → servicios → barbero → hora → resumen → pago, una decisión por pantalla | Una sola pantalla: servicio arriba, día en una tira y las horas de **todos** los barberos a la vista (por barbero o por hora); se apartan horas con un toque | Preguntas de a una, cada una con su tarjeta para responder tocando; también entiende texto libre |
| Para quién | Cliente que vuelve con «lo de siempre» | Último minuto, quien busca hueco hoy, el monitor del local | Quien prefiere escribir o no sabe qué pedir |
| Varias citas / personas | «Agregar otra cita» en el resumen | Cambiar «Para quién» y tocar otra hora; la reserva crece al lado | «Otra cita» en el chat |
| Código | `BookingFlow` › `GuidedFlow`, `steps/` | `variants/agenda/` | `variants/chat/` |

## Agenda abierta

- Abre con el servicio más pedido para enseñar horas sin preguntar nada (`agendaModel.defaultServiceId`).
- Una sola petición de disponibilidad por día (sin preferencia) trae quién puede a cada hora; el tablero
  la reparte por barbero (`barberTimes`) o por franja con las caras de quienes pueden (`timesByWindow`).
  Lo que ya está en el carrito se marca y no se puede apartar dos veces.
- Cambiar una cita del carrito vuelve a la agenda en su día; «No soy yo» (`signOut`) olvida al cliente
  sin vaciar el carrito.
- El cierre (`AgendaCheckout`) pide celular, código y —si es nuevo— nombre y correo en el mismo sitio;
  el cobro aparece en cuanto se sabe quién es, con sus beneficios.

### Agenda con selector (`agenda-select`)

2026-10-08. La misma agenda abierta (mismo `AgendaFlow` y `AgendaBoard`, con `servicePicker="modal"`)
para comparar una sola cosa: cómo se elige qué se va a hacer. En vez de la tira de chips —que con
muchos servicios obliga a deslizar mucho— hay un campo tipo select (`AgendaServiceField`, en
`AgendaServicePicker.tsx`) que muestra lo elegido, cuánto dura y desde cuánto, y abre la carta:
buscador si hay 7 o más, agrupada por categoría, una casilla por fila (se pueden varios). Se aplica
con «Ver horas»; cerrar sin aplicar no cambia nada. Día, horas y cierre son los de la Agenda abierta.

- Orden de la pantalla: «¿Para quién es la cita?» primero; luego «¿Dónde quieres que te atendamos?»,
  «¿Qué te vas a hacer?» y «¿Con quién te quieres atender?», cada una un campo que abre su lista; y al
  final «¿Qué día y a qué hora?», solo con las horas (sin «Por barbero / Por hora»): las del barbero
  elegido o, sin preferencia, las de todos (`AgendaSelectFields`).
- Sede y barbero tienen «Ver detalle» / «Ver perfil» en cada fila: el perfil se abre **dentro** de la
  misma ventana, con «Volver» a la lista y el botón de elegir en el pie (`PickerOverlay` con `onBack` y
  `view`; los cuerpos `BranchProfileBody` y `BarberProfileBody` son los mismos de los cajones).
- El barbero vive en `draft.barberId`; si los servicios nuevos no los hace o se cambia de sede, vuelve a
  «Sin preferencia». La siguiente cita sigue con el mismo barbero.
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
  La tarjeta nueva se escribe en su hoja segura (el número no pasa por el chat).
- `parseBookingText` entiende servicios por su nombre de a pie («corte y barba» → combo), el barbero por
  su nombre o «cualquiera», días («mañana», «el viernes», «20 de octubre») y horas («a las 5» = 17:00,
  «10 y media», «en la tarde»), además de intenciones sueltas. Sin modelo de lenguaje: lo que no entiende
  lo vuelve a preguntar.
- Fuera de la conversación quedan la foto de referencia del corte y las compras de regalo y paquetes
  (se abren como pantalla aparte desde la bienvenida).

## Pendiente

- Elegir una versión por barbería (Configuración › Reservas) en lugar de solo en la vista previa; hoy
  el enlace público la lleva en `?version=`.
- El intérprete de la conversación es por reglas; un modelo real entraría detrás de `interpret`.
- Medir en el embudo qué versión convierte mejor (hoy todas cuentan en los mismos pasos).
