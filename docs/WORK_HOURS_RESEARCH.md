# Horario de trabajo del equipo: investigación

Fecha: 2026-10-22. Alcance: cómo el software deja que un negocio gestione **el horario de su equipo**
(turnos, horas de trabajo, excepciones). No trata la reserva del cliente salvo en el punto en que el
horario decide qué se puede reservar.

Para qué: diseñar el cajón «Horario de trabajo» dentro del calendario y mejorar el horario en el
módulo de Equipo de Barberlytics. Ya tenemos: horario semanal fijo por barbero (rangos por día),
cambios por día en una página de rejilla semanal, solicitudes de ausencia con aprobación y bloqueos
(almuerzo, reuniones) en el calendario.

**Cómo leer las fuentes.** Cada dato lleva su URL. Varias ayudas (Booksy, Vagaro, Timely, Phorest,
Deputy) devuelven 403/402 a un lector automático; en esos casos el dato sale del extracto que muestra
el buscador sobre esa misma página y se marca como *(extracto)*. Lo que no se pudo comprobar se dice
como **no verificado**.

---

## 1. Competidores del sector (salón, barbería, spa)

### Fresha
Fuente: [Manage scheduled shifts for team members](https://www.fresha.com/help-center/knowledge-base/calendar/252-schedule-and-update-team-shifts).

- **Dónde se edita:** Equipo › Turnos programados › miembro › «Set repeating shifts». También desde
  el turno en el calendario («Edit this day»).
- **Repetición:** cada 1, 2, 3 o 4 semanas. Es el único del sector, junto a Salonized, con rotación
  nativa de varias semanas.
- **Fechas:** inicio y fin; el fin puede ser «Never» o una fecha.
- **Varios turnos al día y pausas:** la pausa se hace añadiendo otro turno el mismo día (botón «Add»
  junto a la hora de fin). Hasta **10 turnos por día** por persona.
- **Excepción de un día:** «Edit this day» cambia solo ese día; el patrón no se toca. «Delete this
  shift» borra un turno concreto.
- **Baja de un empleado:** «Delete all shifts» desde una fecha: deja de ser reservable a partir de ahí.
- **Sedes:** si alguien trabaja en varias sedes, sus citas en otra sede salen como bloques grises con
  el nombre de la sede (se puede apagar en ajustes del calendario).
- **Conflictos:** bloquea el tiempo no disponible en todas las sedes para evitar dobles reservas; en
  el local se puede forzar, con aviso si la persona ya está ocupada.
- **Horario del negocio ≠ turnos:** el horario de apertura se gestiona aparte; para impedir reservas
  fuera de él se usa tiempo bloqueado.
- **Cierres:** «Business closed period» (inicio, fin, descripción) detiene la reserva en línea; las
  citas existentes en ese periodo hay que cancelarlas a mano — según una ayuda de terceros
  ([calculated-performance](https://calculated-performance.outseta.com/support/kb/articles/VmAAK3ma/how-to-add-a-business-closed-period)), no verificado en la ayuda oficial.
- **No documentado:** copiar semanas, notificaciones al equipo, permisos por rol.

### Booksy (Booksy Biz)
Fuentes *(extracto)*: [How do I adjust staff members’ working hours?](https://support.booksy.com/hc/en-us/articles/16536020166546-How-do-I-adjust-staff-members-working-hours),
[How do I edit Shifts for individual Staff Members?](https://support.booksy.com/hc/en-us/articles/16488504414226-How-do-I-edit-Shifts-for-individual-Staff-Members),
[How do I adjust my business hours for a specific day?](https://support.booksy.com/hc/en-us/articles/16488485090066-How-do-I-adjust-my-business-hours-for-a-specific-day),
[Features](https://biz.booksy.com/features), [FAQ nuevo Booksy](https://biz.booksy.com/blog/the-new-booksy-frequently-asked-questions).

- **Dónde:** web/tablet: Personal y Recursos › **Shifts** (horas de trabajo, ausencias y horario del
  negocio en la misma vista). Móvil: Perfil › Ajustes › Gestión de horario › horas del empleado.
- **Por defecto** el turno del empleado copia el horario del negocio.
- **Ausencias:** «Add Time Off» para una o varias personas, con motivo y marca de si fue aprobada
  (si no, se descuenta de sus horas).
- **Cambio de un día del negocio:** al cambiar el horario de un día, si afecta a empleados con turno
  ese día, **pregunta si aplicar el cambio también a sus turnos**. Buena idea para cierres parciales.
- **Copiar:** se pueden copiar turnos a días o semanas futuras e imprimir el horario.
- **Calendario:** filtro para ver solo a quien trabaja o tiene citas.
- **No verificado:** repetición cada 2 semanas, «solo este día / este y siguientes», permisos exactos.

### Square Appointments
Fuente: [Manage staff schedules and availability](https://squareup.com/help/us/en/article/8443-manage-staff-schedules-and-availability-with-square-appointments);
[Personal events / block time](https://squareup.com/help/us/en/article/5533);
hilos de la comunidad ([disponibilidad](https://community.squareup.com/t5/Questions-How-To/How-do-I-fix-issues-with-availability-in-Appointments/m-p/83326), [bloqueos](https://community.squareup.com/t5/Troubleshooting/I-blocked-out-some-days-on-my-calendar-but-some-clients-are/td-p/110805)).

- **Dónde:** en el **calendario**, icono de reloj arriba a la derecha → «One-time change» o
  «Recurring schedule». Se elige sede (si hay varias), empleado, días y horas.
- **Cambio puntual** = rango de semanas concreto (vacaciones, una semana distinta). **Recurrente** =
  patrón semanal. La disponibilidad personalizada pisa el horario del negocio y del empleado.
- **Efecto:** se refleja en el calendario web, en el TPV y en la reserva en línea.
- **Permisos:** dueño o empleados con permiso de gestionar todos los calendarios.
- **Bloqueo:** evento personal con «Block time» quita disponibilidad en línea. El *buffer* del servicio
  se suma a la duración (60 min + 10 = hueco de 70).
- **Usuarios reportan** que en el local se puede reservar encima de un día bloqueado sin aviso
  (comunidad, no confirmado).
- **No documentado:** varios rangos por día, qué pasa con citas fuera del nuevo horario.

### Vagaro
Fuentes *(extracto)*: [Add and Update Working Hours](https://support.vagaro.com/hc/en-us/articles/360010304773-Add-and-Update-Working-Hours),
[Add Custom Service Hours](https://support.vagaro.com/hc/en-us/articles/27288386959131-Add-Custom-Service-Hours),
[Set Your Business Hours](https://support.vagaro.com/hc/en-us/articles/34418132184091-Set-Your-Business-Hours),
[Schedule Personal Tasks and Closures](https://support.vagaro.com/hc/en-us/articles/360010603213-Schedule-Personal-Tasks-and-Closures-on-the-Calendar),
[Minimize Gaps](https://support.vagaro.com/hc/en-us/articles/41075820738843-Minimize-Gaps-in-Your-Schedule).

- **Horas:** «Edit Working Hours», desde/hasta, **«Add Time Range»** para partir el día, y se puede
  limitar **qué servicios** ofrece en cada tramo (único que lo documenta). Interruptor para aplicar a
  ese día o a todos.
- **Copiar:** «Copy to All» copia un día al resto de la semana.
- **Negocio derivado:** opción «Use Employee Working Hours»: el horario del negocio se calcula a partir
  del de los empleados.
- **Tareas personales y cierres** sí repiten semanal, quincenal o «cada pocas semanas» hasta una fecha;
  las horas de trabajo no muestran esa opción (no verificado).
- **Huecos:** la optimización de huecos solo agrupa dentro de las horas de trabajo.

### Boulevard
Fuentes: [Schedule: Publishing and Editing Staff Shifts](https://support.boulevard.io/en/articles/5941438-schedule-publishing-and-editing-staff-shifts),
[Restricting Appointment Availability](https://support.boulevard.io/en/articles/5941449-restricting-appointment-availability).

- **Dónde:** por sede, Manage › Schedule. **Solo en el panel web**, no en el móvil. Lo publica el
  negocio o el propio profesional.
- **Repetición:** semanal por días; rango de fechas con fin «Ongoing». No menciona cada 2 semanas.
- **Turno puntual:** se publica «solo ese día», «ese día de la semana en adelante» o «ese día de la
  semana dentro de un rango». Es el «solo este / este y siguientes» más explícito del sector.
- **No disponible:** «Publish as Unavailable» con motivo (caja gris); no toca otras semanas.
- **Eliminar serie:** «Remove» desde una fecha.
- **Trampa conocida:** republicar el patrón **borra las excepciones futuras** (cajas azul oscuro) pero
  conserva los días no disponibles. Una excepción creada antes del patrón sobrevive; una creada después,
  no. Es exactamente lo que hay que evitar.
- **Código visual:** azul claro con icono de repetición = recurrente; azul oscuro = puntual/excepción;
  gris = no disponible.
- **Turno = disponibilidad en línea**, no horas reales: el personal puede poner citas fuera del turno;
  el cliente en línea solo dentro. Lo dicen explícitamente.
- **Almuerzo y reuniones** van como bloqueos, no como turnos. Bloqueos cuentan para ocupación; los
  cierres conviene marcarlos como «no disponible» para no ensuciar la ocupación.
- Reglas de reserva aparte: antelación mínima («Up to») y máxima («Not more than»).
- Filtro de calendario «Is Working» (con turno publicado o con cita).

### Mangomint
Fuentes: [Staff member work hours](https://www.mangomint.com/learn/staff-member-work-hours.md),
[Alternating hours every other week](https://www.mangomint.com/learn/how-can-i-set-up-alternating-hours-every-other-week.md),
[Staff management](https://www.mangomint.com/features/staff-management.md).

- **Dónde:** desde el **calendario** (vista Día › nombre del profesional › «Edit Schedule»), desde la
  app de Personal (pestaña Work Hours) o el propio perfil (Work Schedule).
- **Permisos:** admin; «Can change own work schedule» (solo lo suyo); «Can manage staff members»
  (suyo y de otros). Es el modelo de permisos más claro del sector.
- Turnos repetidos con pausas, cambios de un día sin tocar el patrón, sobrescrituras para baja,
  vacaciones, festivos.
- **Cada 2 semanas:** no es nativo. Se pone el turno semanal y se tapa la semana libre con un bloqueo
  que repite cada 2 semanas. Atajo, no modelo.
- **Horario del negocio no controla la disponibilidad**; la controlan las horas de trabajo.

### GlossGenius
Fuentes (marketing/blog, no ayuda): [Salon management for teams](https://glossgenius.com/salon-management-software-for-teams),
[Calendar scheduling app](https://glossgenius.com/calendar-scheduling-app),
[Scheduling employees for shifts](https://glossgenius.com/blog/scheduling-employees-for-shifts).

- Vista del equipo con color por disponibilidad y horas; el profesional ajusta sus horas y bloqueos
  personales; sincroniza con Google/Apple/Outlook para traer horas y vacaciones.
- Interruptor «Available For Booking» por empleado.
- **No verificado** en ayuda oficial: repetición, excepciones, permisos.

### Timely
Fuentes *(extracto)*: [How to roster your staff](https://help.gettimely.com/hc/en-gb/articles/360060617254-How-to-roster-your-staff),
[Fortnightly rostering workaround](https://help.gettimely.com/hc/en-gb/articles/7233797997591-How-to-manage-fortnightly-rostering-workaround).

- Horas normales + vista de *roster* mensual para cambiar inicio/fin de días concretos.
- **No tiene roster quincenal**: lo dicen ellos. Atajo: horas amplias + «busy time» que repite cada 2
  semanas. **Turno partido:** inicio del primero a fin del último + busy time en medio. El busy time
  no es por sede.

### Zenoti
Fuentes: [Set up an employee's schedule for the day](https://help.zenoti.com/en/employee-and-payroll/employee-related-manager-tasks/manage-employee-schedule/set-up-an-employee-s-schedule-for-the-day.html),
[Week schedule and copy forward](https://help.zenoti.com/en/employee-and-payroll/employee-related-manager-tasks/manage-employee-schedule/set-up-the-employee-s-schedule-for-the-week-and-copy-the-schedule-forward.html),
[Blog: nueva programación](https://www.zenoti.com/es/blog/5-ways-zenotis-new-staff-scheduling-is-built-for-salon-and-spa-managers),
[Staff scheduling](https://www.zenoti.com/salon-management-software/staff-scheduling).

- Por día: uno o **dos tramos** (turno partido) y **estado** (Working, etc.). Sin horario, el empleado
  no aparece en la agenda; los nuevos no traen horario por defecto.
- Semana: días libres de toda la plantilla de una vez; «Save & Copy» copia hacia adelante.
- **No revisa conflictos con citas al copiar**: recepción debe reasignar a mano (lo dicen).
- Nueva experiencia (blog): vistas día/semana/mes con los mismos controles, **acciones en lote**
  (varios empleados), copiar patrones conservando horas, estados y **sala**, cortar y pegar,
  **borrador → compartir → publicar** (el empleado revisa y señala conflictos antes), indicador si
  está reservado en otra sede, y tiempo no laborable (PTO, formación) dentro del mismo horario.
- Alerta si se asigna un turno fuera de la disponibilidad del empleado antes de publicar (marketing).

### Phorest
Fuentes *(extracto)*: [How to schedule a staff member's roster](https://phorest.helpjuice.com/99627-new-staff-rosters/how-to-schedule-a-staff-members-roster),
[Time off during a working day](https://phorest.helpjuice.com/99627-new-staff-rosters/how-do-i-add-time-off-during-a-working-day%3F),
[Breaks](https://phorest.helpjuice.com/44037-category-1-GB/305342-how-to-set-a-break-how-to-repeat-a-break-and-how-to-set-a-paid-break-reception-cover-etc-gb),
[Opening hours](https://phorest.helpjuice.com/en_US/305412-how-do-i-enter-the-opening-hours-of-my-salon-or-spa).

- Manager › Staff Rosters: doble toque en un día, inicio/fin, repetir en días elegidos o puntual.
  Turno partido documentado aparte.
- **Tiempo libre dentro del día** (empieza tarde, se va antes, se va enfermo) con motivo (vacaciones,
  baja, formación, propio).
- **Pausas pagadas o no** y repetibles; aconsejan no usar una pausa larga como ausencia.
- Sin horario de apertura, la agenda queda vacía aunque haya rosters.
- Informe de días trabajados y libres (descuenta pausas no pagadas).

### SimplyBook.me
Fuentes: [How to set my availability](https://help.simplybook.me/index.php/How_to_set_my_availability),
[Opening hours vs working hours](https://help.simplybook.me/index.php/Opening_hours_of_the_company_vs_Working_hours_of_provider).

- Tres capas: **empresa → proveedor → servicio**; lo reservable es la intersección. El proveedor no
  puede trabajar fuera del horario de la empresa (error explícito).
- **Días especiales** por fecha (empresa en amarillo, proveedor en rojo) con «Is working day?»;
  selección de **varias fechas a la vez**; «clear special day» para quitar la excepción.
- Un día especial no se altera al cambiar el patrón semanal (foro técnico, informe de comunidad).

### Squire (barberías)
Fuentes *(extracto)*: [How to set and manage Barber schedules](https://getsquire.my.site.com/help/s/article/HowtosetandmanageBarberschedulesShopBarber6239fedf749c1?language=en_US),
[Barber Management for brand accounts](https://help.getsquire.com/s/article/Barber-Management-for-brand-accounts?language=en_US).

- Commander › Barbers › barbero › Schedule: **fecha de inicio**, días y horas. Days Off / Days On.
- **Horarios futuros con fecha:** se puede programar un horario nuevo solo si el actual tiene fecha de
  fin. Es el modelo «horario vigente desde X».
- Pueden editarlo la cuenta de la barbería y **barberos con permiso de horario**.
- Sin horario y al menos un servicio, el barbero no aparece en la reserva.
- Cuentas de marca: aplicar días libres/trabajados a todas las sedes desde un desplegable. Los
  conflictos se avisan en la app pero se puede seguir reservando.
- Para avisar a clientes de ausencias proponen su módulo de mensajes.

### theCut
Fuentes: [Availability gauges](https://help.thecut.co/en/articles/9801081-introducing-our-new-barber-availability-gauges),
[Daily success](https://help.thecut.co/en/articles/11173779-daily-success-with-thecut-your-barber-s-game-plan).

- App para el barbero independiente: el propio barbero pone ubicación y horas y bloquea tiempo.
- **Indicador por día** (los próximos 6 días) de cuánto le queda libre; gris = lleno o no disponible.
  Idea útil para el cajón: un medidor de ocupación por día.
- Por defecto el barbero confirma cada solicitud; se puede pasar a confirmación automática.

### Schedulicity
No se encontró documentación pública sobre horarios del personal. **No verificado.**

### Fuera de la lista, pero útil: Salonized
Fuente: [How do I manage my opening and working hours](https://help.salonized.com/en/articles/589568-how-do-i-manage-my-opening-and-working-hours).

- **Una sola rejilla**: fila de apertura arriba y una fila por empleado, sala y herramienta.
- Empleado sigue la apertura por defecto (icono de casa) o «gestionar manualmente».
- Repetir **semanal o cada dos semanas**, indefinido o hasta fecha.
- **Cada guardado pregunta «Solo este» o «Todos los futuros».** «Todos los futuros» fija el patrón
  desde esa fecha y limpia lo guardado para ese día de la semana después.
- Iconos: repetición = patrón; lápiz = excepción; aviso = fuera de apertura (no reservable en línea
  pero cuenta como trabajado).

---

## 2. Fuera del sector

### Google Calendar
Fuente: [Working hours & location](https://support.google.com/a/users/answer/9282963?hl=en).
- Horario por día, **varios tramos por día**; un turno nocturno se parte en dos tramos (inicio < fin
  obligatorio: **no permite cruzar medianoche** en un tramo).
- Es una semana tipo: no cambia por semana; para algo puntual se edita y se devuelve.
- **Ubicación por día**; cambiarla en un día concreto: «solo este día» o «repetir semanalmente».
- Al viajar o cambiar zona horaria, las horas se ajustan a la hora local.
- Los organizadores ven a quién le cae una reunión fuera de su horario.

### Microsoft Outlook / Bookings
Fuentes: [Set your work hours and location in Outlook](https://support.microsoft.com/topic/af2fddf9-249e-4710-9c95-5911edfd76f6),
[Employee working hours in Bookings](https://learn.microsoft.com/et-ee/microsoft-365/bookings/employee-hours?view=o365-worldwide) *(extracto)*.
- Outlook nuevo: horario distinto por día y varios tramos (botón +). El clásico, un solo rango.
  Para clientes antiguos aproxima con el inicio más temprano y el fin más tardío.
- Bookings: cada empleado empieza con **«Use business hours»**; al desmarcarlo, inicio/fin por día
  en pasos de 15 min. Ausencias largas y cierres en una página aparte. Lee Outlook para no ofrecer
  huecos ocupados.

### Calendly
Fuentes: [How to set your availability](https://calendly.com/help/how-to-set-your-availability),
[How to edit holidays](https://calendly.com/help/how-to-edit-holidays-within-calendly).
- Horas semanales en vista **Lista**; **horas por fecha** («+ Hours», elegir fechas, ajustar tramos,
  aplicar). Vista **Calendario** para horarios no semanales (seleccionar varias fechas arrastrando).
- Varios horarios con nombre, asignados a tipos de evento.
- **Festivos automáticos por país** (no incluye Colombia: AU, BR, CA, FR, DE, MX, NL, ES, UK, US) con
  interruptor por festivo; una hora por fecha no puede pisar un festivo activo.

### Cal.com
Fuentes: [Set up your availability](https://cal.com/help/availabilities/set-up-your-availability.md),
[Date overrides](https://cal.com/help/availabilities/date-overrides).
- Varios tramos por día, **copiar un día a otros**, zona horaria por horario, **varios horarios** con
  uno por defecto, duplicar horario.
- **Date overrides**: solo afectan a esa fecha; al pasar, se archivan.
- **Troubleshooter**: muestra cómo se combinan horario, eventos y ajustes para decidir lo reservable.
  Orden de prioridad (espejo no oficial en [Mintlify](https://mintlify.com/calcom/cal.com/features/availability)):
  override por fecha > disponibilidad propia del evento > horario enlazado > horario por defecto.

### Acuity Scheduling
Fuentes: [Setting repeating hours](https://help.acuityscheduling.com/hc/articles/16676880363277),
[Basic availability](https://help.acuityscheduling.com/hc/articles/27016341585421),
[Tutorial](https://acuityscheduling.com/learn/setting-repeating-hours).
- Horas repetidas + «Override hours for specific days». Un override puede **repetir hasta una fecha**
  («Until end date»): horario temporal (p. ej. horario de vacaciones escolares).
- Alternativa: sin horas semanales, día a día en el calendario; lo vacío no es reservable.

### Deputy
Fuentes *(extracto)*: [help.deputy.com 4688863723791](https://help.deputy.com/hc/en-au/articles/4688863723791),
[4688828103439](https://help.deputy.com/hc/en-au/articles/4688828103439).
- **Plantillas** de día, semana o 2 semanas («Copy Shifts › Save Template»); se cargan en una vista de
  igual longitud. Copiar semana anterior, filtrable por área.
- **Publicar**: «Publish updates» (solo avisa a quien cambió) o «Publish all»; también a una persona.

### When I Work
No se obtuvo la ayuda oficial (el buscador no la devuelve). **No verificado.** Lo habitual en la
categoría (ver [Workforce.com](https://help.workforce.com/en/articles/15359569-submit-manage-availability)):
disponibilidad continua o temporal enviada por el empleado con aprobación del gerente.

### Homebase
Fuente (marketing): [Employee availability tracker](https://www.joinhomebase.com/employee-scheduling/employee-availability-tracker),
[Schedule maker](https://www.joinhomebase.com/schedule-maker).
- La no disponibilidad se ve junto a los turnos; **aviso al asignar en hora no disponible**, se puede
  seguir. Cambios de disponibilidad con aprobación (plan Plus). Solapes marcados antes de publicar.
  Plantillas semanales.
- Referencia cercana: HotSchedules, al copiar semana, convierte turnos en conflicto en turnos sin
  asignar y muestra un aviso con la lista ([HS Copying Schedules](https://help.hotschedules.com/hc/en-us/articles/115001555851-HS-Scheduler-Copying-Schedules)).

### 7shifts
Fuentes: [Set up shift trading](https://kb.7shifts.com/hc/en-us/articles/4417514302995),
[Approve shift pool requests](https://kb.7shifts.com/hc/en-us/articles/4417505005459),
[Availability and time off](https://kb.7shifts.com/hc/en-us/articles/33383119814163-Manage-availability-and-time-off-requests-Getting-Started-for-Managers).
- **Shift Pool**: pujas, turnos «up for grabs» y cambios directos; con o sin aprobación; el turno sigue
  siendo del empleado hasta que se aprueba. Aprobadores limitados a su sede/departamento.
- No se verificó cómo el auto-scheduler usa la disponibilidad.

### Sling
Fuente: [Sling by Toast: Unavailability and Time Off](https://support.toasttab.com/en/article/Sling-by-Toast-Unavailability-and-Time-Off).
- Distingue **no disponibilidad recurrente** (clases) de **ausencia puntual**; ambas con aprobación y
  aviso al empleado. Publicación y avisos de horas extra: no verificado.

### Connecteam
Fuente (marketing): [Employee scheduling app](https://connecteam.com/employee-scheduling-app/).
- Plantillas por rol, turno o semana; copiar en un clic. **Auto-scheduling** que considera solapes,
  ausencias aprobadas, disponibilidad, cualificaciones, cobertura y equidad. Cambios de turno con
  aprobación; el empleado acepta o rechaza turnos. **Coste laboral por día** según los turnos; avisos
  de conflicto antes de publicar; límites de horas extra. No verificado en ayuda oficial.

---

## 3. Síntesis

### 3.1 Patrones comunes

1. **Tres capas**: horario del negocio → horario del profesional → excepciones por fecha. Lo reservable
   es la intersección, menos ausencias y bloqueos (SimplyBook, Salonized, Microsoft Bookings).
   Por defecto el profesional hereda el del negocio (Booksy, Bookings, Salonized).
2. **Patrón semanal + excepción por fecha** es universal. La excepción no toca el patrón (Fresha,
   Mangomint, Cal.com, Acuity).
3. **Varios tramos por día** es la forma estándar de hacer pausas y turnos partidos (Fresha hasta 10,
   Zenoti 2, Google, Outlook, Calendly, Cal.com, Vagaro).
4. **Edición desde el calendario y desde Equipo**: Square y Mangomint abren el horario desde la agenda;
   Fresha, Booksy, Boulevard, Squire lo tienen en Equipo/Personal. Los mejores tienen las dos entradas.
5. **Rotación de varias semanas** es rara: nativa en Fresha (1-4 sem) y Salonized (1-2); Timely y
   Mangomint usan atajos con bloqueos repetidos. Es un hueco real de mercado.
6. **Horario con vigencia** (desde/hasta): Fresha, Boulevard, Squire, Acuity.
7. **Disponibilidad en línea ≠ horas trabajadas**: Boulevard lo dice abiertamente; Salonized marca lo
   que queda fuera de la apertura como «trabajado pero no reservable».
8. **Publicar/borrador** solo en herramientas de turnos (Deputy, Zenoti nuevo, Connecteam). En salones
   el cambio es inmediato.
9. **Conflictos**: casi todos avisan pero dejan forzar (Fresha, Squire, Homebase). **Ninguno de los
   revisados documenta una lista de citas afectadas al cambiar un horario**; Zenoti dice que no revisa
   y Fresha que hay que cancelar a mano en los cierres.

### 3.2 Mejores ideas para copiar

- **«Solo este día» / «Este y los siguientes»** al guardar (Salonized, Boulevard; Google para la
  ubicación). Decisión explícita en cada guardado.
- **Código visual de tres estados**: patrón (repetición), excepción (lápiz), no disponible (gris con
  motivo) — Boulevard y Salonized.
- **Ofrecer aplicar el cambio del negocio a los turnos afectados** (Booksy).
- **Copiar un día a toda la semana** (Vagaro, Cal.com) y **copiar semana / guardar plantilla**
  (Deputy, Zenoti, Booksy).
- **Selección de varias fechas a la vez** para excepciones (SimplyBook, Calendly).
- **Permisos en tres niveles**: ver, editar lo propio, editar a otros (Mangomint).
- **Horario futuro con fecha de inicio** sin perder el actual (Squire, Fresha).
- **Explicador de disponibilidad** («¿por qué no se puede reservar a las 4?») — Cal.com Troubleshooter.
- **Medidor de ocupación por día** (theCut).
- **Indicador de «trabaja en otra sede»** (Fresha, Zenoti).
- **Festivos por país** con interruptor (Calendly) — para Colombia habría que cargarlos nosotros.

### 3.3 Qué evitar

- **Republicar el patrón y borrar excepciones** en silencio (Boulevard). Las excepciones deben
  sobrevivir o se debe preguntar.
- **Rotaciones por atajo** (bloqueos repetidos que tapan la semana libre, Timely/Mangomint): ensucian
  la agenda y los informes.
- **Pausas como «busy time» encima de un turno largo**: mejor tramos reales.
- **Copiar semanas sin revisar conflictos** (Zenoti).
- **Bloqueos que el cliente respeta pero recepción no ve** (quejas en Square).
- **Edición solo en web** (Boulevard): el cajón debe funcionar a 375 px.

### 3.4 Recomendación para Barberlytics

#### Modelo (válido para cajón y Equipo)
- `ScheduleTemplate` por barbero y sede: `validFrom`, `validTo?`, `cycleWeeks` (1-4), y por semana
  del ciclo y día: lista de tramos `{start, end}` ordenados y sin solaparse.
- `ScheduleException` por fecha: `replace` (tramos nuevos) o `off`, con motivo opcional. Sobrevive a
  los cambios del patrón; si un nuevo patrón coincide con la excepción, se avisa y se ofrece limpiarla.
- Ausencias y bloqueos siguen como hoy, como capas aparte (no se mezclan con el horario).
- Cierres del negocio (`BusinessClosure`): día completo o parcial, por sede.
- Disponibilidad final = horario de sede ∩ (patrón ⊕ excepción) − ausencias aprobadas − bloqueos −
  cierres. Un único cálculo compartido por agenda, reserva en línea y nómina.

#### Cajón «Horario de trabajo» en el calendario
Se abre desde la cabecera de la columna del barbero o desde el menú del día (como Mangomint/Square),
empuja la agenda (`SidePanelShell`), un panel a la vez.

- **Muestra:** el día seleccionado de ese barbero: tramos, origen (patrón / excepción / ausencia /
  cierre) con su icono, horas totales y ocupación del día (medidor estilo theCut). Debajo, la semana
  en miniatura con los mismos iconos.
- **Interacciones:**
  - Editar tramos del día (añadir, quitar, mover), con presets rápidos («Entra tarde», «Sale antes»,
    «Día libre», «Añadir almuerzo»).
  - Al guardar: **«Solo este día»** (por defecto) o **«Este y los siguientes [día de la semana]»**
    con fecha de inicio. Nunca guardar sin esa decisión cuando cambia algo del patrón.
  - **Vista previa de impacto antes de guardar**: lista de citas que quedan fuera, con acciones por
    cita (mover a otro barbero, reagendar, dejar fuera de horario). Es la diferencia con todos los
    competidores revisados.
  - «Volver al horario habitual» para quitar una excepción.
  - Arrastrar el borde del turno en la propia agenda (en la sombra) como atajo, que abre el cajón con
    el cambio propuesto.
- **En la agenda:** fuera de horario sombreado; excepción con borde/icono de lápiz; ausencia gris con
  motivo; cierre con etiqueta en la cabecera del día.

#### Módulo de Equipo
- Editor del patrón por barbero con vigencia (desde/hasta), ciclo de 1-4 semanas, copiar un día a la
  semana, copiar a otros barberos, plantillas con nombre («Mañana», «Tarde», «Fin de semana»).
- Vista de rejilla de todo el equipo (la página semanal actual) con selección múltiple de días y
  barberos para aplicar una excepción o una plantilla en lote; copiar semana con informe de conflictos.
- Historial de cambios («quién cambió qué y cuándo»).

#### Permisos por rol
| Rol | Ver | Editar lo propio | Editar a otros |
|---|---|---|---|
| Dueño, admin | todo | sí | sí |
| Recepción | todo | — | excepciones del día (no el patrón), configurable |
| Barbero de comisión | lo suyo (y el equipo, solo lectura si se activa) | solicita; el cambio queda pendiente de aprobación | no |
| Barbero de renta | lo suyo | **sí, directo** (es su negocio; solo su columna) dentro del horario de la sede | no |

El cambio pendiente se ve en la agenda como propuesta (borde discontinuo) hasta aprobarse; reutiliza
el flujo de aprobación de ausencias.

#### Prioridades
- **P0**
  - Varios tramos por día con validación (sin solapes, inicio < fin, mínimo 15 min).
  - Excepción por fecha con «Solo este día / Este y los siguientes».
  - Vista previa de citas afectadas al guardar, con acciones.
  - Cajón en el calendario con edición del día y semana en miniatura; funciona a 375 px.
  - Código visual (patrón, excepción, ausencia, cierre) igual en agenda, cajón y Equipo.
  - Permisos por rol de la tabla.
- **P1**
  - Vigencia (desde/hasta) y horario futuro programado.
  - Ciclo de 2-4 semanas.
  - Copiar día a semana, copiar semana, plantillas, acciones en lote en Equipo.
  - Cierres del negocio por sede con «aplicar a los turnos afectados» (Booksy) y lista de citas.
  - Festivos de Colombia precargados con interruptor.
  - Aviso a cada barbero (SMS/correo/app) cuando cambia su horario.
- **P2**
  - Explicador de disponibilidad («¿por qué no aparece este hueco?»).
  - Disponibilidad en línea distinta del horario (ocultar tramos a la reserva sin dejar de trabajar).
  - Servicios por tramo (Vagaro), sede por tramo (Google limita la ubicación a un tramo por día).
  - Borrador y publicación para cambios grandes; intercambio de turnos entre barberos.
  - Sugerencia automática de horario según demanda y coste por día (Connecteam/Zenoti).

### 3.5 Casos límite

- **Turno que cruza medianoche:** Google obliga a partirlo en dos tramos. Para una barbería es raro;
  propuesta: permitir fin hasta 23:59 y, si se necesita, `end` > 24:00 guardado como minutos desde el
  inicio del día de inicio. El tramo pertenece al día en que empieza.
- **Tramos solapados:** no se guardan; se ofrece fusionar. Tramos contiguos se fusionan solos.
- **Hueco mínimo entre tramos:** avisar si una pausa es menor que el servicio más corto (no sirve para
  nada) o menor a 15 min.
- **Horario de verano (DST):** Colombia no lo usa, pero el modelo debe guardar horas locales de pared
  más la zona de la sede (no UTC), para que «9:00» siga siendo 9:00 si se expande a otro país.
- **Citas fuera del nuevo horario:** ningún competidor revisado documenta una lista de afectadas;
  Fresha y Squire avisan y dejan seguir, Zenoti no revisa. Nosotros: lista previa al guardar y, si se
  guarda igual, las citas quedan marcadas «fuera de horario» en la agenda.
- **Cambio del patrón con excepciones futuras:** conservarlas por defecto (evitar el fallo de
  Boulevard) y avisar de cuántas hay.
- **Festivos y cierres:** capa por sede que pisa el horario; recepción ve el motivo en la cabecera del
  día. Una excepción de «trabaja» no puede pisar un cierre sin confirmación (Calendly lo prohíbe).
- **Barbero fuera del horario de la sede:** avisar como Salonized (cuenta como trabajado, no
  reservable en línea) en vez de bloquear como SimplyBook.
- **Ausencia aprobada encima del horario:** gana la ausencia; el cajón la muestra como tal.
- **Barbero en dos sedes:** un patrón por sede, sin solaparse entre sedes; la agenda de una sede
  muestra el tiempo en la otra como gris con nombre (Fresha).
- **Baja de un barbero:** «sin horario desde [fecha]» con lista de citas futuras para reasignar.
