# Experiencia del barbero — investigación

Investigación del 2026-10-18 sobre lo que vive el **barbero** dentro de Barberlytics: «Lo que llevo» (comisión y salario)
y «Mi negocio» (renta) en `/mi-pago`, y lo que ve con su rol en Calendario, Clientes y Métricas. Solo lectura: no se
tocó código. Se revisó el código en `b163627`. Fuentes internas: `src/features/payroll/` (`MyPayPage.tsx`,
`myPayHome.tsx`, `PayrollMemberDrawer.tsx`), `src/mocks/payroll/`, `src/features/access/`, `calendarAccess.ts`,
`customerAccess.ts`, `useMetricsFilters.ts`, `src/mocks/metricsTabs.ts`, `src/mocks/register/handlers.ts`,
`docs/ROLES_PLAN.md`, `ai-tools/CODEMAP.md` y los informes [07 · Nómina](07-nomina.md) y [08 · Equipo](08-equipo.md).
Aquí no se repite la vista del dueño (periodos, aprobación, dispersión, Ley 2466): se mira todo desde la silla.
Fuentes externas al final; lo que un proveedor dice de sí mismo va como **declarado** y lo no verificado con «?».

## Resumen ejecutivo

1. **El barbero sí puede entender su pago cita por cita.** «Lo que llevo» y «Mi negocio» muestran la regla aplicada
   (sin cita, sin preferencia, nuevo, recurrente) y el % de cada servicio. Desde la fase 1, el cálculo cuadra con la caja
   (base = lo cobrado al precio del barbero, tramo por ciclo, renta en %). Pocos competidores explican tanto.
2. **Pero ve dos «netos» distintos.** Métricas › Barberos le muestra «Tu neto» con otra fórmula (40 % fijo o el % básico
   sobre el precio, sin reglas, sin productos y, al de renta, como si cobrara comisión). Si dos pantallas no coinciden,
   el barbero deja de creerle a las dos. Es el primer arreglo.
3. **No sabe si ya le pagaron ni por qué cambió la cifra.** `/mi-pago` ignora el estado del periodo (aprobado, pagado,
   con qué) y no lista los ajustes: un adelanto baja «Lo que llevas» sin explicación visible. Al de renta tampoco le
   muestra sus pagos de renta uno a uno.
4. **El celular cuenta su agenda, no su día.** El calendario ya se recorta a su columna, pero en el teléfono oculta
   «cobrado de previsto» y en ninguna parte dice «hoy llevas X». Faltan metas, reseñas propias, clientes por volver
   desde su lado y avisos de pago. Squire, Square, Uber y Toast ponen la ganancia del día en el bolsillo del trabajador.
5. **El barbero de renta no tiene «su negocio» completo.** Ya hay renta, deducciones, «guardado por la barbería» y
   gastos propios, pero no se juntan en una utilidad, no se ve el % de cada deducción y no hay nada de impuestos
   (1099 y *No Tax on Tips* en EE. UU.; IBC, PILA y factura en Colombia). Además, la caja espera el efectivo que el
   rentero cobró para sí: el cierre del día descuadra.
6. **Recomendación.** Fase 1 «una sola verdad» (misma cifra en todas partes, estado del pago, ajustes, «hoy» en el
   celular, recorte en el servidor). Fase 2 «su negocio y su carrera» (utilidad del rentero, reseñas, metas, clientes por
   volver, comprobante). Fase 3 «IA a su lado» (explicar el pago, resumen semanal con una acción, apartado de impuestos).

---

## 1. Qué tiene hoy

**Cómo entra el barbero.** El rol sale de `useAccess()` (`src/features/access/access.ts`). La sesión todavía no trae
`memberId`: se usa una persona de ejemplo por rol (`DEMO_MEMBER`: Andrés Beltrán `team-04` por comisión, Paola
Zuluaga `team-30` por renta). Ambos barberos aterrizan en `/calendario` (`ROLE_HOME`) y su alcance es `own`.
El menú le muestra Inicio (Métricas), «Lo que llevo» o «Mi negocio», Calendario y Clientes; el de renta suma Gastos
y Transacciones propias (`navigation.ts`, `canOpen`).

### Inventario

