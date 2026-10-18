# Acceso, cuenta y puesta en marcha — investigación

Investigación del 2026-10-18 sobre la entrada a Barberlytics (ruta `/login`: entrar, crear cuenta, recuperar el
número, bloqueo y soporte), la sesión y los roles al entrar, y lo que pasa **después** del registro: la puesta en
marcha de una barbería nueva y la importación de datos desde otro sistema. Solo lectura: no se tocó código.

Fuentes internas: `src/features/auth/`, `src/features/access/`, `src/features/settings/` (sobre todo
`sections/LoginSettings.tsx` y `sections/DeleteAccountSettings.tsx`), `src/app/layouts/AppLayout.tsx`,
`src/app/router.tsx`, `src/mocks/handlers.ts` (Auth), `src/mocks/settings/handlers.ts`, `src/lib/csv.ts`,
`docs/API_CONTRACT.md` (Auth y Configuración), `docs/ROLES_PLAN.md`, `ai-tools/CODEMAP.md` y los artículos de
producción del centro de ayuda (`centro-de-ayuda/content/es/acceso-y-cuenta/` y `empezar/`). Para no repetir, este
informe se apoya en [09-configuracion.md](09-configuracion.md), que ya trató la lista de puesta en marcha y la
importación como ideas; aquí se bajan a detalle. Fuentes externas al final; lo que un proveedor dice de sí mismo se
marca **declarado** y lo no verificado lleva «?».

## Resumen ejecutivo

1. **La entrada está bien pensada en lo que se ve**: sin contraseña (celular + código de 6 dígitos), correo de
   respaldo verificado, bloqueo tras 4 fallos con salida a soporte, Google y Outlook, errores en su campo y 24
   pruebas. Es mejor que la de producción, que ni siquiera enlaza el registro desde la entrada.
2. **La seguridad vive en el navegador.** «Ver la plataforma como» ofrece los cinco roles a **cualquier** persona,
   se guarda en `localStorage` y sobrevive al cierre de sesión; un rol desconocido se convierte en **dueño**; y el
   servidor simulado no mira el rol en Configuración ni al eliminar la cuenta. Un barbero puede verse como dueño y
   borrar la barbería escribiendo su nombre. Antes de producción la autorización tiene que estar en el servidor.
3. **El contrato del código tiene tres agujeros de producción**: `otp/verify` dice si un número está registrado
   (lo que `otp/request` se cuida de no decir), el bloqueo es **indefinido** y cualquiera puede provocárselo al
   dueño con 4 códigos falsos, y no hay límite de envíos (riesgo de *SMS pumping*: cada SMS a Colombia cuesta
   0,0592 USD en la tarifa pública de Twilio).
4. **El registro no lleva a ningún lado.** Termina en «Te escribimos para activarla». País, zona horaria y número de
   barberos se piden y no se usan. No hay puesta en marcha: producción la explica en 11 pasos dentro de un artículo
   de ayuda. «Importar clientes» es un aviso de «llega pronto» y «Cargar miembros» no hace nada.
5. **La competencia vende la migración como servicio** (Booksy, GlossGenius, Mangomint y Boulevard la hacen con
   personas; Fresha importa clientes por CSV con mapeo; Square no importa citas). El diferencial posible:
   **importación asistida por IA** (CSV, Excel, una foto de la lista de precios o capturas del sistema anterior) y
   **puesta en marcha conversacional con Clipper**, siempre con vista previa y aprobación.
6. Recomendación: Fase 1 «cerrar la puerta» (autorización en servidor, código endurecido, pasos de confirmación
   para lo sensible), Fase 2 «del registro a la primera cita» (registro que entra, lista de puesta en marcha,
   invitar al equipo, importar), Fase 3 «configurar conversando» (Clipper configura e importa por foto; passkeys y
   código por WhatsApp).

---

## 1. Qué tiene hoy

**Mercado, según el código.** El celular arranca en Colombia y el selector trae 22 países con su zona horaria
(`src/features/auth/timezones.ts`); el registro de producción solo deja elegir Colombia o EE. UU. (centro de ayuda,
`registrar-tu-barberia.md`). Las dos cuentas de demostración son celulares `+57`. Esto pesa en el canal del código
(SMS frente a WhatsApp, §5) y en lo que debe precargar la puesta en marcha (moneda, impuestos, festivos).

### Inventario

| Área | Qué hay | Dónde |
|---|---|---|
| Entrar | Dos pasos: celular (`PhoneInput`, `autocomplete="tel-national"`) → código de 6 dígitos (`InputOtp`, `autocomplete="one-time-code"`, se envía solo al completar). «Reenviar», «Cambiar número», «Pedir el código al correo» y vuelta a SMS. Muestra cuántos intentos quedan | `LoginPage.tsx`, `LoginForm.tsx` |
| Google / Outlook | Botones que piden una credencial al proveedor. Con mocks entra con una credencial falsa; sin mocks responde «no está configurado en este entorno» | `providers.ts`, `POST /auth/oauth` |
| Olvidé mi número | Se escribe el correo y llega el celular con el que se entra. Responde igual exista o no el correo. Reenviar, corregir y abrir ticket | `RecoveryPanel.tsx`, `POST /auth/recovery/request` |
| Bloqueo | Al 4.º fallo seguido con un celular: `429` con `reason: "locked"`; pantalla propia y ticket «lockout». Solo soporte lo libera | `LockedPanel.tsx`, `MAX_LOGIN_FAILURES` en `mocks/handlers.ts` |
| Soporte sin sesión | Ticket con nombre, barbería, correo, celular, motivo (`recovery`, `lockout`, `other`) y mensaje prellenado; devuelve `BL-xxxx` y promete respuesta en 24 h hábiles | `SupportTicketPanel.tsx`, `POST /support/tickets` |
| Crear cuenta | 8 campos (nombre, apellidos, barbería, correo, celular, número de barberos, país, zona horaria; la zona espera al país y se fija sola si hay una). Termina en «Recibimos tu registro… te escribimos para activarla» | `SignupPanel.tsx`, `POST /auth/signup` |
| Sesión | Token *bearer* en `sessionStorage` (muere al cerrar la pestaña); al cargar pide `/auth/me` con 2 reintentos; un `401` en cualquier petición cierra la sesión; la guarda recuerda a dónde iba | `AuthProvider.tsx`, `tokenStorage.ts`, `RequireAuth.tsx` |
| Correo de respaldo | Configuración › Inicio de sesión: el SMS es el principal y no se apaga; el correo se activa tras verificarlo con un código y se quita con confirmación | `sections/LoginSettings.tsx`, `/auth/backup-email` |
| Roles al entrar | La sesión trae `admin | manager | member` y el cliente lo traduce a 5 roles de equipo (dueño, administrador, recepción, barbero por comisión, de renta). Cada rol aterriza en su inicio (`ROLE_HOME`) y cada ruta se guarda por área (`RequireArea`) | `access.ts`, `AccessContext.tsx` |
| «Ver como» | Menú de la cuenta con los 5 roles; el elegido se recuerda en `localStorage` (`thema.viewAs.v1`) | `viewAs.ts`, `AppLayout.tsx` |
| Eliminar | El dueño elimina la barbería escribiendo su nombre; el resto «elimina mi usuario» | `DeleteAccountSettings.tsx`, `POST /account/delete` |
| Pruebas | 24 casos de componente (login, código, bloqueo, respaldo, recuperación, ticket, registro) y 6 e2e | `auth.test.tsx`, `e2e/auth.spec.ts` |
| Backend simulado | Código fijo `246810`, 2 cuentas, sesiones guardadas en `sessionStorage` sin vencimiento | `mocks/handlers.ts`, `mocks/db.ts` |

