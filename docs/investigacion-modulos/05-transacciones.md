# Transacciones — investigación

Investigación del 2026-10-17 sobre el módulo `/transacciones` (cobros y caja) de Barberlytics. Se leyó el código
(`src/features/transactions`, el cobro del calendario, los pagos de la reserva y su backend simulado en `src/mocks/`),
las notas del proyecto y fuentes públicas de competidores, pasarelas y regulación. No se tocó código.

## Resumen ejecutivo

- Transacciones es hoy una **pantalla de consulta bien hecha**: periodo en la URL, estados con recuento, detalle en panel, recorte por rol. Pero no hay **libro de pagos**: cada cuenta se deduce de una cita o de una venta, y eso no deja cuadrar caja.
- **Error de integridad**: una reserva pagada en línea crea la cita con `payment: null`. La cuenta sale «Por cobrar» por el total y en caja se puede **volver a cobrar**. Anticipos, cupones, tarjetas de regalo, saldo y paquetes no llegan a Transacciones.
- Los reembolsos sí ocurren en la reserva, pero en Transacciones salen como «Anulada». El estado `refunded` que se ve es **sintético**: una de cada 45 cuentas, sacada de un hash.
- **El mercado del código no es Colombia**: el dinero se muestra en USD fijo, las sucursales de demostración están en EE. UU., la pasarela es solo Stripe y los datáfonos usan TPN. El idioma sí es español de Colombia (`es-CO`). Antes de priorizar hay que **decidir el país**: los rieles de pago y la factura cambian por completo.
- Comparada con su categoría, a la caja le falta lo básico: **pagos divididos**, **cierre y arqueo**, **reparto de propinas**, **devoluciones** y **exportar**. Para Colombia además faltan **Bre-B/Nequi** y el **documento equivalente electrónico POS de la DIAN**.
- IA, por orden de apuesta: asistente de cierre que detecta descuadres, preguntas sobre la caja en lenguaje natural, conciliación de transferencias, pronóstico de caja con la agenda y cobro automático de cuentas abiertas.

---

## 1. Qué tiene hoy

### Pantalla `/transacciones` (`src/features/transactions/`)

| Pieza | Archivo | Qué hace |
|---|---|---|
| Página | `TransactionsPage.tsx` | `PageHeader` con «Recargar», `PeriodNavigator` (día/semana/mes; por defecto **hoy**), select de **estado de la cita**, cuatro `MetricCard` (Facturado, Cobrado con anillo de %, Por cobrar, Propinas con lo devuelto al pie), fichas `OptionTile` por **estado de la cuenta** con su recuento, y lista `DataListBlock` (tabla en escritorio y `ListItem` en móvil) con búsqueda y 15 filas por página. |
| Detalle | `AccountDrawer.tsx` | Panel de solo lectura: líneas (servicio o producto), subtotal, impuesto, total, propina, cobrado, devuelto o saldo; cliente con teléfono enmascarado, quién atendió, estado y duración de la cita, método, quién la abrió y quién la cobró, fecha de pago y referencia. Atajos a «Ver cliente» y «Ver la cita» (`/calendario?fecha&cita`). |
| Filtros en la URL | `useTransactionsFilters.ts` | `?periodo`, `?fecha`, `?estado`, `?estadoCita`, `?cuenta`. Un enlace copiado abre la misma vista. |
| Resumen y columnas | `transactionsHome.tsx` | `summarize()` calcula en el navegador sobre **todas** las cuentas del periodo, no sobre las filtradas. Columnas: fecha, factura, cliente, atendió, estado, total, cobrado y método; cita y propina van ocultas por defecto. |
| Roles | `transactionsAccess.ts` | `accountsFor`: el barbero ve solo lo que atendió, sin ventas de mostrador. `showsPeriodTotals`: recepción ve las cuentas sin las tarjetas de totales. |
| Contrato | `types.ts`, `api.ts`, `docs/API_CONTRACT.md` §Transacciones | `GET /transactions?branchId&from&to`, sin paginar y con un máximo de 62 días. Estados de la cuenta: `open` · `paid` · `refunded` · `void`. Métodos: `cash` · `card` · `link` · `mixed`. |
| Mock | `src/mocks/transactions/handlers.ts` | No tiene tabla propia: cada cita (`appointmentsOn`) es una cuenta y cada `db.calendar.sales` es otra. `invoiceOf()` y `reference()` salen de un hash del id. `REFUND_ONE_IN = 45` marca como devuelta una de cada 45 cuentas cobradas. |
| Pruebas | `transactions.test.tsx` | 13 pruebas: el resumen (lo anulado no se factura, un periodo vacío da ceros), los filtros, el detalle, el contrato y el recorte por rol. |

### Dónde se cobra de verdad

