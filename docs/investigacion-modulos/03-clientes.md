# Clientes — investigación

Investigación del 2026-10-17 sobre el módulo de Clientes (rutas `/clientes` y `/clientes/:id`). Solo lectura: no se
tocó código. Fuentes internas: `src/features/customers/`, `src/mocks/customers/`, `src/mocks/booking/`,
`ai-tools/CODEMAP.md`, `docs/roles/03-clientes-catalogo.md` y las notas de decisión del módulo y de la membresía.
Fuentes externas al final; las cifras de proveedores son **declaradas por ellos** y se marcan así.

## Resumen ejecutivo

1. El módulo ya es un buen **directorio operativo**: segmentos por ciclo de vida con recuento, tres avisos accionables
   (en riesgo, cumpleaños, falla seguido), una ficha con «Antes de empezar» (alergias y medicamentos) y permisos por rol.
2. Su mayor hueco no es de pantalla sino de **conexión**: membresía, paquetes, tarjetas de regalo, reseñas, lista de
   espera, consentimiento de marketing y recordatorios por WhatsApp ya existen en la reserva, pero la ficha no los muestra.
3. **Nadie puede escribirle al cliente desde Clientes.** El aviso «En riesgo» dice «es el momento de escribirle», pero no
   hay botón de WhatsApp, plantilla, campaña ni registro de lo enviado. Booksy, Square, Phorest, Mangomint y AgendaPro sí.
4. El **consentimiento** no está listo para Colombia: el texto del alta copia el estilo de SMS de EE. UU. («Responde
   STOP») y el consentimiento de marketing (Ley 1581) solo se guarda desde la reserva, no se ve ni se gestiona.
5. La IA con mejor relación valor/esfuerzo es **predecir la próxima visita y el abandono por el ritmo de cada cliente**:
   ya tenemos `visitEveryDays` y `lastVisitAt`; Zenoti y Klaviyo venden exactamente eso.
6. Recomendación: Fase 1 «conectar y escribir» (ficha 360 + WhatsApp 1 a 1 + consentimiento), Fase 2 «automatizar»
   (reactivación y cumpleaños con plantillas aprobadas), Fase 3 «predecir y conversar» (riesgo explicado, agente de WhatsApp).

---

## 1. Qué tiene hoy

**Mercado, según el código.** La interfaz es español primero con inglés (`src/app/i18n/es.ts`, `en.ts`); el teléfono
arranca en Colombia (`DEFAULT_PHONE_COUNTRY = "CO"`, `src/components/forms/phoneCountries.ts`) y el seed cita la Ley 1581
(`src/mocks/customers/seed.ts:35`). Pero el dinero está fijado en **USD** (`src/features/calendar/calendarFormat.ts:15`) y
las sucursales de demo están en Massachusetts, North Carolina, Rhode Island y Utah (`src/features/branches/branches.ts`). La
lectura honesta: **barberías hispanas en EE. UU. y Colombia**, con producción (`dash.barberlytics.com`) sirviendo hoy a
locales en EE. UU. Esto importa para el consentimiento y los canales (ver §5).

### Inventario

| Área | Qué hay | Dónde |
|---|---|---|
| Lista | `DataListBlock` con búsqueda (nombre, correo, celular, segmento, sucursal), 10 por página, columnas configurables (valor de vida, visitas, última visita, frecuencia, barbero, sucursal, correo, cliente desde), selección y barra de acciones | `CustomersPage.tsx`, `customersHome.tsx` |
| Segmentos | 8 estados de ciclo de vida: nuevo, retenido, frecuente, VIP, en riesgo, perdido, recuperado, bloqueado. Fichas `OptionTile` con recuento y la explicación en una línea; en la URL (`?tipo=`) | `types.ts`, `customersHome.tsx`, `lifecycleOf` en `mocks/customers/seed.ts` |
| Pulso | 3 cifras: % que vuelve, valor de vida promedio/total, % «a la deriva» (en riesgo + perdidos) | `customerPulse` en `customersHome.tsx` |
| Avisos | En riesgo · cumple en ≤ 7 días · falla seguido (cancelaciones + inasistencias ≥ 3); en la URL (`?aviso=`) | `CUSTOMER_ALERTS` |
| Ficha | Cabecera + 5 pestañas: Resumen, Citas, Pagos, Invitados, Productos (pestaña en la URL `?pestana=`) | `CustomerProfilePage.tsx`, `CustomerHistoryTabs.tsx` |
| Resumen | Aviso «Antes de empezar» (alergias, medicamentos); 4 cifras (valor de vida, ticket, visitas, cada cuántos días); barra de cumplimiento (asistió / canceló / no vino), recompra, antelación, barbero preferido; próxima o última cita; contacto; notas | `CustomerOverview.tsx` |
| Notas | Tres tipos (nota, alergia, medicamento), las mismas de la cita (`/clients/:id/notes`), se corrigen o borran desde su menú | `CustomerNoteDrawer.tsx`, `features/calendar/clientNotes` |
| Alta / edición | Drawer: nombre, apellido, celular (E.164), correo; plegado: cumpleaños, dirección, «solo pago en línea». Texto legal de SMS bajo el celular | `CustomerFormDrawer.tsx`, `customerInputSchema` |
| Invitados | Personas que vienen con el cliente (hijo, amigo…): añadir y quitar | `CustomerGuestsTab`, `POST/DELETE /customers/:id/guests` |
| Acciones | Crear, importar (aviso «llega pronto»), descargar CSV, abrir, agendar (`/calendario?cliente=`), nota, bloquear/desbloquear, borrar (lógico) | `customerActions.tsx` |
| Permisos | Alcance «todo / lo suyo» (barbero: lo prefiere o lo atendió en 12 meses); contacto y notas médicas tras `client-info`; dinero oculto a recepción; el CSV nunca lleva notas médicas | `customerAccess.ts`, `customersCsvRows` |
| Fotos | Solo avatar (o iniciales) | `customersShared.tsx` |
| Pruebas | Ayudas, pulso/avisos, pantallas y roles | `customers.test.tsx` |

