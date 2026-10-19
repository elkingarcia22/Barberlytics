# Front Desk (recepción y kiosco del local) — investigación

Investigación del 2026-10-19 sobre todo el puesto de recepción de una barbería: el kiosco donde el cliente marca que
llegó, la fila de clientes sin cita, la pantalla de turnos de la sala de espera, la tablet de recepción, el cobro en el
mostrador y la venta de productos. Solo lectura: no se tocó código. Se revisó el código en `4b7774e`.

**Fuentes internas leídas:** producción según `centro-de-ayuda/casos/front-desk.md` (recorrido del 2026-09-30) y
`centro-de-ayuda/content/es/front-desk/*.md` (`que-es`, `activar-el-kiosco`, `no-encuentra-la-cita` y otros seis);
`docs/roles/05-configuracion.md` §3.21–3.23, `docs/roles/01-calendario.md` §2.14, `docs/ROLES_PLAN.md` §4.8,
`docs/BOOKING_RESEARCH.md`, `docs/API_CONTRACT.md` (`booking.links`), `ai-tools/CODEMAP.md`. Código:
`src/features/settings/sections/BookingSettings.tsx`, `src/mocks/settings/seed.ts`, `src/features/booking/`
(`BookingPage.tsx`, `flow/BookingContext.ts`, `flow/ConsentFields.tsx`), `src/mocks/booking/handlers.ts`,
`src/features/calendar/` (`types.ts`, `calendarModel.ts`, `appointmentPlaybook.ts`, `WalkInSaleDrawer.tsx`,
`WaitlistDrawer.tsx`, `QuickSaleDrawer.tsx`, `CheckoutDrawer.tsx`, `checkout/PaySection.tsx`),
`src/mocks/calendar/handlers.ts`, `src/mocks/team/workforce.ts`, `src/features/team/LineupPage.tsx`,
`src/mocks/register/handlers.ts`, `src/mocks/notifications/handlers.ts`,
`src/features/settings/sections/{notificationCatalog.ts,DevicesSettings.tsx}`, `src/features/settings/gatewayProviders.ts`,
`src/features/access/access.ts`, y los informes [02 · Calendario](02-calendario.md), [08 · Equipo](08-equipo.md),
[10 · Reserva](10-reserva-en-linea.md) y [13 · Avisos](13-avisos-y-ayuda.md). Fuentes externas al final; lo que un
proveedor dice de sí mismo va como **declarado** y lo no verificado con «?».

## Resumen ejecutivo

1. **En producción el Front Desk existe y funciona en lo básico.** Es un enlace (`fd.barberlytics.com/front-desk/…`)
   que se abre en una tablet: alguien del equipo lo activa con su celular y un código, y el cliente escribe su número.
   Con cita, la marca como «Ingresado» y avisa al barbero; sin cita, se apunta a la lista de espera o reserva; si es
   nuevo, deja sus datos. No hay hardware ni costo extra. Es más de lo que documentan Booksy, Fresha o theCut.
2. **En Thema (el rediseño) el kiosco no existe.** Solo está el enlace en Configuración › Agendamiento online
   (`BookingSettings.tsx:287`) y la reserva en modo tablet con botones grandes (`touch: "lg"`). No hay pantalla de
   kiosco, ni endpoint público de check-in, ni aviso de «el cliente llegó»: el catálogo de avisos no tiene ese evento.
3. **Lo que más falta es la fila de clientes sin cita.** La «fila» de `/usuarios/fila` es el **turno de los barberos**
   (a quién le toca el próximo), no una cola de clientes. No hay posición, ni espera estimada, ni «te toca en 10 min»
   por WhatsApp. En la barbería hispana el cliente sin cita es la mitad del día (o más): Zenoti declara que 7 de cada
   10 clientes de barbería llegan sin cita al menos a veces. Zenoti, Waitwhile, Qminder y Meevo ya lo resuelven.
4. **La pantalla compartida filtra datos.** En producción, quien escriba un número ajeno ve el nombre, la sede, el
   servicio, el barbero y la hora de esa cita, y la pantalla de confirmación no vuelve sola al inicio. En Thema,
   `POST /phone/check` devuelve nombre y última visita sin código. Un kiosco debe mostrar lo mínimo y limpiarse solo.
5. **No se sabe a qué sede pertenece el kiosco.** En producción el enlace es el mismo en dos sedes y en Thema también
   (`frontDeskUrl` es por cuenta, `src/mocks/settings/seed.ts:65`). Un kiosco tiene que quedar atado a una sede.
6. **El cobro en mostrador está bien resuelto como registro, no como cobro.** La caja de Thema tiene propina, pago
   mixto, vuelto, datáfono elegido por TPN y cierre de caja, pero no le manda el monto a la terminal ni deja que el
   cliente elija la propina en su pantalla. Stripe Terminal, Square Terminal, Bold y el QR de Bre-B son el camino.
7. **Recomendación.** Fase 1 «el kiosco que ya tenemos, bien hecho» (sede, aviso de llegada, privacidad, fallos de
   producción). Fase 2 «la fila viva» (cola con espera estimada, WhatsApp «te toca», QR para unirse, pantalla de
   turnos, PIN del personal). Fase 3 «mostrador completo e IA» (terminal integrado, propina en pantalla, formularios,
   espera estimada aprendida, asignación de walk-ins).

---

## 1. Qué tiene hoy

### Producción (dash.barberlytics.com), según el centro de ayuda

