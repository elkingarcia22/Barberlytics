# Servicios y Productos — investigación

> Módulo: Catálogo (`/servicios`, `/servicios/orden`, `/servicios/:id`, `/productos`, `/productos/:id`).
> Fecha: 2026-10-17. Método: lectura del código del worktree, notas de decisiones del 2026-10-01 y
> búsqueda web. La búsqueda se cortó porque se agotó el cupo de búsquedas de la sesión. Varios
> puntos quedaron sin fuente y se marcan como **[sin verificar]**.

## Resumen ejecutivo

- El catálogo está bien rediseñado como **fuente de lo que se agenda y se vende**: alimenta la agenda, el cobro, la venta rápida, la reserva en línea y la nómina. Todo sale de un solo `db.services` / `db.products`.
- Sus límites son tres: **los precios no cambian por sede**, **los impuestos están partidos** (cada artículo tiene su `taxRate`, pero la reserva cobra con el primer grupo de impuestos) y **no hay existencias**. Hoy se pueden vender en línea productos que no están en la estantería.
- El mercado no se puede confirmar desde el código. La interfaz está en es-CO y los usuarios y clientes tienen celulares +57, pero la empresa de demo es una LLC de Boston que cobra en USD con *sales tax* estatal. Además, `useMoney` deja el USD fijo. El catálogo debe aceptar las dos fiscalidades.
- **Recomendación sobre inventario: sí, pero ligero.** Basta con existencias por sede, descuento automático al vender, mínimo con alerta y conteo. Las órdenes de compra y el consumo de insumos por servicio van después. Todos los competidores verticales que se revisaron tienen al menos esto.
- La palanca propia de una barbería no es el stock sino el **minuto de silla**. Ya tenemos precio, costo, duración, preparación y comisión por barbero, así que el **margen por hora de silla** y una matriz de «menu engineering» se pueden calcular sin datos nuevos. Es la apuesta de IA más barata y más diferencial.

## 1. Qué tiene hoy

| Capacidad | Estado | Dónde vive |
|---|---|---|
| Lista única de servicios y combos. Categorías como fichas-filtro con recuento; tipo y aviso guardados en la URL (`?categoria=`, `?tipo=`, `?aviso=`) | Hecho | `src/features/services/ServicesPage.tsx`, `servicesHome.tsx` |
| Pulso del catálogo: activos por sucursal, precio y duración medios, margen medio (solo si hay costo) | Hecho | `servicesHome.tsx` → `servicesPulse` |
| Avisos: activo que nadie ofrece, sin costo, activo pero oculto en la reserva | Hecho | `SERVICE_ALERTS` en `servicesHome.tsx` |
| Activar o desactivar en lote por sucursal desde la barra de acciones | Hecho | `useSetServicesActive` (`queries.ts`), `PUT /services/activation` |
| Alta y edición en drawer: nombre, categoría, precio, duración y, plegados, costo, impuesto, visibilidad, multiservicio, preparación (inicio o fin), tarjetas regalo y foto | Hecho | `ServiceFormDrawer.tsx`, `types.ts` (`serviceInputSchema`) |
| Combos: `kind: "combo"` con `includes` (mínimo 2). La duración sugerida es la suma; se muestra el ahorro frente a comprar suelto | Hecho | `servicesUtils.ts` (`comboTotals`), `ServiceProfilePage.tsx` |
| Orden de la reserva en línea: categorías y servicios arrastrables, con teclado | Hecho | `ServiceOrderPage.tsx`, `PUT /services/order` |
| Ficha del servicio: pestañas Resumen y Equipo. Equipo marca quién lo ofrece y lleva a la ficha del barbero para sus valores | Hecho | `ServiceProfilePage.tsx`, `PUT /services/:id/team` |
| Precio por barbero: precio, **precio de cliente nuevo**, **precio de cliente fiel**, duración, comisión dividida y comisión extra | Hecho (en Equipo) | `src/features/team/forms/ServicesForm.tsx` |
| Niveles de barbero | Solo nombre; **sin precio por nivel** | `src/features/team/LevelsPage.tsx`, `team/types.ts` (`levelSchema`) |
| Productos: precio de venta y de compra, margen y ganancia por unidad, SKU, marca, distribuidor, «A la venta / Uso interno», visibilidad en la reserva, activo por sede | Hecho | `src/features/products/*`, `types.ts` (`catalogProductSchema`) |
| Avisos de productos: sin costo, sin SKU, uso interno | Hecho | `productsHome.tsx` |
| Panel de categorías genérico compartido; al borrar una categoría, sus artículos pasan a «Sin categoría» | Hecho | `src/features/catalog/CategoriesDrawer.tsx` |
| Permisos por rol: costo y margen solo para quien edita; borrar solo el dueño | Hecho | `src/features/catalog/catalogAccess.ts` |
| Una foto por artículo (recorte incluido) | Hecho | `src/features/catalog/CatalogPhotoField.tsx`, `src/mocks/media.ts` |
| Relación con la agenda: `/calendar/catalog` devuelve los servicios activos en la sede y los productos activos y a la venta | Hecho | `src/mocks/calendar/handlers.ts` |
| Relación con la venta: cobro de cita con productos, venta rápida, venta sin cita | Hecho | `CheckoutDrawer`, `QuickSaleDrawer`, `WalkInSaleDrawer` (calendar) |
| Reserva en línea: servicios con foto; productos en carrusel y catálogo completo; paquetes prepagados | Hecho | `src/features/booking/steps/*`, `settings` (`packages`) |
| Nómina: ventas y comisión de productos por barbero | Hecho | `src/features/payroll/*` |
| Métricas: ranking de servicios y productos (cantidad e importe) | Hecho | `src/features/metrics/types.ts` (`services`, `products`) |
| Comisiones: qué se descuenta antes de comisionar (descuentos, impuestos, costo del servicio o del producto) | Hecho | `src/features/settings/sections/CommissionSettings.tsx` |
| Inventario, proveedores, órdenes de compra, código de barras escaneable, variantes, add-ons, consumo de insumos | **No existe** (producción tampoco lo tiene) | — |