**Lo que existe en el sistema pero no llega a Clientes** (todo en `src/mocks/booking/`):
membresía de visitas (`loyaltyOf`, `redeemLoyalty`), tarjetas guardadas (`cardsOf`), paquetes y tarjetas de regalo
(`giftCards.ts`), reseñas por cita (`reviews.ts`), lista de espera, recordatorios y confirmación por **WhatsApp**
(`reminders.ts`), canal de origen de la reserva (`metricsTabs.ts`, incluye WhatsApp), sugerencia de próxima visita con
hueco real (`visitSuggestion`) y el **consentimiento de marketing** con fecha y origen (`marketingConsent`, solo se
escribe al registrarse en la reserva, `mocks/booking/handlers.ts:387`).

**Tampoco hay:** etiquetas, campos propios, fotos de cortes, historial de comunicaciones, fusión de duplicados,
importación real, origen o referido, ni documento de identidad o datos de facturación.

---

## 2. Análisis del módulo

### Fortalezas

- **Segmentos con significado propio.** «En riesgo» no es «90 días sin venir»: es «ya debería haber vuelto según *su*
  ritmo» (`visitEveryDays × 2`). Es la misma idea que vende Zenoti como diferencial de su modelo de abandono
  (medir a cada cliente contra su propio patrón, no contra una regla fija). Ya la tenemos como regla; falta hacerla
  modelo y explicarla.
- **Del dato a la acción en un clic.** Los avisos viven en la URL, la barra de acciones concentra lo que se hace y
  «Agendar» abre la cita con el cliente puesto.
- **Seguridad por diseño.** Recorte por rol, teléfono enmascarado, notas médicas fuera del CSV y fuera de la vista de
  quien no tiene `client-info`. Encaja con el trato de datos sensibles que exige el Decreto 1377 (ver §5).
- **Lenguaje llano.** Las siglas de producción (FOV, AVF, «Ver índice») pasaron a cifras que se entienden.
- **Un cliente es uno solo** entre agenda y directorio (`db.calendar.clients`): no hay dos fuentes que se desincronicen.

### Huecos

1. **No hay canal de salida.** Sin botón de WhatsApp, sin plantillas, sin campañas, sin registro de mensajes. El aviso
   «En riesgo» se queda en diagnóstico.
2. **La ficha no es 360.** Membresía, paquetes, saldo de regalo, reseñas que dejó, lista de espera, tarjetas
   guardadas y consentimiento viven en la reserva y no se ven en la ficha. Recepción no puede responder «¿cuántas
   visitas le faltan para la cortesía?» sin abrir otra cosa.
3. **Sin memoria del corte.** No hay fotos del resultado ni «fórmula» (máquina, número, degradado, producto). Booksy,
   Boulevard, GlossGenius y Mangomint guardan fotos en la ficha; para una barbería es la pregunta diaria «¿cómo se lo
   dejé la última vez?».
4. **Sin etiquetas ni campos propios.** Booksy tiene etiquetas para agrupar y escribir; Square convierte campos propios
   en filtros y grupos inteligentes; Vagaro añadió campos propios en 2026.
5. **Consentimiento incompleto.** El texto del alta es de SMS al estilo EE. UU. y solo cubre mensajes de citas; el
   permiso de marketing no se pide en el mostrador, no se ve en la ficha y no se puede retirar.
6. **Duplicados e importación.** El alta no comprueba si el celular ya existe (`POST /customers` no lo valida) e
   importar es un aviso. Para migrar desde Booksy o AgendaPro, importar es la puerta de entrada comercial.
7. **Origen y referidos.** No se sabe cómo llegó el cliente (Instagram, Google, referido, pasaba por la calle).

### Deuda técnica

- **El correo es obligatorio** (`customerInputSchema.email`), pero en el mostrador casi nadie lo da y el identificador
  real en la región es el celular. Obliga a inventar correos y ensucia la base.