| Pieza | Cómo funciona | Fuente |
|---|---|---|
| Enlace | Configuración › Agendamiento online › «Enlace de Front Desk» › Copiar. No caduca. «Por sede» según el usuario, pero el enlace observado es el mismo en dos sedes y usa el mismo código que `/book/` | `casos/front-desk.md` |
| Activar | Pantalla «Recepción»: teléfono del personal (+57, +1, +58) y código de 6 dígitos, o «Ingresar con Barberlytics» si hay sesión del dash en ese navegador. «Pantalla completa» abajo a la izquierda | `activar-el-kiosco.md` |
| Check-in con cita | Número → «¡Bienvenido de nuevo!» con sede, servicio, barbero y hora → **Check in** → la cita pasa a **Ingresado** y avisa al barbero según Configuración. Solo busca citas **pendientes de hoy** | `casos/front-desk.md`, `no-encuentra-la-cita.md` |
| Sin cita | «No se encontró ninguna cita» → **Unirse a la lista de espera** (servicio → barbero → confirmar) o **Reservar una cita** (abre la reserva en línea) | idem |
| Cliente nuevo | «Conozcámonos»: nombre, apellido, correo. Qué pasa después: sin confirmar | idem |
| En el dash | Calendario › Lista de espera: tarjeta con **Ingresar** → crea la cita a la hora actual, estado Ingresado, botón **Sentar** | idem |
| Bloquear | Botón **Bloquear** sin confirmación; vuelve a «Recepción» | `bloquear-el-kiosco.md` |

**Fallos de producción anotados en el recorrido:** la lista de espera no ofrece «sin preferencia»; precios en formato
USD (`$50.00 &UP`) aunque la sede sea de Colombia; «Atrás» siempre vuelve al inicio; «Reservar una cita» ofrece
**todas** las sedes; la tarjeta del dash no muestra el barbero elegido; el kiosco de una sede mostró el logo de otra; la
confirmación no vuelve sola al inicio; la fecha sale en formato inglés («SEP 30, 2026, 12:30 PM»).

### Thema (el rediseño), según el código

| Pieza | Qué hay | Dónde |
|---|---|---|
| Enlace del kiosco | Tarjeta «Kiosco de recepción» con «Enlace del kiosco» copiable. Uno por **cuenta**, no por sede | `BookingSettings.tsx:287-288`, `seed.ts:65` (`frontDeskUrl: …/front-desk/${DEMO_ACCOUNT}`) |
| Pantalla del kiosco | **No existe.** No hay ruta, ni activación con código del personal, ni check-in, ni bloqueo | — (`docs/roles/05-configuracion.md` §3.21: «✗ fuera del dash») |
| Reserva en tablet | `/reservar` con vista previa celular, **tablet**, monitor y widget; en tablet `touch: "lg"` agranda días, horas y filas para el dedo | `BookingPage.tsx:24-106`, `flow/BookingContext.ts:24` |
| Estados de la cita | `scheduled → arrived → seated → paid` (+ `no_show`, `cancelled`). «Ingresar», «Sentar», «Marcar listo», «Cobrar» según el estado | `calendar/types.ts:79`, `calendarModel.ts:149-151`, `appointmentPlaybook.ts:42` |
| Llegada | Se marca a mano en la cita (`PATCH /appointments/:id {status:"arrived"}`); queda en el historial. **Nadie recibe aviso** | `mocks/calendar/handlers.ts:415-421` |
| Turno de barberos | `/usuarios/fila`: dos listas (sin cita, sin preferencia) para encender y ordenar barberos. `GET /team/lineup/turn` dice a quién le toca: el que menos clientes de ese tipo lleva hoy y está libre | `LineupPage.tsx`, `mocks/team/workforce.ts:46-70` |
| Cliente sin cita | «Venta sin cita»: registra **después** un servicio ya hecho y lo manda a cobrar; propone al barbero de turno. «Sin cita previa» al crear una cita | `WalkInSaleDrawer.tsx`, `CreateAppointmentDrawer.tsx:319-327` |
| Lista de espera | Para **otra fecha y hora** (franjas), no una cola de hoy. Desde la reserva, con franja mañana/tarde/noche | `WaitlistDrawer.tsx`, `mocks/calendar/handlers.ts:749-797`, `mocks/booking/handlers.ts:312` |
| Venta de mostrador | «Venta rápida» de productos por categoría (`POST /sales`) | `QuickSaleDrawer.tsx` |
| Cobro | Una pantalla: citas juntas, propina, recargo de tarjeta, vuelto, pago mixto, datáfono elegido (nombre y TPN) | `CheckoutDrawer.tsx`, `checkout/PaySection.tsx:45,114-130` |
| Datáfonos y pasarelas | Datáfonos con serie, TPN y clave; pasarelas Stripe, Square, Wompi, Bold, Mercado Pago (PSE y Nequi en Colombia) por país | `DevicesSettings.tsx`, `gatewayProviders.ts:15-40` |
| Cierre de caja | Esperado por medio de pago, efectivo del rentero aparte, revisión antes de cerrar | `mocks/register/handlers.ts`, `mocks/review/checks.ts` |
| Rol recepción | Existe (`recepcion`, entra a `/calendario`); avisos propios: reserva en línea, cambios, no-show, WhatsApp fallido, «se unió a la lista de espera», bloqueos, caja abierta | `access.ts:45`, `notificationCatalog.ts:67` |
| Consentimiento | Casillas versionadas por país en la reserva; notas de alergia en la ficha | `flow/ConsentFields.tsx`, `consentPack` |

**Lo que no existe en ninguno de los dos:** cola de clientes sin cita con posición y espera, aviso por WhatsApp o SMS
«ya casi te toca», QR para unirse a la fila desde el celular o desde afuera, pantalla de turnos para el televisor,
cambio de persona por PIN en la tablet de recepción, cobro que se manda a la terminal, propina en la pantalla del
cliente, formulario de salud o firma en el kiosco, modo sin conexión e idioma elegible en el kiosco.

