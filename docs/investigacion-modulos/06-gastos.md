# Gastos — investigación

Investigación del 2026-10-17 sobre el módulo `/gastos` (`src/features/expenses`). Revisé el código, el contrato, la
memoria del proyecto y fuentes públicas de competidores y referentes. Cuando un competidor aparece con «no encontrado»,
quiere decir que su documentación pública no muestra la función. No es prueba de que no exista.

## Resumen ejecutivo

- Gastos es hoy una **libreta bien hecha**. Registra fijos y variables, lleva cada fijo a «por mes» y muestra el costo del mes. Le faltan **categorías, fecha, comprobante, proveedor y método de pago**.
- Hay una **deuda que bloquea**: la moneda está fija en USD (`useMoney`). La moneda configurada en la sucursal no se usa, y en Colombia las cifras saldrían mal.
- La tarjeta «Lo que cuesta este mes» dice que ese total es lo que hay que vender para no perder. **No es cierto**, porque no cuenta la nómina, las comisiones ni el costo de los productos.
- La gran oportunidad es el **estado de resultados**. Barberlytics ya tiene ingresos (Transacciones), nómina (Nómina) y costo de producto (`products.cost`). Ningún software de agenda de los revisados lo muestra.
- En el benchmark, las plataformas de agenda (Booksy, Fresha, Vagaro, Boulevard) no muestran un módulo de gastos. Zenoti, Phorest, Timely y Square solo tienen **caja menor** dentro de la caja registradora. Los gastos «de verdad» viven en QuickBooks, Xero, Alegra o Siigo.
- IA con más retorno: **foto → gasto** (OCR + LLM con confirmación), **categorías que aprenden por proveedor**, **captura por WhatsApp**, **alertas de duplicados y atípicos** y un **CFO conversacional** sobre el chat que ya existe.
- Colombia: el **documento soporte** de la DIAN (Res. 000167 de 2021) es lo que hace deducible una compra a un proveedor informal. Conviene resolverlo con una integración (Alegra o Siigo) y no construirlo.

---

## 1. Qué tiene hoy

**Mercado, según el código.** El idioma es español con formato `es-CO` (`src/app/layouts/AppLayout.tsx:145`). El login de
demo usa un celular colombiano (3001234567) y las métricas formatean con `es-CO` (`src/mocks/metrics.ts:196`). Pero el
seed de sucursales es de **EE. UU.**: Boston, Charlotte, Providence y Salt Lake City, todas con `currency: "USD"` y
`language: "es"` (`src/mocks/settings/seed.ts:87-90`). Los gastos de demo usan esa dirección («88 Newbury St»,
`src/mocks/expenses/seed.ts:38`). Configuración ofrece `USD, COP, MXN, EUR` (`src/features/settings/settingsTypes.ts:138`)
y producción muestra rentas como «$4,534,534.00», una escala de pesos (`docs/roles/02-metricas-caja-nomina.md:225`).
Conclusión: el producto apunta a barberías **hispanohablantes**, Colombia y el mercado latino de EE. UU. El demo
está en dólares, pero la meta incluye COP, y por eso este documento trata la normativa DIAN.

**Inventario real:**

| Pieza | Qué hace | Archivo |
|---|---|---|
| Modelo | `expense = { id, branchId, ownerMemberId, kind: fixed\|variable, name, amount, frequency, description, createdAt }`. La frecuencia (semanal, quincenal, mensual, trimestral, semestral, anual) solo aplica a los fijos. Un variable usa `createdAt` como fecha. | `src/features/expenses/types.ts` |
| «Por mes» | `monthlyEquivalent`: valor × pagos al año ÷ 12. Una semana pesa ×4,33. | `src/features/expenses/expensesUtils.ts:18` |
| Resumen | `summarizeExpenses`: fijos por mes, fijos por año, variables del mes y del mes anterior, total del mes y % fijo. | `expensesUtils.ts:45` |
| Pantalla | `PageHeader`, tres `MetricCard` (total con `MetricRing` del % fijo, fijos/mes, variables del mes), `ThemaTabs` Todos/Fijos/Variables con conteos y filtro en la URL (`?tipo=`), y `DataListBlock` con búsqueda, paginación de 10, selección y vista de lista en móvil. | `src/features/expenses/ExpensesPage.tsx` |
| Columnas | Gasto (icono y descripción), Tipo, Frecuencia, Valor, Por mes, Registrado. | `src/features/expenses/expensesHome.tsx` |
| Alta y edición | `ExpenseFormDrawer`: tipo con `CardSelection` (solo al crear), nombre, valor (`NumberField` con prefijo «$» y 2 decimales), frecuencia con el equivalente mensual en vivo, y descripción. Valida con Zod y muestra errores 422 por campo. | `src/features/expenses/ExpenseFormDrawer.tsx` |
| Acciones | Registrar (pantalla), Editar y Borrar (una fila), en la barra flotante o en el layout. Borrar pide confirmación. | `ExpensesPage.tsx:116-123` |
| Roles | Dueño y admin ven los de la sucursal. El barbero de renta (`scope: "own"`) ve **solo los suyos** (`ownerMemberId`). Comisión y recepción no entran (`src/features/access/access.test.ts:23,44`). Crear, editar y borrar dependen de `expenses`·create/edit/delete. | `ExpensesPage.tsx:51-53`, `src/features/access/access.ts:127` |
| Sucursal | La lista es de la sucursal activa (`useBranchId`). No hay vista consolidada. | `ExpensesPage.tsx:49` |
| API | `GET /expenses?branchId&ownerMemberId?` (sin rango ni paginación), `POST`, `PATCH` (ignora `kind`) y `DELETE`. | `src/features/expenses/api.ts`, `src/mocks/expenses/handlers.ts`, `docs/API_CONTRACT.md:277-290` |
| Pruebas | Cuentas, pantalla, contrato y rol: 4 bloques. | `src/features/expenses/expenses.test.tsx` |

