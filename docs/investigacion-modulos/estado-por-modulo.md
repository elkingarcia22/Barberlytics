# Estado por módulo frente a la investigación

Revisión del 2026-10-19 (sobre `c53ff85`). Cruza cada informe (01–17) con el código: qué recomendaciones están hechas,
cuáles faltan (con la prioridad que les dio su informe), qué IA tiene hoy cada módulo y cuál le falta. Fuera de la IA
genérica de Clipper.

Cómo leer la columna «IA hoy»: **modelo** = llama a Claude u otro modelo; **estadística** = cálculo con datos reales
(sin modelo); **reglas** = condiciones fijas; **etiqueta** = dice «IA» sin serlo.

## Resumen

| Módulo | Hecho | Pendiente más importante | IA hoy | La IA que más le sumaría |
|---|---|---|---|---|
| 01 Métricas | Agenda real, moneda, atajos, neto único, «Cómo te fue» | «Todas las sucursales», ocupación real, metas, Marketing real | Modelo («Cómo te fue») + reglas | Alertas de anomalías y resumen semanal por WhatsApp |
| 02 Calendario | Confirmación, motor de mensajes, riesgo, recursos, propuestas de Clipper | Reprogramación pedida, anticipo, lista de espera priorizada, walk-ins | Estadística (riesgo) + reglas | Actuar ante el riesgo; hueco liberado que se llena solo |
| 03 Clientes | Ficha 360, WhatsApp 1 a 1, permiso, importar, ritmo | Fotos y fórmula, etiquetas, automatizaciones, fusionar | Estadística | Mensajes redactados; perfil en 3 líneas |
| 04 Servicios y Productos | Precio por sede, impuesto por línea, existencias, rentabilidad | Precio por nivel, add-ons, desempeño en la ficha | Estadística | Venta cruzada; reposición sugerida |
| 05 Transacciones | Caja sin doble cobro, devoluciones, mixto, cierre, libro | Libro de solo agregar, arqueo, propinas, factura DIAN | Reglas (revisión de caja) | Explicar la diferencia de caja; pronóstico |
| 06 Gastos | Fecha, categoría, comprobantes, estado de resultados | Periodos, categorías propias, cuentas por pagar | Ninguna | Foto → gasto; duplicados |
| 07 Nómina | 4 errores corregidos, periodos, ajustes, renta | Quincena, comprobante PDF, dispersión, metas | Estadística + modelo («¿Por qué?») | Simulador de esquemas de comisión |
| 08 Equipo | Portada real, ausencias, fila viva, rendimiento | Mi ficha, botones sin acción, datos bancarios, fichaje | Ninguna | Cubrir ausencias; coaching semanal |
| 09 Configuración | Sucursales, pasarelas, recordatorios, puesta en marcha, paquete por país | Plantillas editables, horario por sede, pasarela real | Ninguna | Configurar conversando; auditoría con cifras |
| 10 Reserva en línea | Cola real, zona horaria, token de tarjeta, voz | Respuestas de WhatsApp, pasarela real, reservable por agentes | Estadística + reglas + modelo (voz) | Clipper en WhatsApp; «lo de siempre» con un sí |
| 11 Clipper | Modelo, sesión, herramientas, acciones, evaluaciones | Aviso que contradice, foco por ficha, resumen del día | Modelo | Resumen del día; núcleo compartido con la reserva |
| 12 Acceso | Roles en servidor, código endurecido, step-up, registro que entra, desbloqueo por correo | Invitar equipo, Google sin sesión, passkeys | Ninguna | Lista de precios desde una foto |
| 13 Avisos y ayuda | Bandeja real por rol, preferencias | Reprogramación, PWA/push, WhatsApp al dueño | Modelo (semanal) + reglas | Resumen diario por WhatsApp |
| 14 Barbero | Neto único, Mi pago, ausencias | Mi ficha, «mis clientes por volver», metas | Modelo («¿Por qué?») | Mis clientes por volver con el mensaje listo |
| 15 Marketing | Permiso, STOP/BAJA, franja horaria y tope en el servidor; Marketing real | Campañas, reseña en Google, cupones, referidos | Reglas + etiqueta | Reactivación automática con tope |
| 16 Front Desk | Cobro solo por la caja, turno de barberos | Kiosco, check-in que avisa, cola de walk-ins | Reglas | Espera estimada |
| 17 Producción y legal | Sesión firmada, cola, token de tarjeta, CSP | Backend real, cookie httpOnly, borrar/exportar cliente, contratos | Modelo con controles | Avisar que Clipper es IA; quitar «IA» de las reglas |

