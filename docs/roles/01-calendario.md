# Calendario

Investigación del 2026-10-03, parte del plan de roles (`docs/ROLES_PLAN.md`). En el calendario, **dueño y
administrador** ven y hacen todo en su sucursal. **Recepción** opera el día completo (agenda, check-in, cobro, espera,
bloqueos) pero **sin cifras agregadas** [N]. El **barbero por comisión** ve **solo su columna** con las mismas acciones
[P], agenda con las reglas de la casa y de fábrica **no crea bloqueos** [M]. El **barbero de renta** también ve solo lo
suyo, pero como su propio negocio: bloquea su agenda y **crea** sus vacaciones sin pedir permiso [M][P], agenda sin las
reglas de la tienda y ve sus cifras [D]. Producción solo se recorrió como **Dueño** y **Barbero por comisión**: lo de
admin, recepción y renta sale de la matriz de fábrica.

**Marcas.** [P] visto en producción · [M] matriz de permisos de fábrica (`centro-de-ayuda/casos/modelo-sucursales-roles-permisos.md` §5, l. 101-144) · [N] Notion · [D] decisión propuesta aquí.
**Celdas.** `✅` puede · `👁` solo ver · `🔒 suyo` solo sobre lo suyo · `—` no lo ve · `?` sin dato.
**Permiso.** `fila·columnas` de la matriz con los ids de `src/features/team/permissionsCatalog.ts` (`calendar` = «Calendario», `appointments` = «Reservar citas», `block-calendar` = «Bloquear calendario», `clients`, `client-info` = «Información del cliente», `team`, `barber-order` = «Ordenar barberos agendas», `kpis`, `products`, `prices` = POS·Precios, `closures` = «Fechas de cierre»). V·C·E·B·A = Ver·Crear·Editar·Borrar·Activo.
**Fuentes abreviadas.** `CAL` = `centro-de-ayuda/casos/calendario.md` · `MOD` = `centro-de-ayuda/casos/modelo-sucursales-roles-permisos.md` · `FD` = `centro-de-ayuda/casos/front-desk.md` · `art/x` = `centro-de-ayuda/content/es/calendario/x.md` · `guia/x` = `content/es/empezar/x.md` · `perm/x` = `content/es/roles-y-permisos/x.md` · `conf/x` = `content/es/configuracion/x.md`. En Thema las rutas son relativas a `src/features/calendar/` salvo que se diga otra cosa.

---

## 2. Inventario de acciones

### 2.1 Entrar y cabecera

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver el módulo Calendario en el menú | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [M] | `calendar·A` | MOD l. 109, 179 | ✓ (`src/app/navigation`, sin mirar permiso) |
| Pantalla de inicio al entrar | Métricas [P] | Métricas [D] | Calendario [D] | Calendario [P] | Calendario [D] | — | MOD §6b l. 174-175 | ✗ (siempre la misma ruta) |
| Cifra «US$ X cobrados de Y» junto al título | ✅ [D] | ✅ [D] | — [N] | 🔒 suyo [D] | 🔒 suyo [D] | `kpis·A` [D] | No existe en producción; Notion «recepción sin números» | ✓ solo Thema (`CalendarPage.tsx` l. 627-631, `pulseModel.ts`), sin recorte |
| Migas «Inicio › Calendario» (Inicio lleva a Métricas) | ✅ | ✅ | ✅ → Calendario [D] | ✅ | ✅ | `kpis·A` | — | ✓ `CalendarPage.tsx` l. 619 (siempre a `/metricas`) |
| Atajos de teclado (C, T, A/D/S/M, ←/→, Z, IA, huecos) | ✅ | ✅ | ✅ | ✅ (los de su alcance) [D] | ✅ [D] | según la acción | — | ✓ `useCalendarShortcuts.ts` (no miran rol) |
| Sucursal activa (selector de la cabecera) decide qué agenda | ✅ todas [P] | Las suyas [?] | La suya [D] | La suya [D] | La suya [D] | — | `perm/de-que-depende-lo-que-ves` | ✓ `branchId` en `CalendarPage.tsx` l. 149 (sin recorte por rol) |

### 2.2 Barra: fecha, vistas y quién se ve

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Día anterior / siguiente / campo de fecha / «Hoy» | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [M] | `calendar·A` | CAL l. 10-11 | ✓ `CalendarToolbar.tsx` |
| Vista **Dia** (rejilla por barbero) | ✅ todas las columnas [P] | ✅ [M] | ✅ [M] | 🔒 suyo: solo su columna [P] | 🔒 suyo [D] | `calendar·A` | CAL l. 17; MOD l. 182 | ✓ `CalendarDayView.tsx`; ✓ recorte en el servidor (`mocks/calendar/scope.ts`) |
| Vista **Agenda** (lista del día) | ✅ [P] | ✅ [M] | ✅ [M] | 🔒 suyo [D] | 🔒 suyo [D] | `calendar·A` | CAL l. 31-34 | ✓ `CalendarAgendaView.tsx`; ✓ recorte en el servidor |
| Vista **Mes** (ocupación por día, «Ocup. 0.79 %») | ✅ elige barbero [P] | ✅ [M] | ✅ conteo; ocupación ? [D] | 🔒 suyo, sin selector [D] | 🔒 suyo [D] | `calendar·A` (+`kpis·A` para el %) [D] | CAL l. 36-39 | ✓ `CalendarMonthView.tsx` (KPIs «Ocupación media», «Día más lleno»); ✓ recorte en el servidor |
| Vista **Semana** (fila por barbero, % de jornada) | ✅ [D] | ✅ [D] | ✅ sin % [D] | 🔒 su fila [D] | 🔒 su fila [D] | `calendar·A` | Solo Thema | ✓ `CalendarWeekView.tsx`; ✓ recorte en el servidor |
| Filtro **Equipo\*** (Trabajando / Todo el equipo / un barbero) | ✅ [P] | ✅ [M] | ✅ [M] | — (no hay filtro; solo su columna) [P] | — [D] | `calendar·A` | CAL l. 8-9; `art/filtrar-el-calendario-por-equipo` | ✓ `TeamPicker.tsx` (multi-barbero, más que producción); ✗ ocultar a barberos |
| «Nadie trabaja este día» → **Ver todo el equipo** | ✅ [P] | ✅ [M] | ✅ [M] | — [D] | — [D] | `calendar·A` | CAL l. 23-24 | ✓ `CalendarDayView.tsx` (`calendar.nobody.*`) |
| «Nadie trabaja este día» → **Configurar horarios** | ✅ [P] | ✅ [M] | — (sin Equipo) [M] | — [D] | — [D] | `team·E` | CAL l. 24 | ✓ navega a `/usuarios` (`CalendarPage.tsx` l. 737) |
| Línea roja de la hora actual, franjas sombreadas fuera de jornada | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `calendar·A` | CAL l. 21-22 | ✓ `ResourceDayGrid` |
| Filtros: estado (pulso), servicio, tipo de cliente | ✅ [D] | ✅ [D] | ✅ [D] | ✅ sobre lo suyo [D] | ✅ sobre lo suyo [D] | `calendar·A` | Solo Thema (`?foco=`) | ✓ `CalendarFilters.tsx`; los contadores salen de todas las citas |
| «Solo huecos disponibles» | ✅ [D] | ✅ [D] | ✅ [D] | 🔒 suyo [D] | 🔒 suyo [D] | `appointments·C` | Solo Thema | ✓ `CalendarPage.tsx` l. 494-508 |
| Ajustes de vista (color por, estilo, qué cuenta la tarjeta, densidad) | ✅ | ✅ | ✅ (sin «precio» si se oculta) [D] | ✅ | ✅ | preferencia personal | Solo Thema | ✓ `CalendarViewOptions.tsx`, `calendarCardPrefs.ts` (localStorage, no por rol) |
| Tarjeta: cliente, tipo (VIP…), servicio **y precio**, hora, barbero, aviso, botón de estado | ✅ [P] | ✅ [M] | ✅ con precio de la cita [D] | ✅ las suyas [P] | ✅ las suyas, con **su** precio [N] | `calendar·A`, `prices·A` | CAL l. 26-29 | ✓ `calendarModel.ts` `toEvent`; precio del catálogo, no del barbero |
| Menú ajustes (deslizadores): **Horario de trabajo** | ✅ [P] | ✅ [M] | — [M] | 👁 (ve Horas de trabajo) [P] | — [M] → su horario [D] | `team·V/E` | CAL l. 12-13; MOD l. 184 | ✓ rail «Horario de trabajo» → `/usuarios` (`CalendarPage.tsx` l. 303; debería ir a `/usuarios/horarios`) |
| Menú ajustes: **Lista de espera** | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P*] | ✅ [M] | sin fila (¿`appointments`?) | CAL l. 13 | ✓ rail «Lista de espera» |

