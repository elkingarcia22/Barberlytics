# Roles · 04 — Equipo, Sucursales, Usuarios, Cuenta y Navegación

Investigación del 2026-10-03. Detalla, acción por acción, qué ve y qué puede hacer cada rol en los módulos
que deciden **quién es quién y dónde está**: Equipo, Sucursales, Usuarios/Personas, la cuenta (perfiles y
«Ver como») y la cabecera con el menú. Parte del resumen general `docs/ROLES_PLAN.md` y lo baja a
inventario.

**Fuentes**

| Marca | Fuente | Dónde |
|---|---|---|
| **[P]** | Producción observada (`dash.barberlytics.com`, cuenta «mugen barber 2», 2026-09-25). Solo se vieron en pantalla **Dueño** y **Barbero por comisión** | `centro-de-ayuda/casos/modelo-sucursales-roles-permisos.md` (§2–§6b), `casos/equipo.md`, `casos/configuracion.md`, `content/es/{equipo,sucursales,roles-y-permisos,acceso-y-cuenta,navegacion,empezar}/` |
| **[M]** | Matriz de permisos de fábrica (Configuración › Permisos), leída en producción pero sin entrar con ese rol | `casos/modelo-sucursales-roles-permisos.md` §5, `content/es/roles-y-permisos/tabla-de-permisos-por-rol.md` |
| **[N]** | Notion (BarberOS Logic Library, QA Priority Stack), según el resumen del encargo | — |
| **[D]** | Decisión de producto propuesta aquí, con su porqué. Por confirmar | este documento |

**Celdas**

| Símbolo | Significa |
|---|---|
| ✅ | Lo ve y lo hace (en el alcance de su rol: toda la empresa para el dueño, su sucursal para el resto) |
| 👁 | Solo lo ve |
| 🔒 suyo | Solo lo suyo: su ficha, su columna, sus datos |
| — | No aparece |
| ? | No hay dato |

**Permiso (bloque·columna)**: la fila de la matriz que lo gobierna, con los ids de
`src/features/team/permissionsCatalog.ts` (`PERMISSION_BLOCKS`): `bloque.fila·columna`, con columnas
**V** ver · **C** crear · **E** editar · **B** borrar · **A** activo. «sin fila» = la matriz no tiene una fila
para eso (hueco). «propio» = no lo decide la matriz sino que la persona sea la dueña del dato.

**En Thema**: ✓ (ruta) = existe · parcial = existe pero distinto o incompleto · ✗ = no existe.
**Ninguna acción de Thema tiene hoy guarda por rol**: la única lectura del rol en toda la app es
`followsAgendaRules` del calendario (`src/features/calendar/calendarModel.ts:405`). Así que «✓» quiere
decir «la acción existe», no «está bien recortada».

---

# 1. Equipo

**Qué es.** Las personas de la empresa, activadas por sucursal, con su ficha (perfil, servicios, dinero,
horario, permisos, opciones), sus niveles, sus horas de la semana y los dos órdenes (columnas del
calendario y fila de clientes sin cita / sin preferencia). Producción: `/team/barbers` con pestañas
Barberos · Niveles · Horas de trabajo · Gerentes [P]. Thema: `/usuarios` (home con pulso, reparto por rol y
avisos) y sus subrutas `miembros/:id`, `nuevo`, `horarios`, `niveles`, `orden`, `fila`.

- **Dueño.** Todo, en todas las sucursales. Es el único que crea dueños, ve el dinero de cada barbero
  («Sección de pagos de barberos») y ordena las columnas del calendario [M]. No se le puede borrar, solo
  inactivar [P]. Recibe las alertas de negocio del equipo (salida de un barbero, concentración) [N].
- **Admin.** Lo mismo **dentro de sus sucursales**, sin el dinero de los barberos ni el orden de columnas [M].
  Propuesta: no crea ni asciende a dueño ni a otro admin (QA crítico de Notion) [N][D]; ve la ficha de
  dinero solo si el dueño le enciende `barber-payments` [D]. Recibe el coaching semanal [N].
- **Recepción.** No tiene Equipo [M]. Propuesta: no gana el módulo, pero sí una vista de solo lectura de
  **quién trabaja hoy** dentro del calendario (sin contactos ni dinero) [D], porque es quien asigna al que
  llega sin cita.
- **Comisión.** Hoy ve Equipo en modo lectura: Barberos (los 10 de su sucursal, con correo y teléfono),
  Niveles y Horas de trabajo, sin Gerentes [P]. Propuesta: conserva nombres, nivel y horas para
  coordinarse, pero **sin datos de contacto, código ni cuenta bancaria de colegas** (privacidad [N]) y con
  su propia ficha en lectura, su nivel y la brecha al siguiente [N][D].
- **Renta.** No tiene Equipo [M]. Propuesta: entra a **su ficha** (perfil, sus precios, su lógica de renta,
  su cuenta bancaria, su horario) y nada de los demás; crea sus vacaciones sin aprobación [P][D].

## Inventario de acciones — Equipo

### 1.1 Entrar y ver la estructura

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-01 Equipo en el menú | ✅ [P] | ✅ [M] | — [M] | 👁 [P] | — [M] → 🔒 «Mi ficha» [D] | `team.team·V` | modelo §5, §6b | parcial (`/usuarios`, sin guarda) |
| EQ-02 Home de equipo: pulso (ocupación, servicios, retención) | ✅ [D] | ✅ su sucursal [D] | — | — [D] | — | `team.team·V` + `metrics.kpis·A` | `TeamHomePage.tsx` | parcial (`/usuarios`, datos fijos de `teamHome.tsx`, no de la API ni de la sucursal) |
| EQ-03 Reparto por rol (fichas que filtran) | ✅ [D] | ✅ sin «Dueño» [D] | — | — | — | `team.managers·V` | `TeamHomePage.tsx:223` | ✓ (`/usuarios`) |
| EQ-04 Lista de barberos por comisión | ✅ [P] | ✅ [M] | — | 👁 [P] | — | `team.team·V` | casos/equipo.md «Barberos» | parcial (una lista única de personas) |
| EQ-05 Lista de barberos de renta | ✅ [P] | ✅ [M] | — | 👁 [M] (`team·V`) → — [D] | — | `team.team·V` | casos/equipo.md | parcial |
| EQ-06 Columna **Cuenta bancaria** (renta) | ✅ [P] | 👁 enmascarada [D] (hoy ✅ por `team·V` [M]) | — | — [D] (hoy 👁 por `team·V` [M]) | 🔒 la suya [D] | `team.barber-payments·A` [D] (hoy `team.team·V`) | equipo/la-lista-de-barberos.md | ✗ (la lista no la muestra) |
| EQ-07 Correo y teléfono de los colegas | ✅ [P] | ✅ [M] | — | — [D] (hoy 👁 [P]) | — | `team.team·V` | casos/equipo.md tabla | ✓ (`/usuarios`, sin recorte) |
| EQ-08 Filtro **Nivel** y buscador | ✅ [P] | ✅ [M] | — | 👁 [P] | — | `team.team·V` | equipo/la-lista-de-barberos.md | parcial (buscador; sin filtro de nivel) |
| EQ-09 Pestaña **Gerentes** (dueños, admins; ¿recepción?) | ✅ [P] | ✅ [M] | — | — [P] | — | `team.managers·V` | equipo/gerentes.md | parcial (filtro por rol; sin pestaña) |
| EQ-10 Pestaña **Niveles** | ✅ [P] | ✅ [M] | — | 👁 [P] | — | `team.levels·V` | modelo §6b | ✓ (`/usuarios/niveles`) |
| EQ-11 Pestaña **Horas de trabajo** | ✅ [P] | ✅ [M] | 👁 «quién trabaja hoy» [D] | 👁 [P] | 🔒 las suyas [D] | `team.team·V` (sin fila propia) | modelo §6b | ✓ (`/usuarios/horarios`) |
| EQ-12 Pestaña **Turnos** sin cubrir (Thema) | ✅ [D] | ✅ [D] | 👁 [D] | — | — | sin fila | `teamHome.tsx:350` | parcial (lista fija, botón «Asignar» sin acción) |
| EQ-13 Solo personas activas en la sucursal elegida | ✅ [P] | ✅ [P] | — | ✅ [P] | — | — | modelo §3 | parcial (la API filtra por `branchId`; el home no) |

