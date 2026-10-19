# Paso a producción con cumplimiento legal — investigación

Investigación del 2026-10-19 sobre lo que le falta al rediseño de Barberlytics para atender barberías reales: cambiar el
backend simulado por uno de verdad, operarlo (errores, copias, costos) y cumplir las normas de datos, mensajes, pagos e
IA en los dos mercados del producto: **barberías hispanas en EE. UU. y barberías en Colombia/LatAm**. Solo lectura: no se
tocó código.

> **Esto no es asesoría legal.** Es una lectura de producto hecha a partir de las normas y de la documentación pública de
> los proveedores. Cada punto legal lo debe validar un abogado del país (Colombia) y del estado (EE. UU.) antes de salir.
> Lo no verificado lleva «?» y lo que un proveedor dice de sí mismo se marca **declarado**.

Fuentes internas leídas: `docs/API_CONTRACT.md` (entero), `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `vercel.json`,
`.env.example`, `server/http/request.ts`, `api/*` (whatsapp, tts, clipper, narrative, comments, feedback),
`server/whatsapp/whatsapp.ts`, `server/clipper/clipper.ts` y `turnLog.ts`, `src/mocks/session.ts`, `src/mocks/db.ts`,
`src/mocks/booking/handlers.ts` (cobro con tarjeta), `src/features/booking/flow/usePaymentController.ts`,
`src/features/booking/variants/chat/chatCard.ts`, `src/features/auth/tokenStorage.ts` y `stepUp.ts`,
`src/features/legal/consent.ts`, `src/lib/csv.ts`, `src/lib/clipper/toolCatalog.ts`,
`src/features/team/forms/PaymentsForm.tsx`, y los informes [README.md](README.md), [12-acceso-y-puesta-en-marcha.md](12-acceso-y-puesta-en-marcha.md)
y [07-nomina.md](07-nomina.md). Fuentes externas al final (consultadas el 2026-10-19, 30 búsquedas).

## Resumen ejecutivo

1. **El producto está listo por fuera y no tiene backend.** Todo corre en MSW con una base en `sessionStorage` y **una
   sola barbería**. Lo bueno: `docs/API_CONTRACT.md` es una especificación completa (permisos en el servidor, step-up,
   topes de códigos, tokens de la reserva) y el mock es su versión ejecutable. El backend real se puede escribir contra
   ese contrato y probar con las mismas pruebas.
2. **Hay tres bloqueos técnicos antes de cualquier cliente real**: (a) la reserva manda el **número completo de la
   tarjeta** al propio backend (`card.number`), lo que saca a Barberlytics del cuestionario PCI más simple (SAQ A);
   (b) las funciones reales de Vercel **no piden sesión**: `isFromApp` mira la cabecera `Origin`, que cualquier script
   puede poner, así que cualquiera puede mandar plantillas de WhatsApp a cualquier número o gastar Claude y la voz;
   (c) no hay multi-barbería: la reserva pública (`GET /booking/shop`) no dice de qué barbería es.
3. **El papel legal correcto es el de los competidores**: la barbería es **responsable** (Colombia) o *business/controller*
   (EE. UU.) de los datos de sus clientes y Barberlytics es **encargado** (*service provider/processor*). AgendaPro y
   Fresha lo plantean así. Falta todo el paquete: términos, política de privacidad, política de tratamiento, acuerdo de
   encargo (DPA) con cada barbería y lista de subencargados (Anthropic, Meta, ElevenLabs, Twilio, Vercel, la base).
4. **El riesgo legal más alto son las notas de salud** (alergias y medicamentos): en Colombia son **datos sensibles**
   (autorización explícita y facultativa) y en Washington pueden ser *consumer health data* (ley sin umbral de tamaño y
   con demanda privada). Hoy el equipo las anota sin registrar ese permiso, y AgendaPro **declara** que no recoge datos
   sensibles.
5. **Mensajes**: en Colombia la Ley 2300 limita el horario de la publicidad (lun–vie 7–19 h, sáb 8–15 h, nunca domingo
   ni festivo); en EE. UU. el SMS exige registro **10DLC** y Florida añade 8–20 h y máximo 3 mensajes en 24 h. El código
   ya guarda la versión del consentimiento por país; falta respetar horarios, leer «STOP» de vuelta (webhook) y sacar la
   cola del navegador.
6. **IA**: la API de Anthropic no entrena con los datos y los guarda 30 días por defecto (con retención cero por
   acuerdo); **el plan gratis de Gemini**, que `.env.example` propone como voz por defecto, sí usa lo enviado para
   mejorar productos y permite revisión humana. No sirve para producción. Falta decir siempre «Clipper es un asistente
   de IA» y quitar la etiqueta «IA» donde son reglas (riesgo de publicidad engañosa ante la FTC).
7. **Recomendación**: Vercel (front y API) + **Postgres en Supabase** (us-east-1) con aislamiento por barbería en cada
   tabla + Storage para fotos + **Inngest** para recordatorios y webhooks + Upstash para límites + Sentry. Fijo de
   arranque ≈ 250–450 USD/mes; variable ≈ 10–45 USD por barbería al mes según país y uso de Clipper (§5). Salir en tres
   fases: blindar (6–8 semanas), piloto con 3–5 barberías (4–6 semanas), escalar con SOC 2 cuando lo pida una cadena.

---

## 1. Qué tiene hoy

### Lo que ayuda

| Pieza | Qué aporta a producción | Dónde |
|---|---|---|
| Contrato de API | 756 líneas con formas, errores, topes y la sección «Permisos en el servidor» por rol (barbero solo lo suyo, recepción sin nómina, solo el dueño elimina) | `docs/API_CONTRACT.md` |
| Sesión del lado del servidor | `sessionOf`, `isManager`, `isBarber`, `hasStepUp`: el patrón exacto del *middleware* del backend real | `src/mocks/session.ts` |
| Código de entrada endurecido | Misma respuesta para número no registrado y código malo, 5 códigos cada 15 min, bloqueo de 15 min (no indefinido) | Contrato, Auth |
| Confirmar que eres tú | Token de 5 minutos en `X-Step-Up` para eliminar la barbería, claves de pasarela, dar rol de dueño y correo de respaldo; vive solo en memoria | `src/features/auth/stepUp.ts` |
| Reserva separada de la app | Token propio `x-booking-token`, `403 booking_session` (nunca `401`), el cliente sale del token y no del cuerpo | Contrato, Reserva |
| Consentimiento por país | Textos CO / US / MX / general con versión (`co-2026-10`…) que se guarda con la aceptación y el país | `src/features/legal/consent.ts` |
| Claves que no vuelven | Las pasarelas responden `hasSecret`, los dispositivos `hasAuthKey`; las claves de WhatsApp, Claude y voz solo en el servidor | Contrato, Configuración; `server/*` |
| CSV sin fórmulas | Celdas que empiezan por `=`, `+`, `-`, `@` llevan apóstrofo | `src/lib/csv.ts` |
| Clipper prudente | Las consultas se ejecutan **en la app con la sesión de quien pregunta** (el modelo no ve más que la persona); los registros no llevan la pregunta ni la respuesta; las cifras se verifican; los cambios esperan «Aplicar» | `server/clipper/*`, `src/lib/clipper/toolCatalog.ts` |
| WhatsApp acotado | Solo plantillas fijas, hasta 8 valores de 200 caracteres, número de 8 a 15 dígitos | `server/whatsapp/whatsapp.ts` |
| Cabeceras | HSTS con *preload*, `nosniff`, `X-Frame-Options: DENY`, CSP sin scripts en línea | `vercel.json` |
| Importar con red | `dryRun` y deshacer la tanda | `POST /customers/import` |
| Zona por sede | Recordatorios, `.ics` y plazos con la zona de la sucursal | `src/lib/time/zoned.ts` |

### Lo que estorba

| Pieza | Problema en producción | Dónde |
|---|---|---|
| Base en el navegador | MSW + `sessionStorage`: muere al cerrar la pestaña; una sola barbería y cinco cuentas fijas | `src/mocks/db.ts` |
| Token legible por JavaScript | `sessionStorage`; el contrato recomienda cookie `httpOnly` y no la exige | `tokenStorage.ts` |
| Tarjeta completa en el cuerpo | `card: { number, name, expiry }` va al backend; la versión «Conversación» pide número y CVC por mensajes | `usePaymentController.ts`, `chatCard.ts` |
| Funciones sin sesión | Solo `Origin`/`Referer` y un tope por IP en la memoria de cada instancia | `server/http/request.ts:36-61` |
| Cola en el navegador | La app llama `POST /messages/dispatch` cada minuto mientras haya alguien dentro; sin nadie, no salen recordatorios | Contrato, WhatsApp |
| Imágenes como texto | Logos, fotos de referencia y comprobantes viajan como *data URL* de hasta 1 MB dentro del JSON | Contrato, Identidad y Reserva |
| Sin borrar clientes | No hay `DELETE /customers/:id` ni exportar los datos de un cliente: solo bloquear | Contrato, Clientes |
| Sin observabilidad | No hay Sentry, ni drenaje de registros, ni métricas; solo `console.info` en Clipper | `package.json`, `turnLog.ts` |

---

## 2. Análisis (riesgos de más a menos grave)

| # | Riesgo | Por qué importa | Gravedad |
|---|---|---|---|
| R1 | **Datos de tarjeta pasan por Barberlytics** | Con el número completo en el servidor ya no aplica SAQ A sino el cuestionario largo (SAQ D), y si Barberlytics cobra por cuenta de las barberías es proveedor de servicios (?). Un registro o un error de servidor con el cuerpo de la petición filtra tarjetas | Crítica |
| R2 | **Funciones que gastan dinero abiertas** | `curl -H "Origin: https://<dominio>"` pasa `isFromApp`. Con eso se mandan plantillas de WhatsApp desde el número de la barbería a cualquier número (Meta puede bajar la calidad o bloquear la cuenta; en EE. UU. es un texto no consentido) y se consume Claude y la voz | Crítica |
| R3 | **Notas de salud sin permiso registrado** | Colombia: dato sensible, autorización explícita y facultativa (Ley 1581 arts. 5-6; Decreto 1377). Washington (MHMDA): *consumer health data*, sin umbral, consentimiento aparte y demanda privada; medicamentos aparecen en la definición y las alergias probablemente (?) | Alta |
| R4 | **Sin contratos ni papeles definidos** | Sin DPA la barbería no puede cumplir su deber de tener contrato con su encargado (Colombia: contrato de transmisión; Texas: contrato con el *processor*; CCPA: contrato de *service provider*) | Alta |
| R5 | **Sin aislamiento entre barberías** | El mock no tiene `tenantId`; si el backend olvida filtrar una consulta, una barbería ve los clientes de otra. Es el error más caro de un SaaS | Alta |
| R6 | **Mensajes fuera de norma** | Recordatorios y promociones sin horario legal, sin leer «STOP»/«BAJA» de vuelta y sin registro 10DLC; Florida (FTSA) y TCPA tienen demandas colectivas con daños de 500 USD por mensaje | Alta |
| R7 | **Sin derechos del titular** | No se puede suprimir, exportar ni corregir a pedido los datos de un cliente final, ni hay plazo de conservación | Alta |
| R8 | **Proveedor de IA que entrena** | Gemini gratis usa el contenido para mejorar productos y lo pueden leer revisores humanos; la voz lee nombres y cifras de la barbería | Media |
| R9 | **Sesión robable** | Token en `sessionStorage`: cualquier XSS se lo lleva. CSP con `https://*.thema.dev` (dominio ajeno al producto) | Media |
| R10 | **Operación a ciegas** | Sin errores centralizados, sin copias probadas, sin entornos separados: un incidente se descubre cuando llama el dueño | Media |
| R11 | **Datos bancarios de barberos en claro** | El número de cuenta se guarda y se muestra entero; en Massachusetts y Nueva York «nombre + número de cuenta» es dato personal protegido (201 CMR 17, SHIELD) | Media |
| R12 | **Facturación en Colombia** | Una barbería obligada a facturar debe emitir factura electrónica o POS electrónico DIAN; si la caja de Barberlytics cobra sin emitirlo, la barbería queda expuesta | Media |
| R13 | **«IA» que son reglas** | El README ya lo señaló: insignias de IA sobre reglas fijas. La FTC persigue afirmaciones engañosas sobre IA | Media |
| R14 | **Accesibilidad de la reserva** | En EE. UU. hay demandas por sitios no accesibles (ADA Título III); la reserva es la cara pública | Baja–media |

**Lectura**: R1, R2 y R5 son de ingeniería y se cierran en el backend. R3, R4, R6 y R7 son legales pero se resuelven con
producto (permisos, contratos aceptados al registrarse, horarios, borrado). Nada de esto exige reescribir pantallas.

---

## 3. Qué le falta

P0 = bloquea salir a producción o es riesgo legal. Esfuerzo: S ≤ 1 semana · M 2–4 semanas · L > 1 mes.

| Prioridad | Mejora | Por qué | Esfuerzo | Depende de |
|---|---|---|---|---|
| P0 | **Backend real del contrato** con Postgres, `tenant_id` y `branch_id` en cada tabla, la barbería sacada de la sesión (nunca del cuerpo) y RLS como segunda barrera; pruebas que intentan leer otra barbería | R5; hoy no hay dónde guardar nada | L | Elegir proveedor (§ Arquitectura) |
| P0 | **Sesión en cookie `httpOnly` + `SameSite=Lax`**, opaca, revocable, con caducidad por inactividad; `X-Step-Up` igual que hoy | R9; lo pide el informe 12 | M | Backend |
| P0 | **Funciones con sesión**: `/api/clipper`, `/api/tts`, `/api/narrative` exigen la cookie y cuentan cuota por barbería; `/api/whatsapp/send` deja de ser público (lo llama solo la cola del servidor) | R2 | S | Sesión |
| P0 | **Cobro tokenizado**: campos de tarjeta en el iframe de la pasarela (Stripe Elements / Payment Element; widget de Wompi o Bold en Colombia); al backend solo llega el token. Quitar la tarjeta escrita en la versión «Conversación» o abrir ahí el formulario de la pasarela | R1; PCI SAQ A | M | Pasarela por sucursal (ya existe en Configuración) |
| P0 | **Cola y recordatorios en el servidor** (Inngest o QStash): programar al crear la cita, cancelar al anularla, reintentos, webhook de estados y respuestas de WhatsApp | Hoy sin nadie conectado no sale nada | M | Backend, plantillas aprobadas |
| P0 | **Horarios legales de envío** por país y estado: Colombia lun–vie 7–19, sáb 8–15, sin domingos ni festivos (publicidad); EE. UU. 8–21 (TCPA) y 8–20 en Florida, máximo 3 por asunto en 24 h; lo que caiga fuera se corre a la siguiente franja | R6 | S | Cola en servidor, festivos por país |
| P0 | **«STOP», «BAJA», «HELP»** entrantes por WhatsApp y SMS apagan el permiso de promociones del cliente al momento (y en máximo 10 días hábiles por norma de la FCC ?) y quedan en su historial | TCPA, Ley 1581 (revocatoria) | S | Webhook |
| P0 | **Permiso para datos de salud**: casilla aparte («Autorizo anotar alergias o medicamentos para mi atención»), con versión, fecha y quién; sin permiso, el campo no se guarda; acceso solo a quien atiende; apagado por defecto en sedes de Washington, Nevada y Connecticut (?) | R3 | S | `consent.ts` |
| P0 | **Paquete legal aceptado al registrarse**: términos de servicio, política de privacidad de Barberlytics, política de tratamiento (Colombia), **DPA / acuerdo de encargo** con anexo de subencargados y medidas de seguridad; `acceptTerms` guarda versión y fecha | R4; el registro ya pide `acceptTerms` | M | Abogado CO y US |
| P0 | **Derechos del titular**: suprimir (o anonimizar si tiene cuentas que la ley obliga a conservar), exportar y corregir los datos de un cliente; plazos (Colombia: consultas 10 días hábiles, reclamos 15 ?; CCPA 45 días) y registro de cada solicitud | R7 | M | Backend |
| P0 | **Proveedores de IA con contrato comercial**: Claude por la API comercial (DPA incluido en los términos), voz por un plan pago (ElevenLabs, Azure u OpenAI) y **nunca Gemini gratis**; anotar a cada uno como subencargado | R8 | S | — |
| P0 | **Errores y copias**: Sentry en front y funciones con limpieza de datos personales; PITR de la base y una copia diaria fuera del proveedor; un simulacro de restauración antes del piloto | R10 | S | Backend |
| P0 | **Aviso de privacidad completo** en la reserva: quién es el responsable con su contacto, finalidades, derechos, enlace a la política y que los datos se alojan en EE. UU. con proveedores (Colombia: contenido mínimo del aviso, Decreto 1377 art. 15 ?) | Hoy el texto de `consent.ts` dice «pidiéndolo a la barbería» sin contacto ni enlace | S | Paquete legal |
| P1 | **Límites compartidos** con Upstash Redis (`@upstash/ratelimit`) por IP, por número y por barbería, en vez del `Map` en memoria | Cada instancia de Vercel cuenta por su lado | S | — |
| P1 | **Archivos en almacenamiento privado** (Supabase Storage o S3) con URL firmadas, en vez de *data URL*; saneo de SVG y reducción de imágenes | Fotos del corte y comprobantes pesan y son datos personales | M | Backend |
| P1 | **Registro de auditoría** (quién vio o cambió qué: notas de salud, nómina, claves, exportaciones) visible para el dueño | Responsabilidad demostrada (SIC); lo pidió el informe 12 | M | Backend |
| P1 | **Facturación DIAN por integración** (Alegra o Siigo por API): al cobrar, emitir el documento equivalente POS o la factura electrónica de la barbería obligada; Barberlytics **no** se habilita como proveedor tecnológico | R12 | M | Pasarela y caja |
| P1 | **10DLC y WhatsApp por barbería**: cada barbería registra su marca (o usa número *toll-free* verificado) y su cuenta de WhatsApp Business con el nombre visible del negocio | Sin registro los operadores bloquean el SMS | M | Puesta en marcha |
| P1 | **Número bancario enmascarado y cifrado** como las claves de pasarela (`hasAccount`, últimos 4) | R11 | S | Backend |
| P1 | **Entornos**: desarrollo con MSW, *preview* con datos sintéticos, *staging* y producción; nunca datos reales fuera de producción | R10 | S | Backend |
| P1 | **Aviso de IA y quitar «IA» donde son reglas**; Clipper se presenta como asistente de IA en la app, la reserva y WhatsApp, con salida a una persona | R13; Meta exige que el bot sea del negocio | S | — |
| P1 | **Accesibilidad WCAG 2.1 AA** de `/reservar` y el widget, con prueba automática (axe) en e2e | R14 | M | — |
| P1 | **Retención**: borrar o anonimizar clientes sin visitas en N años, comprobantes según la norma tributaria (Colombia 5 años ?; EE. UU. 3–7 ?), registros de servidor 30–90 días | Minimización (Ley 1581, CCPA) | S | Backend |
| P2 | **SOC 2 Tipo I → Tipo II** con Vanta o Drata cuando una cadena o franquicia lo pida | Venta a cuentas grandes | L | Todo lo anterior |
| P2 | **Retención cero** con Anthropic y ElevenLabs (planes empresa) | Menos superficie si un proveedor sufre una brecha | S | Volumen |
| P2 | **Prueba de penetración** externa antes de abrir a todo el público | Base para SOC 2 y seguros | M | Fase 2 |
| P2 | **Página de confianza** (subencargados, medidas, estado del servicio, contacto de seguridad) | Las barberías y sus contadores la piden | S | Paquete legal |

### Arquitectura recomendada

| Capa | Opción recomendada | Alternativas | Por qué |
|---|---|---|---|
| Front | Vercel (como hoy) | Cloudflare Pages | Ya está; cabeceras y CSP en `vercel.json` |
| API | Funciones de Vercel (Node) con un enrutador (Hono) que implementa `docs/API_CONTRACT.md` | Un servidor en Fly.io / Render / Railway | El contrato es pedir-responder; lo largo va a la cola. Si llega tiempo real pesado o voz en vivo, mover a servidor |
| Base | **Supabase Postgres, Pro**, región us-east-1 | Neon (Postgres sin servidor, ramas por *preview*); AWS RDS | Postgres + Storage + Realtime + copias en un solo proveedor; informe SOC 2 disponible en el plan Team (599 USD/mes) cuando haga falta |
| Multi-barbería | Esquema compartido con `tenant_id` en todas las tablas + RLS + capa de datos que lo inyecta desde la sesión | Una base por barbería | Miles de barberías pequeñas: una base por barbería no escala en costo |
| Sesión y OTP | Sesiones propias en Postgres (cookie opaca) y envío del código por **WhatsApp (plantilla de autenticación) con caída a SMS**; Twilio Verify si se quiere el antifraude hecho | Supabase Auth con teléfono | El contrato ya define topes, bloqueo y step-up a su manera; adaptarlos a Supabase Auth cuesta más que escribirlos |
| Cola y cron | **Inngest** (esperar hasta la hora del recordatorio y cancelar si la cita se anula; reintentos; webhooks) | Upstash QStash (más barato, más manual); Trigger.dev; `pg_cron` | Los recordatorios son «dormir hasta X salvo que pase Y»: es justo su modelo |
| Archivos | Supabase Storage, cubetas privadas y URL firmadas | S3 + CloudFront | Mismo proveedor que la base |
| Búsqueda | Postgres `pg_trgm` + `unaccent` (nombres con tilde, celulares) | Algolia, Typesense | Los volúmenes por barbería son pequeños |
| Tiempo real | Consultas cada 15–30 s al principio; Supabase Realtime para la agenda y la fila viva después | Pusher, Ably | Empezar simple |
| Límites | Upstash Redis | Vercel KV | Compartido entre instancias |
| Errores y registros | Sentry (Team) + drenaje de registros de Vercel a Axiom o Better Stack | Datadog | Barato al inicio |
| Correo | Resend o Postmark | SES | Recibos y código por correo de respaldo |

**Migración desde dash.barberlytics.com.** No se revisó el sistema actual (?). Pasos: (1) inventario de lo que guarda y
dónde; (2) exportar por barbería a un formato intermedio y mapear al contrato (cliente, cita, servicio, miembro,
cobro), con tabla de equivalencia de ids viejos y nuevos; (3) correr la importación en seco (`dryRun`, como
`/customers/import`) y mostrar al dueño lo que entra y lo rechazado; (4) celulares a E.164, duplicados por celular;
(5) el permiso de promociones viaja solo con prueba (versión y fecha), si no queda «desconocido»; las notas de salud,
solo con su permiso o marcadas para pedirlo en la próxima visita; (6) una o dos semanas en paralelo con el sistema viejo
en solo lectura y corte por barbería un lunes temprano, con plan de vuelta atrás; (7) en Colombia, cambiar de encargado
no exige nueva autorización del cliente si el responsable y las finalidades son los mismos, pero sí contrato de
transmisión con el nuevo encargado (?).

---

## 4. Benchmark

Leyenda: ✓ consta en su documentación · ~ parcial o según terceros · ✗ no consta · ? no verificado.

| Tema | Barberlytics hoy | Booksy | Fresha | Square | Vagaro | AgendaPro |
|---|---|---|---|---|---|---|
| Papel frente a los clientes del negocio | ✗ sin definir | ? | ✓ encargado (DPA dentro de los términos de socios) | ? | ? | ✓ encargado de los usuarios finales; responsable de los datos del comercio |
| DPA público | ✗ | ? (política de Booksy International Sp. z o.o.) | ✓ terms.fresha.com/data-protection, UK GDPR + cláusulas tipo de la UE | ? | ? | ~ en la política de privacidad |
| Dónde aloja los datos | Navegador (mock) | ? | ? | ? EE. UU. | ? EE. UU. | ✓ «fuera del territorio nacional» (declarado) |
| Datos sensibles | Sí, alergias y medicamentos | ? | ? | ? | ~ dice cumplir HIPAA (según terceros) | ✓ declara que **no** los recoge |
| Certificaciones | ✗ | ? | ? | ~ PCI como procesador (?) | ~ PCI, SOC 2, ISO 27001 (según terceros) | ? |
| Cobro con tarjeta | Número al backend | ? | Procesador propio (?) | ✓ procesador propio | ✓ procesador propio | ? integraciones |

**Pequeños comparables**: los SaaS de agenda que venden a empresas (Cal.com, Calendly) publican página de confianza con
SOC 2 Tipo II (declarado, ?). Para una barbería sola no es decisivo; para una cadena o franquicia, sí.

**Hallazgos**

1. **El papel de encargado es el estándar.** Fresha lo pone en un anexo que se acepta con los términos y que prevalece
   sobre ellos en lo de datos; AgendaPro lo dice en su política para Colombia. Barberlytics debe copiar esa forma: un
   DPA estándar aceptado en el registro, sin negociación por barbería.
2. **AgendaPro evita los datos sensibles; Barberlytics los usa.** Las alergias son útiles en barbería (tintes,
   productos), pero cada uno suma obligaciones. La decisión tiene que ser consciente: o se piden con permiso aparte y
   acceso limitado, o se reemplazan por una nota neutra («revisar productos antes de aplicar») sin el dato médico.
3. **Los grandes procesan los pagos ellos mismos.** Square y Vagaro son procesadores; Barberlytics no lo será. Por eso
   tiene que mantener la tarjeta **fuera** de su servidor con los campos alojados de la pasarela.
4. **Lo que no se encontró**: dónde alojan Booksy y Fresha, y certificaciones verificables de casi todos. Las
   certificaciones se entregan bajo acuerdo de confidencialidad; las cifras de terceros no se toman como dato.

---

## 5. Costos

Supuestos (?): barbería de 4 barberos, ~600 citas al mes, 3 mensajes por cita (confirmación y dos recordatorios),
100 mensajes de promoción, 60 inicios de sesión del equipo y 200 códigos de clientes al pagar, 150 preguntas a Clipper.
Precios públicos leídos en el buscador; los de WhatsApp en Colombia se contradicen entre fuentes.

### Variable por barbería al mes (USD)

| Concepto | EE. UU. | Colombia | Nota |
|---|---|---|---|
| WhatsApp utilidad (1.800 plantillas) | ≈ 7 (0,004 c/u) | ≈ 1,5–9 (0,0008–0,0049 ?) | Gratis si la ventana de 24 h está abierta por el cliente |
| WhatsApp promociones (100) | ≈ 2,5 (0,025) | ≈ 1,3–2,4 (?) | Solo a quien aceptó |
| Códigos (260) con WhatsApp de autenticación / SMS propio | ≈ 3–4 | ≈ 1–6 (?) | Con Twilio Verify (0,05 USD por verificación + canal) sube a ≈ 15 |
| SMS de respaldo y 10DLC | ≈ 1,5–10 (campaña mensual) + 4,50 una vez | — | Solo EE. UU.; si cada barbería es su propia marca |
| Claude en Clipper (150 preguntas × ~3 pasos) | ≈ 6–15 | ≈ 6–15 | Referencia Sonnet 3/15 USD por millón de tokens; el precio del modelo configurado (`claude-sonnet-5-5`) no se verificó (?); con caché de *prompt* baja a la mitad o menos |
| Narración (Haiku) | < 0,5 | < 0,5 | Pocas llamadas cortas |
| Voz de Clipper | ≈ 0,3–5 (?) | ≈ 0,3–5 (?) | Depende del proveedor pago y de cuánto se use el modo voz |
| Infraestructura prorrateada | ≈ 2–4 | ≈ 2–4 | Con ~100 barberías sobre el fijo de abajo |
| **Total aproximado** | **≈ 25–45** | **≈ 12–35** | Sin pasarela (la paga la barbería) ni facturación DIAN |

Facturación DIAN: si se integra Alegra, su plan Pyme cuesta 163.900 COP/mes (blog de Alegra, interesado); lo paga la
barbería o se negocia tarifa de socio (?).

### Fijos al mes (USD)

| Concepto | Arranque | Con SOC 2 / ~500 barberías | Nota |
|---|---|---|---|
| Vercel Pro | 20 por persona del equipo | 60–150 + uso | Funciones y drenaje de registros |
| Supabase | 25 + cómputo (10–110) + PITR (≈ 100 ?) | 599 (Team, informe SOC 2) + cómputo | Copias diarias 7 días en Pro |
| Inngest | 0–75 | 75–300 (?) | Se cobra por paso; QStash ≈ 1 USD por 100 mil mensajes |
| Upstash Redis | 0–10 | 10–50 | Límites |
| Sentry Team | 26–29 | 80+ | 50 mil errores incluidos |
| Correo (Resend/Postmark) | 15–20 | 50+ | |
| Copia externa (S3 en otra cuenta) | < 5 | 10–30 | |
| **Total** | **≈ 250–450** | **≈ 1.000–1.600** | |

Una vez o por año (?): abogado Colombia + EE. UU. para términos, privacidad, DPA y revisión de textos (≈ 3.000–15.000
USD); seguro de ciberriesgo y de errores y omisiones (≈ 1.500–5.000 USD/año); SOC 2 Tipo I con Vanta/Drata y auditor
(≈ 20.000–45.000 USD el primer año); prueba de penetración (≈ 5.000–15.000 USD).

---

## 6. Lista de verificación para salir

**Backend y datos**
- [ ] Todos los endpoints del contrato implementados y la suite de pruebas del mock corriendo contra el backend real.
- [ ] `tenant_id` en todas las tablas; prueba automática que intenta leer, escribir y exportar datos de otra barbería y falla.
- [ ] Rol y ficha (`teamRole`, `memberId`) sacados de la sesión; rol desconocido = sin acceso.
- [ ] Reserva pública con la barbería en la ruta o el dominio (`/b/<slug>`), no implícita.
- [ ] Archivos en almacenamiento privado; nada de *data URL* en la base.

**Seguridad**
- [ ] Cookie `httpOnly`, `Secure`, `SameSite=Lax`; protección CSRF en lo que cambia datos.
- [ ] Funciones de `api/` con sesión; `/api/whatsapp/send` sin acceso público; `GET /api/comments` con sesión.
- [ ] Límites en Redis por IP, número y barbería; antifraude de SMS por prefijo.
- [ ] CSP con el `connect-src` real, sin `*.thema.dev`, con los dominios de la pasarela en `script-src` y `frame-src`.
- [ ] `X-Frame-Options`/`frame-ancestors` que permita el widget de reserva solo donde la barbería lo pegue (hoy `DENY` en todo ?).
- [ ] Secretos por entorno en Vercel; claves de pasarela y número bancario cifrados; rotación documentada.
- [ ] Dependencias con alerta (Dependabot) y prueba de penetración antes de abrir al público.

**Pagos**
- [ ] Tarjeta solo en los campos alojados de la pasarela; al servidor llega un token.
- [ ] La versión «Conversación» no pide la tarjeta por mensajes.
- [ ] SAQ A firmado (y, si se cobra por cuenta de las barberías, confirmar con un QSA si aplica SAQ D de proveedor ?).

**Colombia**
- [ ] Política de tratamiento de Barberlytics (como responsable de sus usuarios) y modelo para cada barbería.
- [ ] Contrato de transmisión (acuerdo de encargo) aceptado por cada barbería; subencargados listados.
- [ ] Aviso de privacidad con contacto del responsable, finalidades, derechos, enlace a la política y alojamiento en EE. UU.
- [ ] Autorización aparte para alergias y medicamentos; prueba guardada.
- [ ] Canal para consultas y reclamos con plazos; registro de cada solicitud.
- [ ] RNBD: la barbería solo si tiene activos > 100.000 UVT (Decreto 090 de 2018); Barberlytics revisa su propio caso con el abogado (?).
- [ ] Publicidad dentro del horario de la Ley 2300 y sin domingos ni festivos.
- [ ] Facturación: integración DIAN activa para las barberías obligadas.
- [ ] Procedimiento de incidentes con reporte a la SIC (plazo según la Circular Única ?).

**Estados Unidos**
- [ ] Términos, privacidad (con aviso al recolectar, «no vendemos») y DPA de *service provider/processor*.
- [ ] Consentimiento escrito para promociones por texto (ya en `consent.ts`), STOP/HELP entrantes atendidos.
- [ ] 10DLC (o *toll-free* verificado) registrado antes del primer SMS.
- [ ] Horarios 8–21 (8–20 en Florida) y máximo 3 por asunto en 24 h en Florida.
- [ ] Notas de salud apagadas por defecto en Washington (MHMDA) y con permiso aparte en todos los estados.
- [ ] CAN-SPAM en correos de promoción: dirección física, baja en un clic, asunto honesto.
- [ ] Reserva WCAG 2.1 AA; prueba con lector de pantalla.
- [ ] Menores: la reserva la hace un adulto; no se crean cuentas a menores de 13 (COPPA).
- [ ] Propinas: se pagan íntegras al barbero empleado y se reportan aparte por persona (FLSA y deducción de propinas de 2025).
- [ ] Plan de notificación de brechas por estado (Massachusetts y Nueva York incluidos).

**IA**
- [ ] Claude por la API comercial; voz con plan pago; Gemini gratis fuera.
- [ ] «Clipper es un asistente de IA» visible en la app, la reserva y WhatsApp; salida a una persona.
- [ ] Sin insignia «IA» sobre reglas.
- [ ] Lo que Clipper envía al modelo, documentado en la política (sin teléfonos ni notas de salud, como hoy).

**Operación**
- [ ] Sentry con limpieza de datos personales; alertas a un canal; página de estado.
- [ ] PITR + copia diaria externa; simulacro de restauración hecho y cronometrado (objetivo: perder ≤ 5 min, volver en ≤ 4 h).
- [ ] Entornos separados; datos sintéticos fuera de producción.
- [ ] Guía de incidentes (quién decide, cómo se avisa a las barberías y en cuánto tiempo, p. ej. ≤ 72 h en el DPA).
- [ ] Meta de disponibilidad publicada (99,5 % el primer año ≈ 3,6 h al mes) y horario de soporte.
- [ ] Tablero de costo por barbería (mensajes, tokens, voz) con tope y aviso.

---

## 7. Hoja de ruta en 3 fases

### Fase 1 — Blindar (6–8 semanas)

- Backend del contrato sobre Supabase con `tenant_id`, RLS y sesiones en cookie; reserva con barbería en la ruta.
- Funciones de `api/` con sesión y cuota por barbería; límites en Redis; CSP limpia.
- Cobro con campos alojados de la pasarela (Stripe en EE. UU., Wompi o Bold en Colombia).
- Cola en Inngest: recordatorios en el servidor, horarios legales, webhooks de WhatsApp con STOP/BAJA.
- Permiso aparte para datos de salud; borrar y exportar un cliente; aviso de privacidad completo.
- Paquete legal redactado por abogados y aceptado en el registro; lista de subencargados; voz con plan pago.
- Sentry, PITR, copia externa y entornos.
- **Éxito:** cero datos de tarjeta en el servidor; prueba de aislamiento entre barberías en verde; ninguna función
  pagada sin sesión.

### Fase 2 — Piloto controlado (4–6 semanas)

- 3–5 barberías (al menos una en Colombia y una en EE. UU.), migradas desde dash.barberlytics.com con importación en
  seco y semana en paralelo.
- 10DLC y WhatsApp Business por barbería en la puesta en marcha; integración DIAN (Alegra o Siigo) para las obligadas.
- Simulacro de restauración y de incidente; prueba de penetración; accesibilidad de `/reservar`.
- Registro de auditoría visible para el dueño; datos bancarios enmascarados; plazos de conservación aplicados.
- **Éxito:** recordatorios entregados ≥ 98 %; cero tickets de «no me llegó el código» sin resolver en 24 h; costo
  real por barbería dentro de la tabla del §5.

### Fase 3 — Escalar (3+ meses)

- Apertura general con página de confianza y estado del servicio.
- SOC 2 Tipo I cuando una cadena o franquicia lo pida, Tipo II al año; retención cero con Anthropic y ElevenLabs.
- Realtime para la agenda; revisar si la API pasa a un servidor propio por costo o latencia.
- Revisión anual de normas: regla «revocar todo» de la FCC (enero 2027), ley de IA de Colorado tras la sesión de 2026,
  nuevas leyes estatales de privacidad y cambios de la SIC.
- **Éxito:** horas de ingeniería por incidente; costo de infraestructura por barbería; tiempo de respuesta a una
  solicitud de un titular.

---

## Normas por mercado (resumen)

| Tema | Colombia | Estados Unidos |
|---|---|---|
| Datos personales | Ley 1581 de 2012, Decreto 1377 de 2013 (hoy en el Decreto 1074 de 2015): autorización previa, expresa e informada; política de tratamiento; aviso de privacidad; derechos de conocer, actualizar, rectificar, suprimir y revocar | Sin ley federal. CCPA/CPRA solo para empresas > 26,6 millones USD de ingresos o 100 mil consumidores de California: las barberías no llegan, pero Barberlytics debe firmar como *service provider*. Texas (TDPSA): exime a la pequeña empresa salvo vender datos sensibles; exige contrato con el *processor*. Florida: solo empresas de más de mil millones. Nueva York: SHIELD (seguridad y brechas). Massachusetts: 201 CMR 17 (programa escrito de seguridad para quien guarda «nombre + cuenta financiera» de residentes) |
| Datos de salud | Sensibles: autorización explícita y facultativa | Washington MHMDA (sin umbral, demanda privada); Nevada y Connecticut parecidos (?) |
| Biometría | Dato sensible | Illinois BIPA solo si se mide el rostro (no hacer reconocimiento facial con las fotos de cortes) |
| Registro de bases | RNBD ante la SIC solo para sociedades con activos > 100.000 UVT (Decreto 090 de 2018) | No aplica |
| Envío internacional | EE. UU. está en la lista de países adecuados de la SIC (Circular 005 de 2017); al encargado se le **transmite** con contrato | — |
| IA | SIC, Circular Externa 002 de 2024: proporcionalidad, responsabilidad demostrada, autorización previa | FTC (afirmaciones engañosas); ley de IA de Colorado (SB 24-205) aplazada al 30-jun-2026 y en revisión (?), centrada en decisiones de alto riesgo que no aplican a la agenda; leyes de aviso de bots (California, Utah ?) |
| Mensajes | Ley 2300 de 2023 (horario de publicidad); Registro de Números Excluidos de la CRC (?) | TCPA (consentimiento escrito para promociones; revocar por cualquier medio razonable desde abril de 2025; «revocar todo» aplazado a enero de 2027); 10DLC; Florida FTSA (8–20 h, 3 en 24 h); CAN-SPAM |
| Facturación | Factura electrónica y documento equivalente POS electrónico (Res. DIAN 000165 de 2023, calendario de 2024) | *Sales tax* estatal (ya en el producto) |
| Laboral | Ley 2466 de 2025 (informe 07) | FLSA: el empleador no puede quedarse con propinas; deducción federal de propinas de 2025 exige reportarlas aparte (informe 07) |
| Menores | Datos de niños solo con interés superior y representante (?) | COPPA (regla enmendada en 2025) si se recogen datos de menores de 13 en línea |
| Accesibilidad | — | ADA Título III (demandas), WCAG 2.1 AA como referencia |

---

## Errores encontrados

Comprobados en el código de esta copia (`4b7774e`).

| Gravedad | Error | Dónde |
|---|---|---|
| Alta | **La tarjeta completa viaja al backend de Barberlytics**: la reserva, los paquetes y las tarjetas de regalo mandan `card: { number, name, expiry }` y el mock lo cobra; el comentario dice «El CVC no se manda: va a la pasarela», pero no hay pasarela en el navegador. En producción saca a Barberlytics de SAQ A | `src/features/booking/flow/usePaymentController.ts:131`, `src/mocks/booking/handlers.ts:148-165` |
| Alta | **La versión «Conversación» pide número y CVC por mensajes** del chat; en el hilo se enmascaran, pero los datos pasan por el código de la app | `src/features/booking/variants/chat/chatCard.ts:98-145` |
| Alta | **`/api/whatsapp/send` envía plantillas a cualquier número** con solo poner la cabecera `Origin` del sitio (un `curl` la pone); lo mismo gasta Claude y la voz en `/api/clipper`, `/api/tts` y `/api/narrative`. El propio archivo avisa que en producción debe dejar de ser público | `server/http/request.ts:36-44`, `api/whatsapp/send.ts` |
| Media | **Tope por IP en la memoria de cada instancia**: con varias instancias el límite se multiplica (documentado en el código) | `server/http/request.ts:47-61` |
| Media | **No se puede borrar ni exportar un cliente**: el contrato no tiene `DELETE /customers/:id` ni exportación por titular; solo bloquear | `docs/API_CONTRACT.md` (Clientes) |
| Media | **Alergias y medicamentos sin permiso registrado**: se anotan desde la agenda (`/clients/:id/notes`, `kind: allergy \| medication`) y Clipper puede proponerlas (`proponer_nota_cliente`) sin pedir ni guardar la autorización del cliente | Contrato (Calendario), `src/lib/clipper/toolCatalog.ts:135` |
| Media | **`.env.example` elige Gemini gratis como voz** («gratis… sin tarjeta»); en ese plan Google usa lo enviado para mejorar sus productos y puede revisarlo una persona | `.env.example` (bloque de voz), `server/tts/tts.ts` |
| Media | **CSP con un dominio ajeno** (`https://*.thema.dev` en `connect-src`) y sin lugar para la pasarela (`script-src 'self'`, `frame-src 'none'`): Stripe Elements o el inicio con Google no cargarían | `vercel.json` |
| Media | **Número de cuenta bancaria del barbero entero** en la respuesta y en pantalla | `src/features/team/forms/PaymentsForm.tsx:77-78`, `src/features/team/types.ts:56` |
| Media (contrato) | **La reserva pública no identifica la barbería** (`GET /booking/shop`, `/booking/catalog?branchId`): con varias barberías hace falta un *slug* o dominio | `docs/API_CONTRACT.md` (Reserva en línea) |
| Baja | **`GET /api/comments` sin control** de origen ni sesión: cualquiera lee la hoja de comentarios de revisión | `api/comments/index.ts` |
| Baja | **Aviso de privacidad de Colombia incompleto**: no da el contacto del responsable, ni el enlace a la política de tratamiento, ni que los datos se alojan en EE. UU. | `src/features/legal/consent.ts` (paquete `CO`) |
| Baja | **«Compartir» en el 👍/👎 de Clipper** deja la pregunta y la respuesta en los registros de Vercel; pueden traer datos de un cliente que no consintió (el consentimiento es del empleado) | `server/clipper/turnLog.ts` |
| Baja | **`X-Frame-Options: DENY` en todas las rutas** choca con un widget de reserva si este usa un iframe (no se pudo ver el script del widget, `widgets.example.com`) (?) | `vercel.json`, `src/mocks/settings/seed.ts:65` |

---

## Fuentes

Consultadas el 2026-10-19 (lectura de resultados del buscador; 30 búsquedas). Quedaron sin verificar: tarifas oficiales
de WhatsApp en Colombia (las fuentes se contradicen), el precio de los modelos `*-5-5` de Anthropic, el precio del PITR de
Supabase, dónde alojan Booksy, Fresha, Square y Vagaro y sus certificaciones, el estado de la ley de IA de Colorado tras
la sesión de 2026, el plazo de reporte de incidentes a la SIC y el plazo de 10 días hábiles de la FCC.

**Colombia (normas oficiales)**
- Ley 1581 de 2012: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981
- Decreto 1377 de 2013: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646
- Decreto 090 de 2018 (RNBD): https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=85039
- Ley 2300 de 2023: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=213990
- SIC, Circular Externa 002 de 2024 (IA y datos personales): https://sedeelectronica.sic.gov.co/sites/default/files/normativa/Circular%20Externa%20No.%20002%20del%2021%20de%20agosto%20de%202024.pdf
- SIC, Circular Externa 005 de 2017 (países adecuados): https://operaciones.colombiacompra.gov.co/sites/cce_public/files/cce_informe_seguimiento/superindustria-circularexterna-2017-n0000005_20170810_1.pdf · https://www.hklaw.com/en/insights/publications/2017/08/cambios-en-la-transferencia-de-datos-personales-a
- DIAN, Resolución 000165 de 2023: https://normograma.mintic.gov.co/docs/pdf/resolucion_dian_0165_2023.pdf · calendario modificado (Res. 000008 de 2024): https://incp.org.co/agendatributariaincp/?p=1795
- Alegra (precio, fuente interesada): https://blog.alegra.com/colombia/alegra-vs-siigo-colombia/

**Estados Unidos (normas y reguladores)**
- FCC, TCPA y telemercadeo: https://www.fcc.gov/general/telemarketing-and-robocalls · revocación de consentimiento (aplazamientos): https://nixonpeabody.com/insights/alerts/2025/04/11/fcc-partially-delays-new-tcpa-consent-revocation-rules · https://www.gmlaw.com/news/fcc-extends-waiver-on-revocation-of-consent-rules-delaying-broad-applicability-until-2027-2/
- CCPA (Fiscalía de California): https://oag.ca.gov/privacy/ccpa · umbral 2025: https://www.okta.com/legal/ccpa/
- Texas TDPSA (Fiscalía de Texas): https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act
- Washington My Health My Data: https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy · https://www.bakerlaw.com/insights/examining-the-private-right-of-action-in-washingtons-my-health-my-data-act
- Massachusetts 201 CMR 17 (lista de chequeo oficial): https://www.mass.gov/doc/201-cmr-1700-compliance-checklist-0/download
- Florida FTSA (reforma de 2023): https://www.consumerfinancialserviceslawmonitor.com/2023/05/florida-legislature-narrows-litigation-spawning-telephone-solicitation-act/
- Colorado SB 24-205 (aplazamiento): https://www.gtlaw.com/en/insights/2025/9/colorado-delays-comprehensive-ai-law-with-further-changes-anticipated
- FTC, CAN-SPAM: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business · COPPA: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- Departamento de Trabajo, propinas (FLSA): https://www.dol.gov/agencies/whd/fact-sheets/15-tipped-employees-flsa
- ADA, guía de accesibilidad web: https://www.ada.gov/resources/web-guidance/

**Pagos**
- PCI SSC, biblioteca de documentos (SAQ A): https://www.pcisecuritystandards.org/document_library/
- Cambios de SAQ A en 2025: https://www.akamai.com/blog/security/pci-dss-v4-0-1-changes-qualify-saq-a
- Stripe, guía de seguridad e integración PCI: https://docs.stripe.com/security/guide

**IA y mensajería**
- Anthropic, DPA: https://www.anthropic.com/legal/data-processing-addendum · uso y retención de datos: https://docs.claude.com/en/docs/claude-code/data-usage
- Gemini API, términos adicionales (servicios no pagos): https://ai.google.dev/gemini-api/terms · https://simonwillison.net/2024/Oct/17/gemini-terms-of-service
- ElevenLabs, retención cero: https://elevenlabs.io/docs/resources/zero-retention-mode
- Meta, precios de WhatsApp: https://developers.facebook.com/docs/whatsapp/pricing · terceros (cifras contradictorias): https://www.messagecentral.com/blog/whatsapp-business-api-pricing-2026
- Meta, chatbots de propósito general (enero de 2026): https://www.dataslayer.ai/blog/meta-bans-general-purpose-ai-chatbots-on-whatsapp-business
- Twilio Verify, precios: https://www.twilio.com/en-us/verify/pricing · 10DLC: https://support.twilio.com/hc/en-us/articles/1260803965530

**Infraestructura**
- Supabase, precios: https://supabase.com/pricing
- Vercel Pro: https://vercel.com/docs/plans/pro
- Sentry, precios: https://sentry.io/pricing/
- Colas sin servidor (Upstash, comparación 2026): https://upstash.com/blog/serverless-background-jobs-and-message-queues-every-major-option-in-2026 · Inngest: https://www.inngest.com/pricing · Trigger.dev: https://trigger.dev/pricing

**Competidores**
- Fresha, anexo de protección de datos: https://terms.fresha.com/data-protection
- Booksy, privacidad: https://biz.booksy.com/en-us/privacy-policy
- AgendaPro, privacidad para usuarios finales (Colombia): https://agendapro.com/co/politica-de-privacidad-clientes · https://agendapro.com/co/politica-de-privacidad
- Vagaro (perfil de terceros): https://security-profiles.nudgesecurity.com/app/vagaro-com

**Internas**
- [README.md](README.md), [12-acceso-y-puesta-en-marcha.md](12-acceso-y-puesta-en-marcha.md), [07-nomina.md](07-nomina.md), `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/FEEDBACK_LOOP.md`.