**Lo que no hay:** categorías, fecha elegible, comprobantes (producción permite hasta 3 fotos), proveedor, método de
pago o cuenta de origen, impuestos, quién registró, estado pagado/pendiente, vencimientos, presupuestos, exportar,
navegar meses anteriores, gráfica de tendencia y cruce con ingresos.

---

## 2. Análisis del módulo

### Fortalezas

1. **La cuenta que el dueño no hace a mano.** Sumar una renta mensual con un seguro anual y una limpieza semanal es el
   error típico de las hojas de cálculo. `monthlyEquivalent` lo resuelve, y el formulario muestra el equivalente
   mientras se escribe (`ExpenseFormDrawer.tsx:96`).
2. **Una lista y un solo botón.** Producción tiene dos pestañas, dos botones y dos páginas. Aquí el tipo va dentro del
   formulario y arranca según la pestaña que se mira (`createKind`, `ExpensesPage.tsx:112`).
3. **Privacidad por rol bien resuelta.** El barbero de renta tiene sus propios gastos (`ownerMemberId`). Así se cierra
   el fallo de producción, donde el barbero a comisión veía la renta del local (`docs/roles/02-metricas-caja-nomina.md:230`).
4. **Construido con piezas del sistema** (`DataListBlock`, `MetricCard`, `DrawerShell`, `EmptyState`). Los estados de
   carga, vacío y filtrado están cubiertos. El estado vacío explica el porqué («sabrás cuánto hay que vender…»).
5. **Contrato limpio y validado en los dos lados** (Zod en el front, `validate` en el mock).

### Huecos funcionales

- **Sin categorías.** No se puede responder «¿cuánto se va en insumos?». Es la pregunta número uno, y es el primer
  campo que ofrecen Zenoti (caja menor por categoría), Square Bill Pay (10 categorías fijas) y Alegra (categorías propias).
- **Sin fecha del gasto.** Un variable registrado el día 2 por una compra del 30 cae en el mes equivocado. Un fijo
  creado hoy cuenta entero en el mes aunque empiece el próximo, y no tiene fecha de inicio ni de fin.
- **Sin comprobante.** Es una regresión frente a producción (0/3 fotos). Además, sin soporte el gasto no sirve al
  contador.
- **Sin historia.** Editar el valor de la renta reescribe todos los meses pasados. No se puede construir un P&L
  histórico fiable sobre este modelo.
- **Solo el mes en curso.** El resumen mira `new Date()`, y no hay navegador de periodo ni tendencia.
- **Sin conexión con el resto.** Gastos no lee Transacciones (ingresos), Nómina (comisiones, salarios, renta cobrada)
  ni Productos (`cost`, `distributor`). Los datos para un estado de resultados ya existen, pero están en módulos
  separados.

### Deuda técnica

