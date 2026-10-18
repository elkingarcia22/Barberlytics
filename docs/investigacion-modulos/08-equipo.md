# Equipo — investigación

Investigación del 2026-10-17 sobre el módulo de Equipo / Usuarios de Barberlytics (rutas `/usuarios*`; código en
`src/features/team`, `src/features/users`, `src/features/access`). Cruza el código del rediseño, `docs/ROLES_PLAN.md`,
`docs/roles/04-equipo-sucursales-cuenta.md`, las notas de proyecto y una revisión de competidores y de herramientas
de gestión de personal de otras industrias.

> **Sobre el mercado.** El código no confirma «Colombia como mercado principal» sin matices: el sistema está escrito
> en español con `es-CO` como locale de origen (`src/i18n/locales.ts:22`) y Configuración ofrece USD, COP, MXN y EUR
> (`src/features/settings/settingsTypes.ts:138`), pero la barbería de demostración tiene cuatro sucursales en EE. UU.
> (Massachusetts, North Carolina, Rhode Island, Utah), moneda USD y zona `America/New_York`
> (`src/mocks/settings/seed.ts:66-89`). La lectura más fiel es **barberías hispanohablantes en EE. UU. y LatAm**. Eso
> importa para este módulo: la renta de silla (booth rent) es un modelo muy estadounidense y el de comisión/salario,
> más latinoamericano; Barberlytics tiene que servir a los dos.

> **Límite de la investigación.** El presupuesto de búsquedas web se agotó a mitad del benchmark. Las celdas marcadas
> «?» no se pudieron verificar; Rippling y BambooHR quedaron sin revisar. No se inventan cifras: las que aparecen
> salen de las fuentes listadas al final.

## Resumen ejecutivo

1. Equipo tiene la **ficha más completa del producto** (perfil, servicios con precio por barbero, comisión por tipo de cliente, renta con deducciones, horario, permisos por persona, opciones) y un acceso por rol ya aplicado (`teamAccess.ts`).
2. Pero **el home de `/usuarios` no está conectado**: pulso, avisos y turnos sin cubrir salen de datos fijos (`teamHome.tsx`), con un segundo modelo de persona distinto al de la API y el dinero en USD fijo.
3. Las **filas de sin cita / sin preferencia se configuran pero nadie las lee**: la reserva asigna «sin preferencia» al primer barbero libre.
4. Faltan las piezas de **operación diaria** que sí tiene la competencia: fichaje, solicitud y aprobación de ausencias, turnos abiertos e intercambios.
5. Falta **rendimiento por barbero** (rebooking, retención, ticket medio) en la ficha, aunque los datos ya existen en citas, clientes y reseñas.
6. El 80 % de los barberos en EE. UU. trabaja por cuenta propia (BLS): el módulo debe tratar al barbero de renta como un negocio, no como un empleado.
7. La IA con más retorno no es la de RR. HH. corporativa sino la operativa: **agente de cobertura de ausencias, coaching semanal por barbero, turnos según demanda, matching para «sin preferencia» y lectura de reseñas**.

---

## 1. Qué tiene hoy

### Rutas y pantallas

| Ruta | Pantalla | Archivo | Qué hace |
|---|---|---|---|
| `/usuarios` | Home de equipo | `src/features/team/TeamHomePage.tsx` (515 líneas) + datos `teamHome.tsx` (660) | Reparto por rol (filtra la lista), pulso de 3 métricas con serie de 7 semanas, avisos por rol (renta vencida, silla parada < 50 %, caja sin cerrar, invitación pendiente, turnos de hoy sin cubrir), lista de personas y pestaña «Turnos» sin cubrir |
| `/usuarios/lista` | Lista de usuarios | `src/features/users/UsersPage.tsx` | Herencia de la plantilla: usuarios con rol `admin/manager/member` y campo «área» (`users/types.ts:8`), sin relación con los cinco roles de la barbería |
| `/usuarios/miembros/:id` | Ficha | `MemberProfilePage.tsx` + `MemberTabEditor.tsx` + `forms/*` | Pestañas según rol (`memberTabs`, `types.ts:238`): Perfil, Servicios, Compensación **o** Pagos (renta), Calendario, Permisos, Opciones; gerentes solo Perfil y Permisos. Editar por pestaña (`?editar=1`), activar/inactivar, borrar (el mock no deja borrar a un dueño, `handlers.ts:239`) |
| `/usuarios/nuevo` | Asistente de alta | `MemberWizardPage.tsx`, `CreateMemberDrawer.tsx`, `memberDraft.ts` | El rol se elige en un drawer de tarjetas; el asistente recorre las mismas pestañas de la ficha con `Stepper`, valida por paso y oculta Compensación/Pagos a quien no tiene `barber-payments`. Nace con `status: "invited"` |
| `/usuarios/horarios` | Horas de trabajo | `WorkHoursPage.tsx`, `EditShiftDrawer.tsx` | Semana de todo el equipo (`ShiftWeekGrid`); excepción por día (`PUT /team/schedule/override`), borrar turno, restaurar el fijo |
| `/usuarios/niveles` | Niveles | `LevelsPage.tsx` | CRUD de niveles con cuántos barberos hay en cada uno. El nivel es solo `{ id, name }` (`types.ts:19`); su efecto en precio vive únicamente en el mock (`src/mocks/team/pricing.ts`: Aprendiz 0,8 · Junior 0,9 · Senior 1 · Master 1,25) |
| `/usuarios/orden` | Ordenar barberos | `BarberOrderPage.tsx` | Orden de columnas del calendario (arrastrar o teclado), con pestaña por nivel |
| `/usuarios/fila` | Fila sin cita / sin preferencia | `LineupPage.tsx` | Dos listas (`walkIn`, `noPreference`): encender a quien toma esos clientes y ordenar |