| Área | Qué ve el barbero | Dónde |
|---|---|---|
| **Lo que llevo** (comisión) | 4 tarjetas: lo que llevas (neto), comisión de servicios «sobre X vendidos», comisión de productos, propinas («son tuyas, completas»). Lista de servicios cobrados con fecha, cliente, servicio, regla · %, venta, comisión y propina. Panel «Ver la cuenta completa» con reglas en insignias, la suma y la resta, y cada cita | `MyPayPage.tsx`, `myPayHome.tsx`, `PayrollMemberDrawer.tsx` |
| **Lo que llevo** (salario) | Igual, con «Salario: X por semana» en lugar de comisión de servicios | `CommissionCards` |
| **Mi negocio** (renta) | 4 tarjetas: tus ventas (servicios + productos), guardado por la barbería (lo que entró por la caja y es suyo), para la barbería (renta + deducciones), neto o «Debes X» / «Al día». Alerta cuando debe, con renta, deducciones, guardado y ya pagado. Lista «Tus cuentas del periodo» con la deducción por cita | `RentCards`, `payroll.mine.*` en `es.ts` |
| Periodo | `PeriodNavigator` día / semana / mes; por defecto la semana, o el mes si el ciclo es mensual | `usePayrollFilters.ts` |
| Cálculo | Base = lo cobrado al precio del barbero menos lo que mande Configuración › Comisiones; tramo de escala por ciclo; deducción de renta en % de la venta; quién cobró cada cuenta (caja o barbero); devoluciones; ajustes del periodo | `src/mocks/payroll/compute.ts` |
| Calendario | Solo su columna en todas las vistas; sin forzar ni mover a otro; bloqueos según la matriz; cifras propias («cobrado de previsto», que en el teléfono se oculta); lista de espera suya y de «cualquier barbero»; resumen del día por reglas | `calendarAccess.ts`, `CalendarPage.tsx:723`, `dayBrief.ts` |
| Clientes | Solo «los suyos» (lo prefieren o tuvo cita con él en 12 meses); dinero visible; contacto y notas médicas según `client-info`; avisos «en riesgo», «le toca volver» y cumpleaños sobre sus clientes; en la ficha, las reseñas que dejó cada cliente | `customerAccess.ts`, `customersHome.tsx:172`, `CustomerRelationship.tsx` |
| Métricas | Comisión: Negocio, Clientes, Barberos; renta: además Marketing. Fijas a su ficha (`?barber=` se ignora). En Barberos: «Tu neto», «Tu ocupación», servicios, cancelación y % de propinas | `useMetricsFilters.ts`, `BarbersDashboard.tsx`, `mocks/metricsTabs.ts` |
| Gastos (renta) | Sus gastos de silla («herramientas, productos y lo que pagas por tu cuenta»); sin estado de resultados | `ExpensesPage.tsx:56-61` |
| Su ficha | Puede leerla; no editar nada («lo que quiera cambiar se lo pide a quien gestiona») | `teamAccess.ts:73` |
| Avisos | Comisión: cambios de cita, cliente nuevo, recordatorio, lista de espera, vacaciones aprobadas o negadas, salud de métricas. Renta: además estados de clientes. **Ninguno de pago** | `notificationCatalog.ts:56-57` |
| Pruebas | «Lo que llevo» y «Mi negocio» con renta, salario y `memberId` | `payroll.test.tsx` |

**Lo que no existe para el barbero:** estado de su pago (aprobado o pagado), lista de ajustes y pagos de renta en su
vista, comprobante, ganancia de hoy, metas, reseñas agregadas («mi reputación»), ranking, utilidad del rentero,
apartado de impuestos, certificado de ingresos, pago al instante, solicitud de vacaciones (pendiente en
`ROLES_PLAN.md`), «Mi ficha» editable (foto, galería, horario del rentero) y avisos de dinero.

---

## 2. Análisis

### Fortalezas

- **Transparencia por cita, con la regla a la vista.** Es lo que Uber hizo con el desglose por viaje (tarifa, propina,
  promoción, comisión de la plataforma). El barbero puede reclamar con datos: «esta cita era recurrente, no nuevo».
- **El cálculo ya cuadra con la caja** (fase 1): precio del barbero, lo cobrado, tramo por ciclo y deducción en %.
  Los cuatro errores de cálculo de [07](07-nomina.md) están resueltos en `compute.ts`.
- **«Mi negocio» resuelve la pregunta del rentero que nadie responde**: ¿quién tiene mi plata? «Guardado por la
  barbería» separa lo que entró por la caja (tarjeta, enlace, en línea) de lo que cobró en efectivo. Fresha y
  GlossGenius lo resuelven con cuentas separadas; nosotros lo explicamos sin mover el dinero.
- **El «debes» se explica en una frase**, con cada componente. Es la duda más frecuente del rentero según la ayuda.
- **Privacidad de origen.** Columna, clientes, métricas y gastos recortados a él; `?barber=` ajeno no abre las cifras
  de otro.
- **Lenguaje de la silla.** «Lo que llevas», «Para la barbería», «Son tuyas, completas»: nada de «payout» ni «net».

### Huecos

1. **Dos cifras de ganancia que no coinciden.** «Tu neto» de Métricas usa el % básico (o 40 % por defecto) sobre el
   precio, sin reglas por tipo de cliente, sin comisión de productos, sin escala ni ajustes; al de renta le calcula una
   comisión que no cobra (`metricsTabs.ts:118-134`). «Lo que llevo» usa el cálculo de nómina.
2. **No sabe en qué va su pago.** `GET /payroll` devuelve `run` (aprobado o pagado, por quién, con qué, referencia) e
   `history`, pero `MyPayHome` no los usa. El barbero no sabe si la cifra es provisional o ya es definitiva.
3. **Los ajustes no se ven.** El panel recibe `adjustments` solo en Nómina; en `/mi-pago` sale una línea «Ajustes −X»
   sin decir que fue un adelanto del martes. Igual con los pagos de renta del rentero.
4. **El día no se cuenta en plata.** El calendario no muestra lo ganado hoy (solo ventas, y oculto en el teléfono).
   El barbero piensa en «hoy hice tanto»; Uber, Toast y Square lo ponen al frente.
5. **Su reputación no existe como pantalla.** Las reseñas por barbero existen (`GET /barbers/:id/reviews`) y se ven
   sueltas en la ficha de cada cliente, pero no hay promedio, tendencia ni comentarios para él.
6. **Sin metas ni progreso.** La escala no dice cuánto falta para el siguiente tramo; no hay meta de ventas, de producto
   ni de rebooking. `ROLES_PLAN` pide «nivel y brecha al siguiente» para el de comisión.