**Cosas que se veían mal** (corregidas el 2026-10-19, ver abajo): la pestaña «IA» de Métricas con cifras al azar, la
«confianza alta» del asistente del Calendario sobre reglas, `AiGeneratedBadge` en reglas (crear cita, reacomodo) y el
aviso de Clipper «Aún no hace cambios por ti».

---

## 01 Métricas

**Pendiente**
- ~~P0 · «Todas las sucursales» para el dueño~~ (hecho el 2026-10-19).
- ~~P0 · Pestaña «IA» con cifras al azar (`metricsTabs.ts`)~~ (hecho: «Sugerencias» sale de los datos).
- ~~P1 · Utilidad del periodo dentro de Métricas~~ (hecho el 2026-10-20: «El dinero del mes» en Negocio).
- P1 · Re-reserva, producto/servicio, retención por cohorte a 90 días; el tipo de cliente se reparte al azar.
- ~~P1 · Ocupación sobre el horario real~~ (hecho: horario de la sede, turnos de 45 min).
- P1 · ~~Metas y ritmo a la meta~~ (hecho el 2026-10-20); exportar; rango libre e interanual; renta separada del neto del equipo; «actualizado hace…».
- P2 · Comparar sucursales, LTV por canal (~~clientes por origen~~ hecho), vistas guardadas, ~~Marketing real~~ (hecho: sale del `utm`), borrar `features/dashboard`.

**IA que falta**: alertas de anomalías con estacionalidad + resumen semanal por WhatsApp; pronóstico de la semana;
herramientas de Clipper en las cinco pestañas; impulsores y detractores; coaching por barbero; comparación con pares.

## 02 Calendario

**Pendiente**
- ~~P0 · Estados `reschedule_requested` y `no_answer`; filtro «Sin confirmar mañana»~~ (hecho el 2026-10-19).
- ~~P0 · «Pedir anticipo» desde la cita~~ (hecho el 2026-10-19); tarjeta en archivo.
- P1 · Acción directa ante el riesgo (hoy es texto); WhatsApp desde la agenda (solo SMS/correo).
- P1 · Lista de espera priorizada; cola de walk-ins con espera; buffers (`prep`) en choques y sugerencias.
- P1 · Mover en táctil; partir `CalendarPage.tsx` (1.270 líneas); pila de deshacer.
- P2 · Apertura y cierre del día, paleta ⌘K, precio por franja aplicado, mover citas enlazadas juntas, duración aprendida.

**IA hoy**: riesgo de inasistencia (logística con pesos a mano), sugerencias, reacomodo, huecos y resumen del día
(reglas), agendar escribiendo (expresiones regulares), propuestas de Clipper (modelo).
**IA que falta**: acciones contra la inasistencia y guardar la respuesta para entrenar; hueco liberado → oferta
priorizada → cita hecha; Clipper en WhatsApp; repartir la tarde de quien se va; precio por franja sugerido.

## 03 Clientes

**Pendiente**
- ~~P0 · WhatsApp desde avisos (cumpleaños) y en selección múltiple~~ (hecho el 2026-10-19). (Permiso aparte para salud: hecho, ver abajo.)
- P1 · ~~Fotos y fórmula del corte; etiquetas; automatizaciones (cumpleaños, gracias, reseña); grupos
  guardados~~ (hecho el 2026-10-20); historial con entregado/respondió/reservó; fusionar duplicados; paginación y sucursal en el servidor.
- P2 · ~~Origen y referidos~~ (hecho el 2026-10-20), motivo del bloqueo, formularios firmados, datos de factura. Deuda: segmentos por hash.

**IA que falta**: borradores de reactivación redactados; perfil en 3 líneas; riesgo de abandono con motivos; siguiente
mejor acción; agente de WhatsApp que deja la cita hecha; notas por voz; sentimiento de reseñas.

## 04 Servicios y Productos

**Pendiente**
- ~~P0 · `$` fijo en formularios de Equipo (servicios y compensación)~~ (hecho el 2026-10-19, también en caja y catálogo);
  grupo de impuestos por artículo (no verificado).
- P1 · Precio y duración por nivel; add-ons; desempeño en la ficha; margen por hora en la lista; avisos de combos.
- P2 · Proveedores y órdenes de compra, insumos por servicio, código de barras, transferencias, variantes, kits, DIAN.

