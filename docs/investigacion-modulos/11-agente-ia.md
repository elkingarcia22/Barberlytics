# Agente IA (Clipper) — investigación

Investigación del 2026-10-18 sobre el **agente del equipo**: el botón «Clipper» de la cabecera, el modo «Agente IA»
del menú lateral (pantalla completa con historial), el panel de chat de «Ayuda › Pregúntame», el modo voz y el foco
que le pasa el panel de una cita. Solo lectura: no se tocó código. El análisis se hizo sobre la rama
`claude/modulos-investigacion-robusta-4af9cc` en `b163627` (incluye la fase 2 de `main`).

Fuentes internas: `src/components/chat/`, `src/lib/chat/`, `src/app/chat/index.ts`, `src/help/chat/helpBackend.ts`,
`src/app/layouts/AppLayout.tsx`, `src/features/calendar/appointmentPanel/appointmentAgent.ts`, `api/tts`,
`server/tts`, `api/whatsapp`, `server/http`, `ai-tools/CODEMAP.md` y los informes 01, 02, 07, 08, 09, 10 y
`panel-de-cita.md`. El **Clipper de la reserva** (el que habla con el cliente) ya está en
[10-reserva-en-linea.md](10-reserva-en-linea.md); aquí solo se cruza con él. Este informe cubre las capacidades
**C** (Clipper como agente con herramientas) y **D** (agente de WhatsApp) del [README](README.md) §3.

Búsquedas: 14 y una lectura directa. Lo que dice un proveedor de sí mismo va como **declarado**; lo que solo
aparece en fuentes de terceros va como «según terceros»; «?» es **no verificado**, no «no existe».

## Resumen ejecutivo

1. **La carcasa es de primera; el cerebro no existe.** Hay un almacén único de conversaciones, panel lateral, pantalla
   completa con historial, preguntas con opciones, tarjetas de datos, voz con TTS neural en el servidor y un «foco»
   que deja a una pantalla abrir a Clipper hablando de una cita. Pero **ningún modelo de lenguaje responde**: contesta
   el centro de ayuda y, si no encuentra artículo, un backend de demostración.
2. **Ese backend de demostración es de otro producto (RR. HH.).** «¿Qué clientes están en riesgo?» puede responder
   «Veo señales de rotación en 6 personas del Q3»; «el plan de la membresía» pide «cuántas sesiones quieres en el
   ciclo». Es el error más visible del módulo y se arregla en un día.
3. **Clipper promete lo que no hace.** Las sugerencias por pantalla («¿Cuánto llevo cobrado hoy?», «¿Qué barbero tiene
   la agenda más floja?») piden datos que nadie consulta; el aviso dice «Antes de ejecutar verás el impacto» y nada se
   ejecuta; deja adjuntar PDF/Excel y los descarta; el formulario de «No útil» da las gracias y no envía nada.
4. **Hay dos Clippers y solo uno hace cosas.** El de la reserva (`variants/chat`, 4.246 líneas) entiende por reglas y
   ejecuta las acciones del motor. El del equipo (`src/lib/chat`) solo conversa. La apuesta es **un núcleo de
   herramientas** compartido por los dos y, después, por WhatsApp.
5. **Dos funciones del servidor están abiertas a cualquiera.** `/api/tts` y `/api/whatsapp/send` aceptan peticiones sin
   sesión (el control de origen deja pasar las que no traen `Origin`, como `curl`). La primera gasta la cuota de voz;
   la segunda envía plantillas de WhatsApp a cualquier número con la cuenta de la barbería.
6. **El mercado ya pasó del chat al agente que propone y la persona aprueba**: Toast IQ edita turnos y menús, Square AI
   responde sobre las ventas, Gusto Gus pide aprobación antes de cambiar un salario, Shopify Sidekick deja el cambio
   listo y el comerciante guarda. En belleza: Zenoti vende nueve agentes, Vagaro lanzó «Vera» (chat), Fresha un
   recepcionista y AgendaPro a «Sofía» y «Julia» por WhatsApp. Booksy no tiene asistente propio (según terceros).
7. **Recomendación**: Fase 1 «honesto y seguro» (quitar el demo, cerrar las funciones, borrar al salir, modelo con
   herramientas **de solo lectura**, evaluaciones); Fase 2 «actúa con vista previa» (agenda, clientes, configuración,
   resumen del día); Fase 3 «afuera» (WhatsApp, voz telefónica, reservable y consultable por agentes externos).

---

## 1. Qué tiene hoy

**Mercado, según el código.** Clipper habla `es-CO` o `en-US` según el idioma de la app (`AppLayout.tsx:177`); la
voz neural tiene estilo «español latino» y, en Azure, la voz colombiana Gonzalo (`server/tts/tts.ts:42-49`). Sirve
igual a una barbería hispana en EE. UU. que a una en Colombia; el idioma lo elige la persona, no la sucursal.

### Inventario

