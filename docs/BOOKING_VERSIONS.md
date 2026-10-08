# Reserva en línea: tres versiones de la experiencia

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

## Conversación

- `useChatBooking` lleva el hilo; no guarda la reserva aparte: despacha las mismas acciones del
  `bookingReducer` y decide qué preguntar después y con qué tarjeta (`ChatWidgets`).
- `parseBookingText` entiende servicios por su nombre de a pie («corte y barba» → combo), el barbero por
  su nombre o «cualquiera», días («mañana», «el viernes», «20 de octubre») y horas («a las 5» = 17:00,
  «10 y media», «en la tarde»), además de intenciones sueltas («mis citas», «¿dónde quedan?», «pagar»).
  Sin modelo de lenguaje: lo que no entiende lo vuelve a preguntar con opciones.
- Una frase completa aparta la hora de una vez si está libre; si no, propone las de ese día y franja.
- El celular y el código también se pueden escribir en el chat. En el pago, «en la barbería» o
  «con tarjeta» eligen el método.

## Pendiente

- Elegir una versión por barbería (Configuración › Reservas) en lugar de solo en la vista previa; hoy
  el enlace público la lleva en `?version=`.
- El intérprete de la conversación es por reglas; un modelo real entraría detrás de `interpret`.
- Medir en el embudo qué versión convierte mejor (hoy todas cuentan en los mismos pasos).