**Puesta en marcha e importación: no existen.** Después de entrar no hay lista de tareas, ni barbería de ejemplo,
ni importador. Las piezas que una barbería nueva tiene que llenar sí existen, repartidas en 20 pantallas:
sucursales, detalles del negocio (zona, horario, festivos), precios e impuestos, servicios y productos, equipo
(`MemberWizardPage`, activar en la sucursal, horas de trabajo), comisiones y ciclo de nómina, pasarela de pago y
reserva en línea (`/reservar`). Producción explica el orden en el artículo «Primeros pasos» (11 pasos, de revisar
la sucursal a cobrar la primera cita).

**Cómo es en producción** (centro de ayuda, `acceso-y-cuenta/`): el registro solo se abre con un enlace directo
(«no hay un botón de Crear cuenta»), el aviso de duplicado es «Usuario ya existe» sin decir por qué dato, el
bloqueo también exige escribir a soporte, y quien es dueño y barbero tiene **dos perfiles reales** («Business» y
«Barber comission») que cambia sin volver a entrar.

---

## 2. Análisis del módulo

### Fortalezas

- **Sin contraseña y con el celular como llave.** Es el identificador real del sector en la región y evita el
  soporte de «olvidé mi clave». El código se completa solo en iOS y Android gracias a `one-time-code`.
- **No revela quién está registrado al pedir el código ni al recuperar**: `otp/request` y `recovery/request`
  responden `204` siempre. Los textos lo plantean en condicional («Si configuraste un correo de respaldo…»).
- **Siempre hay salida humana.** Desde el código, el bloqueo y la recuperación se abre un ticket con el contexto ya
  escrito y un número para seguirlo.
- **El respaldo se verifica antes de servir**, y es de la persona, no de la barbería.
- **Sesión que no se pierde por un parpadeo**: reintenta `/auth/me` ante fallos de red y solo un `401` la cierra.
- **La zona horaria se elige por país** y queda puesta si el país tiene una sola. Buen dato de partida para la
  puesta en marcha.
- **Un solo lugar decide qué se ve** (`useAccess()`), con aterrizaje por rol y guardas por área.

### Huecos

1. **No hay puesta en marcha.** Tras entrar, el dueño ve el panel vacío. Lo que dio en el registro (país, zona,
   número de barberos) no precarga nada: ni moneda, ni impuesto, ni festivos, ni pasarela sugerida.
2. **Activación manual.** «Te escribimos para activarla» deja a la persona esperando sin plazo. No hay prueba
   gratis que se active sola ni se verifica el celular al registrarse (el mismo código que luego sirve para entrar).
3. **No hay importación.** Ni clientes, ni servicios, ni equipo, ni citas futuras, ni saldos (regalos, paquetes,
   membresías). Para quien viene de Booksy o AgendaPro es la barrera de entrada.
4. **Invitar al equipo no termina en una persona que entra.** El miembro se crea «invitado» con su celular, pero el
   login solo conoce las cuentas de la tabla `ACCOUNTS`; no hay mensaje de invitación (SMS o WhatsApp), ni
   aceptación, ni `memberId` en la sesión (`docs/ROLES_PLAN.md`, pendiente 1).
5. **Cambiar de número no tiene flujo.** Perder el celular, cambiar de operador o de país (barbero que se muda a EE.
   UU.) termina en un ticket. Es el caso más común de «no puedo entrar».
6. **El dueño que también corta no tiene sus dos perfiles.** Producción los tiene; aquí «Ver como» los reemplaza con
   una herramienta de vista previa que no distingue lo que la persona **es** de lo que **mira**.
7. **Sin gestión de sesiones ni dispositivos**: no se ve dónde hay sesión abierta, no se cierran las demás, no hay
   caducidad por inactividad ni modo de tablet compartida en recepción (cambio rápido de persona con PIN).
8. **Sin avisos de seguridad**: nadie se entera de un inicio en un dispositivo nuevo, de un cambio de correo de
   respaldo ni de un bloqueo.
9. **Google y Outlook no se vinculan ni se desvinculan** desde Configuración, y no hay SDK real.
10. **No se aceptan términos ni el tratamiento de datos** en el registro (producción tiene un artículo de política,
    pero el formulario no pide la aceptación).

### Deuda técnica

- **Dos listas de roles.** La sesión trae el rol de la plantilla y `teamRoleFromSession` lo traduce en el cliente;
  lo que no reconoce lo vuelve `owner` (ver Errores). El contrato debe traer `teamRole` y `memberId`.