| Deuda | Dónde | Riesgo |
|---|---|---|
| Moneda fija `USD` | `src/features/calendar/calendarFormat.ts:15` (`useMoney`) | Una sucursal en COP ve «US$». El `NumberField` usa prefijo «$» y 2 decimales, algo raro en pesos. |
| Mes calculado en la hora del navegador | `expensesUtils.ts:23` (`sameMonth`) | Las sucursales tienen zona horaria (`America/Denver`…), pero el corte de mes usa la del dispositivo. |
| `GET` sin rango ni paginación | `docs/API_CONTRACT.md:285` | Los variables crecen sin límite. Con 2 o 3 años de uso, la lista entera viaja en cada carga. |
| `createdAt` hace de fecha del gasto | `types.ts:26` | Se mezclan auditoría y negocio. Hace falta `date` aparte de `createdAt`. |
| Sin `createdBy` | Contrato | No se sabe quién registró. Ya figura en el inventario de roles (`docs/roles/02…:257`). |
| Seed de EE. UU. con montos en dólares | `src/mocks/expenses/seed.ts` | El demo no representa a la barbería colombiana: ni montos en COP ni categorías locales (arriendo, administración, servicios públicos). |
| Mensaje de equilibrio incorrecto | i18n `expenses.summary.monthTotalHint` | Promete un punto de equilibrio que no calcula. |
| Barra de acciones fuera del test de página | Memoria del módulo | Editar y Borrar desde la barra no tienen prueba de integración. |

### UX

- **Bien:** jerarquía clara (tres cifras arriba y la lista abajo). El anillo del % fijo comunica rigidez de costos. En
  móvil, la lista muestra «Semanal · $520/mes», que es la información útil.
- **Mejorable:**
  1. Sin permiso de edición, el nombre parece un enlace pero no hace nada (`onOpen` devuelve `false`). Debería abrir una
     ficha de solo lectura, como en producción.
  2. Borrar un fijo borra su pasado. Lo correcto sería «terminar» el gasto con fecha de fin.
  3. No hay forma rápida de registrar en el mostrador (foto y valor). El formulario completo es para la oficina.
  4. Los fijos no avisan «la renta vence el 1». Hoy el módulo informa pero no ayuda a pagar.
  5. La búsqueda solo mira nombre y descripción. Con categoría y proveedor, el filtro sería por chips (como pide la
     memoria del calendario: filtros como chips).

---

## 3. Qué le falta (priorizado)

Impacto: valor para el dueño de una barbería de 3 a 10 sillas. Esfuerzo: S ≤ 1 semana, M 1–3 semanas, L > 3 semanas
(front + contrato + mock).

| Prioridad | Qué | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | Moneda y formato de la sucursal (no `USD` fijo) | Sin esto, el módulo no sirve en Colombia | Alto | S |
| **P0** | Fecha del gasto (`date`) y, en los fijos, inicio, fin y día de pago | Cada gasto cae en el mes correcto, sin reescribir el pasado | Alto | S |
| **P0** | Categorías (catálogo por defecto + propias) | Base de presupuestos, P&L e IA. Por defecto: arriendo, servicios públicos, internet, insumos de barbería, productos para reventa, aseo y lavandería, mantenimiento, publicidad, software y comisiones de datáfono, impuestos y trámites, otros | Alto | S–M |
| **P0** | Comprobantes: hasta 3 fotos o PDF por gasto | Paridad con producción y soporte para el contador | Alto | M |
| **P0** | Navegar meses (`PeriodNavigator`) y `GET` con `from/to` | Ver el pasado y controlar el volumen | Alto | S–M |
| **P1** | **Estado de resultados (P&L) mensual por sucursal**: ingresos cobrados − costo de producto − comisiones y nómina − gastos = utilidad | La pregunta «¿cuánto me gané?» que ningún software de agenda revisado responde | Muy alto | M |
| **P1** | **Punto de equilibrio** real: costos fijos ÷ margen de contribución, expresado en servicios o en dinero por día | Sustituye el mensaje incorrecto actual | Alto | S (tras el P&L) |
| **P1** | Método de pago y origen (caja, cuenta bancaria, tarjeta, Nequi/Daviplata) | Necesario para cuadrar caja y banco | Medio-alto | S |
| **P1** | Cuentas por pagar: los fijos generan vencimientos, se marcan «pagado» y avisan antes | Pasa de registro a herramienta de gestión | Alto | M |
| **P1** | Caja menor ligada al cierre de caja: «saqué $20.000 para café» desde el mostrador | Es lo que Zenoti, Phorest, Timely y Square sí tienen | Alto | M–L (hoy no existe sesión de caja) |
| **P1** | Proveedores (nombre, NIT, contacto), autocompletado y unión con `products.distributor` | Agrupar gasto por proveedor, insumo para IA y documento soporte | Medio | M |
| **P1** | Exportar CSV/Excel del periodo con comprobantes | Lo que pide el contador. Booksy recomienda exportar a QuickBooks/Xero | Medio | S |
| **P1** | `createdBy` y registro de cambios | Confianza entre dueño y administrador | Medio | S |
| **P2** | Presupuesto por categoría con alerta al 80 % y al 100 % | Control proactivo | Medio | M |
| **P2** | Rentabilidad por sucursal y por silla: renta cobrada o ventas por silla − comisión − parte proporcional de fijos | Decidir sillas de renta vs. comisión y abrir o cerrar sucursales | Alto | M–L |
| **P2** | Impuestos: IVA descontable, retenciones practicadas y gasto deducible sí/no | Formalidad en Colombia. Requiere validación con contador | Alto (formales) | L |
| **P2** | Documento soporte DIAN para compras a no obligados a facturar (vía integración) | Hace deducible la compra informal | Alto (formales) | L |
| **P2** | Integración contable (Alegra, Siigo, QuickBooks, Xero) | No competir con el software contable, sino alimentarlo | Medio | L |
| **P2** | Vista consolidada de varias sucursales | Para el dueño de cadena | Medio | M |
| **P2** | Aprobación: el admin registra y el dueño aprueba por encima de un monto | Control en cadenas | Bajo-medio | M |