| Área | Qué hay | Dónde |
|---|---|---|
| Puertas de entrada | Botón «Clipper» en la cabecera de cada pantalla (o en la barra flotante cuando las acciones viven ahí); «Ayuda › Pregúntame»; modo «Agente IA» del menú lateral a pantalla completa; la búsqueda ⌘K manda la pregunta al agente; «Pregúntale a Clipper» en el panel de la cita | `AgentButton.tsx`, `AppLayout.tsx:296-333`, `AdminShell.tsx:147-153`, `panelHooks.ts` |
| Almacén | Un solo almacén para panel, pantalla completa, historial y voz. Conversaciones con título, sin leer, detener, regenerar, editar una pregunta, renombrar, borrar. Se guarda en `localStorage` (`barberlytics-chat`) | `src/lib/chat/store.ts`, `src/app/chat/index.ts` |
| Quién responde | `createAppChatBackend` = centro de ayuda y, si ningún artículo cubre la pregunta, el demo. La ayuda busca 3 artículos, contesta con resumen y pasos (máx. 8 líneas), enlace «ver artículo» y los otros dos como sugerencias | `src/help/chat/helpBackend.ts`, `src/lib/help/answer.ts` |
| Demo | 4 reglas por expresión regular (participación, evaluaciones, rotación, plan de formación) y una pregunta genérica de respaldo. Contenido de una plataforma de RR. HH. | `src/lib/chat/demoBackend.ts` |
| Foco | Una pantalla deja «lo que se mira» (`agentFocus.open`) y el shell abre el panel con la primera pregunta hecha; mientras dure, responde primero el foco | `src/lib/chat/agentFocus.ts`, `AppLayout.tsx:141-160` |
| Foco de cita | 11 temas por palabras clave (resumen, alertas, lo que pidió, si cumple, membresía, próxima, ritmo, barbero, qué ofrecer, contacto, precio) con fuente y sugerencias; tarjeta de cifras en el resumen. Respeta `canContact` para el teléfono | `appointmentAgent.ts`, `useAppointmentModel.ts:89-90` |
| Sugerencias por pantalla | 4 por ruta en `/calendario`, `/clientes`, `/usuarios`, `/metricas`; el resto, 4 de ayuda («¿Cómo cobro una cita?») | `AppLayout.tsx:31-45`, `app/i18n/es.ts:76-79, 870-885` |
| Mensaje | Markdown ligero, fuentes, sugerencias, pregunta con opciones (varias, cantidades, buscador, «Otro»), tarjetas `bars` y `metrics`, enlace; copiar, leer en voz alta, 👍/👎 con motivos, regenerar | `ChatAgentMessage.tsx`, `ChatQuestionCard.tsx`, `ChatCardView.tsx`, `ChatFeedbackForm.tsx` |
| Caja de texto | Adjuntar hasta 10 archivos (PDF, Excel, CSV) o fotos, ⌘U, menú de conectores (Gmail, Slack, Drive: la app no pasa ninguno), botón Voz, aviso de que el agente puede equivocarse | `ChatComposer.tsx`, `ChatAttachMenu.tsx` |
| Voz | Reconocimiento del navegador (Web Speech; Chrome, Edge, Safari). Detecta la pausa (1,6 s, más si la frase quedó abierta en «con», «a las»…), reintenta cortes. Respuesta con voz neural vía `/api/tts` o, si no hay, la del navegador eligiendo una voz de hombre. En la app es **dictado** (lo dicho se envía al chat); el modo **conversación** (habla y vuelve a escuchar) solo lo usa la reserva | `src/lib/chat/speech.ts`, `useVoiceSession.ts`, `ChatVoiceMode.tsx` |
| Voz en el servidor | `POST /api/tts`: Gemini (preferido) › Azure › ElevenLabs › OpenAI, según la clave que exista; tope de 1.200 caracteres; 501 sin proveedor. La nota de decisión del 2026-10 habla de ElevenLabs «Eric»; el código prioriza Gemini si hay `GEMINI_API_KEY` | `api/tts/index.ts`, `server/tts/tts.ts` |
| Otros servicios | `POST /api/whatsapp/send` (5 plantillas, solo salida); `askClaude` solo para analizar el feedback de campañas | `server/whatsapp/whatsapp.ts`, `server/feedback/analysis.ts` |
| Clipper de la reserva | Conversación con el cliente por reglas (`parseBookingText`), acciones reales del motor de reserva, voz en conversación | `src/features/booking/variants/chat/` (ver informe 10) |
| Pruebas | Almacén, demo, foco, voz (elección y limpieza del texto), sesión de voz, caja, pregunta con opciones, `topicOf` | `*.test.ts(x)` en `src/lib/chat`, `src/components/chat`, `panelLogic.test.ts` |

**Lo que no hay:** modelo de lenguaje, herramientas sobre los datos, permisos aplicados en el servidor a lo que
responde, historial en el servidor, registro de turnos (pregunta, respuesta, costo, latencia), conjunto de
evaluación, tope de gasto, WhatsApp entrante (no hay webhook), proactividad (Clipper nunca habla primero salvo la
pregunta de apertura del foco) y foco fuera de la cita (cliente, barbero, nómina, métricas).

---

## 2. Análisis del módulo

### Fortalezas

- **Contrato listo para un modelo.** `ChatBackend.reply(question, history, signal)` devuelve texto, fuentes,
  sugerencias, pregunta con opciones, tarjeta y enlace. Es casi exactamente lo que devuelve un modelo con salida
  estructurada. Cambiar de demo a modelo es cambiar `createAppChatBackend` (`src/app/chat/index.ts:23`).
- **El foco es la idea correcta.** Que la pantalla diga «estoy mirando la cita de Marcela» y Clipper llegue con eso
  es lo que hacen Zenoti en el check-in y Toast en el terminal. Hoy responde por reglas; mañana el foco son las
  herramientas y el contexto que se le pasan al modelo.
