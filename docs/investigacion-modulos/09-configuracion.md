# Configuración — investigación

Investigación del 2026-10-17 sobre el módulo de Configuración de Barberlytics (rutas `/configuracion` y
`/configuracion/:seccion`). Se basa en el código de este repositorio, en las notas del proyecto
(`project-modulo-configuracion.md`, `docs/roles/05-configuracion.md`) y en fuentes públicas de la competencia,
que se listan al final. Donde una cifra viene del propio proveedor se dice.

## Resumen ejecutivo

- Configuración ya es un módulo amplio y bien hecho: **20 ajustes en 4 grupos**, dos moldes de formulario
  (documento y lista), permisos por rol en cada ajuste, modo de solo consulta y búsqueda desde ⌘K.
- Lo que falla no es la pantalla, es **el resto del sistema**. El selector de sucursal de la cabecera no lee las
  sucursales que se crean aquí, los impuestos no llegan a servicios y productos, los avisos no mueven los
  recordatorios y el ciclo de nómina no cambia el periodo de Nómina.
- El idioma es español y el formato de fechas `es-CO`, pero **los datos de base son de Estados Unidos**: festivos
  de EE. UU., Stripe como única pasarela (Stripe no está disponible para empresas en Colombia), datáfonos con
  «TPN», EIN y estados. Para Colombia y LatAm faltan festivos locales, pasarelas locales y factura electrónica DIAN.
- No hay **puesta en marcha guiada**, ni **importación** desde otro sistema, ni **plantillas de mensajes**, ni
  **WhatsApp** como canal configurable, ni **registro de cambios**, ni **exportación** de datos.
- Las cinco apuestas de IA con mejor relación valor/esfuerzo: configuración por conversación con Clipper,
  importación asistida, redacción de políticas y mensajes, auditoría de configuración con cifras propias y
  búsqueda de ajustes en lenguaje natural.

---

## 1. Qué tiene hoy

### 1.1 Estructura y archivos

| Pieza | Archivo | Qué hace |
|---|---|---|
| Catálogo | `src/features/settings/settingsCatalog.ts` | La única lista de ajustes: grupos, ids, rótulos, ruta y **regla de acceso** por ajuste (`operative`, `operativeShared`, `ownerEdits`, `ownerOnly`, `closures`, `payroll`, `permissions`, `personal`). De aquí salen la pantalla, el menú de la cabecera y el buscador ⌘K (`AdminShell.tsx`). |
| Pantalla índice | `src/features/settings/SettingsPage.tsx` | Los grupos en dos columnas, cada ajuste con icono, título y una línea de ayuda. Solo enseña lo que el rol puede abrir. |
| Pantalla de un ajuste | `src/features/settings/SettingsSectionPage.tsx` | Marco común (migas, título); el cuerpo sale de `SETTINGS_BODIES`. Rol sin acceso → `/403`; rol de consulta → `fieldset disabled` con aviso. |
| Molde documento | `src/features/settings/SettingsFormParts.tsx` | `SettingsDocument`: un objeto por ajuste, barra «Guardar / Descartar» que solo aparece con cambios, errores por campo. |
| Molde lista | `src/features/settings/SettingsListParts.tsx` | `SettingsList`: filas, alta y edición en cajón lateral, borrado con confirmación. |
| Contrato | `settingsApi.ts`, `settingsQueries.ts`, `settingsTypes.ts` | `GET/PUT /settings/:section` (11 documentos), CRUD `/settings/lists/:list` (4 listas), `POST /settings/payments/test`, `POST /account/delete`. Esquemas Zod. |
| Simulación | `src/mocks/settings/seed.ts`, `handlers.ts` | Datos de demostración y validación de servidor. |
| Marca | `src/features/branding/*` | Logo (claro y oscuro opcional), nombre y vista previa del menú; `GET/PUT /company/branding`. |
| Sucursales del shell | `src/features/branches/branches.ts` | Lista **estática** de 4 sucursales que usa la cabecera. |
| Secciones sin pantalla | `src/features/sections/SectionPlaceholderPage.tsx` | El «Próximamente» genérico del menú; Configuración no lo usa hoy (todos los ajustes tienen cuerpo). |
| Pruebas | `src/features/settings/settings.test.tsx` | 25 casos con Testing Library. No hay e2e de Configuración. |

### 1.2 Inventario de ajustes