---

## 4. Benchmark

Leyenda: ✓ documentado · ~ parcial o limitado · ✗ no encontrado en documentación pública · — no aplica.

| Función | Booksy | Fresha | Square | Vagaro | Boulevard | Zenoti | Phorest | Timely | AgendaPro | QuickBooks | Xero | Wave | Expensify | Ramp | Brex | Dext | Alegra | Siigo | Treinta | Bold | **Barberlytics hoy** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Registro de gastos del negocio | ✗ | ✗ | ~ (Bill Pay) | ✗ | ✗ | ~ (caja menor) | ~ (caja menor) | ~ (caja menor) | ~ («egresos») | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Fijos/recurrentes con «por mes» | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ~ | ~ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ? | ✗ | ✗ | **✓** |
| Categorías | ✗ | ✗ | ✓ (10 en Bill Pay) | ✗ | ✗ | ✓ | ✗ (descripción) | ? | ? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Caja menor en la caja registradora | ✗ | ✗ | ✓ (Paid In/Out) | ✗ | ✗ | ✓ | ✓ | ✓ | ~ | — | — | — | — | — | — | — | ? | ? | ✗ | ✗ | ✗ |
| Comprobante (foto) | ✗ | ✗ | ✓ (por SMS) | ✗ | ✗ | ? | ✗ | ? | ? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ✗ | ✗ (prod. sí) |
| OCR / lectura automática | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ~ («llenado automático») | ? | ✗ | ✗ |
| Captura por mensaje (SMS/WhatsApp) | ✗ | ✗ | ✓ SMS | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ~ (correo) | ? | ✗ | ? | ? | ✓ SMS/WhatsApp | ~ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Duplicados / atípicos | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ? | ~ (JAX Assure) | ✗ | ? | ✓ | ✓ | ✓ | ~ (conciliador) | ? | ✗ | ✗ | ✗ |
| Proveedores | ✗ | ✗ | ✓ | ✗ | ✗ | ? | ✗ | ✗ | ? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| P&L / estado de resultados | ✗ | ✗ | ✗ (quejas en comunidad) | ✗ | ✗ | ? | ? | ✗ | ✗ | ✓ | ✓ | ✓ | — | — | — | — | ✓ | ✓ | ~ (balance) | ✗ | ✗ |
| Pronóstico de caja | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (90 días) | ~ | ✗ | ✗ | ? | ? | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Asistente IA conversacional | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Intuit Assist | ✓ JAX | ✗ | ~ | ✓ Ask Ramp | ? | ✗ | ✗ | ✓ («Agentes IA») | ✗ | ✗ | ✗ (hay chat en el producto) |
| Documento soporte DIAN | — | — | — | — | — | — | — | — | ✗ | — | — | — | — | — | — | — | ? | ✓ | ✗ | ✗ | ✗ |
| Gastos de renta separados de los del local | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | — | — | — | — | — | — | — | — | — | — | **✓** |

### Hallazgos

1. **El software de agenda no gestiona gastos.** No encontré módulo de gastos en Booksy, Fresha, Vagaro ni Boulevard.
   El blog de Booksy recomienda exportar reportes a QuickBooks o Xero, y lista el «P&L automático» como algo que
   un sistema integrado *debería* tener. Lo más parecido en Fresha es registrar como anticipo, en la nómina, el
   efectivo que cobró el personal.
2. **Lo que existe es caja menor.** Zenoti tiene asientos de «gasto» y «recibo» con **categorías** obligatorias, un
   origen «Business Cash» y un informe con saldo de apertura y cierre por caja. En 2018 anunció la sincronización con
   Xero. Phorest registra retiros y depósitos con descripción, y su informe «Petty Cash and Sundries» muestra quién lo
   hizo si hay PIN. Timely lo registra con la caja abierta y solo en la fecha del día. Square tiene Paid In/Out en el
   cajón, pero su resumen de ventas no los descuenta.
