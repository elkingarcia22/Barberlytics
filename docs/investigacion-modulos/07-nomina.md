# Nómina — investigación

> Módulos `/nomina` (dueño y administrador) y `/mi-pago` («Lo que llevo» del barbero por comisión, «Mi negocio» del barbero de renta).
> Código: `src/features/payroll/`, `src/mocks/payroll/handlers.ts`, compensación en `src/features/team/` (`types.ts`, `forms/CompensationForm.tsx`, `forms/PaymentsForm.tsx`), ajustes en `src/features/settings/sections/` (`CommissionSettings`, `PayrollCycleSettings`, `TipsSettings`, `CardFeeSettings`).
> Fecha: 2026-10-17. Investigación de producto; no se tocó código.

## Resumen ejecutivo

1. Hoy la nómina es un **reporte calculado al vuelo**: comisión por quién trajo al cliente (5 reglas), escala, salario y renta semanal, propinas, deducciones de renta y un neto que puede ser negativo («Debe X»). La lectura para el barbero (`/mi-pago`) ya es mejor que la de producción.
2. **No hay ciclo de pago**: no se cierra, no se aprueba, no se marca pagado y no se guarda una foto del periodo. Si cambia una regla en Equipo, la nómina de meses anteriores cambia. Es el hueco P0.
3. Hay **errores de cálculo**. La escala depende del rango que se esté mirando (día, semana o mes). La base de comisión es el precio de catálogo, no lo cobrado ni el precio del barbero. Las deducciones de renta se configuran en % y se restan como dinero. Los ajustes de Configuración › Comisiones y el ciclo de nómina no se aplican.
4. **El mercado es doble**: la interfaz está en es-CO, pero el demo cobra en USD con sucursales en EE. UU. Para Colombia no conviene ser «software de nómina» (eso ya lo hacen Alegra, Siigo, Aleluya o Buk). Conviene ser **la fuente de la liquidación variable** (comisiones, propinas, renta) y exportarla o integrarla.
5. Ley 2466 de 2025: el recargo dominical sube por etapas (80 %, luego 90 % desde julio de 2026 y 100 % desde julio de 2027) y la prensa cita a los **estilistas** entre los oficios que no deben contratarse por prestación de servicios. Barberlytics puede ayudar a clasificar bien a cada barbero, sin prometer asesoría legal.
6. Apuestas de IA: (1) revisión previa al pago con anomalías, (2) asistente que explica «por qué me pagaron esto», (3) simulador de esquemas de comisión, (4) metas personalizadas con progreso, (5) pronóstico del costo de personal.

---

## 1. Qué tiene hoy

| Pieza | Qué hace | Dónde |
|---|---|---|
| Ruta `/nomina` | Guardada por área `payroll`. Encabezado, `PeriodNavigator` (día, semana o mes; por defecto la semana), 4 tarjetas (a pagar, a cobrar por rentas, comisiones, propinas), pestañas por forma de pago con contador y tabla `DataListBlock` con búsqueda y paginación de 15 | `src/features/payroll/PayrollPage.tsx` |
| Columnas por forma de pago | Comisión: servicios, venta de servicios y productos, comisión de servicios y productos, propinas, neto. Renta: servicios, venta, propinas, renta, deducciones, neto. Salario: servicios, venta de productos, comisión de productos, propinas, salario, neto | `payrollHome.tsx` |
| Panel del barbero | Reglas (insignias por regla y % o tramos de escala), «la cuenta» (lo que suma y lo que resta), cita por cita con la regla aplicada, y enlace a la ficha de Equipo para quien tiene `barber-payments` | `PayrollMemberDrawer.tsx` |
| Filtros en la URL | `periodo`, `fecha`, `pago`, `miembro` | `usePayrollFilters.ts` |
| Exportar | Solo **CSV** de la pestaña visible, con BOM para Excel | `PayrollPage.tsx`, `payrollUtils.ts#toCsv` |
| `/mi-pago` | Comisión o salario: lo ganado, comisión (o salario), comisión de productos y propinas. Renta: ventas, propinas, «a la barbería» (renta + deducciones) y neto, con alerta cuando debe. Lista de citas y el mismo panel sin enlace a Equipo | `MyPayPage.tsx`, `myPayHome.tsx` |
| Backend simulado | `GET /payroll?branchId&from&to&memberId?`. Calcula sobre citas `paid` del rango (máx. 62 días); `weeks = días/7` | `src/mocks/payroll/handlers.ts`, `docs/API_CONTRACT.md` § Nómina |
| Reglas de comisión | `commission` (básica + recurrente, sin cita, sin preferencia, cliente nuevo), `scale` (tramos `from/percent`), `salary` (semanal), `productPercent` | `src/features/team/types.ts#compensationSchema`, `forms/CompensationForm.tsx` |
| Renta de silla | `rentBase` semanal, tres deducciones (sin cita, cliente nuevo, sin preferencia), banco y número de cuenta | `types.ts#paymentsSchema`, `forms/PaymentsForm.tsx` |
| Ajustes relacionados | Comisiones: descontar descuentos, impuestos y costo de servicio o producto. Ciclo de nómina: semanal, quincenal o mensual y día de inicio. Propinas: opciones en el cobro. Recargo por tarjeta | `src/features/settings/settingsTypes.ts` (líneas 60-77) |
| Pruebas | 14 casos: resumen, columnas, CSV, cálculo de comisión, renta, salario, `memberId`, rango inválido, panel, «Lo que llevo» y «Mi negocio» | `payroll.test.tsx` |