- **El código del simulador no vence ni se liga a una solicitud.** El contrato dice que vence a los 10 minutos;
  el mock acepta `246810` sin haberlo pedido y no hay prueba de vencimiento.
- **Token en `sessionStorage`.** El contrato recomienda cookie `httpOnly` + `SameSite=Lax`, pero no lo exige; las
  sesiones del simulador no vencen y no hay rotación ni renovación.
- **Al entrar se aterriza en `/metricas`** (`LoginForm.tsx:59`), no en el inicio del rol; el barbero debería caer
  en el calendario, como en producción.
- **El registro no detecta un celular repetido** (solo el correo). Dos cuentas con el mismo celular romperían la
  entrada, que se hace justo por celular.
- **Códigos de error mezclados**: Auth responde `validation_error` y el contrato dice `validation`. El cliente lo
  normaliza (`src/lib/api/client.ts:79`), pero el contrato debe decir uno.
- **Botones sin destino**: «Importar clientes» (`CustomersPage.tsx:150`) muestra «llega pronto» y «Cargar
  miembros» (`TeamHomePage.tsx:89`) no tiene acción.

### Fricciones de UX

- **Reenviar no tiene cuenta regresiva.** Invita a tocar varias veces; en producción cada toque es un SMS pagado.
- **El bloqueo no tiene salida propia.** «Soporte te escribe en menos de 24 horas hábiles»: un bloqueo un sábado a
  las 9 a. m. deja la barbería sin agenda el día más fuerte.
- **«Olvidé mi número» resuelve el caso raro** (no recuerdo cuál era) y no el frecuente (ya no tengo ese número).
- **Después de registrarse no se entra.** La pantalla final manda de vuelta al login, donde el número todavía no
  funciona.
- **El dueño no sabe qué falta para operar.** No hay progreso ni «tu reserva todavía no está publicada».
- **«Ver como» se queda pegado.** Si el dueño revisó la vista de recepción y cerró sesión, quien entre después en ese
  navegador hereda la vista elegida.

### Seguridad

| # | Riesgo | Por qué importa en una barbería | Mitigación |
|---|---|---|---|
| S1 | **Autorización solo en el cliente** («Ver como» abierto a todos, rol desconocido = dueño, servidor sin chequeo de rol) | Recepción y barberos usan la misma app que el dueño, a menudo en tabletas compartidas. Ven nómina, claves de pasarela y pueden eliminar la cuenta | Rol y alcance en el token, verificados en cada endpoint; «Ver como» solo para dueño y administrador, solo hacia abajo, de solo lectura y sin persistir entre sesiones |
| S2 | **Enumeración** en `otp/verify` («Ese número no está registrado») y en el registro («Ya hay una cuenta con ese correo») | Permite armar la lista de dueños y barberos de la plataforma para *phishing* o *SIM swap* dirigido | Misma respuesta para número no registrado y código incorrecto; en el registro, avisar por correo al dueño de la cuenta existente en vez de decirlo en pantalla |
| S3 | **Bloqueo indefinido que cualquiera provoca** | 4 códigos falsos con el celular del dueño lo dejan fuera hasta que soporte responda | Bloqueo temporal creciente (p. ej. 15 min → 1 h → 24 h), desbloqueo propio con el correo de respaldo verificado, aviso al dueño |
| S4 | **Sin límite de envíos** del código para el personal (la reserva sí tiene: 5 en 10 min) | *SMS pumping*: bots piden códigos a números de tarificación especial y la factura la paga Barberlytics | Límites por número, IP y prefijo de país; países permitidos; espera creciente; servicio antifraude del proveedor (Twilio Verify Fraud Guard o equivalente) |
| S5 | **Acciones sensibles sin confirmar identidad** (cambiar correo de respaldo, eliminar la cuenta, cambiar claves de pasarela) | Una sesión robada se vuelve permanente (el atacante pone su correo de respaldo) | Pedir un código nuevo (*step-up*) y avisar al celular y al correo anteriores |
| S6 | **SMS como único factor** | *SIM swap*: en Colombia la SIC abrió en octubre de 2025 una investigación a Tigo, Claro, Movistar y WOM por reposiciones de SIM sin validar la identidad | Passkeys como segundo método para dueño y administrador; avisos de nuevo dispositivo; *step-up* en lo sensible |
| S7 | **Inyección de fórmulas en los CSV exportados** | Nombres que llegan de la reserva pública (`=HYPERLINK(...)`) se ejecutan al abrir el CSV en Excel o Sheets | Anteponer `'` a celdas que empiezan por `=`, `+`, `-`, `@`, tabulador o retorno |
| S8 | **Token legible por JavaScript** | Cualquier XSS se lleva la sesión | Cookie `httpOnly`, CSP sin `unsafe-inline` y rotación del token |

### Errores encontrados