3. **Square es el que más se acerca**, y fuera de la agenda: con su tarjeta de débito se pueden adjuntar recibos
   respondiendo un SMS con la foto. Bill Pay tiene 10 categorías (arriendo, seguros, insumos, servicios…). Aun así,
   los usuarios piden P&L en su comunidad.
4. **En LatAm, AgendaPro** anuncia «ingresos y egresos en tiempo real», pero su página no detalla categorías,
   comprobantes ni cierre. **Treinta** registra ventas, gastos, proveedores y deudas, y es gratis. Es el competidor
   mental del dueño pequeño, que hoy usa cuaderno o Treinta. **Bold** cobra y factura (Bold POS con DIAN), pero no
   encontré gastos.
5. **Ventaja diferencial de Barberlytics:** es el único que tiene a la vez la agenda, las ventas cobradas, la nómina y
   comisiones, el costo de producto y los gastos. Con eso puede hacer el **P&L de la barbería sin contador** y el
   **punto de equilibrio en cortes por día**. También es el único que separa los gastos del barbero de renta.

---

## 5. Mercado y tendencias

### Estructura de costos de una barbería

Bookedin (blog, cifras «ilustrativas») separa **fijos** (arriendo, servicios e internet, seguros y licencias,
lavandería y aseo, software de agenda y POS) de **variables** (insumos como cuchillas, cuellos y desechables,
inventario de reventa, comisiones de datáfono, publicidad). En mano de obra distingue tres modelos: renta de silla
(ingreso para el dueño), comisión (costo variable) y salario (fijo). Sus rangos de **margen neto** son del 8–20 % en
barberías bien llevadas y de más del 20 % con renta de sillas, buen retail y pocos no-shows. Esa lista sirve como
**catálogo de categorías por defecto**, y la distinción por modelo de pago cuadra con lo que Nómina ya calcula
(comisión, renta y salario).

### Tendencias 2025-2026

- **De registrar a agentes.** Intuit lanzó Intuit Assist con un *Accounting Agent* que categoriza y concilia, aprende
  de categorizaciones anteriores y deja la aprobación al usuario. Xero presentó JAX el 3 de septiembre de 2025 como
  «superagente»: automatiza conciliaciones y captura de datos, da *insights* y usa un control de precisión llamado
  «JAX Assure». En enero de 2026, Ramp dejó disponible para todos su *Policy Agent*, que revisa recibos faltantes,
  **duplicados** o dudosos y patrones **atípicos**.
- **Captura sin formulario.** Brex pide la foto por **SMS o WhatsApp** después de cada compra y la casa con el gasto
  si coinciden dos de tres datos (fecha, monto, comercio). En LatAm hay bots de WhatsApp para gastos (Gasti en
  Argentina, rendiciones por WhatsApp en Buk, Chile). Las fuentes recomiendan **confirmación humana** antes de
  registrar lo leído por OCR.
- **Precisión real del OCR.** Dext anuncia el 99,9 %. Una prueba independiente con unos 400 recibos en 6 meses dio
  cerca del **95 %**, con fallos en recibos arrugados y papel térmico desvaído. En un país donde abundan las tirillas
  térmicas, este dato es relevante.
- **Inteligencia de precios con datos de red.** Ramp compara lo que pagas con datos anónimos de miles de clientes y
  advierte que pueden estar incompletos. Solo funciona con escala.

### Colombia: lo fiscal (validar con contador)

- **Documento soporte en adquisiciones a no obligados a facturar** (Res. DIAN 000167 de 2021, modificada por la 488 de
  2022). Lo genera el **comprador** y sirve para soportar **costos, deducciones e impuestos descontables** en la
  declaración de renta. Exige numeración autorizada, NIT de las dos partes, formato electrónico y CUDS. Según el
  Oficio DIAN 206 de 2024, las operaciones acumuladas con un mismo proveedor no pueden documentarse pasada una semana
  desde la primera. En una barbería es típico: el que afila tijeras, el técnico que arregla la silla, el mensajero.
  Desde el 10 de noviembre de 2024 la DIAN valida la emisión con más rigor.
- **Facturas electrónicas de compra.** Siigo dice que «importa documentos de la DIAN» y agiliza el registro de compras
  con sugerencias y llenado automático. El conciliador tributario de Alegra avisa al contador cuando falta una factura
  de compra. Lo razonable para Barberlytics es **integrarse** con Alegra o Siigo, no emitir documentos electrónicos
  por su cuenta (habría que habilitarse ante la DIAN como software propio).