- **Una sola conversación en todas partes.** Panel, pantalla completa, voz e historial miran el mismo almacén
  (`useSyncExternalStore`). Se puede empezar en el panel de una cita y seguir a pantalla completa.
- **Voz pensada para el mostrador.** Pausa adaptativa, reintentos, voz neural con respaldo, texto limpio para hablar
  (`toSpeech`), claves solo en el servidor. Nadie del sector revisado ofrece voz dentro del software del dueño.
- **Respuestas con fuente.** La ayuda cita el artículo y la cita cita «Historial de Marcela». Es la base de la
  confianza (Gusto y Square insisten en enlazar a la fuente).
- **Accesible.** El hilo es un `role="log"` con `aria-live`; «pensando» es `role="status"`; las opciones se eligen
  con el número.

### Huecos

1. **No hay modelo ni herramientas.** Las preguntas que el propio producto sugiere («¿Quién va tarde y a quién llamo
   primero?», «¿Cuánto llevo cobrado hoy?», «¿Qué servicio deja más dinero?») no tienen quién las conteste.
2. **No ejecuta nada.** El aviso dice «Antes de ejecutar verás el impacto», pero el agente del equipo no tiene ni una
   acción. El de la reserva sí las tiene, por reglas.
3. **Contenido ajeno.** El demo habla de «Ventas Bogotá», «evaluaciones del ciclo Q3» y «rotación». Cae ahí cualquier
   pregunta que no encuentre artículo de ayuda.
4. **El foco solo existe para la cita.** No hay foco de cliente (informe 03), de nómina («¿por qué me pagaron esto?»,
   informe 07), de métricas (informe 01) ni de configuración (informe 09).
5. **Sin memoria de servidor.** Las conversaciones viven en el navegador: no pasan del celular al computador, no se
   borran al salir y no sirven para medir ni mejorar.
6. **Sin medición.** 👍/👎 y sus motivos se quedan en `localStorage`. No hay forma de saber qué se pregunta, qué
   falla ni cuánto cuesta.
7. **Sin proactividad.** Ya existen `dayBrief.ts` y `appointmentInsights.ts` (reglas del calendario), pero Clipper no
   los usa para abrir con «Hoy tienes 3 huecos en la tarde y Juan va tarde».

### Deuda técnica

- **Dos motores de conversación.** `src/lib/chat` (equipo) y `src/features/booking/variants/chat` (cliente) comparten
  la interfaz (`ChatQuestion`, voz) pero no las herramientas ni el intérprete. `useChatBooking.ts` ya pasa de 1.000
  líneas (README §1).
- **`AppLayout.tsx` cablea todo el chat** (almacén, backend, foco, voz, historial, sugerencias): 377 líneas mezcladas
  con roles, sucursal y marca. Conviene un `AppChatProvider` propio.
- **`via` es un texto libre** (`"help"`, `"demo"`, `"appointment"`) que decide quién responde el siguiente turno
  (`helpBackend.ts:43`). Con un modelo esto debe ser estado explícito de la conversación.
- **Conectores y adjuntos sin dueño.** La caja ofrece Gmail, Slack, Drive y archivos; la app no los usa.
- **Modelo de voz en vista previa.** Gemini TTS va con `gemini-2.5-flash-preview-tts` (`tts.ts:52`): un nombre de
  vista previa puede retirarse (?).
- **Reconocimiento del navegador.** En Chrome el audio se procesa en servidores de Google y Firefox no lo soporta.
  Para un producto con datos de clientes conviene transcribir en el servidor propio (o avisarlo).

### Fricciones de UX

- **Las sugerencias llevan a un callejón.** Tocar «¿Cuánto llevo cobrado hoy?» abre un artículo de cómo cobrar o la
  pregunta genérica «¿Ver cómo va hoy / Preparar algo para enviar / Revisar quién falta / Solo explícamelo?», y
  cualquiera de esas cae otra vez en lo genérico.
- **Con el foco de una cita, la ayuda deja de existir.** «¿Cómo muevo esta cita?» responde «De la cita de Marcela
  puedo contarte sus alertas…» en vez del artículo (ver Errores).
- **Dos nombres para lo mismo.** «Pregúntame» (ayuda), «Clipper» (cabecera) y «Agente IA» (menú lateral) abren el
  mismo chat con títulos distintos.
- **Voz a medias en la app.** En la reserva Clipper contesta hablando; en la app la voz solo dicta. Para un barbero
  con las manos ocupadas, la conversación por voz es lo útil.