Comprobados en el código de esta copia.

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | **Cualquier rol puede «ver como» dueño.** El menú ofrece los 5 roles a quien tenga sesión y el rol elegido se convierte en el acceso efectivo de toda la interfaz. Combinado con el error de la fila 4, un barbero que «ve como dueño» abre «Eliminar barbería» y el servidor la borra | `src/app/layouts/AppLayout.tsx:89-93` y `:251` (`roles` sin filtrar) |
| Alta | **«Ver como» sobrevive al cierre de sesión** y pasa a la siguiente persona del mismo navegador: `logout` no llama a `writeViewAs(null)` | `src/app/layouts/AppLayout.tsx:319`, `src/features/access/viewAs.ts:11` |
| Alta | **Rol desconocido = dueño** (falla abierta). Cualquier valor nuevo del backend o un error de datos da acceso total | `src/features/access/access.ts:62` (y el respaldo de `useAccess.ts:7`) |
| Alta (contrato) | **Eliminar la cuenta y guardar ajustes no comprueban el rol** en el servidor simulado, que es la referencia del backend; basta sesión + nombre de la empresa | `src/mocks/settings/handlers.ts:254-262` y `:272-279`; `docs/API_CONTRACT.md` («Los permisos por rol no están aquí») |
| Alta (contrato) | **`otp/verify` revela si el número está registrado**, contra la regla que el mismo contrato aplica a `otp/request` | `src/mocks/handlers.ts:171`; `docs/API_CONTRACT.md` (tabla Auth, `otp/verify`) |
| Alta (contrato) | **Bloqueo indefinido por celular** que provoca cualquiera con 4 códigos falsos | `src/mocks/handlers.ts:159`, `:169`; `docs/API_CONTRACT.md` (párrafo de bloqueo) |
| Media | **CSV sin neutralizar fórmulas** | `src/lib/csv.ts:7-10` |
| Media | **Cambiar el correo de respaldo no pide confirmar identidad** ni avisa a nadie | `src/mocks/handlers.ts:240-248` |
| Baja | Al entrar se va a `/metricas`, no al inicio del rol | `src/features/auth/LoginForm.tsx:59` |
| Baja | El registro no detecta celular repetido y sí revela correo repetido | `src/mocks/handlers.ts:178-191` (l. 185) |
| Baja | «Cargar miembros» sin acción; «Importar clientes» es un aviso | `src/features/team/TeamHomePage.tsx:89`, `src/features/customers/CustomersPage.tsx:150` |

---

## 3. Qué le falta (tabla priorizada)

Impacto: A alto · M medio · B bajo. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes (con backend real).

| Prio | Mejora | Por qué | Impacto | Esfuerzo |
|---|---|---|---|---|
| P0 | **Autorización en el servidor**: `teamRole` y `memberId` en la sesión; cada endpoint comprueba rol y alcance; rol desconocido = sin acceso | Hoy la interfaz es la única barrera; ver Errores 1–4 | A | M |
| P0 | **«Ver como» acotado**: solo dueño y administrador, solo roles por debajo, de solo lectura, se borra al salir; perfiles múltiples reales para el dueño que corta | Cierra la escalada y recupera lo que producción ya tiene | A | S |
| P0 | **Código endurecido**: respuesta única en `verify`, límites de envío por número/IP/país, espera creciente y cuenta regresiva visible, bloqueo temporal con desbloqueo por correo de respaldo, protección contra *SMS pumping* | Enumeración, bloqueo malicioso del dueño y factura de SMS | A | M |
| P0 | **Confirmar identidad en lo sensible** (*step-up*: cambiar correo o número, claves de pasarela, eliminar, invitar administradores) y **avisos** de nuevo dispositivo y de cambios | Una sesión robada no puede volverse permanente | A | M |
| P0 | **Registro que entra**: verificar el celular con el código en el mismo registro, aceptar términos y tratamiento de datos, abrir sesión y empezar la prueba | Hoy termina en «te escribimos»; cada día de espera es un cliente que prueba otro | A | M |
| P0 | **Lista de puesta en marcha** en el inicio del dueño, precargada con el registro (país → moneda, impuesto, festivos, pasarela; zona; número de barberos), con progreso y «Publicar mi reserva» al final (ya P0 en el informe 09) | Producción lo explica en un artículo de 11 pasos; la competencia lo tiene en pantalla | A | M |
| P0 | **Importar clientes** (CSV o Excel) con mapeo de columnas, celular a E.164, duplicados por celular, vista previa, informe de filas rechazadas y deshacer | Es la puerta de entrada comercial; el botón ya existe y no hace nada | A | M |
| P0 | **Neutralizar fórmulas en los CSV** exportados | Error con riesgo real y arreglo de una línea | M | S |
| P1 | **Invitar al equipo** por SMS o WhatsApp con enlace; la persona entra con su celular; «invitado» pasa a «activo» al primer ingreso | Sin esto el dueño no puede tener a su equipo dentro | A | M |
| P1 | **Importar catálogo y equipo**: servicios con duración y precio, productos, barberos; luego citas futuras y saldos (regalos, paquetes, membresías) | Lo que Mangomint, GlossGenius y Boulevard migran por el cliente | A | M–L |
| P1 | **«Cámbiate desde…»**: guías por sistema (Booksy, AgendaPro, Fresha, Square, Vagaro) con cómo pedir la exportación, y servicio de migración hecho por personas para cadenas | Varios de esos sistemas no dejan exportar citas solos | A | M |
| P1 | **Código por WhatsApp** (plantilla de autenticación) con caída a SMS, canal según país | Mejor entrega y menos costo en LatAm según casos declarados (§5) | A | M |
| P1 | **Cambiar mi número** sin soporte: correo de respaldo + código al número nuevo + espera y aviso al anterior | El motivo más común de «no puedo entrar» | A | M |
| P1 | **Passkeys** como segundo método, primero para dueño y administrador | Quita el riesgo de *SIM swap* donde más duele | M | M |
| P1 | **Sesiones y dispositivos**: lista, cerrar las demás, caducidad por inactividad; **modo tablet de recepción** con cambio de persona por PIN | El mostrador es un dispositivo compartido | M | M |
| P1 | **Barbería de ejemplo** para probar y botón «Empezar con mis datos» que la borra | Deja explorar antes de cargar todo | M | S |
| P1 | **Cookie `httpOnly`**, rotación del token y CSP | Recomendado por el propio contrato | M | M |
| P2 | Vincular y desvincular Google/Outlook desde Configuración, con SDK real | Hoy los botones solo sirven con mocks | M | M |
| P2 | **Exportar todo** (clientes, citas, catálogo) antes de eliminar la cuenta | Portabilidad; confianza para entrar | M | M |
| P2 | **Registro de accesos** visible para el dueño (quién entró, desde dónde, qué cambió) | Trazabilidad; Stripe lo muestra en su panel (informe 09) | M | S |
| P2 | Guía de primer día por rol (barbero, recepción) | Que el equipo sepa qué ve y qué no | M | S |
| P2 | Medir la activación: tiempo hasta la primera cita, % con reserva publicada, % con equipo invitado | Saber si la puesta en marcha funciona | M | S |

---

## 4. Benchmark