### 1.2 Crear miembros

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-14 Botón **Crear miembro del equipo** | ✅ [P] | ✅ [M] | — | — [M] | — | `team.team·C` | casos/equipo.md | ✓ (drawer + `/usuarios/nuevo`) |
| EQ-15 Crear **Dueño** | ✅ [P] | — [N] (local admin no asciende a owner) | — | — | — | `team.managers·C` + regla «solo dueño» [D] | equipo/crear-dueno.md; Notion QA | parcial (se ofrece a cualquiera) |
| EQ-16 Crear **Administrador** | ✅ [P] | — [D] (M lo permite con `managers·C`) | — | — | — | `team.managers·C` + «rol menor que el tuyo» [D] | equipo/crear-administrador.md | parcial |
| EQ-17 Crear **Recepcionista** | ✅ [P] | ✅ [M] | — | — | — | `team.managers·C` | equipo/crear-recepcionista.md | ✓ |
| EQ-18 Crear **Barbero por comisión** | ✅ [P] | ✅ [M] | — | — | — | `team.team·C` | equipo/crear-barbero-por-comision.md | ✓ |
| EQ-19 Crear **Barbero de renta** | ✅ [P] | ✅ [M] | — | — | — | `team.team·C` | equipo/crear-barbero-de-renta.md | ✓ |
| EQ-20 Paso **Compensación / Pagos** al crear | ✅ [P] | ? [M] (sin `barber-payments`) → valores de fábrica, los fija el dueño [D] | — | — | — | `team.barber-payments·C` | casos/equipo.md | parcial (siempre visible) |
| EQ-21 Paso **Permisos** al crear | ✅ [P] | ✅ solo roles por debajo [D] | — | — | — | `business.permissions·E` | equipo/crear-administrador.md | ✓ (con «restaurar los del rol») |
| EQ-22 Interruptor **Esta persona es barbero** (dueño/admin) | ✅ [P] | ✅ [P] | — | — | — | `team.managers·C` | equipo/crear-dueno.md | ✓ (`isAlsoBarber`) |
| EQ-23 **Cargar miembros** en lote | ✅ [D] | ✅ [D] | — | — | — | `team.team·C` | `TeamHomePage.tsx:81` | parcial (botón sin acción) |
| EQ-24 Envío del acceso (invitación) al crear | ? [N] («agregar owner no envía correo») | ? | — | — | — | — | Notion | parcial (`status: "invited"`, sin envío) |
| EQ-25 **Recordar invitación** | ✅ [D] | ✅ [D] | — | — | — | `team.team·E` | `TeamHomePage.tsx:85` | parcial (sin acción) |

### 1.3 Ficha de una persona: ver

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-26 Abrir la ficha de **otro** | ✅ [P] | ✅ su sucursal [M] | — | ? [M] (`team·V`) → — [D] | — | `team.team·V` | modelo §6 | ✓ (`/usuarios/miembros/:id`) |
| EQ-27 Abrir **su propia** ficha | ✅ | ✅ | 🔒 [D] | 🔒 [D] | 🔒 [D] | propio | — | ✗ (no hay «Mi ficha»; la sesión no sabe qué miembro es) |
| EQ-28 **Perfil** (foto, nombre, nivel, descripción, habilidades, galería) | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | `team.team·V` / propio | equipo/ficha-de-un-barbero-perfil.md | ✓ |
| EQ-29 **Código** de la persona | ✅ [P] | ✅ [M] | — | 🔒 el suyo [D] (hoy 👁 de todos [M]) | 🔒 el suyo [D] | `team.team·V` | equipo/codigo-de-un-barbero.md | ✓ (`code`) |
| EQ-30 **Servicios** (precio, cliente nuevo, lealtad, tiempo, comisión dividida/extra) | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | `team.team·V` | equipo/ficha-de-un-barbero-servicios.md | ✓ |
| EQ-31 **Compensación** (5 % por tipo de cliente, producto, tipo) | ✅ [P] | — [M] (sin `barber-payments`) | — | 🔒 la suya [D] | — | `team.barber-payments·V` | equipo/ficha-de-un-barbero-compensacion.md | ✓ (sin guarda) |
| EQ-32 **Pagos** de renta (base + 3 deducciones) | ✅ [P] | — [M] | — | — | 🔒 la suya [D] | `team.barber-payments·V` | equipo/ficha-de-un-barbero-de-renta-pagos.md | ✓ (sin guarda) |
| EQ-33 **Información bancaria** | ✅ [P] | — [D] | — | — | 🔒 la suya [D] | `team.barber-payments·V` [D] | ídem | ✓ (sin guarda ni enmascarado) |
| EQ-34 **Calendario** (horario fijo semanal) | ✅ [P] | ✅ [M] | 👁 [D] | 🔒 [D] | 🔒 [D] | `team.team·V` | equipo/ficha-de-un-barbero-calendario.md | ✓ |
| EQ-35 **Permisos** (matriz de la persona) | ✅ [P] | ✅ [M] | — | 👁 la suya [D] | 👁 la suya [D] | `business.permissions·V` | equipo/ficha-de-un-barbero-permisos.md | ✓ |
| EQ-36 **Opciones** (propinas, varias citas, clientes nuevos, cancelación, intervalo, recordatorios) | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | `team.team·V` | equipo/ficha-de-un-barbero-opciones.md | ✓ |
| EQ-37 **Visibilidad para agendamiento** | ✅ [P] | ✅ [M] | — | 🔒 [D] | 🔒 [D] | `team.team·V` | equipo/visibilidad-para-agendamiento.md | ✓ (`bookingVisible`) |

### 1.4 Ficha de una persona: editar

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-38 Editar **Perfil** de otro | ✅ [P] | ✅ [M] | — | — [P] (solo V) | — | `team.team·E` | equipo/editar-a-un-miembro-del-equipo.md | ✓ (`?editar=1`) |
| EQ-39 Editar **su** foto, descripción, habilidades y galería | ✅ | ✅ | ✅ [D] | ✅ [D] | ✅ [D] | propio | — (es su vitrina en la reserva online) | ✗ |
| EQ-40 Editar **su** nombre, teléfono, correo | ✅ | ✅ | ? → pedirlo [D] | ? → pedirlo [D] | ? → pedirlo [D] | propio | — (el teléfono es su login) | ✗ |
| EQ-41 Editar **Servicios** y precios propios de otro | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | equipo/ficha-de-un-barbero-servicios.md | ✓ |
| EQ-42 Editar **sus** precios por servicio | ✅ | ✅ | — | — [D] (precio de la tienda) | ✅ [N][D] (en renta no aplica el precio de la tienda) | propio + `pos.prices·A` | Notion; ROLES_PLAN §2 | ✗ |
| EQ-43 Editar **Compensación** (tipo, %, producto) | ✅ [P] | — [M] (✅ si le encienden `barber-payments`) | — | — | — | `team.barber-payments·E` | ficha-de-un-barbero-compensacion.md | ✓ (sin guarda) |
| EQ-44 Editar **Pagos** de renta (base, deducciones) | ✅ [P] | — [M] | — | — | — | `team.barber-payments·E` | ficha-de-un-barbero-de-renta-pagos.md | ✓ (sin guarda) |
| EQ-45 Editar **Información bancaria** | ✅ [P] | — [D] | — | — | ✅ la suya [D] (hoy «la ve y la edita el dueño» [P]) | `team.barber-payments·E` / propio | empezar/guia-del-barbero-de-renta.md | ✓ (sin guarda) |
| EQ-46 Editar **Calendario** fijo de otro | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | ficha-de-un-barbero-calendario.md | ✓ |
| EQ-47 Editar **su** horario fijo | ✅ | ✅ | — | — pedirlo [D] | ✅ [D] (es su negocio) | propio | ROLES_PLAN §2 | ✗ |
| EQ-48 Editar **Permisos** de otro | ✅ [P] | ✅ solo roles por debajo [M][D] | — | — | — | `business.permissions·E` | roles-y-permisos/cambiar-los-permisos-de-una-persona.md | ✓ (sin restricción) |
| EQ-49 Editar **sus propios** permisos | ✅ (acceso total igual) | — [D] | — | — | — | — | evitar autoescalada [D] | parcial (nadie lo impide) |
| EQ-50 Editar **Opciones** de otro | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | ficha-de-un-barbero-opciones.md | ✓ |
| EQ-51 Editar **sus** opciones (recordatorios, redes, link) | ✅ | ✅ | — | ✅ recordatorios [D] | ✅ todas [D] | propio | — | ✗ |
| EQ-52 Cambiar **Visibilidad para agendamiento** de otro | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | visibilidad-para-agendamiento.md | ✓ |
| EQ-53 Cambiar **su** visibilidad / «toma clientes nuevos» | ✅ | ✅ | — | — [D] | ✅ [D] | propio | ROLES_PLAN §2 | ✗ |