- **Panel de Clipper y panel de cita juntos** estrechan mucho la agenda (`panel-de-cita.md`, sin resolver).

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | **Quitar el demo de RR. HH.** y responder «aún no sé eso» con el artículo más cercano; sugerencias solo de lo que sí se contesta | Hoy da respuestas falsas sobre «clientes en riesgo» | A | S |
| P0 | **Cerrar `/api/tts` y `/api/whatsapp/send`**: sesión obligatoria, límite por usuario e IP, tope diario de gasto | Cualquiera puede gastar la cuota de voz o enviar WhatsApp con la cuenta de la barbería | A | S |
| P0 | **Historial privado**: clave por usuario y cuenta, borrar al cerrar sesión, no guardar alergias ni teléfonos del foco; caducidad | Un equipo compartido en el mostrador deja ver conversaciones de otro con datos de clientes | A | S |
| P0 | **Modelo detrás de `ChatBackend` con herramientas de solo lectura** (agenda del día, cobrado, huecos, clientes en riesgo, métricas, nómina propia), con el **rol aplicado en el servidor** y la consulta visible | Es la capacidad C del README y la base de todo lo demás | A | M |
| P0 | **Que no prometa lo que no hace**: ocultar adjuntos y conectores hasta procesarlos; enviar 👍/👎 y motivos al flujo de feedback que ya existe (`server/feedback`); cambiar el aviso «antes de ejecutar» mientras no ejecute | Confianza; prometer IA y no darla es el punto 2.4 del README | A | S |
| P0 | **Evaluaciones y registro**: 50–100 preguntas reales (es-CO, es-US con spanglish, en) con respuesta esperada; cada turno guarda herramientas usadas, latencia, costo y 👍/👎 | Sin esto no se sabe si el modelo mejora o empeora | A | S–M |
| P1 | **Acciones con vista previa y confirmación** (mover o crear cita, bloquear agenda, crear cliente, enviar WhatsApp 1 a 1) usando los mismos mutadores de las pantallas; deshacer; «Clipper» como actor en el historial | Patrón de Sidekick, Gus y Toast IQ | A | M–L |
| P1 | **Un solo núcleo de herramientas** para el Clipper del equipo, el de la reserva y el de WhatsApp | Evita tres intérpretes; prerequisito de D | A | M |
| P1 | **Foco en cada ficha**: cliente, barbero, nómina, métricas, configuración; cae a la ayuda cuando no sabe | Lo piden los informes 01, 03, 07 y 09 | A | M |
| P1 | **Resumen del día al abrir** («Para ti»): huecos, atrasos, cobros pendientes, cumpleaños, con un botón por cosa | Toast IQ «For You»; `dayBrief.ts` ya calcula los hechos | A | S–M |
| P1 | **Ayuda redactada por el modelo** solo con los artículos (RAG) y su cita; «no sé» si no hay artículo | Respuestas más naturales sin inventar; la ayuda documenta producción | M | S |
| P1 | **Conversación por voz en la app** (como en la reserva), manos libres para el barbero; transcripción en el servidor | El barbero tiene las manos ocupadas | M | M |
| P1 | **Historial en el servidor** por usuario, buscable, multi-dispositivo | Continuidad y medición | M | M |
| P2 | **Clipper en WhatsApp para el cliente** (capacidad D): respuestas a recordatorios, reagendar, lista de espera; salida a una persona | Canal del cliente hispano; necesita webhook entrante y el núcleo P1 | A | L |
| P2 | **Notas por voz** que se clasifican (nota, alergia, preferencia) con confirmación | Entre cortes no se escribe | M | S–M |
| P2 | **Recepcionista telefónico** sobre el mismo agente | Mercado de EE. UU.; Fresha, Zenoti y terceros ya lo venden | M | L |
| P2 | **Servidor MCP para el dueño**: consultar su barbería desde ChatGPT o Claude | Gusto ya está en ChatGPT y Claude con vista previa obligatoria | M | M |
| P2 | **Plan y cupo de IA** (incluido para el equipo; recepcionista y WhatsApp por local o por conversación) | Controlar costo; así cobra el mercado (§5) | M | S |
| P2 | Un solo nombre en toda la interfaz («Clipper») y un título según de dónde se abrió | Menos confusión | B | S |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial · ✗ no consta · ? no verificado. Casi todo lo del sector es
**declarado** por el proveedor o viene de directorios de terceros; no se encontraron pruebas independientes.

### Sector (belleza y barbería)

| Función | Barberlytics | Booksy | Fresha | Vagaro | Square | Boulevard | Zenoti | AgendaPro |
|---|---|---|---|---|---|---|---|---|
| Asistente para el dueño dentro del software | ~ ayuda + reglas | ✗ (según terceros) | ? | ? | ✓ Square AI | ? | ✓ Zeenie (copiloto) | ? |
| Preguntas sobre los datos propios | ~ solo de una cita | ✗ | ? | ? | ✓ ventas, horas pico, gráficos | ? | ✓ analítica con IA (declarado) | ? |
| Ejecuta acciones desde el chat | ✗ equipo · ✓ reserva | ✗ | ? | ? | ? | ? | ✓ 9 agentes (declarado) | ✓ agenda y cobra anticipo (declarado) |
| Atiende al cliente por chat | ✓ reserva por reglas | ✗ propio | ✓ recepcionista (llamadas y SMS, según terceros) | ✓ «Vera» (página y SMS, ago-2026) | ? | ~ «mensajería con IA» (según terceros) | ✓ web y SMS | ✓ Sofía y Julia |
| WhatsApp | ~ solo salida, plantillas | ✗ | ~ mensajería bidireccional, no el agente | ✗ | ? | ? | ? | ✓ desde el número del negocio |
| Voz telefónica | ✗ (voz solo en la app) | ~ de terceros | ✓ (según terceros) | ~ de terceros (AgentZap) | ? | ~ de terceros (Bella AI) | ✓ sistema telefónico con IA | ? |
| Voz dentro del software | ✓ dictado + voz neural | ✗ | ? | ? | ? | ? | ? | ? |
| Español nativo | ✓ | ? | ~ inglés primero (según terceros) | ? | ? | ? | ? | ✓ |
| Reservable por agentes externos | ✗ | ✓ Google AI Mode | ? | ? | ? | ? | ? | ? |
| Precio de la IA | — | — | ~99,95 USD/local/mes (según terceros) | ? | incluido | ? | paquete AI Plus, por consumo | ? |