**IA que falta**: venta cruzada por afinidad; combos sugeridos; reposición con la agenda futura; precio por franja
asistido; alerta de duración real; asistente de catálogo con descripciones.

## 05 Transacciones

**Pendiente**
- P0 · ~~Libro de pagos de solo agregar; arqueo por denominación, a ciegas, entradas y salidas~~ (hecho el 2026-10-19);
  ~~cierre por turno; recargo por tarjeta como línea~~ (hecho el 2026-10-19); factura o POS electrónico DIAN.
- P1 · Bre-B/Nequi/transferencia en la caja y links de pago reales; ~~propinas por medio~~ (hecho el 2026-10-20) y reparto; filtros por barbero y
  método; cobro atómico de la visita; ~~vendedor en la venta de mostrador~~; aviso de cuentas abiertas.
- P2 · Vender paquetes y membresías en la caja; conciliación; autocobro por QR.

**IA que falta**: agente de cierre que explica la diferencia; pronóstico de caja; cobro de cuentas abiertas con link;
conciliación; propinas sugeridas.

## 06 Gastos

**Pendiente**
- ~~P0 · Valor con `$` y 2 decimales fijos; sin periodo ni `from/to`; sin `dueDay`; corte por hora del dispositivo;
  categorías cerradas~~ (hecho el 2026-10-19, ver abajo).
- P1 · ~~Cuentas por pagar~~ (hecho el 2026-10-20); caja menor ligada al cierre; proveedores como entidad; comprobantes en el CSV; registro de
  cambios; ficha de solo lectura; búsqueda por proveedor.
- P2 · Presupuestos, rentabilidad por silla, documento soporte DIAN, contabilidad, aprobación.

**IA que falta**: foto → gasto; categoría que aprende por proveedor; duplicados y atípicos; CFO en Clipper; captura por
WhatsApp; pronóstico de caja a 90 días.

## 07 Nómina

**Pendiente**
- ~~P0 · Ventas de mostrador fuera de la nómina; quincena; préstamo en cuotas y faltante de caja~~ (hecho el 2026-10-19).
- P1 · ~~Comprobante PDF y por WhatsApp~~; dispersión bancaria; ~~propinas efectivo/tarjeta~~ (hecho el 2026-10-20); clasificación laboral; exportar a
  Alegra/Siigo/Aleluya/Buk; más esquemas de comisión; metas del barbero; comparación con el periodo anterior.
- P2 · Horas y recargos, PILA/IBC, nómina electrónica, bolsa de propinas, multi-sucursal.

**IA que falta**: simulador de esquemas; asistente del barbero en Mi pago; metas con progreso; cumplimiento Colombia;
pronóstico del costo de personal.

## 08 Equipo

**Pendiente**
- ~~P0 · «Cargar miembros», «Recordar invitación» y «Desactivar» sin acción; Mi ficha no editable; datos bancarios en claro~~
  (hecho el 2026-10-19, ver abajo); ~~`/usuarios/lista` con el enum de la plantilla~~ (retirada).
- P1 · Fichaje; turnos abiertos e intercambio; metas y niveles con criterios; cambio comisión ↔ renta con fecha; estado
  de cuenta de renta; invitación real e importación; turnos partidos.
- P2 · Portafolio, formación, documentos firmados, ranking.

**IA que falta**: agente que cubre ausencias; coaching semanal; asignación por habilidad para «sin preferencia»; reseñas
por barbero; horas según demanda; sobrecarga.

## 09 Configuración

**Pendiente**
- ~~P0 · Paquete por país (festivos, zonas, NIT); puesta en marcha precargada~~ (hecho el 2026-10-19); pasarela real y Bre-B;
  inicio propio de la puesta en marcha.
- P1 · Plantillas de mensajes editables; ~~horario por sucursal y por día~~; importar catálogo y equipo; registro de cambios;
  integraciones (Google, Instagram); plan y facturación; búsqueda por campo.
- P2 · Exportar todo, ajustes heredados por sucursal, preferencias en el servidor, dominio propio.

**IA que falta**: configurar conversando con borrador; importación asistida; auditoría con cifras propias; redactor de
políticas; búsqueda en lenguaje natural.

## 10 Reserva en línea