- **La lista no pagina en servidor** y filtra en memoria (`GET /customers` trae todo, sin filtrar por la sucursal de la
  cabecera, como ya anota `docs/roles/03-clientes-catalogo.md` C2). Con miles de clientes por local, no escala.
- **Segmentos calculados en el mock con hash**; el contrato no dice cómo los calcula el servidor real ni con qué
  umbrales (VIP, frecuente). Hay que fijar la regla en `docs/API_CONTRACT.md` antes de construir encima.
- **Moneda fija en USD** en `calendarFormat.ts`: un local en Colombia vería valores de vida en dólares.
- La membresía sigue llamándose `loyalty` en datos y claves; está bien, pero conviene que la ficha use el mismo
  nombre visible («Membresía»).
- Quedó fuera de producción: editar un invitado y «convertir en cliente», detalle de una transacción, filtro de fechas
  de pagos.

### Fricciones de UX

- **El aviso no termina en acción.** «En riesgo: 12» abre la lista filtrada, pero de ahí no se puede escribirles en lote.
- **Dos clics para lo que se pregunta en la silla.** Lo que el barbero necesita al sentar al cliente (alertas, cómo se
  lo cortó, qué prefiere hablar o no) está repartido entre Resumen y notas, sin foto.
- **«Bloquear» sin motivo.** No se guarda por qué se bloqueó, quién ni cuándo.
- **Pulso sin tendencia.** El 18 % «a la deriva» no dice si sube o baja frente al mes pasado (Métricas sí compara).
- **Cumpleaños sin botón.** El aviso existe, pero felicitar requiere copiar el número a mano.

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | **Escribir por WhatsApp desde la ficha y los avisos** (enlace `wa.me` con mensaje prellenado; luego API) | Cierra el ciclo «en riesgo → escribirle»; WhatsApp es el canal preferido en Colombia | A | S (enlace) / M (API) |
| P0 | **Consentimiento visible y gestionable** (citas vs. promociones, fecha, origen, retirar) + texto legal según país | Ley 1581: autorización previa, expresa e informada y demostrable; Ley 2300 regula contactos comerciales | A | M |
| P0 | **Ficha 360**: membresía (progreso y cortesías), paquetes, saldo de regalo, tarjetas guardadas, reseñas, lista de espera | Los datos existen; recepción los pregunta a diario | A | M |
| P0 | **Celular como identificador y correo opcional** + aviso de duplicado al crear | Base limpia; menos fricción en el mostrador | A | S |
| P1 | **Fotos del corte y «fórmula»** por cita (antes/después, máquina, número, producto) | Memoria del servicio; es la ficha que el barbero abre | A | M |
| P1 | **Etiquetas y grupos inteligentes** (filtros guardados: «VIP sin cita», «compra cera», «vino por Instagram») | Base de toda campaña; Booksy y Square lo tienen | A | M |
| P1 | **Automatizaciones básicas**: reactivación por ritmo, cumpleaños, gracias tras primera visita, pedir reseña | Lo estándar del sector (Booksy, Phorest, Mangomint) | A | M |
| P1 | **Historial de comunicaciones** en la ficha (qué se le envió, por qué canal, si respondió) | Evita escribir dos veces; prueba de consentimiento | M | M |
| P1 | **Importar** CSV/Excel con mapeo de columnas y detección de duplicados | Puerta de entrada para migrar | A | M |
| P1 | **Fusionar duplicados** (dueño y admin, según `ROLES_PLAN`) | Consecuencia de importar y del walk-in | M | M |
| P1 | **Paginación y filtros en servidor**, filtro por sucursal de la cabecera | Escala y coherencia con el resto | M | M |
| P2 | Origen y referidos («¿cómo nos conociste?», código de referido) | Mide adquisición; habilita premios por referir | M | S |
| P2 | Motivo y auditoría del bloqueo | Trazabilidad | B | S |
| P2 | Tendencia en el pulso (vs. periodo anterior) | Lectura de un vistazo | B | S |
| P2 | Formularios y consentimientos firmados (p. ej. químicos, menores) | Mangomint lo hace; en barbería es nicho (tintes, tratamientos) | B | M |
| P2 | Datos para factura electrónica (tipo y número de documento) cuando el cliente la pide | Colombia; verificar alcance con contador | M | S |
| P2 | Moneda por sucursal (COP/USD) | Locales en Colombia | M | S |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial o según plan · ✗ no consta · ? no verificado en esta investigación.
La búsqueda web se agotó antes de verificar las novedades de IA de Fresha, Booksy y Vagaro; donde dice «?» no se
debe asumir que no existe.

### Sector (belleza y barbería)