7. **El rentero no ve su utilidad.** Ventas, renta, deducciones y gastos viven en dos pantallas; nadie resta. Tampoco
   ve qué % le descuentan por cliente sin cita, nuevo o sin preferencia (el panel dice «una deducción por cada
   cliente», sin cifra).
8. **Nada de impuestos.** En EE. UU. el rentero y el contratista pagan sus impuestos por su cuenta; en Colombia el
   independiente cotiza sobre el 40 % de su ingreso. No hay certificado de ingresos, apartado sugerido ni exportación.
9. **Clientes por volver sin acción.** El aviso existe en Clientes, pero el barbero no puede escribirle a su cliente
   desde ahí con su nombre y su hueco (el enlace de WhatsApp de la fase 2 llegó a la ficha; falta en el aviso y en lote).
10. **No puede cuidar su vitrina.** No edita su foto, galería ni descripción; el rentero tampoco su horario (pendiente
    en [08](08-equipo.md)).

### Deuda técnica

- **Recorte en el cliente, no en el servidor.** `GET /payroll` acepta `memberId` de la URL; sin él, entrega a todo el
  equipo (`mocks/payroll/handlers.ts:99-103`). El calendario baja el día de toda la sucursal y filtra en el navegador
  (`calendarAccess.ts:68-75`). En el mock da igual; con un backend real, cualquier barbero vería la nómina y las citas
  de los demás. La sesión debe traer `memberId` y el servidor recortar.
- **Periodos que no casan.** La aprobación se guarda por `from/to` exactos (`handlers.ts:51`). Si el dueño aprueba la
  quincena, el barbero que mira la semana nunca ve esa foto fija, ve lo recalculado. Y el navegador no tiene quincena
  (`usePayrollFilters.ts:8,20`): con ciclo quincenal cae en semana.
- **Métricas con datos de relleno.** «Fidelidad» del tablero de barberos es aleatoria (`metricsTabs.ts:154`) y la
  ocupación supone 10 citas por día sin mirar su horario (`:119`).
- **Textos que quedaron atrás.** La ayuda del neto del rentero dice «Propinas menos renta y deducciones»
  (`es.ts:2830`, `en.ts:2794`); hoy es «guardado por la barbería menos renta y deducciones». La de «Lo que llevas» no
  menciona los ajustes (`es.ts:2817`).
- **Sin eventos de pago en avisos** (`notificationCatalog.ts:56-57`): el día que exista «te pagaron», no hay dónde
  colgarlo.
- **Moneda fija en USD** en `useMoney` (heredado de [07](07-nomina.md)): un barbero en Colombia ve dólares.

### Fricciones de UX

- **La primera pantalla es la agenda, no el dinero.** Bien para trabajar; mal para la pregunta del final del día. Falta
  una franja «Hoy: 7 servicios · llevas $X · te faltan $Y para el 50 %».
- **«Lo que llevas» mezcla tiempos.** En semana, el salario se suma completo aunque sea martes, y las comisiones van
  al día de hoy. El número no es «lo que llevo» sino «lo que llevaré si sigo».
- **El panel tiene 7 columnas en el celular** y es el lugar donde se explica todo. En el teléfono debería ser una
  tarjeta por cita.
- **La cuenta del rentero exige saber contabilidad.** «Guardado», «Para la barbería», «Saldo», «Pagó de renta»:
  cuatro cifras con signos distintos. Falta una línea final en lenguaje llano: «Esta semana te quedan $X» o
  «Le debes $X a la barbería; págala antes del viernes».
- **Las migas dicen «Inicio» y llevan a Métricas** aunque el barbero entra por el calendario (`CalendarPage.tsx:705`).
- **Sin salida para reclamar.** Si una cita está mal, no hay «esto no cuadra» que le llegue al dueño con la cita.