### Fuera del sector

| Referente | Qué hace | Qué aporta a Clipper |
|---|---|---|
| **Shopify Sidekick** | Lee el estado, propone un cambio, abre el editor con el cambio listo y el comerciante guarda. Las apps le exponen datos de lectura, enlaces y acciones acotadas (según terceros; no se halló la doc oficial de 2026) | Patrón exacto para Configuración y Catálogo: Clipper deja el borrador en el formulario real, no escribe por su cuenta |
| **Square AI** | Asistente gratis: preguntas en lenguaje llano sobre ventas, artículos, horas pico y semana contra semana, con gráficos e historial; usa datos de la web (clima, eventos, reseñas). Casi 200.000 preguntas en la beta (declarado, oct-2025); llegó a Canadá, Reino Unido y Australia en 2026 | La lista de preguntas de arranque de Métricas; incluido en el plan, no como extra |
| **Toast IQ** | Contesta sobre ventas, personal, clientes y menú y **actúa**: añade a alguien a un turno, edita el menú; feed «For You» con lo que pide atención. Incluido en Toast POS (declarado, oct-2025) | El resumen del día y acciones de agenda desde el chat |
| **Gusto Gus** | Responde dudas y ejecuta tareas (aprobar vacaciones, cambiar un salario) **pidiendo aprobación** antes. «Gusto for ChatGPT/Claude»: las acciones de alto impacto exigen vista previa y confirmación (declarado) | Regla de oro para nómina y dinero; y la idea del MCP para el dueño |
| **Intuit Assist** | En QuickBooks responde «¿cuántas facturas están vencidas?», avisa de flujo de caja y redacta recordatorios; en Mailchimp el cliente revisa antes de enviar (declarado) | Clipper redacta el WhatsApp; la persona lo envía |
| **Intercom Fin** | Agente de atención cobrado por resolución (0,99 USD, según terceros, citado en el informe 03) | Modelo de precio para el agente de WhatsApp |
| **Apps en ChatGPT (MCP)** | Desde el 6-oct-2025, apps dentro de ChatGPT sobre MCP; Booking.com entre los primeros. Ya hay servidores MCP de agenda (Cal.com, Makeplans, Appointo) que consultan disponibilidad y reservan | Una API de herramientas bien hecha sirve a Clipper, a WhatsApp y a agentes ajenos |
| **ElevenLabs Agents** | Agentes de voz a ~0,08 USD/min de plataforma, más el modelo y la telefonía (según terceros) | Orden de magnitud del costo de un recepcionista telefónico |

### Hallazgos

1. **El estándar nuevo es «pregunta y actúa con aprobación».** Toast, Gusto, Shopify e Intuit coinciden: el agente
   lee, propone y la persona confirma lo que mueve dinero o escribe a alguien. Nadie revisado ejecuta pagos o
   mensajes de marketing sin revisión.
2. **En belleza, la IA está del lado del cliente.** Fresha, Vagaro, Zenoti y AgendaPro venden recepcionistas (chat,
   SMS, teléfono, WhatsApp). El **asistente del dueño que responde con sus datos** solo aparece en Zenoti (Zeenie) y
   Square. En barbería hispana no se encontró ninguno: es el hueco para Clipper.
3. **Booksy no tiene asistente propio** (según terceros) y apostó por Google AI Mode. Es el competidor natural en
   barbería y deja libre el terreno del asistente.
4. **AgendaPro es el rival regional en IA**: Sofía confirma y reagenda por WhatsApp desde el número del negocio;
   Julia agenda, cobra el anticipo y pasa a una persona (declarado, ene-2026). Es la vara para la capacidad D.
5. **Lo que el asistente cuesta se separa en dos.** El del equipo va incluido (Square, Toast). El que atiende
   clientes se cobra aparte (Fresha por local, Zenoti por consumo, Intercom por resolución).

---

## 5. Mercado y tendencias

### Del chat al agente con aprobación

- Toast IQ (oct-2025) y Square AI (2025-2026) muestran que un asistente **incluido** que responde con los datos del
  negocio ya es lo esperado en software de comercio. Toast además ejecuta acciones de turno y menú.
- Gusto y Shopify fijan la regla: **vista previa y confirmación** para lo de alto impacto. Para Barberlytics: dinero
  (nómina, cobros, precios), mensajes a clientes y borrados siempre con aprobación; consultas, libres.

### WhatsApp: política de Meta (desde el 15 de enero de 2026)

- Meta prohíbe en la Business API los **chatbots de propósito general** (ChatGPT, Perplexity y Luzia salieron).
  Siguen permitidos los asistentes **del negocio**: preguntas frecuentes, reservas, seguimiento y soporte.
- Implicación: Clipper en WhatsApp debe hablar **solo de la barbería** (agenda, servicios, precios, la cita) y no
  aceptar «pregúntame lo que quieras». El README y el informe 02 afirman que exige salida a una persona; en esta
  búsqueda no se confirmó (?). Igual conviene tenerla: AgendaPro la ofrece.
- Hoy solo se puede **enviar** plantillas (`server/whatsapp/whatsapp.ts`). Para conversar falta el webhook entrante y
  las respuestas libres dentro de la ventana de 24 h.

### Voz

- **En la app**: dictado y conversación son baratos con la voz del navegador, pero en Chrome el audio va a Google.
  Con datos de clientes conviene transcribir en el servidor propio.