\* El de comisión ve «las mismas Acciones» en la barra (MOD l. 182); el menú de ajustes no se describió para ese perfil.

### 2.3 Columna del barbero y su menú

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la columna de cada barbero (foto, nombre) | ✅ [P] | ✅ [M] | ✅ [M] | 🔒 solo la suya [P] | 🔒 solo la suya [D] | `calendar·A` | CAL l. 19; MOD l. 182 | ✓ sin recorte |
| Orden de las columnas | lo fija el dueño [M] | lo sigue | lo sigue | n/a | n/a | `barber-order` (solo dueño) [M] | MOD l. 122 | ✓ orden del catálogo (`/usuarios/orden`) |
| Menú del nombre → **Ver barbero** | ✅ [P] | ✅ [M] | — (sin Equipo) [M] | 👁 su ficha [D] | 👁 su ficha [D] | `team·V` | CAL l. 19 | ✓ `CalendarPage.tsx` l. 738 (a la lista con búsqueda) |
| Menú del nombre → **Editar perfil de barbero** | ✅ [P] | ✅ [M] | — [M] | — [M] | — [M] | `team·E` | CAL l. 19-20 | ✗ no está en el menú |
| Menú del nombre → **Crear bloque de tiempo** (en Mes) | ✅ [P] | ✅ [M] | ✅ [M] | — (V) [M] | 🔒 suyo [M] | `block-calendar·C` | CAL l. 39 | ✓ «Bloquear» en Día (`CalendarPage.tsx` l. 739) |
| Menú del nombre → **Reacomodar retrasos** | ✅ [D] | ✅ [D] | ✅ [D] | 🔒 su cola, con reglas [D] | 🔒 su cola [D] | `appointments·E` | Solo Thema | ✓ `CalendarPage.tsx` l. 395-415 |
| Aviso en la cabecera de columna «hueco libre · N en espera» | ✅ [D] | ✅ [D] | ✅ [D] | 🔒 suyo [D] | 🔒 suyo [D] | `appointments·C` | Solo Thema | ✓ `CalendarPage.tsx` l. 564-578 |

### 2.4 Crear cita

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Crear cita** (Acciones / tecla C) | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [M] | `appointments·C` | CAL l. 15, 41-46; MOD l. 110 | ✓ `CreateAppointmentDrawer.tsx` |
| Tocar franja vacía → alta con barbero y hora puestos | ✅ [P] | ✅ | ✅ | ✅ su columna [P] | ✅ su columna [D] | `appointments·C` | CAL l. 25; `guia/guia-del-barbero-por-comision` | ✓ `CalendarPage.tsx` l. 324 |
| Campo **Cliente**: buscar en «N clientes» | ✅ todos [P] | ✅ [M] | ✅ [M] | ✅ todos hoy [P] → suyos + nuevos [D] | 🔒 suyos + nuevos [D] | `clients·V` | CAL l. 48-49 | ✓ `SearchableSelect`; ✓ los ajenos llegan solo con el nombre |
| Cliente → **Crear cliente** | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [M] (contradicción, ver §5) | ✅ [M] | `clients·C` | CAL l. 48; `art/crear-una-cita-para-un-cliente-nuevo` | parcial: navega a `/clientes` y pierde el alta (`CalendarPage.tsx` l. 789) |
| Cliente → **Walk in** (cliente genérico) | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `appointments·C` | CAL l. 49 | ✓ `cli_walkin` primero |
| Teléfono del cliente en la lista (enmascarado `000******0000`) | 👁 enmascarado [P] | 👁 [D] | 👁 [D] | 👁 enmascarado [P] | 👁 [D] | `client-info·A` ? | CAL l. 49; MOD l. 185 | ✗ seed con teléfono completo |
| Campo **Servicio** (categorías, duración, precio «& SUBIENDO») | ✅ [P] | ✅ | ✅ | ✅ [P] | ✅ con su precio [N] | `appointments·C`, `prices·A` | CAL l. 50-51 | ✓ multi-servicio (producción: uno) |
| Campo **Barbero** (filtro por nivel) | ✅ cualquiera [P] | ✅ [M] | ✅ [M] | 🔒 fijo a sí mismo [D] (? en producción) | 🔒 fijo a sí mismo [D] | `appointments·C` | CAL l. 52 | ✓ selector libre; ✗ fijar |
| Campo **Fecha & Hora** (tira de días, Mañana/Tarde/Noche) | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `appointments·C` | CAL l. 53-54 | ✓ `TimeSlotPicker` + huecos sugeridos |
| Interruptor **Cliente sin cita previa** (comisión walk-in) | ✅ [P] | ✅ | ✅ | ✅ [P] | ✅ (aplica deducción) [P] | `appointments·C` | CAL l. 43-44; `art/cliente-sin-cita-previa` | ✓ `walkIn` |
| **Repetición** (semanal … cada tres meses) | ✅ [P] | ✅ | ✅ | ✅ [D] | ✅ [D] | `appointments·C` | CAL l. 45-46 | ✓ serie de 12 (`API_CONTRACT.md` l. 175) |
| **Barbero pedido** / sin preferencia | ✅ [P] | ✅ | ✅ | n/a (es él) | n/a | `appointments·C` | CAL l. 66-67 (FIDELIDAD) | parcial: `requestedBarberId` = barbero elegido; ✗ opción «sin preferencia» explícita |
| Asignación automática de cliente sin preferencia / sin cita según el orden | ✅ define [P] | ✅ (Póngase en fila) [M] | usa [?] | recibe [?] | **no aplica** [N] | `lineup`, `barber-order` | `art/clientes-sin-preferencia-de-barbero`; Notion | ✗ (el orden existe en `/usuarios/fila`, el alta no lo usa) |
| Nota para el barbero | ✅ | ✅ | ✅ | ✅ | ✅ | `appointments·C` | Solo Thema | ✓ `notes` |
| Agendar con reglas (sin pisar, dentro de jornada) | sin reglas [D] | sin reglas [D] | sin reglas [D] | **con reglas** [D] | sin reglas de la tienda, solo en lo suyo [D] | — | ? en producción | ✓ `followsAgendaRules` (`calendarModel.ts` l. 405-406) |
| Huecos sugeridos en la rejilla al crear | ✅ [D] | ✅ | ✅ | 🔒 los suyos [D] | 🔒 los suyos [D] | `appointments·C` | Solo Thema | ✓ `slotSuggestions.ts`, `CalendarPage.tsx` l. 475-491 |
| Abrir el alta desde la ficha del cliente (`?cliente=`) | ✅ | ✅ | ✅ | 🔒 si es su cliente [D] | 🔒 [D] | `appointments·C` | Solo Thema | ✓ `CalendarPage.tsx` l. 164-167 |