| Grupo | Ajuste (id) | Archivo | Qué guarda | ¿Lo usa otro módulo? |
|---|---|---|---|---|
| Negocio | Perfil del negocio (`negocio`) | `sections/BusinessSettings.tsx` | Zona horaria, formato 12/24 h, inicio de semana, **un solo horario de apertura y cierre**, festivos, web, Instagram, Facebook y Google Maps | Sí: la reserva lee el horario y las redes (`mocks/booking/logic.ts`) |
| | Identidad de marca (`identidad`) | `features/branding/BrandIdentitySettings.tsx` | Logo claro y oscuro, nombre | Sí: menú lateral, reserva |
| | Sucursales (`sucursales`) | `sections/BranchesSettings.tsx` | Nombre, razón social, NIT o tax ID, dirección, moneda, idioma, zona y estado | Solo la reserva. **La cabecera no**: usa `BRANCHES` estático |
| | Horarios y cierres (`cierres`) | `sections/ClosuresSettings.tsx` | Rangos de fechas cerrados, por sucursal | Sí: la reserva bloquea esos días |
| | Reservas online (`agendamiento`) | `sections/BookingSettings.tsx` (347 líneas) | Anticipación, intervalo, **precio por alta demanda**, lista de espera, métodos de pago, **anticipo** (clientes nuevos o tras N inasistencias), **cliente frecuente**, **paquetes**, cancelación (horas, % de cargo, máximo), texto de política con variables, enlaces y widget, embudo de reservas | Sí, es el ajuste más conectado |
| | Recordatorios y avisos (`centro-notificaciones`) | `sections/NotificationSettings.tsx` + `notificationCatalog.ts` | Interruptores por destinatario (dueño, admin, recepción, barbero por comisión, barbero de renta, clientes) × evento × canal (correo, push, SMS) y umbrales | **No**: los recordatorios de la reserva están fijos a 24 h y 2 h por WhatsApp (`mocks/booking/reminders.ts`) |
| | Datos legales (`empresa`) | `sections/CompanySettings.tsx` | Nombre, razón social, identificación, web, teléfono, país | Sí: la reserva muestra nombre y teléfono |
| Cobros | Precios y moneda (`precios`) | `sections/PricingSettings.tsx` | Moneda (USD, COP, MXN, EUR) y si el precio incluye impuesto | Sí: moneda de la reserva |
| | Impuestos (`impuestos`) | `sections/TaxesSettings.tsx` | Grupos de tasas | Parcial: la reserva suma el primer grupo; **servicios y productos tienen su propio `taxRate`** |
| | Propinas (`propinas`) | `sections/TipsSettings.tsx` | Opciones, cuál va marcada, qué ve el cajero | Sí: cobro (`CheckoutDrawer`) y reserva |
| | Recargo por tarjeta (`tarifa-tarjeta`) | `sections/CardFeeSettings.tsx` | Nombre, % o monto | Sí: cobro y reserva |
| | Datáfonos (`dispositivos`) | `sections/DevicesSettings.tsx` | Nombre, serial, TPN y clave (que no vuelve del servidor) | No |
| | Pasarela de pago (`pagos`) | `sections/PaymentsSettings.tsx` | Claves de Stripe y prueba de conexión | No (simulado) |
| Pagos al equipo | Comisiones (`comisiones`) | `sections/CommissionSettings.tsx` | Qué se descuenta antes de comisionar | No verificado en Nómina |
| | Ciclo de nómina (`nomina`) | `sections/PayrollCycleSettings.tsx` | Semanal, quincenal o mensual y día de inicio | **No**: Nómina no lo lee |
| Cuenta | Mis preferencias (`preferencias`) | `sections/PersonalSettings.tsx` + `personalPreferences.ts` | Formato de hora propio | Se guarda en `localStorage`, no en el servidor |
| | Inicio de sesión (`inicio-sesion`) | `sections/LoginSettings.tsx` | SMS y correo de respaldo verificado | Sí (`features/auth`) |
| | Agendamiento online (`agendamiento-online`) | ruta propia `/reservar` | Vista previa de la reserva | — |
| | Permisos por rol (`permisos`) | `sections/RolePermissionsSettings.tsx` | Matriz de fábrica, **solo consulta** | Se edita por persona en Equipo |
| | Plan y facturación (`facturacion`) | `sections/BillingSettings.tsx` | Plan, datos de factura, tarjeta (últimos 4), facturas | Cambiar de plan o de tarjeta y descargar el PDF: **no existe** (solo un aviso) |
| | Eliminar cuenta / mi usuario (`eliminar-cuenta`) | `sections/DeleteAccountSettings.tsx` | Confirmación con texto | Sí |

Lo que **no existe** como ajuste: integraciones (Google, Instagram, WhatsApp, Meta, contabilidad), plantillas de
mensajes, factura electrónica, horario por sucursal o por día de la semana, puesta en marcha, importación,
exportación, registro de cambios, dominio propio, idioma de la cuenta y API o webhooks.

---

## 2. Análisis del módulo

### 2.1 Fortalezas

1. **Una sola fuente de verdad.** `settingsCatalog.ts` define cada ajuste y quién lo ve. El menú, la pantalla y
   ⌘K salen de ahí. Añadir un ajuste es un cuerpo en `sections/` más una línea.
2. **Permisos pensados ajuste por ajuste.** El dinero y el contrato solo los edita el dueño; recepción consulta lo
   que necesita para atender; el barbero ve lo suyo. El modo de consulta deshabilita el formulario entero con un
   `fieldset`. Esto es mejor que la mayoría de la competencia, donde los permisos suelen ser del módulo y no del
   ajuste.