- **Por teléfono**: el sector compra recepcionistas de voz de terceros (AgentZap para Vagaro desde 109 USD/mes,
  Bella AI para varias plataformas, según los propios vendedores). Plataformas como ElevenLabs cobran por minuto.
  Mercado natural: EE. UU., donde el cliente llama más; en Colombia manda WhatsApp.

### Agentes que reservan por el cliente

- Google AI Mode reserva en Booksy desde 2025; ChatGPT abre apps sobre MCP desde oct-2025. El informe 10 ya propone
  JSON-LD, `llms.txt` y un servidor MCP público. Aquí se suma el otro lado: un **MCP para el dueño**, para que
  consulte su barbería desde el asistente que ya usa, como hace Gusto.

### Datos personales y modelos

- Mandar a un proveedor de modelos (EE. UU.) el nombre, el teléfono o las alergias de un cliente colombiano es una
  **transmisión o transferencia internacional** bajo la Ley 1581: requiere contrato y mención en la política de
  tratamiento (verificar con abogado). Regla de producto: el modelo recibe identificadores y cifras; nombres y datos
  de salud solo cuando la pregunta los necesita y el rol los puede ver.
- En EE. UU., algunos estados exigen avisar que se habla con un bot en comunicaciones comerciales (no verificado en
  esta investigación). Para WhatsApp y teléfono: Clipper se presenta como asistente de IA.

---

## 6. IA

### Datos que ya tenemos

Agenda con estados y horas reales (`/calendar`), huecos (`slotSuggestions`, `gapsModel`), resumen del día
(`dayBrief.ts`), sugerencias por cita (`appointmentInsights.ts`), clientes con ritmo y riesgo (`visitEveryDays`,
`lastVisitAt`, segmentos), transacciones, gastos, estado de resultados (fase 2), nómina por barbero, métricas, catálogo,
configuración con esquemas Zod, centro de ayuda indexado, motor de reserva con acciones, plantillas de WhatsApp y voz
neural. **Faltan**: un modelo, el registro de turnos, el webhook de WhatsApp y permisos de lectura aplicados en el
servidor para cada herramienta.

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Preguntas sobre los datos** | Lenguaje llano → consulta tipada → cifra con fuente y gráfico | Square AI, Toast IQ, Intuit Assist | «¿Cuánto llevo hoy en Chapinero?», «¿qué barbero tiene más huecos el sábado?» | Sí: endpoints de agenda, métricas, transacciones | Conversacional con herramientas | M | Cifras inventadas: el modelo solo llama herramientas y cita; nunca calcula |
| 2 | **Acción con vista previa** | Propone, muestra el cambio y espera «Aplicar» | Shopify Sidekick, Gusto Gus, Toast IQ | «Mueve a Juan a las 4 con Andrés» → tarjeta con el antes y el después → aplicar o deshacer | Sí: mutadores del calendario y de clientes | Agéntica | M–L | Acciones de más; por eso confirmación y registro con actor |
| 3 | **Feed proactivo** | Lo que pide atención, antes de preguntar | Toast IQ «For You» | Al abrir: «2 por cobrar, Juan va 12 min tarde, hueco a las 3 que le sirve a Pedro (lista de espera)» | Sí: `dayBrief`, insights, lista de espera | Reglas + redacción | S–M | Ruido: máximo tres cosas, cada una con botón |
| 4 | **Copiloto de la cita y del cliente** | Contexto de la persona donde se atiende | Zenoti (check-in), Toast (terminal) | El foco actual, respondido por el modelo con las mismas reglas como herramientas | Sí | Conversacional | S | Mostrar salud a quien no debe: respetar `client-info` |
| 5 | **«¿Por qué me pagaron esto?»** | Explica una cifra con la cuenta y enlaces | Gusto Gus | El barbero pregunta por su semana; Clipper lee la línea de nómina y la explica | Sí (informe 07) | Generativa sobre cálculo | S–M | Privacidad entre barberos; solo lee lo suyo |
| 6 | **Configurar conversando** | Deja el ajuste listo en el formulario real | Shopify Sidekick | «Cierro los domingos y subo el corte a $38.000» → borradores en Horario y Catálogo | Sí: esquemas Zod (informe 09) | Agéntica | M | Dinero e impuestos: siempre «Aplicar» por bloque |
| 7 | **Ayuda redactada con fuentes** | Responde solo con artículos y cita | Intercom Fin | El `helpBackend` actual con redacción del modelo y «no sé» honesto | Sí: índice del centro de ayuda | RAG | S | La ayuda documenta producción, no el rediseño |
| 8 | **Recepcionista por WhatsApp** | Agenda, confirma, reagenda y pasa a una persona | AgendaPro Sofía y Julia, Vagaro Vera | El Clipper de la reserva con modelo detrás de `interpret`, en el número de la barbería | Motor sí; webhook no | Agéntica | L | Política de Meta, consentimiento, horas falsas (el motor confirma) |
| 9 | **Notas y órdenes por voz** | Dictar entre cortes | SevenRooms AI Notes (informe 03) | «Anótale a Pedro: degradado en 1 y medio, no le gusta la gomina» → nota clasificada | Sí: notas tipadas y voz | Generativa | S–M | Clasificar una alergia como nota: confirmar |
| 10 | **El negocio dentro de ChatGPT o Claude** | MCP con herramientas de lectura y acciones con confirmación | Gusto for ChatGPT/Claude, servidores MCP de agenda | El dueño pregunta por su barbería desde su asistente | Sí, si se hace el núcleo P1 | Agéntica | M | Autenticación y alcance por rol fuera de nuestra interfaz |

