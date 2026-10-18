# Reserva en línea — investigación

Investigación del 2026-10-17 sobre la reserva del cliente final (ruta `/reservar`). No se tocó código. Fuentes
internas: `src/features/booking/` (incluye `variants/agenda`, `variants/chat`, `flow`, `steps`, `preview`),
`src/booking-app/`, `src/mocks/booking/`, `src/components/chat/`, `src/lib/chat/`, `docs/API_CONTRACT.md` § «Reserva en
línea», `ai-tools/CODEMAP.md` y las notas de decisión de la reserva. Parte de **`docs/BOOKING_RESEARCH.md`
(2026-10-08)** y **`docs/BOOKING_VERSIONS.md`**, no los repite: aquí se comprueba qué de aquella propuesta ya está hecho y
se amplía hacia fuera del sector de belleza y hacia la IA. Fuentes externas al final; lo que dicen los proveedores de sí
mismos va marcado como **declarado**. La búsqueda web de esta ronda llegó a su límite antes de cubrir Uber, Rappi, Airbnb y
Resy: lo que se dice de ellos va marcado **(patrón conocido, sin fuente consultada)**.

## Resumen ejecutivo

1. En nueve días la reserva cerró **casi toda la fase 1 y 2** de `BOOKING_RESEARCH.md`: anticipo condicional, límites de
   intentos, consentimiento sin marcar y guardado con fecha, recordatorios programados (WhatsApp 24 h y 2 h), `.ics` con
   alarmas, cita fija, «Lo antes posible», reseñas solo de citas cumplidas, fotos de referencia, embudo con UTM, paquetes,
   tarjetas de regalo, membresía y lista de espera que se ofrece al liberarse una hora.
2. Lo que falta ya no es de pantalla: es **la conexión con el mundo real**. Pago simulado (Stripe en el ajuste), dinero en
   USD, sin PSE/Nequi/Bre-B, sin zona horaria, los mensajes se quedan en un `outbox` que nadie envía ni escucha.
3. **Clipper es un chat por reglas** (`parseBookingText`, 288 líneas) con voz (TTS en servidor, reconocimiento del navegador).
   Es la base correcta para un agente: ya despacha las mismas acciones del motor; falta el modelo detrás de `interpret` y
   llevarlo a **WhatsApp**, donde está el cliente latinoamericano.
4. El cambio de 2025-2026 es que **otros agentes reservan por el cliente**: Google AI Mode ya busca disponibilidad en
   Booksy, OpenTable y Resy; ChatGPT abre apps sobre MCP y cobra con ACP. Barberlytics no expone nada legible por agentes.
5. Top 5 de IA: Clipper en WhatsApp, «lo de siempre» proactivo, reservable por agentes (MCP + schema.org), riesgo de
   inasistencia que ajusta anticipo y recordatorios, y foto de referencia asistida. La prueba virtual de cortes, después.

---

## 1. Qué tiene hoy

**Mercado, según el código.** Español primero con inglés (`src/app/i18n/booking/es.ts`, `en.ts`); los celulares de demo
son colombianos (`+57 320 217 2738`, `src/mocks/booking/state.ts:136`); la voz escucha en `es-CO`
(`variants/chat/BookingVoice.tsx`). Pero la moneda sale de Configuración y en la demo es **USD** con sedes en Massachusetts,
North Carolina y Rhode Island en `America/New_York` (`src/mocks/settings/seed.ts:66-89`), y la pasarela configurada es
Stripe. Conclusión: el producto habla a barberías hispanohablantes; Colombia es el mercado objetivo pero la demo vive en
EE. UU. Toda recomendación de pagos y mensajería abajo asume Colombia primero.

**Versiones del recorrido** (`src/features/booking/versions.ts`). Existen cuatro; se **ofrecen dos**: «Según el cliente»
(`mixed`, la predeterminada: el celular decide si entra a la Agenda en lista o Paso a paso) y «Conversación» (`chat`,
Clipper). Paso a paso (`guided`) y Agenda en lista (`agenda-list`) siguen vivas porque la mixta las usa
(`HIDDEN_BOOKING_VERSIONS`). La versión viaja en `?version=`; no se elige por barbería.