Leyenda: ✓ lo tiene (fuente consultada) · ~ parcial o según terceros · ✗ no consta · ? no verificado en esta
investigación. Las filas de lista de puesta en marcha y migración de Vagaro, Boulevard, Mangomint, Shopify y Toast
vienen del informe 09 (fuentes leídas el 2026-10-17).

### Sector (belleza y barbería)

| Función | Barberlytics | Booksy | Fresha | Vagaro | Square | GlossGenius | Boulevard | Mangomint | AgendaPro |
|---|---|---|---|---|---|---|---|---|---|
| Prueba gratis que se activa sola | ✗ (activación manual) | ✓ 14 días (declarado) | ? | ? | ? | ? | ? | ? | ? |
| Lista de puesta en marcha en pantalla | ✗ (artículo de ayuda) | ? | ? | ✓ QuickStart | ? | ? | ~ con especialista | ~ con gestor | ? |
| Acompañamiento de una persona al empezar | ✗ (ticket) | ✓ experto 1:1 (declarado) | ? | ? | ? | ? | ✓ especialista | ~ gestor | ? |
| Migración gratis hecha por ellos | ✗ | ✓ por soporte (declarado) | ? | ~ (según terceros, 3–5 días) | ✗ | ✓ clientes, citas y notas (declarado) | ✓ especialista | ✓ gratis | ? |
| Importar clientes por CSV, por cuenta propia | ✗ | ? | ✓ plantilla, mapeo y vista previa | ? | ✓ solo CSV | ? | ? | ? | ? |
| Detecta duplicados al importar | ✗ | ? | ✓ marca para fusionar | ? | ? | ? | ? | ? | ? |
| Importar citas | ✗ | ✓ desde Google o Apple Calendar | ? | — | ✗ (comunidad, puede estar desactualizado) | ✓ (declarado) | ? | ~ citas futuras a mano | ? |
| Deja exportar sus citas para irse | ~ CSV por pantalla | ✗ solo por soporte (según Bookedin) | ? | ✗ solo por soporte (según terceros) | ✓ historial en CSV | ? | ? | ? | ? |
| Entrar sin contraseña (celular + código) | ✓ | ? | ? | ? | ? | ? | ? | ? | ? |

### Fuera del sector (referentes de puesta en marcha e importación)

| Referente | Qué aporta a una barbería |
|---|---|
| **Shopify** | Guía de configuración en el Inicio mientras la tienda no está abierta; cambia a métricas tras la primera venta (informe 09). Modelo para «Inicio que cambia cuando ya operas». |
| **Toast** | Checklist antes de la llamada inicial y una fecha de salida a producción: el día en que se deja el modo de prueba (informe 09). Modelo para «barbería de ejemplo → mis datos». |
| **Square for Restaurants** | Sube un archivo o **una foto del menú** y lo convierte en artículos; importa el menú desde Toast o DoorDash con un conector (WoFlow) y deja revisarlo antes de aprobar. La foto solo para comida rápida según su página de Australia. |
| **Aldelo, DiKAS** (TPV de restaurantes) | Constructor de menú con IA desde la cámara o un PDF: artículos, precios y opciones, con revisión del operador (declarado). Patrón exacto para «foto de la lista de precios de la barbería». |
| **Flatfile** | Mapeo automático de columnas que aprende de cada importación (informe 09; su porcentaje de acierto es declarado). Patrón de importador: subir → mapear → validar → corregir en la tabla → confirmar. |
| **Stripe** | Equipo con roles e **historial de seguridad** de inicios de sesión en el panel (informe 09). Modelo para el registro de accesos del dueño. |
| **Twilio Verify** | Antifraude de SMS que bloquea prefijos con tráfico anómalo, espera creciente entre envíos al mismo número y canal WhatsApp con caída a SMS. |
| **Notion, Linear** | ? No verificados en esta investigación. Se citan a menudo por preguntar el uso al registrarse y armar el espacio con eso; no se toma como dato. |

### Hallazgos

1. **La migración se vende con personas, no con software.** Booksy, GlossGenius, Mangomint y Boulevard la ofrecen
   gratis y hecha por su equipo; Fresha y Square dejan importar clientes solos, pero no citas (Square) o con filas
   que se saltan si tienen errores (Fresha). Nadie del sector revisado documenta una importación que **lea** el
   archivo del sistema anterior y lo entienda. Ahí está el hueco.
2. **Los sistemas grandes no dejan irse fácil.** Booksy y Vagaro solo entregan el historial de citas por soporte,
   según las guías de quienes reciben a sus clientes. Una guía «Cámbiate desde Booksy» tiene que explicar cómo pedir
   esa exportación; y Barberlytics debería dejar exportar todo, como señal de confianza.
3. **El orden importa más que las pantallas.** Vagaro (QuickStart), Shopify y Toast ordenan la configuración en
   pasos con progreso. Barberlytics tiene todas las pantallas del recorrido y le falta el orden (ya lo dijo el 09).
4. **El primer contacto es humano.** Booksy asigna un experto 1:1 al suscribirse (declarado); Boulevard y Mangomint
   ponen un especialista o un gestor. Para cadenas (las cuatro sucursales del seed), la puesta en marcha asistida
   por una persona sigue siendo necesaria; la IA la abarata, no la sustituye.
5. **Del menú en foto al catálogo ya es estándar en restaurantes.** Square, Aldelo y DiKAS lo hacen. En barbería no
   se encontró: es un diferencial barato porque la lista de precios de una barbería es corta y casi siempre está en
   una foto, un cartel o el Instagram.

---

## 5. Mercado y tendencias

### El código por SMS en la región

- **Costo.** La tarifa pública de Twilio para Colombia es 0,0592 USD por segmento (leída en el buscador; puede tener
  recargos del operador). Una barbería con 6 personas que entran a diario gasta poco, pero sin límites un ataque de
  *SMS pumping* puede generar miles de envíos en horas.