3. **Formularios honestos.** La barra de guardar solo aparece con cambios. Las claves secretas nunca vuelven del
   servidor (`secretKeySet`, `hasAuthKey`). El servidor valida otra vez (URLs, horario, rangos).
4. **Reservas online muy completas para el segmento**: precio por demanda, anticipo según el riesgo del cliente,
   fidelidad, paquetes y una política con variables que se rellena sola (`<<time_for_cancel>>`). Fresha cobra
   protección por perfil de cliente de forma parecida (clientes nuevos o con inasistencias previas).
5. **Encontrable.** Hay tres entradas: el menú de la cabecera, la pantalla índice con una línea de ayuda por ajuste
   y ⌘K, que busca por rótulo con la ruta «Configuración › grupo › ajuste».

### 2.2 Huecos funcionales

- **Sucursales desconectadas.** La cabecera usa `BRANCHES` (cuatro sucursales fijas, `src/features/branches/branches.ts`).
  Una sucursal creada en Configuración no aparece en el selector. Para un producto multisucursal es el hueco más
  grave del módulo.
- **Toda la configuración es de la empresa.** Solo los cierres se asignan por sucursal. El texto de ayuda de festivos
  dice «Cada sucursal puede ajustarlo en su configuración», pero la ficha de sucursal no tiene horario ni festivos.
  El horario es **una sola franja** para toda la semana y todas las sedes.
- **Avisos sin efecto.** El catálogo tiene correo, push y SMS, pero no WhatsApp. Los recordatorios reales de la
  reserva son WhatsApp a 24 h y 2 h, fijos en código. El umbral «minutos antes» del barbero no se usa.
- **No hay plantillas.** El único texto que se edita es la política de cancelación. Los mensajes de confirmación,
  recordatorio, reprogramación y cumpleaños no se pueden ver ni editar.
- **Impuestos duplicados.** Hay grupos de impuestos en Configuración y un `taxRate` libre en cada servicio y
  producto. No hay un «impuesto por defecto» ni una relación entre los dos.
- **Pagos simulados y solo con Stripe.** No hay Wompi, Bold, Mercado Pago, PayU ni ePayco, ni PSE o Nequi.
- **Plan y facturación de solo lectura.** No se puede cambiar de plan, cambiar la tarjeta ni descargar facturas.
- **Preferencias personales en el navegador.** Se pierden al cambiar de dispositivo.
- **No hay registro de cambios.** Nadie sabe quién subió el recargo por tarjeta ni cuándo.
- **No hay exportación.** «Eliminar cuenta» existe, pero «descargar mis datos» no (Clientes sí tiene `downloadCsv`).

### 2.3 Deuda técnica

- El catálogo vive en tres sitios: ids en `settingsCatalog.ts`, cuerpos en `SETTINGS_BODIES` y tipos de sección en
  `settingsTypes.ts`. Un test que compruebe que cada id del catálogo tiene cuerpo evitaría desajustes.
- La simulación lee los ajustes con conversiones `as unknown as` (`mocks/booking/logic.ts`): el contrato no está
  tipado de punta a punta.
- `CURRENCIES` y `TIMEZONES` están escritos a mano y mezclan EE. UU. con dos zonas de LatAm. `HOLIDAYS` solo trae
  festivos de EE. UU.
- No hay e2e de Configuración. Los 25 tests unitarios cubren formularios, pero no la propagación (por ejemplo,
  «cambio la propina por defecto y el cobro la refleja»).

### 2.4 UX: encontrar los ajustes y empezar

- **Nombres que se pisan.** «Reservas online» (reglas) y «Agendamiento online» (vitrina) están en grupos distintos y
  suenan igual. «Horarios y cierres» no contiene el horario: el horario está en «Perfil del negocio».
- **⌘K busca por rótulo, no por campo.** Si alguien escribe «cancelación», «anticipo» o «festivos», no encuentra
  nada, porque viven dentro de un ajuste que se llama de otra forma.
- **No hay estado de configuración.** El índice no dice qué está a medias (pasarela sin conectar, sin logo, sin
  impuestos). La pasarela muestra «No conectada» solo cuando se entra.
- **Empezar es leer 20 pantallas.** No hay orden recomendado, ni un mínimo para abrir la reserva, ni valores por país.
  Una barbería nueva en Medellín empieza con festivos de EE. UU. y una pasarela que no puede usar.

### 2.5 Mercado: lo que dice el código

El código está pensado para hispanohablantes, pero calibrado para EE. UU.:

- Locale por defecto `es` → `es-CO` (`src/i18n/locales.ts`). Hay COP en monedas y `America/Bogota` en zonas.
- La demostración es Boston: USD, LLC, EIN `12-3456789`, festivos de EE. UU. (MLK, Memorial Day, Thanksgiving),
  Stripe y datáfonos con «TPN».