### Errores encontrados

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | **El cierre de caja espera el efectivo del rentero.** Nómina asume que lo que el de renta cobra en efectivo «ya lo tiene»; la caja suma todo el efectivo de todas las citas cobradas, de cualquier barbero. Cada día con cobros en efectivo de un rentero, el cierre sale con faltante | `src/mocks/register/handlers.ts:49-62` frente a `src/mocks/payroll/compute.ts:135-144,167` |
| Alta | **Dos netos distintos para el mismo barbero.** Métricas › Barberos calcula «Tu neto» con el % básico o 40 % fijo, sin reglas, productos, escala ni ajustes; al de renta le aplica comisión | `src/mocks/metricsTabs.ts:118-134` |
| Media | **Se pueden aprobar periodos que se cruzan** (la semana y el mes que la contiene): dos fotos fijas, el mismo trabajo pagado dos veces | `src/mocks/payroll/handlers.ts:51,191` |
| Media | **`/mi-pago` no muestra si el periodo está aprobado o pagado**, aunque la respuesta lo trae | `src/features/payroll/MyPayPage.tsx:109-169` |
| Media | **El barbero no ve sus ajustes ni sus pagos de renta**: el panel se abre sin `adjustments` | `src/features/payroll/MyPayPage.tsx:166`, `PayrollMemberDrawer.tsx:92-93` |
| Media | Cualquier sesión puede registrar o borrar pagos de renta y pedir la nómina de todos (sin control de rol) | `src/mocks/payroll/handlers.ts:99-103,147-178` |
| Baja | Texto del neto del rentero desactualizado («Propinas menos renta…») | `src/app/i18n/es.ts:2830`, `en.ts:2794` |
| Baja | El panel del rentero no dice el % de cada deducción | `src/features/payroll/PayrollMemberDrawer.tsx:142` |
| Baja | «Fidelidad» de Métricas › Barberos es un número al azar | `src/mocks/metricsTabs.ts:154` |

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | **Una sola cifra de ganancia**: Métricas › Barberos usa el mismo cálculo de nómina (o enlaza a «Lo que llevo» y deja de calcular) | Hoy el barbero ve dos netos distintos; sin confianza, el detalle por cita no sirve | A | S |
| P0 | **Estado del pago y sus movimientos en `/mi-pago`**: «Provisional · Aprobado el… · Pagado el… por Nequi, ref. …»; lista de ajustes con nota y fecha; pagos de renta uno a uno | Responde «¿ya me pagaron?» y «¿por qué bajó?» sin preguntarle al dueño | A | S |
| P0 | **«Hoy» en el celular**: en el calendario del barbero, lo ganado hoy (comisión + propinas, o neto del rentero) visible también en el teléfono, y la vista Agenda por defecto en pantallas chicas | Es la pregunta diaria; Uber, Toast y Square la responden al frente | A | S |
| P0 | **Recorte en el servidor** con `memberId` en la sesión: nómina, calendario, clientes y transacciones solo devuelven lo suyo | Privacidad entre colegas; requisito para salir a producción con barberos dentro | A | M |
| P0 | **Cuadrar el efectivo del rentero en la caja** (lo cobrado por él no se espera en el cajón, o se marca «lo cobró el barbero») y una sola definición en el contrato | Sin esto, cada cierre con un rentero descuadra | A | S |
| P1 | **Utilidad de «Mi negocio»**: ventas − renta − deducciones − gastos de su silla − comisión de tarjeta = lo que te queda; % de cada deducción a la vista; frase final en lenguaje llano | El rentero es un negocio (`ROLES_PLAN` §2); hoy tiene las piezas sueltas | A | M |
| P1 | **Mi reputación**: promedio de estrellas, tendencia, últimas reseñas y frases repetidas; pedir reseña a sus clientes | theCut y Booksy viven de la reseña; ya tenemos reseñas por barbero | A | S–M |
| P1 | **Metas y brecha al siguiente tramo**: «te faltan $X para el 45 %», meta semanal de producto o rebooking, barra de progreso | Motiva y explica la escala; Phorest lo tiene (ver [08](08-equipo.md)) | A | M |
| P1 | **Mis clientes por volver** con botón de WhatsApp prellenado (su nombre, su hueco libre) y en lote | Es el ingreso futuro del barbero; la regla de ritmo ya existe | A | S–M |
| P1 | **Comprobante del periodo** (PDF y enlace por WhatsApp) con citas, ajustes y estado | Prueba para disputas, préstamos y arriendo; producción ya tiene PDF | A | S–M |
| P1 | **Avisos de dinero**: pago aprobado, pago hecho, renta por vencer, ajuste nuevo | Hoy no hay ningún evento de pago para barberos | M | S |
| P1 | **Mi ficha editable**: foto, galería, descripción, Instagram; el rentero, también horario y precios | Su vitrina en la reserva; prerrequisito del autoservicio | A | M |
| P1 | **«Esto no cuadra»** desde una cita del pago: abre una conversación con el dueño con la cita adjunta | Convierte la disputa en un registro; reduce discusiones de pasillo | M | S |
| P1 | **Certificado de ingresos** (año o rango) y exportación para su contador: EE. UU. (para su 1099 y su *Schedule C*), Colombia (para IBC, renta y factura) | El rentero y el contratista lo piden para declarar, arrendar o pedir crédito | A | S–M |
| P2 | **Apartado sugerido para impuestos** (EE. UU.: estimado trimestral; Colombia: aportes del independiente sobre el 40 %) con aviso de fechas | Evita el golpe a fin de año; nadie del sector lo hace dentro de la agenda | M | M |
| P2 | **Propinas al detalle**: efectivo vs. tarjeta, por cita, y lo que se descuenta por la comisión de tarjeta (si aplica) | Base para *No Tax on Tips* (EE. UU.) y para evitar «me deben propinas» | M | S |
| P2 | **Pago al instante de lo ganado** (Nequi, Bre-B o tarjeta), con tope y costo visible | Uber, Toast y GlossGenius lo ofrecen; depende de la pasarela | M | L |
| P2 | **Ranking opcional** dentro de la sucursal (ocupación, rebooking, reseñas), activable por el dueño | Squire lo ofrece; puede motivar o romper el equipo: siempre opcional | B–M | S |
| P2 | **Solicitar vacaciones** (comisión) y ver el estado | Pendiente en `ROLES_PLAN`; los avisos de aprobado y negado ya existen | M | S |
| P2 | **Captura de gastos por foto** para el rentero | Menos fricción para llevar su negocio | M | M |

---

## 4. Benchmark

Leyenda: ✓ lo documenta el proveedor (declarado) o una fuente consultada · ~ parcial · ✗ no consta · ? no verificado.
Casi todo sale de páginas del propio proveedor. En Booksy no se encontró documentación de funciones para el barbero
empleado o rentero: sus celdas son «?», no «✗».

### Sector (belleza y barbería)