---

## 2. Análisis

### Fortalezas

- **El modelo de estados ya es el de un mostrador.** `scheduled → arrived → seated → paid` con «Marcar listo» del
  barbero (`barberReady`) es justo lo que necesita un kiosco y una pantalla de turnos: no hay que inventar estados.
- **El turno de barberos ya es justo y explicable.** `lineupTurn()` reparte por «quien menos lleva hoy y está libre»,
  salta a quien está ocupado y respeta ausencias. Es la mitad de una cola de walk-ins: falta la otra mitad (clientes).
- **Producción ya tiene la experiencia del cliente.** Check-in por celular, lista de espera y alta de cliente nuevo
  sin hardware. Squire y Vagaro cobran o empaquetan esto; Booksy, Fresha y theCut no lo documentan.
- **La caja de Thema es más completa que la de muchos competidores** (propina, mixto, vuelto, cierre con revisión).
  Lo que falta es conectar la terminal, no rehacer la caja.
- **Hay piezas táctiles listas.** `TimeSlotPicker`, `DayStrip`, `SelectableRow` y `TimeSlotGroups` tienen `size="lg"`
  pensado «para el dedo: tablet, kiosco»; la densidad «amplia» del tema también.
- **Pagos por país ya modelados**: Stripe/Square en EE. UU.; Wompi, Bold, Mercado Pago, PSE y Nequi en Colombia.

### Huecos

1. **No hay kiosco en Thema.** Solo el enlace. Si el rediseño sustituye al dash actual, el kiosco de producción queda
   huérfano o hay que rehacerlo con el mismo backend y la misma cara del sistema.
2. **El kiosco no sabe su sede.** Mismo enlace en todas (producción y Thema). La lista de espera «cayó» en una sede sin
   que se sepa por qué. Hace falta un enlace o un registro de dispositivo por sede.
3. **La llegada no avisa a nadie.** Producción dice que avisa al barbero «según Configuración», pero en Thema el
   catálogo de avisos (`notificationCatalog.ts`) no tiene un evento «cliente llegó» y la bandeja
   (`mocks/notifications/handlers.ts`) solo produce cancelación, no-show, reserva en línea, ausencias, caja y nómina.
4. **No hay cola de walk-ins.** El cliente sin cita se registra después (venta sin cita) o se mete a la lista de espera
   para otro día. No hay «eres el 3.º, unos 25 min», ni «te avisamos por WhatsApp, puedes salir».
5. **Sin pantalla de turnos.** El cliente en la sala no sabe cuánto falta; el barbero tiene que gritar el nombre.
6. **Sin cambio rápido de persona.** La tablet de recepción la comparten dueño, recepción y barberos; hoy cada uno
   tendría que salir y entrar con código por SMS. Square y Squire usan un PIN de 4 dígitos por persona.
7. **Sin cobro integrado ni propina en pantalla.** El datáfono se elige, pero el monto se teclea a mano en él y la
   propina la dice el cliente en voz alta. En EE. UU. la propina en pantalla del cliente es lo normal (Square, Toast).
8. **Sin QR de pago en Colombia.** Bre-B (desde el 6-oct-2025) y el QR de Nequi son gratis para el comercio y ya son
   el pago de mostrador del barrio; la caja no los tiene como medio.
9. **Sin formulario ni firma en el kiosco.** El consentimiento existe en la reserva, pero quien llega sin cita nunca lo
   ve. Alergias (cera, tintes) se anotan a mano en la ficha.
10. **Sin idioma ni letra grande elegibles por el cliente.** En una barbería hispana de EE. UU. conviven clientes que
    leen mejor en español y otros en inglés; el kiosco debería dejar elegir sin entrar a ajustes.
11. **Sin plan para la mala conexión.** Si cae el wifi, el kiosco no sirve y nadie lo sabe.

### Deuda técnica

- `frontDeskUrl` por cuenta (`seed.ts:65`) y `booking.links` «lo pone el servidor» (`API_CONTRACT.md:607`): el
  contrato no dice cómo se ata un kiosco a una sede ni cómo se revoca.
- La lista de espera tiene **dos formas** que no se parecen: la del calendario guarda franjas `{date, time}` y la de la
  reserva guarda `window` (mañana/tarde/noche). Una cola de hoy sería una tercera; conviene un solo modelo.
- `POST /appointments` crea **toda** cita como `scheduled`, también la de un walk-in que ya está en el local
  (`mocks/calendar/handlers.ts:376`): habría que crearla como `arrived`.
- No hay matriz de permisos para Front Desk ni Transacciones (`ROLES_PLAN.md` §4.8): quién puede activar o bloquear el
  kiosco está sin decidir (producción: «sin reglas» frente a «alguien del equipo con cuenta»).
- El evento `waitlistJoined` está en el catálogo de recepción (`notificationCatalog.ts:67`) pero nadie lo produce.

### Fricciones de UX (producción)

- «Atrás» vuelve al inicio en vez de al paso anterior; un error obliga a empezar de cero.
- La confirmación se queda en pantalla con los datos del cliente hasta que alguien toca «Ir al inicio».
- «Bloquear» no pide nada: cualquier cliente puede dejar el kiosco inútil hasta que llegue alguien del equipo.
- «Ingresar con Barberlytics» reactiva sin pedir nada si la tablet tiene abierta la sesión del dash. **Supuesto a
  verificar**: si esa sesión es la del dueño, un cliente que salga de la pantalla completa tendría el dash abierto.
- Lista de espera sin «sin preferencia»: el cliente sin cita casi nunca tiene barbero, lo obliga a elegir uno.