### 1.5 Estado de una persona

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-54 **Inactivar** barbero | ✅ [P] | ✅ [M] | — | — | — | `team.team·B` (no hay columna propia) | equipo/inactivar-a-un-miembro-del-equipo.md | ✓ (ficha y lote) |
| EQ-55 **Reactivar** | ✅ [D] | ✅ [D] | — | — | — | `team.team·E` | pendiente en producción | ✓ (`status: active`) |
| EQ-56 **Borrar** barbero | ✅ [P] | ✅ [M] | — | — | — | `team.team·B` | equipo/borrar-a-un-miembro-del-equipo.md | ✓ |
| EQ-57 **Inactivar Dueño** | ✅ salvo el último dueño [D] | — [D] | — | — | — | `team.managers·B` + «solo dueño» | equipo/gerentes.md | parcial (cualquiera puede) |
| EQ-58 **Borrar Dueño** | — [P] (no aparece) | — | — | — | — | — | equipo/gerentes.md | ✓ (403 en el mock) |
| EQ-59 Inactivar **un perfil** (p. ej. solo «Barbero por comisión» de un dueño) | ✅ [P] | ? | — | — | — | `team.managers·B` | equipo/gerentes.md | ✗ (Thema tiene un solo registro con `isAlsoBarber`) |
| EQ-60 **Cambiar de rol** / pasar de comisión a renta | ✅ con fecha efectiva [N][D] (hoy no existe: «tendrías que crearla de nuevo» [P]) | — [D] | — | — | — | `team.barber-payments·E` | equipo/comision-o-renta.md; Notion | ✗ |
| EQ-61 **Ascender a dueño** | ✅ [D] | — [N] (QA crítico) | — | — | — | solo dueño | Notion QA | ✗ |
| EQ-62 Desactivar **en lote** | ✅ [D] | ✅ [D] | — | — | — | `team.team·B` | `TeamHomePage.tsx:86` | parcial (sin acción en lote) |

### 1.6 Niveles

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-63 Ver niveles y cuántos barberos hay en cada uno | ✅ [P] | ✅ [M] | — | 👁 [P] | — | `team.levels·V` | equipo/niveles-de-barberos.md | ✓ (`/usuarios/niveles`) |
| EQ-64 **Crear nivel** | ✅ [P] | ✅ [M] | — | — | — | `team.levels·C` | equipo/crear-y-editar-un-nivel.md | ✓ |
| EQ-65 **Editar** nivel | ✅ [P] | ✅ [M] | — | — | — | `team.levels·E` | ídem | ✓ |
| EQ-66 **Borrar** nivel | ✅ [P] | ✅ [M] | — | — | — | `team.levels·B` | ídem | ✓ |
| EQ-67 **Asignar** nivel a un barbero | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | ídem | ✓ (Perfil › nivel) |
| EQ-68 Definir niveles con **% por nivel** (flat o tiered, 2–4 niveles) | ✅ [N] | — [D] | — | — | — | `team.barber-payments·E` [D] | Notion | ✗ (`levelSchema` es solo `{ id, name }`) |
| EQ-69 **Ascender** de nivel (tras 90 días, por mérito) | ✅ aprueba [N][D] | 👁 propone [D] | — | — | — | `team.levels·E` | Notion | ✗ |
| EQ-70 Ver **su nivel y la brecha** al siguiente | ✅ | ✅ | — | 🔒 [N] | — [D] (en renta el nivel no fija su pago) | propio | Notion; ROLES_PLAN §2 | ✗ |

### 1.7 Horas de trabajo y excepciones

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-71 Ver la semana de todo el equipo | ✅ [P] | ✅ [M] | 👁 hoy [D] | 👁 [P] | 🔒 la suya [D] | `team.team·V` | equipo/horas-de-trabajo-del-equipo.md | ✓ (`/usuarios/horarios`) |
| EQ-72 Filtro **Sucursal** dentro de Horas | ✅ [P] | ✅ solo las suyas [D] | — | — [D] | — | — | ídem | parcial (usa la sucursal de la cabecera) |
| EQ-73 **Editar este día** (excepción de turno) | ✅ [P] | ✅ [M] | — | — | 🔒 [D] | `team.team·E` | ídem | ✓ (`PUT /team/schedule/override`) |
| EQ-74 **Borrar este turno** | ✅ [P] | ✅ [M] | — | — | 🔒 [D] | `team.team·E` | ídem | ✓ |
| EQ-75 **Restaurar el horario fijo** de ese día | ✅ | ✅ | — | — | 🔒 [D] | `team.team·E` | Thema | ✓ (`WorkHoursPage.tsx:121`) |
| EQ-76 **Pedir** un cambio de turno | — | — | — | ✅ [D] | — | propio | — | ✗ |

### 1.8 Órdenes del equipo

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-77 **Ordenar barberos** (columnas del calendario) | ✅ [P] | — [M] | — | — | — | `team.barber-order·E` | equipo/ordenar-barberos.md | ✓ (`/usuarios/orden`, sin guarda) |
| EQ-78 Ordenar **por nivel** (pestaña Nivel) | ✅ [P] | — [M] | — | — | — | `team.barber-order·E` | ídem | ✓ |
| EQ-79 Fila **sin cita** (encender y ordenar) | ✅ [P] | ✅ [M] | — | — | — | `team.lineup·E` | equipo/orden-para-clientes-sin-cita.md | ✓ (`/usuarios/fila`) |
| EQ-80 Fila **sin preferencia** | ✅ [P] | ✅ [M] | — | — | — | `team.lineup·E` | equipo/orden-para-clientes-sin-preferencia.md | ✓ |
| EQ-81 Ver **en qué puesto de la fila** va | ✅ | ✅ | 👁 [D] (asigna al walk-in) | 🔒 [D] | 🔒 [D] | `team.lineup·V` | — | ✗ |
| EQ-82 Salirse de la fila sin preferencia | — | — | — | — [D] | ✅ [D] (le descuentan por esos clientes) | propio | ficha-de-un-barbero-de-renta-pagos.md | ✗ |

### 1.9 Vacaciones y bloqueos de la persona

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-83 Bloquear **su** agenda (almuerzo, personal) | ✅ | ✅ | — | 👁 [M] (solo Ver) → ✅ [D] | ✅ [M] | `bookings.block-calendar·C` | tabla-de-permisos-por-rol.md | parcial (sin guarda; matriz cruzada, ver §6) |
| EQ-84 Bloquear la agenda **de otro** | ✅ [M] | ✅ [M] | ✅ [M] | — | — | `bookings.block-calendar·C` | ídem | ✓ (calendario) |
| EQ-85 **Solicitar** vacaciones | — | — | — | ✅ [P] («Cuando un barbero solicita vacaciones») | — | `bookings.block-calendar·C` + aprobación | configuracion/notificaciones-del-calendario.md | ✗ (solo el aviso `vacationRequested` en el catálogo) |
| EQ-86 **Crear** vacaciones sin aprobación | ✅ | ✅ | ✅ registra [D] | — | ✅ [P] («Cuando un barbero de renta crea…») | `bookings.block-calendar·C` | ídem | parcial (bloqueo `vacation` sin flujo) |
| EQ-87 **Aprobar / negar** una solicitud | ✅ [D] | ✅ [D] | — | — | — | `bookings.block-calendar·E` | `notificationCatalog.ts:56` (`vacationApproved/Denied`) | ✗ |
| EQ-88 Recibir aviso de vacaciones del equipo | ✅ [P] | ✅ [P] | 👁 aprobadas [D] | 🔒 la respuesta [D] | — | Centro de notificaciones | casos/configuracion.md | parcial (catálogo de avisos, sin envío) |

### 1.10 Alertas del equipo

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-89 **Renta vencida** | ✅ «Renta por cobrar» [D] | ✅ su sucursal [D] | — | — | 🔒 la suya [D] | `team.barber-payments·V` | `teamHome.tsx:560` | parcial (home, datos fijos) |
| EQ-90 **Silla parada** (< 50 % de agenda) | ✅ [D] | ✅ [D] | — | 🔒 [N] («sus clientes por volver») | 🔒 [D] | `team.team·V` / propio | `teamHome.tsx`; Notion | parcial |
| EQ-91 **Caja sin cerrar** | ✅ [D] | ✅ [D] | 🔒 la suya [D] | — | — | sin fila | `teamHome.tsx` | parcial |
| EQ-92 **Invitación sin aceptar** | ✅ [D] | ✅ [D] | — | — | — | `team.team·V` | `teamHome.tsx` | parcial |
| EQ-93 **Turno de hoy sin cubrir** | ✅ [D] | ✅ [D] | ✅ [D] | — | — | `team.team·V` | `teamHome.tsx` | parcial |
| EQ-94 Salida de un barbero / concentración de clientes en uno | ✅ [N] | — [N] | — | — | — | `metrics.kpis·A` | Notion | ✗ |
| EQ-95 Coaching semanal | — | ✅ [N] | — | — | — | `metrics.kpis·A` | Notion | ✗ |
| EQ-96 Retención de un barbero por encima / debajo de X % (cada 3 meses) | ✅ [P] | ✅ [P] | — | 🔒 [D] | 🔒 [D] | Centro de notificaciones | casos/configuracion.md «Métricas» | parcial (catálogo `RETENTION`) |
| EQ-97 Alertas de **primera visita** atribuidas a un barbero | ✅ [N] | ✅ [N] | — | — [N] (no culpar) | — [N] | — | Notion; ROLES_PLAN §3 | ✗ |

