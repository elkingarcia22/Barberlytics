# Marketing y fidelización — investigación

Investigación del 2026-10-19 sobre todo lo que sirve para **traer clientes y hacer que vuelvan**: campañas (WhatsApp,
SMS, correo), segmentos, reactivación, cumpleaños, reseñas, referidos, membresía, paquetes, tarjetas de regalo,
cupones, atribución (de dónde vino el cliente) y la pestaña Marketing de Métricas. No es un módulo con menú propio:
está repartido entre Clientes, Reserva en línea, Calendario, Configuración y Métricas. Solo lectura: no se tocó código.

Fuentes internas leídas: `src/mocks/metricsTabs.ts`, `src/features/metrics/tabs/MarketingDashboard.tsx`,
`src/features/legal/consent.ts`, `src/mocks/customers/rhythm.ts`, `src/features/customers/rhythm.ts`,
`src/features/customers/ReactivationDrawer.tsx`, `src/features/customers/CustomerWhatsAppDialog.tsx`,
`src/features/customers/relationship.ts`, `src/features/customers/whatsappTemplates.ts`,
`src/mocks/customers/relationship.ts`, `src/mocks/booking/packages.ts`, `giftCards.ts`, `reviews.ts`, `funnel.ts`,
`dispatch.ts`, `handlers.ts`, `logic.ts`, `src/features/booking/pricing.ts`, `src/features/booking/funnel.ts`,
`src/features/settings/sections/BookingSettings.tsx`, `src/mocks/settings/seed.ts`,
`src/mocks/calendar/checkoutExtras.ts`, `src/features/calendar/appointmentPanel/useAppointmentModel.ts`,
`PanelParts.tsx`, `server/whatsapp/whatsapp.ts`, `api/whatsapp/send.ts`, `server/http/request.ts`,
`server/narrative/narrative.ts`, `docs/API_CONTRACT.md` y los informes 01, 03, 10 y 13. Análisis sobre `4b7774e`.
Fuentes externas al final. Lo que un proveedor dice de sí mismo va marcado **declarado**; lo no verificado, «?».

## Resumen ejecutivo

1. **Las piezas de fidelización existen, pero viven en la reserva en línea.** Membresía por sellos (cada 10 visitas,
   una cortesía), paquetes prepagados, tarjetas de regalo, cupones, reseñas y el permiso de promociones funcionan
   en `/reservar`. Recepción solo puede usar la tarjeta de regalo y un descuento manual en la caja: no puede aplicar
   un cupón ni canjear la cortesía de la membresía.
2. **Lo más sólido es la reactivación aprobada por el dueño** (`rhythm.ts`): candidatos por ritmo de visita, hueco
   real con su barbero, solo a quien aceptó promociones, nunca dos veces en 30 días y con la razón de cada omisión.
   Es mejor que lo que documentan Square o Fresha. Pero sale **a la hora en que se aprueba** (incluso un domingo
   a las 11 p. m.) y no hay tope de mensajes por cliente entre tipos.
3. **El permiso se respeta en la app, no en el envío.** `/api/whatsapp/send` acepta cualquier número y cualquier
   plantilla, incluida la de marketing (`reactivacion_cliente`), con solo un encabezado `Origin` que cualquier
   script puede falsificar. Con las claves de Meta puestas, alguien podría mandar promociones a quien no las aceptó.
   Es el mayor riesgo legal del área (TCPA en EE. UU., Ley 1581 y Ley 2300 en Colombia).
4. **La baja no existe.** El texto del permiso promete «Responde STOP» o «BAJA», pero no hay webhook que lea las
   respuestas. En EE. UU., «STOP» y sus sinónimos deben respetarse siempre (FCC, vigente desde abril de 2025).
5. **La pestaña Marketing de Métricas inventa sus cifras.** Canales, «visitas», campañas e ingresos por campaña se
   reparten al azar sobre el total de reservas en línea (`metricsTabs.ts:189-219`), aunque el contrato dice «nunca
   ceros inventados». Mientras tanto, la reserva **sí** guarda la UTM real de cada cita (`handlers.ts:549`) y el
   embudo guarda el origen de cada sesión: el dato bueno existe y nadie lo lee.
6. **Tres promesas al cliente que el sistema no cumple**: la tarjeta de regalo dice «Le mandamos el código por
   WhatsApp» y no se manda nada; el panel de la cita muestra la membresía con 10 visitas fijas aunque el dueño la
   haya apagado o cambiado; y la reserva pública muestra **reseñas de ejemplo** mezcladas con las reales.
7. **Lo que falta para competir** es lo que todo el sector ya tiene: campañas a un segmento con costo estimado,
   automatizaciones (cumpleaños, gracias tras la primera visita, paquete por vencer, pedir reseña en Google),
   cupones que el dueño crea y referidos. Y una decisión de producto: la «membresía» de hoy es una **tarjeta de
   sellos**; la membresía que crece en barbería es **suscripción mensual** con cobro recurrente.
8. Recomendación: Fase 1 «legal y verdadero» (permiso y baja en el servidor, horarios, métricas reales, quitar las
   promesas falsas), Fase 2 «campañas y automatizaciones» con WhatsApp y correo, Fase 3 «IA que propone y el dueño
   aprueba» (segmentos, momento y texto con marcadores, como ya hace la narración).

---

## 1. Qué tiene hoy

**Mercado, según el código.** El permiso ya sale por país de la sede (Colombia, EE. UU., México y uno general,
`consent.ts`), pero la demo es de EE. UU. (USD, `America/New_York`) y las plantillas de WhatsApp se piden siempre
en un solo idioma (`WHATSAPP_TEMPLATE_LANGUAGE`, por defecto `es`) con fechas en `es-CO` (`dispatch.ts:51`).

### Inventario