| Capacidad | Estado | Dónde |
|---|---|---|
| Reconocer por celular sin código | Hecho. `POST /booking/phone/check` devuelve perfil sin lo sensible + token de vista previa; 20 consultas/10 min en el mock | `mocks/booking/handlers.ts:536`, `steps/entry/usePhoneEntry.ts` |
| Código (OTP) solo al pagar, lista de espera, «Mis citas», paquetes, regalos | Hecho; 5 códigos/10 min, 5 intentos (`429`) | `flow/PayIdentity.tsx`, `handlers.ts:556-590`, `BookingState.verified` |
| Bienvenida «Tu ritmo» con próxima visita por frecuencia | Hecho: fecha = última visita + `visitEveryDays`, hora = mediana de sus citas, su barbero primero | `steps/WelcomeStep.tsx`, `mocks/booking/logic.ts:405-460` |
| «Lo antes posible» | Hecho, 14 días | `GET /booking/earliest` |
| Barberos alternativos por habilidad | Hecho | `flow/AlternativeBarbers.tsx`, `mocks/booking/alternatives.ts` |
| Varias citas, para otros, visita en partes | Hecho en las 4 versiones | `visit.ts`, `flow/VisitPartNote.tsx` |
| Lista de espera por franja y oferta al liberarse | Hecho: avisa a los 3 primeros que encajan, gana el primero | `mocks/booking/reminders.ts:offerFreedSlot` |
| Confirmación y recordatorios (WhatsApp, 24 h y 2 h) | **Programados en `db.booking.outbox`**, no se envían | `mocks/booking/reminders.ts` |
| `.ics` con alarmas | Hecho (`VALARM`) | `bookingFormat.ts:93` |
| Cita fija (cada 1-4 semanas, hasta 6) | Hecho; se paga en la barbería | `flow/RepeatSheet.tsx`, `mocks/booking/recurring.ts` |
| Reprogramar, cancelar con reembolso a tarjeta o saldo | Hecho, con política y cargo tardío | `steps/ManageStep.tsx`, `flow/RescheduleDrawer.tsx`, `flow/CancelDialog.tsx` |
| Reservar de nuevo desde el historial | Hecho («manage.rebook») | `steps/ManageStep.tsx:126` |
| Reseñas verificadas | Hecho: solo citas cumplidas, una por cita; la demo sigue sembrada por hash | `flow/ReviewSheet.tsx`, `mocks/booking/reviews.ts` |
| Anticipo condicional | Hecho: clientes nuevos y/o tras N inasistencias, % configurable | `mocks/booking/logic.ts:272`, `settings/sections/BookingSettings.tsx:165` |
| Paquetes, tarjetas de regalo, membresía (sellos) | Hecho | `steps/PackagesStep.tsx`, `steps/GiftStep.tsx`, `flow/MembershipPerk.tsx` |
| Tarjetas guardadas con gestión | Hecho (`PATCH`/`DELETE /me/cards/:id`) | `flow/SavedCardSheets.tsx` |
| Formas de pago | Tarjeta, billetera, en la barbería, saldo, regalo; **todo simulado** | `flow/usePaymentController.ts`, `flow/PaymentPanel.tsx` |
| Foto de referencia | Hasta 3, también tras reservar | `flow/ReferencePhotoField.tsx`, `POST /reservations/:id/details` |
| Consentimiento de marketing | Sin marcar, guardado con fecha y origen | `steps/ProfileStep.tsx:31`, `handlers.ts:387` |
| Embudo con UTM | Hecho; tarjeta en Configuración › Reservas | `funnel.ts`, `mocks/booking/funnel.ts`, `settings/sections/BookingFunnelCard.tsx` |
| Conversación (Clipper) | Por reglas: intenciones, apartes, perfiles, pago con tarjeta en el hilo, recibo multicanal | `variants/chat/*` (`useChatBooking.ts` 1.017 líneas) |
| Voz | TTS en servidor (Gemini o ElevenLabs, `api/tts`), reconocimiento del navegador; cae a la voz del navegador | `src/lib/chat/speech.ts`, `components/chat/useVoiceSession.ts` |
| Superficies | Enlace, widget, tablet y monitor del local; exportable a `booking-flow` | `preview/`, `src/booking-app/` |

---

## 2. Análisis del módulo

### Fortalezas

- **Un motor, varias caras.** `useBookingEngine` + `bookingReducer` + `usePaymentController` sostienen las cuatro versiones;
  cobros, cupones y membresía salen iguales. Es lo que permite poner un agente nuevo (WhatsApp, voz, un agente de terceros)
  sin reescribir reglas: Clipper ya despacha las mismas acciones que la pantalla.
- **Predicción útil sin IA.** La propuesta por frecuencia (FOV, hora mediana, mismo barbero, búsqueda hacia delante) es el
  «lo de siempre» que Uber o Rappi resuelven con «volver a pedir» **(patrón conocido, sin fuente consultada)**, pero con
  agenda real detrás. Pocos competidores de belleza lo muestran tan arriba.
