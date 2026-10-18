# Avisos y ayuda (piezas de la cabecera) — investigación

Investigación del 2026-10-18 sobre las piezas transversales de la cabecera: la campana de notificaciones, el Centro de
procesos, Novedades, la búsqueda ⌘K, el centro de ayuda (`/ayuda` y el menú «Ayuda») y el feedback. Solo lectura: no
se tocó código. Fuentes internas: `src/components/app-shell/`, `src/components/search/`, `src/help/`, `src/lib/help/`,
`src/lib/chat/`, `src/app/chat/`, `src/app/layouts/AppLayout.tsx`, `src/features/feedback/`,
`src/features/settings/sections/notificationCatalog.ts`, `src/features/calendar/messages.ts`, `docs/API_CONTRACT.md`,
`docs/HELP_CENTER_PLAN.md` y los informes 01–10 de esta carpeta. Análisis sobre `b163627` (incluye la fase 2: WhatsApp
real, ficha 360, inventario ligero). Fuentes externas al final; lo que un proveedor dice de sí mismo se marca
**declarado** y lo no verificado con «?».

## Resumen ejecutivo

1. **La campana no es de Barberlytics.** `AppLayout` no le pasa avisos al shell, así que la campana muestra los datos de
   demostración de una plataforma de RR. HH. («Evaluaciones vencidas», «Encuesta de clima cerrada»). Siempre marca
   «2 nuevas», ninguna fila hace nada y «Ver todas» no tiene acción. Novedades tiene el mismo problema y dice
   «Agosto 2026». Hoy la cabecera promete avisos que no existen.
2. **Los eventos ya existen; lo que falta es el cable.** El sistema ya sabe cuándo entra una reserva en línea, cuándo un
   cliente cancela o confirma, cuándo hay un «no vino», un producto bajo el mínimo, una caja con descuadre, una nómina
   aprobada, una reseña o un WhatsApp que falló. Ninguno de esos hechos genera un aviso. El caso más grave: el envío de
   WhatsApp devuelve cuántos fallaron y la app tira ese número (`messages.ts`, `useMessageDispatcher`, ~l. 57).
3. **Configuración › Recordatorios y avisos es un catálogo sin motor.** Tiene 6 destinatarios, ~50 eventos y tres
   canales (correo, push, SMS), pero nada lo lee, no hay WhatsApp ni bandeja dentro de la app, y faltan los eventos que
   más le importan al dueño (descuadre de caja, nómina por aprobar, mensajes fallidos, reseña mala para el dueño).
4. **El canal correcto depende del rol.** El barbero y la recepción están en el local con la app abierta: bandeja y push
   del navegador. El dueño casi nunca está en la app: **WhatsApp para lo urgente y un resumen diario**, correo para lo
   formal. Push en iPhone exige una app web instalada (PWA), y hoy no hay manifiesto ni service worker.
5. **El centro de ayuda es la pieza más madura**: contenido en Markdown en otro repo, bilingüe, búsqueda tolerante a
   errores y un chat que responde **citando el artículo**. Pero la ayuda por pantalla (`articlesForScreen`) está escrita
   y no se usa, el «¿Te sirvió?» solo se guarda en el navegador, y cuando la ayuda no sabe, el chat responde con un
   **guion de demostración de RR. HH. con cifras inventadas**.
6. Recomendación: Fase 1 «quitar lo falso y cablear» (bandeja real con 10 eventos, avisos de WhatsApp fallido y
   descuadre), Fase 2 «llegar a quien no está» (PWA con push, WhatsApp al dueño, resumen diario, preferencias por
   persona), Fase 3 «priorizar y explicar» (bandeja con prioridad, resumen redactado, ayuda con modelo y citas).

---

## 1. Qué tiene hoy

**Mercado, según el código.** Igual que en los demás informes: español primero, celulares `+57` y Ley 1581 en
Clientes, pero sucursales de demo en EE. UU. y dinero en USD. Para avisos esto importa por el canal: en Colombia
WhatsApp es el canal por defecto; en EE. UU., SMS y push siguen pesando (ver §5).

### Inventario