### Top 5 apuestas

1. **Clipper responde con tus datos (caso 1).** Empezar con 15–20 herramientas de solo lectura sobre lo que ya
   existe (agenda del día, cobrado, huecos, clientes en riesgo, métricas, mi nómina), rol aplicado en el servidor y la
   consulta visible bajo la respuesta. Convierte las sugerencias de hoy en promesas cumplidas. Es el diferencial frente
   a Booksy y AgendaPro.
2. **Resumen del día (caso 3).** `dayBrief.ts` e `appointmentInsights.ts` ya calculan los hechos; el modelo solo los
   redacta y cada uno lleva su botón. Barato, visible desde el primer día, y es la capacidad B del README.
3. **Acciones de agenda con vista previa (caso 2).** Mover, crear, bloquear y avisar por WhatsApp con la tarjeta del
   antes y el después y «deshacer». Mismos mutadores que la pantalla; Clipper queda como actor en el historial.
4. **Un núcleo de herramientas para los tres Clippers** (equipo, reserva y WhatsApp). Es lo que hace posible el caso
   8 sin un tercer intérprete y deja listo el MCP del caso 10.
5. **Ayuda con fuentes y «no sé» honesto (caso 7).** Lo más barato: mejora todas las respuestas de hoy y saca del
   camino el demo ajeno.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Honesto y seguro (3–5 semanas)

- Quitar el demo; respaldo «aún no sé eso» con el artículo más cercano. Sugerencias por pantalla solo si se contestan.
- Sesión obligatoria y límites en `/api/tts` y `/api/whatsapp/send`; tope diario de gasto por cuenta.
- Historial por usuario y cuenta, borrado al salir; sin datos de salud ni teléfonos guardados en el navegador.
- Ocultar adjuntos y conectores; 👍/👎 y motivos al flujo de feedback del servidor; aviso de la caja sin «ejecutar».
- Modelo detrás de `ChatBackend` con herramientas **de solo lectura** y fuentes; ayuda redactada con fuentes.
- Conjunto de evaluación (50–100 preguntas reales, tres variantes de idioma) y registro de cada turno.
- **Éxito:** % de respuestas correctas en la evaluación (meta ≥ 90 % en cifras); % de 👎; costo por conversación.

### Fase 2 — Actúa con vista previa (6–10 semanas)

- Acciones de agenda y clientes con tarjeta de antes/después, «Aplicar» y «Deshacer»; actor «Clipper» en el historial.
- Resumen del día al abrir; foco en cliente, barbero, nómina, métricas y configuración.
- Conversación por voz en la app (como en la reserva) con transcripción en el servidor; notas por voz.
- Núcleo de herramientas compartido con el Clipper de la reserva; historial en el servidor.
- Configurar conversando (borradores en los formularios reales).
- **Éxito:** acciones hechas con Clipper por semana y por local; % deshechas; tiempo para resolver «¿qué hago ahora?»
  en el mostrador.

### Fase 3 — Afuera (3+ meses)

- Clipper en WhatsApp para el cliente (webhook entrante, respuestas a recordatorios, reagendar, lista de espera,
  salida a una persona), dentro de la política de Meta.
- Recepcionista telefónico para EE. UU. sobre el mismo agente.
- Servidor MCP para el dueño (ChatGPT, Claude) y, con el informe 10, reservable por agentes externos.
- Plan y cupo de IA: el asistente del equipo incluido; WhatsApp y teléfono por local o por conversación.
- **Éxito:** % de conversaciones de WhatsApp resueltas sin persona; inasistencias; citas creadas por canal agente.

---

## Errores encontrados