| Pieza | Qué hay | Dónde | ¿Real o de ejemplo? |
|---|---|---|---|
| Permiso de promociones | Casilla sin marcar en la reserva; en la ficha, activar o retirar con guion para recepción; guarda fecha, origen (`booking`/`app`), versión del texto y país | `legal/consent.ts`, `booking/flow/ConsentFields.tsx`, `PATCH /customers/:id/consent` | Real. Textos pendientes de abogado (lo dice el archivo) |
| Mensaje 1 a 1 | Diálogo con 4 propósitos (gracias, volver, cumpleaños, libre), texto editable, abre `wa.me` y lo anota en el historial; «volver» y «cumpleaños» piden permiso (`409 no_consent`) | `CustomerWhatsAppDialog.tsx`, `whatsappTemplates.ts`, `POST /customers/:id/messages` | Real. Lo envía la persona desde su WhatsApp, no la API |
| Reactivación | Lista de clientes que «les toca», en riesgo o perdidos, con hueco sugerido; el dueño elige y aprueba; se encola la plantilla `reactivacion_cliente` | `rhythm.ts` (mock y feature), `ReactivationDrawer.tsx`, `GET/POST /customers/reactivation` | Real (lógica). Envío real solo con claves de Meta |
| Avisos de Clientes | «En riesgo», «le toca», «cumple esta semana», «falla seguido» con recuento | `customersHome.tsx:149-190` | Real. El de cumpleaños no tiene automatización |
| Membresía (sellos) | Cada N visitas, un servicio de cortesía; se configura en Configuración › Reservas; se usa al pagar en línea (`useReward`) | `booking/logic.ts:301-316`, `BookingSettings.tsx:188`, `MembershipPerk.tsx` | Real en la reserva. **No se canjea en la caja** |
| Paquetes prepagados | N visitas de un servicio con precio y vencimiento; se compran en línea y se gastan al reservar | `booking/packages.ts`, `POST /booking/packages/buy`, `settings/seed.ts:56` | Real en la reserva. Sin aviso de «te quedan 2» ni de vencimiento |
| Tarjetas de regalo | Compra en línea (10–500), código `BL-XXXX-XXXX`, saldo que sobra; en la caja se usan y se venden | `booking/giftCards.ts`, `calendar/checkoutExtras.ts` | Real, salvo el envío del código (no sale) y una tarjeta de prueba fija `REGALO-50` |
| Cupones | 3 códigos fijos (`BIENVENIDO10`, `FAMILIA15`, `BARBER5`): porcentaje o monto, primera visita, mínimo de citas | `features/booking/pricing.ts:31-35`, `POST /booking/promo` | **Fijos en el código**. Sin pantalla, vencimiento, tope de usos ni uso en la caja |
| Reseñas | 1–5 estrellas y comentario desde «Mis citas», solo de citas completadas, una por cita; se ven en la ficha y en la reserva | `booking/reviews.ts`, `ReviewSheet.tsx`, `POST /booking/appointments/:id/review` | Reales **más 12–51 de ejemplo por barbero** mezcladas (`reviews.ts:28-51`) |
| Enlace con UTM | Configuración › Reservas › Enlaces arma el enlace con `utm_source/medium/campaign` | `BookingSettings.tsx:251-270` | Real |
| Embudo de la reserva | Eventos por paso con origen; tarjeta en Configuración | `booking/funnel.ts` (mock y feature), `GET /booking/funnel` | Real; sin eventos muestra uno de ejemplo marcado `demo` |
| UTM en la reserva | La reserva guarda `utm` | `mocks/booking/handlers.ts:549-552`, `state.ts:29` | Real, **nadie lo lee** |
| Métricas › Marketing | % en línea, mejor canal, reservas por campaña; barras de canales, conversión y campañas | `metricsTabs.ts:187-238`, `MarketingDashboard.tsx` | **Inventado** (ver §2) |
| Métricas › IA | Sugerencia «N clientes nunca han reservado» con botón de campaña | `metricsTabs.ts:281-300` | Número al azar (`180 + rand()*120`); ya señalado en 01 |
| WhatsApp (servidor) | 7 tipos de mensaje; `reactivation` marcada como marketing en el comentario | `server/whatsapp/whatsapp.ts:11-24`, `api/whatsapp/send.ts` | Real, sin comprobar permiso ni categoría |
| Narración con marcadores | Claude redacta con `{marcadores}`, el servidor pone las cifras y rechaza dígitos | `server/narrative/narrative.ts` | Real; patrón reutilizable para textos de campaña |

### Lo que no existe

Campañas a un grupo (envío masivo), segmentos guardados o etiquetas, automatizaciones (cumpleaños, primera visita,
paquete por vencer, membresía a punto de ganar, pedir reseña), correo como canal de marketing, SMS, referidos,
membresía por suscripción, programa de puntos, cupones administrables, «¿cómo nos conociste?» en la ficha, enlace
a reseñas de Google, respuesta a reseñas, informe de resultado de una campaña (enviados → reservaron → cobrado).

---

## 2. Análisis

### Fortalezas

- **El permiso está bien pensado**: separado de los mensajes de la cita (que no lo necesitan), nunca marcado por
  defecto, con texto por país y versión guardada como prueba. Es exactamente lo que piden la Ley 1581 y la TCPA.
- **La reactivación es «el agente propone, el dueño aprueba»** con reglas claras de exclusión y la razón de cada una
  (`noConsent`, `recent`, `noPhone`, `noSlot`). Ofrece un hueco concreto con su barbero de siempre: es más útil que
  un «te extrañamos, 10 % de descuento».
- **La economía de la reserva ya entiende la fidelización**: cupón, tarjeta de regalo, cortesía y paquete se
  combinan en `computeTotals` en el orden correcto y llegan a la caja como `prepaid` (fase 1).
- **La atribución tiene la mitad del cable**: generador de enlaces con UTM, la UTM se guarda en cada reserva y el
  embudo cuenta sesiones por origen. Falta solo leerlo.
- **El patrón de la narración** (marcadores + el servidor pone las cifras) sirve tal cual para que una IA redacte
  campañas sin inventar precios ni fechas.

### Huecos

1. **No hay campañas.** Ni a un segmento ni a todos. El dueño no puede escribir «este sábado hay huecos» a los
   clientes que aceptaron promociones. Booksy, Fresha, Square, Vagaro, Mangomint y Boulevard lo tienen (§4).
2. **No hay automatizaciones.** Cumpleaños es un aviso en Clientes que obliga a escribir uno por uno. Ninguna
   regla «X días después de…» existe.