- **Retenciones en la fuente, IVA descontable y régimen tributario:** no investigué tarifas ni reglas. Son campos que
  conviene modelar (base, tarifa, valor) **sin** calcular automáticamente hasta tener validación profesional.

---

## 6. IA

### Casos

| Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos necesarios (¿los tenemos?) | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| **Foto → gasto (OCR + LLM)** | Lee comercio, fecha, total, impuesto y moneda de la foto y propone el gasto | Expensify SmartScan; Dext (≈95 % en prueba independiente); Wave; QuickBooks (app y correo) | El admin toma la foto de la factura del distribuidor y queda registrada con categoría | La foto (**no**: falta el adjunto), categorías (**no**) y proveedores (**no**) | Generativa (visión) | M | Tirillas térmicas ilegibles, montos mal leídos y datos personales en la foto. Exige confirmación |
| **Categorización que aprende por proveedor** | Propone la categoría y, tras la primera vez, la fija por proveedor | Dext *Supplier Rules*; Intuit Accounting Agent | «Distribuidora X» → «Productos para reventa» siempre | Historial categorizado (**no** hoy) | Predictiva | S | Error silencioso si se auto-aplica sin revisión |
| **Captura por WhatsApp** | Foto, audio o texto («pagué 80 mil de luz») al número de la barbería → gasto en borrador | Brex (SMS/WhatsApp); Gasti; Buk | El dueño, desde la calle, manda la foto y el sistema responde «¿Servicios públicos, $80.000, hoy? Sí / Corregir» | Canal de WhatsApp Business, identidad del remitente (celular del equipo: **sí**) | Conversacional + agéntica | M–L | Costo por conversación, suplantación de número y spam. Requiere lista blanca de números |
| **Duplicados y atípicos** | Avisa si el mismo monto, proveedor y fecha ya existe, o si un gasto se sale del patrón | Ramp Policy Agent; Dext | «La luz de este mes es el doble del promedio» o «esta factura ya se registró el día 3» | Historial con fecha y categoría (**parcial**) | Predictiva (reglas + estadística) | S–M | Falsos positivos que cansan. Empezar con reglas simples |
| **Inteligencia de precios / renegociación** | Compara lo que pagas por un insumo o servicio con lo que pagan otras barberías | Ramp Price Intelligence (caso Crossbeam, cifras del propio Ramp) | «Pagas tus cuchillas 18 % más caras que la mediana de barberías de tu ciudad» | Datos anónimos de muchas barberías con producto normalizado (**no**) | Predictiva + generativa | L | Necesita escala, anonimización, consentimiento y datos viejos |
| **Pronóstico de gastos y caja** | Proyecta entradas y salidas a 30–90 días y avisa si falta caja | QuickBooks Cash Flow Planner (ML, 90 días, escenarios «¿y si…?») | «El 1 pagas arriendo y nómina: con la agenda actual te faltan $1,2 M. ¿Abrir promociones?» | Agenda futura y ventas (**sí**), fijos con vencimiento (**no**: falta día de pago), nómina (**sí**) | Predictiva | M | Falsa precisión. Mostrar rangos, no un número exacto |
| **CFO virtual conversacional** | Responde en lenguaje natural sobre el negocio con cifras y fuentes | Intuit Assist; Xero JAX; Ask Ramp | «¿Cuánto me gané en septiembre?», «¿Qué silla da más?», «¿En qué se me va la plata?» | P&L (**no** existe aún; las piezas sí). Chat del producto (**sí**: `src/components/chat`, `src/lib/chat`) | Conversacional + agéntica | M (tras el P&L) | Alucinar cifras. Responder solo con herramientas que consultan la API y mostrar la cifra fuente |
| **Documento soporte asistido** | De la foto del recibo informal, arma el borrador del documento soporte y lo envía al software contable | Siigo (genera documento soporte y anuncia agentes IA) | El afilador cobra en efectivo y queda el documento soporte para deducir | NIT del proveedor (**no**), integración (**no**) | Agéntica | L | Responsabilidad fiscal, plazo semanal y numeración. Debe hacerlo el software autorizado |
| **Conciliación caja y gastos** | Cuadra lo que salió de caja (caja menor) con los gastos registrados y el cierre | Xero JAX (conciliaciones); Alegra (conciliador tributario) | «En la caja faltan $35.000 y hay un gasto sin comprobante de $35.000» | Sesiones de caja (**no**) | Predictiva + agéntica | M–L | Acusaciones injustas al personal. Mostrar como pregunta, no como culpa |
| **Sugerencias de ahorro y presupuesto** | Detecta categorías que crecen, suscripciones olvidadas y propone topes | Gasti (presupuesto por categoría); Ramp | «Publicidad subió 3 meses seguidos sin más reservas online» (cruza con Marketing) | Categorías (**no**), métricas de marketing (**sí**, `/metrics/marketing`) | Generativa sobre datos | M | Consejos genéricos. Anclarlos a datos propios |