### 1.11 Modelo de negocio y compensación

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| EQ-98 Elegir el modelo de la barbería (comisión / híbrido / renta) | ✅ [N] | — | — | — | — | solo dueño | Notion | ✗ |
| EQ-99 Elegir el modelo **por barbero** con fecha efectiva | ✅ [N] | — | — | 👁 el suyo [D] | 👁 el suyo [D] | `team.barber-payments·E` | Notion | ✗ (el rol es fijo) |
| EQ-100 Tipo de compensación **Comisión / Escala / Salario** | ✅ [P] | — [M] | — | 👁 el suyo [D] | — | `team.barber-payments·E` | ficha-de-un-barbero-compensacion.md | ✓ (`compensationTypeSchema`) |
| EQ-101 Rango permitido de comisión 40–65 % | ✅ define [N] | — | — | — | — | regla | Notion | parcial (el mock valida 1–100 %) |
| EQ-102 Ver lo que lleva ganado / su pago neto | ✅ todos | ✅ su sucursal (con `payroll·V`) | — | 🔒 [D] | 🔒 [D] | `business.payroll·V` / propio | ROLES_PLAN §2 (detalle en el doc de Nómina) | ✗ |
| EQ-103 «Ver agenda» de una persona desde Equipo | ✅ | ✅ | ✅ [D] | — | — | `bookings.calendar·A` | `TeamHomePage.tsx:147` | ✓ (`/calendario?equipo=`) |

---

# 2. Sucursales

**Qué es.** Cada local de la empresa, con su moneda, zona horaria, idioma y horario. Regla de oro: **se crea
una vez para toda la empresa y se activa por sucursal** (equipo, servicios, productos) [P]. El selector de
la cabecera decide de qué sucursal es todo lo que se ve; Configuración es de la empresa y se ve igual en
cualquiera [P].

- **Dueño.** Ve todas y **Todas las sucursales** (consolidado) [P]; crea, edita, inactiva y borra sucursales;
  activa equipo, servicios y productos en cada una [P].
- **Admin.** Propuesta: el selector solo lista **las sucursales donde está activado**; si tiene más de una,
  también su consolidado [D]. Activa equipo, servicios y productos en las suyas [M]; edita los datos de su
  sucursal pero no crea ni borra sucursales [D] (es licencia y facturación).
- **Recepción.** Solo sus sucursales en el selector; si es una, el chip es fijo (sin menú) [D]. No toca
  Configuración › Sucursales [D].
- **Comisión.** Igual que recepción. Un barbero activado en dos sucursales cambia entre ellas y ve su
  columna en cada una [P][D].
- **Renta.** Igual que comisión. Normalmente una sola sucursal [D].

## Inventario de acciones — Sucursales

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| SU-01 Selector de sucursal en la cabecera | ✅ [P] | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | — | navegacion/cambiar-de-sucursal.md | ✓ (menú de la cuenta) |
| SU-02 Qué sucursales lista el selector | Todas [P] | Las suyas [D] | Las suyas [D] | Las suyas [D] | La suya [D] | `member.branchIds` | modelo §2 | parcial (las 4 de `BRANCHES` a todos) |
| SU-03 **Todas las sucursales** (consolidado) | ✅ [P] | ✅ si tiene > 1 [D] | — [D] | — [D] | — | — | sucursales/ver-todas-las-sucursales-a-la-vez.md | ✗ |
| SU-04 Cambiar de sucursal y que todo cambie (calendario, clientes, equipo, métricas) | ✅ [P] | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | — | modelo §2 | parcial (`branchId` en memoria; se pierde al recargar) |
| SU-05 Ver **Configuración › Sucursales** (lista) | ✅ [P] | 👁 las suyas [D] | — | — | — | `business.account-settings·V` (sin fila propia) | sucursales/empresa-y-sucursales.md | ✓ (`/configuracion/sucursales`) |
| SU-06 **Ver** detalle (Clientes, Equipo, Licencia) | ✅ [P] | 👁 sin Licencia [D] | — | — | — | ídem | sucursales/ver-el-detalle-de-una-sucursal.md | parcial (sin cifras ni licencia) |
| SU-07 **Crear sucursal** | ✅ [P] | — [D] | — | — | — | solo dueño [D] | sucursales/crear-una-sucursal.md | ✓ |
| SU-08 **Editar** datos (nombre, dirección, teléfono, fotos) | ✅ [P] | ✅ la suya [D] | — | — | — | `business.account-settings·E` | sucursales/editar-una-sucursal.md | ✓ (sin fotos) |
| SU-09 Cambiar **moneda** | ✅ [P] | — [D] (rompe históricos) | — | — | — | solo dueño [D] | sucursales/que-es-propio-de-cada-sucursal.md | ✓ |
| SU-10 Cambiar **zona horaria** | ✅ [P] | — [D] | — | — | — | solo dueño [D] | ídem | ✓ |
| SU-11 Cambiar **idioma** con los clientes | ✅ [P] | ✅ [D] | — | — | — | `business.account-settings·E` | ídem | ✓ |
| SU-12 Horario de la sucursal (inicio/fin del día, formato, inicio de semana) | ✅ [P] | ✅ [D] | — | — | — | `business.account-settings·E` | modelo §2 | parcial (en «Negocio», no por sucursal) |
| SU-13 **Inactivar** sucursal | ✅ [P] | — [D] | — | — | — | solo dueño [D] | sucursales/inactivar-una-sucursal.md | parcial (estado sin acción propia) |
| SU-14 **Borrar** sucursal | ✅ [P] | — [D] | — | — | — | solo dueño [D] | sucursales/borrar-una-sucursal.md | ✓ (409 si es la última o tiene equipo) |
| SU-15 **Activar equipo** (barberos comisión/renta) en la sucursal | ✅ [P] | ✅ [M] | — | — | — | `team.team·E` | sucursales/activar-equipo-en-una-sucursal.md | ✓ (drawer en `/usuarios`) |
| SU-16 Activar **gerentes** (dueños, admins, recepción) | ✅ [P] | ✅ recepción [D] / no dueños ni admins [D] | — | — | — | `team.managers·E` | ídem | ✓ (pestaña «Gerentes» del drawer) |
| SU-17 **Activar servicios** | ✅ [P] | ✅ [M] | — | — | — | `services.services·E` | sucursales/activar-servicios-en-una-sucursal.md | ✓ (Servicios) |
| SU-18 **Activar productos** | ✅ [P] | ✅ [M] | — | — | — | `inventory.products·E` | sucursales/activar-productos-en-una-sucursal.md | ✓ (Productos) |
| SU-19 Ajustes **por ubicación** (comisiones, impuestos, propinas, cierres, permisos) | ✅ [P] (anunciado) | ? («aparece con permiso de edición de sucursal») | — | — | — | ? | sucursales/ajustes-generales-y-por-sucursal.md | ✗ |
| SU-20 **Empresa** (razón social, identificación) | ✅ [P] | — [D] | — | — | — | solo dueño [D] | casos/configuracion.md «Empresa» | ✓ (`/configuracion/empresa`) |
| SU-21 **Licencia** por sucursal y facturación | ✅ [P] | — [D] | — | — | — | solo dueño | ver-el-detalle-de-una-sucursal.md | ✗ |
| SU-22 Una persona en **dos empresas** (dos barberías) | ✅ cambia de empresa [N][D] | ✅ ídem | ✅ ídem | ✅ ídem | ✅ ídem | — | Notion (bug: «no ve la segunda») | ✗ (solo sucursales; no hay empresa en la sesión) |
| SU-23 Un barbero en **dos sucursales** | ✅ lo activa [P] | ✅ en las suyas [M] | — | ✅ cambia y ve su columna en cada una [D] | ✅ ídem [D] | `member.branchIds` | sucursales/un-barbero-que-trabaja-en-dos-sucursales.md | ✓ (`branchIds`) |
| SU-24 «No veo a un barbero / servicio» → activar | ✅ [P] | ✅ [P] | 👁 aviso «pídeselo al admin» [D] | — | — | — | sucursales/no-veo-a-un-barbero-en-mi-sucursal.md | parcial |

---

# 3. Usuarios / Personas (módulo de la plantilla)

**Qué es.** `/usuarios/lista` (`src/features/users/`) es la tabla de personas que trae la plantilla Thema:
roles `admin | manager | member` («Administrador», «Líder», «Colaborador») y **áreas** de empresa
(Producto, Ingeniería, Ventas…) contra `GET/POST/PATCH/DELETE /users`. No es de Barberlytics: producción no
tiene «Usuarios», solo Equipo [P]. La única entrada es un enlace del calendario
(`CalendarPage.tsx:738`, «Ver barbero» → `/usuarios/lista?search=`), que lleva a una lista donde ese
barbero no existe.

- **Dueño / Admin.** Propuesta: el módulo desaparece; «Personas» **es** Equipo. Lo que la plantilla aportaba
  (estado invitado/activo/inactivo, último acceso) ya vive en `TeamMember.status` [D].
- **Recepción, Comisión, Renta.** Nada [D].