- **Cobro de una cita** (`src/features/calendar/CheckoutDrawer.tsx`, con la aritmética en `checkoutMath.ts`): se pueden agregar o quitar servicios y productos. La propina sale de las opciones de Configuración (porcentaje o monto; si no responde, 10, 15 o 20 %) o se escribe a mano. Métodos: efectivo, tarjeta, enlace o mixto. El **recargo por tarjeta** viene de Configuración y se calcula el **vuelto** del efectivo. Si la visita tiene otras citas pendientes, se cobran juntas, pero cada una con su propia mutación (`Promise.all`).
- **Lista de cobros del día** (`CollectionsDrawer.tsx`, «Listo para pagar»): pestañas «Por cobrar» y «Pagado» con el total del día. Es lo más parecido a un cierre, pero **no tiene arqueo**.
- **Venta de mostrador** (`QuickSaleDrawer.tsx`): productos y método de pago, sin cliente ni vendedor. **Venta sin cita** (`WalkInSaleDrawer.tsx`): registra un servicio ya hecho y abre el cobro.
- **Pagos de la reserva** (`src/features/booking/flow/usePaymentController.ts`, `pricing.ts`, `useBookingTotals.ts`): tarjeta (nueva o guardada), billetera simulada, pagar en la barbería, saldo a favor y tarjeta de regalo. También anticipo **condicional** (solo a clientes nuevos o con inasistencias), cupones (`/booking/promo`), paquetes prepagados, membresía con cortesía, recargo por tarjeta avisado antes de elegir, propina en un modal y reembolso al cancelar, a la tarjeta o como saldo a favor.
- **Configuración** (`src/features/settings/settingsTypes.ts`): moneda (`USD`, `COP`, `MXN`, `EUR`) y si los precios incluyen impuesto, propinas, recargo por tarjeta, pasarela (`provider: z.literal("stripe")`), grupos de impuestos y datáfonos (`serial`, `tpn`, `authKey`).
- **Métricas** ya reportan reembolsos, descuentos, distribución por método (`card | cash | transfer | giftCard`) y % de propinas (`docs/roles/02-metricas-caja-nomina.md`).

### Señales del mercado en el código

| Señal | Dónde | Apunta a |
|---|---|---|
| `useMoney()` formatea siempre `currency: "USD"` | `src/features/calendar/calendarFormat.ts:15` | EE. UU. (no respeta la moneda que se elige en Configuración) |
| Sucursales Massachusetts, North Carolina, Rhode Island y Utah, «LLC», `taxId` «12-3456789», festivos `thanksgiving` e `independence` | `src/mocks/settings/seed.ts:42-90` | EE. UU. |
| Precios de servicio de 25 a 60 | `src/mocks/calendar/seed.ts:162-167` | USD |
| Pasarela solo Stripe; datáfonos con TPN | `settingsTypes.ts` | Hardware y procesamiento de EE. UU. |
| Idioma `es` con `intl: "es-CO"` | `src/i18n/locales.ts:22` | Equipo y voz colombianos |
| En producción, el barbero ve «$120,000» frente a «$10,260,490» del equipo, y una renta de «$4,534,534.00» | `docs/roles/02-metricas-caja-nomina.md` | Magnitudes de pesos colombianos |
| «Pagos locales (PSE, Nequi, COP)» como hueco abierto | `docs/BOOKING_RESEARCH.md:40` | Colombia como objetivo pendiente |

**Conclusión**: la premisa «Colombia/LatAm» **no se confirma en el código de este repositorio**. La demo está montada sobre barberías hispanas en EE. UU. Producción, en cambio, parece tener clientes con montos en pesos. Este documento cubre los dos mercados y marca qué cambia en cada uno.

---

## 2. Análisis del módulo

### Fortalezas

1. **Modelo mental claro**: «una cuenta es lo que se le cobra a alguien». Los cuatro estados tienen un texto de ayuda cada uno (`ACCOUNT_STATUS_HINT_KEYS`), y lo anulado no infla lo facturado.
2. **El estado vive en la URL**: periodo, filtros y cuenta abierta. Encaja con el resto del producto y se puede compartir.
3. **Recorte por rol ya implementado y probado**, cuando ninguna otra pantalla de caja lo tenía (según el doc de roles). Recepción ve las cuentas sin los totales y el barbero de renta ve solo lo suyo.
4. **Privacidad**: el teléfono sale enmascarado en todas las vistas (`maskPhone`).
5. **El lado del cliente está por delante del mercado** en varios puntos: el anticipo condicional como el de GlossGenius, el recargo dicho antes de elegir, el reembolso como saldo a favor, la tarjeta de regalo, los paquetes y la membresía.
6. **Diseño sobrio**: los componentes del sistema (`MetricCard`, `OptionTile`, `DataListBlock`, `DrawerShell`) y el móvil están resueltos, con las fichas en una fila deslizable.

### Huecos funcionales