3. **Recepción no puede fidelizar en el mostrador.** La caja no aplica cupones ni canjea la cortesía; la membresía
   solo avanza con `client.visits`, un contador de la semilla que el cobro no incrementa (en el mock la tarjeta de
   sellos no avanza nunca). El cliente walk-in, que es la mitad de la barbería, queda fuera del programa.
4. **Cupones sin dueño.** Los tres códigos están en el código del navegador (`pricing.ts:31`); el dueño no puede
   crear «MARTES20» ni ponerle fecha de fin o tope. `BARBER5` se puede usar sin límite.
5. **La atribución se pierde.** No hay origen del cliente (Instagram, Google, referido, walk-in, pasaba por la
   calle) en la ficha ni al crearlo en recepción; la UTM queda en la reserva y no sube al cliente.
6. **Reseñas solo internas.** Para calificar, el cliente tiene que entrar a «Mis citas»; nadie se lo pide después de
   la visita. No hay enlace a Google, que es donde lee reseñas el 83 % de los consumidores (BrightLocal 2025, vía
   tercero). `business.googleMaps` existe en Configuración y no se usa para esto.
7. **La membresía tiene nombre de otra cosa.** En el sector, «membresía» es una cuota mensual (cortes ilimitados o
   N por mes). Llamar «Tu membresía» a la tarjeta de sellos choca con la membresía de verdad cuando llegue.

### Deuda técnica

- **Dos cálculos de la membresía**: la ficha y la reserva usan `loyaltyOf()` con la configuración; el panel de la
  cita usa `LOYALTY_EVERY = 10` y `svc_corte` fijos (`useAppointmentModel.ts:28-29`) y no mira `loyalty.enabled`.
- **El envío vive en el navegador** (ya en 13): la cola corre cada minuto en cada pestaña y la función pública de
  envío no sabe quién llama ni si el cliente aceptó.
- **Reseñas de ejemplo en la lógica pública** (`reviewsOf` mezcla `seeded()` con las reales). Si esta lógica se porta
  tal cual al backend, se publicarían reseñas falsas.
- **`DEMO_GIFT_CODE` se reinyecta siempre** (`giftCards.ts:23-26`): una tarjeta de 50 con código conocido.
- **`/booking/gift-cards/check` sin tope** de intentos (sí lo tiene `phone/check`). Con códigos de 8 caracteres el
  riesgo es bajo, pero es el mismo patrón que se endureció en el código de entrada.
- **Plantillas en un solo idioma** y fecha en `es-CO` para todos: un cliente en inglés en EE. UU. recibe español.

### Fricciones de UX

- La reactivación está en Clientes y la pestaña Marketing en Métricas; el dueño no ve en un solo lugar «a quién le
  escribí y qué trajo».
- El aviso de cumpleaños dice cuántos hay pero exige abrir ficha por ficha.
- En la caja, al cobrar, no se ve «le falta 1 sello» ni «tiene un paquete»: el dato está en la ficha 360, no en el
  momento de cobrar (sí en el panel de la cita, con la cifra fija).
- El generador de UTM está escondido en Configuración › Reservas › Enlaces; nada lo conecta con «crear campaña».

### Errores encontrados

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | `/api/whatsapp/send` envía cualquier plantilla (también la de marketing) a cualquier número; la única barrera es `Origin`/`Referer`, que un cliente que no es navegador falsifica. El permiso solo se comprueba en el mock | `api/whatsapp/send.ts:15-19`, `server/http/request.ts:36-44`, `server/whatsapp/whatsapp.ts:57-98` |
| Alta | Pantalla de Marketing con cifras al azar: canales repartidos con `rand()`, «visitas» = reservas × factor inventado, campañas fijas («Martes 2×1 en barba»…) con ingreso `48 + rand()*18` por reserva. Contradice el contrato («nunca ceros inventados») | `src/mocks/metricsTabs.ts:189-219` |
| Alta | La reserva pública muestra reseñas de ejemplo (12–51 por barbero, con nombres y comentarios) mezcladas con las reales | `src/mocks/booking/reviews.ts:28-51`, `GET /booking/barbers/:id/reviews` (`handlers.ts:720`) |
| Media | «¡Tarjeta enviada! Le mandamos el código por WhatsApp» y no se encola ningún mensaje (no existe el tipo `giftCard`) | `booking/handlers.ts:699-717`, `i18n/booking/es.ts:586-601`, `whatsapp.ts:11` |
| Media | Panel de la cita: membresía con 10 visitas y corte clásico fijos, visible aunque esté apagada en Configuración | `useAppointmentModel.ts:28-29,175,181`, `PanelParts.tsx:56-64` |
| Media | La reactivación se encola con `sendAt: now`: sale a la hora de aprobar, sin respetar la franja de la Ley 2300 (L–V 7–19, sáb 8–15, nunca domingo ni festivo) ni las horas permitidas de la TCPA | `src/mocks/customers/rhythm.ts:102` |
| Media | Candidatos de reactivación: se corta a 40 **antes** de ordenar por días sin venir; los más atrasados pueden quedar fuera | `src/mocks/customers/rhythm.ts:47` y `:63` |
| Media | La tarjeta de sellos no avanza: `client.visits` no se incrementa al cobrar (en el mock) | `mocks/calendar/handlers.ts` (no hay escritura de `visits`), `booking/logic.ts:304` |
| Baja | El envío no vuelve a comprobar el permiso: si el cliente lo retira entre la aprobación y el envío, sale igual | `src/mocks/booking/dispatch.ts:69-80` |
| Baja | El texto de EE. UU. promete «Hasta 4 mensajes al mes» y no hay tope global; solo «no repetir reactivación en 30 días» | `consent.ts` (US), `rhythm.ts:38` |
| Baja | Cupón `BARBER5` sin tope de usos; cupones en el bundle del navegador | `features/booking/pricing.ts:31-35` |

---

## 3. Qué le falta (tabla priorizada)

Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real). P0 = sin esto hay riesgo legal o no compite.