## Inventario de acciones — Usuarios

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| US-01 Abrir `/usuarios/lista` | — [D] → redirige a `/usuarios` | — [D] | — | — | — | — | `router.tsx:100` | ✓ (debe salir) |
| US-02 Crear persona (rol admin/líder/colaborador + área) | — [D] | — [D] | — | — | — | — | `mocks/handlers.ts:346` | ✓ (debe salir) |
| US-03 Editar persona | — [D] | — [D] | — | — | — | — | `UserFormDrawer.tsx` | ✓ (debe salir) |
| US-04 Borrar persona | — [D] | — [D] | — | — | — | — | `mocks/handlers.ts:379` | ✓ (debe salir) |
| US-05 «Ver barbero» desde el calendario | ✅ → ficha [D] | ✅ → ficha [D] | 👁 ficha pública [D] | — | — | `team.team·V` | `CalendarPage.tsx:738` | parcial (lleva a la lista de la plantilla) |
| US-06 Último acceso de cada persona | ✅ [D] | ✅ su sucursal [D] | — | — | — | `team.team·V` | `users/types.ts` (`lastActiveAt`) | parcial (solo en la plantilla y en `teamHome.tsx`) |
| US-07 Estado invitado / activo / inactivo | ✅ [P] | ✅ [M] | — | — | — | `team.team·V` | equipo/la-lista-de-barberos.md | ✓ (`TeamMember.status`) |

---

# 4. Cuenta y cambio de perfil

**Qué es.** Una persona entra con su celular y un código [P]. Puede tener **varios perfiles** (el «sombrero»:
p. ej. Business y Barber comission) y cambia entre ellos desde el menú de la cuenta sin volver a entrar; al
pasar a barbero aterriza en Calendario y al volver a dueño en Métricas [P]. «Mi perfil» es la cuenta frente a
Barberlytics: plan, métodos de pago y facturas [P]. Thema añade **«Ver como»**: el menú de la cuenta ofrece
los cinco roles a cualquiera, sin guardar y sin cambiar datos (`AppLayout.tsx:84`).

- **Dueño.** Varios perfiles si también corta [P]; «Ver como» cualquier rol con una persona de ejemplo [D];
  Mi perfil completo (plan, pagos, facturas) [P]; Configuración entera.
- **Admin.** Sus perfiles (admin y, si corta, barbero) [P]; «Ver como» solo roles por debajo (recepción,
  barberos) [D]; Mi perfil sin plan ni pagos de Barberlytics [D].
- **Recepción.** Un perfil; Mi perfil con sus datos; sin plan ni facturas [D]. Idea: código personal
  estilo Square para firmar cada cobro en un mostrador compartido [N].
- **Comisión.** Configuración reducida a **Formato de hora** (personal) y **Eliminar cuenta** [P].
- **Renta.** Igual que comisión, más sus datos bancarios en su ficha [D].

## Inventario de acciones — Cuenta

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| CU-01 Entrar con celular y código | ✅ [P] | ✅ [P] | ✅ [P] | ✅ [P] | ✅ [P] | — | acceso-y-cuenta/ingresar.md | ✓ (`/login`) |
| CU-02 Entrar con Google / Outlook | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | — | Thema | ✓ |
| CU-03 Registrar la barbería (crear cuenta) | ✅ [P] | — | — | — | — | — | acceso-y-cuenta/registrar-tu-barberia.md | ✓ (SignupPanel) |
| CU-04 Ver sus **perfiles** en el menú de la cuenta | ✅ [P] | ✅ [D] | ✅ (uno) [D] | ✅ [P] | ✅ [D] | — | roles-y-permisos/perfiles-y-roles.md | parcial (lista los 5 roles a todos) |
| CU-05 **Cambiar de perfil** sin volver a entrar | ✅ [P] | ✅ [D] | — (uno solo) | ✅ [P] | ✅ [D] | — | acceso-y-cuenta/cambiar-de-rol.md | parcial (es «Ver como», no perfiles reales) |
| CU-06 Aterrizaje al cambiar de perfil | Métricas [P] | Métricas [D] | Calendario [D] | Calendario [P] | Calendario [D] | — | modelo §6b | ✗ (se queda en la ruta) |
| CU-07 Etiqueta **«Propietario»** en la cabecera | ✅ [P] | «Administrador» [D] | «Recepción» [D] | sin etiqueta [P] | sin etiqueta [D] | — | modelo §6b | parcial (la sesión `admin` muestra «Administrador» a quien en el seed es dueña) |
| CU-08 **«Ver como»** otro rol (persona de ejemplo) | ✅ los 4 [D] | ✅ recepción y barberos [D] | — [D] | — [D] | — [D] | solo dueño/admin | ROLES_PLAN §5 | parcial (todos, sin persona, sin persistir, sin aviso) |
| CU-09 Aviso visible «Estás viendo como X · Volver» | ✅ [D] | ✅ [D] | — | — | — | — | — | ✗ |
| CU-10 **Mi perfil**: nombre, celular, idioma, zona horaria | ✅ [P] | ✅ [D] | ✅ [D] | ✅ [D] | ✅ [D] | propio | acceso-y-cuenta/mi-perfil.md | ✗ |
| CU-11 **Plan actual** y Cambiar plan | ✅ [P] | — [D] | — | — | — | solo dueño | acceso-y-cuenta/cambiar-mi-plan.md | parcial (`/configuracion/facturacion`) |
| CU-12 **Métodos de pago** de Barberlytics | ✅ [P] | — [D] | — | — | — | solo dueño | acceso-y-cuenta/metodos-de-pago-de-tu-plan.md | parcial |
| CU-13 **Facturas** de Barberlytics | ✅ [P] | — [D] | — | — | — | solo dueño | acceso-y-cuenta/descargar-tus-facturas.md | parcial |
| CU-14 Modo oscuro | ✅ [P] | ✅ | ✅ | ✅ | ✅ | — | navegacion/idioma-y-modo-oscuro.md | ✓ (Personalización) |
| CU-15 Idioma de la interfaz | ✅ [P] | ✅ | ✅ | ✅ | ✅ | — | ídem | ✓ |
| CU-16 **Formato de hora** personal | ✅ | ✅ | ✅ [D] | ✅ [P] | ✅ [M] | `business.account-settings·V` | casos/configuracion.md | parcial (es de la empresa, en «Negocio») |
| CU-17 **Eliminar cuenta** | ✅ borra la empresa [P] | — [D] | ✅ borra su acceso [D] | ✅ [P] (¿su acceso o la empresa?) | ✅ su acceso [D] | propio / solo dueño | casos/configuracion.md | parcial (borra la empresa a cualquiera) |
| CU-18 Cerrar sesión | ✅ [P] | ✅ | ✅ | ✅ | ✅ | — | acceso-y-cuenta/cerrar-sesion.md | ✓ |
| CU-19 Recuperar número / usuario bloqueado | ✅ [P] | ✅ | ✅ | ✅ | ✅ | — | acceso-y-cuenta/olvidaste-tu-numero.md | ✓ (Recovery, Locked, ticket) |
| CU-20 **Código personal** en recepción (estilo Square) | ✅ configura [N] | ✅ configura [N] | ✅ lo usa [N] | ✅ lo usa en el mostrador [D] | ✅ ídem [D] | sin fila | Notion (idea); el campo `code` ya existe | ✗ |
| CU-21 Panel interno de Barberlytics (todas las barberías) | — (rol de plataforma, fuera de los 5) [N][D] | — | — | — | — | — | Notion | ✗ |

---

# 5. Navegación y cabecera

**Qué es.** El menú lateral (o la barra de abajo en el celular) se arma con los permisos del perfil: sin
**Ver** en una función, la sección no aparece [P]. La cabecera trae el selector de sucursal, la lupa, la
campana, el idioma y la cuenta [P]. En Thema: menú lateral (cajón en móvil, sin barra de abajo), búsqueda
⌘K, campana, Ayuda, agente IA, centro de procesos, la cuenta (sucursal + rol) y Personalización colgando de
la marca.

- **Dueño.** Menú completo y barra «Inicio · Calendario · Equipo · Clientes · Más» [P].
- **Admin.** Menú del dueño menos lo que no tiene [M]; misma barra [D].
- **Recepción.** Calendario primero; sin Métricas con cifras [N]; barra «Calendario · Clientes · Productos ·
  Más» [D].
- **Comisión.** «Inicio · Calendario · Clientes · Equipo · Gastos · Configuración» y barra «Inicio ·
  Calendario · Gastos · Clientes · Más» [P]; propuesta: Gastos sale (privacidad) y entra «Lo que llevo» [D].
- **Renta.** Calendario, Mi negocio, Clientes, Gastos (los suyos), Configuración [D].