Pruebas: `services.test.tsx` (197 líneas) y `products.test.tsx` (221 líneas) cubren la lista, los filtros, el lote y las categorías.

## 2. Análisis del módulo

### Fortalezas

1. **Una sola verdad.** El catálogo siembra la agenda con los mismos ids, y una cita conserva su servicio aunque este se desactive. Muchos productos del sector tienen el catálogo de la reserva en línea separado del de la caja; aquí no.
2. **UX de operación, no de configuración.** Se pasó de tres pestañas a una lista. Activar deja de ser una pantalla aparte y se hace en lote. El alta es un drawer en lugar de un asistente de tres pasos. Los avisos señalan dinero perdido: un servicio que nadie ofrece no se puede agendar.
3. **Base de datos económica ya rica.** Hay costo por artículo, comisión por barbero y servicio (`splitCommission`, `extraCommission`), reglas de deducción antes de comisionar, duración con preparación, y precios diferenciados por tipo de cliente (nuevo o fiel). Pocos competidores de la gama de entrada exponen el precio por tipo de cliente. **[sin verificar en todos]**
4. **Permisos finos.** Recepción ve el precio, no el costo. Borrar es una decisión de toda la barbería.
5. **Piezas reutilizables.** `CategoriesDrawer` y `CatalogPhotoField` son genéricos y están listos para una tercera familia (paquetes, membresías o insumos).

### Huecos funcionales

- **Precio por sede.** `price` es global y solo `active` depende de la sede (`activeBranchIds`). Las cuatro sedes de demo están en estados distintos de EE. UU.; en la vida real Boston y Salt Lake City no cobran igual. El barbero sí puede tener precio propio, la sede no.
- **Precio por nivel.** Los niveles (`LevelsPage`) existen pero no llevan precio. Para subir de precio a todos los «Senior» hay que editar barbero por barbero.
- **Add-ons reales.** «Extras» es una categoría más. No hay un complemento ligado a un servicio con su pregunta en la reserva («¿Le agregamos diseño de cejas?») ni reglas de mínimo y máximo. Fresha sí lo tiene (ver §4).
- **Recursos.** No se puede decir que un servicio necesita lavacabezas, sillón de afeitado o cabina. Square Appointments lo resuelve con «Require a resource».
- **Restricciones de horario por servicio** («solo de 8 a 12», «no en sábado»). Quedaron fuera el 2026-10-01.
- **Fotos.** Hay una por artículo; producción admite hasta 5 en productos.
- **Productos: sin variantes** (tamaño o aroma), **sin existencias** y **sin historial de ventas** en la ficha. El ranking existe en Métricas, pero la ficha no dice «se vendieron 14 este mes».
- **Ficha del servicio sin desempeño:** no dice cuántas veces se hizo, cuánto ingresó, qué barbero lo vende más ni el margen después de comisión.