### Modelo de datos (`src/features/team/types.ts`)

- **Persona** (`memberSchema`): nombre, contacto, rol (5), sucursal base y sucursales activas, estado (`active/invited/inactive`), foto, código, descripción, Instagram/Facebook, `bookingVisible`, nivel, habilidades, galería (máx. 5, `ProfileForm.tsx:32`), `isAlsoBarber`, servicios con precio/precio nuevo/lealtad/duración/comisión dividida/extra, compensación, pagos, horario semanal, permisos y opciones.
- **Compensación**: `commission | scale | salary`; % básico, recurrente, sin cita, sin preferencia, cliente nuevo, producto; salario; escala por tramos.
- **Pagos (renta)**: renta base + deducciones por cliente sin cita, nuevo y sin preferencia; banco y número de cuenta.
- **Opciones**: propinas, varias citas, acepta clientes nuevos, cancelación por el cliente (canales y antelación), intervalo, recordatorios, redes, enlace.
- **Horario**: **una sola franja por día** (`weekScheduleSchema`); el almuerzo y las ausencias van como bloqueos del calendario (`calendar/types.ts:120`: `sick, vacation, holiday, lunch, meeting, business, personal`).

### Acceso por rol

- `src/features/access/access.ts`: rol efectivo, `memberId` de ejemplo por rol (`DEMO_MEMBER`), `can(área, columna)`, «Ver como» persistido (`viewAs.ts`).
- `src/features/team/teamAccess.ts`: quién gestiona a quién (`managesRole`), qué roles puede crear (`creatableRoles`: solo el dueño crea dueños y admins), `seesBarberMoney`, `seesManagers`, `memberAccess` (pestañas y edición por ficha). Pruebas en `teamAccess.test.tsx`.
- Matriz de permisos con valores de fábrica por rol en `permissionsCatalog.ts`, ya alineada con producción según `ROLES_PLAN.md` (estado del 2026-10-03).

### Lo que alimenta a otros módulos

Nómina (`/nomina`, `/mi-pago`) calcula sobre la compensación y los pagos de la ficha; el calendario usa el orden de
columnas (`src/mocks/calendar/handlers.ts:90`) y el horario; la reserva en línea usa `bookingVisible`, precios por
barbero y reseñas por barbero (`booking/types.ts:227`, `GET /barbers/:id/reviews`); Métricas › Barberos da neto,
servicios, ocupación, tasa de cancelación y de propinas por barbero (`metrics/types.ts:87-106`).

---

## 2. Análisis del módulo

### Fortalezas

- **Modelo de compensación rico y realista**: comisión distinta según de dónde viene el cliente (recurrente, sin cita, sin preferencia, nuevo) y deducciones de renta por los clientes que trae la barbería. Pocos competidores generalistas lo modelan; Squire y Mangomint sí cubren renteros, pero no se encontró en ellos esta granularidad por origen del cliente.
- **Una ficha, dos usos**: el asistente de alta reutiliza las pestañas de la ficha, así que no hay dos formularios que diverjan.
- **Precio y duración por barbero y por servicio**, que es lo que separa una barbería de un salón genérico (el Master cobra más).
- **Permisos por persona sobre una matriz de fábrica** con «restaurar los del rol», y guardas por rol ya aplicadas (comisión ve al equipo sin contactos ni dinero; admin no ve al dueño).
- **Avisos pensados por rol**: la renta vencida solo le aplica al rentero; la caja, a quien cobra. Evita ruido.
- **Excepciones de turno por día** sin tocar el horario fijo.

### Huecos funcionales