**Lo que no existe:** periodos guardados o cerrados, aprobación, «marcar pagado», cobro de la renta, adelantos o préstamos, ajustes manuales, bonos o metas, horas trabajadas o asistencia, recargos, prestaciones sociales, seguridad social, retenciones, comprobante (PDF), nómina electrónica, dispersión de pagos, conciliación con caja, reparto de propinas, comisiones por membresía o paquete, ventas de mostrador en la nómina, devoluciones y multimoneda en nómina (`useMoney` fija `USD`).

---

## 2. Análisis del módulo

### Fortalezas

- **El modelo de negocio está bien entendido.** Tres formas de pago reales del gremio (comisión, renta de silla y salario) y una regla de comisión según quién trajo al cliente. Casi nadie del benchmark la tiene: Phorest, Zenoti o Square manejan tramos, pero no el origen del cliente.
- **El neto negativo se explica.** «Debe US$ X» y la alerta en «Mi negocio» resuelven una duda que el centro de ayuda tiene documentada (`nomina/mi-pago-neto-sale-negativo`).
- **Hay transparencia cita por cita.** El panel muestra la regla y el % aplicado en cada servicio. Es lo que Zenoti vende como «ver ganancias en tiempo real para eliminar disputas».
- **La vista por rol ya existe.** El barbero ve solo lo suyo (`memberId`), como pide `docs/ROLES_PLAN.md` §3-4.
- **La arquitectura es limpia.** Contrato Zod, estado en la URL, columnas declarativas por forma de pago, pruebas del cálculo y de las pantallas.

### Huecos y deuda (con evidencia)

| # | Hallazgo | Evidencia | Gravedad |
|---|---|---|---|
| D1 | **La escala depende de la vista.** El tramo se elige con `periodSales` del rango consultado: el mismo barbero cae en un tramo distinto según se mire el día, la semana o el mes | `handlers.ts#rateOf(…, serviceSales)` | Alta: da números distintos en pantallas distintas |
| D2 | **Las deducciones de renta: % en el formulario, dinero en el cálculo.** El formulario pide `%` (máx. 100) y el cálculo resta el número tal cual por cita (20 → US$ 20) | `PaymentsForm.tsx` (`suffix="%"`), `handlers.ts` (`deduction = payments.walkInDeduction`) | Alta: liquida mal la renta |
| D3 | **La base de comisión es el precio de catálogo.** No usa lo cobrado (`payment.total`), ni el precio del barbero (`serviceOverride.price`), ni el precio de cliente nuevo o frecuente | `handlers.ts#priceOf` | Alta: con descuentos o precios por nivel, la comisión no cuadra con la caja |
| D4 | **Configuración › Comisiones no se aplica.** `deductDiscounts/Taxes/ServiceCost/ProductCost` existen, pero el cálculo los ignora | `settingsTypes.ts:73`; `docs/roles/02…` fila «Deducciones antes de comisionar» | Media |
| D5 | **El ciclo de nómina no se usa.** `PayrollCycleSettings` existe, pero el periodo por defecto es la semana | `usePayrollFilters.ts:17`; `docs/roles/02…` | Media |
| D6 | **No hay foto del periodo.** Todo se recalcula: si cambian las reglas o se edita una cita, cambia la nómina ya pagada | `API_CONTRACT.md` § Nómina («no se guarda») | Crítica para pagar de verdad |
| D7 | **Faltan ventas de mostrador y devoluciones.** Transacciones cuenta ventas sin cita y `refunded`; Nómina solo cuenta citas `paid` | `src/mocks/transactions/handlers.ts` frente a `payroll/handlers.ts` | Media |
| D8 | **El dinero de la renta es ambiguo.** Con renta, el neto = propinas − renta − deducciones: se supone que el barbero cobró sus servicios directamente. Si el cobro pasó por la caja de la barbería (`payment.method` card o link), la barbería le debe la venta. Hoy no se sabe quién tiene el dinero | `handlers.ts` (`net`), `payment.method` en el seed del calendario | Alta en la práctica |
| D9 | **Propinas con tarjeta sin costo.** Existe un recargo por tarjeta en Ajustes, pero no se descuenta de la propina; no hay reparto ni bolsa de propinas | `CardFeeSettings`, `TipsSettings` | Baja o media |
| D10 | **Moneda fija.** `useMoney` usa `USD`; el seed de Ajustes ofrece `COP`, `MXN` y `EUR` | `calendarFormat.ts:15`, `settingsTypes.ts:138` | Alta para Colombia |
| D11 | **Matriz de permisos sin aplicar.** `payroll·create/edit` no se usa; la ruta solo filtra por área | `docs/ROLES_PLAN.md`, `permissionsCatalog.ts` | Media |
| D12 | **Cada cita es una línea.** Varios servicios en una cita salen como una sola línea («A + B») con una sola regla y un solo %; no hay comisión por servicio ni por producto concreto | `handlers.ts#lines` | Baja o media |
| D13 | **Exportación corta.** Solo CSV, sin PDF por barbero (producción ofrece CSV, Excel y PDF) | `docs/roles/02…` fila Descargar | Media |
| D14 | **Ruido en la tabla.** La columna «Servicios» aparece en salario y faltan «Total comisiones» e «Impuestos» frente a producción | `payrollHome.tsx:16-18` | Baja |