| Prioridad | Mejora | Por qué | Esfuerzo | Depende de |
|---|---|---|---|---|
| P0 | **Permiso comprobado en el servidor** al enviar: la cola vive en el servidor (cron), la función de envío deja de ser pública y rechaza marketing sin `marketingConsent.accepted` vigente | TCPA (consentimiento escrito para promociones), Ley 1581; hoy cualquiera puede mandar la plantilla de marketing | M | Backend real, cola en servidor (pendiente 1 del README) |
| P0 | **Baja real**: webhook de WhatsApp que lee «STOP/BAJA/ALTO/CANCELAR…» y el botón de Meta para dejar de recibir promociones; marca el permiso como retirado con fecha y origen | FCC: «STOP» y sinónimos son revocación; Ley 2300: mecanismo ágil para dejar de recibir | M | Webhook de Meta (pendiente 1) |
| P0 | **Franja y tope por país**: no enviar marketing fuera de horario (Colombia L–V 7–19, sáb 8–15, nunca domingo/festivo; EE. UU. 8 a. m.–9 p. m. hora del cliente) y tope mensual por cliente sumando todos los tipos | Ley 2300; TCPA; la promesa «hasta 4 al mes» del texto de EE. UU. | S | Zona horaria y festivos de la sede (hechos) |
| P0 | **Métricas › Marketing con datos reales**: canales desde `utm` de las reservas y el origen del cliente; campañas desde lo enviado; vacío honesto si no hay datos | Hoy se decide sobre cifras al azar; el contrato lo prohíbe | S | — |
| P0 | **Quitar las reseñas de ejemplo** de la respuesta pública (o marcarlas `demo` y no mostrarlas fuera de la vista previa) | FTC (16 CFR 465, multas por reseña falsa); Google; confianza | S | — |
| P0 | **Cumplir lo prometido**: enviar el código de la tarjeta de regalo (tipo `giftCard`, plantilla de utilidad) y leer la membresía de Configuración en el panel | Hoy se le miente al cliente y al barbero | S | — |
| P1 | **Campañas a un segmento**: elegir grupo (por ciclo de vida, servicio, barbero, sede, última visita, permiso), plantilla aprobada, vista previa, **costo estimado** antes de enviar, programar | Paridad con todo el sector; WhatsApp cobra por mensaje de marketing | M | P0 de permiso y franja |
| P1 | **Automatizaciones con interruptor**: cumpleaños, gracias tras la primera visita, recompra por ritmo (la reactivación, en automático con tope), paquete por vencer, «te falta 1 para tu cortesía» | Lo estándar (Fresha, Square, Boulevard, Mangomint Flows); el ritmo ya está calculado | M | Campañas, cola en servidor |
| P1 | **Pedir reseña tras la visita** con enlace a la reseña interna y a **Google**, a todos por igual (sin filtrar a los contentos) | Google prohíbe el filtrado (*review gating*) e incentivos; las reseñas de Google pesan en la búsqueda local | S | Enlace de Google en Configuración |
| P1 | **Cupones administrables**: crear, vencer, tope total y por cliente, solo ciertos servicios o días; usables **en la caja** | El dueño hoy no puede hacer una promo | M | — |
| P1 | **Fidelización en el mostrador**: canjear la cortesía y gastar el paquete en la caja; el sello avanza con cada cobro (también walk-in) | La mitad de las visitas no pasa por la reserva | M | Contador de visitas real |
| P1 | **Origen del cliente** («¿cómo nos conociste?» al crear, UTM que sube a la ficha) e informe de ingreso por origen | Saber en qué canal invertir; base de referidos | S | — |
| P1 | **Referidos**: código o enlace por cliente, premio para los dos al cobrar la primera visita del referido, tope | Boca a boca es el canal natural de barbería; theCut lo tiene | M | Cupones, origen del cliente |
| P1 | **Resultado de cada campaña**: enviados, entregados, leídos, reservaron en 14 días, cobrado, costo, retorno | Sin esto no se sabe si vale la pena pagar WhatsApp | M | Campañas, webhook de estados |
| P1 | **Correo como canal barato** (promos, recibos, resumen) con baja de un clic | Cuesta casi nada frente a WhatsApp/SMS; obligatorio para EE. UU. si no hay SMS | M | Proveedor de correo (Resend/SES) |
| P2 | **Membresía por suscripción** (cuota mensual con N servicios o ilimitado, cobro recurrente, pausa y baja) y renombrar la de sellos a «tarjeta de sellos» | Modelo que crece en barbería (Zenoti **declarado**: +20 % en 2025); ingreso predecible | L | Pasarela con cobro recurrente por país (Stripe en EE. UU.; Wompi/Mercado Pago en Colombia, ?) |
| P2 | **SMS en EE. UU.** con registro 10DLC (marca + campaña) o delegado a un proveedor | Parte de los clientes de EE. UU. no usa WhatsApp | M | Proveedor (Twilio u otro), EIN por barbería |
| P2 | Respuesta a reseñas (con borrador) y aviso al dueño de una reseña ≤ 3 | El 89 % espera respuesta (BrightLocal 2025, vía tercero) | S | Bandeja de avisos (13) |
| P2 | Pases de Apple/Google Wallet para tarjeta de sellos y de regalo | Recordatorio físico en el teléfono (ya propuesto en 10) | M | — |
| P2 | Anuncios «Click to WhatsApp» con su ventana gratis y atribución | Mensajes gratis dentro de la ventana de entrada (Meta) | M | Agente de WhatsApp |
| P2 | Programa de puntos | En barbería, sellos por visita son más claros que puntos; solo si hay mucha venta de producto | M | — |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial · ✗ no consta · ? no verificado. Las cifras de precio son del
proveedor o de terceros, y varias fuentes no coinciden entre sí; se indica.

### Sector (belleza y barbería)