| Hueco | Evidencia |
|---|---|
| Home sin datos reales | `TEAM_MEMBERS`, `OPEN_SHIFTS` y `HISTORY` son constantes (`teamHome.tsx:156, 363, 404`); la API solo aporta las fotos (`TeamHomePage.tsx:193`) |
| Turnos sin cubrir son decorado | El botón «Asignar» no tiene acción (`TeamHomePage.tsx:493`) |
| Acciones sin efecto | «Cargar miembros», «Recordar invitación» y «Desactivar» (en lote) no tienen `onSelect` (`TeamHomePage.tsx:88, 92, 93`) |
| La fila no se usa | Ni el calendario ni la reserva leen `walkIn`/`noPreference`; la reserva «sin preferencia» toma el primer barbero libre de `bookableBarbers` (`src/mocks/booking/handlers.ts:196-198`, `logic.ts:54`). Nadie ve «a quién le toca» (EQ-81) |
| Sin ausencias como flujo | Hay bloqueo `vacation`, pero no solicitud → aprobación → aviso → saldo (EQ-85 a EQ-88) |
| Sin fichaje | No existe nada de asistencia ni timesheets en `src/` |
| Sin «Mi ficha» | La sesión no trae `memberId` real (pendiente en `ROLES_PLAN.md`); el barbero no edita su foto, galería ni horario (EQ-27, 39, 47) |
| Niveles sin reglas | Sin % por nivel, criterios de ascenso ni brecha al siguiente (EQ-68 a EQ-70) |
| Cambio de modelo | Pasar de comisión a renta exige crear a la persona de nuevo (EQ-60) |
| Rendimiento por barbero | La ficha no tiene pestaña de rendimiento; Métricas no da rebooking, retención ni ticket por barbero |
| Turnos partidos | Una franja por día obliga a usar bloqueos para cortes de mediodía |
| Invitación | `status: "invited"` sin envío ni reenvío (EQ-24/25) |

### Deuda técnica

- **Dos tipos `TeamMember`** con el mismo nombre: el de `teamHome.tsx:91` (vista del home, con `occupancy`, `payout`…) y el de `types.ts:113` (contrato de la API). Al conectar el home habrá que derivar el primero del segundo y de Métricas.
- **Moneda fija** en el home: `currency: "USD"` (`TeamHomePage.tsx:128`) en vez de la moneda de la sucursal (`useMoney` existe en `calendar/calendarFormat`).
- **`/usuarios/lista` es un residuo** de la plantilla con el enum `admin|manager|member`; convive con el enum de cinco roles (hallazgo ya señalado en `ROLES_PLAN.md`). Confunde y queda bajo la guarda `team`.
- **El recorte es en cliente**: el mock no aplica permisos en el servidor (pendiente en `ROLES_PLAN.md`).
- **Datos bancarios** se muestran en claro en la ficha (`PaymentsForm.tsx:50-77`); deberían enmascararse y gobernarse por `barber-payments`.
- **Nivel → precio** vive solo en el mock; el contrato no lo expresa.
- **Validación de comisión** 1–100 % en el mock frente al rango 40–65 % que define Notion (EQ-101).

### UX

- El home mezcla dos preguntas —«quién es quién» (lista) y «cómo va la gente» (pulso)— y resuelve bien el cambio de lectura según el rol filtrado. Pero el pulso de un dueño («equipo activo %», «turnos sin cubrir») hoy es inventado, y un número falso en la primera pantalla resta confianza al resto.
- Las cuatro subpantallas de configuración (orden, fila, niveles, horarios) están bien plegadas en «más acciones»; se tocan al montar la barbería.
- La ficha es densa para el barbero: seis pestañas sin una vista «cómo voy». El barbero por comisión, que es quien más abre su propia ficha, no encuentra ahí lo que le importa (lo que lleva ganado está en `/mi-pago`).
- El 375 px y la barra flotante ya siguen el patrón del sistema; no se detectaron problemas de maquetación en esta revisión (no se abrió el navegador).

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S (< 1 semana) · M (1–3) · L (> 3).