| # | Hueco | Evidencia |
|---|---|---|
| H1 | **No hay libro de pagos.** Una cuenta tiene un solo `method` y un solo `paidAt`, así que no caben pagos parciales, abonos, dos métodos ni varias devoluciones. | `types.ts` (`accountSchema`) y `paymentSchema` del calendario |
| H2 | **La reserva en línea no llega a caja.** Las citas creadas en línea llevan `payment: null` aunque se pagaron con tarjeta, saldo o regalo, o dejaron anticipo. | `src/mocks/booking/handlers.ts:508`. Los `totals` (descuento, regalo, paquetes, recompensa, recargo) quedan en `db.booking.reservations` y nadie los une. |
| H3 | **Riesgo de cobrar dos veces.** Si `payment` es `null`, el `CheckoutDrawer` propone cobrar el precio completo de una cita que ya estaba pagada. | Consecuencia de H2 |
| H4 | **La devolución no existe en caja.** El estado `refunded` es sintético (`REFUND_ONE_IN = 45`). La devolución que sí pasa al cancelar en la reserva (`handlers.ts:747-762`) aparece en Transacciones como `void`. | `mocks/transactions/handlers.ts` |
| H5 | **Pago mixto sin desglose.** `mixed` no dice cuánto se pagó en efectivo y cuánto con tarjeta, así que la caja no se puede cuadrar por método. | `paymentMethodSchema` |
| H6 | **Impuestos incoherentes.** El cobro de caja guarda siempre `tax: 0` (`mocks/calendar/handlers.ts:401`), mientras la reserva sí aplica `taxPercent()`. Configuración tiene grupos de impuestos y precios con o sin impuesto incluido. | — |
| H7 | **La cuenta no explica lo cobrado.** `total = subtotal + tax`. El recargo por tarjeta y el descuento no aparecen como líneas, así que la cifra «Total» no coincide con lo que pasó por el datáfono. | `API_CONTRACT.md` §Transacciones; nota de producto: «el descuento quedó fuera» |
| H8 | **No hay cierre ni arqueo de caja.** Falta la apertura con base, las entradas y salidas de efectivo, el conteo, la diferencia y el responsable. | No existe en `src/` |
| H9 | **Propinas sin reparto.** La propina se guarda por cita y se suma, pero no se separa la de efectivo de la de tarjeta, no hay fondo común ni reporte de liquidación. | `summarize()`, `CheckoutDrawer` |
| H10 | **No se puede exportar** (tampoco en producción) ni **filtrar por barbero o método**; solo con la búsqueda de texto. | Doc de roles, filas «Exportar» y «Filtrar» |
| H11 | **La venta de mostrador no tiene vendedor** (`chargedBy: null`), así que no hay comisión ni auditoría. | `fromSale()` |
| H12 | **Cobrar una visita no es atómico**: son N mutaciones en paralelo y, si una falla, la visita queda medio cobrada. | `CheckoutDrawer.tsx` (`pay`) |
| H13 | **La factura no es fiscal.** El número de factura es un hash de 8 dígitos y no hay numeración consecutiva, prefijo ni CUFE/CUDE. | `invoiceOf()` |
| H14 | **La moneda está fija en USD** en el formato del calendario y de la caja. | `calendarFormat.ts:15` |

### Deuda técnica

- El resumen se calcula en el navegador sobre una lista sin paginar, con un tope de 62 días. Con un backend real hace falta un `summary` del servidor y paginación (ya está anotado en el contrato).
- La cuenta deriva de la cita, así que **editar una cita cobrada reescribe la historia de la caja**. Un libro de pagos de solo agregar (*append-only*) lo evitaría.
- `openedBy` y `chargedBy` son nombres sueltos, no ids. La cita tiene `history`; la cuenta no tiene auditoría propia.
- Hay dos enums de método (`cash|card|link|mixed` en caja y `card|wallet|shop|credit|gift` en la reserva) y un tercero en Métricas (`card|cash|transfer|giftCard`). Hace falta **un catálogo único de medios de pago**.

### UX

- Bien: la pregunta diaria («¿cómo va la caja hoy?») se responde al abrir la pantalla.
- Mal: «Facturado» y «Cobrado» excluyen la propina y el recargo. Un dueño que compara con su datáfono no va a cuadrar y no sabrá por qué. Falta una fila «Entró por método» (efectivo, tarjeta, transferencia).
- Mal: la cuenta abierta solo dice «Ver la cita». No hay «Cobrar», «Devolver» ni «Enviar recibo» desde el detalle, y para un dueño el sitio natural de estas acciones es el detalle de la cuenta.
- Falta un aviso de **cuentas abiertas de días anteriores**: citas completadas que nadie cobró. Es la fuga de dinero más común y hoy solo se ve cambiando el periodo.

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S (≤1 semana) · M (2–4 semanas) · L (>1 mes o integración externa).