- **Contrato honesto.** Cada endpoint está en `API_CONTRACT.md` con códigos de error; el servidor calcula el total con el
  mismo `pricing.ts` que la pantalla. Un backend real puede implementarlo sin adivinar.
- **Ciclo completo del cliente**: reservar, pagar, mover, cancelar con reembolso a saldo, calificar, repetir, dejar fija,
  regalar, comprar paquete. La deuda de producto del 2026-10-08 se pagó casi entera.

### Huecos

1. **Nada sale del mock.** `outbox` lista mensajes que un servidor debería enviar; nadie escucha las respuestas
   («Confirmo» / «Reprogramar» viven solo en el texto). Stripe está configurado como proveedor con `connected: false`.
2. **Dinero y hora locales.** La moneda es configurable, pero no hay PSE, Nequi ni **Bre-B** (el sistema de pagos inmediatos
   de Colombia, un año en marcha). Tampoco hay zona horaria: `availability` compara con `new Date()` del proceso
   (`mocks/booking/logic.ts:204-205`); un widget visto desde otra zona o un servidor en UTC correría las horas.
3. **Lo configurable que no se aplica**: el precio por ocupación (`surge`) se edita en Ajustes y la reserva lo ignora; los
   cupones (`PROMOS` en `pricing.ts:29`) y «Popular» (`POPULAR` en `logic.ts:177`) siguen fijos en el código.
4. **Protección contra inasistencias a medias.** Hay anticipo, pero no «cliente de confianza» exento ni cargo a tarjeta en
   archivo para quien paga en la barbería y no llega (lo que Booksy declara en su página de funciones).
5. **El embudo no distingue versión.** Los pasos que cuenta (`TRACKED` en `funnel.ts`) son los de Paso a paso; la Agenda y
   la conversación no pasan por todos. `BOOKING_VERSIONS.md` ya lo deja pendiente; sin esto no se puede decidir entre
   «Según el cliente» y Clipper con datos.
6. **No es descubrible fuera del enlace**: sin JSON-LD (`schema.org/HairSalon` + `ReserveAction`), sin Reserve with
   Google, sin botón de Instagram, sin pase de Wallet, sin compartir (`navigator.share` no aparece) ni referidos.

### Deuda técnica y de documentación

- `variants/chat/useChatBooking.ts` (1.017 líneas) y `mocks/booking/handlers.ts` (805) pasan el límite de 800 de las reglas
  del repo. Antes de poner un modelo detrás de `interpret`, conviene partir `useChatBooking` en intérprete, diálogo y
  acciones.
- **Contradicción en el contrato**: el primer párrafo de «Reserva en línea» dice que la respuesta «no dice si es cliente»,
  pero `POST /booking/phone/check` sí lo dice y entrega nombre, última visita y barbero (riesgo aceptado por el usuario el
  2026-10-13). Hay que reescribir ese párrafo y, para producción, considerar mostrar solo «Marcela G.».
- Cuatro versiones con dos ofrecidas: cada regla nueva (visita en partes, horas que se cruzan) se implementa cuatro veces.
  Si los datos del embudo confirman a «Según el cliente» y Clipper, podar Paso a paso y Agenda como superficies propias.
- La voz depende de `SpeechRecognition` del navegador (`isSpeechRecognitionSupported`); donde no existe, el modo voz queda
  en «no disponible». Para WhatsApp (notas de voz) o teléfono habrá que transcribir en servidor.

### UX

- La entrada por celular sin código es la decisión correcta para el recurrente (bienvenida «Tu ritmo» en dos toques).
- La reserva es completa pero **larga para el caso dominante** (corte de siempre): el atajo existe solo si el cliente abre
  el enlace. El paso siguiente no es otra pantalla, es **llevar la propuesta al cliente** (mensaje cuando le toca).
- Clipper pregunta bien, pero lo que no entiende lo vuelve a preguntar; con texto real de WhatsApp («parce, mañana tipo 5
  con el mono») las reglas se quedan cortas. Ahí está el valor de un modelo de lenguaje.

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto, M medio, B bajo. Esfuerzo: S (días), M (1-3 semanas), L (más de un mes, o depende de terceros).