Comprobados leyendo el código (las líneas son de `b163627`).

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | `/api/tts` no pide sesión y `isSameOrigin` devuelve `true` cuando la petición no trae `Origin` (un `curl`). Cualquiera puede gastar la cuota del proveedor de voz; no hay límite de peticiones | `server/http/request.ts:10-12`, `api/tts/index.ts:9` |
| Alta | Lo mismo en `/api/whatsapp/send`: envía plantillas a cualquier número con la cuenta de la barbería (abuso y costo por mensaje). No es de Clipper, pero el agente D se monta encima | `api/whatsapp/send.ts:10` |
| Alta | El demo responde con contenido de otro producto (RR. HH.): «riesgo» → rotación de 6 personas del Q3; «plan» (membresía, planilla) → plan de sesiones de formación; «asistencia» → participación de Ventas Bogotá. Responde cuando la ayuda no encuentra artículo | `src/lib/chat/demoBackend.ts:42-118`, `src/app/chat/index.ts:24` |
| Media | Las conversaciones (incluidas respuestas con alergias, medicamentos y teléfono del foco de la cita) quedan en `localStorage` y **no se borran al cerrar sesión**; la clave no depende del usuario | `src/app/chat/index.ts:14`, `src/features/auth/AuthProvider.tsx:104-112`, `appointmentAgent.ts:72-76, 107` |
| Media | Los adjuntos se descartan: la caja entrega `(text, files)` y el panel y la pantalla completa solo pasan `text`. Con solo un archivo y sin texto se envía un mensaje vacío | `src/components/chat/ChatPanel.tsx:79`, `ChatScreen.tsx:45`, `ChatComposer.tsx:146-150` |
| Media | El motivo de «No útil» (razones, comentario, «compartir conversación») se descarta, y 👍/👎 nunca salen del navegador; el formulario igual dice «gracias» | `src/components/chat/ChatThread.tsx:83`, `src/lib/chat/store.ts:241-245` |
| Media | Cualquier respuesta de `/api/tts` que no sea audio apaga la voz neural **toda la sesión**: un 400 por pasar de 1.200 caracteres o un 502 pasajero bastan. El cliente no recorta el texto antes de enviarlo | `src/lib/chat/speech.ts:195`, `server/tts/tts.ts:31, 177, 183` |
| Media | Con el foco de una cita, la ayuda nunca responde: `answer` siempre devuelve algo (el tema `unknown` también), aunque `AgentFocus` dice que `null` pasa la pregunta a la ayuda y `panel-de-cita.md` lo afirma | `appointmentAgent.ts:112-113, 132-134`, `src/lib/chat/agentFocus.ts:21` |
| Baja | `topicOf` busca subcadenas y en orden: «Resérvale la próxima» cae en «lo que pidió» (`reserv` antes que `proxim`); «¿cuándo vendrá?» en «qué ofrecer» (`vend`); «calle» en contacto (`call`); «Facebook» en próxima cita (`book`) | `appointmentAgent.ts:26-45` |
| Baja | Preguntar desde la búsqueda ⌘K usa el backend sin foco aunque haya un foco puesto | `src/app/layouts/AppLayout.tsx:295` |
| Baja | Texto fijo en español en el shell: «Se responde en el panel del Agente IA» (en inglés se ve igual) | `src/components/app-shell/AdminShell.tsx:153` |
| Baja | `edit` y `remove` abortan las respuestas en curso pero no las sacan del mapa `inflight` (fuga pequeña) | `src/lib/chat/store.ts:233, 252` |

---

## Fuentes

Consultadas en esta investigación. Las cifras de proveedores son declaradas por ellos o por directorios de terceros.

**Sector (belleza y barbería)**
- Booksy sin asistente propio y socio de Google AI Mode (según terceros): https://www.usecarly.com/blog/booksy-ai/
- Fresha, «Up Next 2026» (recepcionista con IA y mensajería bidireccional con WhatsApp): https://www.fresha.com/blog/Up-Next-2026
- Fresha AI Concierge, lanzamiento y precio (directorio de terceros): https://www.stork.ai/en/fresha-ai-concierge
- Vagaro «Vera» (chat con IA, ago-2026): https://www.vagaro.com/pro/updates/vera-receptionist
- Voz telefónica de terceros para Vagaro: https://agentzap.ai/integrations/vagaro
- Boulevard (directorio) y Bella AI (integración con varias plataformas): https://www.stork.ai/es/boulevard · https://www.capterra.com/p/10041967/Bella-AI/
- Zenoti, Zeenie y AI Workforce: https://www.zenoti.com/press/zenoti-unveils-groundbreaking-ai-features-to-transform-salons-spas-med-spas-and-gyms · https://www.zenoti.com/en-uk/ai-workforce · https://www.zenoti.com/pricing
- AgendaPro, Sofía y Julia: https://agendapro.com/co/sofia-ia-recordatorios · https://agendapro.com/es/ia-para-agendar-citas · https://agendapro.com/blog/?p=14573

**Fuera del sector**
- Shopify Sidekick (terceros): https://weaverse.io/blogs/shopify-sidekick-agents-propose-merchants-approve-2026 · https://www.chattergo.com/blog/shopify-sidekick-deep-dive-from-chatbot-to-agentic-copilot
- Square AI: https://squareup.com/au/en/press/square-ai · https://www.businesswire.com/news/home/20260210922162/en/Introducing-Square-AI-Helping-UK-Small-Businesses-Turn-Instinct-Into-Confident-Decisions · https://www.businesswire.com/news/home/20251008312312/en/Square
- Toast IQ: https://pos.toasttab.com/news/toast-expands-toast-iq-smart-ai-assistant · https://restauranttechnologynews.com/2025/10/toast-launches-conversational-ai-assistant-to-help-restaurant-operators-work-faster-and-smarter/
- Gusto Gus y Gusto para ChatGPT/Claude: https://gusto.com/company-news/gus-ai-assistant · https://gusto.com/product/agents · https://www.cpapracticeadvisor.com/2024/09/16/gusto-introduces-gus-ai-assistant-for-small-businesses/110546/
- Intuit Assist: https://www.intuit.com/blog/2026/09/introducing-intuit-assist/
- Apps en ChatGPT y servidores MCP de agenda: https://openai.com/index/introducing-apps-in-chatgpt/ · https://makeplans.com/en/ai-booking-assistant/ · https://truto.one/blog/connect-calcom-to-chatgpt-manage-bookings-and-availability/
- ElevenLabs Agents, precio por minuto (terceros): https://www.getmacha.com/blog/elevenlabs-agents-pricing-explained · https://trtc.io/blog/details/elevenlabs-conv-ai-vs-trtc-2026
- Intercom Fin: ver fuentes del informe [03-clientes.md](03-clientes.md)

**WhatsApp**
- Política de chatbots de Meta 2026: https://respond.io/blog/whatsapp-chatbot-policy-2026 · https://respond.io/blog/whatsapp-general-purpose-chatbots-ban · https://9to5mac.com/2025/10/20/whatsapp-bans-ai-chatbots-from-using-its-business-api/