| Prioridad | Qué | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | **Libro de pagos** (`payments` de solo agregar: cargo, abono, anticipo, devolución, anulación; cada uno con método, monto, quién y cuándo), del que **se derivan** las cuentas | Base de todo lo demás: pagos divididos, devoluciones, cierre, conciliación (H1) | A | L |
| **P0** | **Unir la reserva en línea con la caja**: un pago en línea o un anticipo se registra en el libro, la cita llega «Pagada» o «Con anticipo» y el cobro descuenta lo ya pagado | Evita cobrar dos veces y deja la caja coherente (H2, H3) | A | M |
| **P0** | **Devolución total o parcial** desde el detalle de la cuenta: motivo, destino (tarjeta, efectivo o saldo a favor), permiso `transactions·edit` y auditoría; quitar `REFUND_ONE_IN` | Ya existe el estado y producción lo filtra; hoy es ficción (H4) | A | M |
| **P0** | **Pagos divididos** (varios métodos en una cuenta, con monto por método) en el `CheckoutDrawer` | GlossGenius, Mangomint, Boulevard y Shopify lo tienen; sin esto `mixed` no cuadra (H5) | A | M |
| **P0** | **Moneda por sucursal** e **impuestos aplicados igual** en caja y en reserva; descuento y recargo como líneas de la cuenta | La cifra tiene que coincidir con el datáfono (H6, H7, H14) | A | S–M |
| **P0** | **Cierre y arqueo de caja por turno**: base de apertura, entradas y salidas, conteo (por denominación y opcionalmente a ciegas), diferencia con nota, responsable, reporte e historial | Zenoti, Toast, Alegra POS y AgendaPro lo tienen; es donde se detecta el «robo hormiga» (H8) | A | M |
| **P0 si Colombia** | **Documento equivalente electrónico POS o factura electrónica** a través de un proveedor tecnológico autorizado (integrar Alegra, Siigo u otro; no construirlo) | Obligación DIAN; numeración autorizada (H13) | A | L |
| **P1** | **Medios de pago locales**: Bre-B (llave y QR), Nequi, Daviplata y transferencia como métodos de caja; pasarela local (Wompi o Bold) junto a Stripe; **links de pago** reales | Bre-B pasó de 0 a más de 161.000 llaves de comercio en un año | A (CO) | M–L |
| **P1** | **Propinas**: separar efectivo de tarjeta, reparto por barbero o en fondo común, paso a nómina y reporte de propinas | En EE. UU. hay que llevar las propinas calificadas por trabajador («No Tax on Tips»); en Colombia, transparencia (H9) | A | M |
| **P1** | **Exportar** a CSV o Excel (cuentas, pagos y cierre), filtros por barbero y método, `summary` del servidor y paginación | Lo pide el contador; hoy no existe ni en producción (H10) | M | S–M |
| **P1** | **Reasignar el crédito** de un cobro a otro barbero, con auditoría | Lo piden las notas de Notion del doc de roles; afecta la comisión | M | S–M |
| **P1** | **Alerta de cuentas abiertas de días anteriores** y acción «Cobrar» o «Enviar link» desde el detalle | Fuga de dinero directa | A | S |
| **P1** | **Cobro de visita atómico** (un solo `POST /visits/:id/checkout`) y **venta de mostrador con vendedor** | H11, H12 | M | S |
| **P2** | **Tarjetas de regalo, paquetes y membresías vendidos en caja** (hoy solo en línea) y su **saldo pendiente** (pasivo) | Square, Vagaro, Fresha y Booksy los venden en mostrador | M | M |
| **P2** | **Conciliación** con liquidaciones de la pasarela, lotes del datáfono y banco (comisiones, abonos en cuenta) | Saber si lo cobrado llegó al banco | M | L |
| **P2** | **Autocobro por link o QR** al terminar la cita, con propina desde el celular del cliente (como el *self checkout* de Mangomint) | Agiliza recepción y sube las propinas | M | M |
| **P2** | **Recibo digital** por WhatsApp o correo, y reenvío desde el detalle | Expectativa básica | B–M | S |
| **P2** | **Pagos repartidos a cada barbero** (*multi-merchant*) para el barbero de renta | Fresha y Boulevard lo hacen; encaja con el rol «renta» | M | L |

---

## 4. Benchmark

**Leyenda:** ✓ confirmado en la fuente consultada · ~ parcial o indirecto · ? no se confirmó en lo consultado (no significa que no exista) · ✗ no existe en Barberlytics.
Clover, SumUp, Siigo, Nequi Negocios, Daviplata y Vagaro **no se pudieron verificar**: se agotó el cupo de búsquedas web de la sesión, y las páginas de Vagaro y Siigo que se intentaron devolvieron 404. Por eso no van en la tabla.

### Verticales de belleza y barbería

| Función | Booksy | Fresha | Square | Boulevard | Mangomint | GlossGenius | Zenoti | AgendaPro | **Barberlytics** |
|---|---|---|---|---|---|---|---|---|---|
| Datáfono propio o *Tap to Pay* | ✓ | ✓ | ✓ | ✓ (Duo) | ? | ✓ | ? | ✓ | ✗ (Stripe en línea; datáfonos solo se registran) |
| Anticipo o tarjeta guardada contra inasistencias | ✓ | ✓ | ? | ? | ✓ | ✓ (solo nuevos, opcional) | ? | ✓ («abonos») | ✓ en la reserva (condicional) |
| Pagos divididos entre métodos | ? | ~ (*multi-merchant*) | ? | ✓ | ✓ | ✓ | ? | ? | ✗ (`mixed` sin desglose) |
| Propina en el cobro | ✓ | ✓ | ✓ | ✓ (discreta en iPad) | ✓ | ✓ | ~ | ? | ✓ |
| Reparto de propinas o paso a nómina | ? | ✓ (a la paga) | ~ (fondo por turno) | ? | ? | ? | ✓ (pago de propinas) | ? | ~ (va a nómina, sin reparto) |
| Cierre y arqueo de caja | ? | ? | ✓ (cajón, entradas y salidas) | ~ (cajón como accesorio) | ~ (el efectivo mueve el cajón) | ? | ✓ (apertura, medio día, cierre, alertas) | ✓ (caja de ingresos y egresos) | ✗ |
| Tarjetas de regalo | ✓ | ✓ | ? | ✓ | ✓ | ✓ | ? | ? | ✓ solo en línea |
| Pago repartido a cada profesional | ? | ✓ | ? | ✓ | ? | ? | ? | ? | ✗ |
| Recargo o tarifa trasladada al cliente | ? | ? | ? | ✓ (Offset) | ? | ? | ? | ? | ✓ |
| Pago inmediato al negocio | ✓ (1,5 %) | ✓ (billetera) | ? | ? | ? | ✓ (1,8 %) | ? | ? | ✗ |
| Factura electrónica DIAN | ? | ? | ? | ? | ? | ? | ? | ✓ | ✗ |
| IA sobre los datos de venta | ? | ? | ✓ (Square AI, beta) | ? | ? | ✓ (Growth Analyst) | ? | ? | ✗ |