### Deuda técnica y de consistencia

- **Moneda fija.** `useMoney` (`src/features/calendar/calendarFormat.ts`) formatea siempre en `USD`, aunque `settings.pricing.currency` y cada sede tienen su `currency`. `ServicesForm` de Equipo pinta un `$` fijo. Para Colombia (COP, sin decimales) esto rompe.
- **Impuestos partidos.** Servicios y productos guardan un `taxRate` numérico libre, pero el backend simulado de la reserva cobra con `taxPercent()`, que suma el **primer** grupo de `taxGroups` para todo el carrito (`src/mocks/booking/logic.ts:48`). El impuesto del artículo no manda y tampoco hay enlace a un grupo de impuestos. Con IVA del 19 % en servicios y productos excluidos o con otra tarifa en Colombia, o con *sales tax* que en algunos estados de EE. UU. grava productos y no servicios, esto da cifras incorrectas. **[tarifas concretas sin verificar]**
- **Combos con precio fijo.** Si sube el precio de un servicio incluido, el ahorro puede volverse negativo y la ficha solo muestra «—». Falta el aviso «combo más caro que por separado».
- **Wrappers duplicados.** `services/CategoriesDrawer.tsx` (74 líneas) y `products/ProductCategoriesDrawer.tsx` (69) son casi gemelos. No es grave, pero se puede unificar con un adaptador.
- **Precios con decimales en la demo** (35, 18, 14 USD). En COP no hay centavos, y `formatMoney` ya lo maneja si la moneda se corrige.

### UX

- El pulso y los avisos son buenos para el dueño, pero **no responden «¿qué servicio me deja más por hora?»**, que es la pregunta del dueño de barbería. El margen medio en porcentaje engaña: un diseño de cejas de 15 minutos con 80 % de margen puede rendir más por hora que un ritual de 90 minutos con 60 %.
- Costo y margen de servicios van ocultos por defecto. Es correcto para no asustar, pero se pierde la oportunidad de enseñar «sin costo registrado» como tarea pendiente.
- En productos, «Uso interno» ya es el germen del *backbar*: el producto existe, pero no se puede decir cuánto gasta cada servicio.

## 3. Qué le falta (tabla priorizada)