### Top 5 apuestas

1. **Foto → gasto con confirmación (P1).** Es el caso con más uso diario y el que cierra la regresión de los
   comprobantes. Usar un LLM con visión que devuelva JSON validado con Zod, siempre en *borrador* y con los campos de
   baja confianza resaltados. Requiere antes categorías, fecha y adjuntos.
2. **Categorías que aprenden por proveedor (P1).** Es barata, mejora todo lo demás (P&L, presupuestos, atípicos) y
   empieza con reglas («la última vez lo pusiste en…»), sin modelo.
3. **Captura por WhatsApp (P2).** En Colombia el WhatsApp es el canal del dueño. Reusar el mismo extractor del punto 1.
   Empezar con un número del negocio y una lista blanca de celulares del equipo (ya existen en Equipo).
4. **Alertas de duplicados y atípicos (P1–P2).** Reglas simples (mismo proveedor, monto ±1 % y 7 días; categoría ×2
   sobre su mediana de 3 meses). Pueden publicarse en las `suggestions` de `/metrics/insights`, que ya existen.
5. **CFO conversacional sobre el P&L (P2).** El diferencial frente a toda la competencia vertical. Reusar el chat del
   producto con herramientas cerradas (`getPnL`, `getExpensesByCategory`, `getPayroll`) y nunca con texto libre sobre
   cifras. El pronóstico de caja a 90 días se suma después, con los vencimientos de cuentas por pagar.

Quedan fuera por ahora: la inteligencia de precios (necesita escala de red) y el documento soporte propio (riesgo
fiscal; mejor integrar).

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Gastos confiables (≈ 3–4 semanas)

- La moneda y la zona horaria salen de la sucursal (`useMoney` lee `branch.currency`; el corte de mes usa
  `branch.timezone`).
- Contrato v2: `date`, `categoryId`, `paymentMethod`, `supplierName`, `attachments[]` (hasta 3), `createdBy` y, en los
  fijos, `startDate`, `endDate` y `dueDay`. `GET` con `from/to`. «Terminar» un fijo en lugar de borrarlo.
- Categorías por defecto más propias (lista de Configuración), filtro por chips y `PeriodNavigator`.
- Ficha de solo lectura para quien no puede editar. Exportar CSV del periodo.
- Corregir el texto de «lo que hay que vender para no perder» hasta que exista el cálculo.
- Seed colombiano (COP, arriendo, administración, servicios públicos, Nequi) para demos LatAm.

### Fase 2 — Del gasto al resultado (≈ 4–6 semanas)

- **Estado de resultados** mensual por sucursal: ingresos cobrados (Transacciones), costo de producto
  (`products.cost` × vendidos), nómina y comisiones (Nómina), gastos por categoría y utilidad, con comparación con el
  mes anterior.
- **Punto de equilibrio** en dinero y en «cortes por día» con el ticket promedio real.
- **Cuentas por pagar:** vencimientos de los fijos, «marcar pagado» y aviso 3 días antes.
- **Caja menor** desde el mostrador, ligada a la sesión de caja si se construye el cierre de caja.
- Rentabilidad por silla y por sucursal (vista del dueño).
- IA: **foto → gasto** y **categorías por proveedor**.

### Fase 3 — Copiloto financiero y Colombia formal (≈ 6–10 semanas)

- **WhatsApp** para capturar gastos (borrador y confirmación).
- **Duplicados y atípicos** en Insights. **Presupuestos** por categoría con alertas.
- **CFO conversacional** con herramientas sobre el P&L y **pronóstico de caja** a 90 días con escenarios.
- **Integración contable** (Alegra o Siigo primero por mercado; QuickBooks para EE. UU.) que lleve el documento soporte
  de compras a no obligados y la recepción de facturas electrónicas de compra.
- Campos fiscales (IVA descontable, retención practicada y deducible sí/no) validados con contador.
- Más adelante, con escala: inteligencia de precios de insumos entre barberías, anónima y con consentimiento.

---

## Fuentes

Código y documentación interna: `src/features/expenses/*`, `src/mocks/expenses/*`, `src/mocks/settings/seed.ts`,
`src/features/calendar/calendarFormat.ts`, `src/features/products/types.ts`, `src/features/transactions/types.ts`,
`docs/API_CONTRACT.md`, `docs/roles/02-metricas-caja-nomina.md`, `ai-tools/CODEMAP.md` y la memoria
`project-modulo-gastos.md`.