- **WhatsApp como canal del código.** Meta cobra por plantilla entregada según categoría y país desde el 1 de julio
  de 2025 (informe 09). El precio de la plantilla de **autenticación** en Colombia no se pudo verificar: las fuentes
  de terceros se contradicen (?). Hay que leerlo en la tabla oficial de Meta del trimestre.
- **Resultados declarados de WhatsApp frente a SMS.** Banco Inter (Brasil) reporta +8 puntos en verificación de
  cuentas nuevas y +10 en restablecimiento al pasar el código a WhatsApp (caso de Meta, autodeclarado). Duolingo
  vio mejor entrega y menor costo en 9 de 12 países con WhatsApp y caída a SMS (caso de Twilio). No hay datos
  independientes ni de Colombia o México.
- **Regla práctica**: WhatsApp primero donde el número lo tiene, SMS de respaldo, correo verificado como tercera vía.

### Fraude por cambio de SIM (*SIM swap*)

- **Colombia**: en octubre de 2025 la SIC abrió una investigación a Tigo, Claro, Movistar y WOM por presuntas fallas
  al validar la identidad en la reposición de SIM (prensa; multas posibles de hasta 15.000 SMLMV por operador). La
  prensa lo relaciona con el despliegue de Bre-B. No se encontró una cifra oficial de casos.
- **EE. UU.**: la FCC adoptó en noviembre de 2023 reglas que obligan a los operadores a autenticar y **avisar antes**
  de un cambio de SIM o de portabilidad (cumplimiento desde el 8-jul-2024, según fuentes secundarias). Reduce el
  riesgo, pero no lo elimina.
- **Consecuencia**: el SMS sirve para entrar, pero no debería bastar para cambiar el número, el correo de respaldo o
  las claves de la pasarela.

### Passkeys

- **NIST SP 800-63B-4** clasifica el código por SMS como autenticador **restringido**: se permite si se ofrece una
  alternativa no restringida y se mitigan el *SIM swap* y la portabilidad; reconoce las passkeys sincronizadas
  (fuentes secundarias; confirmar en el texto final de nist.gov ?).
- **Adopción** (FIDO Alliance, declarado): el índice de octubre de 2025 de nueve empresas grandes reporta un 36 % de
  cuentas con passkey y un 26 % de inicios con passkey; el 48 % de los 100 sitios principales las ofrece. En una
  encuesta de mayo de 2025 en cinco países (sin LatAm), el 69 % dice haber activado al menos una.
- **Lectura para Barberlytics**: passkeys como **segundo** método, primero para quien maneja dinero; el celular
  sigue siendo la llave principal porque el barbero promedio no va a configurar una passkey el primer día.

### Datos personales al migrar

- Importar la base de clientes de otro sistema es **tratar datos personales de terceros**. En Colombia el
  responsable es la barbería (Ley 1581 de 2012) y la autorización de marketing no viaja sola con el archivo (ver
  [03-clientes.md](03-clientes.md) §5). El importador debe marcar el consentimiento como «desconocido» y no
  inscribir a nadie en campañas por haber sido importado.
- Las notas de salud (alergias) que vengan del sistema anterior son datos sensibles: importarlas tras el permiso
  `client-info` y avisarlo en la vista previa.

### Tendencias 2025–2026

- **Del formulario a la conversación**: Shopify Sidekick y Square AI proponen y el comerciante aprueba (informe 09).
- **De la plantilla CSV al archivo tal como viene**: importadores que mapean solos y leen PDF o fotos (Flatfile,
  constructores de menú con IA).
- **Antifraude del código como parte del producto**, no como añadido: límites, prefijos bloqueados y riesgo por
  número antes de enviar (Twilio Lookup da un puntaje de riesgo de 0 a 100).

---

## 6. IA

### Datos que ya tenemos (en el contrato o en los mocks)

Los esquemas Zod de cada ajuste y lista (`settingsTypes.ts`), de servicios, productos, equipo y clientes; los
países con su zona horaria (`timezones.ts`); el país, la zona y el número de barberos del registro; los temas
(`src/themes`) y el logo (`/company/branding`); Clipper con voz y acciones (`src/lib/chat`); Claude ya conectado en
el servidor (`server/feedback/analysis.ts`). **Faltan**: ejemplos reales de exportaciones de Booksy, AgendaPro,
Fresha y Square; valores por país (impuestos, festivos, pasarelas) como datos y no como código.

### Casos