| P | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| **P0** | Conectar el home a la API (personas, ocupación y retención desde citas, turnos sin cubrir desde horario + ausencias), moneda de la sucursal, acciones sin efecto resueltas o retiradas | Es la puerta del módulo y hoy enseña datos fijos | A | M |
| **P0** | **Ausencias y vacaciones**: solicitud (comisión) → aprobación (dueño/admin) → bloqueo en calendario + aviso; renta las crea sin aprobación (decisión #4 de `ROLES_PLAN.md`); saldo de días opcional; ver citas afectadas antes de aprobar | Square, Vagaro, Booksy y Homebase lo tienen; el aviso `vacationRequested` ya existe en el catálogo | A | M |
| **P0** | **Fila viva**: que la reserva y el walk-in usen `noPreference`/`walkIn`, con rotación «a quién le toca» visible en calendario/Front Desk y saltar a quien está ocupado | La pantalla existe pero no gobierna nada; la equidad en el reparto es una fuente clásica de conflicto | A | M |
| **P0** | **Pestaña «Rendimiento» en la ficha** y columnas en la lista: ocupación, rebooking al cobrar, retención a 90 días, ticket medio, % producto, propinas, no-shows, valoración media | Zenoti, Mangomint, Phorest y Boulevard lo dan por profesional; los datos ya están en citas y reseñas | A | M |
| **P0** | **«Mi ficha»** con `memberId` real en la sesión: el barbero edita su foto, galería, descripción y opciones; el rentero, también su horario y su visibilidad | Prerrequisito de todo autoservicio; la vitrina de la reserva depende de ello | A | M |
| **P0** | Higiene: enmascarar datos bancarios, retirar o fusionar `/usuarios/lista`, un solo enum de rol, recorte en servidor | Privacidad entre colegas y coherencia | A | S–M |
| P1 | **Fichaje** con PIN desde la tablet del Front Desk (y foto/ubicación opcional), sobre todo para salario y recepción; comparar con turno y primera cita | Fresha, Square, Mangomint, Squire, Homebase, Connecteam lo tienen; la nómina por salario lo necesita | M | M |
| P1 | **Turnos abiertos e intercambio** con aprobación (lo que hoy es la pestaña «Turnos») | Square, When I Work y Legion lo resuelven en el móvil | M | M |
| P1 | **Metas por barbero** (servicios, rebooking, producto) y **niveles con criterios** (% por nivel, ascenso a los 90 días, brecha al siguiente) | Phorest Staff Goals; Notion pide la brecha al siguiente nivel (EQ-70) | A | M |
| P1 | **Checklist de onboarding** para que un barbero nuevo quede reservable (foto, servicios, horario, visibilidad, invitación aceptada) | Barato y quita el estado «a medio crear» | M | S |
| P1 | **Cambio de modelo** comisión ↔ renta con fecha efectiva e historial | Hoy obliga a recrear a la persona (EQ-60) | M | M |
| P1 | **Estado de cuenta de la renta** y cobro (recordatorio, marcar pagado; más tarde, cobro automático) | Squire «Rent Collect» y Vagaro «collect rent»; el aviso de renta vencida ya existe | A | L |
| P1 | Invitación real (envío, reenvío, caducidad) y **carga masiva por CSV** | Botones ya presentes sin acción | M | S–M |
| P1 | **Turnos partidos** (varias franjas por día) | Cortes de mediodía sin recurrir a bloqueos | B | S–M |
| P2 | **Portafolio** ligado a servicios (cada foto etiquetada con el corte), publicable en la reserva, enlace a Instagram | Hoy son 5 fotos sueltas | M | S–M |
| P2 | **Formación y certificaciones**: cursos, vencimientos, habilidades verificadas que habilitan servicios | Connecteam y Buk lo cubren; útil para Aprendiz → Junior | M | M |
| P2 | **Documentos y firma**: contrato, acuerdo de renta de silla, identificación, licencias | Buk y Connecteam con firma electrónica | M | M–L |
| P2 | Ranking/reconocimiento opcional (con cuidado de no premiar solo facturación) | Squire leaderboard, Phorest retos | B | S |
| P2 | Exportación a nómina externa (y, si el mercado colombiano pesa, a un proveedor de nómina electrónica; a validar) | Square, Fresha y Vagaro integran nómina | M | L |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (según la fuente) · parcial · ✗ no lo tiene · ? no verificado en esta investigación.

### Software de barberías y belleza

| Función | Barberlytics (rediseño) | Fresha | Booksy | Square | Vagaro | Mangomint | Phorest | Zenoti | GlossGenius | Squire | Boulevard |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Fichaje / reloj | ✗ | ✓ (con proximidad) | ? | ✓ | ✓ | ✓ (PIN) | ? | ? | ✓ (time tracking) | ✓ | ? |
| Horario fijo + excepciones | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ? | ? | ✓ | ? |
| Solicitud de ausencias | ✗ (solo bloqueo) | ? | ✓ (annual leave) | ✓ (Shifts Plus) | ✓ | parcial (override) | ? | ? | ? | ? | ? |
| Turnos abiertos / intercambio | parcial (maqueta) | ? | ? | ✓ (con aprobación) | ? | ? | ? | ? | ? | ? | ? |
| Comisión escalonada | ✓ (+ por origen del cliente) | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ? | ✓ | ✓ | ? |
| Renta de silla | parcial (cálculo, sin cobro) | ? | ? | ? | ✓ (cobra renta) | ✓ (renteros en la cuenta) | ? | ? | ✓ (pagos a renteros) | ✓ (Rent Collect) | ? |
| Nómina / pagos al equipo | parcial (calcula) | ✓ (pay runs) | ? | ✓ (Payroll) | ✓ | ✓ (depósito) | ? | ? | ✓ | ✓ (payouts semanales) | ? |
| Permisos por persona | ✓ | ? | ✓ | ? | ✓ | ✓ | ? | ? | ✓ (roles + custom) | ✓ | ? |
| Rendimiento por profesional | parcial (Métricas › Barberos) | parcial (comisiones) | ✓ (informes) | ? | ✓ | ✓ (utilización, prebooking, retención) | ✓ | ✓ (utilización por franja, comparación con pares) | ✓ (team reporting) | ✓ | ✓ |
| Rebooking por profesional | ✗ | ? | ? | ? | ? | ✓ | ? | ✓ | ? | ? | ✓ (blog) |
| Metas por persona | ✗ | ? | ? | ? | ✗ (no encontrado) | ? | ✓ (Staff Goals) | ? | ? | ? | ? |
| El profesional ve sus cifras en el móvil | parcial (`/mi-pago`) | ? | ? | ✓ (pago estimado) | ? | ? | ✓ (PhorestGo) | ✓ (Toni&Guy) | ? | ✓ (leaderboard) | ? |
| Satisfacción por profesional | parcial (reseñas en la reserva) | ? | ? | ? | ? | ? | ✓ (valoración media) | ✓ (motivos) | ? | ? | ? |
| Niveles con precio | parcial (solo mock) | ? | ? | ? | ? | ✓ (precio por persona) | ? | ? | ? | ? | ? |

### Gestión de personal fuera del vertical

| Función | 7shifts | Deputy | Legion | Homebase | When I Work | Connecteam | Buk (LatAm) | Lattice | Workday | Visier |
|---|---|---|---|---|---|---|---|---|---|---|
| Fichaje | ? | ? | ? | ✓ (PIN, foto, GPS, geocerca) | ✓ | ✓ (ubicación) | ✓ (asistencia) | — | — | — |
| Ausencias | ? | ? | ? | ✓ (fechas bloqueadas, límites) | ✓ | ✓ | ✓ (vacaciones, permisos) | — | ? | — |
| Intercambio / turnos abiertos | ? | ? | ✓ | ✗ (no en la página) | ✓ | ? | ? | — | — | — |
| Turnos con IA según demanda | ✓ (pronóstico por hora desde el POS) | ✓ | ✓ | ? | parcial (autoasignación por disponibilidad) | ✓ (IA genera horario) | ? | — | — | — |
| Onboarding / formación | ? | ? | ? | ? | ? | ✓ | ✓ | — | ✓ (aprendizaje) | — |
| Documentos / firma | ? | ? | ? | ? | ? | ✓ | ✓ | — | ? | — |
| Desempeño / coaching con IA | — | — | — | — | — | ? | ✓ (evaluaciones) | ✓ (agente, borradores de revisión) | ✓ (Sana Coach) | — |
| Riesgo de rotación | — | — | — | — | — | — | ✓ (predicción de rotación) | ? | parcial («retention» en insights) | ✓ («flags who's at risk») |

### Hallazgos

1. **La paridad de mercado en belleza ya incluye fichaje, ausencias y nómina**: Fresha, Square, Vagaro, Mangomint, GlossGenius y Squire los ofrecen. Barberlytics compite hoy con una ficha mejor pero sin la operación diaria.
2. **Squire es el referente directo de barberías** y su diferencial está en el dinero del barbero: cobro automático de la renta, pagos semanales y leaderboard. Squire describe el mercado como renta de US$ 200–300 por semana frente a comisión del 40–60 % (Contrary Research).
3. **Mangomint muestra cómo tratar al rentero dentro de la misma cuenta**: sus propios enlaces de reserva, clientes, productos y cuentas de pago. Es lo que `ROLES_PLAN.md` llama «los dos mundos, pero solo lo suyo».
4. **El rendimiento por profesional es estándar en el segmento alto** (Zenoti, Phorest, Mangomint, Boulevard): utilización, prebooking/rebooking, retención por profesional y satisfacción. Phorest además pone las cifras en el móvil del profesional y deja que se fije metas propias.
5. **Fuera del vertical, la IA ya es producto en turnos** (7shifts, Deputy, Legion, Connecteam), pero todos parten de demanda histórica del POS o de ventas; Barberlytics tiene algo mejor: la agenda de citas futuras.
6. **En LatAm, Buk cubre RR. HH. completo** (asistencia, vacaciones, nómina, desempeño, onboarding, firma) en Chile, Colombia, Perú, México y Brasil, con IA para predicción de rotación. Barberlytics no debería competir con un HRIS: debe cubrir lo que la barbería necesita en el piso y exportar lo demás.

---

## 5. Mercado y tendencias

- **La mayoría de los barberos trabaja por cuenta propia.** En EE. UU., alrededor del 80 % de los barberos y el 48 % de peluqueros y cosmetólogos son autónomos (BLS, Occupational Outlook Handbook). Para Barberlytics, el barbero de renta no es un caso de borde: en muchas barberías es la mayoría. Sus funciones deben ser de autoservicio (su horario, sus precios, su negocio) y no de control.
- **Renta de silla frente a comisión.** Según el resumen de Squire en Contrary Research, el rentero paga en torno a US$ 200–300 por semana, maneja su horario y se queda con lo que factura; el de comisión reparte un 40–60 % y tiene horario más rígido. El producto tiene que permitir **cambiar de modelo con fecha efectiva** (hoy no se puede) y mostrar a cada uno su cuenta: el rentero, lo que debe; el de comisión, lo que lleva.
- **Riesgo legal de clasificación (a validar con asesoría).** Fichar, imponer turnos o aprobar las vacaciones de un rentero puede leerse como relación laboral. Las funciones de control (fichaje, aprobación) deberían aplicarse a empleados (comisión con salario, recepción, admin) y ser opcionales o informativas para renteros.
- **Retención de clientes como medida del barbero.** Boulevard cita una retención media de salones de ~45 % y de ~70 % en los de alto rendimiento (informe 2023), y que el cliente que reserva su primera visita en línea vuelve cerca del doble que el walk-in. La retención por barbero es la métrica que separa a un buen barbero de uno ocupado.
- **Mercado de talento.** BLS proyecta un crecimiento del 3 % para barberos (2025–35) y unas 80.300 vacantes anuales en el conjunto de barberos y estilistas, muchas por reposición; mediana de US$ 18,37/hora para barberos (mayo 2025). Con poco crecimiento y mucha rotación, **retener al barbero bueno** pesa más que contratar. Las herramientas que lo apoyan son transparencia de lo ganado (Square muestra el pago estimado; Squire paga cada semana), metas propias (Phorest) y reconocimiento (leaderboard de Squire).
- **El profesional como usuario.** La tendencia en Phorest, Square y Squire es que el barbero tenga **su** app con sus cifras, su agenda y sus ganancias. En Barberlytics esto pasa por «Mi ficha» + `/mi-pago` + rendimiento.
- **IA de personal: de informes a agentes.** Lattice ofrece un agente que da coaching y redacta borradores de evaluación; Buk anuncia agentes de RR. HH. y predicción de rotación; Visier promete «IA que señala quién está en riesgo y por qué». En el segmento de barberías no se encontró todavía IA aplicada al equipo: hay espacio para diferenciarse.

---

## 6. IA

### Datos disponibles en Barberlytics

Citas con barbero, barbero pedido (`requestedBarberId`), origen (`online/internal/walkin`), estado, cobro y propina;
clientes con barbero preferido (`preferredBarberId`) e historial; horario, excepciones y bloqueos con categoría
(`sick`, `vacation`…); servicios y precio por barbero; nivel y habilidades; reseñas por barbero con comentario
(`barberReviewSchema`); lista de espera; huecos y reacomodo del calendario (`gapsModel.ts`, `reflowModel.ts`);
compensación y nómina. **No hay**: fichajes, solicitudes de ausencia, historial de cambios de rol ni encuestas al
equipo.

### Casos

| Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos (¿los tenemos?) | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|
| **Turnos según demanda prevista** | Pronostica la demanda por franja y propone un horario que la cubra respetando disponibilidad y reglas | 7shifts (pronóstico por hora desde el POS), Deputy (demanda + auto-scheduling), Legion (Blink Fitness, SoulCycle), Connecteam | Sugerir qué horas abrir sillas: más barberos el sábado por la mañana, menos el martes temprano; para renteros, solo «estas son tus horas de más demanda» | Sí: citas pasadas y futuras, walk-ins, lista de espera, huecos. Falta disponibilidad declarada por el barbero | Predictiva + optimización | M | Tratar al rentero como empleado; sobreajuste con pocas semanas de historia (Deputy y 7shifts piden semanas de datos) |
| **Predicción de rotación** | Señala quién tiene riesgo de irse y por qué | Visier, Buk («predicción de rotación»), Workday (Sana Coach: retención) | Aviso solo al dueño: ocupación cayendo, más bloqueos personales, menos actividad, clientes fieles que pasan a otro barbero, renta vencida | Parcial: ocupación, bloqueos, actividad, clientes por barbero. Falta historia de salidas para entrenar | Predictiva | L | Ética y privacidad; profecía autocumplida; con pocas personas por barbería, un modelo estadístico no aprende: mejor reglas explicables |
| **Coaching de desempeño** | Resume el rendimiento y propone acciones concretas | Lattice (agente de coaching, borradores de revisión), Phorest (metas, sin IA declarada) | Nota semanal por barbero: «tu rebooking bajó del 62 % al 48 %; el 70 % de tus clientes nuevos no reservó al salir; prueba ofrecer la próxima cita al cobrar». Coaching semanal del admin (EQ-95) | Sí (cuando exista la pestaña de rendimiento) | Generativa | M | Culpar al barbero por factores de la tienda; Notion pide no mostrarle las alertas de primera visita |
| **Análisis de reseñas por empleado** | Agrupa y resume lo que dicen los clientes de cada profesional | Zenoti (motivos de satisfacción e insatisfacción), Phorest (valoración media por profesional) | «A Andrés lo elogian por el degradado y le critican la puntualidad»; temas para formación; mejores frases para su vitrina | Sí: reseñas con comentario por barbero en la reserva | Generativa (NLP) | S–M | Pocas reseñas = conclusiones frágiles; exponer críticas a colegas |
| **Matching cliente ↔ barbero** | Elige el mejor barbero para quien no tiene preferencia | No se encontró un ejemplo verificado en esta investigación | Para «sin preferencia» y walk-ins: combinar la fila, el servicio pedido, habilidades, nivel, historial del cliente y ocupación; explicar la elección | Sí: fila, habilidades, nivel, `preferredBarberId`, historial, reseñas | Predictiva / reglas | M | Romper la equidad de la fila; al rentero le descuentan por los clientes que le asigna la tienda (deducciones), así que la asignación es dinero |
| **Asistente de onboarding** | Guía al nuevo y responde dudas | Buk (cursos generados, soporte 24/7, agentes), Connecteam (formación) | Clipper explica al barbero nuevo cómo cobrar, bloquear su agenda o ver lo que lleva, y le recuerda los pasos pendientes para quedar reservable | Sí: centro de ayuda (`src/help`) y chat (`src/lib/chat`) | Conversacional | S | Respuestas de producción frente al rediseño (la ayuda documenta producción) |
| **Detección de sobrecarga** | Avisa de jornadas sin descanso o semanas excesivas | Workday (Sana Coach menciona «team sentiment»); no se encontró un caso de belleza verificado | Reglas: más de N horas seguidas con citas, almuerzo saltado, días seguidos sin libre, citas forzadas fuera de horario | Sí: citas, bloqueos de almuerzo, forzados | Predictiva (reglas) | S | Paternalismo con renteros; falsos positivos en temporada alta |
| **Agente de cobertura de ausencias** | Ante una baja, reparte o reprograma las citas afectadas y avisa | Patrón agéntico; no se encontró un competidor que lo anuncie | «Nicolás se reportó enfermo»: el agente lista sus 9 citas, propone a quién pasar cada una (servicio, nivel, precio, preferencia del cliente), redacta los mensajes y pide confirmación | Sí: reacomodo y huecos del calendario, precios por barbero, preferencias | Agéntica | M–L | Cambiar precio o barbero sin consentimiento del cliente; siempre con confirmación humana |

### Top 5 apuestas

1. **Agente de cobertura de ausencias.** Une la P0 de ausencias con el reacomodo que ya existe en el calendario. Resuelve el peor momento operativo de una barbería, ningún competidor revisado lo anuncia y no necesita modelo propio: reglas + LLM para redactar y explicar, con confirmación humana.
2. **Coaching semanal por barbero.** Sobre la pestaña de rendimiento: tres cifras, una comparación con su propia historia y una acción. Es la versión barbería de Lattice, alineada con la tendencia de que el profesional vea sus números (Phorest, Square). Retiene talento sin coste de nómina.
3. **Matching para «sin preferencia» y walk-ins.** Convierte la fila de `/usuarios/fila` en una decisión explicable («le toca a Valeria: hace degradados, está libre y es su turno»). Diferencial claro y con datos ya disponibles.
4. **Lectura de reseñas por barbero.** Barata (S–M), alimenta coaching y formación, y mejora la vitrina de la reserva con frases reales.
5. **Horas sugeridas según demanda.** Empezar con un mapa de calor de demanda frente a sillas abiertas y una sugerencia por semana; el autohorario completo solo para empleados y cuando haya historia suficiente.

La predicción de rotación queda fuera del top 5: con 4–10 barberos por sucursal no hay volumen para aprender, y el
riesgo ético es alto. Mejor reglas explicables dentro del coaching y de los avisos del dueño.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Cimientos (0–6 semanas)

- `memberId` y `teamRole` reales en la sesión; un solo enum de rol; recorte de permisos en el servidor del mock.
- Home de equipo sobre la API (personas, ocupación, retención, turnos sin cubrir derivados) y moneda de la sucursal; resolver o quitar «Cargar miembros», «Recordar invitación», «Desactivar» en lote y «Asignar».
- Retirar o fusionar `/usuarios/lista`; enmascarar datos bancarios.
- **Ausencias**: solicitud, aprobación, bloqueo y aviso; renteros sin aprobación.
- **Fila viva** consumida por la reserva y el walk-in, con «a quién le toca».
- **Pestaña Rendimiento v1** (ocupación, rebooking, retención 90 días, ticket medio, % producto, propinas, no-shows, valoración).
- «Mi ficha» con autoservicio de foto, galería, descripción y opciones.

### Fase 2 — Operación (6–14 semanas)

- Fichaje con PIN en la tablet del Front Desk para empleados; comparación con turno.
- Turnos abiertos e intercambio con aprobación; turnos partidos.
- Metas por barbero; niveles con % y criterios de ascenso; brecha al siguiente nivel.
- Checklist de onboarding; invitación real; carga por CSV.
- Cambio de modelo comisión ↔ renta con fecha efectiva.
- Estado de cuenta de la renta (recordatorios, marcar pagado).

### Fase 3 — Inteligencia (14+ semanas)

- Agente de cobertura de ausencias.
- Coaching semanal generado para cada barbero y resumen para el admin.
- Matching para «sin preferencia» y walk-ins.
- Análisis de reseñas por barbero.
- Mapa de demanda y horas sugeridas; autohorario para empleados.
- Portafolio ligado a servicios; formación y certificaciones; documentos con firma (o integración con un HRIS como Buk en LatAm).

---

## Fuentes

Código y documentos del repo: `ai-tools/CODEMAP.md`, `docs/ROLES_PLAN.md`, `docs/roles/04-equipo-sucursales-cuenta.md`,
`src/features/team/*`, `src/features/users/*`, `src/features/access/*`, `src/mocks/team/*`, `src/mocks/booking/*`,
`src/features/metrics/types.ts`, `src/mocks/settings/seed.ts`, `src/i18n/locales.ts`; notas de memoria
`project-roles-plataforma.md`, `project-front-desk.md`, `project-modulo-nomina.md`.

Web (leídas directamente):

- https://www.bls.gov/ooh/personal-care-and-service/barbers-hairstylists-and-cosmetologists.htm
- https://research.contrary.com/company/squire
- https://www.joinblvd.com/blog/client-retention-formula
- https://mangomint.com/features/staff-management
- https://www.fresha.com/help-center/knowledge-base/team/291-set-up-wages-for-team-members
- https://www.vagaro.com/en-gb/pro/employee-management-software
- https://joinhomebase.com/time-clock
- https://wheniwork.com/features
- https://connecteam.com/
- https://www.buk.co/
- https://legion.co/
- https://deputy.com/us/features/demand-forecasting
- https://lattice.com/ai
- https://www.workday.com/en-us/products/talent-management.html
- https://www.visier.com/

Web (consultadas a través de resultados de búsqueda):

- https://www.fresha.com/help-center/academy/pay-your-team/track-team-working-hours/lessons/100277
- https://www.fresha.com/help-center/academy/pay-your-team/track-team-commissions/lessons/100273
- https://biz.booksy.com/en-gb/who-loves-us/tanning
- https://www.getapp.com/all-software/a/booksy/
- https://www.softwareadvice.com/barbershop/booksy-profile/
- https://squareup.com/us/en/staff/shifts/features
- https://squareup.com/help/us/en/article/5742
- https://smallbiztrends.com/2020/12/square-launches-shift-scheduling.html
- https://getsquire.com/compare/squire-vs-vagaro
- https://www.getapp.com/barbershop-software/a/squire
- https://www.cardfellow.com/blog/vagaro-review-health-and-beauty-business-software
- https://www.mangomint.com/learn/business-intelligence-appointments-report/
- https://www.mangomint.com/learn/help-articles/staff-members/time-clock.md
- https://hji.co.uk/phorest-launches-tool-to-boost-salon-results-ahead-of-reopening
- https://irishbeauty.ie/Monitor-staff-performance-with-Phorests-new-tool.html
- https://phorest.helpjuice.com/305680-staff-performance-overview
- https://www.softwareadvice.com/retail/phorest-profile/
- https://www.salontoday.com/articles/the-3-must-have-weekly-salon-reports-you-should-be-reading
- https://help.zenoti.com/en/analytics/analytics-express/appointment-insights-dashboard.html
- https://help.zenoti.com/en/analytics/analytics-express/overview-of-analytics-express.html
- https://www.zenoti.com/resources/toni-guy-nz
- https://go.zenoti.com/_pdf/Zenoti_Analytics Express Datasheet.pdf
- https://glossgenius.com/overview
- https://glossgenius.com/blog/multi-user-salon-booking-software-your-team-will-love
- https://www.salontoday.com/news/glossgenius-debuts-product-innovations-for-happier-clients-and-staff
- https://blvdco.prod.joinblvd.com/blog/salon-reports
- https://apps.adp.com/en-US/apps/218226/7shifts-restaurant-scheduling-for-run-powered-by-adp/features
- https://www.7shifts.com/blog/best-automated-scheduling-solution-for-restaurants/
- https://www.usecarly.com/blog/sevenshifts-ai/
- https://www.retailtouchpoints.com/features/solution-spotlight/deputy-debuts-ai-powered-auto-scheduling
- https://www.deputy.com/features/smart-scheduling
- https://www.bestpractice.ai/ai-case-study-best-practice/deputy_introduces_ai_for_automatic_shift_scheduling_for_its_staffing_management_app