| Función para el barbero | Barberlytics | Booksy Biz | Square (Team app) | GlossGenius | Vagaro | Fresha | theCut | Squire |
|---|---|---|---|---|---|---|---|---|
| Ganancia del periodo en tiempo real | ✓ | ? | ✓ pago estimado con propinas y comisiones (la ayuda dice que el inicio no incluye comisiones) | ✓ nómina con citas, propinas y comisiones | ? | ✓ pay runs | ~ «Business Insights» sin detalle | ✓ pagos semanales |
| Detalle por cita con la regla | ✓ | ? | ? | ? | ? | ? | ? | ? |
| Estado del pago y talón | ✗ (existe para el dueño, no para él) | ? | ✓ talones y formularios de impuestos (con Square Payroll) | ✓ | ? | ✓ | ? | ? |
| Propinas en efectivo registradas | ~ (en el cobro) | ? | ✓ las pide al marcar salida | ? | ? | ? | ? | ✓ (declarado: efectivo, propinas y tarjeta) |
| Dinero del rentero separado | ~ «guardado por la barbería» (cálculo) | ? | ? | ✓ pagos a cuentas separadas | ✓ cobro automático de renta ([07](07-nomina.md)) | ✓ independientes como comercios con su billetera | ✓ el barbero cobra y elige cuándo pasa a su banco | ✓ cobro automático de renta |
| Pago al instante | ✗ | ? | ? | ✓ 1,8 % ([07](07-nomina.md)) | ? | ✓ «paid instantly» (declarado) | ~ elige cuándo retirar | ✓ automático al banco (plan alto, declarado) |
| Pasar comisiones de pago al profesional | ✗ | ? | ? | ? | ? | ✓ | ? | ? |
| Reseñas propias | ~ sueltas en la ficha del cliente | ✓ | ? | ? | ? | ? | ✓ calificación y reseña tras la cita | ? |
| Metas o ranking | ✗ | ? | ? | ? | ? | ? | ? | ✓ ranking entre pares (Contrary) |
| Agenda solo suya en el celular | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clientes por volver y mensaje | ~ aviso sin envío en lote | ✓ (ver [03](03-clientes.md)) | ? | ? | ? | ? | ✓ «client blast» y citas recurrentes | ? |
| Impuestos del independiente | ✗ | ? | ✓ formularios (empleados de Payroll) | ✓ calcula impuestos (nómina) | ? | ? | ~ enlace «Tax Prep» | ? |

### Fuera del sector

| Referente | Qué aporta a la experiencia del barbero |
|---|---|
| **Uber Driver** | Pestaña de ganancias con total del día y de la semana mientras se trabaja; desglose por viaje (tarifa, dinámica, propina, peajes, promociones y la comisión de Uber). Estado semanal por correo cada lunes con lo ganado y lo ya retirado, y ajustes de semanas anteriores. Retiro al instante varias veces al día con costo por retiro (la cifra varía según la fuente: ?). Es el patrón exacto de «Lo que llevo» + «Estado del periodo». |
| **Rappi / plataformas de reparto en Colombia** | No se encontró cómo muestra Rappi las ganancias (?). Sí el marco: la Ley 2466 y el Decreto 0991 de 2026 obligan a las plataformas a reportar cada mes ingresos y tiempo efectivo de cada repartidor, y reparten aportes de salud y pensión 60/40 con el independiente. Es el precedente regional de «la plataforma le muestra al trabajador lo que ganó y lo que cotiza». |
| **Toast (Pay Card y PayOut)** | Propinas disponibles al terminar el turno, con tope para cubrir impuestos y deducciones; sin costo para empleador y empleado (declarado). Lección: el adelanto de lo ganado se limita para no dejar al trabajador debiendo impuestos. |
| **Square Team** | El trabajador ve horas, pago estimado, propinas y talones en una app propia; registra la propina en efectivo antes de salir. |
| **Gusto** | Asistente Gus que responde al empleado sobre su pago con enlaces a la fuente ([07](07-nomina.md)). Modelo de «explícame mi pago». |
| **Deel** | Contratistas en Colombia: contrato, clasificación y pagos ([07](07-nomina.md)). Útil para el rentero como «contratista con su papelería en orden». |

### Hallazgos

1. **El estándar de los verticales es separar el dinero del rentero.** GlossGenius paga a cuentas separadas, Fresha
   da a cada independiente su billetera, Vagaro y Squire cobran la renta solos. Barberlytics calcula bien quién tiene
   el dinero, pero no lo mueve. Mientras no lo mueva, debe al menos **mostrarlo igual en caja y en nómina**.
2. **Nadie del sector explica el pago cita por cita con la regla aplicada.** Es nuestro diferencial; hay que protegerlo
   con una sola cifra en toda la plataforma.
3. **Uber marca la vara de la transparencia**: ganancia al día, desglose por viaje, estado semanal con lo retirado y los
   ajustes de semanas anteriores. Todo eso ya existe en nuestros datos; falta mostrarlo junto.
4. **La reputación es la moneda del barbero independiente.** theCut y Booksy la ponen en el centro (filtrar barberos por
   calificación). En Barberlytics las reseñas existen pero el barbero no las ve como suyas.
5. **El pago al instante es tendencia, no requisito.** Lo ofrecen Uber, Toast, GlossGenius y Fresha, siempre atado a
   su propia pasarela. Para nosotros va después de tener el registro de pagos y la pasarela por país.

---

## 5. Mercado y tendencias

### La renta de silla