| Función | Barberlytics | Booksy | Fresha | Square | Vagaro | Boulevard | Mangomint | GlossGenius | Zenoti | Phorest | AgendaPro |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ficha con historial y notas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fotos en la ficha | ✗ (solo avatar) | ✓ | ? | ? | ? | ✓ antes/después | ✓ | ✓ con anotaciones | ? | ? | ? |
| Alertas médicas / alergias | ✓ | ? | ? | ? | ? | ? | ✓ | ✓ (charting) | ? | ? | ? |
| Etiquetas / campos propios | ✗ | ✓ etiquetas | ? | ✓ campos → filtros | ✓ (2026) | ? | ? | ? | ? | ? | ? |
| Segmentos o grupos | ✓ ciclo de vida | ✓ grupos | ✓ | ✓ grupos inteligentes | ? | ✓ | ? | ✓ filtros | ✓ | ✓ | ✓ filtros |
| Campañas texto/correo | ✗ | ✓ | ✓ editor | ✓ Square Marketing | ✓ | ✓ | ✓ Campaigns | ✓ | ✓ | ✓ | ✓ |
| Automatizaciones (reactivar, cumpleaños, gracias) | ✗ | ✓ | ~ recordatorios de recompra | ? | ? | ✓ | ✓ Flows | ? | ✓ | ✓ Client Reconnect | ~ |
| WhatsApp | ~ recordatorios (mock) | ? | ? | ? | ? | ? | ? (bandeja de SMS y teléfono) | ? | ? | ? | ✓ recordatorios con respuesta |
| Pedir reseña / fotos | ~ reseña en la reserva | ✓ | ✓ | ~ filtro por opinión | ? | ? | ✓ | ? | ? | ✓ | ? |
| Membresía / fidelidad | ~ (solo en la reserva) | ✓ tarjetas digitales | ✓ | ? | ? | ? | ✓ membresías y saldo | ? | ✓ | ? | ✓ |
| Formularios firmados | ✗ | ? | ? | ? | ✓ | ? | ✓ (add-on) | ✓ | ? | ? | ? |
| Bandeja de mensajes en la ficha | ✗ | ? | ? | ? | ? | ✓ registro | ✓ bandeja | ? | ? | ? | ? |
| Permisos por rol sobre clientes | ✓ fino | ? | ? | ? | ? | ? | ? | ? | ✓ | ? | ? |
| Abandono predictivo (IA) | ✗ (regla por ritmo) | ? | ? | ? | ? | ~ filtros con algoritmos | ✗ | ✗ | ✓ AI Retention Manager | ✗ | ✗ |
| Redacción de campañas con IA | ✗ | ? | ? | ? | ? | ✓ | ✗ | ✓ (cupo por plan) | ✓ | ? | ? |

### Fuera del sector (referentes de CRM)

| Referente | Qué aporta a una barbería |
|---|---|
| **Klaviyo** | CLV predicho a 12 meses, riesgo de abandono y **fecha esperada del próximo pedido** por cliente. Exige ≥ 500 clientes con compra, 180 días de historia y algunos con 3+ pedidos: un local solo no llega; una cadena o el agregado de la plataforma sí. |
| **Shopify** | Editor de segmentos por consulta que cruza **gasto predicho (alto/medio/bajo)** con **consentimiento** en la misma regla; grupo RFM por cliente expuesto en la API. Modelo para «grupos inteligentes» que respetan el permiso. |
| **Square** | Grupos inteligentes que se actualizan solos a partir de filtros de compra, cliente y reserva, y se usan directo en campañas. |
| **HubSpot Breeze** | Agentes: de datos (responde preguntas sobre clientes con el CRM), de atención (responde y escala) y de prospección (redacta para revisión humana). Patrón: el agente propone y la persona aprueba. |
| **Salesforce Einstein NBA** | «Siguiente mejor acción»: una biblioteca de recomendaciones + reglas que deciden cuál mostrar y dónde, opcionalmente con un modelo predictivo. Barato de imitar con reglas. |
| **SevenRooms** | Perfiles automáticos con >100 datos por comensal y **etiquetas automáticas por reglas** («primera vez», «reseña positiva») que alimentan campañas; «AI Notes» normaliza notas. |
| **Toast (ToastIQ)** | Muestra al mesero ocasiones, pedidos especiales e historial del huésped en el terminal; asistente de marketing que propone planes de correo, SMS y redes con datos de ventas. |
| **Starbucks (Deep Brew)** | Ofertas y sugerencias personalizadas con historial, hora, clima y ubicación; el propio caso señala el riesgo de «exceso digital» y privacidad. |
| **Intercom Fin** | Agente de atención cobrado por resolución (0,99 USD, según terceros). Útil como referencia de modelo de precio de un agente de WhatsApp. |

### Hallazgos

1. **La paridad básica del sector es «ficha + campañas + automatizaciones + reseñas».** Barberlytics tiene la ficha
   (y mejor resuelta en permisos y alertas médicas que la mayoría), pero le faltan las otras tres. Es el hueco que más
   se nota frente a Booksy, que es el competidor natural en barbería.
2. **Mangomint muestra el patrón ideal de ficha**: una línea de tiempo única (citas, ventas, notas, fotos, formularios)
   y la conversación al lado con el estado de la membresía. Es lo que pide nuestro hueco 2.
3. **Phorest «Client Reconnect»** es la versión simple de la reactivación: cuenta a los atrasados por categoría de
   servicio y les manda un mensaje de recompra; reenvía a las dos semanas a quien no respondió. Un salón en California
   dijo haber recuperado 21.000 USD en ventas en 2019 (cifra de prensa del sector, no verificada).