### UX

- **Bien:** el resumen junta las tres formas de pago y las pestañas las separan; el panel en lugar de fila desplegable funciona en móvil; las insignias hacen legibles las reglas.
- **Mejorable:**
  - No hay una **acción principal**: el dueño entra a pagar y la pantalla solo le deja mirar.
  - Falta un **estado del periodo** («Abierto · Por aprobar · Pagado»).
  - No hay comparación con el periodo anterior.
  - La escala no muestra **cuánto le falta al barbero para el siguiente tramo**; el plan de roles ya lo pide.
  - En «Mi negocio» falta un «pagar renta» o «ya pagué».
  - En móvil la tabla del panel tiene 7 columnas.

---

## 3. Qué le falta (tabla priorizada)

Impacto: A (alto), M (medio), B (bajo). Esfuerzo: S (días), M (1-3 semanas), L (más de un mes o con integración externa).

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | **Corregir el cálculo**: tramo de escala por **ciclo de pago** (no por vista), deducciones de renta en % sobre la venta o en monto (elegible), base = lo cobrado (con precio por barbero), aplicar Configuración › Comisiones, sumar ventas de mostrador y restar devoluciones | Hoy la nómina no cuadra con caja ni con Transacciones (D1-D4, D7) | A | M |
| **P0** | **Periodo de pago con estado**: el ciclo sale de Configuración; *borrador → revisado → aprobado → pagado*; foto inmutable al aprobar; reapertura con motivo y auditoría | Sin esto no se puede pagar con el sistema (D5, D6). Fresha exige aprobar manualmente cada pay run; Mangomint deja revisar y ajustar antes de cerrar | A | M |
| **P0** | **Ajustes manuales del periodo**: bono, descuento, adelanto, préstamo (en cuotas), faltante de caja y uso de producto, cada uno con nota y quién lo hizo | El gremio paga adelantos a diario; hoy queda fuera del sistema. Fresha contempla adelantos de efectivo en el pay run | A | M |
| **P0** | **Renta de silla completa**: quién cobró cada venta (caja de la barbería o el barbero), saldo de renta, registrar pago de renta, recordatorio y estado «al día / debe» en «Mi negocio» | D8. Vagaro cobra la renta automáticamente desde la cuenta del arrendatario | A | M |
| **P0** | **Moneda y formato por sucursal** (COP sin decimales, separador de miles) | D10. Bloquea Colombia | A | S |
| **P1** | **Comprobante por barbero** (PDF y enlace por WhatsApp) con el detalle cita por cita y los ajustes, más Excel del periodo | Producción ya tiene PDF y Excel; el barbero lo pide para disputas | A | S-M |
| **P1** | **Pago del periodo**: marcar pagado por medio (efectivo, transferencia, Nequi o Daviplata, llave Bre-B) con referencia; archivo de dispersión bancaria (CSV o plantilla del banco) y, más adelante, integración | Fresha, GlossGenius y Homebase pagan desde la plataforma; en Colombia Bre-B ya registra 116 millones de llaves | A | M (manual) / L (integrado) |
| **P1** | **Conciliación con caja**: propinas con tarjeta frente a efectivo (quién las tiene), cierre de caja contra nómina, comisión de tarjeta sobre la propina (configurable) | Evita el «me deben propinas» y cuadra el efectivo del día | M-A | M |
| **P1** | **Clasificación laboral por barbero**: *empleado*, *contratista por prestación de servicios* o *arrendatario independiente*, con avisos («cumple horario fijo y recibe pago semanal: revisar con su contador») | Ley 2466 y riesgo UGPP; la prensa cita a los estilistas entre los oficios que no deben ir por prestación de servicios | A (riesgo) | S-M |
| **P1** | **Exportación a la nómina formal** (Colombia): archivo de novedades del mes (devengado variable, comisiones, bonos, horas en domingo o festivo) para Alegra, Siigo, Aleluya o Buk, en lugar de hacer la nómina electrónica nosotros | La nómina electrónica es **mensual** (Res. DIAN 000013/2021) y la hacen bien los especialistas | A | M |
| **P1** | **Comisiones escalonadas completas**: tramo marginal o «al total» (Phorest lo llama *higher brackets apply to full amount*), comisión por servicio o producto concreto, por nivel, por membresía o paquete, y «el mayor entre salario y comisión» (Mangomint, Zenoti) | Cubre los esquemas reales y las negociaciones con barberos senior | M-A | M |
| **P1** | **Metas e incentivos**: meta de ventas, de retail o de rebooking por barbero, con bono al cumplir y barra de progreso en «Lo que llevo» | Retención y ticket; Phorest tiene comisión por meta | M | M |
| **P2** | **Horas y recargos** (para empleados): fichaje, horas en domingo, festivo y de noche con los porcentajes de la Ley 2466 por fecha, y el tope de 42 horas semanales desde el 15-jul-2026 | Solo si se atiende a barberías con empleados; para la mayoría basta exportar horas | M | L |
| **P2** | **Seguridad social del independiente**: calculadora de IBC (40 % del ingreso, entre 1 y 25 SMMLV) y recordatorio de la PILA del barbero de renta o contratista; certificado de ingresos que le ofrece la barbería | Formaliza al barbero y protege al dueño; no presentar la PILA, solo calcular y recordar | M | M |
| **P2** | **Nómina electrónica propia** (proveedor tecnológico habilitado o integración vía API) | Solo si la estrategia es «todo en uno»; pide habilitación ante la DIAN y notas de ajuste | M | L |
| **P2** | **Pago anticipado de lo ganado** (*earned wage access*), con tope y conectado a adelantos | Homebase lo ofrece sin costo para el empleador; en barberías se paga a diario | M | L |
| **P2** | **Bolsa de propinas** (reparto entre barberos, recepción y lavado) | Útil en barberías grandes; 7shifts y Toast lo hacen por reglas | B-M | M |
| **P2** | **Multi-sucursal**: «Todas» las sedes y barbero que trabaja en dos sedes | Fresha genera un pay run por sede; producción no tiene «Todas» | M | M |