Impacto: A = alto, M = medio, B = bajo. Esfuerzo: S ≈ días, M ≈ 1–2 semanas, L ≈ más de 3 semanas.

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | Moneda por sede o cuenta en `useMoney` y en formularios (sin `$` fijo) | Bloquea Colombia; los precios en COP se ven mal | A | S |
| **P0** | Impuestos coherentes: el artículo apunta a un **grupo de impuestos** (o «exento»); la reserva, el cobro y la venta rápida calculan por línea; ajuste `taxInclusive` | Hoy el impuesto del artículo se ignora en la reserva; error fiscal en EE. UU. y Colombia | A | M |
| **P0** | **Existencias por sede** (inventario ligero): cantidad, descuento automático al cobrar, vender en línea y vender rápido; mínimo con alerta; «agotado» oculta el producto en la reserva | Se venden en línea productos sin stock; todos los competidores verticales revisados lo tienen | A | M |
| **P1** | Ajustes y conteo de stock con motivo (merma, dañado, uso interno) e historial | Sin historial no se confía en la cifra; Phorest y Loyverse lo tratan como básico | M | M |
| **P1** | Precio por sede (opcional, hereda del catálogo) | Multisede real con costos distintos | A | M |
| **P1** | Precio y duración por **nivel** (Junior, Senior, Master), con el precio del barbero como excepción | Subir precios en bloque; base para precios dinámicos | M | M |
| **P1** | **Add-ons** ligados a servicios (grupo, pregunta en la reserva, mínimo y máximo, precio y tiempo extra) | Aumenta el ticket medio sin pantalla nueva; Fresha lo tiene | A | M |
| **P1** | Desempeño en la ficha: veces o unidades, ingresos, margen después de comisión, top barberos, última venta | Lo que hay en Métricas, en contexto | M | S |
| **P1** | **Margen por hora de silla** en lista y ficha: (precio − costo − comisión) ÷ (duración + preparación) | La métrica que de verdad optimiza una barbería | A | S |
| **P1** | Aviso «combo más caro que por separado» y «combo con servicio inactivo» | Evita errores silenciosos de precio | M | S |
| **P2** | Proveedores (contacto, plazo de entrega) y **órdenes de compra** con recepción parcial | Paso natural tras las existencias; Vagaro, Mangomint, Phorest y Zenoti lo tienen | M | L |
| **P2** | **Consumo de insumos por servicio** (backbar): «el fade gasta 5 ml de cera y 1 cuchilla» | Costo real del servicio; Mangomint y Zenoti lo tienen | M | L |
| **P2** | Código de barras: escanear con la cámara del celular en venta y conteo; imprimir etiquetas | El SKU ya existe y hay aviso «sin SKU»; útil en cuanto haya existencias | M | M |
| **P2** | Transferencias de stock entre sedes | Solo para multisede con inventario | B | M |
| **P2** | Variantes de producto (tamaño o aroma) | Retail más serio; Loyverse lo da gratis | B | M |
| **P2** | Kits o paquetes de producto (cera + aceite) con stock de los componentes | Ya existen combos de servicio y paquetes prepagados; falta para productos | B | M |
| **P2** | Recursos por servicio (lavacabezas, cabina) | Evita choques; Square lo tiene (Premium) | M | L |
| **P2** | Restricciones de horario por servicio | Pendiente desde el rediseño | B | S |
| **P2** | Hasta 5 fotos por producto | Paridad con producción | B | S |
| **P2** | Factura electrónica o documento equivalente POS con la DIAN, vía proveedor tecnológico (Alegra o Siigo) | Necesario si Colombia es mercado real; no se construye en casa | A (CO) | L |

## 4. Benchmark

Leyenda: ✓ = documentado en la fuente consultada · ~ = parcial o solo en un plan superior · ✗ = la fuente dice que no · s/d = no se encontró dato (no significa que no exista).

| Función | Barberlytics | Booksy | Fresha | Square Appts | Vagaro | Boulevard | Mangomint | GlossGenius | Zenoti | Phorest | Loyverse | Lightspeed / Shopify |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Combos de servicios | ✓ | s/d | s/d | s/d | s/d | s/d | s/d | s/d | s/d | s/d | ✓ (combos y recetas) | s/d |
| **Add-ons** de servicio | ✗ | s/d | ✓ | s/d | s/d | s/d | ~ (product usage opcional) | s/d | s/d | s/d | — | — |
| Precio por barbero | ✓ | s/d | s/d | s/d | s/d | s/d | s/d | s/d | s/d | s/d | — | — |
| Recursos (silla, cabina) | ✗ | s/d | s/d | ~ (Premium) | s/d | s/d | s/d | s/d | s/d | s/d | — | — |
| Venta de producto en el mismo ticket | ✓ | ✓ | s/d | ✓ | s/d | s/d | ✓ | s/d | ✓ | s/d | ✓ | ✓ |
| Existencias y descuento al vender | ✗ | ✓ | s/d | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (gratis) | ✓ |
| Alerta de stock bajo | ✗ | ✓ | ~ (OC de «low stock») | ~ | ✓ | s/d | s/d | s/d | ✓ | ✓ | ✓ (gratis) | ✓ |
| Órdenes de compra / proveedores | ✗ | s/d | ✓ | ~ (planes de retail) | ✓ (auto por tendencia) | ✓ | ✓ (recepción parcial) | ~ (GeniusShop) | ✓ (auto) | ✓ (Auto) | ~ ($25/mes por tienda) | ✓ |
| Consumo de insumos por servicio | ✗ | ~ | s/d | s/d | ~ (registros de uso) | ~ (backbar) | ✓ | s/d | ✓ | ✓ (retail, professional, color) | ~ (recetas) | — |
| Código de barras | ~ (solo SKU) | s/d | s/d | ✓ | ✓ | s/d | s/d | ✓ | ✓ | ✓ (conteo en móvil) | ✓ | ✓ |
| Conteo de inventario | ✗ | s/d | s/d | s/d | s/d | ✓ | ✓ (historial) | s/d | ✓ | ✓ (con reconciliación) | ~ (pago) | ✓ |
| Transferencias entre sedes | ✗ | s/d | s/d | s/d | s/d | ✓ | s/d | s/d | ✓ | s/d | ~ (pago) | ✓ |
| Comisión por producto | ✓ (por barbero) | s/d | s/d | ✓ | s/d | s/d | ✓ | s/d | s/d | s/d | — | — |
| Precio dinámico | ✗ (sí por tipo de cliente) | s/d | ✓ Smart pricing | s/d | s/d | s/d | s/d | s/d | s/d | s/d | — | — |
| IA de reposición | ✗ | s/d | s/d | s/d | ~ (OC por tendencia) | ~ (sugiere qué se agota) | s/d | s/d | ✓ AI Inventory | s/d | — | ✓ |