## Inventario de acciones — Navegación y cabecera

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| NA-01 Menú lateral filtrado por permisos | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] | ✅ [M] | `V` (o `A`) de cada fila | roles-y-permisos/que-ve-cada-rol-en-el-menu.md | ✗ (`navigation.ts` no mira permisos; `visibleSections` no se usa) |
| NA-02 Barra de abajo en el celular (4 atajos + Más) | ✅ [P] | ✅ [D] | ✅ [D] | ✅ [P] | ✅ [D] | ídem | navegacion/el-menu-en-el-celular.md | ✗ (cajón lateral + barra flotante de acciones) |
| NA-03 **Más** abre el menú completo del perfil | ✅ [P] | ✅ | ✅ | ✅ [P] | ✅ | ídem | ídem | parcial (el cajón) |
| NA-04 Lupa / ⌘K: buscar citas, pantallas y ayuda | ✅ [P] | ✅ | ✅ | 🔒 sus citas [D] | 🔒 sus citas [D] | `bookings.appointments·V` | navegacion/buscar-una-cita.md | parcial (busca pantallas y ayuda sin recorte) |
| NA-05 Campana de notificaciones | ✅ [P] | ✅ | ✅ | ✅ | ✅ | Centro de notificaciones por rol | navegacion/notificaciones.md | parcial (datos demo, iguales para todos) |
| NA-06 Ayuda (preguntar, centro, guías) | ✅ | ✅ | ✅ | ✅ | ✅ | — | `AppLayout.tsx:248` | ✓ (sin filtrar artículos por rol [D]) |
| NA-07 Agente IA (contexto de la pantalla) | ✅ | ✅ | ✅ sin cifras [N][D] | 🔒 sus datos [D] | 🔒 sus datos [D] | hereda los de la pantalla | `AppLayout.tsx:276` | ✓ (sin recorte) |
| NA-08 Centro de procesos | ✅ | ✅ | ✅ | ✅ | ✅ | — | `ProcessCenter.tsx` | ✓ |
| NA-09 Personalización (tema, color, densidad) | ✅ | ✅ | ✅ | ✅ | ✅ | — | `PersonalizationMenu.tsx` | ✓ |
| NA-10 Cambiar el **isologo** de la barbería («Cambiar» en Personalización) | ✅ [D] | — [D] | — | — | — | solo dueño | `AppLayout.tsx:178` | ✓ (sin guarda) |
| NA-11 Enviar feedback | ✅ | ✅ | ✅ | ✅ | ✅ | — | `FeedbackHost.tsx` | ✓ (manda `user.role`, no el perfil efectivo) |
| NA-12 Barra flotante de acciones | ✅ | ✅ | ✅ | ✅ | ✅ | acciones filtradas por permiso [D] | `TeamHomePage.tsx:445` | ✓ (sin filtrar) |
| NA-13 **Sistema de diseño** (`/docs`) en el menú | — [D] (interno) | — [D] | — | — | — | flag interno | `navigation.ts:58` | ✓ (debe salir del menú de producto) |
| NA-14 **Configuración** (menú de la cabecera) | ✅ 17 ajustes [P] | ✅ los de su sucursal [M][D] | ✅ unos pocos [M] | 2 ajustes [P] | 2–3 ajustes [D] | `business.account-settings·V` + fila de cada ajuste | casos/configuracion.md | parcial (los 19 a todos) |
| NA-15 Página **403** al entrar por URL a algo sin permiso | ✅ | ✅ | ✅ | ✅ | ✅ | `RequirePermission` [D] | — | parcial (`/403` existe; nadie redirige ahí) |
| NA-16 Migas | ✅ | ✅ | ✅ | ✅ | ✅ | — | `ShellHeaderSlot` | ✓ (pueden apuntar a pantallas vetadas: «Inicio» → `/metricas`) |

---

# 6. Menú lateral y barra del celular por rol

`✅` aparece · `—` no aparece · `🔒` aparece recortada a lo suyo. Producción vista para Dueño y Comisión [P];
el resto se deduce de la matriz [M] o se propone [D].

## 6.1 Menú lateral

| Entrada (Thema) | Ruta Thema | Dueño | Admin | Recepción | Comisión | Renta | Fila que la enciende |
|---|---|---|---|---|---|---|---|
| Inicio (Métricas) | `/metricas` | ✅ [P] | ✅ [M] | — [N] (M: ✅ `kpis·A`) | ✅ con sus cifras [P] → 🔒 [D] | 🔒 como «Mi negocio» [D] (M: —) | `metrics.kpis·A` |
| Mi negocio (renta) | ✗ (nueva) | — | — | — | — | ✅ [D] | propio |
| Lo que llevo (comisión) | ✗ (nueva) | — | — | — | ✅ [D] | — | propio |
| Calendario | `/calendario` | ✅ [P] | ✅ [M] | ✅ [M] | 🔒 su columna [P] | 🔒 su columna [D] | `bookings.calendar·A` |
| Clientes | `/clientes` | ✅ [P] | ✅ [M] | ✅ [M] | ✅ [P] → 🔒 [D] | 🔒 [D] (M: ✅) | `bookings.clients·V` |
| Servicios | `/servicios` | ✅ [P] | ✅ [M] | — [M] | — [P] | 🔒 sus precios [D] | `services.services·V` |
| Productos | `/productos` | ✅ [P] | ✅ [M] | 👁 [M] | — [P] | — [M] | `inventory.products·V` |
| Equipo | `/usuarios` | ✅ [P] | ✅ [M] | — [M] | 👁 [P] | 🔒 «Mi ficha» [D] | `team.team·V` |
| Gastos | `/gastos` | ✅ [P] | ✅ [M] | — [M] | ✅ [P] → — [D] | 🔒 los suyos [D] (M: ✅) | `business.expenses·V` |
| Nómina | `/nomina` | ✅ [P] | ✅ [M] | — [M] | — [P] → (ver «Lo que llevo») | — → (ver «Mi negocio») | `business.payroll·V` |
| Transacciones | `/transacciones` | ✅ [P] | ? (sin fila) → ✅ [D] | ? → del día, sin totales [D] | — [P] | 🔒 [D] | sin fila |
| Configuración (cabecera) | `/configuracion` | ✅ 17 [P] | ✅ [M] | ✅ algunos [M] | 2 [P] | 2–3 [D] | `business.account-settings·V` |
| Sistema de diseño | `/docs` | — [D] | — [D] | — | — | — | flag interno |
| Ayuda | menú «Ayuda» | ✅ | ✅ | ✅ | ✅ | ✅ | — |

Nota: producción agrupa **Servicios & Productos** en un desplegable [P]; Thema los separa a propósito
(`navigation.ts:47`).

## 6.2 Barra del celular (4 atajos + Más)

| Rol | Producción | Propuesta Thema | Por qué |
|---|---|---|---|
| Dueño | Inicio · Calendario · Equipo · Clientes · Más [P] | Igual [D] | Lo vio el usuario; no hay razón para cambiarlo |
| Admin | ? | Inicio · Calendario · Equipo · Clientes · Más [D] | Mismo trabajo que el dueño en su sucursal |
| Recepción | ? | Calendario · Clientes · Productos · Más [D] | Vive en el calendario; vende productos en mostrador; sin cifras |
| Comisión | Inicio · Calendario · Gastos · Clientes · Más [P] | Calendario · Lo que llevo · Clientes · Más [D] | Gastos de la sucursal no son suyos (§9); lo que más pregunta es cuánto lleva |
| Renta | ? | Calendario · Mi negocio · Clientes · Gastos · Más [D] | Su silla es su negocio: agenda, números, clientes y lo que gasta |

Thema hoy no tiene barra de abajo: por debajo de `lg` el menú es un cajón (`AppSidebar.tsx:351`) y las
acciones van en la barra flotante. Decidir si se añade la barra de abajo o se mantiene el cajón es una
decisión abierta [D] (§8).

## 6.3 Página de inicio por rol

| Rol | Al entrar | Al cambiar a este perfil | Fuente |
|---|---|---|---|
| Dueño | `/metricas` | `/metricas` | [P] (modelo §6b) |
| Admin | `/metricas` (su sucursal) | `/metricas` | [D] |
| Recepción | `/calendario` (vista Agenda del día) | `/calendario` | [D] (guia-de-recepcion.md: «la recepción vive en el Calendario») |
| Comisión | `/calendario` (su columna) | `/calendario` | [P] |
| Renta | `/calendario` (su columna) | `/calendario` | [D] (ROLES_PLAN §3) |

Hoy Thema manda a todos a `/metricas` (`router.tsx:63`, ruta índice).

---

# 7. Datos que se recortan a «lo suyo»