---

## 4. Benchmark

Leyenda: ✓ lo documenta el proveedor · ~ parcial o solo con add-on · ✗ no visto · ? no verificado. Fuente principal: páginas del propio proveedor (marketing o ayuda); trátese como lo que dicen ofrecer, no como prueba independiente.

| Función | **Barberlytics** | Booksy | Fresha | Square | Vagaro | Mangomint | GlossGenius | Zenoti | Phorest | Boulevard |
|---|---|---|---|---|---|---|---|---|---|---|
| Comisión por servicio / producto | ✓ / ✓ (% producto global) | ~ (reportes de comisión) | ✓ / ✓ | ~ (por servicio no confirmado) | ✓ | ✓ (por servicio o producto) | ✓ | ✓ (por ítem, empleado o nivel) | ✓ | ~ |
| Comisión según el origen del cliente | **✓** | ✗ | ✗ | ✗ | ? | ✗ | ✗ | ✗ | ✗ | ? |
| Escalonada por ventas | ✓ (con D1) | ? | ✓ | ✓ | ? | ✓ | ? | ✓ | ✓ (marginal o al total) | ? |
| Descontar descuentos o costos antes de comisionar | ~ (ajuste sin efecto) | ? | ✓ | ? | ? | ? | ? | ? | ✓ (costo de servicio) | ? |
| Salario, por hora o «el mayor de» | salario | ✗ | ✓ (fichaje) | ✓ (Shifts) | ✓ (híbrido) | ✓ (mayor de) | ✓ (fichaje) | ✓ (mayor de) | ? | ? |
| Propinas en el pago | ✓ | ? | ✓ | ✓ (solo W-2) | ✓ | ✓ | ✓ | ✓ | ? | ? |
| Renta de silla | ✓ (cálculo) | ✗ | ✗ | ✗ | **✓ (cobro automático)** | ✗ | ~ (pago a independientes) | ? | ? | ? |
| Periodo, aprobación y cierre | ✗ | ✗ | ✓ (aprobación manual) | ✓ | ✓ | ✓ (fuera de ciclo, sin costo) | ✓ | ✓ | ~ (reporte) | ✓ |
| Dispersión del pago | ✗ | ✗ | ✓ (wallet o banco) | ✓ | ✓ | ✓ (depósito directo) | ✓ (mismo día; instantáneo con 1,8 %) | ✓ | ✗ | ✓ |
| Impuestos y formularios | ✗ | ✗ | ? | ✓ (EE. UU.) | ✓ (EE. UU.) | ✓ (W-2/1099) | ✓ | ✓ | ✗ | ✓ |
| Vista del empleado | ✓ («Lo que llevo» / «Mi negocio») | ? | ✓ (wallet) | ✓ (talones de pago) | ✓ | ✓ (talones de pago) | ✓ | ✓ (tiempo real) | ✓ (detalle de comisión) | ? |
| Comprobante PDF | ✗ | ? | ? | ✓ | ? | ✓ | ? | ? | ? | ? |

**Fuera del sector belleza:**

| | Gusto | Rippling | Deel | 7shifts | Homebase | Toast Payroll |
|---|---|---|---|---|---|---|
| Lo que interesa | Alertas antes de pagar por cambios frente al historial; asistente Gus para empleador y empleado | IA sobre toda la plataforma; validación contra asistencia; Slackbot que hace cambios puntuales de nómina | Contratistas en Colombia: contratos, clasificación y EOR | Bolsa de propinas por reglas desde el POS, con vista previa | Bolsa de propinas por horas o rol; pago anticipado (Cash Out) | Tips Manager: reglas por puesto o turno conectadas a la nómina |

**Colombia (nómina formal):**

| | Alegra Nómina | Siigo Nómina | Aleluya | Buk | Nominapp | AgendaPro (vertical) |
|---|---|---|---|---|---|---|
| Nómina electrónica DIAN | ✓ (producto aparte, precio por rango de empleados según un competidor) | ✓ | ✓ (transmisión ilimitada incluida) | ✓ | ✓ (gratis en 2021) | ✗ |
| PILA | ? | ? | ✓ (pago «en 1 clic») | ✓ | ? | ✗ |
| Portal del empleado | ? | ? | ✓ (autogestión) | ✓ (web y app) | ✓ (historial de pagos) | ~ (el barbero ve su información) |
| IA | ? | asistente virtual | **Pulso: revisa la nómina antes de pagar** | ? | ? | ? |
| Comisiones de barbería | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (cálculo automático) |