**Conclusión:** el público real parece doble: barberías latinas en EE. UU. y barberías en Colombia y LatAm.
Configuración tiene que funcionar por país, con un paquete de valores por defecto (moneda, zona, festivos,
pasarelas, impuestos e identificación fiscal), en lugar de tener EE. UU. de serie.

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto, M medio, B bajo. Esfuerzo: S unos días, M una o dos semanas, L más de un mes o con un tercero.

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | **Conectar las sucursales** de Configuración al selector de la cabecera y a todo lo que filtra por sede | Hoy son dos listas; un dueño que crea una sede no la ve | A | M |
| **P0** | **Paquete por país** (Colombia, México, EE. UU.): moneda, zona, festivos con la Ley Emiliani, formato del NIT o RFC y pasarelas disponibles | Una barbería colombiana arranca con festivos y una pasarela de EE. UU. | A | M |
| **P0** | **Pasarelas locales**: Wompi, Bold, Mercado Pago o ePayco además de Stripe, con PSE, Nequi o Bre-B | Stripe no lista a Colombia entre sus países; sin cobro en línea no hay anticipos | A | L |
| **P0** | **Puesta en marcha guiada**: una lista de 6 a 8 pasos en el inicio, con progreso (datos y marca → sucursal y horario → servicios → equipo → pagos → política → reserva publicada) | Shopify, Toast y Vagaro la tienen; hoy hay 20 pantallas sin orden | A | M |
| **P0** | **WhatsApp como canal** en Recordatorios y avisos, conectado a los recordatorios reales (horas configurables, hasta 3) | Es el canal de LatAm; hoy está fijo en código y no se configura | A | M |
| **P1** | **Plantillas de mensajes** con variables (confirmación, recordatorio, reprogramación, cancelación, inasistencia, cumpleaños, reseña) y vista previa | Solo se edita la política de cancelación | A | M |
| **P1** | **Horario por sucursal y por día** (franjas partidas, festivos por sede) | Cumple lo que promete el texto de ayuda; es necesario con varias sedes | A | M |
| **P1** | **Importar desde otro sistema** (clientes, servicios, productos, equipo y tarjetas regalo) por CSV o Excel, con mapeo de columnas | Boulevard, Mangomint y Vagaro lo venden como servicio; es la barrera para cambiarse | A | M |
| **P1** | **Registro de cambios** (quién, qué, antes → después, cuándo) por ajuste y global | Stripe guarda la actividad del equipo 180 días; con varios administradores es imprescindible | M | M |
| **P1** | **Integraciones**: Reserva con Google (Google Business Profile), botón de Instagram y Facebook, WhatsApp Business | Booksy pone «Reservar» en el perfil de Google; aquí solo hay campos de URL | A | L |
| **P1** | **Factura electrónica DIAN** a través de un proveedor (Siigo, Alegra u otro) y resolución de numeración en Datos legales | En Colombia la peluquería y el régimen simple tienen que facturar electrónicamente | A | L |
| **P1** | **Impuesto por defecto** que heredan servicios y productos | Quita la duplicación y los errores de cobro | M | S |
| **P1** | **Plan y facturación de autoservicio**: cambiar de plan, cambiar la tarjeta, descargar el PDF y ver el consumo de mensajes | Hoy hay que escribir a soporte | M | M |
| **P1** | **Búsqueda por campo** en ⌘K («cancelación» → Reservas online › Cancelación) | Lo más barato para encontrar ajustes | M | S |
| **P2** | **Exportar todo** (CSV o ZIP por entidad) antes de eliminar la cuenta | Confianza y la Ley 1581 de habeas data | M | S |
| **P2** | **Estado de salud** en el índice: insignias «Sin conectar» o «Incompleto» por ajuste | Hace visibles los ajustes a medias | M | S |
| **P2** | **Ajustes por sucursal que heredan de la empresa** (propinas, recargo, política y avisos) con «usar el de la empresa» | Cadenas con sedes de precios distintos | M | L |
| **P2** | **Preferencias en el servidor** (`/me/preferences`) | Se pierden al cambiar de equipo | B | S |
| **P2** | **Ciclo de nómina conectado** a Nómina | El ajuste hoy no hace nada | M | S |
| **P2** | **Contabilidad**: exportar a Siigo, Alegra o QuickBooks | Cierre del mes sin Excel | M | L |
| **P2** | **Dominio propio** para la reserva y el subdominio de la marca | Marca y SEO | B | M |
| **P2** | **Renombrar** «Agendamiento online» → «Tu página de reservas» y llevar el horario a «Horarios y cierres» | Nombres que no se pisan | M | S |

---

## 4. Benchmark

### 4.1 Tabla de funciones por competidor

✓ = documentado por el proveedor · ~ = parcial o sin poder confirmarlo del todo · ✗ = no lo ofrece o no se encontró ·
? = sin dato. Solo se marca lo que se pudo leer en las fuentes; el resto queda en «?».