| Pieza | Qué hay | Dónde | ¿Con datos reales? |
|---|---|---|---|
| Campana | Popover con lista, punto de «nuevas», cuenta «N nuevas», pie «Ver todas las notificaciones» | `AppHeader.tsx:142-223` | **No.** `NOTIFICATIONS` de demo (`appShellData.ts:278`), RR. HH. |
| Novedades | Popover con lista y marca «Nuevo»; en móvil baja al pie del menú lateral | `NewsMenu.tsx` | **No.** `NEWS_ITEMS` de demo (`appShellData.ts:295`): «Agente IA de Thema», «Exportar reportes»… |
| Centro de procesos | Lo que sigue corriendo aunque se cambie de pantalla: avance, en espera, terminado, con error, acción por fila («Reintentar», «Ver»). Almacén fuera de React (`publishProcess`, `updateProcess`, `removeProcess`) | `ProcessCenter.tsx`, `processStore.ts` | Sí, pero **un solo publicador**: la subida de adjuntos del feedback (`FeedbackHost.tsx:39`). Se pierde al recargar. Sin historial (`onOpenProcessHistory` no se pasa) |
| Búsqueda ⌘K | Un campo para abrir objetos, ir a pantallas y ajustes, preguntar al agente, acciones de la pantalla (`usePublishSearchActions`), recientes en el navegador | `components/search/GlobalSearch.tsx`, `AdminShell.tsx:114-157` | Parcial: los «objetos» son **solo artículos de ayuda**. No encuentra clientes, citas, barberos ni productos |
| Menú «Ayuda» | Tres puertas: Preguntar (chat), Centro de ayuda (`/ayuda`), Guías paso a paso | `HelpMenu.tsx`, `AppLayout.tsx:297-301` | Sí |
| Centro de ayuda `/ayuda` | Contenido del repo `centro-de-ayuda` (GitHub Pages), Markdown → Thema, inicio, sección, artículo, búsqueda, es/en, «¿Te sirvió?» | `src/help/`, `src/lib/help/` | Sí; el voto **solo en `localStorage`** (`HelpArticlePage.tsx:26`) |
| Chat de ayuda | Busca el artículo que mejor encaja, responde con su resumen y pasos, cita la fuente y enlaza el artículo; si no hay confianza, pasa al respaldo | `help/chat/helpBackend.ts`, `app/chat/index.ts` | Sí con artículo; **sin artículo responde el guion de demo** (`lib/chat/demoBackend.ts`) |
| Guías paso a paso | 6 guías (crear cita, crear cliente, cobrar, activar barbero, bloquear calendario, compartir enlace) con avance guardado en el navegador | `help/guides.ts`, `HelpGuidesDrawer.tsx` | Sí; no dependen de la pantalla |
| Ayuda por pantalla | `articlesForScreen()` con alias de rutas del rediseño a producción | `lib/help/screens.ts:54` | **Escrita y probada, sin usar** en la app |
| Feedback | Un diálogo (texto, tipo, captura, video) que va a la hoja de la campaña activa; adjuntos a Drive; análisis semanal con Claude (cron) | `features/feedback/`, `server/feedback` | Sí, pero **solo si hay campaña activa**; el recorrido y el botón flotante están apagados (`AppLayout.tsx:78`) |
| Catálogo de avisos | Destinatario × evento × canal (correo, push, SMS) y umbrales; 6 destinatarios | `settings/sections/notificationCatalog.ts`, `NotificationSettings.tsx` | Se guarda (`PUT /settings/notifications`), **nada lo lee** (ya lo señaló 09) |
| Mensajes al cliente | Cola de WhatsApp por cita (confirmación, reprogramación, recordatorios 24 h y 2 h, hueco liberado), envío cada minuto, estado por mensaje (`sent`, `failed`, `simulated`) | `calendar/messages.ts`, `mocks/messages`, `server/whatsapp` | Sí (fase 2). El resultado del envío **no se usa** |
| Toasts | Sonner afinado (`ThemaToaster`) para la confirmación inmediata de una acción | `components/feedback/ThemaToaster.tsx` | Sí; efímeros |

### Eventos que el sistema ya produce y nadie avisa

| Hecho | Dónde nace | ¿Se avisa a alguien? |
|---|---|---|
| Reserva en línea nueva | `POST /booking/reservations` | No (sale en la agenda al recargar) |
| El cliente cancela o reprograma desde su enlace | `POST /booking/appointments/:id/cancel`, `PATCH /booking/appointments/:id` | No |
| El cliente confirma por WhatsApp | `POST /booking/confirm` | No; cambia el estado de la tarjeta |
| Cita marcada «no vino» | `PATCH /appointments/:id` (`no_show`) | No |
| Cliente se apunta a la lista de espera / se ofrece un hueco | `POST /booking/waitlist`, mensaje `slotFreed` | No |
| WhatsApp que falló (plantilla rechazada, número inválido) | `POST /messages/dispatch` → `{ failed }` | **No; el número se descarta** |
| Producto bajo el mínimo o agotado | `GET /inventory` (`status: low/out`) | Solo una insignia en Productos › Existencias |
| Cierre de caja con diferencia | `POST /register/close` (`difference`) | No |
| Nómina aprobada / pagada / reabierta | `POST /payroll/runs`, `/pay`, `/reopen` | No; el barbero no se entera de que le pagaron |
| Reseña nueva (incluida una de 3 o menos) | `POST /booking/appointments/:id/review` | No |
| Devolución | `POST /appointments/:id/refund` | No |
| Subida de archivos del feedback | `FeedbackHost` | Sí, en el Centro de procesos |

---

## 2. Análisis

### Fortalezas

- **Las piezas de la cabecera están bien pensadas como sistema.** Cada una responde a una pregunta distinta: qué pasó
  (campana), qué sigue corriendo (procesos), qué cambió en el producto (Novedades), cómo hago algo (Ayuda), qué busco
  (⌘K). El Centro de procesos, en particular, está bien resuelto: almacén que sobrevive al cambio de pantalla, estados
  que se leen sin texto, `aria-live` en el resumen y acción por fila.
- **El catálogo de avisos ya tiene la forma correcta**: por destinatario y no por pantalla, con umbrales
  («ocupación de más del 85 %», «minutos antes»). Es la base de una matriz rol × evento × canal; falta el motor.
- **La ayuda cita su fuente.** El chat no inventa: responde con el artículo que encontró, dice de cuál salió y da el
  enlace. Es la regla que Intercom Fin vende como diferencial (declarado), hecha sin modelo.
- **Contenido como datos.** El centro de ayuda es Markdown con `screens`, `roles` y `keywords`, bilingüe, con
  `llms.txt`. Está listo para que un modelo lo use como base sin reescribir nada.
- **WhatsApp ya guarda el estado de cada mensaje** (`scheduled`, `sent`, `failed`, `simulated`, `error`). Avisar de un
  fallo es leer lo que ya existe.