| Función | Barberlytics | Booksy | Fresha | Square Appts | Vagaro | GlossGenius | Squire | theCut | AgendaPro | Mangomint | Boulevard |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Campañas masivas | ✗ | ✓ | ✓ correo y SMS, pago por uso | ✓ Square Marketing | ✓ (1.000 correos/mes incluidos, SMS aparte) | ✓ | ? | ? | ✓ correo | ✓ Campaigns | ✓ |
| Automatizaciones | ~ reactivación aprobada | ? | ✓ recompra, cumpleaños, recuperar, fidelidad | ✓ bienvenida, recuperar, cumpleaños, reseña en Google, recompra a 3 meses | ? | ✓ | ? | ? | ✓ por comportamiento | ✓ Flows | ✓ |
| WhatsApp | ~ plantillas, sin permiso en servidor | ? | ? | ✗ | ? | ? | ? | ? | ? (no consta en su página de marketing) | ✗ | ✗ |
| Pedir reseña en Google | ✗ | ? | ? | ✓ | ? | ✓ (declarado) | ? | ✗ (reseñas propias) | ✓ encuestas | ? | ? |
| Referidos | ✗ | ? | ? | ✗ (lo piden en su comunidad) | ? | ✓ | ? | ✓ | ? | ? | ? |
| Membresía por suscripción | ✗ (sellos) | ? | ✓ | ? | ✓ | ? | ✓ con cobro automático | ? | ? | ✓ incluida | ? |
| Sellos / puntos | ✓ sellos (solo en línea) | ? | ✓ | ✓ Square Loyalty | ✓ | ✓ | ✓ | ? | ✓ | ? | ? |
| Paquetes | ✓ (solo en línea) | ? | ✓ | ? | ✓ | ? | ? | ? | ? | ✓ | ? |
| Tarjetas de regalo | ✓ | ? | ✓ | ✓ | ✓ | ? | ? | ? | ✓ | ? | ? |
| Cupones administrables | ✗ (3 fijos) | ? | ✓ | ? | ? | ? | ? | ✓ (3 tipos de promoción) | ✓ | ? | ? |
| Atribución por canal | ~ UTM guardada sin leer | ? | ? | ? | ? | ? | ? | ? | ✓ reportes | ? | ✗ (reseña de tercero: no distingue reservas por correo) |
| Redacción con IA | ✗ | ? | ? | ? | ? | ✓ Genius AI (declarado) | ? | ? | ? | ? | ? |

**Precios relevantes** (orden de magnitud, verificar antes de usar):

| Proveedor | Precio | Fuente |
|---|---|---|
| Booksy Boost | 30 % de la primera visita de un cliente nuevo de su vitrina, una vez, mínimo ~10 USD; sin cuota | Koalendar (jun-2026), Pabau; una página de Booksy dice 40 % |
| Treatwell | 35 % de la primera reserva nueva por su vitrina; 0 % las siguientes (nuevo = no reservó en 365 días) | Páginas de socios de Treatwell |
| Fresha | Campañas por uso (según mensajes enviados); desde 2025, planes de pago y SMS como complemento (?) | Centro de ayuda de Fresha; reseña alemana de tercero |
| Square Marketing / Loyalty | Marketing desde ~20 CAD/mes por 500 suscriptores; Loyalty 45–60 USD por sede/mes según visitas (varía por país) | Ayuda de Square (CA/AU) y terceros |
| Vagaro | Desde ~24–30 USD/mes; 1.000 correos/mes incluidos; texto ~20 USD/mes extra | Pabau, Capterra, Software Advice |
| Mangomint | 120 USD/sede + 10 USD/persona; marketing desde 30 USD/mes en créditos (1 ¢ por crédito); membresías incluidas | mangomint.com/pricing |
| GlossGenius | Desde ~24–28 USD/mes; marketing, sellos, reseñas y referidos; asistente Genius AI (**declarado**) | Software Advice, NailPro; la empresa pasó a llamarse Genius AI (jul-2026) |
| Squire | Desde ~30 USD/mes (barbero) y ~50 (local), membresía con cobro automático | Agregadores, no la web de Squire (?) |
| theCut | Lite gratis; PRO 20–25 USD/mes (dos cifras); referidos de clientes | Centro de ayuda de theCut |

### Fuera del sector

| Referente | Qué aporta a una barbería |
|---|---|
| **Starbucks Rewards** | Los socios hicieron casi el 60 % del ingreso de tiendas propias en EE. UU. en 2025 (>13.000 MUSD, **declarado**). Lección: el programa vale cuando es la forma normal de pagar, no un extra. |
| **Toast** | Fidelidad integrada en el pago (el cliente se inscribe al cobrar con su tarjeta) y SMS con recuperar y bienvenida; Marketing Essentials ~185 USD/mes (Restaurant Dive, fecha ?). Retorno de 5,5× en ofertas por correo (**declarado**, datos propios). |
| **Square Loyalty** | Inscribirse con el celular en el datáfono, sin app. Precio por visitas fieles al mes. Modelo para nuestro sello en la caja. |
| **Klaviyo / Mailchimp** | Plan gratis de ~250 contactos y 500 correos (Klaviyo con 150 SMS); Mailchimp Essentials ~13 USD/mes. Para pymes el correo es casi gratis; lo caro es el SMS/WhatsApp. |
| **Treatwell / Booksy Boost** | Pagar solo por cliente nuevo traído. Útil para comparar: un referido nuestro que regala 5 USD sale más barato que un 30–35 %. |

### Hallazgos

1. **La paridad básica es campañas + automatizaciones + reseñas en Google + algo de fidelidad.** Barberlytics tiene
   las piezas de fidelidad (y algunas mejor que la competencia), pero le faltan campañas y automatizaciones.
2. **Nadie del sector anglosajón documenta WhatsApp para marketing.** Es la ventaja natural para barberías hispanas,
   en EE. UU. y en Colombia, siempre que el cumplimiento sea impecable.
3. **La reactivación con hueco concreto y aprobación del dueño no aparece** en lo revisado: Square manda «vuelve a
   reservar» a los 3 meses fijos; Fresha, un recordatorio por servicio. Nuestro ritmo por cliente es superior.
4. **Las membresías por suscripción son el diferencial de las herramientas de barbería** (Squire, Mangomint) y, según
   Zenoti (**declarado**), lo que más creció en barbería en 2025 mientras bajaban los clientes nuevos.

---

## 5. Mercado y tendencias

### WhatsApp: precios y política (2025–2026)

- **Desde el 1 de julio de 2025 se cobra por mensaje entregado**, según categoría (marketing, utilidad,
  autenticación) y país del destinatario. Lo que escribe el cliente no se cobra (página de precios de Meta).