4. **La IA en el sector es todavía marketing redactado + abandono predictivo.** Solo Zenoti vende un modelo de
   abandono con explicación por cliente y aviso en el check-in; su propia nota dice que las «acciones recomendadas»
   aún están por llegar. Hay espacio para ser el primero en barbería hispana con algo así y en español.
5. **AgendaPro es el rival regional con WhatsApp**: recordatorios a los que el cliente responde para confirmar,
   reagendar o cancelar, y segmentación con filtros para campañas. Declara −48 % de inasistencias (cifra propia).

---

## 5. Mercado y tendencias

### Colombia: datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013)

- **Autorización previa, expresa e informada** para tratar datos, y que se pueda **probar** después. Hoy guardamos
  `marketingConsent.at` y `source` solo en la reserva; falta en el alta del mostrador, en la ficha y en la descarga.
- **Datos de salud = datos sensibles.** Alergias y medicamentos lo son. El Decreto 1377 obliga a informar que el titular
  **no está obligado** a autorizarlos y prohíbe condicionar el servicio a que los dé. Implicación: el campo debe ser
  opcional, con su propio permiso explícito, y seguir fuera de exportaciones (ya lo está).
- **Finalidades separadas.** Mensajes de la cita (servicio) y promociones (marketing) son finalidades distintas:
  dos casillas, no una.
- **Registro Nacional de Bases de Datos (SIC).** Según Holland & Knight (2024), hoy obliga a sociedades con activos
  > 100.000 UVT y a entidades públicas; la mayoría de barberías no estarían obligadas, pero Barberlytics como encargado
  sí debe tener política de tratamiento y contrato de transmisión con cada barbería. Verificar con abogado.
- **Ley 2300 de 2023 («Dejen de fregar»).** Pensada para cobranza, pero también alcanza la publicidad enviada sin
  autorización. Fija franjas (lunes a viernes 7:00–19:00, sábados 8:00–15:00, nunca domingos ni festivos) y limita la
  insistencia. El Registro de Números Excluidos de la CRC permite desde 2024 excluirse también de mensajes por
  aplicaciones. Implicación de producto: **ventana de envío por país** y **no reenviar más de una vez al día**.
- **EE. UU.** El texto actual (frecuencia variable, tarifas, «STOP») sigue la práctica de SMS de allá; debe quedarse
  para locales en EE. UU. y cambiar por el aviso de Ley 1581 para Colombia. (No se verificó la norma estadounidense en
  esta investigación.)

### WhatsApp Business Platform

- **Es el canal.** Infobip reporta que tres de cada cuatro colombianos prefieren WhatsApp para hablar con marcas;
  DataReportal (2024) le da más de 92 % de penetración en Colombia.
- **Precio por mensaje desde el 1 de julio de 2025** (antes por conversación). Las plantillas de **utilidad** dentro de
  la ventana de atención abierta son gratis; las de **marketing** se cobran siempre. Colombia tuvo subida de tarifas de
  utilidad y autenticación el 1 de octubre de 2025. Implicación: recordatorios (utilidad) baratos; reactivación y
  cumpleaños (marketing) cuestan por mensaje y deben medirse por retorno.
- **Desde el 15 de enero de 2026 Meta prohíbe los chatbots de propósito general** en la API; los bots **propios del
  negocio** (atención, reservas, avisos, ventas) siguen permitidos. Un agente de Barberlytics que agenda y reactiva para
  una barbería entra en lo permitido; un «chat con IA para cualquier cosa» no.

### Tendencias 2025–2026

1. **De informes a predicción.** Zenoti pasó de «quién lleva 90 días» a riesgo por cliente con motivos; Klaviyo y
   Shopify exponen CLV y gasto predicho como filtros normales.
2. **El agente propone, la persona aprueba.** HubSpot Breeze, Toast IQ Grow (agente de marketing con un humano de
   apoyo, 499 USD/mes) y GlossGenius (asistente con cupo de consultas) redactan; casi nadie envía sin revisión.
3. **El dato aparece donde se atiende.** Toast lleva la ocasión y el historial al terminal del mesero; Zenoti marca el
   riesgo en la pantalla de la cita. Lección: la alerta va en la cita del calendario, no solo en Clientes.
4. **Membresías y saldo** como motor de recurrencia (Mangomint, Fresha, Booksy con tarjetas digitales).
5. **Comercio conversacional** en LatAm: reservar, confirmar y pagar dentro del chat.

### Fidelización en LatAm

AgendaPro vende los recordatorios por WhatsApp como fidelización en sí («te están atendiendo»). En barbería la
recurrencia es alta y el ciclo corto (2–4 semanas), lo que hace que la **membresía por visitas** (ya construida) y la
**recompra en el momento justo** pesen más que los puntos. No se encontraron estudios independientes con cifras de
fidelización en barberías de la región; no se citan.

---

## 6. IA

### Datos que ya tenemos (en el contrato o en los mocks)