### Errores encontrados

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | **Se puede marcar una cita como cobrada sin cobrarla.** `PATCH /appointments/:id` acepta `status: "paid"` desde cualquier estado y deja `payment: null`; solo bloquea salir de `paid`. Un barbero puede hacerlo con su cita. La cita sale cobrada sin dinero en la caja | `src/mocks/calendar/handlers.ts:415-421` |
| Media | **El celular revela a la persona sin código.** `POST /phone/check` devuelve nombre, última visita y barbero; en un kiosco compartido cualquiera puede consultar números ajenos (ya señalado en [10](10-reserva-en-linea.md) para la reserva; en un kiosco es más grave) | `src/mocks/booking/handlers.ts:564-582` |
| Media (latente) | **La cita nueva cae en la primera sede del barbero**, no en la sede donde se crea: `branchId: barberMember.branchIds[0]`. Afecta a quien trabaja en varias sedes (el dueño que también corta tiene las cuatro, `team/seed.ts:313`) | `src/mocks/calendar/handlers.ts:351` |
| Media | **La llegada no genera aviso** aunque producción lo promete; no hay evento en el catálogo ni en la bandeja | `notificationCatalog.ts`, `mocks/notifications/handlers.ts` |
| Baja | El walk-in se crea `scheduled` y hay que tocar «Ingresar» aunque ya esté sentado | `mocks/calendar/handlers.ts:376` |
| Baja | `waitlistJoined` existe para recepción y no lo produce nadie | `notificationCatalog.ts:67` |
| Baja | Enlace del kiosco por cuenta, no por sede (mismo fallo que producción) | `src/mocks/settings/seed.ts:65` |

---

## 3. Qué le falta (tabla priorizada)

Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

| Prioridad | Mejora | Por qué | Esfuerzo | Depende de |
|---|---|---|---|---|
| P0 | **Kiosco atado a una sede**: «Activar kiosco» crea un dispositivo con token propio por sede (no la sesión de una persona); se ve y se revoca en Configuración › Front Desk | Resuelve «¿de qué sede es?» y evita dejar la sesión del dueño en una tablet pública | M | Contrato `POST /kiosk/devices`, matriz de permisos |
| P0 | **Check-in que avisa**: endpoint público del kiosco (`POST /kiosk/check-in` con token del dispositivo) que pasa la cita a `arrived` y emite el evento `clientArrived` al barbero y a recepción (campana, push) | Es la promesa de producción y el motivo de tener kiosco; hoy en Thema no avisa a nadie | S–M | Catálogo de avisos ([13](13-avisos-y-ayuda.md)) |
| P0 | **Privacidad en pantalla compartida**: el kiosco muestra solo nombre de pila y hora («Hola, Juan · 3:30 p. m.»), nunca correo, teléfono ni barbero de otro; vuelve solo al inicio a los 15 s; `phone/check` sin perfil en modo kiosco; límite de consultas por dispositivo | Hoy cualquiera puede ver la cita de otro escribiendo su número; Ley 1581 y buenas prácticas en EE. UU. | S | Kiosco por sede |
| P0 | **Cerrar el atajo a «cobrada»**: `status: "paid"` solo por `/checkout`; validar las transiciones de estado en el servidor | Error de dinero: una cita «cobrada» sin pago descuadra caja, nómina y métricas | S | — |
| P0 | **Cola de walk-ins en vivo**: «Unirse a la fila» (kiosco, recepción o QR) con servicio, «sin preferencia» por defecto, posición y espera estimada; la fila de barberos decide a quién le toca; «Llamar» desde el calendario la convierte en cita `arrived` | Es el día a día de la barbería hispana y la mitad de la demanda; ya existe `lineupTurn` | M | Un solo modelo de lista de espera |
| P1 | **WhatsApp «ya casi te toca»** cuando faltan N min o 1 persona, con «Voy» / «Ya no voy» (libera el lugar) | El cliente puede salir del local; Zenoti, Waitwhile y Yelp lo hacen por SMS. La plantilla *utility* es barata y gratis dentro de las 24 h | S–M | Cola en vivo, WhatsApp en producción (README §Pendiente 1) |
| P1 | **QR para unirse a la fila** (pegado en la puerta, en Instagram, en Google) y ver su posición desde el celular | Evita la tablet como cuello de botella y permite «pedir turno» desde la casa | S | Cola en vivo |
| P1 | **Pantalla de turnos para el televisor** (`/turnos/:sede`): «Ahora: Juan P. con Andrés · Siguen: María G., Luis R.», espera promedio, sin datos personales | Calma la sala, reduce «¿cuánto falta?»; Qminder la trae de serie | S–M | Cola en vivo |
| P1 | **Arreglar los fallos de producción del kiosco**: «sin preferencia», moneda y fecha de la sede, «Atrás» al paso anterior, solo la sede del kiosco al reservar, barbero visible en la tarjeta, logo de la sede | Fricción diaria y errores que ve el cliente | S | Repo de producción |
| P1 | **PIN del personal en la tablet de recepción**: cambiar de persona con 4 dígitos, bloqueo a los 2 min sin uso; mismo PIN para activar/bloquear el kiosco y para fichar | La tablet es compartida; pedir código por SMS a cada cambio no sirve. Lo pide [08](08-equipo.md) para fichaje | M | Sesión con `memberId` (hecho), `/auth/step-up` |
| P1 | **Cobro a la terminal**: la caja manda el monto a Stripe Terminal o Square Terminal (EE. UU.) o a Bold/Wompi (Colombia) y recibe aprobado, tarjeta y propina; ya no se teclea dos veces | Evita errores de digitación y descuadres; la propina entra con su barbero | L | Pasarela por sucursal (hecho), integración por proveedor |
| P1 | **Propina en la pantalla del cliente** (terminal o tablet girada): 3 opciones en %, monto propio y «sin propina», con el nombre del barbero | Estándar en EE. UU. (Toast, Square); sube la propina y quita la incomodidad | M | Cobro a la terminal o tablet de cara al cliente |
| P1 | **QR de Bre-B / Nequi como medio de pago** en la caja, con conciliación manual («llegó la transferencia») y su línea en el cierre | Es el pago de mostrador en Colombia; gratis para el comercio | S–M | Caja por país |
| P1 | **Idioma y letra grande en el kiosco**: botón «English / Español» y «Letra grande» en la portada; alto contraste | Clientes bilingües en EE. UU.; mayores en LatAm; ADA pide que el contenido del kiosco sea accesible | S | — |
| P2 | **Formulario de salud y firma en el kiosco** para quien llega por primera vez o para servicios con químicos (alergias, piel); queda en la ficha con fecha | Phreesia lo hace en clínicas; reduce riesgo con ceras y tintes. Dato sensible: consentimiento explícito | M | Consentimiento por país (hecho) |
| P2 | **Venta de productos en el kiosco** mientras espera («¿Te llevas la cera que usa tu barbero?») que se suma a su cuenta | Venta de mostrador sin interrumpir; Squire lo declara como *upsell* | M | Cola en vivo, catálogo |
| P2 | **Funcionamiento sin conexión**: el kiosco guarda llegadas y turnos en el dispositivo y los sube al volver la red; aviso visible «sin conexión» | El wifi del local falla; un kiosco caído se nota | M–L | PWA (README: pendiente), cuidar la CSP del service worker |
| P2 | **Check-in sin tocar**: QR en el recordatorio de WhatsApp o «Ya llegué» en el mensaje, con geocerca opcional | Menos fila frente a la tablet; Vagaro usa QR del celular | M | WhatsApp con respuestas (webhook) |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial · ✗ no consta · ? no verificado. Se hicieron 26 búsquedas. Para
**theCut, Booksy, Fresha y AgendaPro** no se encontró documentación pública de kiosco ni de cola: «?» no quiere decir
que no lo tengan.