- **EE. UU.** Cerca del 80 % de los barberos trabaja por cuenta propia (BLS, citado en [08](08-equipo.md)). Squire
  describe renta de US$ 200–300 por semana frente a comisión del 40–60 % (Contrary, citado en [08](08-equipo.md)).
  El rentero no es un caso raro: en muchas barberías es la mayoría.
- **Colombia.** No se encontró una fuente sobre la renta de silla como práctica ni sobre su tratamiento tributario (?).
  Lo verificable: el independiente cotiza salud y pensión sobre el 40 % de su ingreso, entre 1 y 25 SMMLV
  ($1.750.905 en 2026), según [07](07-nomina.md). Una guía divulgativa de 2026 dice que el independiente debe facturar
  electrónicamente si está en el Régimen Simple, si es responsable de IVA o si supera 3.500 UVT de ingresos; confirmar
  con la DIAN. Y la prensa cita a los estilistas entre los oficios que no deben ir por prestación de servicios cuando
  cumplen horario ([07](07-nomina.md), ?): un «barbero de renta» con horario fijo en la agenda puede ser, de hecho,
  un empleado.

### Impuestos del barbero en EE. UU. (verificar con un contador)

- **No Tax on Tips (OBBBA, 2025).** El Tesoro incluyó a barberos, peluqueros, estilistas y cosmetólogos en la lista de
  oficios con propina. Se deduce hasta US$ 25.000 de propinas por declaración, en los años 2025 a 2028; se reduce desde
  US$ 150.000 de ingreso (US$ 300.000 en pareja); pide número de Seguro Social y se reclama en el Schedule 1-A.
  Para el **autónomo** (el rentero), la deducción no puede pasar la utilidad neta del negocio donde recibió las
  propinas. No elimina los impuestos de nómina ni de autoempleo. Implicación de producto: **registrar la propina por
  separado, por cita y por medio de pago**, y entregarla en el certificado anual.
- **Formulario 1099-K.** Desde 2026 las plataformas de pago solo lo emiten si se pasa de US$ 20.000 **y** 200
  transacciones (OBBBA §70432); para 2025 las fuentes no coinciden. El umbral no cambia lo que se debe: todo ingreso se
  declara. Muchos renteros no recibirán 1099-K y necesitarán **su propio registro** de ingresos: Barberlytics lo tiene.
- **Impuesto de autoempleo.** El rentero paga Seguro Social y Medicare por su cuenta (15,3 % según el IRS; dato general,
  no se abrió la página en esta investigación) y suele pagar estimados trimestrales. Un «apartado sugerido» por semana
  tiene valor real.

### Propinas digitales y pago al instante

- La propina se mueve a la tarjeta y al teléfono (Square la pide al cerrar turno; Toast la libera al terminar). En
  nuestro cobro ya se elige la propina; falta que el barbero la vea por cita y por medio.
- **Pago al instante.** Uber permite retirar varias veces al día; Toast lo limita para cubrir impuestos; GlossGenius
  cobra 1,8 % ([07](07-nomina.md)). En Colombia, Bre-B ya registró 116 millones de llaves en su primer año
  ([07](07-nomina.md)): pagarle al barbero a su llave es trivial si guardamos la llave.
- **Transparencia regulada.** En Colombia, la reforma laboral obligó a las plataformas de reparto a reportar cada mes
  ingresos y tiempo efectivo de cada repartidor (Decreto 0991 de 2026). No aplica a barberías, pero fija la expectativa:
  el trabajador independiente tiene derecho a ver lo que ganó y lo que se le descontó.

### Tendencias 2025–2026

1. **El trabajador como usuario con su app**: Square Team, Squire, theCut, Uber. Agenda, ganancias, propinas y
   talones en el bolsillo.
2. **Del reporte al estado del pago**: ver no solo cuánto, sino si ya está aprobado, pagado y con qué.
3. **Separar el dinero del independiente** dentro de la misma reserva (GlossGenius, Fresha).
4. **Reputación portátil**: la calificación del profesional como activo propio (theCut, Booksy).
5. **Asistentes que explican el pago** (Gusto Gus) en lugar de tablas.

---

## 6. IA

### Datos que ya tenemos