### Hallazgos

1. **Nadie mezcla bien comisión según el origen del cliente con renta de silla.** Es el diferencial de Barberlytics y el que más le importa al dueño de barbería latino. Vagaro es el único con cobro de renta automatizado, y una reseña en Capterra lo califica con 3/5 por fallas en la solicitud de tarjeta.
2. **El estándar del sector (Fresha, Mangomint, Zenoti, GlossGenius) es el *pay run***: periodo programado, revisión, ajustes, aprobación y pago. Barberlytics está un paso atrás: reporta, pero no paga.
3. **«El mayor entre salario y comisión»** (Mangomint, Zenoti) es la forma de pagar salario mínimo garantizado con incentivo. En Colombia encaja con empleados que ganan el SMMLV ($1.750.905 en 2026) más comisión.
4. **La IA ya llegó a la nómina en Colombia**: Aleluya anuncia a Pulso, que revisa la nómina antes de pagar. La revisión previa es la expectativa mínima de 2026.
5. **Los de nómina colombiana no saben de comisiones de barbería, y los de barbería no saben de DIAN ni de PILA.** El espacio libre es el puente entre los dos: liquidación variable correcta más exportación de novedades.

---

## 5. Mercado y tendencias

### Señales de mercado en el código

`src/i18n/locales.ts` usa `es-CO`; `features/auth/types.ts` valida celulares de 10 dígitos de Colombia; `CURRENCIES` incluye `COP`. Pero el seed de Ajustes tiene sucursales en Massachusetts, North Carolina, Rhode Island y Utah en **USD**, y `useMoney` fija `USD`. Producción (dash.barberlytics.com) atiende barberías hispanas en EE. UU. y apunta a Colombia y LatAm. **Decisión de producto:** la nómina tiene que ser *agnóstica del país* en el cálculo variable y tener *conectores por país* para lo formal: W-2/1099 vía Gusto o Square en EE. UU.; Alegra, Siigo, Aleluya o Buk en Colombia.

### Regulación colombiana relevante (verificar con abogado laboral o contador)

- **Ley 2466 de 2025 (reforma laboral)**, sancionada el 25-jun-2025:
  - **Recargo dominical y festivo**: 80 % desde el 1-jul-2025, **90 % desde el 1-jul-2026** y 100 % desde el 1-jul-2027.
  - **Trabajo nocturno** desde las 7:00 p. m.
  - **Domingo habitual**: tres o más domingos al mes.
- **Ley 2101 de 2021**: la jornada máxima baja a **42 horas semanales desde el 15-jul-2026**. Las barberías abren domingos y hasta tarde: cualquier barbero *empleado* genera recargos.
- **Prestación de servicios**: la prensa (Telemedellín, 6-ene-2026; El País, 27-ene-2026) cita a los **estilistas** entre los cargos que no deben vincularse por prestación de servicios cuando cumplen horario y órdenes. Ninguna de las dos notas cita el artículo exacto: confirmar en el texto oficial. Para Barberlytics significa que un «barbero por comisión» con horario fijo en la agenda puede ser, de hecho, un empleado. Las alertas de clasificación (P1) dan valor real.
- **Riesgo UGPP**: reclasificación y cobro de aportes. Un competidor de Deel cita multas de hasta 5.000 SMMLV por infracción; verificar.
- **Nómina electrónica** (Res. DIAN 000013 de 2021): obliga a quien paga salarios y quiere deducirlos en renta. Se genera **mensualmente** aunque se pague semanal o quincenal, con notas de ajuste. Los contratistas no van en ella: facturan o emiten documento soporte.
- **Independientes**: IBC = 40 % del ingreso mensualizado, mínimo 1 y máximo 25 SMMLV; salud 12,5 %, pensión 16 % y ARL según riesgo; mes vencido. Para el arrendatario por cuenta propia, los gastos (como la renta) podrían restarse antes del 40 %; confirmar caso a caso.
- **SMMLV 2026**: $1.750.905, más auxilio de transporte de $249.095 (Decretos 1469 y 1470 de 2025; hubo una suspensión provisional y el Decreto 0159 de 2026 mantuvo el valor).

### Tendencias 2025-2026

1. **De reporte a pago**: los verticales (Fresha, GlossGenius, Mangomint) cobran por procesar la nómina y cobran comisión por el pago instantáneo (GlossGenius: 1,8 %).
2. **Pagos instantáneos en Colombia**: Bre-B (Banco de la República) arrancó en septiembre y octubre de 2025 y en su primer año registró **116 millones de llaves y más de $262 billones movilizados**. La siguiente fase incluye pagos empresariales. Pagar a un barbero con su llave (celular o cédula) se vuelve trivial: la plataforma tiene que guardar la llave, no solo «banco + número de cuenta».
3. **IA de revisión antes de pagar** (Gusto, Rippling, Aleluya Pulso) y **asistentes para el empleado** (Gus en la app de Gusto).
4. **Formalización con tecnología**: el sector belleza es muy informal (un estudio cita 56,1 % de informalidad nacional); la reforma sube el costo de hacerlo mal.
5. **Transparencia en tiempo real**: Zenoti promete «ganancias en tiempo real para eliminar disputas». Barberlytics ya lo tiene en «Lo que llevo»; falta el cierre.