- **Cambios de 2026** (página de Meta, leída): COP como moneda de facturación para Colombia desde el 1 de abril;
  tarifas de utilidad y autenticación más bajas en Norteamérica desde el 1 de enero; y **desde el 1 de octubre de
  2026** se vuelven a cobrar los mensajes de servicio por encima de 1.000 al mes por número, y también las plantillas
  de utilidad dentro de la ventana de 24 h. Implicación: el agente de WhatsApp y los recordatorios dejan de ser
  «casi gratis» en volumen.
- **Tarifas por país**: la página oficial remite a tablas descargables. Un tercero (Message Central, 2026) da
  ~0,0125 USD por mensaje de marketing en Colombia y ~0,025 USD en EE. UU.; otro da ~0,035 USD en EE. UU. **No
  verificado contra la tabla oficial.** Orden de magnitud: una campaña a 500 clientes cuesta ~6 USD en Colombia y
  ~12–18 USD en EE. UU. Hay que mostrar el costo antes de enviar.
- **Solo a quien aceptó** recibir mensajes del negocio (Meta). El usuario puede apagar «ofertas y anuncios» de un
  negocio en WhatsApp; después de eso la API acepta el envío pero no lo entrega, y volver a recibir exige un nuevo sí
  (Clickatell). Meta además limita cuántas plantillas de marketing recibe cada persona según su interacción, sumando
  todos los negocios (360dialog, Spur; el tope exacto no está publicado).
- **Ya dicho en 03**: desde el 15 de enero de 2026 Meta prohíbe los chatbots de propósito general; los del negocio
  (reservar, avisar, reactivar) siguen permitidos.

### SMS en EE. UU.: 10DLC y TCPA

- **Registro A2P 10DLC obligatorio** para escribir desde un número local: marca (~4,50 USD una vez desde agosto de
  2025) y campaña (~15 USD de revisión + ~2 USD/mes para un dueño único), con tope de ~3.000 segmentos/día para
  dueño único (Twilio, Salesmessage). Un revendedor puede cobrar mucho más. Fresha ya avisa que los operadores
  filtran campañas mal registradas.
- **TCPA**: promociones automatizadas por texto requieren **consentimiento escrito previo**, que no sea condición
  de compra (ya en `consent.ts`). Desde el 11 de abril de 2025, el cliente puede revocar «por cualquier medio
  razonable» y palabras como STOP, QUIT, END, CANCEL, UNSUBSCRIBE deben respetarse. La parte que obliga a extender
  la baja a todos los temas se aplazó (hasta el 31 de enero de 2027 según MS Law Group; verificar la orden DA 26-12).
  Implicación: **la baja tiene que funcionar antes de enviar la primera promoción en EE. UU.**
- **Hispanos en EE. UU. usan WhatsApp mucho más** que el promedio: 54–56 % frente a 32 % de todos los adultos
  (encuestas de Pew citadas por Telemundo y Sinch; año exacto ?). Para el mercado decidido, WhatsApp primero y SMS
  como respaldo es razonable.

### Colombia: Ley 2300 de 2023 y Ley 1581

- La Ley 2300 aplica también a **mensajes publicitarios por SMS, aplicaciones de mensajería, correo y llamadas**:
  franja de lunes a viernes 7:00–19:00 y sábados 8:00–15:00, nunca domingos ni festivos; no insistir más de una vez
  al día; el consumidor no puede ser obligado a aceptar publicidad al comprar; y debe haber un **mecanismo ágil para
  dejar de recibirla**. La vigila la SIC; el Registro de Números Excluidos de la CRC permite excluirse (CRC,
  Asuntos Legales). Cómo aplica exactamente la franja a la publicidad está en discusión: tomar la lectura estricta.
- Ley 1581 (ver 03 §5): autorización previa, expresa, informada y demostrable; finalidades separadas.

### Reseñas de Google

- Google es donde más se leen reseñas de negocios locales (83 % según BrightLocal 2025, vía tercero); solo el 4 % dice
  no leerlas nunca. La edición 2026 sube a 41 % quienes las leen «siempre» (BrightLocal).
- **Política de Google**: prohibido ofrecer descuentos o regalos a cambio de reseñas, **prohibido filtrar** (preguntar
  primero y mandar a Google solo a los contentos), prohibidas las cuotas al personal y presionar en el local. Se puede
  pedir reseña a todos por igual (BrightLocal, ApplauseHQ). Implicación: la secuencia «¿cómo te fue? → si 5 estrellas,
  Google» que venden muchos SaaS **no** se debe construir.
- **FTC (regla de agosto de 2024)**: prohíbe reseñas falsas, comprar reseñas y suprimir negativas; hasta ~51.744 USD
  por infracción con conocimiento. Refuerza el P0 de quitar las reseñas de ejemplo.

### Membresías y referidos en barbería

- Zenoti (**declarado**) reporta que en 2025 bajaron 17 % las visitas de clientes nuevos en barbería y crecieron 20 %
  las membresías, con ejemplos de 35–45 USD/mes. Locales en EE. UU. venden «cortes ilimitados por cuota fija, sin
  contrato» con reserva prioritaria. Riesgos: definir qué cubre, topes por mes y la baja clara al contratar
  (Sprintlaw, Reino Unido; revisar la ley de cada país, en EE. UU. las leyes estatales de renovación automática ?).
- Referidos: theCut los ofrece entre clientes; Square no (lo piden en su comunidad). No se encontraron cifras
  independientes de conversión de referidos en barbería; no se citan.

### Tendencias

1. **Paga solo por el cliente nuevo** (Boost, Treatwell) frente a **cultiva al que ya tienes** (membresías, sellos).
   Para una barbería con ciclo de 2–4 semanas, retener vale más que comprar.
2. **El agente propone y el dueño aprueba** (GlossGenius Genius AI, Toast, HubSpot): la IA redacta y segmenta, una
   persona envía.
3. **Fidelidad sin app**: el celular es la cuenta (Square, Toast). Ya es así en Barberlytics.
4. **Costo por mensaje en subida** en WhatsApp: medir el retorno de cada campaña deja de ser opcional.

---

## 6. IA

### Datos que ya tenemos