Fuera del sector: **Toast** tiene Menu Upsells con IA. **Shopify** tiene estados de inventario (disponible, comprometido, no disponible, entrante) y descripciones generadas. **Alegra** y **Siigo** combinan POS, inventario y facturación ante la DIAN. **Odoo** no se pudo consultar en esta ronda.

### Hallazgos

1. **El inventario es lo mínimo esperable, no un diferenciador.** Booksy anuncia «Sell products & track inventory» en su página de barberos. Loyverse da gratis existencias, alerta de stock bajo, combos, recetas y variantes, y cobra 25 USD al mes por tienda por órdenes de compra, transferencias, conteos, valoración y etiquetas. Esa es una buena referencia de dónde cortar entre básico y avanzado.
2. **El consumo de insumos por servicio separa a los premium.** Mangomint («Product Usage»: productos obligatorios u opcionales por servicio, cantidades por defecto y ajuste en el cobro), Zenoti (uso esperado por tratamiento, con descuento al hacerse el servicio) y Phorest (stock Retail, Professional y Color) lo tienen. Es la base del «costo real del servicio».
3. **Las órdenes de compra se automatizan con el umbral.** Vagaro genera órdenes desde tendencias de venta y alertas, y permite recibir parcialmente. Phorest tiene un botón «Auto». Zenoti genera las órdenes de todo lo que llegó a su nivel, con el último proveedor.
4. **El add-on es la palanca de ticket que nos falta.** Fresha los agrupa, los liga a varios servicios, les pone precio y tiempo extra, límites de selección y una pregunta propia en la reserva. Su «upselling» con descuento existe desde 2021.
5. **Fresha ya vende precio dinámico** («Smart pricing»): sube en hora punta y baja en hora valle, por equipo, servicio y sede, solo en la reserva en línea, y con un informe de desempeño. Es la prueba de que el sector lo acepta.
6. **Square resuelve los recursos físicos** (cabina, equipo, silla) atados al servicio, solo en Premium.

## 5. Mercado y tendencias