### 2.5 Mover, estirar, reacomodar

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Arrastrar la tarjeta a otra hora | ✅ [P] | ✅ [M] | ✅ [M] | 🔒 suyas, con reglas [D] | 🔒 suyas [D] | `appointments·E` | CAL l. 26-27; `art/mover-o-reprogramar-una-cita` | ✓ `onMove` (`CalendarPage.tsx` l. 358-371) |
| Arrastrar a la columna de **otro barbero** | ✅ [P] | ✅ [M] | ✅ [M] | — (solo ve la suya) [D] | — [D] | `appointments·E` | CAL l. 27 | ✓ sin recorte |
| Tirador **Cambiar duración** / campo Duración | ✅ [P] | ✅ | ✅ | 🔒 suyas [D] | 🔒 suyas [D] | `appointments·E` | CAL l. 29, 65 | ✓ `onResize` l. 373-390 |
| **Forzar** (pisar otra cita, fuera de horario o sobre bloqueo) | ✅ [D] | ✅ [D] | ✅ [D] | — (rechazo con motivo) [D] | 🔒 solo en su columna [D] | `appointments·E` + rol | ? en producción | ✓ `force: !enforceRules`; ✓ el servidor ignora `force` de un barbero (comisión y renta) |
| Proponer reacomodo al alargar sobre citas que se pueden correr | n/a (fuerza) | n/a | n/a | ✅ [D] | n/a | `appointments·E` | Solo Thema | ✓ `CalendarPage.tsx` l. 381-385 |
| Aplicar / descartar reacomodo (fantasmas + franja) | ✅ [D] | ✅ | ✅ | 🔒 su cola [D] | 🔒 [D] | `appointments·E` | Solo Thema | ✓ `ReflowBanner.tsx`, `applyReflow` l. 417-444 |
| Deshacer (toast / tecla Z) | ✅ | ✅ | ✅ | 🔒 | 🔒 | igual que la acción | Solo Thema | ✓ `patchWithUndo` |

### 2.6 Ficha de la cita: lo que se ve

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Abrir la cita (cabecera: nombre, teléfono, tipo, estado) | ✅ [P] | ✅ | ✅ | 🔒 suyas [P] | 🔒 suyas [D] | `appointments·V` | CAL l. 56-58 | ✓ `AppointmentDrawer.tsx` |
| Teléfono en la ficha | 👁 enmascarado? [P lista] | ? | ? | 👁 enmascarado [P] | ? | `client-info·A` | MOD l. 185 | ✗ completo (`AppointmentSummaryTab.tsx` l. 184) |
| Resumen › SIGUIENTE PASO con precio («Ingresar · $70.000») | ✅ [P] | ✅ | ✅ [D] | ✅ [P] | ✅ | `appointments·V` | CAL l. 62 | ✓ playbook + `StageHeadline` |
| Resumen › RECORRIDO DEL CLIENTE (visitas en la sucursal, escalera) | ✅ [P] | ✅ | ✅ [D] | ✅ [D] | ✅ sus visitas [D] | `client-info·A` ? | CAL l. 63 | ✓ pestaña Cliente |
| Resumen › CITA (servicio, barbero, hora, duración, **precio**, total) | ✅ [P] | ✅ | ✅ [D] | ✅ | ✅ | `appointments·V`, `prices·A` | CAL l. 64-65 | ✓ |
| FIDELIDAD: «Gestionado por», «Pidió a», «Con X n de N», «Ha visto otros barberos» | ✅ [P] | ✅ | ✅ [D] | ? (dato de otros barberos) | ? | `client-info·A` ? | CAL l. 66-67 | ✓ `AppointmentClientTab.tsx` |
| Alertas críticas (alergia, medicamento) arriba | ✅ | ✅ | ✅ | ✅ (seguridad) [D] | ✅ [D] | — | Solo Thema | ✓ `AppointmentSummaryTab.tsx` l. 136-146 |
| Pestaña **Notas** (Notas / Medicamento / Alergias) — ver | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [D] | ✅ [D] | `client-info·A` (comisión y renta: «no») [M] | CAL l. 68-69; MOD l. 113 | ✓ `AppointmentNotesTab.tsx` |
| Notas → **Agregar nota** (Tipo, Descripción, Crear) | ✅ [P] | ✅ | ✅ | ? [M: sin `client-info`] → ✅ [D] | ? → ✅ [D] | `client-info·A` / `clients·E` ? | CAL l. 69 | ✓ `POST /clients/:id/notes` |
| Pestaña **Cliente** (ritmo, «Agéndalo para», cumplimiento, alertas, todas las visitas con **precio**) | ✅ [P] | ✅ | ✅ sin precios [D] | 🔒 sus visitas [D] | 🔒 sus visitas [D] | `client-info·A` | CAL l. 70-72 | ✓ (sin lista de visitas con precio) |
| Pestaña **Historial** (quién creó, dónde, cuándo; no editable) | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `appointments·V` | CAL l. 73-74 | ✓ `AppointmentHistoryTab.tsx` |
| Pestaña **Clipper** (sugerencias del agente) | ✅ [D] | ✅ [D] | ✅ operativas [D] | ✅ las de barbero [N] | ✅ [N] | — | Notion (alertas por rol) | ✓ `AppointmentClipperTab.tsx`; ✗ filtro por rol |
| Ver la ficha del cliente (icono → `/clientes/:id`) | ✅ | ✅ | ✅ | 🔒 si es suyo [D] | 🔒 [D] | `clients·V` | — | ✓ `onOpenClient` |
| Llamar / WhatsApp desde la cita | ? (no existe en prod.) | ? | ✅ [D] | ✅ sus clientes [D] | ✅ [D] | `client-info·A` [D] | Solo Thema | ✓ `appointmentPlaybook.ts` (`call`, `whatsapp`) |