| Prioridad | Qué | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | Pasarela real y pagos locales: COP, PSE, Nequi y Bre-B (QR o llave) vía pasarela colombiana | Sin cobro real no hay anticipo ni paquetes; Bre-B ya es masivo en pagos pequeños | A | L |
| P0 | Enviar el `outbox` por WhatsApp (plantillas *utility*) y procesar las respuestas «Confirmo / Reprogramar / Cancelar» | Los recordatorios son la palanca número uno contra inasistencias; hoy no salen | A | M |
| P0 | Zona horaria de la sede en disponibilidad, `.ics`, recordatorios y textos | Horas corridas = citas perdidas | A | S-M |
| P0 | Corregir el contrato de `phone/check` y decidir cuánto perfil se muestra sin código | Privacidad (Ley 1581) y coherencia para el backend | M | S |
| P1 | Versión elegida por barbería en Configuración + embudo por versión | Decidir con datos qué recorrido queda | M | S-M |
| P1 | Cliente de confianza exento de anticipo; cargo por inasistencia con tarjeta en archivo | Completar la protección que el mercado da por hecha | A | M |
| P1 | Aplicar `surge` o quitar el ajuste; cupones y «Popular» desde Configuración | Lo que se configura debe verse | M | S-M |
| P1 | Horas que no dejan huecos destacadas (2-3 «recomendadas») | Más ocupación sin pedirle nada al cliente | M | M |
| P1 | JSON-LD en la página pública + enlace en Google (Reserve with Google en modo redirect) + botón de Instagram | Descubrimiento y base para agentes | A | S-M |
| P1 | Pase de Apple/Google Wallet de la cita (con hora y sede) | Recordatorio nativo, sin costo por mensaje | M | M |
| P1 | Modelo de lenguaje detrás de `interpret` (con las mismas acciones como herramientas) | Clipper entiende texto real; prerrequisito de WhatsApp | A | M |
| P1 | Partir `useChatBooking` y `handlers` | Mantenibilidad antes de la IA | M | M |
| P2 | Compartir la cita y referidos («regala tu primera visita») | Crecimiento boca a boca, típico de barbería | M | S |
| P2 | Servidor MCP público de reservas (y luego ACP para cobrar) | Ser reservable por ChatGPT, Claude y otros | M | L |
| P2 | Lista de espera con reglas (primero en llegar / mejor cliente / todos) | Ya existe la oferta; falta la política | B-M | M |
| P2 | Recepcionista de voz por teléfono | Barberías que contestan poco el teléfono | M | L |
| P2 | Prueba virtual de cortes | Diferencial, pero riesgo de expectativa | B-M | L |

---

## 4. Benchmark (fuera de lo que cubrió `BOOKING_RESEARCH.md`)

| Referente | Qué hace | Lo que vale copiar | ¿Lo tenemos? |
|---|---|---|---|
| **OpenTable Concierge** (jul. 2025) | Asistente generativo en el perfil del restaurante que responde antes de reservar (qué pedir, dietas, cómo llegar) con menús, reseñas y descripciones verificadas; reservar por el comensal «viene después» | Responder dudas **solo con datos propios** antes de pedir la reserva | Parcial: Clipper responde perfil, sede, precios y horario por reglas |
| **OpenTable + Loman / VOICEplug** (nov.-dic. 2025) | Agentes de voz que toman, cambian y cancelan reservas con disponibilidad real | El canal teléfono como agente sobre la misma API | No |
| **SevenRooms** | CRM de comensales que une reservas, visitas y pedidos; reservas desde web, Google, Instagram, DoorDash y Yelp; voz con IA | Una ficha que alimenta personalización y canales externos | Parcial: ficha en Clientes; un solo canal |
| **Resy Notify** | Avisar cuando se libera una mesa **(patrón conocido, sin fuente consultada)** | La lista de espera como suscripción | Sí (`slotFreed`) |
| **Uber / Rappi** | «Volver a pedir» en un toque desde el historial **(patrón conocido, sin fuente consultada)** | Re-reserva de un toque **fuera** del enlace: notificación, WhatsApp | Sí dentro de la reserva; no proactivo |
| **Airbnb** | Reserva inmediata y reseñas de ambos lados **(patrón conocido, sin fuente consultada)** | Reseña del barbero sobre el cliente (puntual, faltó), base del «cliente de confianza» | No |
| **Zocdoc Zo** (mayo 2025) | Asistente telefónico que agenda, reprograma y cancela 24/7 con las reglas de la consulta; deriva lo complejo al personal; **declara** planes de llamar a pacientes con riesgo de no asistir | Derivación a humano y riesgo de inasistencia como disparador | No |
| **Doctolib** (Aaron.ai, comprada en 2024) | Asistente de voz que agenda en consultas saturadas de llamadas | Voz sobre agenda real en un mercado de pymes | No |
| **Calendly** (formularios de enrutamiento) | Según las respuestas, lleva a la página de reserva y persona correctas | Preguntar «¿qué te quieres hacer?» y elegir barbero por habilidad | Parcial: alternativas por habilidad |
| **Reserve with Google** | Hoy, para *Appointments*, Google lista integraciones **Redirect** y **Offers**; el End-to-End aparece solo en restaurantes | No hace falta ser socio E2E para estar en Google: basta el redirect | No |
| **Google AI Mode** (ago. 2025) | Entiende una petición con varias condiciones, busca disponibilidad en varias plataformas y enlaza a la página de reserva; socios: OpenTable, Resy, Tock, Ticketmaster, StubHub, SeatGeek, **Booksy**; «pronto» servicios locales | La disponibilidad tiene que ser legible por agentes | No |
| **ChatGPT apps + ACP** | Apps de terceros sobre MCP; compras con el Agentic Commerce Protocol (Stripe + OpenAI); OpenTable anunciado como socio | Un servidor MCP de reserva y, después, checkout ACP | No |
| **Booksy** (página de funciones) | Recepcionista con IA que contesta llamadas y agenda (beta), Reserve with Google, «Book Now» en Instagram, cargo por inasistencia con tarjeta en archivo, anticipos | El estándar del competidor directo en barberías | Parcial: anticipo sí; resto no |
| **AgendaPro Sofía** | Recordatorios por WhatsApp desde el número del negocio; si no hay respuesta, reabre la conversación y propone horarios; al cancelar, reagenda y libera el hueco | El ciclo confirmar → reprogramar → rellenar | Programado en el mock; no conversa |
| **Apple / Google Wallet** | Pases de evento o genéricos que el teléfono muestra según lugar; los de tienda muestran saldo | Pase de cita + pase de membresía/tarjeta de regalo con saldo | No |