### Huecos

1. **No hay bandeja de avisos.** No existe `GET /notifications` (lo admite `API_CONTRACT.md` en «Pendientes de
   contrato»). Sin ella, ningún evento llega a nadie y no queda registro de qué se avisó.
2. **Faltan los avisos que cuestan dinero.** El catálogo no tiene: descuadre de caja, caja sin cerrar, nómina por
   aprobar, «te pagaron» para el barbero, WhatsApp fallido, cancelación tardía (dentro de la política, con posible
   cobro), pago en línea fallido o devuelto, renta de silla vencida, gasto fijo por vencer, cambio en un ajuste
   sensible (comisiones, cuenta de pago). Tampoco «reserva en línea nueva» como evento propio para recepción y barbero.
3. **El dueño no recibe lo suyo.** En el catálogo, `badReview` solo va al administrador (`notificationCatalog.ts:50`);
   el dueño no tiene ningún evento de citas (cancelaciones, no-shows) ni de reseñas.
4. **No hay canal para quien no está en la app.** Los canales son correo, push y SMS. No hay WhatsApp (el canal del
   dueño hispano), no hay push real (sin manifiesto ni service worker) y no hay bandeja dentro de la app.
5. **Preferencias solo de la empresa.** El administrador decide por rol; cada persona no puede silenciar lo suyo ni
   elegir horario. Fresha, en cambio, deja que cada miembro del equipo maneje sus propios avisos (ver §4).
6. **⌘K no busca lo del negocio.** La pregunta más común en el mostrador («¿dónde está Juan Pérez?», «la cita de las
   4») no se resuelve desde la búsqueda general.
7. **La ayuda no sabe dónde estás.** El menú «Ayuda» ya no muestra los artículos de la pantalla actual; la función
   existe (`articlesForScreen`) y está probada, pero ninguna vista la llama. El plan del centro de ayuda (§3.3) la
   prometía.
8. **El feedback no cierra el ciclo.** Quien envía no sabe si se leyó ni qué pasó. Depende de una campaña: sin campaña
   activa, «Enviar feedback» desaparece del menú (`AppLayout.tsx:282`).
9. **Novedades no se marcan como vistas.** `isNew` es fijo en los datos; el punto no se apaga nunca.

### Deuda técnica

- **Textos fijos en el shell**: «Notificaciones», «N nuevas», «Ver todas las notificaciones» (`AppHeader.tsx:153,172,175,218`),
  «Agosto 2026», «nuevas», «Nuevo» (`NewsMenu.tsx:96,100,125`) y «Se responde en el panel del Agente IA»
  (`AdminShell.tsx:153`). En inglés la cabecera sale mezclada. Además usan `text-[13px]`/`text-[11px]`, que la regla 3
  de `AGENTS.md` prohíbe fuera de `src/docs` (el shell es zona protegida; lo debe aprobar ingeniería).
- **La campana no usa piezas del sistema**: filas `button` a mano en vez de `ActivityDropdown`/`ListItem`, clave por
  título (`key={notification.title}`), sin `onClick`.
- **El envío de WhatsApp vive en el navegador.** Corre cada minuto en cada pestaña abierta (`useMessageDispatcher`). Con
  backend real debe ser una cola del servidor; si no, sin nadie conectado no sale nada y con dos pestañas se corre el
  riesgo de enviar dos veces (depende de cómo bloquee el servidor; ?).
- **Procesos en memoria.** Una importación de clientes (que aún no existe) correría en el servidor; el Centro de
  procesos necesitará leer estado del servidor y no solo de quien lo lanzó.
- **`clearProcesses` no se llama al cerrar sesión** aunque su comentario dice que es para eso (`processStore.ts:70`;
  `AppLayout.tsx:318`). En un computador compartido de recepción, la siguiente persona ve los procesos de la anterior.
- **Recientes de ⌘K con una sola clave por navegador** (`GlobalSearch.tsx:120`, `thema.search.recents`). Hoy guarda
  títulos de ayuda; cuando busque clientes, guardará nombres de clientes a la vista del siguiente usuario del mismo equipo.
- **`CLAUDE.md` nombra `src/help/HelpDrawer.tsx`**, que no existe: la doc del repo va por detrás del código.

### Fricciones de UX

- **Un punto que miente enseña a no mirar.** La campana siempre tiene punto y «2 nuevas». Cuando lleguen avisos reales,
  la gente ya habrá aprendido a ignorarla.
- **Tres puntos azules iguales** (Novedades, campana, procesos) con significados distintos y sin número.
- **En el celular se pierde la ayuda y los procesos** (`max-sm:hidden`). El barbero usa el celular; si algo de él
  corre o falla, no lo ve.
- **Un aviso que no lleva a ningún sitio.** Aunque hubiera datos, las filas no navegan: no hay «abrir la cita», «ver la
  caja», «reintentar el mensaje».
- **El voto «¿Te sirvió?» no le llega a nadie**, así que no hay forma de saber qué artículo falla.