Visitas, cancelaciones, inasistencias, `lastVisitAt`, `visitEveryDays`, barbero preferido y barberos con los que fue,
valor de vida y ticket, servicios y productos comprados, pagos y método, origen de la reserva (en línea, interna,
walk-in; canal en Métricas), antelación, recompra, cumpleaños, notas tipadas, invitados, reseñas por cita (reserva),
progreso de membresía, lista de espera, huecos libres reales (`availability`, `visitSuggestion`), consentimiento de
marketing (solo reserva). **Faltan:** respuestas a mensajes, apertura/clic, fotos, etiquetas, origen de adquisición.

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Próxima visita esperada** | Fecha en que el cliente debería volver según su ritmo | Klaviyo «expected date of next order» | «Juan suele venir cada 18 días; le toca el jueves» + hueco real con su barbero (ya existe `visitSuggestion`) | Sí: `visitEveryDays`, `lastVisitAt`, disponibilidad | Predictiva | Baja (estadística por cliente) | Bajo; no usa datos sensibles |
| 2 | **Riesgo de abandono explicado** | Probabilidad de no volver + motivos («bajó de corte+barba a corte», «cambió de barbero», «2 cancelaciones») | Zenoti AI Retention Manager | Sustituir el segmento por regla por un puntaje con 2–3 motivos; marcarlo en la cita del calendario | Mayoría sí; el modelo necesita historia agregada de muchos locales | Predictiva | Media | Que el barbero lo lea como culpa (ROLES_PLAN: no culpar); explicar sin estigmatizar |
| 3 | **CLV predicho** | Lo que dejará el cliente en 12 meses | Klaviyo (≥ 500 clientes, 180 días); Shopify «predicted spend tier» | Priorizar a quién reactivar primero y a quién ofrecer membresía | Sí (ticket, frecuencia, productos) | Predictiva | Media | Un local pequeño no tiene volumen: entrenar a nivel plataforma |
| 4 | **Segmentación automática (RFM + ML)** | Agrupa por recencia, frecuencia y valor y nombra los grupos | Shopify (grupo RFM en la API); SevenRooms (etiquetas por reglas) | Etiquetas automáticas: «fiel de barba», «compra producto», «solo fin de semana», «viene con su hijo» | Sí | Predictiva | Baja–media | Bajo |
| 5 | **Siguiente mejor acción** | Para cada cliente, la acción con más probabilidad de retorno | Salesforce Einstein NBA | En la ficha y en la cita: «Ofrécele la cortesía: le falta 1 visita», «Pídele reseña: 5 visitas sin reseñar», «Sugiere cera: la compró hace 6 semanas» | Sí (membresía, reseñas, productos) | Predictiva + reglas | Media | Exceso de sugerencias; limitar a una |
| 6 | **Campañas de reactivación redactadas** | Escribe el mensaje, sugiere audiencia y momento | Boulevard (redacción con IA), GlossGenius (asistente), Toast IQ Grow, HubSpot | «Escríbeles a los 14 en riesgo de Chapinero»: borrador en español con nombre, barbero y hueco; el dueño aprueba | Sí; falta consentimiento y canal | Generativa | Baja (LLM) + M (envío) | Enviar sin permiso (Ley 1581/2300); tono; costo por mensaje de marketing |
| 7 | **Perfil 360 resumido** | Tres líneas antes de sentar al cliente | HubSpot data agent; Toast (datos en el terminal) | «Viene cada 3 semanas con Andrés · degradado bajo nº 1 · alérgico a la lanolina · le falta 1 visita para la cortesía» | Sí (salvo fotos/fórmula) | Generativa | Baja | Mostrar salud a quien no debe: respetar `client-info` |
| 8 | **Sentimiento de reseñas** | Clasifica reseñas y extrae temas | Birdeye y Podium (según comparativas de terceros) | Detectar barbero con quejas de puntualidad; avisar al dueño de una reseña negativa de un VIP | Sí (reseñas por cita) | Generativa / NLP | Baja | Volumen bajo por local; no usarlo para sancionar sin contexto |
| 9 | **Recomendaciones personalizadas** | Producto o servicio siguiente según historial y contexto | Starbucks Deep Brew | «A quien hace barba cada vez, ofrécele el aceite»; servicio adicional en la reserva | Sí (servicios, productos) | Predictiva | Media | «Exceso digital» y privacidad (lo señala el propio caso de Starbucks) |
| 10 | **Agente de WhatsApp** | Responde, agenda, confirma, reactiva y escala a humano | Intercom Fin (atención); AgendaPro (respuestas a recordatorios); Meta permite bots de negocio | «¿Me puedes atender el sábado?» → ofrece huecos reales y reserva; responde «sí» a una reactivación y deja la cita hecha | Sí (disponibilidad, catálogo, `phone/check`); falta integración API | Conversacional / agéntica | Alta | Política de Meta (no propósito general), consentimiento, horarios Ley 2300, errores de reserva; siempre salida a humano |
| 11 | **Notas por voz** | El barbero dicta y la IA ordena en nota/alergia/preferencia | SevenRooms «AI Notes» (normaliza notas) | Al cerrar la cita, «se lo dejé en 1 y medio, no le gusta la gomina» | Sí (notas tipadas); ya hay voz en el chat (`src/lib/chat/speech.ts`) | Generativa | Baja–media | Que clasifique como «nota» lo que es alergia: pedir confirmación |