### Sector (belleza y barbería)

| Producto | Check-in en kiosco | Cola de walk-ins con espera | Aviso «te toca» | Pantalla de turnos | Cobro en mostrador | Precio |
|---|---|---|---|---|---|---|
| **Barberlytics prod.** | ✓ celular, sin hardware | ~ lista de espera sin posición ni espera | ✗ | ✗ | ? | incluido |
| **Barberlytics Thema** | ✗ (solo el enlace) | ✗ (turno de barberos sí) | ✗ | ✗ | ~ registra, no cobra | — |
| **Squire** | ✓ «Front Desk Kiosk»: walk-ins se registran y toman el próximo hueco (declarado) | ~ toma el próximo hueco libre | ? | ? | ✓ POS propio | Kiosco incluido en el plan de 50 USD/mes con barberos ilimitados (declarado) |
| **theCut** | ? | ? | ? | ? | ✓ pagos en la app | ? |
| **Booksy** | ? (Biz Pro «para la recepción», sin kiosco documentado) | ? | ? | ? | ✓ | ? |
| **Fresha** | ? | ? (dice «manejar walk-ins») | ? | ? | ✓ | ? |
| **Square Appointments** | ✗ para citas (pedido en la comunidad) | ✗ | ✗ | ✗ | ✓ Square Terminal 299 USD; 2,6 % + 15 ¢ en persona desde 2025-02-25 | Free / Plus 29 / Premium 69 USD por sede (página de EE. UU.) |
| **Square Kiosk** | ✗ (pedidos de restaurante) | ✗ | ✗ | ✗ | ✓ cobra en el kiosco | iPad: ≤ 50 USD/mes por equipo; kiosco con IA de voz 1.999 USD + 99 USD/mes (reportado, oct-2026) |
| **Vagaro** | ✓ «Check-In App»: QR del celular, reloj o llavero; avisa al profesional por texto o push | ✗ | ✗ | ✗ | ✓ | Complemento 10 USD/mes (EE. UU.) |
| **Zenoti** | ✓ tablet, kiosco o QR | ✓ personas delante + espera estimada que se ajusta | ✓ SMS «eres el siguiente» | ? | ✓ POS | a medida (?) |
| **Meevo** | ✓ | ✓ con espera estimada (declarado) | ? | ? | ✓ | ? |
| **MyTime** | ✓ celular o correo; solo citas de hoy; queda «Checked In» | ? | ? | ? | ✓ | ? |
| **AgendaPro** | ? | ? | ? | ? | ✓ | ? |

### Fuera del sector

| Referente | Qué hace | Qué aporta a una barbería |
|---|---|---|
| **Waitwhile** | Lista de espera y citas; SMS de ida y vuelta; **WaitIQ** estima la espera con IA. Starter 31 USD/mes (1 sede, 250 visitas), Business 55 USD/mes; gratis hasta 50 visitas (según GetApp) | Espera estimada que aprende y el cliente que responde por mensaje |
| **Qminder** | Kiosco en iPad, **app para Apple TV en la sala**, lista por nombre, check-in remoto, SMS (plan Business). Starter 389–429 USD/mes | La pantalla de turnos como pieza estándar; demasiado caro para una barbería: oportunidad de incluirlo |
| **NextUp / eWAIT / In LineCut** | Colas por QR con avisos por texto para barberías; 9–69 USD/mes (según AlternativeTo y G2) | Que existan apps sueltas solo para esto dice que el hueco es real |
| **Phreesia** (clínicas) | Tablet de 10" con lector de tarjeta: check-in, copago, encuestas y **firma de consentimientos** según el tipo de cita; 85 % de pacientes se registran solos (declarado) | Formularios según el servicio y el cobro en el mismo paso que la llegada |
| **Yelp Guest Manager** (restaurantes) | Espera en vivo, el cliente se apunta desde su celular y recibe texto cuando su mesa está casi lista. Basic 129, Plus 279 USD/mes (según Eat App, sin precio oficial) | «Casi listo» antes de «listo»: dar margen para volver |
| **Toast** (restaurantes) | Propina y firma en la **pantalla de cara al cliente**, 3 porcentajes configurables; fuera de EE. UU. la propina va en el datáfono | La propina se elige donde el cliente la ve, no se dice en voz alta |
| **Stripe Terminal** | 2,7 % + 5 ¢ en persona; lectores M2 59 USD, WisePOS E 249 USD, S700 349 USD; Tap to Pay +10 ¢ | Integración directa desde nuestra caja en EE. UU. y México |