Por barbero y por cita: regla aplicada y %, venta, comisión, propina, deducción, quién cobró, lo guardado por la
barbería, ajustes con nota, pagos de renta, estado del periodo, escala y tramos, ciclo de pago, ocupación, servicios,
cancelaciones e inasistencias, reseñas con comentario (`GET /barbers/:id/reviews`), clientes suyos con
`visitEveryDays` y `lastVisitAt`, huecos libres (`visitSuggestion`), gastos del rentero y el chat con voz
(`src/lib/chat`, Clipper). **Faltan:** propina por medio de pago a la vista, metas, historial guardado de periodos
para comparar semanas, y el modelo detrás de Clipper (`interpret`).

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica al barbero | Datos: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Explícame mi pago** | Responde «¿por qué esta semana gané menos?» o «¿por qué esta cita me dio 35 %?» con la cuenta y enlaces a las citas | Gusto Gus (empleado y empleador) | En «Lo que llevo» y por WhatsApp; Clipper lee la línea de nómina | Sí | Conversacional con herramientas | S–M | Inventar cifras: la IA **solo lee** el cálculo; nunca calcula |
| 2 | **Resumen semanal con una acción** | Tres cifras, la comparación con su propia historia y una sugerencia | Estado semanal de Uber (sin IA); coaching de Lattice ([08](08-equipo.md)) | «Ganaste $X (+8 %). Tu rebooking bajó a 48 %. Prueba ofrecer la próxima cita al cobrar» | Sí, cuando se guarden periodos | Hechos → narración | M | Culpar al barbero por la agenda que le dio la tienda; comparar solo contra sí mismo |
| 3 | **Meta sugerida y progreso** | Propone una meta alcanzable según su historia y su agenda reservada | Phorest (metas sin IA) | «Con tu agenda de la semana, 3 ceras más te llevan al 45 %» | Sí | Predictiva + narración | M | Metas injustas con agenda desigual: normalizar por horas reservables |
| 4 | **Mis clientes por volver, redactado** | Lista a quién le toca, con su hueco real y el mensaje listo en la voz del barbero | Klaviyo (próxima compra); Zenoti ([03](03-clientes.md)) | «Juan viene cada 18 días; le toca el jueves; tienes las 4 p. m.» + botón de WhatsApp | Sí | Predictiva + generativa | S–M | Escribir sin permiso del cliente (Ley 1581 / TCPA); el barbero aprueba cada envío |
| 5 | **Lo que dicen de mí** | Resume sus reseñas en temas («puntual», «degradado»), elige frases para su vitrina | Zenoti (motivos de satisfacción, [08](08-equipo.md)) | Pantalla «Mi reputación» y bio sugerida para la reserva | Sí | Generativa (NLP) | S | Pocas reseñas = conclusiones frágiles; no mostrar críticas a colegas |
| 6 | **Apartado de impuestos** | Estima cuánto guardar por semana según su utilidad y su país | Ningún vertical revisado lo hace (?) | Rentero en EE. UU. (autoempleo, estimados) y en Colombia (aportes sobre el 40 %) | Sí (ventas, renta, gastos) | Reglas + narración | M | Parecer asesoría tributaria: decir «estimado, revisa con tu contador» |
| 7 | **¿Esto cuadra?** | Antes de cerrar la semana, revisa su propio pago: cita cobrada sin línea, regla rara, propina en cero con tarjeta | Revisión previa de Gusto y Aleluya ([07](07-nomina.md)) | El barbero recibe «2 cosas para revisar» y puede reclamar con la cita | Sí | Reglas + narración | S–M | Falsos positivos que generen disputas: mostrar como pregunta, no como error |
| 8 | **Tu día en tres líneas, por voz** | Al abrir el calendario: citas, primer hueco, cliente con alergia, lo ganado hasta ahora | `dayBrief` (reglas) + voz de Clipper | Lectura rápida antes del primer cliente, con las manos ocupadas | Sí | Narración + voz | S | Leer datos de salud en voz alta en el local: solo con auriculares o en texto |
| 9 | **Gastos por foto** | Lee el recibo y lo clasifica | Expensify, Ramp ([06](06-gastos.md)) | El rentero fotografía la factura de la cuchilla | Sí (gastos propios) | Visión + extracción | M | Errores de lectura: confirmar antes de guardar |

### Top 5 apuestas

1. **Explícame mi pago (caso 1).** Reusa el chat y el detalle por cita que ya existen. Ataca el dolor número uno de la
   comisión: la disputa. Condición: primero una sola cifra (P0), si no, la IA explicaría números que no cuadran.
2. **Mis clientes por volver, redactado (caso 4).** Es ingreso futuro para el barbero y usa la capacidad «A. Ritmo del
   cliente» del [README](README.md). El barbero aprueba cada mensaje.
3. **Resumen semanal con una acción (caso 2).** El «estado de los lunes» de Uber, con coaching. Sale por WhatsApp o
   en «Lo que llevo». Depende de guardar periodos.
4. **Lo que dicen de mí (caso 5).** Barato, motivador y mejora la vitrina de la reserva con frases reales.
5. **Apartado de impuestos para el rentero (caso 6).** Diferencial claro frente al sector, sin mover dinero; posiciona a
   Barberlytics como «la que te ayuda a formalizarte» en los dos países.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Una sola verdad (2–4 semanas)

- Métricas › Barberos con el cálculo de nómina; «Fidelidad» con dato real o fuera.
- `/mi-pago` con estado del periodo (provisional, aprobado, pagado, con qué), ajustes con nota y pagos de renta.
- «Hoy» en el calendario del barbero, visible en el teléfono; Agenda por defecto en pantallas chicas.
- Caja y nómina con la misma regla para el efectivo del rentero.
- `memberId` en la sesión y recorte en el servidor (nómina, calendario, clientes, transacciones); evitar periodos
  aprobados que se cruzan; quincena en el navegador de periodo.
- Corregir los textos de ayuda del neto; mostrar el % de cada deducción.
- **Éxito:** cero diferencias entre Métricas y «Lo que llevo»; menos preguntas «¿ya me pagaron?» al dueño.

### Fase 2 — Su negocio y su carrera (4–8 semanas)

- Utilidad de «Mi negocio» con gastos de la silla y comisión de tarjeta.
- Mi reputación (estrellas, tendencia, comentarios) y pedir reseña.
- Metas y brecha al siguiente tramo; progreso en «Lo que llevo».
- Mis clientes por volver con WhatsApp prellenado y en lote.
- Comprobante PDF por periodo y certificado de ingresos anual; propinas por medio de pago.
- Avisos de dinero; «Esto no cuadra» desde la cita; Mi ficha editable; solicitar vacaciones.
- **IA:** explícame mi pago (caso 1) y lo que dicen de mí (caso 5).
- **Éxito:** % de barberos que abren `/mi-pago` cada semana; disputas registradas y resueltas; reseñas nuevas por mes.