**Pendiente**
- P0 · Pasarela real, Bre-B; ~~leer las respuestas de WhatsApp~~ (hecho el 2026-10-19); contrato de `phone/check`.
- P1 · Versión elegida por barbería y embudo por versión; cliente de confianza sin anticipo y cargo por inasistencia;
  `surge`, promos y populares fijos; JSON-LD, `llms.txt`, Reserva con Google, Instagram, Wallet; modelo detrás de
  `interpret`; partir archivos grandes.
- P2 · Referidos, MCP público, reglas de lista de espera, recepcionista por voz, prueba virtual.

**IA que falta**: Clipper en WhatsApp; «lo de siempre» con un sí; reservable por agentes; riesgo que ajusta anticipo y
recordatorios; foto de referencia descrita; horas y barbero recomendados.

## 11 Clipper

**Pendiente**
- P0 · Correr la evaluación con clave real; caducidad del historial; ~~aviso «Aún no hace cambios por ti»~~ (corregido);
  cupos compartidos (hoy en memoria).
- P1 · Un solo núcleo con la reserva; foco por cliente, barbero, nómina y métricas; resumen del día; conversación por voz;
  historial en el servidor.
- P2 · WhatsApp entrante, notas por voz, recepcionista telefónico, MCP para el dueño, cupo de IA en la facturación.

## 12 Acceso y puesta en marcha

**Pendiente**
- ~~P0 · «Ver como» de solo lectura; cuenta regresiva y desbloqueo con correo; avisos de nuevo dispositivo; el registro
  no abre sesión y no detecta celular repetido~~ (hecho el 2026-10-19).
- P1 · Invitar al equipo por WhatsApp; importar catálogo, equipo y citas; código por WhatsApp; cambiar número; passkeys;
  sesiones y dispositivos; modo tablet con PIN; cookie `httpOnly`; sesión firmada con Google y Microsoft.

**IA que falta**: lista de precios desde una foto; puesta en marcha conversacional; «qué te falta para abrir» redactado.

## 13 Avisos y ayuda

**Pendiente**
- ~~P0 · Evento «reprogramación»; WhatsApp fallido con «llamar / reintentar»~~ (hecho el 2026-10-19).
- P1 · PWA y push; WhatsApp al dueño; preferencias por persona; ⌘K sobre datos; ayuda por pantalla; «¿Te sirvió?» en el
  servidor; Centro de procesos con trabajos del servidor.

**IA que falta**: resumen diario por WhatsApp; prioridad y agrupación; ayuda que sabe la pantalla; explicar un descuadre.

## 14 Experiencia del barbero

**Pendiente**
- ~~P0 · «Hoy» en el celular muestra lo cobrado, no lo que gana~~ (hecho el 2026-10-19).
- P1 · ~~Quincena~~; % de cada deducción; «Mi negocio» con gastos; «Mi reputación»; metas; mis clientes por volver; PDF y
  certificado; avisos de dinero; «Esto no cuadra»; Mi ficha.

**IA que falta**: mis clientes por volver con mensaje aprobado; resumen semanal con una acción; lo que dicen de mí;
revisión de su pago.

## 15 Marketing y fidelización

**Pendiente**
- ~~P0 · STOP/BAJA por webhook; franja horaria y tope mensual; Métricas › Marketing al azar; reseñas de ejemplo en la
  reserva pública; tarjeta de regalo sin envío~~ (hecho el 2026-10-19); membresía fija en el panel de la cita.
- P1 · ~~Campañas; automatizaciones, reseña en Google, cupones administrables, canje en la caja, referidos~~ (hecho el
  2026-10-20); correo.

**IA que falta**: reactivación automática con tope y hora habitual; texto de campaña; segmentos sugeridos; clasificador de
respuestas; retorno por canal con UTM.

## 16 Front Desk

**Pendiente**
- ~~P0 · Kiosco por sede; check-in que avisa; cola de walk-ins; la cita nueva cae en la primera sucursal; el walk-in
  nace «programado»; `waitlistJoined` sin emitir~~ (hecho el 2026-10-19); `phone/check` sin perfil (decisión del usuario: no se toca).
- P1 · ~~«Ya casi te toca»~~, QR de fila, ~~pantalla `/turnos`~~, PIN del personal, terminal, propina en pantalla, ~~idioma grande~~.

**IA que falta**: espera estimada; «¿hay turno?» por WhatsApp; afluencia del día; barbero sugerido para el walk-in.

## 17 Paso a producción y legal