| Dato | Dónde aparece | Quién lo ve completo | Recorte por rol [D salvo que se marque] |
|---|---|---|---|
| Lista de personas | Equipo, ⌘K, filtros del calendario | Dueño (empresa), Admin (sus sucursales) | Comisión: nombre, foto, nivel y horas de los de su sucursal, **sin correo, teléfono ni código** (hoy los ve [P]). Renta: solo él. Recepción: quién trabaja hoy |
| Correo y teléfono de la persona | Lista, ficha, Gerentes | Dueño, Admin | Cada uno ve los suyos [N: «sus datos de contacto no se exponen a otros»] |
| **Código** de la persona | Ficha › Perfil | Dueño, Admin | Cada uno el suyo; si pasa a ser el PIN del mostrador [N], ni el admin lo lee: se regenera |
| Cuenta bancaria del de renta | Lista (columna), ficha › Pagos | Dueño | Admin enmascarada (últimos 4) salvo `barber-payments`; renta la suya; comisión nada (hoy la vería por `team·V` [M]) |
| Compensación (% y tipo) | Ficha › Compensación | Dueño (+ admin con `barber-payments` [M]) | Comisión: la suya en lectura; renta: nada |
| Lógica de renta (base y deducciones) | Ficha › Pagos | Dueño | Renta: la suya en lectura (para entender su pago neto) |
| Lo que lleva ganado / pago neto | Nómina, «Lo que llevo», «Mi negocio» | Dueño, Admin (`payroll·V`) | Comisión y renta: solo su fila |
| Renta vencida | Avisos del home de Equipo | Dueño, Admin | Renta: la suya |
| Ocupación / silla parada | Home de Equipo, avisos | Dueño, Admin | Comisión y renta: la suya |
| Horario y excepciones | Horas de trabajo | Dueño, Admin | Comisión: todos en lectura [P]; renta: el suyo; recepción: el de hoy |
| Puesto en la fila sin cita / sin preferencia | Fila | Dueño, Admin | Barberos: el suyo |
| Nivel y brecha al siguiente | Niveles, ficha | Dueño, Admin | Comisión: el suyo [N] |
| Permisos | Ficha › Permisos | Dueño, Admin | Cada uno los suyos, en lectura |
| Vacaciones y bloqueos | Calendario, avisos | Dueño, Admin, Recepción | Barberos: los suyos y la respuesta a su solicitud |
| Sucursales | Selector, Configuración › Sucursales | Dueño | Los demás: las de su `branchIds`; licencia y empresa solo el dueño |
| Plan, pagos y facturas de Barberlytics | Mi perfil, Configuración › Facturación | Dueño | Nadie más |
| Notificaciones | Campana | Por rol (Centro de notificaciones [P]) | Barberos: solo las de su agenda y su gente |
| Resultados de ⌘K y del agente | Cabecera | Según la pantalla | Mismo recorte que la pantalla de origen; artículos de ayuda filtrados por `roles` del artículo |

---

# 8. Contradicciones y pendientes

1. **Bloquear calendario está cruzado entre comisión y renta en Thema.** Matriz: comisión «V A», renta
   «V C E B A» (`tabla-de-permisos-por-rol.md`, filas «Bloquear calendario»). Thema hace lo contrario:
   comisión `full("block-calendar")`, renta `some("block-calendar", ["view"])`
   (`permissionsCatalog.ts:110-111` y `mocks/team/seed.ts:178,188`). Además un barbero de prueba de
   producción tenía «Bloquear calendario» completo «frente a solo Ver» de su rol (modelo §5). Decisión [D]:
   comisión crea **sus** bloqueos personales y **solicita** vacaciones; renta todo lo suyo sin aprobación.
2. **Más diferencias de la matriz en Thema** (mismos archivos): recepción con `clients·B`,
   `export-clients·A` y `services·V` que la matriz no le da, y sin `account-settings·V E` que sí le da;
   renta sin `clients·E B`, `import-clients·A` ni `export-clients·A`; admin con `export-clients·A` («no» en
   la matriz); `barber-payments` con columnas V C E A cuando en producción solo tiene **A**. La matriz vive
   **duplicada** en `permissionsCatalog.ts` y en `mocks/team/seed.ts`.
3. **El comisión ve contactos ajenos.** Producción: «ve la lista de los 10 barberos de la sucursal» con
   correo y teléfono (modelo §6b; `casos/equipo.md` tabla). Notion: los datos de contacto del barbero no se
   exponen a otros. Con `team·V` también vería la cuenta bancaria de los de renta
   (`ficha-de-un-barbero-de-renta-pagos.md`: «Solo los ven quienes tienen acceso a Equipo»). [D]: recortar.
4. **El de renta no tiene Equipo pero necesita su ficha.** `guia-del-barbero-de-renta.md`: «¿Dónde está mi
   cuenta bancaria? … La ve y la edita el dueño». Si su pago neto depende de base y deducciones, tiene que
   poder leerlas. [D]: «Mi ficha».
5. **Admin y la sucursal.** `guia-del-administrador.md`: «Lo que ves depende de las sucursales donde estés
   activado y del selector de arriba» (sin confirmar), y la pestaña Horas trae un filtro **Sucursal** libre
   (`horas-de-trabajo-del-equipo.md`). ¿El admin ve otras sucursales? ROLES_PLAN §4.5 lo deja abierto. [D]:
   solo las de su `branchIds`.
6. **Admin y el dinero.** Matriz: admin con «Nómina de sueldos V C E» pero sin «Sección de pagos de
   barberos»; «qué oculta exactamente ese permiso está pendiente» (`darle-a-recepcion-solo-lo-necesario.md`).
   QA de Notion pide que el admin vea compensación y nómina. [D]: nómina en lectura de su sucursal;
   compensación solo si el dueño enciende `barber-payments`.
7. **Admin crea dueños.** La matriz le da `Gerentes V C E B A` (§5), y Gerentes lista dueños. Notion: «local
   admin no puede ascender a owner» (QA crítico). Thema ofrece los 5 roles a cualquiera
   (`CreateMemberDrawer.tsx`). [D]: solo el dueño crea dueños y admins.
8. **¿Dónde está la recepción en Equipo?** `gerentes.md`: «Que la recepcionista salga en esta lista todavía no
   está comprobado». Thema la mete en la pestaña «Gerentes» del drawer de activación
   (`ActivateTeamDrawer.tsx:49`, todo lo que no es barbero).
9. **«Personalizar por ubicación».** La pantalla de Permisos y cuatro ajustes lo prometen, pero «con la cuenta
   del dueño no se encontró dónde» (modelo §2, §6b; `ajustes-generales-y-por-sucursal.md`). Sin dato.
10. **Cambiar el predeterminado de un rol ¿toca a los existentes?** Pendiente
    (`cambiar-los-permisos-de-un-rol.md`). Thema no tiene la pantalla de predeterminados: `API_CONTRACT.md`
    dice «Los permisos por rol no están aquí: viven en Equipo», pero Equipo solo tiene la matriz por persona.
11. **Inactivar vs Borrar** (persona y sucursal): qué conserva cada uno, pendiente (modelo, pendiente 6).
    Thema: inactivar = `status: inactive`; borrar elimina y saca de los órdenes; el dueño no se borra (403).
12. **El rol no cambia.** Producción: «no hay un botón para pasar de comisión a renta: tendrías que crearla de
    nuevo» (`comision-o-renta.md`). Notion: modelo por barbero **con fecha efectiva**. Choque directo.
13. **Niveles.** Producción: el nivel «no cambia el precio o la comisión por sí solo» (`niveles-de-barberos.md`).
    Notion: niveles 2–4 con % y ascenso tras 90 días. Thema: `levelSchema = { id, name }`.
14. **Vacaciones: solicitar vs crear.** Los avisos de producción distinguen «un barbero solicita» y «un
    barbero de renta crea» (`notificaciones-del-calendario.md`), pero el calendario solo tiene «Crear
    bloqueo» (`vacaciones-de-un-barbero.md`). Thema tiene en el catálogo de avisos `vacationApproved` y
    `vacationDenied` (`notificationCatalog.ts:56`) sin flujo que los produzca.
15. **Recepción y cifras.** Matriz: «Indicadores clave de rendimiento empresariales» **Activo** para recepción.
    Notion: recepción sin métricas ni números. ROLES_PLAN ya toma Notion.
16. **El código de la persona.** «Para qué sirve el código y dónde se usa todavía no está documentado»
    (`codigo-de-un-barbero.md`); Notion propone un código por persona en recepción. Encajan si se decide
    que **es** ese PIN.
17. **Eliminar cuenta del barbero.** Producción lo muestra al comisión (`casos/configuracion.md`), pero el
    texto general dice «Elimina permanentemente tu cuenta y todos los datos asociados a tu negocio». Thema
    (`DeleteAccountSettings.tsx`) borra la empresa. Para un barbero no puede significar lo mismo.
18. **Agregar un dueño no manda correo** [N]; Thema crea en `invited` sin envío (`mocks/team/handlers.ts:150`).
19. **Una persona en dos barberías no ve la segunda** [N]. Thema no modela la empresa en la sesión: el menú
    de la cuenta solo cambia sucursales (`AppLayout.tsx:205`).
20. **Quién soy en Thema.** La sesión de demo («Carolina Vargas», `mocks/db.ts:86`) tiene `role: "admin"` del
    enum de plantilla y la cabecera la muestra como «Administrador»; en el seed del equipo la misma
    persona es **dueña** (`mocks/team/seed.ts:289`). Con `manager`, `AppHeader.tsx:66` cae en `roles[0]` y
    muestra «Owner». Además `role.owner` está en inglés en `es.ts:494` y `team.role.ownerShort` en `:697`;
    producción dice «Dueño» / «Propietario».