### Fuera del sector y Colombia

| Función | Toast | Shopify POS | Stripe (Terminal y Radar) | Alegra POS | Bold | Wompi |
|---|---|---|---|---|---|---|
| Cajón: apertura, entradas y salidas, pago de propinas, retiro de efectivo | ✓ | ✓ (seguimiento del efectivo) | — | ✓ (turnos y cierres) | — | — |
| Sobrante o faltante al cerrar y reportes de auditoría | ✓ («over», «short», reporte de actividad de efectivo, reporte «no sale») | ~ (reporte diario) | — | ✓ | — | — |
| Pagos divididos o parciales | ? | ✓ | — | ? | — | — |
| Aprobación de un gerente para descuentos | ? | ✓ (Pro) | — | ? | — | — |
| Devoluciones y anulaciones | ~ | ✓ | ✓ | ? | ? | ? |
| Fraude con aprendizaje automático | — | — | ✓ (Radar) | — | ? | ? |
| Medios locales CO | — | — | — | ✓ (Bold, Wompi, Nequi) | ✓ (datáfono, link, QR Bre-B) | ✓ (PSE, Nequi, Botón Bancolombia, Daviplata, corresponsales, BNPL) |
| Documento POS electrónico DIAN | — | — | — | ✓ (Res. 165) | — | — |
| Validación automática de transferencias | — | — | — | ✓ (lee los avisos del banco en Gmail) | — | ✓ (confirmación) |
| IA | ? | ✓ (Sidekick: pronóstico de demanda) | ✓ (Radar) | ? | ? | ? |

### Hallazgos

1. **El cierre de caja es estándar fuera del sector** (Toast, Shopify, Alegra) y en los grandes de belleza (Zenoti), pero **casi ningún vertical de barbería lo vende como función estrella**. Hacerlo bien y sencillo para una barbería es una diferencia real, sobre todo donde se cobra mucho en efectivo.
2. **Los pagos divididos ya son lo mínimo** en las plataformas modernas (GlossGenius, Mangomint, Boulevard, Shopify).
3. **Pagar a cada profesional por separado** (Fresha, Boulevard) resuelve el caso del **barbero de renta**, que en Barberlytics ya es un rol con «su caja».
4. **El dinero se gana en el procesamiento**: tarifas por transacción (Booksy 2,49 % + US$0,10 en datáfono; GlossGenius con tarifa plana) y pagos inmediatos con recargo (Booksy 1,5 %, GlossGenius 1,8 %). Si Barberlytics no procesa, no captura ese ingreso.
5. **En Colombia el ganador se integra con lo local**: Alegra POS manda el valor al datáfono Bold, confirma solo los pagos de Wompi y Nequi, y valida transferencias leyendo los avisos del banco. AgendaPro ya ofrece la factura electrónica DIAN. Fresha publica precios en COP.
6. **La IA de caja todavía está en pañales en el sector**: Square AI está en beta y solo responde preguntas, y GlossGenius orienta la suya al crecimiento. Ningún vertical de barbería ofrece detección de descuadres. Ahí hay espacio.

---

## 5. Mercado y tendencias

### Colombia

- **Bre-B, los pagos inmediatos del Banco de la República.** El registro de llaves empezó en julio de 2025, la operación controlada el 23 de septiembre de 2025 y la masiva el 6 de octubre de 2025 (El Heraldo). Al cumplir el primer año, el Emisor reporta más de 116 millones de llaves, más de 36 millones de usuarios y más de 1.700 millones de transferencias por cerca de 262,5 billones de pesos. El 37 % de las operaciones fue con QR y el 62 % fue de menos de 50.000 pesos, justo el ticket de un corte. Hay 245 entidades interoperando. En comercios, más de 90.000 tenían llave en abril de 2026, y según Bold, citado por Portafolio, las llaves activas de comercio llegaron a 161.468 el 1 de septiembre de 2026, con 3,2 billones de pesos movidos entre junio y agosto. Los servicios fueron el 20,3 % del ingreso del trimestre, y Nequi y Bancolombia concentraron el 88 % de los ingresos de ventas en abril.
  **Consecuencia:** en una barbería colombiana, la «transferencia» deja de ser algo marginal y compite con el efectivo. Hace falta como método de caja, con QR propio y, si se puede, confirmación automática.