---

## 6. IA

| Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos que necesita · ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| **1. Revisión previa al pago (anomalías)** | Antes de aprobar compara cada barbero con su historial y avisa: neto 40 % sobre su media, propina atípica, citas cobradas sin servicio, regla «sin cita» disparada, cliente repetido con regla «nuevo», salario sin citas, renta sin cobrar dos semanas | Gusto: alertas en el paso de revisión frente a valores previos, solo con historial suficiente. Rippling: validación contra asistencia. Aleluya: Pulso | Al aprobar el periodo aparece «3 cosas para revisar», cada una con su cita | Citas, pagos, reglas, historial de periodos · **parcial**: falta historial **guardado** (P0 periodos) | Predictiva (estadística) + generativa para redactar | M | Falsos positivos (temporada alta); al principio, reglas explicables mejor que un modelo opaco |
| **2. Asistente «¿por qué me pagaron esto?»** | El barbero pregunta en lenguaje natural («¿por qué esta semana gané menos?», «¿cuánto me falta para el 50 %?») y recibe una respuesta con la cuenta y enlaces a las citas | Gusto Gus (empleador y empleado en la app, con enlaces a la fuente) | En «Lo que llevo» o «Mi negocio», y por WhatsApp. Reusar el chat de IA existente (`src/components/chat`, Clipper) | Línea de nómina, reglas, ajustes · **sí** (el panel ya tiene todo) | Conversacional (generativa con herramientas) | S-M | Inventar cifras: la IA solo **lee** el cálculo, no calcula; privacidad entre barberos |
| **3. Simulador de esquemas de comisión** | «¿Qué pasa si paso a Juan de 40 % fijo a escala 40/45/50?» Recalcula los últimos N periodos y muestra el costo para la barbería y el ingreso del barbero; propone el esquema que equilibra margen y retención | Mangomint y Zenoti permiten configurar; ninguno documenta simulación con IA (oportunidad) | Antes de negociar con un barbero senior o de pasar a renta | Historial de citas, costos (Gastos), reglas · **sí**, salvo el costo por servicio | Predictiva + agéntica (propone, el dueño decide) | M | Optimizar solo el margen y perder barberos; mostrar siempre el impacto en el barbero |
| **4. Metas personalizadas** | Propone a cada barbero una meta alcanzable (ventas, retail, rebooking) según su historial y la ocupación de su agenda, y un bono; muestra el progreso diario | Phorest: comisión por meta (sin IA documentada) | «Esta semana: 3 ventas de cera para el bono» en «Lo que llevo» | Citas, productos, ocupación del calendario · **sí** | Predictiva + generativa (mensaje) | M | Metas injustas por agenda desigual: normalizar por horas reservables |
| **5. Pronóstico del costo de personal** | Proyecta la nómina del periodo en curso y del siguiente (comisiones, salarios, rentas por cobrar) con citas reservadas y estacionalidad; avisa «este mes la nómina será 18 % del ingreso, más que la media» | Rippling y otros lo presentan como *insights*; sin ejemplo verificado para salones | En Métricas o Gastos: flujo de caja para pagar el viernes | Citas futuras, histórico, reglas · **sí** | Predictiva | M | Poca precisión con poco historial; mostrar rangos |
| **6. Reparto justo de propinas** | Sugiere reglas de bolsa (barbero, lavador, recepción) según horas, servicios y rol; simula antes de activar | 7shifts: vista previa con datos reales del POS. Toast Tips Manager | Solo barberías grandes con auxiliares | Propinas por cita, roles; **horas no** | Predictiva y de reglas | M | Conflicto laboral si se cambia sin acuerdo |
| **7. Cumplimiento asistido** | Revisa la clasificación de cada barbero (horario fijo en la agenda + pago semanal + comisión ⇒ riesgo de contrato realidad), recuerda la PILA del independiente, calcula recargos dominicales y avisa de cambios normativos (90 % → 100 %) | Deel: soporte de clasificación de contratistas en Colombia. Siigo: parametrización que se actualiza con la norma | Aviso en la ficha de Equipo y en el cierre del periodo | Agenda (horario), forma de pago, días trabajados · **sí**; normativa · **no** (hay que curarla) | Generativa con recuperación (RAG sobre normas curadas) + reglas | M-L | Responsabilidad legal: redactar como «revisa con tu contador», nunca como dictamen |
| **8. Cierre agéntico del periodo** | El agente prepara el periodo, aplica adelantos, resuelve alertas triviales, genera comprobantes y el archivo de pago, y deja la aprobación al dueño | Rippling: Slackbot que ejecuta cambios puntuales de nómina (según un agregador) | «Prepara la nómina del viernes» desde el chat | Todo lo anterior + medios de pago · **parcial** | Agéntica | L | Mover dinero sin control: siempre con aprobación humana y auditoría |

### Top 5 apuestas