| # | Caso | Qué hace | Quién lo usa (fuente) | Cómo aplica a una barbería | Datos: ¿los tenemos? | Tipo | Dificultad | Riesgos |
|---|---|---|---|---|---|---|---|---|
| 1 | **Puesta en marcha por conversación** | El dueño cuenta su negocio y el asistente arma la configuración en borrador | Shopify Sidekick rellena formularios y espera aprobación (informe 09) | «Tengo 2 sedes en Envigado, 6 barberos, corte 35.000, abro de 9 a 8, cierro domingos» → sucursales, horario, servicios y equipo en borrador, cada bloque con «Aplicar» | Esquemas: sí. Valores por país: no | Agéntica + conversacional | M | Dinero mal puesto (impuesto, recargo): nunca aplicar solo; vista previa por bloque |
| 2 | **Lista de precios desde una foto** | Lee la foto del cartel, del Instagram o de un PDF y crea servicios con precio y duración sugerida | Square (menú desde foto), Aldelo, DiKAS (declarado) | Foto del cartel de la pared → «Corte 35.000 · Barba 20.000 · Combo 50.000», categorías y duraciones típicas para revisar | Esquema de servicios: sí | Generativa (visión + extracción) | S–M | Precios mal leídos: resaltar los de baja confianza; nunca publicar sin revisión |
| 3 | **Importador que entiende el archivo** | Mapea columnas, normaliza celulares a E.164, separa nombre y apellido, detecta duplicados y fechas en formatos raros | Flatfile (mapeo con aprendizaje); Fresha (mapeo manual) | Sube el Excel de Booksy o AgendaPro tal como sale; la IA propone el mapeo y explica las filas que no entran | Esquemas de destino: sí. Exportaciones de ejemplo: no | Generativa + reglas | M | Errores silenciosos: informe de filas rechazadas, deshacer, nada se borra |
| 4 | **Importar desde capturas** | Cuando el sistema anterior no exporta, lee capturas de pantalla de la lista de clientes, servicios o agenda | Patrón de los constructores de menú con IA (?) | Recepción hace 10 capturas de la agenda de la semana que viene y la IA arma las citas futuras para revisar | Esquemas: sí | Generativa (visión) | M | Datos personales en imágenes: procesar y borrar; confirmar cita por cita |
| 5 | **Marca desde el logo** | Saca la paleta del isologo y propone tema y acento con contraste comprobado | Canva Brand Kit (informe 09) | Al subir el logo en el paso 1, la reserva ya sale con los colores de la barbería | Logo y temas: sí | Visión o algoritmo | S | Contraste insuficiente: validar con los tokens |
| 6 | **Qué te falta para abrir** | Revisa la configuración y dice qué bloquea operar o qué conviene, con la razón | Toast (checklist con salida a producción, informe 09) | «Tu reserva no está publicada: falta la política de cancelación. 3 barberos sin horario.» | Sí: todo está en `/settings` y en Equipo | Reglas + redacción con LLM | S | Sugerencias de más: una lista corta y ordenada |
| 7 | **Ayuda contextual para entrar** | Responde «no me llega el código» con el estado real (bloqueo, intentos, respaldo configurado) y abre el ticket con el diagnóstico | Agentes de soporte con escalado (Intercom Fin, HubSpot; ver informe 03) | En el login, Clipper explica qué pasó y qué hacer, sin revelar si el número existe | Parcial: sin sesión no puede ver la cuenta | Conversacional | M | Fuga de datos de la cuenta: solo información genérica antes de entrar |
| 8 | **Señales de fraude en el acceso** | Puntúa cada pedido de código (prefijo, ritmo, IP) antes de enviarlo | Twilio Lookup (puntaje de riesgo 0–100), Fraud Guard | Bloquea ráfagas a números de tarificación especial; pide un paso más ante un dispositivo nuevo del dueño | Parcial: hay intentos fallidos; faltan IP y dispositivo | Predictiva (del proveedor) | S (comprado) | Bloquear a un barbero de verdad: siempre con salida |
| 9 | **Bienvenida por rol** | Recorrido corto de lo que ve cada rol, generado con su menú real | Guías del centro de ayuda (`empezar/guia-del-*.md`) | El barbero entra por primera vez y Clipper le muestra su columna, «Lo que llevo» y cómo bloquear su horario | Sí (rol, áreas, ayuda) | Generativa (recuperación) | S | Bajo |

### Top 5 apuestas

1. **Lista de precios desde una foto + importador que entiende el archivo (casos 2 y 3).** Son la puerta de entrada
   comercial: el dueño llega con su cartel y su Excel, no con una plantilla. Corto para la barbería (la lista de
   precios cabe en una foto) y ningún competidor del sector lo documenta.
2. **Puesta en marcha por conversación con Clipper (caso 1)**, sobre la lista de pasos: cada respuesta llena un paso
   en borrador y el dueño aprueba por bloque. Reutiliza Clipper y los esquemas que ya existen.
3. **«Qué te falta para abrir» (caso 6).** Casi todo son reglas sobre datos que ya hay; el LLM solo redacta. Da el
   progreso de la lista y el aviso «tu reserva no está publicada».
4. **Importar desde capturas (caso 4)** para quien viene de un sistema que no deja exportar citas (Booksy y Vagaro,
   según terceros). Diferencial en la conversación de venta: «tráenos tus capturas».
5. **Antifraude del código comprado al proveedor (caso 8)**, junto con los límites del P0. No es IA propia, pero es
   la IA que más dinero ahorra en este módulo.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Cerrar la puerta (2–4 semanas)

- Contrato con `teamRole` y `memberId` en la sesión; el backend comprueba rol y alcance en cada endpoint
  (Configuración, eliminar cuenta, nómina, pasarela). Rol desconocido = sin acceso.
- «Ver como» solo para dueño y administrador, hacia abajo, de solo lectura y borrado al salir; perfiles múltiples
  para quien es dueño y barbero.
- Código: respuesta única en `verify`, límites de envío (como la reserva: 5 en 10 minutos por número, más IP y país),
  cuenta regresiva para reenviar, bloqueo temporal con desbloqueo por correo de respaldo, antifraude del proveedor.
- *Step-up* y avisos para cambiar correo de respaldo, claves de pasarela y eliminar la cuenta.
- Neutralizar fórmulas en `src/lib/csv.ts`. Aterrizar en `ROLE_HOME` al entrar. Cookie `httpOnly` si el backend ya
  está.
- **Éxito:** cero rutas sensibles que dependan solo de la interfaz; tickets de bloqueo por semana; SMS enviados por
  inicio de sesión.

### Fase 2 — Del registro a la primera cita (6–8 semanas)

- Registro que verifica el celular, acepta términos y datos, y entra a la prueba sin esperar.
- Lista de puesta en marcha precargada con el registro: datos y marca → sucursal y horario → servicios → equipo →
  pagos → política → reserva publicada; barbería de ejemplo opcional.
- Invitar al equipo por SMS o WhatsApp; el miembro entra con su celular.
- Importar clientes (CSV/Excel con mapeo, duplicados, vista previa, deshacer) y después servicios, productos y
  equipo; guías «Cámbiate desde Booksy / AgendaPro / Fresha / Square».
- Cambiar mi número sin soporte; lista de sesiones y «cerrar las demás».
- **IA:** «qué te falta para abrir» (caso 6) y marca desde el logo (caso 5).
- **Éxito:** % de registros que agendan su primera cita en 7 días; tiempo hasta la reserva publicada; % de cuentas
  con equipo invitado; clientes importados por cuenta.

### Fase 3 — Configurar conversando (3+ meses)