21. **ROLES_PLAN §3, fila Equipo del admin** («Gerentes, Niveles, Fila») se queda corta: la matriz le da también
    Equipo y Horas, y le quita solo «Ordenar barberos agendas» y «Sección de pagos».
22. **`types.ts` cita una sección que no existe.** `src/features/team/types.ts:6` remite a
    «docs/API_CONTRACT.md, Equipo», pero el contrato no tiene sección de Equipo y `/auth/me` sigue con
    `role: "admin" | "manager" | "member"` (`API_CONTRACT.md:51`).
23. **Transacciones y Front Desk no están en la matriz** (ROLES_PLAN §4.8): el menú de admin y recepción para
    Transacciones es `?`.

---

# 9. Cambios necesarios en Thema

En orden de dependencia. Cada uno nombra los archivos que toca.

1. **Un solo enum de rol.** El canónico es `TeamRole` (`src/features/team/types.ts:10`). Sustituir o mapear:
   `userRoleSchema` de `src/features/auth/types.ts:4` y de `src/features/users/types.ts:8`;
   `TeamRoleId` duplicado en `src/features/team/teamHome.tsx:24`; `HelpRole`
   (`src/lib/help/types.ts:9`, con `barbero` → los dos barberos); `NotificationAudience`
   (`src/features/settings/sections/notificationCatalog.ts:13`, `frontDesk` ↔ `recepcion`, `clients` aparte);
   `MockUserRole` y `ACCOUNTS` (`src/mocks/db.ts`); `RequireAuth` (`src/features/auth/RequireAuth.tsx`, prop
   `roles`); y `docs/API_CONTRACT.md` (Auth).
2. **La sesión sabe quién es.** `authUserSchema` gana `memberId`, `companyId`, `profiles: [{ id, memberId,
   role, branchIds }]` y `activeProfileId` (`src/features/auth/types.ts`); `GET /auth/me` los devuelve
   (`src/mocks/handlers.ts`). En `src/mocks/db.ts`, Carolina Vargas pasa a `owner` enlazada a `team-01` y se
   añaden cuentas de demo por rol enlazadas al seed (`mocks/team/seed.ts`: Mateo Herrera admin, Lucía Bernal
   recepción, Andrés Beltrán comisión, Paola Zuluaga renta). `isAlsoBarber` genera un segundo perfil
   `barbero-comision` para el dueño o admin que corta (producción los trata como perfiles separados).
3. **`useAccess()`** (nuevo, p. ej. `src/features/auth/access.ts`): rol efectivo, `memberId`, permisos
   (los de `member.permissions`, no los del rol), `scope: "all" | "own"`, `branchIds` permitidas y
   `can(row, column)`. Lo alimenta `AppLayout.tsx` y lo leen pantallas, rail y menú.
4. **Una sola matriz de fábrica.** Corregir `ROLE_DEFAULT_PERMISSIONS` en
   `src/features/team/permissionsCatalog.ts:106` según la matriz de producción (§8.1–8.2, en especial
   `block-calendar` cruzado) y borrar la copia de `src/mocks/team/seed.ts:171` (que importe la misma). Decidir
   si `barber-payments` es solo **A** (producción) o V/E [D: V/E, para separar «ver» de «cambiar» dinero].
5. **«Ver como» de verdad.** `AppLayout.tsx:84` (`viewRoleId`): persistirlo en `sessionStorage` (con
   try/catch), elegir una **persona de ejemplo** por rol (no solo un rol) y ofrecerlo solo al dueño (todos) y
   al admin (recepción y barberos). Separar en `AccountMenu.tsx` / `RoleMenu.tsx` «Tus perfiles» (cambio real,
   aterriza según §6.3) de «Ver como» (vista previa, con aviso «Viendo como X · Volver» en `AppHeader.tsx`).
   Quitar el `?? roles[0]` de `AppHeader.tsx:65-66`. `FeedbackHost` debe mandar el perfil efectivo
   (`AppLayout.tsx:312`).
6. **Menú por permisos.** `src/app/navigation.ts`: `permission: { row, column }` en cada nodo y
   `buildAppNavigation(t, access)` que filtra (reutilizando `visibleSections`, hoy sin uso). Sacar `docs`
   del menú de producto (flag interno). Añadir «Mi negocio» y «Lo que llevo» cuando existan. Lo mismo en
   `src/features/settings/settingsCatalog.ts` (cada ajuste con su permiso; barberos: Formato de hora y
   Eliminar cuenta).
7. **Guardas de ruta y aterrizaje.** `RequirePermission` (nuevo, junto a `RequireAuth.tsx`) envolviendo los
   grupos de `src/app/router.tsx` → `/403`; la ruta índice (`router.tsx:63`) va a `homeFor(role)` (§6.3).
8. **Equipo recortado.** `TeamHomePage.tsx`: leer de `useMembersQuery` y de la sucursal activa en vez de
   `teamHome.tsx` (datos fijos, todas las sucursales); filtrar `railActions` por `can()`; ocultar «Dueño» del
   reparto al admin; columnas de contacto fuera para comisión; renta redirige a
   `/usuarios/miembros/:memberId`. `CreateMemberDrawer.tsx`: solo roles por debajo del que crea.
   `MemberProfilePage.tsx`: pestañas por quién mira (`memberTabs(role)` hoy solo mira el rol del miembro),
   modo lectura para uno mismo, sin pestaña Permisos editable para sí, Compensación/Pagos bajo
   `barber-payments`, no inactivar al último dueño. `BarberOrderPage.tsx` solo dueño; `LineupPage.tsx`,
   `LevelsPage.tsx`, `WorkHoursPage.tsx` y `ActivateTeamDrawer.tsx` con sus filas y las sucursales del admin.
9. **El mock hace cumplir los permisos.** `src/mocks/team/handlers.ts`: 403 por permiso y por sucursal en
   POST/PATCH/DELETE de miembros, activación, niveles, orden y horarios; `GET /team/members` recorta campos
   (`code`, `payments.accountNumber`, `compensation`, contactos) según quién pide. Documentarlo en una sección
   **Equipo** de `docs/API_CONTRACT.md`.
10. **Sucursales reales.** `src/features/branches/branches.ts` deja de ser una constante: leer
    `/settings/lists/branches` (hoy la cabecera no ve una sucursal recién creada), filtrar por
    `access.branchIds`, añadir **Todas las sucursales** para dueño (y admin con más de una), recordar la
    elegida. Fichas de sucursal con Clientes, Equipo y Licencia (`BranchesSettings.tsx`).
11. **Fuera la plantilla de Usuarios.** Quitar `/usuarios/lista` (`router.tsx:100`, `lazyPages.ts:24`) y
    `src/features/users/` o redirigir a `/usuarios`; `CalendarPage.tsx:738` («Ver barbero») a
    `/usuarios/miembros/:id`; retirar `/users` de `src/mocks/handlers.ts`.
12. **Ajustes personales vs. de la empresa.** Formato de hora personal (hoy en `BusinessSettings.tsx`, de la
    empresa); `DeleteAccountSettings.tsx` borra el acceso propio para quien no es dueño; nueva sección
    «Permisos por rol» (dueño; admin para roles por debajo) reutilizando `forms/PermissionsForm.tsx`.
13. **Vacaciones con solicitud.** `src/features/calendar/timeOff/BlockForm.tsx` (antes `BlockDrawer.tsx`) y `calendarModel.ts:405`
    (`RULE_BOUND_ROLES` desde `useAccess`): la categoría `vacation` de un barbero por comisión nace como
    solicitud; el dueño o admin aprueba; los avisos ya existen en `notificationCatalog.ts`.
14. **Textos.** `src/app/i18n/es.ts:494` y `:697`: «Owner» → «Dueño»; etiqueta «Propietario» en la cabecera
    solo para el dueño [P].
15. **Al terminar:** `npm run codemap` (cambian rutas y exports) y `npm run check`/`verify`.

---

## Decisiones de producto que este documento propone

1. **Comisión ve al equipo sin contactos, código ni datos bancarios**, y su propia ficha en lectura (privacidad
   de Notion contra lo que hoy pasa en producción).
2. **Renta gana «Mi ficha»** (su lógica de renta y su cuenta bancaria, editable), crea vacaciones sin
   aprobación, edita sus precios y su horario; no ve a nadie más.
3. **Solo el dueño crea dueños y admins**; el admin gestiona roles por debajo y solo en sus sucursales; el
   dinero de los barberos (`barber-payments`) es del dueño salvo que lo delegue.
4. **Perfiles reales y «Ver como» separados**: el cambio de perfil aterriza según el rol; «Ver como» es una
   vista previa del dueño/admin con persona de ejemplo y aviso visible.
5. **Sucursales por `branchIds`**: cada quien ve solo las suyas; «Todas las sucursales» para el dueño (y el
   admin multi-sucursal); crear, borrar, moneda, zona horaria y licencia, solo dueño.