| Dato | Dónde | Sirve para |
|---|---|---|
| Ritmo por cliente (`visitEveryDays`, `lastVisitAt`, hora habitual `usualTime`, barbero preferido) | `visitSuggestion()`, `rhythm.ts` | Abandono, mejor momento, hueco a ofrecer |
| Permiso con versión y país | `marketingConsent` | Filtrar siempre antes de proponer |
| UTM de cada reserva y origen del embudo | `handlers.ts:549`, `funnel.ts` | Atribución y retorno por canal |
| Ocupación por franja | `buildInsightsMetrics` | Llenar horas flojas con campañas |
| Reseñas con comentario | `reviews.ts` (las reales) | Temas que repiten los clientes, borrador de respuesta |
| Catálogo con margen (Rentabilidad) | Servicios › Rentabilidad | Qué promocionar sin perder dinero |
| Narración con marcadores | `server/narrative/narrative.ts` | Texto de campaña sin cifras inventadas |

### Casos

1. **Segmentos sugeridos**: «23 clientes de fade cada 3 semanas que llevan 5; 15 aceptaron promociones» — con
   reglas sobre el ritmo, no con un modelo. La IA solo nombra y explica el grupo.
2. **Mejor momento para escribir**: ya existe `usualTime`. Enviar el día que le toca, 2 h antes de su hora
   habitual, dentro de la franja legal. Sin modelo.
3. **Texto de la campaña con marcadores**: Claude redacta con `{nombre}`, `{barbero}`, `{hueco}`, `{enlace}`; el
   servidor rellena y rechaza dígitos (mismo control que la narración). Para WhatsApp, la IA redacta la **plantilla**
   que el dueño manda a aprobar a Meta, no cada mensaje.
4. **Predicción de abandono**: el ritmo ya marca «le toca / en riesgo / perdido». Con historia suficiente, un modelo
   que use también inasistencias, gasto y reseñas (Capacidad A del README).
5. **Llenar huecos**: cruzar franjas de baja ocupación del sábado con clientes vencidos que suelen venir sábado.
6. **Leer las respuestas**: clasificar lo que contesta el cliente (baja, «sí, apártamelo», pregunta, queja) para dar
   de baja al instante, reservar con un toque o pasar a una persona.
7. **Resumen de resultado**: «La campaña del martes llegó a 120, reservaron 14, se cobraron 520 USD, costó 3 USD».
8. **Borrador de respuesta a reseñas**, que el dueño edita y publica.

### Top 5 apuestas

| # | Apuesta | Datos | Tipo | Esfuerzo | Riesgo y control |
|---|---|---|---|---|---|
| 1 | **Reactivación en automático con tope**: la lista de hoy, programada al momento habitual de cada cliente y dentro de la franja | Ritmo, permiso, huecos · ✓ | Reglas | S | Tope mensual por cliente; el dueño aprueba la regla una vez |
| 2 | **Clasificador de respuestas** de WhatsApp (baja / acepta / pregunta / queja) | Webhook · ✗ | LLM | M | La baja por palabra clave va primero, sin IA; la IA solo para lo ambiguo |
| 3 | **Texto de campaña con marcadores** | Narración · ✓ | LLM | S | Sin dígitos; plantillas aprobadas por Meta |
| 4 | **Segmentos sugeridos con la cifra de retorno esperado** (cuántos reservarían y cuánto costaría) | Ritmo, ticket, costo por mensaje · ✓ | Estadística + LLM para nombrar | M | Nunca enviar sin aprobación |
| 5 | **Retorno por canal y campaña** («Instagram trae menos, pero vuelven más») | UTM, origen · ~ | Estadística + narración | M | Mostrar tamaño de muestra; no concluir con pocos datos |

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Legal y verdadero (3–4 semanas)

- Cola de mensajes en el servidor; `/api/whatsapp/send` interno; permiso comprobado al enviar.
- Webhook: baja por palabra clave y por el botón de Meta; estados entregado/leído.
- Franja horaria y festivos por país de la sede; tope mensual de marketing por cliente.
- Métricas › Marketing desde la UTM real y lo enviado; vacío honesto.
- Sin reseñas de ejemplo en la reserva pública; tarjeta de regalo que de verdad se envía; membresía del panel leída
  de Configuración; arreglar el orden de los candidatos de reactivación.
- **Éxito:** 0 mensajes de marketing a clientes sin permiso o fuera de franja (auditable en el registro); bajas
  procesadas en menos de 1 minuto; ninguna cifra de Marketing sin origen.

### Fase 2 — Campañas y automatizaciones (6–8 semanas)

- Campañas a segmentos con vista previa, costo estimado y programación; correo como segundo canal.
- Automatizaciones: cumpleaños, primera visita, recompra por ritmo, paquete por vencer, falta un sello, pedir reseña
  (interna y Google, a todos).
- Cupones administrables usables en línea y en la caja; canje de cortesía y paquete en la caja; sello que avanza.
- Origen del cliente en la ficha; referidos con premio para los dos.
- Resultado por campaña (enviados → reservaron → cobrado → costo).
- **Éxito:** % de clientes «le toca» que vuelven en 30 días (antes/después); reseñas en Google por mes; retorno por
  campaña > 5× su costo de mensajes.

### Fase 3 — IA que propone (2–3 meses)

- Segmentos sugeridos con retorno esperado; texto de campaña y de plantillas con marcadores.
- Clasificador de respuestas conectado al agente de WhatsApp (reservar el hueco ofrecido en la conversación).
- Membresía por suscripción (según pasarela por país) y renombrar la de sellos.
- Retorno por canal narrado en «Cómo te fue».
- **Éxito:** % de campañas creadas desde una sugerencia; ingreso recurrente de membresías; respuestas resueltas sin
  intervención.

---

## Errores encontrados

Ver la tabla de §2. Los tres que no deben esperar: el envío de WhatsApp sin permiso comprobado en el servidor
(`api/whatsapp/send.ts`), las cifras al azar de Métricas › Marketing (`metricsTabs.ts:189-219`) y las reseñas de
ejemplo en la reserva pública (`booking/reviews.ts:28-51`).

---

## Fuentes

Búsquedas: 22; lecturas completas: 1 (precios de Meta). Lo que viene de un buscador sin abrir la página se cita como
resumen de tercero.