### Errores encontrados

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | La campana y Novedades de la app de barbería muestran datos de demo de RR. HH. (`AppLayout` no pasa `notifications` ni `news` y el shell usa sus valores por defecto) | `src/app/layouts/AppLayout.tsx:244-321`, `src/components/app-shell/appShellData.ts:278-301` |
| Alta | El chat «Ayuda», cuando ningún artículo cubre la pregunta, responde con el guion de demo de RR. HH. y **cifras inventadas** («14 evaluaciones vencidas», «señales de rotación en 6 personas»). Se dispara con palabras comunes en una barbería: «riesgo», «plan», «feedback», «asistencia» | `src/app/chat/index.ts:24`, `src/lib/chat/demoBackend.ts:44-91` |
| Alta | El resultado del envío de WhatsApp (`{ sent, simulated, failed }`) se descarta; un mensaje fallido solo se ve si alguien abre esa cita | `src/features/calendar/messages.ts` (`useMessageDispatcher`, ~l. 57) |
| Media | «2 nuevas» fijo: `unreadCount = Math.min(2, notifications.length)` | `src/components/app-shell/AppHeader.tsx:74` |
| Media | Las filas de la campana y «Ver todas las notificaciones» no tienen acción | `AppHeader.tsx:183-219` |
| Media | La ayuda por pantalla está escrita y no se usa | `src/lib/help/screens.ts:54` |
| Baja | Textos fijos en español en la cabecera y en Novedades (rompen el inglés) | `AppHeader.tsx:153,172,175,218`, `NewsMenu.tsx:96,100,125`, `AdminShell.tsx:153` |
| Baja | Los procesos no se vacían al cerrar sesión | `AppLayout.tsx:318-320` |
| Baja | Un fallo al subir adjuntos del feedback queda en el Centro de procesos sin «Reintentar» | `src/features/feedback/FeedbackHost.tsx:52` |

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

### La matriz que responde la pregunta: qué aviso, a quién y por dónde

Niveles: **Ahora** (interrumpe), **Hoy** (bandeja, sin sonido), **Resumen** (va en el resumen diario o semanal).
«App» es la bandeja de la campana; «Push» es la notificación del navegador o de la app instalada.

| Evento | Dueño | Administrador | Recepción | Barbero (comisión y renta) | Por qué |
|---|---|---|---|---|---|
| Reserva en línea nueva | Resumen | Resumen | Hoy · App | **Ahora · Push** (si es suya) | El barbero organiza su día; recepción ve la agenda llenarse |
| El cliente cancela | Resumen (Ahora si es tardía y hay cobro) | Hoy · App | **Ahora · App** + ofrecer el hueco a la lista de espera | **Ahora · Push** (si es suya) | Un hueco vale si se llena en minutos |
| El cliente reprograma | — | — | Hoy · App | Ahora · Push | Cambia su día |
| Cita sin confirmar a 3 h | — | — | **Hoy · App** (lista «por confirmar» con botón de llamar o WhatsApp) | — | Previene el no-show |
| El cliente llegó (check-in o Front Desk) | — | — | — | **Ahora · Push** | «Juan llegó» sin que recepción tenga que ir a la silla |
| No vino | Resumen (Ahora si es VIP o tercera vez) | Hoy · App | La marca ella | Hoy · App | Patrón, no urgencia |
| Lista de espera: hueco ofrecido / aceptado | — | — | Hoy · App | Hoy · App (si es suya) | Saber que se llenó solo |
| **WhatsApp que falló** | Ahora · WhatsApp/correo **si falla la plantilla o el número de la barbería** (todos fallan) | Ahora · App | **Ahora · App** con «llamar» y «reintentar» | — | Un recordatorio que no salió es un no-show probable |
| Producto bajo el mínimo / agotado | Resumen · Hoy si se agotó y se vende en línea | Hoy · App | — | — | Comprar a tiempo; lo agotado sale de la reserva |
| **Cierre de caja con descuadre** | **Ahora · WhatsApp** si pasa el umbral | Ahora · App | — | — | Dinero; el dueño no está en el local |
| Caja sin cerrar a la hora de cierre | Hoy · WhatsApp (en el resumen de la noche) | Hoy · App | **Ahora · App** | — | Sin cierre no hay cuadre |
| **Nómina por aprobar** (fin de ciclo) | **Hoy · WhatsApp/correo** | Hoy · App | — | — | Se paga tarde si nadie la aprueba |
| Nómina aprobada / pagada | — | — | — | **Hoy · Push** («Tu pago de la semana está listo: ver detalle») | Confianza; menos preguntas al dueño |
| Renta de silla vencida | Hoy · App | Hoy · App | — | **Hoy · Push** (barbero de renta) | Cobro entre las partes |
| Reseña de 3 o menos | **Ahora · WhatsApp** | Ahora · App | — | No por defecto (no culpar; ver `ROLES_PLAN`) | Responder rápido salva al cliente |
| Reseña de 5 | Resumen | — | — | Hoy · App | Motiva; no interrumpe |
| Ausencia o vacaciones pedidas / respondidas | Hoy · App | Hoy · App | Hoy · App (aprobadas) | Hoy · Push (la respuesta) | Ya está en el catálogo |
| Devolución o pago en línea fallido | Resumen (Ahora si pasa un umbral) | Hoy · App | Hoy · App | — | Control de dinero |
| Cambio en un ajuste sensible (comisión, cuenta de pago, rol de alguien) | **Ahora · correo** | — | — | — | Seguridad; hoy no hay registro de cambios (09) |
| Importación o exportación terminada / fallida | Quien la lanzó · Centro de procesos + App | ← | ← | ← | Ya está en el catálogo |
| Resumen del día (ingresos, citas, no-shows, caja, mañana) | **WhatsApp a la hora que elija** | Correo | — | Push: «Mañana tienes 9 citas, la primera a las 9:00» | Reemplaza diez avisos sueltos |