### 2.7 Ficha de la cita: acciones de estado y edición

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Ingresar** (check-in) desde tarjeta, Siguiente paso o Acciones | ✅ [P] | ✅ [M] | ✅ [M][N] | 🔒 suyas [P] | 🔒 suyas [M] | `appointments·E` | CAL l. 61; `art/marcar-que-el-cliente-llego` | ✓ `checkIn` |
| **Sentado** / Sentar | ✅ [P] | ✅ | ✅ | 🔒 [P] | 🔒 | `appointments·E` | CAL l. 61; `art/pasar-al-cliente-a-la-silla` | ✓ `seat` |
| **Barbero listo** | ✅ [P] | ✅ | ✅ | 🔒 el suyo [D] | 🔒 [D] | `appointments·E` | CAL l. 61 (efecto no comprobado) | ✓ `ready` (`barberReady`) |
| **Cobrar** / **Pagar cita** | ✅ [P] | ✅ [M] | ✅ [N] (? en prod.) | 🔒 suyas [P] | 🔒 suyas [N] | `appointments·E` + `prices·A` | CAL l. 61-62; `perm/permisos-recepcion` FAQ | ✓ → `CheckoutDrawer.tsx` |
| **No se presentó** (con confirmación) | ✅ [P] | ✅ | ✅ | 🔒 [P] | 🔒 | `appointments·E` | CAL l. 61 | ✓ `ConfirmDialog` l. 896-916 |
| **Cancelar** (con confirmación) | ✅ [P] | ✅ | ✅ | 🔒 [P] | 🔒 | `appointments·B` ? | CAL l. 61; `perm/darle-a-recepcion-solo-lo-necesario` | ✓ |
| Ofrecer el hueco liberado a la lista de espera | ✅ [D] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | `appointments·C` | Solo Thema | ✓ `releaseSlot` l. 545-562 |
| **Editar** cita (servicios, barbero, fecha, hora, duración, nota) | ✅ [D] (prod.: solo duración) | ✅ | ✅ | 🔒 sin cambiar barbero [D] | 🔒 [D] | `appointments·E` | CAL l. 65; `art/abrir-una-cita` FAQ | ✓ `AppointmentEditForm.tsx` (solo si no está cobrada) |
| **Reagendar** / agendar la próxima (tras cobrar, no-show o cancelar) | ✅ [D] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | `appointments·C` | Solo Thema | ✓ `rebook` |
| Deshacer un estado (volver atrás) | ? | ? | ? | ? | ? | ? | `art/estados-de-una-cita` FAQ | ✗ |
| Cancelar / mover una cita de una serie (una o todas) | ? | ? | ? | ? | ? | `appointments·E/B` | `art/cita-que-se-repite` | ✗ |
| Clic derecho en la tarjeta (mismas acciones que el panel) | ✅ | ✅ | ✅ | 🔒 | 🔒 | según la acción | Solo Thema | ✓ `calendarContextActions.tsx` |
| Reasignar el **crédito** de una cita cobrada a otro barbero (con auditoría) | ✅ [N] | ✅ [N] | — [N] | — [N] | — [N] | sin fila [D] | Notion | ✗ (editar se bloquea al cobrar) |

### 2.8 Cobro (checkout)

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Panel «Resumen»: servicios, precio, Total, Propina, Impuesto, Pedido total | ✅ [P] | ✅ | ✅ [N] | 🔒 suyas [P] | 🔒 suyas | `prices·A` | CAL l. 78-80 | ✓ `CheckoutDrawer.tsx` |
| **Añadir servicio** al cobro | ✅ [P] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | `appointments·E` | CAL l. 79 | ✓ |
| **Añadir productos** a la cita | ✅ [P] | ✅ | ✅ (Productos V) [M] | ✅ [D] (sin fila de productos) | ✅ POS [N] | `prices·A` (+`products·V`?) | CAL l. 79 | ✓ |
| **Abrir checkout completo** | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `prices·A` | CAL l. 80-84 | — (un solo panel) |
| **Combinar citas** | ✅ [P] | ✅ | ✅ [D] | — [D] | 🔒 [D] | `appointments·E` | CAL l. 82 | ✗ |
| **Agregar cliente** en el cobro | ✅ [P] | ✅ | ✅ | ? | ? | `clients·C` | CAL l. 83 | ✗ |
| Método **Efectivo** (recibido / cambio) | ✅ [P] | ✅ | ✅ | ✅ [D] | ✅ | `prices·A` | CAL l. 83, 90 | ✓ `checkoutMath.changeDue` |
| Método **Crédito/Débito** → elegir dispositivo / **Agregar dispositivo** | ✅ [P] | ✅ | ✅ elegir; agregar — [D] | ✅ elegir [D] | ✅ ? (¿su propio datáfono?) | elegir `prices·A`; agregar = Configuración | CAL l. 85-86 | parcial: recargo por tarjeta, sin dispositivo |
| Método **Link de pago** | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `prices·A` | CAL l. 84, 87 | ✓ `link` |
| Método **Pago mixto** | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `prices·A` | CAL l. 84, 87 | ✓ `mixed` (sin reparto entre métodos) |
| **Propina** ($10/$15/$20, Sin propina, Personalizar) «Para <barbero>» | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `prices·A` | CAL l. 87-89 | ✓; ✗ respeta «Puede recibir propinas» de la ficha |
| **Descuento** | — (no existe) [P] | — | — | — | — | ? | `art/aplicar-un-descuento` | ✗ (coincide) |
| Cambiar el **precio** de un servicio al cobrar | ? | ? | — [D] | — [D] | 🔒 sus precios [N] | `prices·A` ? | — | ✗ |
| Tras cobrar: sugerir agendar la próxima | ✅ [D] | ✅ | ✅ | 🔒 | 🔒 | `appointments·C` | Solo Thema | ✓ `CalendarPage.tsx` l. 811-822 |