**Pendiente**
- P0 · Backend real con `tenant_id` y RLS; cookie `httpOnly`; pasarela real; ~~horarios legales y STOP/HELP~~; permiso de
  ~~salud~~; ~~paquete legal y DPA~~ (borradores); ~~borrar y exportar cliente~~; voz con plan pago; Sentry, copias, PITR; aviso de privacidad CO.
- P1 · Límites compartidos; archivos privados; auditoría; DIAN; 10DLC; entornos; ~~cuenta bancaria enmascarada; insignias
  «IA» sobre reglas; Clipper se presenta como IA~~; accesibilidad con axe; retención.

---

## Hecho el 2026-10-19 después de esta revisión

Se va completando aquí lo que se corrige a partir de esta lista.

- **Lo que se veía mal.**
  - Métricas › «IA» pasó a llamarse «Sugerencias», y la retención, las fichas sin visita y el ritmo medio salen de los datos.
  - `AIInsightCard` ya no muestra «confianza alta» por defecto.
  - Sin `AiGeneratedBadge` en las sugerencias de hora ni en el reacomodo.
  - Clipper se presenta como asistente de IA y dice que los cambios se aplican solo con aprobación (01, 02, 11, 17).
- **Respuestas de WhatsApp (02 P0, 10 P0, 13 P0, 15 P0).**
  - Webhook firmado (`/api/whatsapp/webhook`) que clasifica con reglas: confirmar, otra hora, no puede, BAJA/STOP, ALTA y otra cosa.
  - BAJA bloquea las promociones en el servidor. Los estados entregado y leído quedan en el mensaje, y un fallo después de aceptado lo marca fallido.
  - Bandeja por barbería (`/api/whatsapp/inbox`) que la app aplica:
    - la cita queda confirmada, «pidió otra hora» (`reschedule_requested`) o «no puede venir» (`declined`), con marca en la tarjeta e historial;
    - BAJA retira el permiso del cliente;
    - lo que hay que resolver avisa a recepción (`whatsappReply`).
  - «Cancelar» no cancela sola la cita: recepción decide.
  - En la demo, «Simular respuesta del cliente» en la cita.
  - Falta:
    - las plantillas con botones aprobadas en Meta;
    - mover la cita desde la respuesta en un toque;
    - reflejar «entregado/leído» en la pantalla;
    - el filtro «Sin confirmar mañana».
- **Front Desk (16 P0).**
  - Kiosco por sede con código de 6 dígitos y token propio, que se desactiva desde Configuración › Agendamiento online.
  - `/kiosco` con:
    - check-in que muestra solo nombre de pila y hora, pasa la cita a «Llegó» y avisa al barbero y a recepción (`clientArrived`);
    - fila sin cita con lugar y espera aproximada;
    - idioma y letra grande;
    - vuelta sola al inicio.
  - En Calendario, «Fila sin cita» con «Llamar» (crea la cita «Llegó» con quien le toca) y «Se fue».
  - Falta:
    - el PIN del personal;
    - que `phone/check` de la reserva deje de devolver el perfil (decisión del usuario del 2026-10-13: no se toca);
    - la cita nueva desde la agenda sigue cayendo en la primera sede del barbero.
- **Marketing honesto (01 P2, 15 P0).**
  - Métricas › Marketing sale del `utm` que guarda cada cita en línea (la reserva lo copia a cada cita):
    - canales por `utm_source` (sin él, «Directo», que no cuenta como mejor canal);
    - campañas por `utm_campaign`, con el ingreso cobrado;
    - conversión sobre las sesiones medidas del embudo.
  - Nada al azar. La semilla trae un `utm` fijo por cita en línea.
  - Las reseñas de ejemplo existen solo en la demo (`VITE_SAMPLE_DATA`), van marcadas y nunca se mezclan con las reales: la primera real las reemplaza. Sin reseñas no se muestra calificación.
  - Falta: campañas administrables, el origen del cliente (no solo de la cita) y referidos.