**WhatsApp y Meta**
- Meta, precios de la plataforma (leída): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Meta, registro de cambios: https://developers.facebook.com/documentation/business-messaging/whatsapp/changelog/
- Message Central, tarifas 2026 (tercero): https://www.messagecentral.com/blog/whatsapp-business-api-pricing-2026
- Clickatell, baja de plantillas de marketing: https://clickatell.com/help-center/whatsapp/message-templates/opt-out-of-receiving-marketing-templates-from-my-business
- 360dialog, lista de control para campañas: https://docs.360dialog.com/docs/guides/best-practices/checklist-for-message-broadcasts-and-campaigns
- Spur, límites por usuario: https://help.spurnow.com/en/articles/10531922-whatsapp-s-per-user-marketing-message-limits-why-messages-fail-to-deliver

**EE. UU.: SMS, TCPA, reseñas**
- Twilio, marca A2P 10DLC: https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand
- Salesmessage, dueño único vs. estándar: https://help.salesmessage.com/en/articles/6209925-sole-proprietor-vs-standard-a2p-10dlc-registration
- Nixon Peabody, aplazamiento de la revocación: https://nixonpeabody.com/insights/alerts/2025/04/11/fcc-partially-delays-new-tcpa-consent-revocation-rules
- MS Law Group, «revoke all» a 2027: https://mslawgroup.com/delayed-again-fcc-pushes-back-tcpas-revoke-all-rule-to-january-31-2027/
- Crowell, regla de la FTC sobre reseñas: https://crowell.com/en/insights/client-alerts/final-rule-announced-the-ftc-strengthens-its-enforcement-capacity-against-deceptive-reviews-and-testimonials
- BrightLocal, encuesta 2025: https://www.brightlocal.com/research/local-consumer-review-survey-2025/ · resumen: https://searchlabdigital.com/blog/data-from-brightlocals-consumer-review-survey/
- Políticas de reseñas de Google (terceros): https://brightlocal.com/learn/review-platform-guidelines/ · https://www.applausehq.com/blog/googles-rules-for-incentivizing-reviews
- WhatsApp entre hispanos: https://www.telemundo.com/noticias/noticias-telemundo/estados-unidos/casi-la-mitad-de-los-adultos-hispanos-usa-tiktok-encuesta-pew-rcna137099 · https://sinch.com/fr/blog/potentiel-whatsapp-etats-unis/

**Colombia**
- Ley 2300 de 2023: https://normograma.mintic.gov.co/docs/pdf/ley_2300_2023.pdf
- CRC, conceptos sobre WhatsApp y horarios: https://www.crcom.gov.co/sites/default/files/normatividad/2024537299.pdf
- Asuntos Legales, Registro de Números Excluidos: https://www.asuntoslegales.com.co/consumidor/asi-es-plataforma-del-rne-registro-de-numeros-excluidos-para-que-lo-dejen-de-fregar-3833180

**Competidores del sector**
- Booksy Boost (terceros): https://koalendar.com/blog/booksy-pricing · https://biz.booksy.com/en-gb/comparison/vagaro-comparison
- Fresha, campañas y automatizaciones: https://www.fresha.com/help-center/knowledge-base/marketing/137-create-multichannel-blast-campaigns · https://www.fresha.com/help-center/knowledge-base/marketing/125-automated-messages-overview
- Square, campañas automáticas: https://squareup.com/help/us/en/article/5660 · precios Marketing: https://squareup.com/help/ca/article/6150 · Loyalty: https://square.com/help/ca/en/article/6382 · comunidad (referidos): https://community.squareup.com/t5/Beauty-Wellness/Calling-All-Square-Users-Referral-Program-for-current-and-non/m-p/838895
- Vagaro (terceros): https://pabau.com/blog/vagaro-pricing/ · https://www.capterra.com/p/153752/Vagaro/pricing/
- GlossGenius / Genius AI: https://www.softwareadvice.com/medical/glossgenius-profile/ · https://www.nailpro.com/home/product/22875752/gloss-genius-genius-ai-from-gloss-genius · https://fortune.com/press-releases/genius-ai-glossgenius-series-d-valuation-2026-07-21/
- Squire (agregadores): https://www.getapp.com/barbershop-software/a/squire · https://www.softwareadvice.com/salon/squire-profile/
- theCut: https://help.thecut.co/en/articles/9156628-understanding-thecut-s-pro-subscription-and-transaction-fees · https://thecut.co/mobile-app/ios/faqs
- AgendaPro: https://agendapro.com/co/fidelizacion-de-clientes · https://agendapro.com/marketing
- Mangomint: https://www.mangomint.com/pricing/ · https://mangomint.com/features/memberships-and-packages · https://www.mangomint.com/learn/marketing-credits/
- Boulevard: https://www.joinblvd.com/blog/boulevard-subscription-whats-included · https://thesalonbusiness.com/boulevard-software-review/
- Zenoti, membresías en barbería (declarado): https://www.zenoti.com/thecheckin/barbershop-membership-programme-guide
- Sprintlaw, membresías (Reino Unido): https://sprintlaw.co.uk/articles/subscription-terms-for-uk-barber-shops-offering-memberships/

**Fuera del sector**
- Starbucks: https://about.starbucks.com/?p=275421
- Toast: https://www.restaurantdive.com/news/toast-adds-branded-apps-and-text-marketing/729199/ · https://community.toasttab.com/t5/product-updates/april-2025-product-updates-international/m-p/14982 · https://pos.toasttab.com/ca/lp/restaurant-guest-engagement
- Klaviyo y Mailchimp (terceros): https://www.inboxarmy.com/blog/klaviyo-pricing/ · https://www.brevo.com/blog/mailchimp-price-increase/
- Treatwell: https://www.treatwell.co.uk/partners?p=45 · https://whito.co.uk/tools/treatwell-cost-salons-uk/

**Del propio repo**
- `docs/investigacion-modulos/03-clientes.md` §5 (Ley 1581, WhatsApp, política de Meta de enero de 2026)
- `docs/investigacion-modulos/01-metricas.md` (#7 y #12: IA y Marketing simulados)
- `docs/investigacion-modulos/10-reserva-en-linea.md` (referidos y Wallet)
- `docs/investigacion-modulos/13-avisos-y-ayuda.md` (cola en el navegador, webhook)
- `docs/investigacion-modulos/README.md` (capacidades A–F y pendientes)