### 2.9 Ventas sueltas

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Crear venta rápida** (productos, Total, Pagar orden) | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [N] | `prices·A` (+`products·V`) | CAL l. 96-97; MOD l. 182 | ✓ `QuickSaleDrawer.tsx` |
| Venta rápida: a quién se le acredita | ? | ? | ? | sí mismo [D] | sí mismo [D] | — | `art/crear-una-venta-rapida` FAQ | ✗ (`POST /sales` no lleva barbero) |
| **Venta sin cita** (Fecha, hora, Cliente, Servicio, Barbero, Crear) | ✅ [P] | ✅ | ✅ | 🔒 barbero = él [D] | 🔒 [D] | `appointments·C` | CAL l. 98-99 | ✓ `WalkInSaleDrawer.tsx` (luego abre el cobro) |
| Venta sin cita con **fecha pasada** | ✅ [P] | ✅ | ? [D: solo hoy] | ? [D: solo hoy] | ? | `appointments·C` | `art/venta-sin-cita` | ✓ sin límite |

### 2.10 Lista de cobros

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Abrir **Lista de cobros** («Listo para pagar») | ✅ [P] | ✅ | ✅ [M] | ✅ [P] | ✅ [M] | `appointments·V` | CAL l. 91-92; MOD l. 182 | ✓ `CollectionsDrawer.tsx` |
| Pestaña **Por cobrar** / **Pagado** | ✅ todas [P] | ✅ | ✅ todas | 🔒 suyas [D] (alcance ? en prod.) | 🔒 suyas [D] | `appointments·V` | CAL l. 91-92; `guia/guia-del-barbero-por-comision` | ✓ sin recorte |
| Cambiar de día | ✅ [P] | ✅ | ✅ | ✅ | ✅ | `appointments·V` | CAL l. 91 | ✓ |
| **Total del día** por pestaña | ✅ [D] | ✅ [D] | — [N] | 🔒 suyo [D] | 🔒 suyo [D] | `kpis·A` [D] | Solo Thema | ✓ `calendar.collections.total`; ✗ ocultar |
| Cobrar desde la lista / abrir la cita | ✅ | ✅ | ✅ | 🔒 | 🔒 | `appointments·E` | `art/lista-de-cobros` | ✓ |

### 2.11 Lista de espera

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver la lista (por sucursal, por día) | ✅ [P] | ✅ | ✅ | 🔒 los que lo esperan a él o a cualquiera [D] | 🔒 [D] | sin fila (¿`appointments·V`?) | CAL l. 100; `art/lista-de-espera` | ✓ `WaitlistDrawer.tsx` |
| **Añadir a la lista de espera** (Cliente, Servicio, Barbero, franjas, Confirmar) | ✅ [P] | ✅ | ✅ | ✅ consigo [D] | ✅ consigo [D] | `appointments·C` ? | CAL l. 100-102 | ✓ (Thema añade «cualquier barbero») |
| **Ingresar** desde la lista (crea la cita ya llegada) | ✅ [P] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | `appointments·C` | FD l. 69-73; `content/es/front-desk/atender-la-lista-de-espera.md` | parcial: «Agendar» abre el alta, no hace check-in directo |
| Agendar en un hueco que encaja / ofrecer hueco | ✅ [D] | ✅ | ✅ | 🔒 | 🔒 | `appointments·C` | Solo Thema | ✓ `waitlistMatch` |
| Quitar de la lista | ✅ [D] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | `appointments·B` ? | Solo Thema | ✓ `DELETE /waitlist/:id` |
| Entradas que llegan del kiosco (Front Desk) | ✅ [P] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | — | FD l. 69-73 | ✗ (sin Front Desk) |

### 2.12 Bloqueos, vacaciones y cierres

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ver bloqueos en la rejilla | ✅ [P*] | ✅ | ✅ | 👁 los suyos [M] | 👁 los suyos | `block-calendar·V` | MOD l. 111 | ✓ `blockToEvent` |
| **Crear bloque de tiempo** (Categoría, Repetición, fechas, horas, Descripción) | ✅ [P] | ✅ [M] | ✅ [M] | — (solo V de fábrica) [M] | 🔒 suyo [M] | `block-calendar·C` | CAL l. 103-106; `art/vacaciones-de-un-barbero` «Quién puede hacerlo» | ✓ `timeOff/BlockForm.tsx`, página «Agregar» de Ausencias y bloqueos (+ «Día completo» y aviso de choques) |
| Categoría **Bloqueo del negocio** | ✅ [D] | ✅ [D] | ✅ [D] | — | — [D] | `block-calendar·C` | CAL l. 104 | ✓ `business` sin restricción |
| Categoría **Vacaciones** — comisión **solicita** | aprueba [P*] | aprueba ? | ? | solicita [P*] | n/a | `block-calendar` + flujo | `conf/notificaciones-del-calendario` («Cuando un barbero solicita vacaciones») | ✗ (no hay solicitud ni aprobación) |
| Categoría **Vacaciones** — renta **crea** sin aprobación | recibe aviso [P*] | ? | n/a | n/a | ✅ [P*] | `block-calendar·C` | `conf/notificaciones-del-calendario` («Cuando un barbero de renta crea un periodo de vacaciones») | parcial (crea, sin aviso) |
| **Quitar** un bloqueo (con confirmación) | ✅ ? [P: no comprobado] | ✅ [M] | ✅ [M] | — [M] | 🔒 suyo [M] | `block-calendar·B` | `art/bloquear-el-calendario` nota | ✓ `ConfirmDialog` l. 869-894 |
| **Editar** un bloqueo | ? | ✅ [M] | ✅ [M] | — | 🔒 | `block-calendar·E` | idem | ✗ |
| Aviso al equipo al crear bloqueo/vacaciones | configura [P] | según pestaña de rol [P] | según pestaña [P] | según pestaña [P] | según pestaña [P] | Configuración › Notificaciones | `conf/notificaciones-por-rol` | ✗ (catálogo existe en `src/features/settings/sections/notificationCatalog.ts`, no se dispara) |
| **Periodos de cierre** del negocio (Configuración) | ✅ [P] | ✅ [M] | — [M] | — [M] | — [M] | `closures·VCEB` | MOD l. 135; `conf/periodos-de-cierre` | parcial: `ClosuresSettings.tsx` existe; el calendario no lo pinta ni lo respeta |

\* Visto en la configuración de avisos, no en un bloqueo real.