- **Pasarelas.** Wompi (del grupo Bancolombia) ofrece por API tarjetas, PSE, Nequi, Botón Bancolombia, corresponsales, Daviplata y BNPL. Bold tiene datáfono, link de pago por WhatsApp y QR Bre-B.
- **Facturación electrónica.** La Resolución 000165 de 2023 creó el **documento equivalente electrónico** (con el tiquete POS) y la 000008 de 2024 movió el calendario. Según una guía de Siempre al Día, el POS en papel dejó de ser válido el 1 de julio de 2024. La DIAN ha cerrado comercios por no facturar: un boletín de CIJUF cita 21 cierres en Bogotá en 2025. **Lo que hay que hacer:** integrar un proveedor autorizado. Construir uno propio no es razonable.
- **Datos personales.** La Ley 1581 (habeas data), ya citada en `docs/BOOKING_RESEARCH.md`, aplica a cualquier conciliación que lea el correo o los movimientos bancarios del negocio.
- **Propinas en Colombia.** Existe una regulación de propina voluntaria pensada sobre todo para restaurantes y hoteles. **No se verificó** en esta investigación si aplica a peluquerías y barberías: queda por confirmar con un asesor.

### EE. UU. (el mercado que hoy refleja el código)

- **«No Tax on Tips».** La ley de 2025 creó una deducción de hasta US$25.000 al año para propinas calificadas. La lista de ocupaciones incluye el código 603: *Barbers, Hairdressers, Hairstylists, and Cosmetologists*. El IRS publicó el reglamento final el 10 de abril de 2026. Las propinas tienen que ser voluntarias (un cargo automático por servicio no cuenta) y el empleador tiene que reportarlas en el W-2 o el 1099-NEC.
  **Consecuencia:** Barberlytics debe **llevar la propina por barbero, separada del cargo por servicio y del recargo, y exportable**. Es un argumento de venta concreto ante los dueños.
- **Tap to Pay en el teléfono** ya es lo esperado (Booksy, Fresha, GlossGenius, Stripe Terminal) y deja la caja sin hardware dedicado.

### Tendencias transversales, 2025–2026

1. **Anticipos condicionales** en lugar de cobrar a todos (GlossGenius). Barberlytics ya lo hace en la reserva.
2. **Autocobro por mensaje o QR**, con propina desde el celular del cliente (Mangomint).
3. **Pagos repartidos a cada profesional** (Fresha, Boulevard).
4. **IA conversacional sobre los datos del negocio** (Square AI, GlossGenius Growth Analyst, Shopify Sidekick).
5. **Agentes contables** que categorizan, emparejan recibos y concilian (Ramp, QuickBooks).

---

## 6. IA

### Casos

| # | Caso | Qué hace y quién lo usa (fuente) | Cómo aplica a una barbería | Datos que necesita: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| 1 | **Fraude y contracargos** | Stripe Radar puntúa cada pago de 0 a 100 con un modelo entrenado sobre «más de 70 billones de datos» de la red de Stripe; anuncia un 32 % menos de fraude en promedio (cifra del proveedor, sin metodología) | Pagos en línea de la reserva, tarjetas de regalo y anticipos | Hace falta la red de la pasarela; **no la tenemos ni la vamos a tener** | Predictiva | S si se usa la de la pasarela (Radar o la de Wompi/Bold); L si es propia | Bloquear clientes legítimos. **Recomendación: delegarlo a la pasarela.** |
| 2 | **Descuadres de caja y «robo hormiga»** | Toast registra sobrantes y faltantes al cerrar, con reportes de actividad del efectivo y de aperturas sin venta; Zenoti avisa por correo o SMS cuando el efectivo contado no coincide con el esperado | Detectar citas completadas que no se cobran, servicios cobrados más baratos que en catálogo, descuentos o anulaciones repetidas del mismo usuario, efectivo que falta al cerrar o propinas raras | **Parcial**: hay `history` de la cita, `openedBy`/`chargedBy` y estados. **Falta** el libro de pagos, los conteos del cajón y los eventos de descuento y anulación | Predictiva (reglas + línea base estadística) | M | Acusar a un barbero sin razón. Presentarlo como «para revisar» con la evidencia, nunca como «robo». Sesgo contra barberos con clientela distinta. |
| 3 | **Conciliación automática** | Ramp: agentes que emparejan recibos y codifican; clientes reportan 90 % de transacciones codificadas solas (Glossier) y 75 % menos de tiempo de conciliación (Webflow). QuickBooks: «reconciles your books» en el plan Plus. Alegra POS lee los avisos de transferencia del banco en Gmail | Emparejar transferencias Bre-B o Nequi, lotes del datáfono y liquidaciones de la pasarela con cada cuenta; marcar lo que no tiene pareja | **No**: faltan los datos del banco y de la pasarela (webhooks de Wompi o Bold; Stripe ya tiene `balance_transactions`) | Predictiva y agéntica | L | Privacidad (Ley 1581) si se lee el correo; emparejar mal cuando el monto se repite. |
| 4 | **Categorización de movimientos** | QuickBooks «categorizes expenses» desde el plan más básico; los agentes de Ramp codifican contra el ERP | Al módulo de Gastos le sirve más que a Transacciones: foto del recibo → gasto categorizado | Parcial: los gastos tienen nombre y monto; no hay recibos | Generativa (OCR + LLM) | S–M | Errores fiscales si se usa para impuestos sin revisión. |
| 5 | **Pronóstico de flujo de caja** | QuickBooks Advanced: pronóstico de caja y utilidad con datos históricos | **Ventaja propia**: la agenda futura es un indicador adelantado. Con citas agendadas × tasa de inasistencia + ventas sin cita + gastos fijos (que ya tienen frecuencia) + nómina sale el saldo previsto de la semana | **Sí, casi todo**: citas futuras, inasistencias por cliente, gastos fijos, nómina | Predictiva | M | Falsa precisión. Mostrar un rango, no un número. |
| 6 | **Propinas sugeridas** | Booksy afirma que quien usa su datáfono ve en promedio 10 % más de propinas; Boulevard Duo pregunta la propina con discreción en un iPad | Elegir los porcentajes por defecto según el ticket, el servicio o el historial del cliente | Sí: propina por cuenta y opciones en Configuración | Predictiva ligera | S | Patrones oscuros. En EE. UU. la propina tiene que ser voluntaria para deducirse; no convertirla en un cargo. |
| 7 | **Preguntas sobre la caja en lenguaje natural** | Square AI (beta): preguntas en lenguaje natural, gráficas fijadas que se actualizan y contexto de clima y eventos locales | «¿Cuánto entró en efectivo esta semana en Massachusetts?», «¿qué barbero tiene más cuentas sin cobrar?» | Sí: cuentas, métodos, barberos y periodos | Conversacional | M | Números inventados. Responder solo desde agregados calculados por herramientas y respetar el rol (recepción no ve totales). |
| 8 | **Agente de cierre de caja** | Combina lo de Zenoti y Toast (cierre con diferencia) con un asistente | Al final del turno: lista las cuentas abiertas, calcula lo esperado por método, pide el conteo, explica la diferencia con lo que encuentra (venta sin método, devolución en efectivo, propina pagada) y redacta la nota al dueño | Necesita el libro de pagos y los conteos (fase 1–2) | Agéntica | M | El agente no debe «corregir» la caja: propone, la persona confirma. |
| 9 | **Cobro automático de cuentas abiertas** | QuickBooks Payments AI propone recordatorios de cobro personalizados | Al cliente que se fue sin pagar le llega un link (Wompi, Bold o Stripe) por WhatsApp en un tono adecuado; se marca la cuenta cuando paga | Parcial: cuentas abiertas y teléfono sí; links reales no | Agéntica | M | Molestar al cliente; consentimiento para escribirle (habeas data). |