- **Mercado (lo que dice el código).** Señales mixtas. Por Colombia: interfaz `es-CO`, celulares +57 en cuentas y clientes y Bogotá entre las ciudades de clientes. Por EE. UU.: la empresa de demo es «Barbería Demo LLC» en Boston, con sedes en MA, NC, RI y UT, moneda USD y un grupo de impuestos «Estatal 6,25 %». La lectura más prudente es que hoy el producto atiende **barberías hispanohablantes**, con la demo en EE. UU. y raíces o usuarios en Colombia. El catálogo debe soportar **sales tax por estado** e **IVA más facturación DIAN**. Hay que confirmarlo con el equipo de producto.
- **Colombia: el documento equivalente electrónico POS.** La Resolución DIAN 165 de 2023 crea el documento equivalente electrónico, que reemplaza al tiquete de máquina registradora POS. Según Siigo, el calendario fue: grandes contribuyentes desde el 1 de mayo de 2024, declarantes desde el 1 de junio de 2024 y los demás desde el 1 de julio de 2024. Se emite con los servicios de la DIAN o con un proveedor tecnológico autorizado y lleva QR. La norma tuvo modificaciones posteriores (Resolución 8 y 119 de 2024); **el estado vigente a octubre de 2026 está sin verificar**. Implicación: una venta de producto o servicio a consumidor final en una barbería responsable de IVA necesita su documento. Lo sensato es **integrarse** con Alegra o Siigo (ambos se presentan como proveedores autorizados con POS e inventario), no construirlo.
- **IVA.** La tarifa general y la figura de «no responsable de IVA» condicionan si la barbería cobra IVA. **No se pudo verificar en esta ronda.** Por eso el diseño debe permitir «exento / no responsable» por cuenta y grupos por artículo.
- **Tendencias 2025–2026 observadas:**
  1. La **IA de inventario pasa de umbrales a pronóstico**. Zenoti prevé el consumo leyendo la agenda futura. Lightspeed lanzó «Seasonality Forecasting» (abril de 2025) y sugiere cantidades con historial y quiebres de stock; afirma unos 26 % menos días sin stock en los productos más vendidos (cifra de la propia empresa).
  2. **Upsell en el punto de venta con IA.** Toast lanzó Menu Upsells (mayo de 2025) y reporta unos 6 % más de ticket medio en un bar durante un fin de semana: una sola anécdota, no un estándar.
  3. **Precio dinámico en servicios con cita** (Fresha Smart pricing).
  4. **Contenido generado** para fichas de producto (Shopify Magic), con la advertencia de Shopify de que sus datos de lenguaje vienen sobre todo de Norteamérica: el español regional necesita revisión.

## 6. IA

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos necesarios: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Rentabilidad por minuto de silla y matriz de «menu engineering»** | Clasifica cada artículo por popularidad y margen en Estrellas, Caballos de tiro, Enigmas y Perros (método de Kasavana y Smith, 1982). La IA mantiene la matriz al día y explica qué hacer | Restaurantes (Crunchtime, Getmeez, Petpooja) | Margen después de comisión **por hora de silla**: «el afeitado clásico es un Perro: 45 min, poco pedido; súbelo 10 % o sácalo de la reserva» | **Sí**: precio, costo, duración, preparación, comisión por barbero, ranking de Métricas. Falta costo de insumos real (P2) | Predictiva y analítica, explicada con generativa | **Baja** | Costos sin registrar sesgan la matriz; mostrar cobertura («8 de 9 con costo») |
| 2 | **Precio dinámico por franja** | Sube en hora punta y baja en hora valle | Fresha Smart pricing; Uber surge (sube cuando la demanda supera a los conductores, por zona y en tiempo real) | Martes a las 10:00 con 15 % menos solo en línea; sábado con 10 % más en Master. Empieza con reglas sugeridas por la IA y confirmadas por el dueño | **Sí en parte**: ocupación por hora (`byHour`, agenda), precio por tipo de cliente. Falta elasticidad (requiere experimentar) | Predictiva y agéntica (propone reglas) | Media | Percepción de abuso (clientes fieles); solo en línea y con tope; respetar precio fiel |
| 3 | **Pronóstico de demanda y reposición** | Prevé qué se agota y sugiere la orden | Zenoti AI Inventory (lee la agenda futura y los plazos del proveedor); Lightspeed (cantidades sugeridas y estacionalidad); Vagaro (OC por tendencia) | «Te quedan 6 ceras; con las citas de la semana se van 9; pide 12 a Distribuidora X» | **No aún**: requiere existencias (P0) y proveedores (P2). Agenda y ventas, sí | Predictiva y agéntica (borrador de OC) | Media (cuando haya stock) | Pocas unidades: los modelos simples (media móvil más agenda) bastan; no sobreingeniería |
| 4 | **Venta cruzada en cobro y reserva** | Sugiere el artículo que suele ir con lo elegido | Amazon item-to-item collaborative filtering (2003): «B se relaciona con A si quien compra A compra B más que el promedio»; Toast Menu Upsells | Al cobrar un fade, «aceite de barba (la compran 1 de cada 4 con barba)». En la reserva, ordenar el carrusel de productos por afinidad con el servicio y la última compra del cliente | **Sí**: citas con líneas de producto, ventas rápidas, historial por cliente | Predictiva (y conversacional en el chat de reserva) | Baja–media | Insistencia molesta; limitar a una sugerencia; no sugerir agotados (depende del P0) |
| 5 | **Combos y add-ons sugeridos** | Detecta pares frecuentes y propone empaquetarlos con precio | Derivado de la cesta de Amazon; Fresha upsell con descuento | «Corte + cejas sale en el 18 % de las visitas; un combo a −10 % mantiene tu margen por hora» | **Sí**: servicios por cita, precios, duraciones | Predictiva y generativa (nombre y descripción) | Baja | Canibalizar el precio suelto; mostrar el impacto esperado antes de crear |
| 6 | **Detección de servicios poco rentables o que sobran** | Alerta de servicios con margen por hora bajo, sin barbero, que nadie pide o con duración real mayor que la configurada | Variante del caso 1 | «El tratamiento capilar dura 58 min de media, configurado en 45: estás regalando 13 min» | **Sí**: horas reales de inicio y cierre en la agenda (tiempos de cita), catálogo | Predictiva | Baja | Datos ruidosos si no se marca bien el fin de la cita |
| 7 | **Descripciones y fotos generadas** | Redacta la ficha desde título y palabras clave; mejora la foto | Shopify Magic (en la descripción, con tono elegible; idiomas, español incluido) | Descripción de servicio y producto para la reserva y Google; quitar el fondo a la foto del producto | **Sí**: nombre, categoría, marca, foto | Generativa | Baja | Promesas falsas («elimina la caspa»); revisión humana obligatoria |
| 8 | **Asistente de catálogo (agente)** | «Sube 5 % todos los cortes en Utah», «Crea un combo de padre e hijo» | Patrón general de copilotos (Shopify Sidekick) **[sin verificar en detalle]** | Cambios en lote con vista previa y confirmación, en la barra de acciones | **Sí**: API de catálogo existente | Conversacional y agéntica | Media | Cambios masivos erróneos; siempre previsualizar y permitir deshacer |