Fuentes externas consultadas (por búsqueda o lectura directa). Las búsquedas web se agotaron al final; no pude
verificar en sus fuentes oficiales SmartScan de Expensify ni la captura de Pleo.

- https://biz.booksy.com/blog/barbershop-mastering-finances-profitability
- https://capterra.com/p/142741/Booksy/
- https://www.fresha.com/help-center/knowledge-base/team/101637-prepare-a-pay-run
- https://square.com/help/us/en/article/5152
- https://squareup.com/help/us/en/article/8658-capture-receipts-and-add-notes-to-square-debit-card-transactions
- https://squareup.com/help/us/en/article/8110-categorize-your-spending-with-square-bill-pay
- https://community.squareup.com/t5/Square-Business-Banking/Expense-tracking/idc-p/680761
- https://www.capterra.com/compare/81148-153752/Salon-Tracker-vs-Vagaro
- https://www.fresha.com/for-business/barber/best-barbershop-software
- https://www.joinblvd.com/blog/salon-and-spa-payment-processing
- https://blvdco-origin.prod.joinblvd.com/blog/beauty-salon-accounting-software
- https://help.zenoti.com/en/appointments/daily-tasks/manage-petty-cash/record-petty-cash-transactions.html
- https://help.zenoti.com/en/reports/finance/accounting/petty-cash-report--v2-.html
- https://www.zenoti.com/blog/new-enhancements-this-may
- https://phorest.helpjuice.com/44038-category-2-GB/339031-how-do-i-process-petty-cash
- https://phorest.helpjuice.com/44132-financial-reports/305672-petty-cash-and-sundries
- https://help.gettimely.com/hc/en-gb/articles/360060948614-How-to-track-petty-cash-expenses
- https://agendapro.com/co/sistema-de-caja
- https://agendapro.com/mx/control-de-pagos
- https://agendapro.com/blog/cierre-de-caja/
- https://bookedin.com/blog/are-barbershops-profitable-what-to-know/
- https://support.ramp.com/hc/en-us/articles/17522214341523-Price-Intelligence-on-Ramp
- https://ramp.com/customers/crossbeam
- https://ramp.com/blog/ramp-policy-agent-ga-launch
- https://support.ramp.com/policy-agent-full-expense-checks
- https://brex.com/support/receipts-for-expenses
- https://g2.com/compare/brex-vs-pleo
- https://smallbiztrends.com/expensify-smartscan/
- https://www.techrepublic.com/article/expensify-review/
- https://www.xero.com/us/media-releases/xeros-ai-financial-superagent-jax-launches-powerful-new-features/
- https://quickbooks.intuit.com/r/news/intuit-launches-ai-powered-intuit-assist-for-quickbooks
- https://www.cfodive.com/news/intuit-ai-quickbooks-enhancements-ceo-eyes-ai-agents/733832/
- https://dev.to/pirateprentice/quickbooks-ai-in-2026-what-actually-works-a-bookkeepers-field-notes-ng9
- https://insightfulaccountant.com/accounting-tech/general-ledger/quickbooks-cash-flow-planner-is-on-the-way
- https://www.accountingtoday.com/news/wave-adds-receipt-scanning-tool
- https://dext.com/en/products/prepare
- https://marcandrews.com/dext-review-2026-worth-it-for-uk-small-businesses/
- https://uk-marketplace.sage.com/en-GB/apps/53024/receipt-bank/features
- https://blog.alegra.com/costa-rica/lleva-el-control-de-tu-negocio-desde-una-app-movil/
- https://www.larepublica.co/especiales/facturacion-electronica-2024/alegra-el-aliado-tecnologico-para-las-pymes-3940991
- https://www.siigo.com/facturacion-electronica/
- https://apps.apple.com/pe/app/app/id1644703591
- https://forbes.co/2022/03/04/emprendedores/treinta-finanzas-para-negocios-pequenos/
- https://www.latamfintech.co/articles/bold-lanza-bold-pos-su-nuevo-sistema-de-facturacion-electronica-para-pequenos-negocios-en-colombia
- https://apps.apple.com/co/app/bold/id1489537348
- https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/soporte-adquisiciones-no-obligados/
- https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_2116_2024.htm
- https://siemprealdia.co/colombia/impuestos/documento-soporte-no-obligados-a-facturar/
- https://www.a24.com/trends/la-herramienta-whatsapp-que-simplifica-el-control-tus-gastos-como-usar-esta-ia-cuidar-tu-dinero-n1398678
- https://www.buk.cl/novedades/glosario-finanzas/rendicion-de-gastos-por-whatsapp
- https://www.itsitio.com/mx/distribucion/whatsapp-ya-gestiona-las-finanzas-de-las-empresas-gracias-a-la-inteligencia-artificial/