- **Fila viva, segunda parte (16 fase 2).** «Ya casi te toca» por mensaje, una vez, con «Voy» / «Ya no voy» (que lo saca de la fila), y la pantalla de turnos `/turnos` para el televisor (solo nombre de pila, turno y espera), con el token de un kiosco de la sede.
- **Contratos y políticas (17 P0, borradores).**
  - Términos, privacidad, tratamiento de datos de Colombia, acuerdo de encargo (DPA) y subencargados, versionados y públicos en `/legal`.
  - El registro los enlaza y manda la versión aceptada.
  - La barbería acepta el acuerdo en Configuración › Plan y facturación (versión, fecha y quién).
  - El pie de la app enlaza términos y privacidad.
  - El aviso de la reserva dice el contacto de la sede, que los datos están en EE. UU. y enlaza la política.
  - Falta:
    - la revisión del abogado y completar lo que va entre corchetes;
- **Datos de salud y derechos del cliente (17 P0).**
  - Permiso aparte para alergias y medicamentos (versión `health-…`, quién lo anotó): sin él el servidor rechaza esas notas (`409 health_consent_required`) y el formulario lo avisa; retirarlo las borra. Lo anota recepción o gerencia, no el barbero.
  - Ficha › «Datos y privacidad»: exportar todo lo del cliente en JSON, borrarlo (anonimiza, con confirmación de identidad; citas y cobros quedan sin datos personales) y anotar lo que pidió por teléfono, correo o en el local.
  - Registro de solicitudes con plazo por país (CO 10/15 días hábiles, MX 20, EE. UU. 45) y «Vencida»; cajón global en Clientes › «Solicitudes de datos».
  - Falta: festivos en el plazo, el permiso de salud desde la reserva, avisar al cliente al responder y borrar también de las copias de seguridad (backend real).
- **Horario legal de promociones y STOP en SMS (17 P0).**
  - Franja por país a la hora de la sede (`src/features/legal/sendWindow.ts`, la usan la app y el servidor): Colombia L–V 7–19, S 8–15, sin domingos ni festivos (Ley 2300; festivos calculados); EE. UU. 8–21 con Florida, Oklahoma, Maryland, Washington, Connecticut y Texas más estrictos (TCPA y leyes estatales); México y el resto L–S 9–20.
  - La cola del servidor exige la sede en cada promoción, la aplaza a la próxima apertura y, justo antes de enviar, vuelve a mirar la franja y la BAJA. «Reactivar» y el «te toca volver» manual avisan cuándo saldrá.
  - SMS: webhook `/api/sms/inbound` (Twilio, firmado) con STOP/BAJA, START/ALTA y HELP/AYUDA; STOP corta todos los SMS del número y las promociones, queda en el registro de solicitudes y en la ficha; todo SMS lleva «Responde STOP o BAJA…».
  - Tope de una promoción por cliente cada 30 días en la cola del servidor y en la app (la reactivación y el «te toca volver» o cumpleaños escritos a mano cuentan juntos).
  - Festivos de EE. UU. (federales, con el día observado) y de México (LFT art. 74) fuera de la franja, por regla de producto.
  - Falta: festivos estatales de EE. UU., 10DLC y el envío real de SMS (hoy simulado), y la revisión del abogado.
- **Equipo: acciones y permisos en el servidor (08 P0).**
  - «Cargar miembros» (lista pegada o CSV, vista previa, entran invitados), «Recordar» (a invitados, una vez al día; envío simulado) y «Desactivar» en lote (sale de la fila y de «sin preferencia», avisa sus citas por venir).
  - El servidor exige quién gestiona a quién: antes cualquiera con sesión podía editar cualquier ficha y ver la de un colega completa.
  - «Mi ficha»: el barbero y recepción editan cómo se presentan y su contacto; nivel, servicios, dinero y permisos siguen con gerencia.
  - La cuenta bancaria sale enmascarada; «Ver número» y cambiarla piden confirmar la identidad. La renta usa el símbolo de la moneda de la sede.
  - Falta: invitación real por SMS o correo, reasignar las citas del desactivado desde el aviso y `/usuarios/lista`.
- **Transacciones: libro de solo agregar y caja (05 P0).**
  - Borrar una venta ya no la saca del libro de pagos: queda el cobro con su fecha y un contramovimiento «Anulación» con quién y por qué.
  - Cierre de caja: conteo por billetes y monedas de la moneda de la sede (el servidor vuelve a sumar), a ciegas para recepción (la diferencia aparece al cerrar y la revisa gerencia) y entradas y salidas de efectivo del cajón con motivo.
  - Falta: cierre por turno, DIAN, recargo por tarjeta como línea, aviso a gerencia de un cierre a ciegas con diferencia.