### Top 5 apuestas

1. **Agente de cierre de caja con detección de descuadres (casos 8 y 2).** Es el dolor diario del dueño, casi nadie en barbería lo resuelve y crea confianza en todo el módulo. Necesita antes el libro de pagos y el arqueo, y además los justifica.
2. **Preguntas sobre la caja en lenguaje natural (caso 7)**, reutilizando las piezas de chat que ya existen (`src/components/chat`, `src/lib/chat`). Es barato porque los datos ya están; la clave es usar herramientas deterministas, no que el LLM calcule.
3. **Pronóstico de caja con la agenda (caso 5).** Es una diferencia propia: ningún competidor de los consultados lo anuncia, y Barberlytics tiene la agenda, las inasistencias y los gastos en el mismo lugar.
4. **Conciliación de transferencias Bre-B, Nequi y datáfono (caso 3).** Es la que más vale en Colombia, donde la transferencia ya compite con el efectivo. Empezar con los webhooks de la pasarela, no leyendo correo.
5. **Cobro automático de cuentas abiertas con link de pago (caso 9).** Recupera dinero que hoy se pierde y se apoya en los links que de todos modos hay que construir.

El fraude (caso 1) **no es una apuesta**: se hereda de la pasarela.

---

## 7. Hoja de ruta en 3 fases

**Decisión previa (antes de la fase 1):** fijar el **país objetivo** del módulo. El código está montado para EE. UU. y la premisa del negocio dice Colombia. De eso dependen la pasarela, los métodos, la factura y las propinas. Recomendación: un **catálogo de medios de pago y de reglas fiscales por sucursal** (`branch.country` y `branch.currency` ya existen) para no hacer dos productos.

### Fase 1 — «Que la caja diga la verdad» (≈ 4–6 semanas)

- Libro de pagos de solo agregar y cuentas derivadas de él; contrato nuevo en `docs/API_CONTRACT.md`.
- Unir la reserva en línea con la caja: pago y anticipo en el libro y cobro que descuenta lo ya pagado. Corrige el riesgo de cobrar dos veces.
- Pagos divididos en el `CheckoutDrawer`; descuento y recargo como líneas; impuestos coherentes; moneda de la sucursal en `useMoney`.
- Devolución total o parcial y anulación con motivo, permiso y auditoría; quitar `REFUND_ONE_IN`.
- Cobro de visita en una sola llamada; venta de mostrador con vendedor.
- Exportar a CSV, filtros por barbero y método, alerta de cuentas abiertas de días anteriores.

**Listo cuando:** una semana de prueba cuadra al peso contra la suma de métodos y no se puede cobrar dos veces una reserva pagada en línea.