### Top 5 apuestas

1. **Próxima visita + reactivación con hueco real (casos 1 y 6).** Ya calculamos el ritmo y ya sabemos buscar huecos;
   juntarlo con un borrador de WhatsApp aprobado por el dueño convierte «En riesgo» en citas. Esfuerzo bajo, impacto
   alto y medible (respondieron / reservaron).
2. **Perfil 360 en tres líneas, en la cita y en la ficha (caso 7).** Valor diario para el barbero, sin enviar nada a
   nadie, con los permisos que ya existen. Buena primera IA visible.
3. **Riesgo de abandono explicado (caso 2), entrenado a nivel plataforma.** Un local no tiene volumen; la plataforma sí.
   Empezar con reglas explicables (cambió de barbero, bajó de servicio, alargó el ciclo) y pasar a modelo cuando haya
   datos reales. Diferencial frente a Booksy y AgendaPro.
4. **Siguiente mejor acción con reglas (caso 5).** Membresía, reseñas y productos ya están; una sola sugerencia por
   cliente, en la cita. Barato y no depende de ML.
5. **Agente de WhatsApp acotado a la barbería (caso 10)**, después de tener consentimiento, plantillas y registro de
   mensajes. Primero «responder a la reactivación y dejar la cita hecha»; luego atención general. Cabe en la política de
   Meta de 2026 si se mantiene como bot del negocio.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Conectar y escribir (4–6 semanas)

- Celular como identificador; correo opcional; aviso de duplicado al crear.
- Consentimiento por finalidad (citas / promociones), con fecha, origen y retiro; texto legal por país; datos de salud
  con su propio permiso.
- Ficha 360: membresía, paquetes, saldo de regalo, tarjetas guardadas, reseñas, lista de espera.
- Botón «Escribir por WhatsApp» (enlace con mensaje prellenado) en la ficha, en los avisos (en riesgo, cumpleaños) y en
  la selección múltiple; se registra en la ficha que se escribió.
- Moneda por sucursal; paginación y filtro de sucursal en servidor.
- **Éxito:** % de avisos «En riesgo» con mensaje enviado; tiempo para responder «¿cuánto le falta para la cortesía?».

### Fase 2 — Automatizar y recordar (6–10 semanas)

- WhatsApp Business API con plantillas aprobadas: reactivación por ritmo, cumpleaños, gracias tras la primera visita,
  pedir reseña. Ventana de envío según la Ley 2300 y tope de un mensaje al día.
- Historial de comunicaciones (enviado, entregado, respondió, reservó).
- Etiquetas manuales y automáticas (RFM por reglas) y grupos inteligentes que respetan el consentimiento.
- Fotos del corte y «fórmula» por cita.
- Importar con mapeo y fusionar duplicados.
- **IA:** próxima visita esperada (caso 1), borradores de campaña (caso 6), perfil en tres líneas (caso 7).
- **Éxito:** clientes recuperados por mes; costo por mensaje de marketing frente a ingreso recuperado.

### Fase 3 — Predecir y conversar (3+ meses)

- Riesgo de abandono con motivos, a nivel plataforma, marcado en la cita del calendario.
- Siguiente mejor acción (una por cliente) y recomendación de producto.
- Sentimiento de reseñas con aviso al dueño.
- Agente de WhatsApp: responde, ofrece huecos, reserva y escala a humano; notas por voz.
- **Éxito:** recompra a 60 días; inasistencias; % de conversaciones resueltas sin humano.

---

## Fuentes

Consultadas en esta investigación (búsqueda y lectura). La búsqueda web se agotó antes de verificar las novedades de
IA de Fresha, Booksy y Vagaro y el caso Sephora; no se citan.