### Hallazgos

1. **El kiosco de check-in con cita es común; la cola con espera estimada no.** Solo Zenoti, Meevo, Waitwhile y
   Qminder documentan posición + espera + aviso. Entre los de barbería, ninguno revisado tiene pantalla de turnos.
2. **Quien lo cobra, lo cobra caro** (Qminder ~400 USD/mes; Vagaro 10 USD extra). Incluirlo en el plan, como Squire, es
   un argumento de venta directo contra Booksy y theCut.
3. **Nadie de los revisados lo ofrece en español y con WhatsApp.** Todos avisan por SMS. En LatAm y en la barbería
   hispana de EE. UU. el canal es WhatsApp.
4. **El cobro y la llegada se juntan en clínicas, no en barberías.** Phreesia cobra el copago al registrarse; en la
   barbería se cobra al final, pero la tarjeta guardada al llegar (o el anticipo) reduce las fugas.

---

## 5. Mercado y tendencias

### El cliente sin cita en la barbería hispana

- Zenoti declara (encuesta propia de 2023, 1.500 consumidores) que **7 de cada 10** clientes de barbería llegan sin cita
  al menos a veces y **35 %** casi siempre; en una segunda búsqueda no se pudo confirmar la cifra en su página. Su guía
  de 2026 dice que la proporción va de menos de 10 % en barberías premium por cita a más de 80 % en las de mucho paso,
  y que lo normal es un modelo **mixto: citas + fila digital**.
- No se encontró una encuesta específica de barberías dominicanas, puertorriqueñas o mexicanas en EE. UU. (?). Las
  señales cualitativas (fichas de barberías dominicanas con «walk-ins welcome», estudios de la barbería latina como
  espacio de comunidad) apuntan a lo mismo: se llega, se espera y se conversa. La espera no es el problema; **no saber
  cuánto** sí lo es.
- **Supuesto**: en Colombia el «turno» se pide por WhatsApp o en persona más que por enlace; validarlo con 5–10 dueños.

### Tablets y kioscos

- La tendencia es **sin hardware propio**: cualquier tablet o el celular del cliente con QR (Vagaro, Zenoti, MyTime,
  DaySmart con app gratuita). Square va al revés con un kiosco con IA de voz de 1.999 USD, pensado para restaurantes.
- En EE. UU., la ADA aplica al **contenido** del kiosco, no solo al aparato: alcance de 15 a 48 pulgadas, alternativa
  táctil o de voz, contraste. El Access Board propuso en 2024 reglas para máquinas de autoservicio (estado ?). Un
  kiosco web con letra grande, contraste y lector de pantalla cubre lo razonable; **verificar con un abogado**.

### Pagos en el mostrador

- **EE. UU.**: tarjeta presente con terminal (Square 2,6 % + 15 ¢; Stripe 2,7 % + 5 ¢) y propina en pantalla como norma.
  Tap to Pay en el celular del barbero elimina el lector para el barbero de renta.
- **Colombia**: **Bre-B** opera desde el 6-oct-2025 y en seis meses movió más de 670 millones de transacciones y 105
  billones de pesos (Forbes, abr-2026). El comercio recibe con un código que funciona como QR; Bancolombia pasó sus QR
  a Bre-B en may-2026. **Nequi QR Negocios** es gratis para el comercio (declarado). **Bold** vende el datáfono, sin
  mensualidad y con comisión por uso (declarado; más de 500.000 comercios en 2024). Para la barbería de barrio el QR
  es el medio dominante después del efectivo (**supuesto** razonable, sin cifra por sector).
- **WhatsApp**: las plantillas *utility* («ya casi te toca») son las baratas y no se cobran dentro de la ventana de 24 h
  abierta por el cliente; Meta subió la tarifa *utility* de Colombia el 1-oct-2025. Si el cliente se une a la fila
  escribiendo por WhatsApp, el aviso sale dentro de la ventana.

### Tendencias 2025–2026

- **Fila virtual** en vez de sala llena: unirse desde la calle, volver cuando avisan (restaurantes, clínicas, Zenoti).
- **Recepcionista con IA** por voz o WhatsApp que también responde «¿hay turno ahora?» (Queue Cut de RingRing AI, abr-2026;
  Fresha y Phorest en recepción, ver [02](02-calendario.md)).
- **El celular del cliente como kiosco** (QR, Wallet) y la tablet solo para quien no quiere usar el suyo.

---

## 6. IA

### Datos que ya tenemos

- Duración de catálogo por servicio y barbero; historial por cita con hora de cada cambio (`status:arrived`,
  `status:seated`, cobro en `payment.paidAt`): con eso se mide **la duración real** por barbero y servicio.
- Turno de barberos (`lineupTurn`), huecos libres (`barberFree`, `nextFreeMinute`), ausencias aprobadas.
- Riesgo de inasistencia por cita (capacidad A del [README](README.md)) y el ritmo de cada cliente.

