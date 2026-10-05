# La plataforma según el rol

Investigación del 2026-10-03 para que Barberlytics cambie según quién entra: qué ve, qué no ve y
qué puede hacer cada rol en cada módulo. Cruza tres fuentes:

| Fuente | Qué aporta | Confianza |
|---|---|---|
| **Producción** (centro de ayuda: `centro-de-ayuda/casos/modelo-sucursales-roles-permisos.md` §5 y §6b, `content/es/roles-y-permisos/`, `content/es/empezar/`) | Cómo funciona hoy. Solo se vieron en pantalla **Dueño** y **Barbero por comisión**; del resto solo la matriz de permisos de fábrica. | Alta para Dueño y Comisión; media para el resto |
| **Notion** (BarberOS Logic Library, QA Priority Stack) | Hacia dónde va: modelo de negocio por barbería y por barbero (comisión / híbrido / renta), alertas por rol, privacidad. | Especificación, no producto |
| **Código del rediseño** (este repo) | Qué ya existe para engancharlo. | — |

Marcas: **[P]** visto en producción · **[M]** solo en la matriz de fábrica · **[N]** especificación de Notion · **[D]** decisión de diseño propuesta aquí (por confirmar).

## Mapa completo por módulo

Este documento es el resumen. El detalle —**cada acción de cada módulo** con su celda por rol, el permiso de
la matriz que la gobierna, la fuente y si ya existe en Thema— está en `docs/roles/`:

| Capítulo | Módulos | Acciones |
|---|---|---|
| [01 · Calendario](roles/01-calendario.md) | Vistas, filtros, crear/mover citas, ficha y cobro, venta rápida y sin cita, cobros, espera, bloqueos y vacaciones, cifras, reacomodo, IA | 138 |
| [02 · Métricas, caja y nómina](roles/02-metricas-caja-nomina.md) | Métricas/Inicio, Transacciones, Gastos, Nómina, «Lo que llevo» y «Mi negocio» | 145 |
| [03 · Clientes y catálogo](roles/03-clientes-catalogo.md) | Clientes, Servicios, Productos | 112 |
| [04 · Equipo, sucursales y cuenta](roles/04-equipo-sucursales-cuenta.md) | Equipo, Sucursales, Usuarios, Cuenta y perfiles, Navegación, menú y barra del celular, inicio por rol | 171 |
| [05 · Configuración](roles/05-configuracion.md) | Los 17 ajustes, matriz de permisos completa, reserva online, portal, Front Desk, avisos por rol | 126 |
| **Total** | | **692** |

## Hallazgos que atraviesan todos los módulos

1. **La matriz de Thema no coincide con la de producción** (`src/features/team/permissionsCatalog.ts:106-111` y
   `src/mocks/team/seed.ts`): «Bloquear calendario» está invertido entre comisión (Thema: completo; producción:
   solo ver) y renta (Thema: solo ver; producción: completo); Recepción no tiene «Configuraciones de la cuenta»;
   la descarga de clientes está repartida al revés; Transacciones y Front Desk no tienen fila. Hay que
   alinearla **antes** de usarla como fuente de permisos.
2. **Nada en Thema tiene guarda por rol**: ninguna de las 692 acciones mira quién entra, salvo las reglas de
   agenda del calendario.
3. **Recortar «lo suyo» exige ids, no nombres**: la sesión no tiene `memberId`; clientes y transacciones
   guardan el barbero como nombre; los ids de Métricas (`b4…`) no son los del equipo (`team-04…`) y Métricas no
   manda la sucursal; gastos no tienen dueño.
4. **El teléfono enmascarado es solo cosmético**: la API manda el número completo, el buscador encuentra por
   los dígitos y Editar lo muestra; el calendario ofrece llamar y WhatsApp aunque producción lo enmascare.
5. **El neto del barbero de renta no cuadra con producción**: Thema supone que cobra él directamente y no
   suma sus ventas; producción las resta de la renta. El formulario pide deducciones en % y el mock las aplica
   como monto fijo por cita.
6. **Avisos por rol mal repartidos**: el catálogo de Thema le da Churn y VIP al de renta (Notion: solo dueño)
   y no le da «en riesgo» al de comisión; faltan cliente por volver, no-show al barbero, concentración de
   ingresos y salida de un barbero.
7. **Privacidad entre colegas**: hoy el barbero por comisión ve correo, teléfono y cuenta bancaria del resto
   del equipo y edita los gastos de la sucursal.

## Decisiones de producto por cerrar

Agrupadas de todos los capítulos (cada una con su detalle y fuentes en el capítulo indicado):