**Competidores del sector**
- Booksy, herramientas de marketing: https://biz.booksy.com/en-gb/features/marketing-tools · https://biz.booksy.com/en-ie/features/marketing-tools
- Booksy Biz Pro y Lite: https://biz.booksy.com/blog/booksy-biz-pro-and-booksy-biz-lite-which-is-right-for-your-business
- Booksy vs. GlossGenius: https://biz.booksy.com/en-us/comparison/glossgenius-comparison
- Fresha, editor de campañas: https://www.esteticamagazine.com/2023/08/03/freshas-new-campaign-builder-set-to-transform-client-engagement · https://hji.co.uk/freshas-marketing-campaign-builder-is-transforming-how-salons-engage-with-their-clients
- Fresha, fidelización: https://www.fresha.com/for-business/medspa/loyalty-tools-every-medical-spa-should-be-using · https://jobs.lever.co/fresha/b5b619e9-46b0-47fc-8175-e63f4655efa9
- Square, clientes de Appointments y filtros: https://squareup.com/help/us/en/article/6147-square-appointments-and-customer-directory · https://squareup.com/help/ca/en/article/8049-channel-filters
- Vagaro, novedades: https://www.vagaro.com/en-ca/pro/updates · https://subscribed.fyi/vagaro/
- Boulevard: https://www.joinblvd.com/blog/5-reasons-switch-to-boulevard · https://blvdco.prod.joinblvd.com/blog/4-ways-ai-is-transforming-the-beauty-and-wellness-industry-in-2025 · https://www.joinblvd.com/ai-information
- Mangomint: https://www.mangomint.com/features/client-management/ · https://mangomint.com/features/integrated-forms · https://www.mangomint.com/learn/marketing-options-in-mangomint/
- GlossGenius: https://glossgenius.com/customers/customers-overview · https://glossgenius.com/photo-feature · https://glossgenius.com/pricing
- Zenoti: https://zenoti.com/ai-workforce/ai-retention-manager · https://www.zenoti.com/blog/ai-retention-manager-win-back-lapsed-salon-clients · https://www.zenoti.com/en-uk/ai-for-salons-and-spas
- Phorest: https://phorest.helpjuice.com/overview-of-client-reconnect · https://www.salontoday.com/articles/how-these-salons-are-reclaiming-at-risk-clients
- AgendaPro: https://agendapro.com/mx/recordatorios-automaticos · https://agendapro.com/blog/gestion-de-clientes-con-agendapro/ · https://agendapro.com/co/barberia/app-para-barberia

**Referentes de CRM e IA**
- Klaviyo, analítica predictiva: https://help.klaviyo.com/hc/en-us/articles/360020919731 · https://www.klaviyo.com/blog/ai-predictive-marketing
- Shopify, gasto predicho y RFM: https://help.shopify.com/en/manual/customers/customer-segmentation/predicted-spend-tier · https://shopify.dev/docs/api/admin-graphql/latest/enums/CustomerPredictedSpendTier
- HubSpot Breeze: https://www.hubspot.com/products/artificial-intelligence/breeze-ai-agents
- Salesforce Einstein Next Best Action: https://trailhead.salesforce.com/content/learn/modules/einstein-next-best-action/understand-how-einstein-next-best-action-works
- SevenRooms: https://sevenrooms.com/en/platform/crm-data-guest-profiles/ · https://sevenrooms.com/press/sevenrooms-introduces-7x-marketing-automation-guest-engagement-restaurants/
- Toast: https://pos.toasttab.com/news/toast-launches-toastiq-superpower-future-of-restaurants · https://pos.toasttab.com/products/toast-iq-grow
- Starbucks Deep Brew: https://icmrindia.org/casestudies/catalogue/Marketing/MKTG482.htm · https://campaignme.com/starbucks-improves-loyalty-offerings-with-ai-platform/
- Intercom Fin (precios, fuentes de terceros): https://www.eesel.ai/blog/fin-ai-pricing · https://www.gleap.io/blog/intercom-fin-ai-pricing-2026
- Birdeye y Podium (comparativas): https://www.socialpilot.co/reviews/comparison/birdeye-vs-podium · https://www.g2.com/compare/birdeye-vs-sprout-social-vs-podium

**Colombia, WhatsApp y mercado**
- Ley 1581 de 2012: https://www.saludcapital.gov.co/Normo/gsp/ley_1581_de_2012.pdf
- Datos sensibles (concepto SIC): https://www.ambitojuridico.com/sites/default/files/BancoMedios/Archivos/cpto-201811400676461-18.pdf
- RNBD: https://www.hklaw.com/es/insights/publications/2025/01/obligaciones-del-registro-nacional-de-bases-de-datos-personales · https://www.perezllorca.com/es-co/actualidad/boletin/nuevas-obligaciones-del-rnbd/
- Ley 2300 de 2023: https://www.crcom.gov.co/sites/default/files/normatividad/2024537299.pdf · https://actualicese.com/asi-es-la-ley-dejen-de-fregar/ · https://www.asuntoslegales.com.co/consultorio/las-implicaciones-de-la-ley-2300-de-2023-ley-dejen-de-fregar-3715985
- WhatsApp, precios: https://developers.facebook.com/docs/whatsapp/pricing · https://docs.gallabox.com/pricing-and-billing-modules/new-per-message-pricing-effective-july-1-2025
- WhatsApp, política de chatbots 2026: https://respond.io/blog/whatsapp-chatbot-policy-2026 · https://www.business-standard.com/technology/tech-news/meta-bans-ai-chatbots-from-whatsapp-business-api-chatgpt-to-shut-down-jan-2026-125102200335_1.html
- WhatsApp en Colombia: https://www.enter.co/?p=577653 · https://www.larepublica.co/alta-gerencia/la-mayoria-de-empresas-colombianas-se-comunican-por-whatsapp-con-sus-clientes-3466649 · https://www.portafolio.co/tecnologia/whatsapp-como-se-consolido-como-el-principal-medio-entre-empresas-y-clientes-601797