| Función | Barberlytics | Fresha | Booksy | Vagaro | Boulevard | Mangomint | Square | Zenoti | AgendaPro | Shopify | Toast |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lista de puesta en marcha | ✗ | ? | ? | ✓ QuickStart por pasos | ~ con especialista | ~ con gestor | ? | ? | ? | ✓ guía en Inicio | ✓ checklist en Toast Web |
| Migración desde otro sistema | ✗ | ? | ? | ~ (3–5 días, según terceros) | ✓ especialista | ✓ gratis | ~ CSV de clientes | ? | ? (en sus preguntas frecuentes) | ✓ | — |
| Política de cancelación e inasistencia | ✓ | ✓ por segmento | ? | ? | ? | ? | ? | ? | ? | — | — |
| Anticipo o tarjeta en garantía | ✓ anticipo | ✓ ambos | ? | ? | ? | ? | ? | ? | ? | — | — |
| Recordatorios por WhatsApp | ~ fijo | ✓ hasta 3, WhatsApp o SMS | ? | ? | ? | ? | ? | ? | ✓ WhatsApp, SMS o correo | — | — |
| Plantillas de mensajes editables | ✗ | ~ (WhatsApp y SMS no se editan) | ? | ? | ? | ? | ? | ✓ IA redacta | ? | ✓ | ? |
| Reserva con Google | ✗ | ? | ✓ | ✓ Google y Apple Maps | ? | ? | ? | ? | ✗ (solo enlace) | — | — |
| Pasarela propia o integrada | ~ Stripe simulado | ✓ Fresha Payments | ? | ✓ VMS | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ |
| Permisos por ajuste | ✓ | ? | ? | ? | ? | ? | ? | ? | ? | ~ por sección | ? |
| Registro de cambios | ✗ | ✓ registro de mensajes | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| Asistente de IA | ✗ en ajustes (Clipper existe) | ? | ? | ? | ? | ? | ✓ Square AI | ✓ Zeenie | ~ «Agentes IA» | ✓ Sidekick | ? |
| Factura electrónica local | ✗ | — | — | — | — | — | — | — | ? | — | — |

### 4.2 Hallazgos

1. **La puesta en marcha guiada es lo normal.** Shopify muestra tareas de configuración en el Inicio mientras la
   tienda no está abierta, y métricas después de la primera venta. Toast pide empezar el checklist antes de la
   llamada inicial y define la salida a producción como el día en que se sale del modo de prueba. Vagaro ordena sus
   Ajustes en un recorrido: datos del negocio → empleados → reservas → lo que se vende → apariencia → complementos
   → marketing. **Barberlytics tiene todo el contenido de ese recorrido y le falta el orden.**
2. **La migración se vende como servicio.** Boulevard pone un especialista y migra tarjetas guardadas y membresías.
   Mangomint la incluye gratis: clientes, productos y tarjetas regalo en unas 24 h, y las citas futuras a mano.
   Square solo importa clientes por CSV y no importa citas. **Importar clientes y catálogo por CSV con mapeo
   cubre el 80 % y es alcanzable.**
3. **La protección contra inasistencias se configura por segmento.** Fresha aplica la política a clientes nuevos, a
   quienes ya faltaron o por encima de un monto. Barberlytics ya tiene «clientes nuevos» y «tras N inasistencias»;
   le falta el umbral por monto y mostrar cuánto se protegió.
4. **WhatsApp tiene costo y reglas.** Fresha envía hasta tres recordatorios, prueba WhatsApp y si falla manda SMS, y
   descuenta de un saldo de mensajes con un cupo mensual gratis. Sus textos de WhatsApp y SMS **no se editan**.
   Desde el 1 de julio de 2025 Meta cobra por mensaje de plantilla entregado, según categoría y país, y las
   plantillas de utilidad dentro de la ventana de 24 h son gratis. **Configuración necesita un saldo o consumo de
   mensajes visible en Plan y facturación.**
5. **Google es un canal de reservas, no un enlace.** En Booksy, conectar el perfil de Google se hace desde la app.
   Exige que nombre, dirección y teléfono coincidan con Google, que la confirmación sea automática y que el servicio
   no pida tarjeta para reservar. Esas reglas chocan con el anticipo: hay que avisarlo en la propia pantalla.
6. **El asistente pasa a estar dentro del panel.** Shopify Sidekick rellena formularios del panel y crea productos
   o descuentos, pero solo propone y el comerciante aprueba. Square AI (beta abierta en EE. UU. desde junio de 2025)
   responde sobre ventas, clientes y equipo, y explica paso a paso cómo hacer cosas en Square. Zenoti tiene Zeenie
   para navegar, redactar campañas y crear informes.
7. **En LatAm el diferencial es local.** AgendaPro Colombia promete recordatorios por WhatsApp de 0 a 3 días antes y
   una doble confirmación, pero no describe integración con Google ni factura electrónica. Ninguno de los grandes
   internacionales trae factura DIAN. **Es un hueco que un producto colombiano puede ocupar.**

---

## 5. Mercado y tendencias