### Fase 3 — IA a su lado (trimestre siguiente)

- Resumen semanal con una acción; metas sugeridas; revisión «¿esto cuadra?» antes del cierre.
- Apartado de impuestos por país y recordatorios de fechas.
- Pago al instante (Nequi, Bre-B o tarjeta) cuando exista el libro de pagos y la pasarela por país.
- Ranking opcional por sucursal; gastos por foto; tu día por voz.
- **Éxito:** retención de barberos a 6 meses; rebooking por barbero; renteros con utilidad positiva y sin deuda de renta.

---

## Fuentes

Consultadas en esta investigación (búsqueda y lectura). Se usaron 15 búsquedas y una lectura de página. Lo que un
proveedor dice de sí mismo es **declarado**; las normas tributarias vienen de fuentes oficiales y de terceros:
confirmar con un contador antes de llevarlas a producto. Datos de [07](07-nomina.md), [08](08-equipo.md) y
[03](03-clientes.md) se citan con sus propias fuentes.

**Código y documentos internos:** `src/features/payroll/{MyPayPage,myPayHome,PayrollMemberDrawer,usePayrollFilters,types}.tsx|ts`,
`src/mocks/payroll/{compute,handlers}.ts`, `src/mocks/register/handlers.ts`, `src/mocks/metricsTabs.ts`,
`src/features/access/access.ts`, `src/features/calendar/{calendarAccess.ts,CalendarPage.tsx,dayBrief.ts}`,
`src/features/customers/{customerAccess.ts,customersHome.tsx,CustomerRelationship.tsx}`,
`src/features/metrics/{useMetricsFilters.ts,tabs/BarbersDashboard.tsx}`, `src/features/expenses/ExpensesPage.tsx`,
`src/features/team/teamAccess.ts`, `src/features/settings/sections/notificationCatalog.ts`, `src/app/navigation.ts`,
`src/app/i18n/{es,en}.ts`, `docs/ROLES_PLAN.md`, `ai-tools/CODEMAP.md`.

**Competidores del sector**
- Booksy Biz (reseñas de usuarios, sin funciones para renteros documentadas): https://capterra.com/p/142741/Booksy/ · https://www.softwareadvice.com/retail/booksy-profile/
- Square Team: https://apps.apple.com/us/app/-/id1435368303 · https://Square.com/us/en/staff/shifts/features · https://api.squareup.com/help/us/en/article/7060
- theCut: https://thecut.co/landing-page/barbers-favorite-features · https://thecut.co/landing-page-barber/home · https://apps.apple.com/us/app/thecut-find-book-barbers/id1101408626 · https://thecut.co/mobile-app/ios/faqs
- Squire: https://research.contrary.com/company/squire · https://research.contrary.com/report/squire · https://getsquire.com/compare/squire-vs-vagaro
- GlossGenius: https://glossgenius.com/overview · https://glossgenius.com/blog/booth-renting-breakdown-starting-your-own-business · https://research.contrary.com/company/glossgenius
- Fresha: https://www.fresha.com/help-center/knowledge-base/payments/223-add-merchants-to-your-workspace · https://www.fresha.com/help-center/knowledge-base/team/300-complete-a-pay-run · https://www.fresha.com/en-GB/blog/Fresha-at-Money-2020

**Fuera del sector**
- Uber Driver: https://www.uber.com/us/en/blog/driver-statements/ · https://www.uber.com/us/fr/drive/basics/earnings/ · https://therideshareguy.com/uber-finally-comes-clean-with-take-rates-more-transparency/
- Toast Pay Card y PayOut: https://pos.toasttab.com/products/toast-pay-card-and-pay-out · https://support.toasttab.com/en/article/Toast-Payroll-Use-and-Troubleshoot-Toast-Pay-Card-Employee-Guide · https://pos.toasttab.com/solutions/restaurant-employee-tools
- Plataformas de reparto en Colombia (Ley 2466, Decreto 0991 de 2026): https://www.noticiasrcn.com/economia/decreto-0991-de-2026-cambios-para-repartidores-1048352 · https://www.elcolombiano.com/negocios/seguridad-social-rappi-repartidores-reforma-laboral-NI27854977 · https://www.vanguardia.com/economia/2025/07/01/reforma-laboral-asi-cambia-el-trabajo-en-rappi-y-didi-en-colombia/

**Impuestos y mercado**
- No Tax on Tips: https://www.irs.gov/node/154881 · https://home.treasury.gov/news/press-releases/sb0258 · https://www.fox5ny.com/news/list-jobs-eligible-no-tax-tips-deduction · https://www.experian.com/blogs/ask-experian/no-tax-on-tips/
- 1099-K desde 2026: https://blog.taxact.com/4-common-misconceptions-about-the-new-1099-k-reporting-threshold/ · https://ustax.tools/1099-k-threshold-2026/ · https://www.westerncpe.com/taxbyte/form-1099-reporting-thresholds-change-under-the-one-big-beautiful-bill-act/ · https://onpay.com/insights/1099-reporting-threshold-updates/
- Facturación del independiente en Colombia (blog divulgativo, verificar con la DIAN): https://colombiamove.com/blog/facturacion-electronica-independientes-colombia-dian-guia/
- Renta de silla vs. comisión (referencia de EE. UU.): https://beancount.io/es/blog/2026/07/26/booth-rental-vs-commission-barbershop-bookkeeping-guide