**Hallazgos.**

1. **La reserva se está desacoplando de la pantalla.** Restaurantes y clínicas venden hoy el mismo inventario por web,
   voz, Google y chats de IA. El patrón ganador es un **núcleo de disponibilidad con API** y muchas caras finas encima.
   Barberlytics ya tiene esa forma (motor compartido); le falta abrir la API a canales y agentes.
2. **El competidor directo ya está en Google AI Mode.** Booksy aparece como socio en el anuncio de Google. Si un cliente le
   pide a Google «un fade mañana a las 6 cerca», hoy el resultado será de Booksy, no de una barbería en Barberlytics.
3. **Reserve with Google cambió de forma.** Para citas, Google documenta redirect y ofertas, no end-to-end: el costo de
   estar es bajo (un enlace con disponibilidad), y el valor está en el perfil del negocio.
4. **El «lo de siempre» gana cuando llega solo.** Uber/Rappi y la bienvenida «Tu ritmo» resuelven lo mismo; la diferencia
   es que el aviso llegue al cliente (WhatsApp, Wallet) en el momento justo, no que el cliente tenga que entrar.
5. **La IA de reservas más madura está en voz, no en chat web**: Zocdoc, Doctolib, OpenTable con terceros, Booksy en beta.

---

## 5. Mercado y tendencias

- **Búsqueda agéntica.** Google AI Mode reserva por el usuario en restaurantes desde agosto de 2025 (EE. UU., Labs, plan
  Ultra) y anunció servicios locales; prensa posterior reporta citas de belleza y bienestar con el pago en la página del
  proveedor. En el panel de Google, la comida a domicilio ya usa **UCP**, un protocolo de comercio para agentes.
- **Chats de IA como tiendas.** Las apps de ChatGPT corren sobre **MCP** y las compras sobre **ACP**, donde el comercio
  sigue siendo el vendedor y expone su checkout por REST o MCP. Fuentes secundarias no coinciden en si OpenTable cierra la
  reserva dentro de ChatGPT o la manda a su sitio.
- **WhatsApp, más barato y más automatizable.** Desde el 1 de julio de 2025 Meta cobra por mensaje de plantilla
  entregado; dentro de la ventana de 24 h que abre el cliente, los mensajes libres y las plantillas *utility* son gratis.
  La política vigente (actualizada en septiembre de 2026) permite automatizar dentro de esa ventana con **escalamiento claro a
  un humano**. Para un recordatorio que el cliente contesta, el resto de la conversación cuesta cero. Meta empuja su propio
  agente (Meta Business Agent) en Latinoamérica según fuentes secundarias; startups como Wando ya reservan citas en español
  sobre la API oficial.
- **Pagos inmediatos en Colombia.** Bre-B (Banco de la República) cumplió un año: más de 116 millones de llaves, más de
  1.700 millones de transferencias, el 62 % por menos de 50.000 pesos y el 37 % pagadas escaneando un QR. Un anticipo de
  corte cabe justo en ese rango. PSE sigue siendo el débito bancario en línea de referencia.