- **Pagos en Colombia.** Stripe solo lista Brasil y México en LatAm. El mercado local se reparte entre Wompi
  (Bancolombia; según Valora Analitik procesó $25 billones en 2024), ePayco (comprada por Davivienda en 2024 e
  integrada con Bre-B en 2025), Bold, Mercado Pago y PayU. Las comisiones que publican guías comerciales rondan el
  2,7–3 % más un fijo en pesos; hay que verificarlas con cada proveedor. **Bre-B** (pagos inmediatos
  interoperables) y **PSE** pesan más que la tarjeta en muchas barberías.
- **Factura electrónica obligatoria.** Según Siigo y la prensa colombiana, el régimen simple y negocios como las
  peluquerías tienen que facturar electrónicamente. La norma vigente que citan es la Resolución DIAN 000165 de 2023.
  Configuración tendrá que guardar la resolución de numeración, el prefijo y el proveedor.
- **WhatsApp primero.** En LatAm el recordatorio es por WhatsApp. El cambio de precios de Meta (por mensaje desde
  julio de 2025) hace que convenga agrupar confirmación y recordatorio y aprovechar la ventana gratis de 24 h cuando
  el cliente responde.
- **IA que configura en vez de explicar.** 2025–2026 pasó de asistentes que responden (Square AI) a asistentes que
  rellenan pantallas con aprobación (Sidekick) y constructores que arman todo desde una conversación (Wix AI
  Website Builder; Squarespace Blueprint, que pregunta por objetivo, personalidad de marca y sector, y devuelve
  diseño, paleta y textos).
- **La migración como arma comercial.** Mangomint, Boulevard y Zenoti publican guías para «cambiarse desde X». Lo que
  decide un cambio de software es cuánto cuesta llevarse los datos.
- **Gobierno y confianza.** Registro de actividad (Stripe: 180 días), permisos granulares y exportación son cada vez
  más un requisito de cadenas y franquicias, no un extra.

---

## 6. IA

### 6.1 Casos

| Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos necesarios — ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| **Puesta en marcha por conversación** | El dueño cuenta su negocio («2 sedes en Envigado, 6 barberos, corte $35.000, abro de 9 a 8, cierro domingos») y el asistente propone la configuración para aprobarla | Wix AI Website Builder (preguntas y luego sitio con funciones de negocio); Squarespace Blueprint; Shopify Sidekick rellena formularios y espera aprobación | Clipper ya existe (`src/lib/chat`); haría falta darle herramientas que escriban en `/settings` y en las listas, en modo borrador | Esquemas Zod de cada ajuste: **sí**. Valores por país: **no** | Agéntica + conversacional | M | Valores erróneos de dinero (impuestos, recargo); por eso siempre con vista previa y «Aplicar» por bloque, nunca de forma automática |
| **Importación asistida** | Sube un CSV, un Excel o **capturas** del sistema anterior; la IA mapea las columnas, normaliza los teléfonos (+57), detecta duplicados y sugiere categorías | Flatfile (mapeo automático con aprendizaje; el 90–95 % que anuncia es una cifra del proveedor); Mangomint y Boulevard lo hacen con personas | Clientes, servicios con duración y precio, equipo y tarjetas regalo. Las capturas sirven cuando el sistema anterior no exporta | Esquemas de destino: **sí**. Ejemplos de exportaciones de Booksy, AgendaPro y Fresha: **no** (hay que reunirlos) | Generativa (visión + extracción) | M | Datos personales (habeas data); errores silenciosos al mapear → informe de filas rechazadas y deshacer |
| **Redacción de políticas y mensajes** | Escribe la política de cancelación, los textos de recordatorio y la bio de la sede en el tono de la barbería, con las variables correctas | Zenoti Zeenie redacta SMS, correos y campañas; Shopify Magic sugiere respuestas a partir de las políticas de la tienda | Política con `<<time_for_cancel>>`; plantillas de WhatsApp que luego aprueba Meta; descripción de la sucursal | Política y variables: **sí** (`bookingUtils.ts`). Plantillas: **no existen todavía** | Generativa | S | Prometer algo que la configuración no hace (por ejemplo, «reembolso total»); validar contra los valores reales |
| **Auditoría de configuración** («tu política te cuesta X») | Cruza ajustes con datos: inasistencias sin anticipo, recargo que baja la conversión, propina por defecto, huecos del horario con demanda | Square AI y Zeenie analizan el negocio; ninguno documentado lo enfoca en ajustes | «El 14 % de las citas de clientes nuevos terminan en inasistencia; con un anticipo del 30 % habrías retenido unos $X el mes pasado» | Citas, estados, inasistencias, embudo de reserva (`/booking/funnel`), cobros: **sí en la simulación** | Predictiva + generativa | M | Causalidad dudosa; decir siempre que es una estimación y con qué datos se calculó |
| **Buscar ajustes en lenguaje natural** | «¿Dónde cambio cuánto cobro si cancelan tarde?» → abre Reservas online › Cancelación con el campo resaltado | Stripe tiene un asistente en el panel que responde con su documentación y hace acciones; Linear tiene menú de comandos ⌘K | Ampliar ⌘K con un índice de campos y sinónimos; la IA solo cuando no hay coincidencia | Rótulos y ayudas en `es.ts`: **sí** | Conversacional (recuperación) | S | Bajo; mandar a un ajuste que el rol no puede ver (filtrar por `settingsLevel`) |
| **Marca desde el logo** | Saca la paleta del logo y propone el tema (de los 14) y los colores de la reserva | Canva propone una paleta al subir un logo al Brand Kit (avisa que puede no ser exacta); Brand Kit Builder la saca de una web o un PDF | Al subir el isologo en Identidad: proponer tema y acento con contraste AA comprobado | Logo: **sí**. Temas: **sí** (`src/themes`) | Generativa / visión (o algoritmo sin IA) | S | Contraste insuficiente; validar con los tokens del sistema |
| **Revisión antes de publicar** | Antes de abrir la reserva comprueba incoherencias: anticipo con Reserva con Google, horario que no cubre a los barberos, impuestos en 0 | Las guías de Shopify y Toast hacen esto con listas, no con IA | Una lista de reglas deterministas con explicación generada | Ajustes + horarios del equipo: **sí** | Predictiva (reglas) + generativa | S | Falsos positivos que molesten |
| **Agente de cambios en lote** | «Sube 5 % todos los servicios de barba en la sede Laureles a partir del 1 de noviembre» | Sidekick crea y edita productos y descuentos con aprobación | Catálogo, propinas, cierres masivos (festivos del año) | Catálogo y listas: **sí** | Agéntica | M | Cambios de precio no deseados; diferencia antes/después obligatoria y registro de cambios |