- **Gastos (06 P0).**
  - Navegación por mes (el resumen y la lista son del mes; `from/to` en la API), día de pago en los fijos, categorías propias (las crea gerencia; al borrarlas sus gastos pasan a «Otros»), el valor con la moneda y los decimales de la sede, y el «hoy» con la zona de la sede.
  - Falta: avisos de pagos por vencer, cuentas por pagar, proveedores como entidad.
- **Nómina (07 P0).**
  - Quincena de verdad: del 1 al 15 y del 16 a fin de mes (o desde el día elegido), compartida por la pantalla y el cálculo (`payCycle.ts`); Nómina abre en el ciclo en curso y avanza de ciclo en ciclo.
  - Ventas de mostrador con «Quién vendió»: comisionan como producto en su nómina (el barbero vende a su nombre).
  - Préstamos en cuotas: se registran en la ficha de nómina, la cuota sale sola en cada ciclo y cancelar frena lo que falta.
  - Faltante de caja: ajuste propio y, desde el cierre con faltante, «Descontar en su nómina».
  - Falta: comprobante PDF, dispersión bancaria, propinas por medio y el préstamo como salida de caja.
- **Front Desk (16 P0, lo que quedaba).** La cita va a la sede de la cabecera si el barbero trabaja ahí; el walk-in de hoy nace «llegó»; apuntarse a la lista de espera avisa a recepción.
- **Calendario, Clientes y Avisos (02, 03 y 13 P0).**
  - «No contestó»: le salió el mensaje que pide confirmar hace más de 2 h y no respondió; se ve en el badge de la cita. Filtro «Sin confirmar» (con las que no contestaron) y atajo «Ver las de mañana sin confirmar».
  - WhatsApp a varios: desde la selección de la lista o desde el aviso activo (cumpleaños, les toca volver…), con `{nombre}` y `{días}`; el servidor dice a quién no (sin celular, sin permiso, fuera de horario, tope) y cada chat se abre con un clic y queda anotado.
  - Avisos: «Cita movida» a recepción y al barbero; el WhatsApp fallido trae «Llamar» y «Reintentar».
  - Falta: marca de «no contestó» en la tarjeta de la agenda (el panel de la cita lo está rediseñando otra sesión) y llamar desde la agenda.
- **Métricas, barbero, regalo y acceso (01, 14, 15 y 12 P0).**
  - Métricas › «Todas las sucursales» para el dueño (suma de las sedes; no mezcla monedas).
  - El barbero ve «Hoy ganas» en la agenda, también en el celular, con el mismo cálculo que «Mi pago».
  - La tarjeta de regalo manda su código por WhatsApp (plantilla `tarjeta_regalo`) y recepción la reenvía desde la ficha.
  - Aviso de dispositivo nuevo para la propia cuenta, con «No fui yo» que cierra las demás sesiones.
  - Falta: «Cómo te fue» de todas las sucursales, la vista Agenda por defecto en el celular del barbero, aviso por SMS o correo del dispositivo nuevo y passkeys.
- **Paquete por país y acceso (09 y 12 P0).**
  - Colombia, México y EE. UU. traen su moneda, zonas, identificación fiscal (NIT con dígito de verificación, RFC, EIN, validados en la app y el servidor), impuesto habitual y pasarelas que operan allí. Elegir el país en una sucursal lo pone todo.
  - Festivos con nombre por país (Ley Emiliani y Semana Santa en Colombia, federales con el día observado en EE. UU., LFT en México), los mismos que usa la franja de promociones. El negocio elige en qué festivos cierra por motivo y cada sede cierra el de su país; la reserva no ofrece horas ese día.
  - El registro entra directo: crea la sucursal con el paquete del país, el IVA habitual, los festivos y la ficha de la dueña, y dice qué quedó listo. Un celular o un correo que ya tienen cuenta se rechazan, solo después de verificar el código.
  - Bloqueo de 15 min → 1 h → 24 h con cuenta regresiva, desbloqueo con el correo de respaldo y aviso a la cuenta; «Reenviar código» espera 30 s.
  - «Ver como» es de solo lectura en el servidor (`X-View-As`).
  - Falta: barbería aparte por registro (el mock tiene una), pasarela real, horario por sede y factura electrónica DIAN.