Aerolíneas (*yield management*): es el antecedente clásico del caso 2, pero **no se consultó fuente en esta ronda**.

### Top 5 apuestas

1. **Margen por hora de silla y matriz del catálogo** (caso 1 + 6). Usa solo datos que ya existen, responde la pregunta del dueño y alimenta todo lo demás. Se entrega en la lista (columna), en la ficha y como un aviso nuevo.
2. **Venta cruzada en cobro y reserva** (caso 4). Algoritmo simple y probado, con datos que ya tenemos; mueve el ticket medio y la comisión de producto del barbero.
3. **Add-ons y combos sugeridos** (caso 5 + add-ons P1). La IA descubre el par y la UI lo convierte en add-on o combo con un clic.
4. **Reposición sugerida** (caso 3), en cuanto exista el inventario ligero. Empieza con «días de cobertura» calculados con ventas y agenda. Deja un borrador de pedido, nunca lo envía solo.
5. **Precio por franja asistido** (caso 2). La IA propone reglas de hora valle con su impacto estimado y el dueño las activa; solo en la reserva en línea y respetando el precio de cliente fiel.

## 7. Hoja de ruta en 3 fases

**Fase 1 — Cimientos fiscales y de dinero (2–4 semanas)**
- Moneda por sede o cuenta (`useMoney`, formularios).
- Impuesto por línea con grupo de impuestos o exento; la reserva, el cobro y la venta rápida usan el mismo cálculo; `taxInclusive`.
- **Margen por hora de silla** en lista y ficha; desempeño en la ficha (unidades, ingresos, top barberos).
- Avisos nuevos: combo más caro que por separado, duración real mayor que la configurada.
- Criterio de éxito: un dueño en COP y uno en USD ven precios, impuestos y márgenes correctos de punta a punta.

**Fase 2 — Inventario ligero y ticket (4–6 semanas)**
- Existencias por sede, descuento al vender (cobro, venta rápida, reserva), mínimo y alerta, «agotado» oculto en línea.
- Ajustes con motivo e historial; conteo con la cámara del celular (el SKU ya existe).
- Add-ons ligados a servicios con su paso en la reserva.
- Precio por nivel y, opcional, por sede.
- IA: venta cruzada (item-to-item) en cobro y carrusel; combos y add-ons sugeridos.