### 6.2 Top 5 apuestas

1. **Clipper configura la barbería (puesta en marcha conversacional con aprobación).** Combina la lista de puesta en
   marcha (P0) con el chat que ya existe. Cada paso se puede rellenar a mano o pidiéndoselo a Clipper. Clipper
   devuelve un borrador que se muestra con la diferencia y el botón «Aplicar». Así funcionan Sidekick y Blueprint.
2. **Importar sin dolor.** CSV o Excel con mapeo automático y, como diferencial, capturas de pantalla del sistema
   anterior. Es la barrera comercial número uno para cambiarse de AgendaPro o Booksy.
3. **Auditoría con cifras propias.** Una tarjeta en Reservas online y en el índice: «Tu política de cancelación»,
   «Tu anticipo», «Tu recargo por tarjeta», cada una con lo que cuesta o lo que se gana según las citas reales. Es
   «lytics» aplicado a la configuración y nadie del sector lo documenta.
4. **Redactor de políticas y plantillas.** Barato y de uso inmediato. Va de la mano de las plantillas de WhatsApp
   (P1) y del límite de que los textos tengan que coincidir con los valores configurados.
5. **Búsqueda de ajustes en lenguaje natural.** Primero un índice de campos en ⌘K, sin IA (S); después una
   respuesta de Clipper que abre el ajuste con el campo resaltado. Resuelve el problema de nombres y es poco
   arriesgada.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Que lo configurado mande (4–6 semanas)

- Sucursales de Configuración → selector de la cabecera y filtros (sustituir `BRANCHES`).
- Paquete por país (CO, MX, US): festivos colombianos con la Ley Emiliani, COP, `America/Bogota`, NIT con dígito de
  verificación y pasarelas disponibles.
- WhatsApp como canal en Recordatorios y avisos, conectado a `mocks/booking/reminders.ts` (horas configurables).
- Impuesto por defecto heredado por servicios y productos; ciclo de nómina leído por Nómina.
- ⌘K busca por campo; renombrar «Agendamiento online» y llevar el horario a «Horarios y cierres».
- Insignias de estado en el índice (sin conectar, incompleto).
- Pruebas e2e de propagación (propina, recargo, cierre y sucursal).

### Fase 2 — Empezar y cambiarse (6–10 semanas)

- Lista de puesta en marcha en el inicio del dueño, con progreso y «Publicar mi reserva» al final.
- Importación por CSV o Excel con mapeo asistido (clientes, servicios, productos, equipo).
- Plantillas de mensajes con variables, vista previa y redactor con IA.
- Horario por sucursal y por día; festivos por sede.
- Registro de cambios por ajuste y global (quién, antes → después).
- Pasarela local (empezar por una: Wompi o Bold) junto a Stripe, con PSE y Nequi.
- Plan y facturación de autoservicio, con consumo de mensajes.

### Fase 3 — Integraciones e IA que actúa (trimestre siguiente)

- Reserva con Google y botón de reserva en Instagram y Facebook; WhatsApp Business oficial.
- Factura electrónica DIAN con un proveedor habilitado; exportación a contabilidad.
- Clipper configura: puesta en marcha conversacional con borradores aprobables y cambios en lote.
- Auditoría de configuración con cifras (inasistencias, anticipo, recargo, horario frente a demanda).
- Importación desde capturas; exportación completa antes de eliminar la cuenta; ajustes por sucursal que heredan de
  la empresa.