### 2.13 IA, huecos, pulso y alertas

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| **Asistente del día** (resumen + agendar escribiendo) | ✅ [D] | ✅ [D] | ✅ sin cifras [D] | 🔒 su día [D] | 🔒 [D] | `appointments·C` | Solo Thema | ✓ `CalendarAssistantDrawer.tsx`, `dayBrief.ts` |
| Línea «X va tarde» / «N listas para cobrar» / «alergias» | ✅ | ✅ | ✅ | 🔒 | 🔒 | — | Solo Thema | ✓ |
| Línea «X tiene h libres» / «X está al 95 %» (carga de otros barberos) | ✅ [D] | ✅ [D] | ✅ [D] | — [D] | — [D] | `team·V` [D] | Solo Thema | ✓ sin recorte |
| Línea «N clientes VIP» / «N clientes nuevos» | ✅ | ✅ | ✅ | 🔒; nuevos ? [N] | 🔒; nuevos ? | — | Notion (primera visita) | ✓ |
| **Huecos del día** (libre, «Por vender» en dinero) | ✅ [D] | ✅ [D] | ✅ sin «Por vender» [N] | 🔒 suyos [D] | 🔒 suyos [D] | `kpis·A` para el dinero [D] | Solo Thema | ✓ `GapsDrawer.tsx`; ✗ ocultar cifra |
| Pulso por estado (tarde, esperando, en silla, por cobrar) con `?foco=` | ✅ [D] | ✅ | ✅ | 🔒 [D] | 🔒 [D] | — | Solo Thema | ✓ `pulseModel.ts` |
| Sugerencia «cliente por volver / agéndalo para» | ✅ [N] | ✅ | ✅ [D] | ✅ [N] | ✅ [N] | — | Notion; CAL l. 71 | ✓ `rebook` insight |
| Riesgo de **no-show** del cliente | ✅ [N] | ✅ | ✅ [D] | ✅ [N] | ✅ [N] | — | Notion | ✓ `noShowRisk` |
| «Pidió a otro barbero» (aviso en la tarjeta) | ✅ | ✅ | ✅ | ? [D: sí, es su cita] | ? | — | CAL l. 66-67 | ✓ `appointmentWarning` |
| **Primera visita** como alerta | ✅ [N] | ✅ | ✅ | — [N] | — [N] | — | Notion | ✗ se muestra a todos (`appointmentInsights.ts` l. 51, marcador `new` en `calendarModel.ts` l. 428) |
| Cliente **en riesgo**, pre-churn, recompra baja | ✅ [N] | ? | — [N] | 🔒 suyos [N] | 🔒 suyos [N] | — | Notion | ✗ en calendario |
| Churn, VIP en riesgo, concentración de ingresos, salida de barbero | ✅ [N] | — [N] | — [N] | — [N] | — [N] | — | Notion | ✗ (son de Métricas, no del calendario) |
| Aviso «agenda ocupada > %» del barbero / de la barbería | configura [P] | según pestaña [P] | según pestaña | según pestaña | según pestaña | Configuración › Notificaciones | `conf/notificaciones-del-calendario` | ✗ |

### 2.14 Horas de trabajo, orden y Front Desk desde el calendario

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| Ir a **Horas de trabajo** desde el calendario | ✅ [P] | ✅ [M] | — [M] | 👁 [P] | — [M] → su horario [D] | `team·V` | CAL l. 12; MOD l. 184 | parcial: va a `/usuarios`, no a `/usuarios/horarios` |
| Editar el horario / excepción de un día | ✅ [P] | ✅ [M] | — | ? (V en Equipo) | su horario [D] | `team·E` | `content/es/equipo/horas-de-trabajo-del-equipo.md` | ✓ `PUT /team/schedule/override` en Equipo, no desde el calendario |
| **Ordenar barberos agendas** (orden de columnas) | ✅ [M] | — [M] | — | — | — | `barber-order` | MOD l. 122 | ✓ `/usuarios/orden`; ✗ guarda por permiso |
| Orden sin cita / sin preferencia (Póngase en fila) | ✅ [P] | ✅ [M] | — | — | n/a [N] | `lineup` | MOD l. 121, 164-167 | ✓ `/usuarios/fila` |
| Copiar el **enlace del Front Desk** | ✅ [P] | ✅ ? | ? | — [D] | — [D] | Configuración | FD l. 14-17 | ✓ en Configuración › Agendamiento (`BookingSettings.tsx`) |
| **Activar el kiosco** (OTP del personal) | ✅ [P] | ✅ ? | ✅ [D] | ? | ? | sin fila | FD l. 20-28; `content/es/front-desk/activar-el-kiosco.md` | ✗ |
| Check-in del cliente en el kiosco → la cita pasa a **Ingresado** y avisa al barbero | efecto [P] | efecto | efecto | recibe aviso [P] | recibe aviso | — | FD l. 10-12, 89-95 | ✗ |
| Notificaciones del calendario en la campana (cita creada por cliente, bloqueos…) | ✅ [P] | según pestaña | según pestaña | según pestaña | según pestaña | Configuración › Notificaciones | `guia/guia-de-recepcion`; `conf/notificaciones-por-rol` | ? |

**Total: 138 acciones/elementos mapeados.**

---

## 3. Datos que se recortan a «lo suyo»

Clave común: el `barberId` de la cita es el `memberId` del equipo (`findBarber` en `src/mocks/calendar/handlers.ts` l. 103 busca en `db.team.members`). Hace falta que la sesión diga **quién soy** (`memberId`) — hoy no existe (`docs/ROLES_PLAN.md` §5).

| Dato | Filtro para comisión y renta | Campo | Notas |
|---|---|---|---|
| Columnas (Día, Semana) y selector de Mes | Solo el barbero que entra | `barber.id === memberId` | Producción lo hace para comisión [P]. El filtro de equipo desaparece. |
| Citas del día (rejilla, Agenda, pulso, contadores de filtros) | `appointment.barberId === memberId` | `barberId` | También los contadores de `CalendarFilters` (hoy cuentan todas). |
| Bloqueos | `block.barberId === memberId` | `barberId` | |
| Lista de cobros | Citas suyas por cobrar/pagadas | `barberId` | Ver §5 (alcance no verificado). |
| Lista de espera | `entry.barberId === memberId` o `null` (cualquiera) | `barberId` | Las de «cualquier barbero» se ven para poder tomarlas [D]. |
| Huecos, reacomodo, sugerencias, asistente | Solo su jornada y su cola | `barberId` | `dayGaps({ barbers })`, `reflowPlan(barber)`, `suggestSlots`. |
| Clientes en el alta | Los que atendió, los que lo prefieren y Walk in; puede crear nuevos [D] | `preferredBarberId`, visitas con `barberId` | Producción muestra los 44 [P]; la propuesta de ROLES_PLAN es «suyos por defecto». |
| Pestaña Cliente › todas las visitas | Solo las visitas con él | `barberId` de cada visita | Para no exponer qué paga el cliente con otros. |
| Ventas rápidas | Las que hizo él | `soldBy` (no existe) | `POST /sales` no lleva vendedor. |
| Mes / Semana | Su ocupación | `GET /calendar/month?barberId=memberId` | El endpoint ya acepta `barberId`. |
| Precios en tarjeta, alta y cobro (renta) | Su precio por servicio, no el de la tienda | ficha › Servicios › «Precio del servicio» | [N] «en renta no aplica el precio de la tienda». |