| # | Decisión | Propuesta [D] | Cap. |
|---|---|---|---|
| 1 | ¿Qué es un «cliente suyo»? | Lo trajo él, lo prefiere, o tuvo cita con él en 12 meses; el de comisión ve solo los suyos por defecto y agenda a otros con un buscador que solo da el nombre | 03 |
| 2 | Propiedad del cliente (tienda / walk-in / barbero) | Solo el dueño la cambia; los clientes del de renta son privados | 03 |
| 3 | Recepción y las cifras | Cobra y ve el precio de cada cita; sin Métricas, sin totales de caja, sin valor de vida ni márgenes | 01, 02, 03 |
| 4 | ¿Quién bloquea la agenda y cómo se piden vacaciones? | Renta crea las suyas sin aprobación; comisión las solicita y aprueba dueño/admin (flujo nuevo) | 01, 04 |
| 5 | ¿Quién puede forzar (pisar cita, fuera de horario, columna de otro)? | Dueño, admin y recepción; los barberos nunca; el servidor lo comprueba | 01 |
| 6 | Gastos del barbero por comisión | Sale de Gastos | 02 |
| 7 | Neto del de renta: ¿quién recibe el dinero? | Definir con el equipo; la fórmula de producción resta las ventas de la renta | 02 |
| 8 | Transacciones: devolver un pago y reasignar crédito | Dueño y admin, con auditoría | 02 |
| 9 | Dinero y contrato (facturación, impuestos, moneda, licencia) | Solo el dueño edita; el admin lo ve y edita lo operativo de su sucursal | 05, 04 |
| 10 | Crear dueños y administradores | Solo el dueño; el admin gestiona los roles de debajo en sus sucursales | 04 |
| 11 | «Eliminar cuenta» | El dueño borra el negocio; el resto solo «eliminar mi usuario» | 05 |
| 12 | Precios | El dueño aprueba los del admin; comisión cobra el de su nivel; renta fija los suyos en «Mis servicios» | 03 |
| 13 | Perfiles reales vs «Ver como» | Cambiar de perfil lleva al inicio de ese rol; «Ver como» solo para dueño y admin, con aviso visible | 04 |
| 14 | Sucursales visibles | Cada persona ve solo las suyas; «Todas» para dueño y admin con varias | 04 |
| 15 | Privacidad entre colegas | El barbero ve al equipo sin contacto ni cuenta bancaria | 04 |
| 16 | Barra del celular | Por rol (ver cap. 04 §6.2); decidir si Thema la añade o mantiene el cajón | 04 |

---

## 1. Los cinco roles

| Rol | Id en el código | Qué es | Alcance |
|---|---|---|---|
| **Dueño** («Business», «Propietario») | `owner` | Acceso total. Elige el modelo de negocio, la compensación y los niveles; aprueba precios. Destinatario de las alertas de negocio. | Toda la empresa (todas sus sucursales) |
| **Administrador de la locación** | `admin` | «Todo lo necesario para gestionar una locación». Puede ser también barbero (interruptor «Esta persona es barbero»). | Su sucursal |
| **Recepción** | `recepcion` | «Registrar citas y hacer check in y check out». En Notion: calendario universal + cobro, **sin métricas ni números** [N]. | Su sucursal, sin cifras |
| **Barbero por comisión** | `barbero-comision` | Cobra un % por servicio según el tipo de cliente (o salario, o escala). | **Solo lo suyo** |
| **Barbero de renta** | `barbero-renta` | Alquila la silla: paga una renta fija (con deducciones por los clientes que le trae la barbería) y se queda con lo que factura. Opera como su propio negocio dentro de la barbería. | **Solo lo suyo, pero con vista de negocio** |

Lo que **no** son roles: «Gerentes» es una pestaña de Equipo; «Salario» y «Escala» son tipos de compensación
del barbero por comisión; «Híbrido» es un modelo de barbería [N].

**Perfiles múltiples** [P]: una persona puede tener varios perfiles (p. ej. «Dueño · Barbero por comisión») y
cambia desde el menú de la cuenta sin volver a entrar. Al pasar a barbero aterriza en Calendario; al volver a
dueño, en Inicio.

**Lo que ves depende de tres cosas** [P]: el perfil con el que entras, la sucursal elegida y tus permisos
(matriz Ver · Crear · Editar · Borrar · Activo, copiada del rol a la persona y personalizable por persona).
Quitar «Ver» oculta la sección del menú.

---

## 2. El barbero de renta: «los dos mundos, pero solo lo suyo»

Es el caso que más cambia y el que producción resuelve peor: hoy **no tiene Métricas, Nómina ni Transacciones**,
así que no ve sus propias ventas, su renta por pagar ni su pago neto (`guia-del-barbero-de-renta.md` admite que
nunca se entró con esa cuenta). Notion lo define como «su propio negocio dentro de la barbería» [N].

Propuesta [D] — el de renta ve **lo mismo que un dueño, recortado a él**:

| Mundo | Qué ve | Qué no ve |
|---|---|---|
| **Barbero** (su silla) | Su columna del calendario, sus citas, cobrar, bloquear su agenda y **crear** sus vacaciones (no las solicita) [P] | Columnas de otros barberos |
| **Negocio** (su silla como empresa) | **Mi negocio**: sus ventas (servicios + productos), propinas, renta fija, deducciones y **pago neto** del periodo —incluido el negativo, lo que le debe a la barbería—; sus transacciones; sus clientes; sus métricas (ocupación, retención, ticket) | Ventas, nómina y gastos de la barbería o de otros barberos; la renta de otros |
| **Clientes** | Solo los suyos (los que atendió o lo prefieren), con descarga de su lista [M] | Los de otros barberos. Sus propios datos de contacto no se exponen a otros [N] |
| **Precios** | Sus precios por servicio (en renta no aplica el precio de la tienda [N]) | Los precios de otros |

El **barbero por comisión** también ve solo lo suyo, pero sin el mundo de negocio: sus citas, sus clientes, sus
métricas de mérito (nivel y brecha al siguiente [N]) y **lo que lleva ganado** del periodo (comisiones + propinas),
sin renta ni deducciones.

---

## 3. Matriz módulo × rol (propuesta para el rediseño)

`Todo` = toda la sucursal · `Suyo` = recortado al barbero que entra · `—` = no aparece en el menú.

| Módulo | Dueño | Admin | Recepción | Comisión | Renta |
|---|---|---|---|---|---|
| **Inicio al entrar** | Métricas | Métricas | Calendario | Calendario [P] | Calendario |
| **Calendario: columnas** | Todo + filtro de equipo | Todo | Todo | Suyo [P] | Suyo [D] |
| **Calendario: citas** | Crear, mover, cobrar | Igual | Crear, check-in/out, cobrar [N] | Crear y cobrar las suyas [P]; con reglas de agenda | Crear y cobrar las suyas, sin reglas de la tienda |
| **Calendario: bloqueos** | Sí | Sí | Sí [M] | Solo ver [M] | Sí, y sus vacaciones sin aprobación [P] |
| **Calendario: cifras** («US$ cobrados de…», precios) | Sí | Sí | **No** [N] | Suyas | Suyas |
| **Métricas** | 5 pestañas, todo el equipo | Igual | — [N] | Negocio, Clientes, Barberos **con sus cifras**, sin filtro de barbero [P] | Suyas, como «Mi negocio» [D] |
| **Clientes** | Todo | Todo | Todo (sin borrar) [M] | Todo [P] → **Suyo por defecto** [D] | Suyo [D] |
| **Teléfonos** | Enmascarado [P] | Enmascarado | Enmascarado | Enmascarado | Enmascarado |
| **Servicios / Productos** | Editar | Editar | Productos solo ver [M] | — [P] | Sus precios [D] |
| **Transacciones** | Todo | Todo | Del día, sin totales [D] | — [P] | Suyas [D] |
| **Gastos** | Todo | Todo | — [M] | — [D] (hoy ve los de la sucursal: problema de privacidad) | Los suyos [D] |
| **Nómina** | Todo | Todo (QA lo pide [N]) | — | Su pago del periodo [D] | Su renta y pago neto [D] |
| **Equipo** | 4 pestañas | Gerentes, Niveles, Fila | — | Solo ver: Barberos, Niveles, Horas [P] | Su ficha [D] |
| **Configuración** | 17 ajustes | Los de la cuenta | Algunos [M] | Formato de hora + Eliminar cuenta [P] | Igual + sus datos bancarios [D] |
| **Alertas** [N] | Negocio: churn, VIP en riesgo, concentración, salida de un barbero | Coaching semanal | — | Sus clientes por volver, no-shows, en riesgo | Igual que comisión |

Las alertas de primera visita **no** se muestran al barbero de forma individual, para no culparlo [N].

---

## 4. Huecos y contradicciones a resolver

1. **Métricas del barbero por comisión**: la matriz dice «sin KPI», pero en pantalla ve 3 pestañas con sus cifras [P]. Las métricas personales no dependen de ese permiso.
2. **Crear cliente**: un artículo dice que solo dueño, admin y recepción ven el botón; la matriz da Crear al de comisión.
3. **Gastos del barbero por comisión**: hoy ve y puede editar los gastos de la sucursal (p. ej. la renta del local). Parece un error de privacidad.
4. **Recepción**: ¿puede cobrar? ¿ve el total del día?
5. **Administrador**: ¿ve otras sucursales? ¿ve compensación y nómina? (QA de Notion lo pide).
6. **Renta**: fórmula exacta de las deducciones (¿sobre qué monto?) y cómo se reparte la base según el ciclo.
7. **Clientes del barbero**: ¿todos los de la sucursal (producción) o solo los suyos?
8. La matriz no tiene filas para **Transacciones** ni **Front Desk**.