**Fase 3 — Operación avanzada e IA de negocio (6–10 semanas)**
- Proveedores, órdenes de compra con recepción parcial y transferencias entre sedes.
- Consumo de insumos por servicio (backbar) que alimenta el costo real.
- IA: reposición sugerida (borrador de orden), precio por franja asistido, asistente de catálogo con vista previa.
- Colombia: integración con un proveedor tecnológico DIAN (Alegra o Siigo) para la factura o el documento equivalente POS.
- Opcionales según demanda: variantes, kits de producto, recursos por servicio, restricciones de horario, varias fotos.

## Fuentes

Páginas abiertas y leídas en esta investigación:

- https://www.vagaro.com/pro/inventory
- https://biz.booksy.com/en-us/who-loves-us/barber
- https://biz.booksy.com/blog/the-best-salon-inventory-management-software-options
- https://www.mangomint.com/blog/introducing-product-usage/
- https://mangomint.com/features/retail-and-inventory
- https://www.fresha.com/help-center/knowledge-base/catalog/101649-create-service-add-ons
- https://www.fresha.com/blog/october-feature-round-up-
- https://zenoti.com/platform/inventory
- https://www.zenoti.com/es/ai-workforce/ai-inventory-intelligence
- https://loyverse.com/advanced-inventory
- https://squareup.com/help/us/en/article/7065-square-appointments-resource-management
- https://www.lightspeedhq.com/news/lightspeed-unveils-seasonality-forecasting-to-help-retailers-increase-profit-and-reduce-days-out-of-stock/
- https://www.silicon.co.uk/press-release/toast-launches-toastiq-to-superpower-the-future-of-restaurants
- https://www.amazon.science/the-history-of-amazons-recommendation-algorithm
- https://www.uber.com/us/en/drive/driver-app/how-surge-works/
- https://www.siigo.com/blog/resolucion-165-de-2023/

Consultadas solo a través del resumen del buscador (sin abrir la página completa):

- https://www.fresha.com/help-center/knowledge-base/marketing/101321-enable-smart-pricing y https://www.fresha.com/help-center/knowledge-base/marketing/150-review-smart-pricing-performance
- https://www.fresha.com/help-center/knowledge-base/marketing/101322-edit-and-clear-smart-pricing
- https://calculated-performance.outseta.com/support/kb/articles/pWrOdgmn/how-to-submit-an-order-form (guía de terceros sobre las órdenes de stock de Fresha)
- https://www.joinblvd.com/blog/must-have-salon-inventory-management y https://www.joinblvd.com/blog/salon-inventory-management-software
- https://phorest.helpjuice.com/49563-stock-inventory/305519-how-to-do-a-stock-take-gb, https://phorest.helpjuice.com/49563-stock-inventory/305518-stock-list-gb, https://phorest.helpjuice.com/44079-stock-inventory/305522-how-to-create-an-order-of-stock
- https://glossgenius.com/customers/customers-overview
- https://www.merchantmaverick.com/reviews/square-appointments-review y https://www.merchantmaverick.com/reviews/loyverse-review/
- https://help.shopify.com/en/manual/products/inventory/managing-inventory-quantities/inventory-states
- https://www.eesel.ai/blog/shopify-magic (guía de terceros sobre Shopify Magic)
- https://www.cs.umd.edu/%7Esamir/498/Amazon-Recommendations.pdf (Linden, Smith y York, 2003)
- https://www.crunchtime.com/blog/blog/restaurant-menu-engineering-matrix, https://www.getmeez.com/blog/the-ultimate-guide-to-menu-engineering, https://blog.petpooja.com/growth-scaling/use-ai-for-menu-engineering-restaurants/
- https://normograma.mintic.gov.co/docs/pdf/resolucion_dian_0165_2023.pdf
- https://www.portafolio.co/contenido-patrocinado/alegra-com-aliado-de-las-mipymes-para-eliminar-la-factura-en-papel-598818
- https://www.siigo.com/sistema-pos/

No consultados por falta de cupo de búsqueda: Odoo, Square for Retail (detalle), tarifas de IVA vigentes en Colombia, *yield management* de aerolíneas y las funciones de add-ons de Booksy y Vagaro.