1. **Revisión previa al pago** (caso 1). Bajo riesgo, valor inmediato, y Aleluya ya marca la expectativa en Colombia. Depende de guardar periodos (P0). Empezar con reglas explicables (umbral frente a la media de 8 semanas, regla incoherente con el tipo de cliente) y dejar el modelo para después.
2. **Asistente para el barbero** (caso 2). Reutiliza el chat de IA y el detalle cita por cita que ya existe. Reduce disputas, que son el dolor número uno de la comisión. La IA explica; el cálculo determinista manda.
3. **Simulador de comisiones** (caso 3). Diferencial frente a todo el benchmark. Convierte la nómina en herramienta de decisión del dueño (comisión, escala o renta).
4. **Metas personalizadas con progreso** (caso 4). Une «Lo que llevo» con la ocupación del calendario y el retail; sube el ticket.
5. **Cumplimiento asistido para Colombia** (caso 7, versión ligera). Alertas de clasificación más calculadora de IBC y recargos. Posiciona a Barberlytics como «la que te ayuda a formalizar» frente a la reforma, sin ser un software de nómina.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — «Que cuadre y se pueda pagar» (4-6 semanas)

- Corregir D1-D4, D7 y D10: tramo por ciclo, deducción % o monto, base = cobrado y precio del barbero, Configuración › Comisiones aplicada, ventas de mostrador y devoluciones, moneda por sucursal.
- Periodo con ciclo desde Configuración y estados *borrador → aprobado → pagado*, con foto inmutable y auditoría (`payroll·edit`).
- Ajustes manuales: adelanto, bono, descuento y préstamo en cuotas.
- Renta: quién cobró, saldo y registrar pago; estado en «Mi negocio».
- Comprobante PDF por barbero, Excel del periodo y envío por WhatsApp.
- Contrato nuevo en `docs/API_CONTRACT.md`: `POST /payroll/periods`, `PATCH …/approve`, `…/pay`, `POST /payroll/adjustments`.

### Fase 2 — «Pagar, conciliar y explicar» (6-8 semanas)

- Medios de pago por barbero: llave Bre-B, Nequi o Daviplata, cuenta. Marcar pagado con referencia y archivo de dispersión.
- Conciliación con caja: propinas con tarjeta frente a efectivo, cierre del día contra nómina.
- Escala marginal o «al total», comisión por servicio o producto o membresía, «el mayor de» salario y comisión.
- Clasificación laboral por barbero con alertas, y exportación de novedades para Alegra, Siigo, Aleluya o Buk (Colombia) y Gusto o Square (EE. UU.).
- IA: **revisión previa al pago** (reglas) y **asistente del barbero** en «Lo que llevo».

### Fase 3 — «Decidir y crecer» (trimestre siguiente)

- IA: simulador de esquemas, metas personalizadas con bono y pronóstico del costo de personal.
- Calculadora de IBC y recordatorio de PILA del independiente; recargos para quien tenga empleados (horas, domingos y festivos).
- Evaluar con datos de uso: nómina electrónica propia o integración profunda, pago anticipado de lo ganado y bolsa de propinas.
- Cierre agéntico del periodo con aprobación humana obligatoria.

---

## Fuentes

**Código y documentos internos:** `src/features/payroll/*`, `src/mocks/payroll/handlers.ts`, `src/features/team/types.ts`, `src/features/team/forms/{CompensationForm,PaymentsForm}.tsx`, `src/features/settings/settingsTypes.ts`, `src/features/calendar/calendarFormat.ts`, `src/mocks/settings/seed.ts`, `src/mocks/transactions/handlers.ts`, `src/i18n/locales.ts`, `docs/API_CONTRACT.md`, `docs/ROLES_PLAN.md`, `docs/roles/02-metricas-caja-nomina.md`, `ai-tools/CODEMAP.md`; memoria del proyecto `project-modulo-nomina.md` y `project-roles-plataforma.md`.

**Web (consultadas en esta investigación; varias son páginas de marketing del propio proveedor):**