---

## 5. Estado del código y plan técnico

**Lo que ya hay** (informe del 2026-10-03):

- Roles de la barbería en `src/features/team/types.ts:10` (`owner`, `admin`, `recepcion`, `barbero-comision`, `barbero-renta`) y la matriz de permisos con valores por rol en `src/features/team/permissionsCatalog.ts` (`PERMISSION_BLOCKS`, `ROLE_DEFAULT_PERMISSIONS`, `visibleSections`, que nadie usa).
- Selector «Ver como» en el menú de la cuenta (`AccountMenu.tsx`, `AppLayout.tsx:84`), que no se guarda al recargar.
- Un solo consumidor del rol: las reglas de agenda del calendario (`followsAgendaRules`).
- Nómina ya modela renta y comisión (`payroll/types.ts`: `payout`, `rentBase`, `net` negativo).

**Lo que falta**:

- **Dos enums de rol que no se hablan**: la sesión usa `admin | manager | member` (`auth/types.ts:4`) y la barbería, los cinco roles. Con `manager` la cabecera muestra «Dueño» y las pantallas reciben `manager`.
- **«Quién soy»**: el usuario no tiene `memberId`, así que no hay forma de recortar a «lo suyo».
- **Menú, rutas y acciones** no miran el rol; `RequireAuth` admite roles pero no se usa.
- **Datos «suyos»**: clientes y transacciones guardan el barbero como nombre, no como id.

**Fases**:

1. **Acceso** — `role: TeamRole` + `memberId` en la sesión; un contexto `useAccess()` (rol efectivo, `memberId`, permisos, `scope: "all" | "own"`) alimentado desde `AppLayout`; «Ver como» guardado y con un barbero de ejemplo por rol para la demo. Un solo enum de rol.
2. **Navegación y rutas** — `permission` en cada nodo de `navigation.ts` y del catálogo de configuración; guarda `RequirePermission` → `/403`; inicio según el rol.
3. **Solo lo mío** — calendario fijo a su columna (sin filtro de equipo), métricas con `barberId = yo` y sin pestañas de negocio, clientes y transacciones con `barberId`, nómina con su fila.
4. **Mi negocio (renta)** y **Lo que llevo (comisión)** — una pantalla de resumen propia sobre los datos de nómina y transacciones.
5. **Acciones** — crear, editar, borrar y activar condicionados a la matriz; ocultar cifras a recepción.
6. **Ayuda** — el centro de ayuda documenta producción; lo que cambie aquí se documenta cuando llegue a producción.

---

## Estado de la implementación (2026-10-03)

Aplicadas las propuestas [D] de la tabla de decisiones, sobre `src/features/access` (`useAccess()`):

- **Base** — matriz de fábrica alineada con producción (`permissionsCatalog.ts` y el mock) + fila Transacciones;
  rol efectivo con «Ver como» guardado entre recargas (`viewAs.ts`); menú filtrado por área (`navigation.ts`);
  rutas con `RequireArea` → `/403`; cada rol aterriza en su inicio (`RoleHome`).
- **Calendario** (`calendarAccess.ts`) — barberos solo su columna en todas las vistas, sin forzar ni mover a la
  columna de otro; bloqueos por permiso; recepción sin totales; contacto solo con «Información del cliente».
- **Clientes y Transacciones** (`customerAccess.ts`, `transactionsAccess.ts`) — «cliente suyo» = lo prefiere o tuvo
  cita con él en 12 meses; acciones por matriz; sin contacto ni notas médicas sin permiso; recepción sin dinero;
  renta solo sus cuentas.
- **Métricas, «Lo que llevo» / «Mi negocio», Nómina, Gastos** — métricas fijas al barbero; `/mi-pago` con su pago
  (renta: neto negativo explicado); gastos con `ownerMemberId` (renta solo los suyos).
- **Equipo, Servicios, Productos, Configuración** (`teamAccess.ts`, `catalogAccess.ts`, `settingsCatalog.ts`) —
  acciones por permiso, privacidad entre colegas, solo el dueño crea dueños/admins, recepción solo consulta productos,
  configuración filtrada por rol («Mis preferencias», «Eliminar mi usuario», «Permisos por rol»).

**Pendiente**: la sesión no trae `teamRole` ni `memberId` (se traduce en `teamRoleFromSession` y se usa una persona de
ejemplo por rol en `DEMO_MEMBER`); el mock recorta en el cliente, no en el servidor (ni valida `force` por rol);
«Solicitar vacaciones» del barbero por comisión; «lo trajo él» (`ownerBarberId`); datos bancarios del de renta;
«Eliminar mi usuario» sin endpoint; las migas de pan siguen empezando en «Métricas» aunque el rol no lo abra.