---

## Fuentes

Código y notas: `src/features/settings/**`, `src/features/branding/**`, `src/features/branches/branches.ts`,
`src/features/sections/**`, `src/mocks/settings/**`, `src/mocks/booking/{logic,reminders}.ts`,
`src/i18n/locales.ts`, `ai-tools/CODEMAP.md`, `docs/roles/05-configuracion.md` y las notas de memoria del proyecto.

Páginas web consultadas (leídas directamente o a través de los resultados del buscador, el 2026-10-17):

- Shopify Sidekick, funciones: https://help.shopify.com/en/manual/shopify-admin/productivity-tools/sidekick/features
- Shopify, Inicio del panel: https://help.shopify.com/en/manual/shopify-admin/shopify-home
- Shopify, lista general de puesta en marcha: https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/new-to-shopify-checklists/general-checklist
- Stripe, países: https://stripe.com/global
- Stripe, equipo e historial de seguridad: https://docs.stripe.com/dashboard/teams
- Stripe, búsqueda en el panel: https://support.stripe.com/questions/how-do-i-perform-searches-in-the-dashboard
- Stripe, asistente del panel: https://edge-docs.stripe.com/assistant
- Fresha, políticas de pago: https://www.fresha.com/help-center/knowledge-base/payments/101660-set-up-payment-policies
- Fresha, cargos por inasistencia y cancelación: https://www.fresha.com/help-center/knowledge-base/payments/617-charge-no-show-and-cancellation-fees
- Fresha, recordatorios: https://www.fresha.com/help-center/knowledge-base/calendar/167-send-appointment-reminders
- Fresha, mensajes automáticos: https://www.fresha.com/help-center/knowledge-base/marketing/104002-update-automated-messages
- Fresha, precios: https://www.fresha.com/pricing
- Booksy, Reserva con Google: https://biz.booksy.com/blog/reserve-with-google-faq-everything-you-need-to-know-about-bookings-with-google-and-booksy
- Vagaro, QuickStart: https://www.vagaro.com/learn/the-quickstart-guide-to-vagaro
- Boulevard, migración de datos: https://joinblvd.com/features/data-migration
- Mangomint, cambiarse a Mangomint: https://mangomint.com/learn/switching-to-mangomint
- Mangomint, importar datos: https://www.mangomint.com/learn/import-your-data
- Square, importar clientes (comunidad): https://community.squareup.com/t5/Archived-Discussions-Read-Only/How-do-I-import-my-existing-clients-into-Square-s-Appointment/td-p/38970
- Square AI, beta abierta: https://squareup.com/us/en/press/square-ai-open-beta
- Square AI, nuevas capacidades: https://squareup.com/us/en/press/square-releases-ai
- Zenoti, funciones de IA: https://www.zenoti.com/press/zenoti-unveils-groundbreaking-ai-features-to-transform-salons-spas-med-spas-and-gyms
- AgendaPro Colombia, barberías: https://agendapro.com/co/barberia/software-para-barberias
- Toast, guía de puesta en marcha: https://support.toasttab.com/en/article/Remote-Onsite-Onboarding-Guide
- Toast, guía de autoservicio: https://support.toasttab.com/en/article/Self-Service-Guide
- Wix AI Website Builder (reseña): https://www.websitebuilderexpert.com/website-builders/how-use-wix-ai/
- Wix AI Website Builder (lanzamiento): https://www.cmswire.com/the-wire/wix-delivers-the-next-generation-of-web-creation-with-the-release-of-the-ai-website-builder/
- Squarespace Blueprint AI: https://variety.com/2025/shopping/news/squarespace-website-building-blueprint-ai-sign-up-1236380181
- Flatfile, mapeo: https://flatfile.com/product/mapping/
- Canva Brand Kit Builder: https://www.canva.com/help/brand-kit-builder/
- Linear, navegación: https://linear.app/enablement/guide/navigating-linear
- Meta, precios de la plataforma de WhatsApp Business: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Siigo, quiénes tienen que facturar electrónicamente: https://www.siigo.com/blog/quienes-estan-obligados-facturar-electronicamente
- Siigo, factura en el régimen simple: https://www.siigo.com/blog/obligaciones-fiscales/factura-regimen-simple/
- El Heraldo, empresas que tienen que expedir factura electrónica: https://www.elheraldo.co/economia/2024/06/24/la-facturacion-electronica-conozca-las-empresas-que-tienen-que-expedirla-1104775/
- Tiendanube, pasarelas de pago en Colombia: https://www.tiendanube.com/co/blog/pasarelas-de-pago-colombia/
- Valora Analitik, Wompi en 2024: https://www.valoraanalitik.com/wompi-cerro-el-2024-con-25-billones-procesados-a-traves-de-su-plataforma-esto-viene-para-2025/
- La República, ePayco: https://www.larepublica.co/epayco