- Fresha — https://www.fresha.com/help-center/knowledge-base/team/102232-enable-pay-runs-and-set-your-pay-period · https://www.fresha.com/help-center/academy/pay-your-team/track-team-commissions/lessons/100275 · https://www.fresha.com/help-center/academy/pay-your-team/paying-your-team-overview/lessons/100276
- Square — https://www.square.com/help/us/en/article/7409 · https://squareup.com/help/us/en/article/5855-run-payroll · https://community.squareup.com/t5/Questions-How-To/How-can-I-pay-commission-based-employees/m-p/59908
- Vagaro — https://www.vagaro.com/learn/detangling-rent-fees-collection · https://www.vagaro.com/pro/employee-management-software · https://www.salontoday.com/articles/vagaro-rolls-out-new-features-to-improve-salon-efficiency · https://capterra.co.uk/software/153752/vagaro
- Mangomint — https://mangomint.com/features/payroll-processing · https://www.mangomint.com/learn/help-articles/staff-members/staff-compensation
- GlossGenius — https://glossgenius.com/payroll-glossgenius · https://glossgenius.com/glossgenius-pricing-update-16-08-26 · https://glossgenius.com/glossgeniuspayroll
- Zenoti — https://www.zenoti.com/platform/commission-management · https://www.zenoti.com/spa-salon-employee-management · https://help.zenoti.com/en/employee-and-payroll/employee-related-manager-tasks/manage-employee-commission/configure-payroll-controls.html
- Phorest — https://phorest.helpjuice.com/337692-higher-commission-brackets-apply-to-full-amount · https://phorest.helpjuice.com/en_US/305392-setting-up-staff-commission · https://phorest.helpjuice.com/305697-staff-commission-overview-report
- Boulevard — https://www.joinblvd.com/blog/salon-software-with-payroll
- Booksy — https://biz.booksy.com/features/stats-and-reports · https://biz.booksy.com/blog/smart-business-managing-your-earnings-with-booksy-statistics-and-reports
- AgendaPro — https://agendapro.com/co/barberia/software-para-barberias
- Gusto — https://support.gusto.com/article/250211164235690/use-gus-gustos-ai-assistant · https://support.gusto.com/article/260112145935220/review-changes-to-your-regular-payroll-with-helpful-alerts-for-admins (vista vía buscador; la página devolvió 403 al abrirla) · https://gusto.com/resources/guides/best-ai-payroll-solutions
- Rippling — https://www.rippling.com/en-GB/products/payroll · https://digg.com/tech/l9amsuu7 · https://resources.rework.com/tools/ai-agents/best-ai-agents-for-payroll-2026
- 7shifts — https://kb.7shifts.com/hc/en-us/articles/4417505157779 · https://7shifts.com/tip-pooling/
- Homebase — https://www.joinhomebase.com/industry/restaurant-tip-pooling · https://plaid.com/customer-stories/homebase/
- Toast — https://support.toasttab.com/en/article/Toast-Tips-Manager-Guide · https://pos.toasttab.com/products/toast-tips-manager
- Deel — https://www.deel.com/blog/colombia-employee-misclassification-risks-and-best-practices/ · https://www.deel.com/contractors/colombia · https://www.usemultiplier.com/colombia/hiring-contractors
- Aleluya — https://aleluya.com/ · https://aleluya.com/precios · https://aleluya.com/nomina-electronica/ · https://aleluya.com/terminos-y-condiciones/
- Buk — https://www.buk.co/blog/como-elegir-software-de-nomina-en-colombia · https://supportcenter.buk.cl/hc/es-419/articles/36187476889371-Portal-Colaborador
- Siigo — https://landing.siigo.com/wp-content/uploads/2021/09/Contenido-Nomina-Electronica.pdf
- Nominapp — https://www.portafolio.co/negocios/emprendimiento/pymes-colombianas-tendran-acceso-a-su-nomina-electronica-gratuita-556257 · https://accounter.co/noticias/actualidad/nominapp-la-herramienta-para-liquidar-y-pagar-la-nomina-hasta-10-veces-mas-rapido
- Ley 2466 / recargos / jornada — https://actualicese.com/como-quedan-los-recargos-nocturnos-dominicales-y-festivos-con-la-reforma-laboral-ley-2466-de-2025/ · https://www.portafolio.co/economia/gobierno/atencion-desde-hoy-primero-de-julio-el-recargo-dominical-sube-al-90-y-la-reduccion-de-la-jornada-inicia-el-497268 · https://www.noticiascaracol.com/economia/reduccion-de-la-jornada-laboral-en-colombia-asi-sera-el-nuevo-limite-de-horas-desde-el-15-de-julio-so35 · https://www.asuntoslegales.com.co/actualidad/el-recargo-dominical-y-festivo-sube-a-90-a-partir-de-hoy-4426242
- Prestación de servicios y estilistas — https://telemedellin.tv/?p=158569 · https://www.elpais.com.co/economia/no-mas-contratos-de-prestacion-de-servicios-para-estos-trabajadores-la-ley-no-permite-usarlos-2733.html
- Nómina electrónica DIAN — https://accounter.co/normatividad/resoluciones/por-la-cual-se-implementa-el-sistema-de-facturacion-electronica-la-funcionalidad-del-documento-soporte-de-pago-de-nomina-electronica-res-13-de-2021 · https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_901719_2021.htm
- Independientes / IBC — https://iuslaboris.com/insights/colombia-changes-to-payment-of-independent-contractors-social-security-contributions/ · https://accounter.co/normatividad/conceptos/laboral-concepto-714211-consulta-sobre-el-porcentaje-en-el-pago-de-aportes-a-seguridad-social-de-contratistas-mes-vencido-ingreso-base
- SMMLV 2026 — https://consultorsalud.com/aumento-del-salario-minimo-en-colombia-2026/ · https://siemprealdia.co/colombia/derecho-laboral/salario-minimo-2026/
- Bre-B — https://www.elpais.com.co/economia/en-su-primer-ano-bre-b-mueve-262-billones-y-alcanza-116-millones-de-llaves-en-colombia-0604.html · https://actualicese.com/bre-b-ya-esta-operando-oficialmente-y-van-mas-de-82-millones-de-llaves-registradas/ · https://www.elcolombiano.com/negocios/bre-b-100-millones-llaves-expansion-pagos-inmediatos-colombia-NB35433806
- Informalidad del sector — https://alejandria.poligran.edu.co/bitstreams/128a286a-c8a8-4ee4-bc69-477737e45eab/download · https://repository.uniminuto.edu/jspui/bitstream/10656/7029/1/T.CP_MartinezCarlos_2018.pdf

> Nota: las cifras de proveedores (ahorros de tiempo, número de clientes) son afirmaciones de su marketing y no se usan como evidencia. Las normas laborales citadas vienen de prensa y portales especializados: confirmar el texto oficial antes de llevarlas a producto.