### Casos

| # | Caso | Qué hace | Referente | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|
| 1 | **Espera estimada** | Calcula «unos 25 min» con la cola, la duración real de cada barbero en ese servicio, lo que le falta al que está en la silla y las citas que vienen | Waitwhile WaitIQ, Zenoti | Estadística (no LLM) | M | Prometer de menos: mostrar rango («20–30 min») y recalcular cada vez que algo cambia |
| 2 | **¿A quién le toca este walk-in?** | Propone barbero según turno, servicio, habilidad, hueco antes de su próxima cita y preferencia histórica del cliente; explica por qué | Fila de [08](08-equipo.md) (matching) | Reglas + optimización | M | Romper la equidad de la fila: el turno manda y la IA solo sugiere dentro de él |
| 3 | **Cuándo avisar** | Elige el momento del «ya casi te toca» según la espera, si el cliente salió y su historial de llegar tarde | Yelp («casi lista»), clínicas | Predictiva | S–M | Avisar tarde y perder el lugar: margen mínimo fijo |
| 4 | **«¿Hay turno?» por WhatsApp** | Clipper responde con la espera real y apunta al cliente a la fila si dice que sí | RingRing Queue Cut, Fresha AI receptionist | Conversacional con herramientas | M | Responder sin datos: solo lee la cola, no inventa |
| 5 | **Afluencia de hoy** | Predice las horas de más walk-ins y sugiere a quién poner en la fila o abrir una silla | 7shifts, Deputy ([08](08-equipo.md)) | Predictiva | M | Pocos datos por sede al inicio: empezar con promedios por día y hora |
| 6 | **Resumen del mostrador** | Al cerrar: cuántos walk-ins, cuántos se fueron sin atender, espera media, propina media | Hechos → narración (capacidad B) | Narración | S | Cifras: las pone el servidor, el modelo solo redacta |

### Top 3 apuestas

1. **Espera estimada (caso 1).** Es lo que el cliente pregunta y lo que hace útil la pantalla de turnos y el WhatsApp.
   Empezar con promedios (sin modelo) y medir el error real.
2. **«¿Hay turno?» por WhatsApp (caso 4).** Une la cola con Clipper; la pregunta más frecuente de la barbería de barrio.
3. **Clientes que se van sin atender (caso 6 + alerta).** Lo que el dueño no ve hoy: cuánta plata se fue por la puerta.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — El kiosco que ya tenemos, bien hecho (2–4 semanas)

- Kiosco por sede con token de dispositivo; activar y bloquear con permiso; lista de kioscos en Configuración.
- `POST /kiosk/check-in` → `arrived` + evento `clientArrived` (barbero y recepción) en catálogo, campana y push.
- Privacidad: solo nombre de pila y hora, vuelta automática al inicio, `phone/check` sin perfil en modo kiosco.
- Pantalla del kiosco en Thema con las piezas `lg`, botón de idioma y letra grande.
- Fallos de producción: «sin preferencia», moneda y fecha de la sede, «Atrás», sedes, barbero en la tarjeta, logo.
- Errores: `paid` solo por cobro, transiciones validadas, sede correcta al crear la cita, walk-in nace `arrived`.
- **Éxito:** % de citas con check-in en el kiosco por sede; cero consultas de número que muestren datos de otra
  persona; tiempo entre llegada y «Sentar» medible.

### Fase 2 — La fila viva (4–8 semanas)

- Cola de walk-ins (un solo modelo con la lista de espera) con posición, espera estimada por promedios y «Llamar».
- QR para unirse desde la puerta o desde casa; WhatsApp «ya casi te toca» con «Voy / Ya no voy».
- Pantalla de turnos para el televisor (`/turnos/:sede`) sin datos personales.
- PIN del personal en la tablet de recepción (cambio de persona, kiosco, fichaje).
- QR de Bre-B / Nequi como medio de pago y su línea en el cierre de caja.
- **IA:** espera estimada con duración real (caso 1).
- **Éxito:** clientes sin cita registrados por día; % que se va sin atender (baja); error medio de la espera < 10 min.

### Fase 3 — Mostrador completo e IA (trimestre siguiente)

- Cobro a la terminal (Stripe/Square en EE. UU.; Bold/Wompi en Colombia) con propina en la pantalla del cliente.
- Formulario de salud y firma en el kiosco; venta de productos mientras espera.
- Modo sin conexión (PWA) con cola local y subida al volver la red.
- **IA:** «¿hay turno?» por WhatsApp, sugerencia de barbero para el walk-in, afluencia del día y resumen del mostrador.
- **Éxito:** propina media por servicio (sube); cobros tecleados a mano (baja a ~0); walk-ins atendidos por hora de silla.

---

## Errores encontrados

Ver la tabla de §2. Los dos que tocan dinero o privacidad y conviene arreglar ya, aunque el kiosco tarde:

1. ~~`PATCH /appointments/:id` con `status: "paid"` deja una cita cobrada sin pago~~ **Corregido el 2026-10-19**:
   el servidor responde `422` y una cita solo queda cobrada con `POST /appointments/:id/checkout`.
2. `POST /phone/check` devuelve el perfil del cliente sin código (`src/mocks/booking/handlers.ts:564-582`). Ojo: es
   una decisión del dueño del producto del 2026-10-13 (el celular reconoce al cliente sin código); en modo kiosco,
   con la pantalla compartida, hay que revisarla.

Y uno latente para el día que haya kioscos por sede: la cita se crea en `branchIds[0]` del barbero, no en la sede
donde se pide (`src/mocks/calendar/handlers.ts:351`).

---

## Fuentes