### Mejoras

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | **Quitar lo falso**: sin datos reales, la campana y Novedades no se muestran (`chrome.notifications/news: false`) y el chat no cae al guion de demo (responde «no lo sé, aquí está el centro de ayuda») | Datos de otra industria y cifras inventadas en producción minan la confianza | A | S |
| P0 | **Bandeja de avisos real** (`GET /notifications`, marcar leído, «marcar todo», abrir el objeto): cada aviso con rol, sucursal, objeto, enlace y nivel | Sin bandeja ningún evento llega a nadie y no queda registro | A | M |
| P0 | **Diez eventos de arranque** en el servidor: reserva en línea, cancelación, reprogramación, no-show, WhatsApp fallido, stock bajo/agotado, descuadre de caja, caja sin cerrar, nómina por aprobar, reseña ≤ 3 | Los hechos ya existen; son los que cuestan dinero | A | M |
| P0 | **WhatsApp fallido visible**: usar `{ failed }` del envío, aviso a recepción con «llamar / reintentar», y filtro «mensaje fallido» en el pulso del calendario | Un recordatorio que no salió es el no-show siguiente | A | S |
| P0 | **Cablear el catálogo de Configuración** a la bandeja: lo apagado no se crea; añadir los eventos que faltan y el canal WhatsApp e «In-app» | Hoy el ajuste no hace nada (09) | A | M |
| P1 | **Push web con PWA** (manifiesto, service worker, permiso tras un gesto, «Añadir a inicio» guiado en iPhone) para barbero y recepción | El barbero tiene el celular, no la pestaña abierta | A | M |
| P1 | **WhatsApp al dueño**: plantillas de utilidad para lo «Ahora» (descuadre, reseña mala, todos los mensajes fallan) y el **resumen diario** | El dueño hispano vive en WhatsApp, no en el panel | A | M |
| P1 | **Preferencias por persona** encima de las del rol: silenciar, horario de silencio, canal; lo crítico no se apaga | Fresha lo hace por persona; evita el ruido | M | M |
| P1 | **⌘K con objetos del negocio**: clientes (con permiso `client-info`), citas de hoy, barberos, productos, servicios | Es la búsqueda del mostrador | A | M |
| P1 | **Ayuda por pantalla**: «Ayuda» muestra arriba los artículos de la pantalla actual (`articlesForScreen`) y la guía que aplica | Ya está escrito; es la promesa del plan | M | S |
| P1 | **«¿Te sirvió?» al servidor** + lista de preguntas sin respuesta del chat | Saber qué artículo escribir o arreglar | M | S |
| P1 | **Centro de procesos con trabajos del servidor** (importar clientes y productos, exportar CSV, cierre de nómina) e historial | Las importaciones son la puerta de entrada comercial (03) | M | M |
| P2 | Novedades reales (`GET /news`) con «visto» por persona, enlace a la pantalla y al artículo de ayuda | Contar lo nuevo sin que suene a otro producto | M | S |
| P2 | Feedback que cierra el ciclo: «Recibido», estado («lo estamos haciendo», «salió») como aviso en la bandeja; feedback sin campaña | El que opina vuelve a opinar si ve resultado | M | M |
| P2 | Pospone («recordar en 1 h / mañana») y «hecho» por aviso | Patrón de Linear y GitHub | B | S |
| P2 | Correo para lo formal: factura del plan, cambio de ajustes, cuenta | Prueba escrita | B | S |
| P2 | SMS solo como respaldo en EE. UU. | Costo; WhatsApp no domina allá | B | M |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial o según plan · ✗ no consta · ? no verificado en esta
investigación. El cupo de búsqueda fue de 15; **Booksy, Vagaro, Boulevard y AgendaPro** no tienen documentación
pública de avisos al equipo que se haya podido encontrar: «?» no quiere decir que no lo tengan.

### Sector (belleza y barbería)

| Función | Barberlytics | Booksy | Fresha | Square Appointments | Vagaro | Boulevard | Zenoti | AgendaPro |
|---|---|---|---|---|---|---|---|---|
| Aviso al profesional de reserva nueva / cancelación | ✗ | ? | ✓ correo al miembro asignado o a otros buzones | ✓ correo por miembro del equipo (comunidad, menús viejos) | ? | ? | ~ «alertas internas por acciones del equipo» | ? |
| Preferencias por persona | ✗ (solo por rol) | ? | ✓ cada miembro maneja las suyas | ~ por perfil del miembro | ? | ? | ? | ? |
| Tipos: nueva, confirmación, reprogramación, no-show, cancelación | ~ en catálogo, sin efecto | ? | ✓ | ~ | ? | ? | ? | ? |
| Push al equipo | ✗ | ? | ✗ «solo correo» por ahora (según su ayuda) | ? (el push documentado es para clientes) | ? | ? | ? | ? |
| Aviso de hueco liberado a lista de espera | ✓ (WhatsApp al cliente) | ? | ? | ? | ? | ? | ✓ al siguiente cliente | ✓ reagenda (03, 10) |
| Recordatorios al cliente con respuesta | ✓ WhatsApp (fase 2) | ✓ | ✓ | ✓ | ✓ | ? | ✓ | ✓ WhatsApp con doble confirmación |
| Bandeja dentro de la app | ✗ (campana de demo) | ? | ? | ? | ? | ? | ? | ? |
| Resumen diario al dueño | ✗ (en catálogo) | ? | ? | ? | ? | ? | ? | ? |
| Centro de ayuda con chat que cita | ✓ sin modelo | ? | ? | ? | ? | ? | ? | ? |

### Fuera del sector