Recepción, admin y dueño: toda la sucursal activa. El admin, solo las sucursales donde está activado [?].

## 4. Cifras y privacidad

| Dato | Dueño | Admin | Recepción | Comisión | Renta | Por qué |
|---|---|---|---|---|---|---|
| «US$ cobrados de US$ esperados» del día | ✅ | ✅ | **oculto** | suyo | suyo | [N] recepción sin números; [D] el barbero ve lo que lleva. |
| Total del día en Lista de cobros | ✅ | ✅ | **oculto** | suyo | suyo | Ídem. |
| «Por vender» en Huecos | ✅ | ✅ | **oculto** (deja horas libres) | suyo | suyo | Ídem. |
| Ocupación % (Mes, Semana, «X está al 95 %») | ✅ | ✅ | ? (operativo; decidir) | suya | suya | Es una métrica; recepción la usa para repartir [D]. |
| Precio de una cita y total al cobrar | ✅ | ✅ | **visible** | sus citas | sus citas | Sin él no se cobra: el precio puntual no es «métrica» [D]. |
| Precios de visitas pasadas del cliente | ✅ | ✅ | oculto [D] | las suyas | las suyas | No hace falta para operar. |
| Propina | ✅ | ✅ | la que se registra | las suyas | las suyas | Va «Para <barbero>» [P]. |
| Teléfono del cliente | enmascarado [P] | enmascarado | enmascarado | enmascarado [P] | enmascarado | Producción lo enmascara en todos los perfiles vistos (MOD l. 185); Thema lo muestra completo. |
| Llamar / WhatsApp | ? | ? | ✅ sin mostrar el número [D] | ? | ? | El enlace `tel:`/`wa.me` revela el número igualmente: decidir. |
| Notas médicas (Medicamento, Alergias) | ✅ | ✅ | ✅ | ✅ (seguridad del servicio) | ✅ | La matriz no da `client-info` a barberos [M]: contradicción con seguridad. |
| Fidelidad: «Ha visto otros barberos», «Gestionado por» | ✅ | ✅ | ✅ | ? | ? | Puede generar roces entre barberos; decidir. |
| Carga/agenda de otros barberos (asistente, huecos) | ✅ | ✅ | ✅ | oculta | oculta | Solo ve lo suyo. |
| Primera visita como alerta | ✅ | ✅ | ✅ | oculta [N] | oculta [N] | «para no culparlo». |
| Datos del barbero de renta (banco, renta, deducciones) | ✅ | ? | — | — | suyos | No aparecen en el calendario; se cita por la ficha (MOD l. 156). |

## 5. Contradicciones y pendientes de confirmar

1. **Bloquear calendario está al revés en Thema.** Producción: comisión `V A`, renta `VCEB A` (MOD l. 111; `art/vacaciones-de-un-barbero` «Quién puede hacerlo»; `guia/guia-del-barbero-de-renta`). Thema: comisión `full("block-calendar")` y renta `some("block-calendar", ["view"])` (`src/features/team/permissionsCatalog.ts` l. 110-111). Además, MOD l. 97-98 vio un barbero de prueba con «Bloquear calendario» completo: la persona puede diferir del rol.
2. **Otros valores de fábrica que no coinciden** (`permissionsCatalog.ts` l. 108-111 frente a MOD l. 106-139): admin recibe `export-clients` (prod.: no); recepción recibe `export-clients` y `services·V` (prod.: no) y le falta `account-settings·VE`; renta tiene `clients` solo VC sin `import-clients`/`export-clients` (prod.: VCEB + ambas); comisión y renta no tienen `client-info` (coincide, pero choca con ver alergias, ver §4).
3. **¿Recepción cobra?** La app la describe como «check in y check out» (MOD l. 79) y Notion dice «calendario universal + cobro», pero `perm/permisos-recepcion` y `guia/guia-de-recepcion` admiten que no se comprobó en pantalla.
4. **Lista de cobros del barbero**: producción le muestra la acción (MOD l. 182) y la guía dice «ninguna de tus citas» (`guia/guia-del-barbero-por-comision` «Al cerrar»), pero no se verificó si la lista ya viene recortada.
5. **Clientes del barbero**: producción le da los 44 (MOD l. 185); ROLES_PLAN propone «suyo por defecto» [D]. Afecta al buscador del alta.
6. **Crear cliente desde la cita**: un artículo dice que solo dueño, admin y recepción ven el botón; la matriz da `clients·C` al de comisión (`docs/ROLES_PLAN.md` §4 punto 2).
7. **Reglas de agenda y «forzar»**: ni producción ni Notion dicen quién puede pisar una cita o agendar fuera de horario. Thema lo decidió (`calendarModel.ts` l. 398-406) y el contrato lo documenta (`docs/API_CONTRACT.md` l. 175), pero el mock confía en el `force` que manda el cliente (`src/mocks/calendar/handlers.ts` l. 263, 355).
8. **¿Puede el de comisión agendar a otro barbero?** Producción solo dice que la franja vacía pone su nombre; el campo Barbero no se abrió con ese perfil.
9. **Cancelar = «Borrar» o «Editar»**: `perm/darle-a-recepcion-solo-lo-necesario` sugiere que apagar Borrar deja cancelar, pero no se comprobó qué botón quita cada casilla.
10. **Vacaciones**: comisión «solicita» y renta «crea» (`conf/notificaciones-del-calendario`), pero de fábrica el de comisión no puede crear bloqueos. ¿Dónde solicita? No hay pantalla documentada.
11. **Primera visita**: Notion dice que no se muestre al barbero individual. No está claro si se refiere al marcador «cliente nuevo» de la tarjeta o a la alerta de retención de primeras visitas. Thema muestra los dos.
12. **Teléfono**: producción lo enmascara para todos los perfiles vistos; Thema lo muestra y ofrece Llamar/WhatsApp.
13. **Editar cita**: producción no tiene editar en el detalle salvo Duración (`art/abrir-una-cita` FAQ); Thema permite cambiar servicios, barbero, fecha y hora.
14. **Precio del barbero de renta**: Notion dice que no aplica el precio de la tienda; producción tiene «Precio del servicio» por barbero en la ficha (MOD l. 155). El calendario de Thema siempre usa el del catálogo.
15. **Ruteo de clientes sin preferencia/sin cita**: Notion dice que no aplica al de renta; producción no comprueba cómo se asigna (`art/clientes-sin-preferencia-de-barbero` nota).
16. **Bloqueos**: cómo se editan o borran en producción no está comprobado (`art/bloquear-el-calendario` nota). Thema solo quita.
17. **Menú de la vista Mes**: producción pone «Crear bloque de tiempo» solo en Mes (CAL l. 39); Thema lo pone en el menú de la columna en Día.
18. **Front Desk**: el usuario dice que «no hay reglas ni roles especiales» (FD l. 10), pero la activación exige el teléfono de una persona del personal: falta saber qué roles pueden activarlo.
19. **Sin fila en la matriz** para Lista de espera, Lista de cobros, Venta rápida, Front Desk y Transacciones (`docs/ROLES_PLAN.md` §4 punto 8): se asumen bajo `appointments` y `prices`.