Se hicieron 26 búsquedas web; no se leyó ninguna página completa. Lo que un proveedor dice de sí mismo va como
**declarado**; los precios de terceros pueden estar desactualizados: confirmar en la página del proveedor.

**Internas:** `/Users/ub-col-pro-lf4/Documents/centro-de-ayuda/casos/front-desk.md`,
`centro-de-ayuda/content/es/front-desk/{que-es,activar-el-kiosco,no-encuentra-la-cita,check-in-con-cita,lista-de-espera,
atender-la-lista-de-espera,bloquear-el-kiosco,cliente-nuevo,reservar-desde-el-kiosco}.md`, y las rutas del encabezado.

**Sector**
- Squire: https://getsquire.com/features/front-desk-kiosk · https://getsquire.com/business-edge/squire-offers-new-lower-price · https://getsquire.com/features/pos-payments · https://www.wmtips.com/technologies/scheduling/squire/
- theCut: https://thecut.co/client-features · https://www.thecut.co/blog/why-thecut-is-the-best-app-for-barbers
- Booksy: https://biz.booksy.com/blog/booksy-calendar-easy-way-to-take-care-of-your-appointments · https://en.wikipedia.org/wiki/Booksy
- Fresha: https://www.fresha.com/for-business/barber/how-to-run-a-fully-booked-barbershop-with-fresha · https://fitsmallbusiness.com/fresha-review/
- Square: https://squ.re/2Slvwdp · https://squareup.com/us/en/townsquare/introducing-square-terminal · https://checkoutpage.com/blog/square-fees · https://squareup.com/us/en/point-of-sale/restaurants/kiosk-software · https://fourweekmba.com/ai-squares-ai-kiosk-takes-voice-orders-1999-99-a-month/ · https://community.squareup.com/t5/Feature-Requests/Square-Concierge-Smart-Kiosk-Receptionist-for-Service-Based/idi-p/791128
- Vagaro: https://www.vagaro.com/pro/check-in-app · https://apps.apple.com/us/app/-/id1287930977
- Zenoti: https://www.zenoti.com/barbershop-software/scheduling · https://www.zenoti.com/thecheckin/barbershop-walk-in-vs-appointment-guide · https://www.zenoti.com/thecheckin/customer-data-insights-for-barbershop-owners-what-your-clients-really-want
- Meevo y MyTime: https://meevo.com/business-boosters/walk-in-management · https://help.mytime.com/support/solutions/articles/31000174556-appointment-check-in-via-kiosk
- DaySmart Kiosk: https://apps.apple.com/us/app/-/id1482427587

**Fuera del sector**
- Waitwhile: https://waitwhile.com/pricing/ · https://www.getapp.com/retail-consumer-services-software/a/waitwhile/
- Qminder: https://qminder.com/pricing
- Colas para barberías: https://alternativeto.net/software/nextup-walk-in/about/ · https://www.g2.com/products/ewait/discuss · https://apps.apple.com/us/app/-/id6761350275 · https://kdhnews.com/online_features/press_releases/ringring-ai-launches-queue-cut-to-modernise-the-walk-in-barber-experience/article_144694b1-f0fe-566b-bcac-ebab526b182d.html
- Phreesia: https://www.phreesia.com/modalities/ · https://www.mobihealthnews.com/news/tablet-based-waiting-room-check-company-phreesia-raises-30m
- Yelp Guest Manager: https://yelp-support.force.com/article/What-is-Yelp-Waitlist · https://restaurant.eatapp.co/blog/tablesready-alternatives-competitors
- Toast: https://support.toasttab.com/en/article/Removing-Digital-Signatures-from-the-Checkout-Process · https://support.toasttab.com/en/article/Basic-Digital-Receipt-Configuration
- Stripe Terminal: https://www.nerdwallet.com/business/software/learn/stripe-fees · https://www.swipesum.com/insights/guide-to-stripe-fees-rates-for-2025

**Mercado, pagos y normas**
- Bre-B: https://forbes.co/2026/04/13/economia-y-finanzas/bre-b-supero-670-millones-de-transacciones-y-105-billones-en-sus-primeros-seis-meses/ · https://www.larepublica.co/finanzas/llaves-para-negocios-de-bre-b-4241983 · https://www.elpais.com.co/economia/bancolombia-integro-sus-codigos-qr-a-bre-b-para-pagos-inmediatos-entre-bancos-asi-funciona-la-medida-0730.html
- Nequi: https://www.valoraanalitik.com/nequi-permitira-a-pequenos-comercios-recibir-pagos-desde-otros-bancos-y-sin-costo/ · https://www.elespectador.com/economia/nequi-lanza-app-para-negocios-permitira-cobrar-con-tarjeta-desde-el-celular-noticias-hoy/
- Bold: https://www.valoraanalitik.com/bold-que-se-posiciono-con-datafonos-revela-estrategia-2025-con-mas-servicios-en-colombia/ · https://www.noticiasrcn.com/economia/pagos-con-datafono-cambian-en-colombia-tras-alianza-entre-bold-y-956809
- WhatsApp: https://developers.facebook.com/docs/whatsapp/pricing · https://www.spurnow.com/blogs/whatsapp-business-api-pricing-explained
- ADA y kioscos (guías de proveedores, verificar con la norma): https://kioskgroup.com/blogs/resource-guides/ensuring-your-kiosks-are-ada-compliant · https://www.vendingtimes.com/articles/navigating-ada-requirements-for-self-service-kiosks/
- Barbería dominicana (etnografía, sin datos de citas): https://rex.libraries.wsu.edu/esploro/outputs/doctoral/TRANSNATIONAL-MASCULINITIES-INTERSECTING-UNRAVELING-THE-TAPESTRY/99901195630601842