| Referente | Qué hace | Qué aporta a una barbería |
|---|---|---|
| **Shopify** | Avisos al personal por evento («pedido nuevo»), por destinatario (correo o miembro del equipo) y **por ubicación** (POS o web), con «Enviar aviso de prueba». Stock bajo **no** está en la lista oficial: lo cubren apps de terceros (ShopAlert) | Avisos por sucursal; botón «probar aviso»; el stock bajo es justo el hueco que deja Shopify |
| **Toast** | La app del dueño (Toast Now) da reportes de anulaciones y descuentos por motivo, mesero y aprobador; su ayuda decía «push muy pronto» (página quizá vieja) | Lo que el dueño quiere es el **aviso** del descuento grande o el descuadre, no el reporte que tiene que ir a buscar |
| **Linear** | Bandeja con suscripción automática (lo que creas, te asignan o te mencionan), **posponer** (vuelve como no leído; se cancela si hay actividad nueva) y desde 2026-09 una pestaña **Prioridad** que separa lo que pide atención de lo que puede esperar | Bandeja por relación con el objeto («tu cita», «tu caja»), posponer y una vista «Prioridad» |
| **GitHub** | Bandeja con filtro por **motivo** (`reason:`), hasta 15 filtros propios, «guardado» y «hecho» | Cada aviso dice por qué te llegó («eres el barbero», «eres el dueño») |
| **Slack** | **Recaps**: resumen cada mañana de los canales que eliges; resúmenes con enlace a las fuentes; disponible en español | El resumen diario del dueño: pocos mensajes, con enlace a cada cosa |
| **Intercom Fin** | Responde desde el centro de ayuda y otras fuentes, **citando el artículo** (declarado); Zendesk cita «de forma limitada» según un tercero | Nuestro chat ya cita; falta que un modelo redacte sobre lo citado sin salirse |

### Hallazgos

1. **En el sector, el aviso al equipo es todavía correo.** Fresha lo dice en su ayuda (correo solamente) y Square lo
   resuelve por perfil de miembro y por correo. El push al barbero no aparece documentado en ninguno de los revisados.
   Hay espacio para ser el primero con **push + WhatsApp + bandeja** en español.
2. **Fresha deja las preferencias en manos de cada persona** (nueva, confirmación, reprogramación, no-show,
   cancelación). Es el modelo correcto: el rol pone el piso, la persona afina.
3. **Shopify enseña el detalle que hace falta en multisucursal**: avisos por ubicación y prueba de envío.
4. **Los productos que más se usan bajan el ruido, no lo suben**: Linear separa prioridad, GitHub explica el motivo,
   Slack resume. Ninguno manda más avisos para ser útil.
5. **El dueño quiere excepciones, no reportes.** Toast y Square dan reportes de anulaciones y descuentos; el valor
   está en avisar solo cuando algo se sale de lo normal (descuadre, descuento grande, reseña mala).

---

## 5. Mercado y tendencias

### Push web en iPhone (PWA)

- Desde iOS 16.4 una app web puede recibir push **si está añadida a la pantalla de inicio**, tiene **manifiesto** y
  pide el permiso **después de un gesto** de la persona (OneSignal y MoEngage; la documentación de Apple no se leyó
  aquí). Abierta en Safari sin instalar, no hay push.
- Implicación: hace falta manifiesto, service worker (con cuidado: `booking-flow` ya tropezó con la CSP del service
  worker, ver memoria del proyecto) y una guía «Instala Barberlytics en tu celular» para barberos.
- En la UE el soporte de apps web en inicio tuvo idas y venidas en 2024 (?); no afecta a EE. UU. ni a Colombia.

### Resúmenes en vez de ruido

- Slack (Recaps), Linear (Prioridad) y GitHub (motivo) van en la misma dirección: **menos avisos, mejor
  explicados**. Para una barbería: lo «Ahora» se limita a pocos eventos con dinero o cliente en juego; el resto va al
  resumen.
- Regla práctica propuesta: un aviso «Ahora» tiene que tener **una acción** (llamar, reintentar, ver la caja). Si no
  hay nada que hacer, va al resumen.

### WhatsApp como canal de avisos al dueño

- En Colombia WhatsApp es el canal (ver 03: Infobip, DataReportal). El dueño no abre un panel para enterarse de un
  descuadre; lo lee en WhatsApp.
- Un aviso al dueño fuera de la ventana de 24 h es un mensaje iniciado por la empresa: va con **plantilla aprobada**
  (de utilidad) y se cobra por mensaje desde julio de 2025 (03 §5). Un resumen diario = una plantilla al día por dueño;
  los «Ahora» deben ser pocos. ¿Cuenta como «utilidad» un aviso interno al dueño? Lo más probable es que sí si es
  transaccional, pero **no se verificó** (?).
- La política de Meta de enero de 2026 permite bots propios del negocio; un aviso con botón «Ver la caja» que abre la
  app es un uso transaccional, no un chatbot general.
- **Horario**: la Ley 2300 regula contactos comerciales al cliente (03). Para el dueño y el equipo no aplica igual,
  pero conviene el mismo principio: horario de silencio por persona, salvo lo crítico.

### Tendencias 2025–2026

1. **Bandeja con prioridad** (Linear) y **resúmenes redactados** (Slack) en vez de listas cronológicas.
2. **Avisos con acción dentro** (aprobar, reintentar, llamar) para no abrir la app.
3. **Ayuda que responde con citas** (Intercom Fin, declarado) sobre la propia base, con salida a una persona.
4. **El celular del trabajador como terminal**: el barbero no está frente a un escritorio; el push es su canal.