## 6. Cambios necesarios en Thema

Todos dependen de la fase 1 de `docs/ROLES_PLAN.md` §5: `role: TeamRole` + `memberId` en la sesión y un `useAccess()` con `{ role, memberId, can(row, column), scope: "all" | "own" }`.

1. **`src/features/team/permissionsCatalog.ts`** (l. 106-112): corregir `ROLE_DEFAULT_PERMISSIONS` según §5 puntos 1-2 (intercambiar `block-calendar` de comisión y renta; quitar `export-clients` a admin y recepción; quitar `services` a recepción; dar `account-settings·VE` a recepción; dar a renta `clients` completo, `import-clients` y `export-clients`). Añadir filas para lo que no tiene (lista de espera, ventas sueltas) o documentar a qué fila cuelgan.
2. **`CalendarPage.tsx`**:
   - Leer `useAccess()`. Con `scope === "own"`, fijar `state.team` a `memberId`, ocultar `TeamPicker` y «Ver todo el equipo» (l. 736), y pasar a cada drawer el barbero fijo.
   - Construir `calendarRailActions` según permisos: sin `block-calendar·C` quitar «Bloquear» (l. 302); sin `team·V` quitar «Horario de trabajo» y cambiar su destino a `/usuarios/horarios` (l. 303, 737).
   - Ocultar la cifra «cobrados de…» (l. 627-631) cuando el rol no tiene `kpis·A` o es recepción; para barberos, calcular `dayPulse` sobre sus citas.
   - `onViewBarber`/`onBlockBarber`/`onReflowBarber` (l. 738-740) condicionados a `team·V`, `block-calendar·C` y alcance.
   - Quitar bloqueo (l. 869-894) condicionado a `block-calendar·B` y a que el bloqueo sea suyo.
3. **`calendarModel.ts`**: sustituir `RULE_BOUND_ROLES`/`followsAgendaRules` (l. 405-406) por una regla en `useAccess` (p. ej. `canForce`) y añadir `ownScope(appointments, memberId)`. `isFirstVisit` y el marcador `new` (l. 412, 428) dependientes del rol según se decida en §5 punto 11.
4. **`calendarContextActions.tsx`** y **`appointmentPlaybook.ts`**: recibir los permisos y filtrar acciones (`edit`, `cancel`, `noShow`, `pay`, `call`, `whatsapp`) en un solo sitio, para que panel y clic derecho sigan iguales.
5. **`appointmentTabs/AppointmentSummaryTab.tsx`**: enmascarar el teléfono (l. 184) salvo decisión contraria; botón Editar (l. 154-158) con `appointments·E`; para barberos, el selector de barbero de `AppointmentEditForm.tsx` bloqueado.
6. **`appointmentTabs/AppointmentClientTab.tsx`**: recortar «todas las visitas» y la fidelidad a lo suyo para barberos; ocultar precios a recepción.
7. **`appointmentTabs/AppointmentNotesTab.tsx`**: «Agregar nota» condicionado a `client-info·A` (o a la regla que se decida para barberos).
8. **`appointmentInsights.ts`** y **`dayBrief.ts`**: filtrar por rol (sin `firstVisit` al barbero si así se decide; sin líneas `idle`/`full` de otros barberos para barberos; asistente sin dinero para recepción).
9. **`CreateAppointmentDrawer.tsx`**: con alcance propio, barbero fijo y clientes recortados; opción explícita «Sin preferencia» que deje `requestedBarberId: null`; «Crear cliente» en un subpanel en vez de navegar a `/clientes` (`CalendarPage.tsx` l. 789); precio del barbero para renta.
10. **`CheckoutDrawer.tsx`**: respetar «Puede recibir propinas» del barbero; total y método visibles a recepción; (pendiente de producto) Combinar citas y Agregar cliente.
11. **`CollectionsDrawer.tsx`**, **`GapsDrawer.tsx`**, **`CalendarMonthView.tsx`**, **`CalendarWeekView.tsx`**: aceptar `barberId` de alcance; ocultar totales en dinero (`calendar.collections.total`, `calendar.gaps.stat.potential`) y, si se decide, la ocupación a recepción.
12. **`timeOff/BlockForm.tsx`** (antes `BlockDrawer.tsx`): con alcance propio, barbero fijo y sin la categoría `business`; para comisión, «Solicitar vacaciones» en vez de crear (flujo nuevo con aprobación del dueño/admin) [D].
13. **`WaitlistDrawer.tsx`** y **`WalkInSaleDrawer.tsx`**: barbero fijo con alcance propio; venta sin cita con fecha pasada solo para dueño/admin [D].
14. **`QuickSaleDrawer.tsx`** + **`src/mocks/calendar/handlers.ts`** (`POST /sales`) + **`docs/API_CONTRACT.md`** (l. 183): añadir `soldBy` para acreditar la venta al barbero.
15. **`src/mocks/calendar/handlers.ts`**: validar el rol de la sesión antes de aceptar `force` (l. 263, 355), recortar `GET /calendar/day` y `/waitlist` por `memberId` cuando el alcance es propio, y `403` en `POST /blocks` / `DELETE /blocks/:id` sin permiso. Documentarlo en **`docs/API_CONTRACT.md`** §Calendario.
16. **`src/mocks/calendar/seed.ts`** (l. 219): teléfonos enmascarados en la respuesta (o un campo `phoneMasked`) para que el front no reciba el número completo.
17. **Pendiente de producto**, no de código todavía: reasignar crédito de un cobro con auditoría (Notion), consumir los periodos de cierre en el calendario (`src/features/settings/sections/ClosuresSettings.tsx`), Front Desk.
18. **Pruebas** en `calendar.test.tsx`: un caso por rol (comisión ve una columna y no puede forzar ni bloquear; renta bloquea lo suyo; recepción no ve «cobrados de»).