- **Anticipo, caja, horario y limpieza (02, 04, 05, 08 y 09).**
  - «Pedir anticipo» en el panel de la cita: monto (30 %, 50 % o todo), SMS o correo con el enlace `/reservar/anticipo`; pagado, pasa a lo pagado en línea (la caja cobra el resto). Solo con pasarela conectada en la sede.
  - Horario de cada sucursal día por día (Configuración › Sucursales): la reserva no ofrece horas fuera ni los días que cierra, la página de la sede lo publica y la ocupación de Métricas se mide contra él.
  - Caja por turnos: «Cerrar turno» deja la caja abierta y el siguiente cuenta desde ahí (abre con lo contado); «Cerrar el día» la cierra.
  - El recargo por tarjeta queda como línea de la cuenta: el total de Transacciones cuadra con el datáfono.
  - El símbolo de la moneda de la sede en Equipo, caja, servicios y productos (antes `$` fijo).
  - `/usuarios/lista` (la lista de la plantilla) se retiró; «Ver barbero» de la agenda abre su ficha.
  - Falta: tarjeta en archivo con cargo por inasistencia, la pasarela real que confirma el pago y horario con descansos (turnos partidos).
- **Clientes y marketing (03 y 15, 2026-10-20).**
  - Cortes: la fórmula (máquina, números, degradado, barba, producto, notas) y hasta 4 fotos del resultado, en la pestaña «Cortes» de la ficha, con «Repetir»; el último sale en el resumen.
  - Etiquetas: en la ficha, en lote desde la lista («Etiquetar») y como filtro de la lista (`?etiqueta=`).
  - Origen («¿cómo nos conociste?») y referidos: código fijo por cliente, «Copiar invitación», alta con código; al cobrarse la primera visita del referido los dos reciben saldo a favor (Configuración › Referidos y mensajes automáticos).
  - Cupones administrables (Configuración › Cupones): fechas, tope total y por cliente, primera visita, servicios, encendido; valen en la reserva y en la caja («Canjear un cupón»), y cada uso queda anotado.
  - Mensajes automáticos con interruptor: gracias tras la primera visita, pedir reseña (Google o la reserva, a todos, una vez al mes) y feliz cumpleaños (con permiso, franja legal y tope).
  - Falta: campañas a un grupo, grupos guardados, plantillas aprobadas en Meta para los tres mensajes nuevos y el origen en Métricas › Marketing.
- **Campañas (15 P1, 2026-10-20).**
  - Grupos guardados en Clientes (segmento, aviso, etiqueta y el nuevo filtro por origen), con su tamaño de hoy.
  - «Campaña a este grupo»: texto con {nombre} y {cupon}, cupón, ahora o programada; antes de mandar, la vista previa dice a cuántos sí, a quiénes no y por qué (sin permiso, sin celular, tope del mes, bloqueados), cómo le llega a un cliente y el costo estimado con el precio de Meta por país.
  - Cada mensaje sale en la franja legal de su sede y cuenta para el tope mensual (la cola del servidor lo trata como marketing).
  - «Campañas mandadas»: salieron, reservaron en 14 días, lo cobrado, usos del cupón, costo y retorno; cancelar lo pendiente.
  - Métricas › Marketing: clientes atendidos por origen (y cuántos nuevos) y lo cobrado por origen.
  - Falta: la plantilla `campana_promocion` aprobada en Meta, entregado y leído reales en los resultados, y correo como canal barato.
- **Dinero (01, 05, 06 y 07 P1, 2026-10-20).**
  - Métricas › Negocio, para dueño y administrador con una sede: «El dinero del mes» con la utilidad (del estado de resultados, margen y variación frente a los mismos días del mes anterior) y la meta de ingresos con su ritmo: cuánto va, en cuánto cierra al paso de hoy y cuánto falta por día. La meta se pone, cambia o quita ahí mismo.
  - Gastos › «Por pagar»: los vencimientos de los gastos fijos del mes según su frecuencia y su día de pago, en vencidos, esta semana, más adelante y pagados; «Marcar pagado» deja quién y cuándo y se puede deshacer. El barbero de renta ve los suyos.
  - Nómina: la propina se separa en efectivo y tarjeta (por línea y en total). Si la barbería entrega en caja la de efectivo (Configuración › Nómina), se resta del neto para no pagarla dos veces.
  - Comprobante de pago por persona y periodo (`/nomina/comprobante`, desde el detalle): imprimir o guardar en PDF y enviarlo por WhatsApp con el resumen.
  - Falta: avisos de pagos por vencer, el pago ligado a la caja, reparto de propinas (bolsa), dispersión bancaria y metas por barbero.