---

## 6. IA

### Datos que ya tenemos

Eventos de citas (estado, origen, confirmación, historial con actor), mensajes con estado y error, reseñas con nota,
existencias con `daysLeft` y `sold30`, cierres de caja con diferencia y nota, nómina con estado e historial, el
catálogo de avisos por rol, el centro de ayuda con `screens`, `roles` y `keywords`, el «¿Te sirvió?» (solo local) y las
preguntas del chat (solo locales, `barberlytics-chat`). **Faltan:** la bandeja (qué se avisó, qué se abrió, qué se
ignoró), preguntas sin respuesta en el servidor y el voto de ayuda en el servidor.

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Resumen del día redactado** | Junta los hechos del día y los cuenta en 5 líneas | Slack Recaps | «Hoy: 1,2 M en 31 citas, 2 no vinieron, la caja de Chapinero faltó 20.000 (nota: «cambio mal dado»), mañana 28 citas, primera a las 8:00». Por WhatsApp a la hora que elija el dueño | Sí (citas, caja, reseñas, stock) | Generativa sobre hechos calculados | Baja | Que el modelo cambie una cifra: las cifras van calculadas y el modelo solo redacta |
| 2 | **Prioridad de la bandeja** | Ordena por urgencia y por si hay algo que hacer | Linear Prioridad | Arriba: «WhatsApp falló para la cita de las 3 (cliente nuevo)»; abajo: «reseña de 5» | Sí, con reglas primero | Reglas → predictiva | Baja | Esconder algo importante: lo crítico nunca baja |
| 3 | **Agrupar avisos** | Funde diez avisos parecidos en uno | GitHub (por motivo), Slack | «4 recordatorios fallaron: el número de WhatsApp de la barbería está desconectado» en vez de cuatro avisos | Sí (`error` por mensaje) | Reglas + clasificación | Baja | Ninguno relevante |
| 4 | **Explicar la anomalía** | Dice por qué algo se salió de lo normal | Toast IQ, Stripe Radar (ver README) | «El descuadre coincide con un pago mixto mal registrado a las 5:40» | Parcial (pagos mixtos sin desglose, ver README) | Reglas + generativa | Media | Acusar a alguien: redactar como hipótesis, nunca como culpa |
| 5 | **Ayuda con modelo y citas** | Responde en lenguaje natural solo con los artículos, y cita | Intercom Fin (declarado) | «¿Cómo devuelvo un pago?» → pasos del artículo, adaptados a la pantalla en la que está, con el enlace | Sí (Markdown, `llms.txt`, `screens`) | Generativa con recuperación | Baja–media | Inventar pasos: si no hay artículo, decirlo y ofrecer soporte humano |
| 6 | **Ayuda que sabe dónde estás** | Usa la pantalla y el rol para elegir la respuesta | Plan del centro de ayuda; Intercom | En Nómina, «¿por qué no puedo editar?» → «el periodo está aprobado; reábrelo con un motivo» | Sí (`articlesForScreen`, rol) | Recuperación + reglas | Baja | Ninguno relevante |
| 7 | **Preguntas sin respuesta → artículos por escribir** | Agrupa lo que el chat no supo responder | Intercom (reportes de huecos de contenido, ?) | Lista semanal para quien escribe la ayuda | Falta guardar las preguntas en el servidor | Agrupación | Baja | Privacidad de lo escrito: anonimizar |
| 8 | **Clasificar el feedback** | Agrupa y prioriza comentarios | Ya existe: `server/feedback/analysis.ts` con Claude | Avisar al que opinó cuando su tema sale | Sí | Generativa | Baja | Ninguno relevante |
| 9 | **Aviso por voz o respuesta por WhatsApp** | El dueño responde «aprobar» al aviso de nómina | Agentes de WhatsApp (README, capacidad D) | «Nómina de la semana: 4,8 M. ¿Apruebo?» → «sí» | Sí (endpoints de nómina) | Agéntica | Alta | Mover dinero por chat: pedir confirmación fuerte y dejar registro |

### Top 5 apuestas

1. **Resumen diario por WhatsApp (caso 1).** Un solo mensaje reemplaza diez avisos, llega a quien no está en la app y
   reutiliza la capacidad B del README (hechos → narración). Es la IA con más valor visible para el dueño.
2. **Prioridad y agrupación con reglas (casos 2 y 3).** Barato, sin modelo al principio, y evita que la bandeja nazca
   ruidosa. Empezar por agrupar los WhatsApp fallidos por causa.
3. **Ayuda con modelo que cita y sabe dónde estás (casos 5 y 6).** La base ya está lista; cambiar el respaldo de demo
   por un modelo restringido a los artículos es el paso que el plan llamaba «fase 4».
4. **Explicar el descuadre y la anomalía (caso 4)**, una vez que el libro de pagos registre bien los pagos mixtos.
5. **Preguntas sin respuesta → contenido (caso 7)**: hace que la ayuda mejore sola cada semana.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Quitar lo falso y cablear (3–5 semanas)

- Apagar campana y Novedades mientras no haya datos reales; quitar el guion de demo del chat de ayuda.
- Contrato `GET /notifications` (lista paginada, `readAt`, `level`, `role`, `branchId`, `object`, `href`, `reason`) y
  `POST /notifications/read`; la bandeja con piezas del sistema (`ActivityDropdown`/`ListItem`), fila que abre el
  objeto, «marcar todo como leído».