- **Voz con IA como recepcionista.** Pasó de piloto a producto en salud (Zocdoc, Doctolib) y restaurantes (OpenTable con
  terceros, SevenRooms); Booksy la tiene en beta para belleza.
- **Prueba virtual de peinados.** Hay muchas apps de consumo (HairHunt, Hairstyle Try On, YouCam, FaceApp), y L'Oréal
  (ModiFace) hace prueba de color, no de corte. Las reseñas especializadas insisten en que son «ayudas para planear, no
  garantías»: la densidad, los remolinos y el crecimiento no salen en la imagen.

---

## 6. IA

### Casos

| # | Caso | Qué hace / quién lo usa | Cómo aplica a una barbería | Datos que necesita (¿los tenemos?) | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| 1 | **Agente que reserva por WhatsApp** | AgendaPro Sofía (confirma, insiste, reagenda, libera); Meta Business Agent; Wando | Clipper en el número de la barbería: «¿me agendas lo de siempre el viernes?» → propone dos horas → código → listo | Catálogo, disponibilidad, perfil y propuesta FOV (**sí**); número verificado de WhatsApp Business y plantillas (**no**) | Conversacional + agéntica | M | Alucinar horas o precios: el modelo solo propone, el motor confirma. Política de Meta: escalamiento a humano obligatorio |
| 2 | **Recepcionista de voz** | Zocdoc Zo, Doctolib/Aaron.ai, Loman y VOICEplug con OpenTable, Booksy (beta) | Contesta el teléfono del local cuando el barbero está cortando | Lo mismo que el 1 + telefonía y transcripción en servidor (**no**: hoy el reconocimiento es del navegador) | Conversacional + agéntica | L | Latencia, acentos, ruido del local; costo por minuto |
| 3 | **«Lo de siempre» proactivo** | Patrón de re-pedido de Uber/Rappi (sin fuente consultada); la propuesta FOV ya existe | El día que le toca, un WhatsApp: «Andrés tiene jueves 5:30 o sábado 10:00. ¿Te lo aparto?» → un toque | `visitEveryDays`, hora mediana, barbero, `visitSuggestion()` (**sí**); consentimiento de marketing vs. mensaje de servicio (**sí**, guardado) | Predictiva | S-M | Si se manda como marketing, cuesta y requiere opt-in; cuidar la frecuencia |
| 4 | **Recomendar hora y barbero** | Boulevard (horas sin huecos, en el doc anterior); SevenRooms (personalización); Calendly (enrutamiento) | Marcar 2-3 horas «recomendadas» que no dejan huecos y el barbero con más afinidad (habilidades, reseñas, historial) | Disponibilidad y habilidades (**sí**); un modelo de huecos de la agenda (`gapsModel`, en Calendario, **sí**, sin reutilizar) | Predictiva | M | Que «recomendado» parezca publicidad; explicarlo |
| 5 | **Riesgo de inasistencia** | Zocdoc **declara** contacto a pacientes con riesgo de no asistir; AgendaPro insiste ante silencio | Puntuar cada cita: si el riesgo es alto, pedir anticipo, adelantar el recordatorio o pedir confirmación explícita | `noShows`, `cancellations`, antelación de la reserva, respuestas a recordatorios (**parcial**: lo último no existe) | Predictiva | M | Discriminar; debe ser explicable y con techo. Empezar por reglas y medir |
| 6 | **Relleno inteligente de huecos** | AgendaPro (libera y reagenda); lista de espera de Fresha (doc anterior) | Al cancelar, ofrecer primero a quien más probablemente acepte (cercanía, ritmo vencido, barbero) | `offerFreedSlot` y lista de espera (**sí**); tasa de aceptación (**no**) | Predictiva + agéntica | M | Spam; limitar a 3 avisos como hoy |
| 7 | **Concierge de preguntas antes de reservar** | OpenTable Concierge, solo con contenido verificado | «¿Hacen diseño en la barba?», «¿hay parqueadero?»: responde con datos de la sede y del catálogo | Perfil de sede, servicios, habilidades, reseñas (**sí**) | Generativa (con recuperación) | S-M | Inventar; responder solo con datos propios y citar la fuente |
| 8 | **Foto de referencia asistida** | Visión general; no se encontró un referente de barbería | La foto que sube el cliente se describe para el barbero («degradado medio, 2 a los lados, línea marcada») y sugiere el servicio y la duración | `referencePhotos` (**sí**, hasta 3) | Generativa (visión) | S-M | Fotos de terceros/menores; guardarlas con consentimiento y caducidad |
| 9 | **Prueba virtual de cortes** | Apps de consumo; ModiFace (color, L'Oréal) | «Así te vería el fade»: con la selfie, generar 2-3 estilos y reservar el elegido | Selfie (**no**) y un modelo de edición de imagen (**no**) | Generativa | L | Expectativa falsa (las reseñas lo dicen), datos biométricos, sesgo por tipo de cabello |
| 10 | **Reservable por agentes de terceros** | Google AI Mode (Booksy socio), apps de ChatGPT (OpenTable), ACP, UCP | Que Gemini, ChatGPT o Claude encuentren y reserven en una barbería de Barberlytics | API pública de disponibilidad (**sí**, `/booking/*`); MCP, JSON-LD, `llms.txt`, identidad del cliente para agentes (**no**) | Agéntica | M-L | Reservas falsas o en masa; el OTP al pagar sigue siendo la barrera; acuerdos con plataformas fuera de nuestro control |

**Qué exponer para ser «reservable por agentes»** (de menor a mayor esfuerzo):

1. **Página pública legible**: JSON-LD `HairSalon` (hereda de `LocalBusiness`) con `openingHoursSpecification`,
   `makesOffer` (servicios y precios), `aggregateRating` (de reseñas verificadas, que ya existen) y un `potentialAction`
   `ReserveAction` con `target` al enlace de reserva. Un `llms.txt` en la raíz con qué es la barbería y cómo se reserva.
2. **Enlace con disponibilidad en Google** (Reserve with Google en modo redirect) e Instagram «Book Now».
3. **Servidor MCP** con herramientas finas que envuelven el contrato actual: `buscar_disponibilidad`,
   `lo_antes_posible`, `alternativas`, `crear_reserva_pendiente` (aparta sin cobrar, con caducidad) y
   `confirmar_con_codigo`. Recursos: catálogo, sedes, política. El OTP al celular sigue siendo la prueba de identidad.
4. **ACP / UCP** para cobrar el anticipo dentro del agente, cuando haya pasarela real y una plataforma lo pida.

### Top 5 apuestas

1. **Clipper en WhatsApp con un modelo detrás de `interpret`.** El intérprete por reglas pasa a ser la red de seguridad; el
   modelo traduce el texto a las acciones que ya existen (`bookingReducer`, `/booking/*`) y nunca confirma por su cuenta.
   Empieza contestando los recordatorios del `outbox` (confirmar, mover, cancelar), que es tráfico gratis dentro de la
   ventana de 24 h, y después reserva desde cero. Mayor impacto en Latinoamérica.
2. **«Lo de siempre» que llega solo.** Usar `visitSuggestion()` para mandar el día que le toca dos horas con su barbero y
   reservar con un «sí» (por WhatsApp o pase de Wallet). Casi sin IA nueva, con datos que ya tenemos: el mejor
   impacto/esfuerzo.
3. **Reservable por agentes.** JSON-LD + `llms.txt` + redirect de Google en la fase 1; servidor MCP en la fase 2. El
   competidor directo ya está en Google AI Mode; la capa es delgada porque el contrato existe.
4. **Riesgo de inasistencia que mueve palancas.** Una puntuación explicable (historial, antelación, si contestó el
   recordatorio) decide anticipo, momento del recordatorio y si se pide confirmación. Sustituye la regla fija «nuevo o N
   inasistencias» y alimenta el relleno de huecos.
5. **Foto de referencia asistida.** La visión describe la foto para el barbero y propone el servicio y la duración
   correctos (evita citas cortas para trabajos largos). Bajo riesgo, útil al barbero desde el primer día; la prueba virtual
   generativa queda como experimento posterior.

---

## 7. Hoja de ruta en 3 fases

**Fase 1 — Salir del mock (0-6 semanas)**
- Pasarela colombiana con COP, PSE, Nequi y Bre-B; anticipo real; cargo por inasistencia con tarjeta en archivo y cliente
  de confianza exento.
- WhatsApp Business: enviar el `outbox` como plantillas *utility*; webhook que entienda «Confirmo / Reprogramar /
  Cancelar» con botones (sin IA aún).
- Zona horaria de la sede en todo el flujo; contrato de `phone/check` corregido.
- JSON-LD `HairSalon` + `ReserveAction`, `llms.txt`, redirect en Google y botón de Instagram.
- Embudo por versión; versión elegida por barbería en Configuración.

**Fase 2 — Proactivo y conversacional (6-14 semanas)**
- «Lo de siempre» proactivo por WhatsApp y pase de Wallet de la cita.
- Modelo de lenguaje detrás de `interpret` (herramientas = endpoints existentes), primero en la web y luego en WhatsApp,
  con escalamiento a humano y registro de conversaciones.
- Horas recomendadas sin huecos; `surge`, cupones y «Popular» desde Configuración.
- Foto de referencia asistida para el barbero.
- Partir `useChatBooking` y `handlers` antes de crecer.

**Fase 3 — Agentes y predicción (14+ semanas)**
- Servidor MCP público de reservas; ACP/UCP cuando haya demanda de una plataforma.
- Puntuación de riesgo de inasistencia y relleno de huecos por probabilidad de aceptar.
- Recepcionista de voz telefónica sobre el mismo agente (transcripción en servidor).
- Experimento acotado de prueba virtual de cortes, con consentimiento explícito y sin guardar la selfie.
- Referidos y reseña del barbero sobre el cliente (base del «cliente de confianza»).

---

## Fuentes

Consultadas de verdad en esta investigación (página leída o resultado de búsqueda cuyo contenido se usa). Las cifras son
las que da cada fuente; las de proveedores son **declaradas**.

- Google, AI Mode agéntico (21 ago. 2025): https://blog.google/products/search/ai-mode-agentic-personalized/
- Google Actions Center, verticales e integraciones: https://developers.google.com/actions-center
- Google Actions Center, citas: https://developers.google.com/actions-center/verticals/appointments/e2e/overview
- AI Mode y citas de belleza (resultado de búsqueda; la página devolvió 403): https://yourstory.com/ai-story/googles-ai-mode-adds-agentic-booking-for-tickets
- OpenTable Concierge (28 jul. 2025): https://restauranttechnologynews.com/2025/08/opentable-launches-embedded-concierge-to-answer-diner-questions-and-drive-restaurant-bookings/
- Loman AI + OpenTable (3 dic. 2025): https://www.restaurantdive.com/press-release/20251203-loman-ai-announces-integration-with-opentable-enabling-full-voice-ai-power-1/
- OpenTable y ChatGPT (resultado de búsqueda): https://www.restaurantdive.com/news/opentable-partners-with-chatgpt-restaurant-recommendations/646027/
- Agentic Commerce Protocol: https://www.agenticcommerce.dev/
- Model Context Protocol: https://modelcontextprotocol.io/docs/getting-started/intro
- llms.txt: https://llmstxt.org/
- schema.org ReserveAction: https://schema.org/ReserveAction
- schema.org HairSalon: https://schema.org/HairSalon
- Zocdoc Zo (resultado de búsqueda; la página devolvió 403): https://www.zocdoc.com/zo · https://www.fiercehealthcare.com/health-tech/zocdoc-launches-voice-ai-tool-zo-streamline-phone-visit-bookings
- Doctolib y Aaron.ai (resultado de búsqueda): https://www.clubic.com/actualite-589885-fini-les-appels-sans-reponse-chez-le-medecin-grace-a-l-assistant-intelligent-de-doctolib.html
- SevenRooms: https://sevenrooms.com/
- Booksy, funciones: https://biz.booksy.com/en-us/features
- Fresha para negocios: https://www.fresha.com/for-business
- AgendaPro Sofía IA: https://agendapro.com/co/sofia-ia-recordatorios
- Calendly, formularios de enrutamiento: https://calendly.com/help/routing-forms
- WhatsApp Business Platform, precios: https://developers.facebook.com/docs/whatsapp/pricing
- WhatsApp Business, política: https://whatsappbusiness.com/es-la/policy/
- Meta Business Agent en Latinoamérica (resultado de búsqueda, fuente secundaria): https://dapta.ai/blog-posts/ai-news-meta-business-agent/
- Apple Wallet: https://developer.apple.com/wallet/
- Google Wallet, pase genérico: https://developers.google.com/wallet/generic
- Bre-B, Banco de la República: https://www.banrep.gov.co/es/bre-b
- PSE: https://www.pse.com.co/persona
- ModiFace (L'Oréal): https://www.modiface.com/
- Apps de peinados con IA (Unite.AI, actualizado jul. 2026): https://www.unite.ai/?p=319854
- HairHunt (App Store, resultado de búsqueda): https://apps.apple.com/us/app/hairhunt-ai-hairstyle-try-on/id6746489390

Límite: la búsqueda web de esta sesión se agotó; Uber, Rappi, Airbnb y Resy se citan como patrones sin fuente, y conviene
confirmar el estado actual de AI Mode para citas y de ChatGPT con OpenTable antes de decidir la fase 3.