### Fase 2 — «Caja diaria y país» (≈ 6–10 semanas)

- Apertura, cierre y arqueo por turno y sucursal (conteo por denominación y opcionalmente a ciegas), con entradas y salidas de efectivo y el reporte de cierre.
- Propinas separadas por método, reparto por barbero o fondo común, paso a nómina y reporte exportable (W-2/1099 en EE. UU.).
- Reasignar el crédito de un cobro.
- **Colombia:** Bre-B, Nequi y transferencia como métodos; pasarela Wompi o Bold con links de pago y webhooks; documento POS o factura electrónica con un proveedor autorizado. **EE. UU.:** Stripe Terminal o Tap to Pay en lugar del registro de TPN.
- Recibo digital por WhatsApp o correo; tarjetas de regalo y paquetes vendidos en caja, con su saldo pendiente.

### Fase 3 — «Caja inteligente» (≈ 8–12 semanas, con cada pieza por separado)

- Agente de cierre con detección de descuadres (reglas primero, línea base después).
- Preguntas sobre la caja en lenguaje natural, con el recorte por rol.
- Pronóstico de caja de 7 y 30 días con la agenda.
- Conciliación automática con las liquidaciones de la pasarela, el datáfono y Bre-B.
- Cobro automático de cuentas abiertas con link de pago.
- Para evaluar: pagos repartidos a cada barbero de renta y autocobro por QR.

---

## Fuentes

Todas consultadas el 2026-10-17. Las cifras de los proveedores son las que ellos publican.

**Competidores y POS**
- https://biz.booksy.com/features/payments
- https://www.americansalon.com/business/new-booksy-card-reader-improve-checkout-process
- https://www.fresha.com/for-business/features/payments
- https://www.fresha.com/help-center/knowledge-base/sales/352-set-up-and-manage-tips
- https://mangomint.com/learn/how-to-split-payments
- https://www.mangomint.com/features/payments/
- https://glossgenius.com/pricing
- https://research.contrary.com/company/boulevard
- https://dupple.com/reviews/boulevard
- https://www.salontoday.com/1076846/boulevard-launches-boulevard-duo
- https://help.zenoti.com/en/point-of-sale/onboard-and-set-up/new-register-management.html (resumen del buscador; la página devolvió 403)
- https://help.zenoti.com/en/reports/finance/accounting/register-closure-report--v2-.html (resumen del buscador)
- https://agendapro.com/control-de-pagos
- https://agendapro.com/blog/facturacion-electronica-colombia
- https://squareup.com/help/us/en/article/8358
- https://developer.squareup.com/forums/t/tip-allocation-details-or-algorithm/12660
- https://squareup.com/us/en/ai
- https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html
- https://www.shopify.com/pos/features
- https://stripe.com/terminal
- https://www.7shifts.com/tip-pooling/

**Colombia: pagos y regulación**
- https://www.banrep.gov.co/es/bre-b
- https://www.elheraldo.co/economia/2025/09/19/las-llaves-de-bre-b-del-banco-de-la-republica-empezaran-su-funcion-oficial-desde-el-6-de-octubre/
- https://www.noticiascaracol.com/economia/bre-b-inicia-operacion-controlada-en-colombia-el-sistema-que-transformara-los-pagos-inmediatos-rg10
- https://www.larepublica.co/finanzas/en-abril-de-este-ano-mas-de-90-000-comercios-tenian-una-llave-de-bre-b-registrada-4386607
- https://www.portafolio.co/negocios/comercio/bre-b-se-dispara-en-los-comercios-llaves-activas-crecen-77-y-mueven-3-2-billones-502484
- https://docs.wompi.co/en/docs/colombia/metodos-de-pago/
- https://www.portafolio.co/innovacion/links-de-pago-una-herramienta-de-compra-que-crece-en-colombia-546929
- https://www.alegra.com/colombia/pos/
- https://sovos.com/es/blog/iva/la-resolucion-000165-dian-revoluciona-la-facturacion-electronica/
- https://actualicese.com/dian-modificaria-calendario-de-implementacion-de-documentos-equivalentes-electronicos/
- https://siemprealdia.co/colombia/recursos/guia-del-sistema-de-facturacion-electronica/
- https://www.cijuf.org.co/sites/cijuf.org.co/files/documentos_interes/BOLET%C3%8DN%20TRIBUTARIO%20062%2002-04-25.pdf (resumen del buscador)

**EE. UU.: propinas**
- https://www.cozen.com/news-resources/publications/2025/irs-clarifies-requirements-for-no-tax-on-tips-deduction
- https://www.cpapracticeadvisor.com/2026/04/10/irs-issues-final-regs-on-occupations-eligible-for-obbba-tips-deduction/181462/
- https://www.resourcefulfinancepro.com/news/no-tax-on-tips/

**IA**
- https://stripe.com/radar
- https://quickbooks.intuit.com/ai-accounting/
- https://ramp.com/intelligence

**Límites de esta investigación:** Clover, SumUp, Siigo POS, Nequi Negocios, Daviplata y Vagaro no se verificaron (sin cupo de búsqueda o con 404), y la funcionalidad de Toast IQ no se pudo leer (403). La regla de propina voluntaria en Colombia para barberías queda por confirmar.