- Diez eventos de arranque en el servidor (reserva en línea, cancelación, reprogramación, no-show, WhatsApp fallido,
  stock bajo/agotado, descuadre, caja sin cerrar, nómina por aprobar, reseña ≤ 3), filtrados por el catálogo de
  Configuración y por sucursal.
- WhatsApp fallido visible: aviso a recepción con «llamar / reintentar» y filtro en el pulso del calendario.
- Ayuda por pantalla en el menú «Ayuda»; «¿Te sirvió?» y preguntas sin respuesta al servidor.
- Textos de la cabecera al diccionario; `clearProcesses` al cerrar sesión.
- **Éxito:** % de WhatsApp fallidos atendidos antes de la cita; avisos abiertos / avisos creados.

### Fase 2 — Llegar a quien no está (6–8 semanas)

- PWA con manifiesto, service worker y push para barbero y recepción; guía de instalación en iPhone.
- WhatsApp al dueño: plantillas de utilidad para lo «Ahora» (descuadre, reseña mala, falla general de WhatsApp) y el
  resumen diario (primero con plantilla fija, sin IA).
- Preferencias por persona (silenciar, horario, canal), con lo crítico bloqueado; aviso de prueba como en Shopify.
- ⌘K con clientes, citas, barberos y productos (con los permisos de cada rol); recientes por usuario.
- Centro de procesos con trabajos del servidor (importar y exportar) e historial.
- Novedades reales con «visto» y enlace a la ayuda.
- **Éxito:** % de barberos con push activo; descuadres vistos por el dueño el mismo día; tiempo para aprobar la nómina.

### Fase 3 — Priorizar y explicar (2–3 meses)

- Bandeja con pestaña «Prioridad», agrupación y posponer.
- Resumen diario redactado por IA sobre cifras calculadas (caso 1).
- Ayuda con modelo restringido a los artículos, con citas, contexto de pantalla y rol, y salida a soporte humano.
- Explicación de anomalías de caja y nómina.
- Feedback que cierra el ciclo («lo hicimos», con aviso en la bandeja).
- **Éxito:** avisos por persona por día (que bajen); % de preguntas de ayuda resueltas sin soporte; votos «me sirvió».

---

## Fuentes

Consultadas en esta investigación (búsqueda y, donde se indica, lectura). Cupo usado: 15 búsquedas y 2 lecturas.
Booksy, Vagaro, Boulevard y AgendaPro no tuvieron resultado útil sobre avisos al equipo.

**Competidores del sector**
- Fresha, avisos de reservas en línea al equipo: https://www.fresha.com/help-center/knowledge-base/calendar/257-manage-online-bookings-settings
- Fresha, avisos personales (la página dio error 503 al leerla; se usa el resumen del buscador): https://www.fresha.com/help-center/knowledge-base/personal-account/36-manage-your-personal-notifications
- Square Appointments, comunicaciones y avisos: https://squareup.com/help/us/en/article/6729-manage-appointment-booking-notifications-and-reminders · https://squareup.com/help/article/8070-customize-notifications-for-square-appointments
- Square, comunidad (aviso al dueño de cancelaciones; menús viejos): https://community.squareup.com/t5/Payments-Troubleshooting/Can-I-receive-a-notification-or-alert-when-a-client-cancels/td-p/758636
- Zenoti, citas y alertas internas: https://help.zenoti.com/en/appointments.html · https://zenoti.com/platform/waitlist-management
- Booksy (sin documentación de avisos al equipo encontrada): https://biz.booksy.com/en-us/blog/worry-free-booking
- AgendaPro, recordatorios: https://agendapro.com/blog/recordatorios-automaticos-de-agendapro/

**Fuera del sector**
- Shopify, avisos al personal: https://help.shopify.com/en/manual/orders/notifications/order-notifications · ShopAlert: https://apps.shopify.com/admin-notifications
- Toast Now: https://support.toasttab.com/article/Get-Started-with-the-Toast-Now-App
- Linear, bandeja, posponer y Prioridad: https://linear.app/docs/inbox · https://linear.app/docs/snooze · https://linear.app/changelog/2026-09-03-priority-inbox (leída)
- GitHub, filtros de la bandeja: https://docs.github.com/en/enterprise-cloud@latest/subscriptions-and-notifications/reference/inbox-filters · https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications
- Slack AI Recaps: https://www.salesforce.com/news/stories/slack-ai-news-update/ · https://slack.com/blog/news/work-faster-and-smarter-with-slack-ai
- Intercom Fin (declarado y terceros): https://www.intercom.com/fin-zendesk · https://www.usefini.com/guides/zendesk-vs-intercom-ai-support-alternatives

**Push web en iPhone**
- OneSignal, web push en iOS: https://documentation.onesignal.com/docs/en/web-push-for-ios
- MoEngage, Safari Web Push en iOS: https://developers.moengage.com/hc/en-us/articles/13906923326100
- MagicBell, tendencias (UE): https://www.magicbell.com/blog/ios-web-push-notifications-trends-developments

**Del propio repo (para WhatsApp, Colombia y capacidades de IA)**
- `docs/investigacion-modulos/03-clientes.md` §5 (precios por mensaje, política de Meta 2026, Ley 1581 y 2300)
- `docs/investigacion-modulos/README.md` §3 (capacidades A–F)
- `docs/investigacion-modulos/09-configuracion.md` (avisos sin efecto)
- `docs/HELP_CENTER_PLAN.md` (§3.3 ayuda contextual, fase 4 «Preguntar»)