- Lista de precios desde foto e importador que entiende el archivo (casos 2 y 3); importar desde capturas (caso 4).
- Clipper configura la barbería en borrador con aprobación por bloque (caso 1); bienvenida por rol (caso 9).
- Código por WhatsApp con caída a SMS; passkeys para dueño y administrador; modo tablet de recepción con PIN.
- Importar citas futuras y saldos (regalos, paquetes, membresías); exportar todo antes de irse; registro de accesos.
- **Éxito:** horas de soporte por cuenta nueva; % de importaciones sin intervención humana; % de dueños con passkey.

---

## Fuentes

Consultadas el 2026-10-18 (lectura de resultados del buscador; 15 búsquedas). Lo marcado como «informe 09» se tomó
de las fuentes que ese informe leyó el 2026-10-17. Quedaron sin verificar: el precio de la plantilla de autenticación
de WhatsApp en Colombia, la importación de AgendaPro, el texto final de NIST SP 800-63B-4, el estado de las reglas de
la FCC después de 2024, y las prácticas de registro de Notion y Linear.

**Competidores del sector**
- Booksy, cambiarse a Booksy: https://biz.booksy.com/make-the-switch · https://biz.booksy.com/en-us/who-loves-us/salons
- Salir de Booksy (guías de terceros): https://support.bookedin.com/hc/en-us/articles/4808208961300 · https://jane.app/guide/importing-from-booksy
- Fresha, importar clientes: https://www.fresha.com/help-center/knowledge-base/clients/101243-import-your-existing-client-list · https://www.fresha.com/blog/import-client-list
- Square, importar clientes y citas (comunidad): https://community.squareup.com/t5/Archived-Discussions-Read-Only/How-do-I-import-my-existing-clients-into-Square-s-Appointment/m-p/112611/highlight/true · https://community.squareup.com/t5/Archived-Discussions-Read-Only/How-do-I-transfer-all-appointments-and-client-info-from-another/m-p/174916/highlight/true
- GlossGenius (ficha de la tienda de apps): https://apps.apple.com/app/id1081286979
- Mangomint frente a Vagaro: https://www.mangomint.com/go/switch-from-vagaro-now/
- Salir de Vagaro (guías de terceros): https://support.pocketsuite.io/hc/en-us/articles/5838307494029-How-do-I-transfer-from-Vagaro-to-PocketSuite · https://support.massagebook.com/hc/en-us/articles/42524469847181-Transferring-from-Vagaro-to-MassageBook · https://zoftwarehub.com/en-ae/products/vagaro/zoftware-analysis
- Del informe 09: Vagaro QuickStart, Boulevard y Mangomint (migración), Shopify (lista en el Inicio), Toast (guía de puesta en marcha), Stripe (equipo e historial de seguridad), Flatfile (mapeo), Canva (Brand Kit).

**Importación con IA fuera del sector**
- Square for Restaurants, crear menús (foto y conector): https://squareup.com/help/us/en/article/6424-create-and-update-menus · https://app.squareup.com/help/au/en/article/6424
- Aldelo, AI Menu Builder: https://www.aldelo.com/news/press-release-ai-menu-builder-now-available-for-restaurants
- DiKAS, menú con IA: https://dikas.de/en/blog/speisekarte-per-ki-digitalisieren/

**Código, fraude y passkeys**
- Twilio, prevenir fraude de tarificación y Fraud Guard: https://www.twilio.com/docs/verify/preventing-toll-fraud · https://www.twilio.com/en-us/blog/twilio-verify-fraud-guard-a-powerful-defense-against-sms-pumping-fraud · https://www.twilio.com/en-us/blog/sms-pumping-fraud-solutions
- Twilio, precios de SMS en Colombia: https://www.twilio.com/sms/pricing/co
- WhatsApp frente a SMS: https://whatsappbusiness.com/resources/success-stories/banco-inter/ · https://twilio.com/blog/twilio-verify-whatsapp-to-sms-fallback
- Precios de WhatsApp (terceros, contradictorios): https://zernio.com/blog/whatsapp-business-api-pricing · https://www.messagecentral.com/blog/whatsapp-business-api-pricing-2026
- SIC y operadores (SIM swap, 2025): https://www.vanguardia.com/colombia/2025/10/14/sic-investiga-a-grandes-operadoras-moviles-por-posible-fraude-con-tarjetas-sim/ · https://forbes.co/2025/10/15/actualidad/cuatro-operadores-moviles-investigados-por-fallas-en-seguridad/ · https://www.elcolombiano.com/tecnologia/que-es-sim-swap-nuevo-fraude-usuarios-de-bre-b-EH32066640
- Asobancaria, documento sobre SIM: https://www.asobancaria.com/wp-content/uploads/2023/02/Documento_SimCard_V21022023.pdf
- FCC, reglas contra SIM swap: https://www.jdsupra.com/legalnews/fcc-revises-cpni-and-lnp-rules-to-8018927 · https://www.tlp.law/2023/11/23/fcc-releases-adopted-sim-swapping-port-out-fraud-ro-fnprm/
- NIST SP 800-63B-4 (fuentes secundarias): https://blog.typingdna.com/nist-sp-800-63b-rev-4-sms-otp-is-now-a-restricted-authenticator-but-we-have-the-fix/ · https://www.corbado.com/blog/nist-passkeys
- FIDO Alliance, índice de passkeys y adopción: https://fidoalliance.org/wp-content/uploads/2025/10/FIDO-Passkey-Index-October-2025.pdf · https://www.businesswire.com/news/home/20251013549390/en/FIDO-Alliance-Launches-Passkey-Index-Revealing-Significant-Passkey-Uptake-and-Business-Benefits · https://betanews.com/2025/05/01/research-confirms-consumers-are-turning-to-passkeys-to-protect-their-accounts/

**Internas**
- Centro de ayuda de producción: `centro-de-ayuda/content/es/acceso-y-cuenta/registrar-tu-barberia.md`, `tienes-dos-perfiles.md`, `usuario-bloqueado-por-seguridad.md`, `empezar/primeros-pasos-del-dueno.md`.
- [09-configuracion.md](09-configuracion.md), [03-clientes.md](03-clientes.md), [README.md](README.md), `docs/ROLES_PLAN.md`, `docs/API_CONTRACT.md`.
