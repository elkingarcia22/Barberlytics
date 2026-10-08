# Centro de ayuda de Barberlytics — plan

Estado: **fase 1 construida** (2026-09-24). Decisiones tomadas: contenido en el repo aparte
[`Barberlytics/centro-de-ayuda`](https://github.com/Barberlytics/centro-de-ayuda)
(publicado en GitHub Pages), interfaz en este repo (`src/help/`), permiso para tocar `app-shell` y
`package.json`, español primero, «tú», y el contenido empieza por Acceso y cuenta.

Un solo sistema con dos lectores: la persona que usa Barberlytics y una IA que responde
preguntas con esta misma base. Por eso el contenido es Markdown puro con metadatos, y la
web que lo muestra es una capa aparte, hecha con el sistema de diseño Thema.

Referentes: Notion (estructura y tono), Slack (búsqueda que prioriza), Mintlify (Markdown
como fuente, `llms.txt` para agentes), Linear y Stripe (navegación lateral + índice por página).

---

## 1. Qué sabemos hoy (de dónde sale el contexto)

| Fuente | Qué aporta |
|---|---|
| Repo (`src/app`, `src/features`) | Rutas reales: login por teléfono + código SMS, Google y Microsoft, «olvidé mi número»; Panel; Equipo (5 roles: owner, admin, recepción, barbero a comisión, barbero en renta); Usuarios; Configuración (17 ajustes en 4 grupos). Calendario, Clientes, Servicios, Productos, Gastos, Nómina y Transacciones son placeholders «En construcción». |
| Notion «Barberlytics OS» | Voz de marca (clara, directa, de alguien que conoce la barbería, sin jerga corporativa). Copy oficial de tiendas en español. Onboarding v2 (diagnóstico por dolor, no por marca). Flujo de reservas «sin preferencia» con lineup ordenado por el dueño. Motores: AVF/ritmo de visita, churn, ocupación (meta 80 %), indicador de precios (80/80 → subir 5-10 %), reservas proactivas, seis cifras, P&L, suite del dueño. |
| Artefactos de Claude | Nómina por tipo de cliente (nuevo, retenido, repite, leal, recuperado / walk-in, sin preferencia; tarifas Starter-Standard-Senior-Partner; renta y salario). Calibración trimestral de barberos (En demanda, En desarrollo, Necesita atención; auto-evaluación y firma del dueño). |
| Sesiones anteriores de Claude Code | Logo y marca, login premium, landing early adopters. |

Lo que **no** existe en el repo y el plan tiene que resolver: renderizado de Markdown (no hay
librería ni estilos `prose`), tooling de capturas, y el botón «Ayuda» de la cabecera existe
pero está apagado y sin `onClick` (vive en `src/components/app-shell/`, carpeta protegida).

---

## 2. Principios

1. **Markdown es la fuente de verdad.** Un artículo = un archivo `.md` con frontmatter. La
   web, la búsqueda, el asistente y cualquier agente leen lo mismo. Nada se escribe dos veces.
2. **Lenguaje de barbería, no de software.** Tú, frases cortas, botones nombrados tal cual
   aparecen en pantalla («toca *Enviar código*»), cero términos técnicos. Voz de Notion:
   amable, segura, sin relleno.
3. **Cada pantalla, todos sus caminos.** Camino feliz, alternativas, estado vacío, cada error
   que puede salir, qué cambia según el rol, cómo deshacer.
4. **Capturas reemplazables.** Cada imagen tiene una receta (ruta + estado + viewport) en un
   manifiesto. Al rediseñar, se regeneran con un comando; el texto no se toca.
5. **Pensado para una IA desde el día uno.** Frontmatter con `screens`, `roles`,
   `keywords` y `related`; un `llms.txt` y un `llms-full.txt` generados; chunks por
   encabezado. Un agente puede responder «¿por qué no me llega el código?» citando el artículo.
6. **Se construye con Thema.** Nada de shell propio: monta `AdminShell` como ya hace la doc
   del sistema de diseño (`src/docs/DocsShell.tsx`).

---

## 3. Arquitectura

```
help/                                  ← fuera de src: contenido, no código
├── content/
│   ├── es/                            ← la fuente
│   └── en/                            ← traducción, mismos archivos (ver §3.3.1)
│       ├── empezar/
│       │   ├── _section.md            ← título, descripción, orden, icono de la sección
│       │   ├── que-es-barberlytics.md
│       │   ├── primer-ingreso.md
│       │   └── …
│       ├── acceso-y-cuenta/
│       ├── navegacion/
│       ├── panel/
│       ├── calendario/
│       ├── clientes/
│       ├── equipo/
│       ├── servicios/ productos/ gastos/ nomina/ transacciones/
│       ├── configuracion/
│       ├── indicadores/               ← ocupación, retención, churn, AVF, precios
│       ├── problemas/                 ← «no puedo…», errores, qué hacer
│       └── glosario/
├── assets/
│   └── es/<seccion>/<articulo>/<nombre>.png
├── screenshots.json                   ← receta de cada captura (ver §6)
├── casos/                             ← mapa de casos de uso por pantalla (ver §5)
│   └── login.md, panel.md, …
└── STYLE.md                           ← guía de redacción (tono, plantilla, vocabulario)

scripts/
├── build-help.mjs                     ← md → help/index.json, llms.txt, llms-full.txt
└── help-screenshots.mjs               ← Playwright: lee screenshots.json y regenera PNGs

src/help/                              ← la web (React + Thema)
├── HelpApp.tsx                        ← router hash, como la doc: #/s/<seccion>/<articulo>
├── HelpShell.tsx                      ← AdminShell con chrome apagado + búsqueda propia
├── pages/ HelpHome, HelpSection, HelpArticle, HelpSearch
├── markdown/ Markdown.tsx, components.tsx (md → Thema), Figure.tsx
├── search/ helpSearch.ts (índice y ranking), useHelpSearch.ts
├── contextual/ useHelpForRoute.ts, HelpPanel.tsx   ← «Ayuda de esta pantalla»
└── content.ts                         ← import.meta.glob de help/content/**/*.md (?raw)
```

### 3.1 Formato de un artículo

```md
---
id: acceso-y-cuenta/no-me-llega-el-codigo
title: No me llega el código por SMS
description: Qué revisar cuando pides el código y no aparece, y cómo entrar de otra forma.
section: acceso-y-cuenta
order: 30
roles: [owner, admin, recepcion, barbero]       # quién lo necesita
screens: [/login]                                # rutas donde aplica (ayuda contextual)
keywords: [sms, código, no llega, verificación, reenviar, otp]
related: [acceso-y-cuenta/ingresar, acceso-y-cuenta/olvide-mi-numero]
status: draft | review | published
updated: 2026-09-24
---

# No me llega el código por SMS

**En resumen:** el código tarda hasta un minuto. Si no llega, revisa el número, pide uno nuevo
o entra con Google o Microsoft.

## Qué revisar primero
1. …

![Pantalla de código con el botón Reenviar](../../assets/es/acceso-y-cuenta/no-me-llega-el-codigo/reenviar.png)

> [!TIP]
> …

## Si sigue sin llegar
…

## Errores que puedes ver
| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «El código no es válido» | … | … |

## Preguntas frecuentes
…
```

Convenciones que el renderizador convierte a piezas Thema:

| Markdown | Componente Thema |
|---|---|
| `> [!NOTE] / [!TIP] / [!WARNING] / [!IMPORTANT]` | `Alert` con tono `info / success / warning / destructive` |
| Lista numerada de primer nivel bajo un `##` | `Step` (paso numerado con la captura debajo) |
| `![alt](ruta)` | `Figure`: marco, pie de foto, claro/oscuro, zoom al tocar |
| Tabla | `Table` del sistema |
| `` `Enter` `` dentro de «pulsa» | `Kbd` |
| `## …` | anclas + índice lateral (`Scrollspy`) |
| `[[id]]` | enlace interno con título resuelto |

### 3.2 Lo que genera `build-help.mjs`

- `help/index.json`: árbol de navegación, metadatos de cada artículo, índice de búsqueda
  (título, descripción, keywords, encabezados, texto plano por sección), mapa `ruta → artículos`.
- `public/help/llms.txt`: índice corto (título + descripción + URL) para agentes, convención Mintlify.
- `public/help/llms-full.txt`: todos los artículos concatenados, con su frontmatter, en orden.
- Validaciones: frontmatter completo, `related` que existan, imágenes que existan y estén en
  el manifiesto, artículos sin `screens` (aviso), enlaces rotos.

Se ejecuta en `npm run help` y dentro de `npm run verify`.

### 3.3 La web

- **Ruta** `/ayuda/*` pública (como `/docs`): el login necesita ayuda antes de entrar.
- **Home** (Notion): buscador grande, «Empezar» destacado, tarjetas por sección, populares,
  «Novedades». Con sesión, la sección se ordena por rol.
- **Sección**: lista de artículos con descripción, agrupados por subsección.
- **Artículo**: migas, título, resumen, para quién (chips de rol), cuerpo, índice lateral
  (`Scrollspy`), relacionados, «¿Te sirvió?» (pulgar arriba/abajo, se registra), «Última actualización».
- **Búsqueda** (Slack): campo con resultados instantáneos, ranking = coincidencia en título ×4,
  keywords ×3, encabezados ×2, cuerpo ×1, + bonus por artículo popular y por rol del usuario;
  agrupado por sección; sinónimos («celular» = «número» = «teléfono»). Índice precalculado, sin
  dependencia nueva (≈150 artículos no la necesitan).
- **Ayuda contextual**: botón «Ayuda» de la cabecera abre un `Drawer` con los artículos cuyo
  `screens` incluye la ruta actual, la búsqueda y «Ir al centro de ayuda». Es lo que hace que
  la ayuda esté «arriba, en un botón» y no en otro sitio.
- **⌘K**: los artículos entran como `objects` en `GlobalSearch` con scope propio («Ayuda»),
  sin tocar el shell.
- **Preguntar** (fase 4): «Pregúntale a Barberlytics» sobre la base, con citas al artículo.

### 3.3.1 Idiomas (2026-10-08)

El centro de ayuda está en **español e inglés**. La cabecera lleva el selector de idioma del
sistema (`LanguageSelector only={HELP_LOCALES}`) al lado del de modo claro/oscuro, y ofrece solo
los idiomas en que hay contenido: el francés del resto de la app no aparece aquí porque la ayuda
saldría a medias.

- **Contenido**: el repo `centro-de-ayuda` tiene `content/es/` (fuente) y `content/en/`, con los
  mismos archivos e `id`; las reglas están en su `TRANSLATING.md`. El build publica el español en
  la raíz de `dist/` (como siempre) y cada traducción en `dist/<idioma>/`. Las capturas son
  compartidas (`/assets/es/…`).
- **App**: `src/help/content.ts` elige la base por idioma (`useHelpLocale`, `toHelpLocale`: lo que
  no es español cae al inglés), la caché de react-query lleva el idioma en la clave y, si una
  traducción aún no está publicada (404), lee el español. Cambiar de idioma no cambia la ruta:
  `/ayuda/<id>` es la misma en los dos.
- **Artículo sin traducir**: sale en español dentro del índice inglés con `locale: "es"` y la
  página lo avisa (`help.untranslatedNotice`).
- **Búsqueda y chat**: sinónimos, palabras vacías y raíces en los dos idiomas (`src/lib/help`);
  el chat busca y responde en el idioma activo, y `answerFromArticle` reconoce «In short» y
  «Steps» además de «En resumen» y «Pasos».
- **Guías paso a paso** (`guides.ts`): cada texto es `Localized` (`{ es, en }`).

### 3.4 Puntos de entrada y qué toca carpetas protegidas

| Entrada | Dónde | ¿Protegido? |
|---|---|---|
| Botón «Ayuda» de la cabecera | `AppHeader.tsx:115` no tiene `onClick`; hay que añadir `onOpenHelp` a `ShellConfig` | **Sí** (`app-shell`). Es el cambio correcto; se pide aprobación. Alternativa sin tocarlo: `config.headerActions`. |
| Item «Centro de ayuda» en el menú «Recursos» | `src/app/navigation.ts` | No |
| Artículos en ⌘K | `config.search.objects` en `AppLayout.tsx` | No |
| Ruta `/ayuda` | `src/app/router.tsx` + `lazyPages.ts` | No |
| Librería de Markdown (`react-markdown` + `remark-gfm` + `remark-frontmatter`) | `package.json` | **Sí**. ≈35 kB gz. La alternativa (renderizador propio) no vale la pena. |

---

## 4. Arquitectura de contenido (lo que va a existir)

Basada en el menú real de la app, los 17 ajustes y los motores documentados en Notion.
Cada línea es un artículo; las que llevan «→» son subsecciones. Estimación: **130–150 artículos**.

**Empezar** — Qué es Barberlytics y qué no es (no es «una agenda») · Tu primer ingreso · El
diagnóstico inicial (por qué te preguntamos qué te duele) · Configura tu barbería en 15 minutos ·
Invita a tu equipo · Los cinco roles y qué ve cada uno · Trae tus datos de otra plataforma
(Squire, Booksy, Square, Fresha…) · Tour de la pantalla principal.

**Acceso y cuenta** — Ingresar con tu número y código SMS · Entrar con Google o Microsoft ·
No me llega el código · El código no es válido / lo escribí mal / expiró · Demasiados intentos
(bloqueo temporal) · Olvidé mi número: recuperarlo por correo · Cambiar mi número · Cerrar sesión
y sesión expirada · Privacidad y términos: qué guardamos y por qué · Eliminar la cuenta.

**Navegación** — El menú y las secciones · Cambiar de sucursal · Cambiar de rol (ver la app como
lo ve tu barbero) · Buscar cualquier cosa con ⌘K · Notificaciones y novedades · Claro, oscuro y
personalización · Enviar feedback.

**Panel** — Qué te dice el panel cada mañana · Cada indicador explicado · Cambiar el periodo ·
Panel por sucursal vs. toda la barbería.

**Calendario y citas** (según se construya) — Ver el día por barbero · Crear una cita · Cita
sin preferencia: cómo se asigna el barbero (lineup) · Mover, reprogramar y cancelar · Walk-ins ·
Cerrar una cita (check-out) · Bloqueos, descansos y cierres · Recordatorios al cliente ·
Reservas proactivas (cuando el cliente se pasa de su ritmo).

**Clientes** — El perfil del cliente · Ritmo de visita (AVF) y qué significa · El semáforo
verde/amarillo/rojo · Nuevo, repite, retenido, leal, perdido · Recuperar un cliente que se fue ·
Preferencias (barbero, servicio, día, hora) · Precio congelado para clientes leales · Importar
clientes.

**Equipo** — La pantalla de equipo · Invitar y qué le llega a la persona · Estados: activo,
invitado, inactivo · Roles y permisos en detalle · Ocupación de cada barbero · Retención por
barbero · Calibración trimestral (En demanda / En desarrollo / Necesita atención) · Auto-evaluación
del barbero · Firma del dueño y qué cambia el próximo trimestre.

**Servicios · Productos · Gastos · Transacciones** — Catálogo, duración y precio · Precio para
cliente nuevo vs. estándar · Inventario y ventas de mostrador · Registrar un gasto · Todo lo cobrado
y su medio de pago · Propinas.

**Nómina y pagos al equipo** — Cómo se calcula la comisión: una tarifa por tipo de cliente ·
Clientes que el barbero ganó vs. que la barbería trajo · Deals (Starter, Standard, Senior, Partner) ·
Renta de silla · Salario · El ciclo de nómina y sus fechas · Lo que ve el barbero en su celular ·
Descargar la nómina · «Mi número no cuadra»: cómo leer cada línea.

**Configuración** — un artículo por ajuste: Negocio · Identidad (logo, nombre, «Barbería») ·
Sucursales · Cierres · Agendamiento · Recordatorios y avisos · Empresa · Precios y moneda ·
Impuestos · Propinas · Recargo por tarjeta · Dispositivos · Pasarela de pago · Comisiones ·
Ciclo de nómina · Facturación del plan · Eliminar cuenta.

**Indicadores (entender los números)** — Ocupación y por qué la meta es 80 % · Retención y churn ·
AVF, el ritmo de cada cliente · El indicador de precios (80/80 → subir 5-10 %) · Cuándo subir
precios y a quién · Camino a seis cifras · P&L de la barbería.

**Problemas frecuentes** — No puedo entrar · No veo una sucursal · No veo el menú completo (rol) ·
Un número no cuadra · La app va lenta / sin conexión · Cómo contactar soporte.

**Glosario** — 30–40 términos en una frase cada uno (AVF, churn, ocupación, lineup, walk-in,
sin preferencia, cliente leal, ciclo, deal…).

---

## 5. Método: cómo sacamos todos los casos de uso

Antes de escribir un artículo, cada pantalla tiene su **mapa de casos** en `help/casos/<pantalla>.md`.
Es una lista corta que revisas tú antes de que yo redacte. Plantilla:

```
# Login
Camino feliz: número → código → dentro.
Alternativas: Google · Microsoft · olvidé mi número.
Entradas: número con/sin indicativo · pegar el código · autocompletar del SMS.
Errores: número inválido · número no registrado · código incorrecto · código expirado ·
         demasiados intentos · sin conexión · servicio caído.
Estados: cargando · reenviar (cuenta atrás) · bloqueado temporalmente.
Por rol: igual para todos.
Deshacer / salir: volver a cambiar el número · cerrar sesión.
Legal: privacidad · términos · qué datos guardamos.
Dudas que la gente tendrá: ¿por qué no hay contraseña? ¿puedo entrar desde dos celulares?
```

Para descubrirlos uso tres fuentes cruzadas: (1) navegar la app en mi navegador integrado con la
sesión que tú inicies, pantalla por pantalla, probando cada botón y cada error; (2) el código
(`handlers.ts`, `API_CONTRACT.md`, tablas de errores, i18n) para los mensajes exactos; (3) Notion
para la lógica de negocio que la pantalla no cuenta (por qué existe el lineup, qué es «leal»).

---

## 6. Capturas: tomarlas y reemplazarlas

`help/screenshots.json` describe cada imagen; `npm run help:shots` las regenera con Playwright
(ya está en el repo, puerto 5197, mocks, login helper en `e2e/helpers.ts`):

```json
{
  "acceso-y-cuenta/no-me-llega-el-codigo/reenviar": {
    "route": "/login",
    "state": "otp-step",              // helper que deja la pantalla en ese estado
    "viewport": "desktop | mobile",
    "theme": "light | dark | both",
    "clip": "[data-shot='otp-card']", // opcional: recortar a un elemento
    "highlight": "[data-testid='login-resend']",  // resalta el botón del paso
    "source": "app | produccion"
  }
}
```

- `state` apunta a helpers pequeños en `scripts/help-states.ts` (login en paso código, drawer
  abierto, tabla con selección…). Así una captura es reproducible y no depende de datos vivos.
- Los datos de mocks son deterministas: las capturas salen iguales en cualquier máquina.
- Las pantallas que hoy solo existen en la app en producción se capturan a mano desde el
  navegador (con tu sesión) y se marcan `source: produccion`; al portarlas a Thema, se cambia a
  `app` y se regeneran. Nada más que cambiar.
- Cada `Figure` sirve la versión clara u oscura según el tema del lector.
- Textos dentro de capturas: siempre los de la app en español; sin datos reales de clientes.

---

## 7. Fases y cómo trabajamos

| Fase | Qué se entrega | Tú revisas |
|---|---|---|
| **0. Plan** (este doc) | Arquitectura, IA de contenido, decisiones | Aprobar o corregir §3 y §4 |
| **1. Cimientos** (1 tanda) | `help/` con `STYLE.md` y 3 artículos de muestra (login), `build-help.mjs`, `llms.txt`, ruta `/ayuda` con home/sección/artículo/búsqueda, renderizador md→Thema, drawer contextual, item en «Recursos», entrada en ⌘K, `help:shots` con las primeras capturas. Cambios a protegidos pedidos aparte. | Cómo se ve y se lee un artículo real antes de escribir 150 |
| **2. Casos de uso** | `help/casos/*.md` de todas las pantallas existentes | Marcas lo que falta o sobra por pantalla |
| **3. Contenido por bloques** | Un bloque a la vez, en este orden: Acceso → Empezar → Navegación → Equipo → Configuración → Panel → Nómina → Clientes → Indicadores → Glosario → Problemas. Cada bloque llega con sus capturas. | Lees el bloque, comentas, itero; `status: published` cuando lo apruebas |
| **4. Preguntar** | Asistente sobre la base con citas; evaluación con 30 preguntas reales | Pruebas las preguntas que hace un dueño |
| **5. Inglés** | `content/en` con la misma estructura | — |

Reglas de cierre de cada tanda: `npm run check`, `npm run verify`, claro/oscuro, 375 px,
`npm run help` sin avisos.

---

## 8. Decisiones que necesito de ti

1. **Dónde vive el contenido**: en este repo (`help/`, propuesta) o en un repo aparte que la
   app consume. En el repo es más simple hoy; aparte es mejor si soporte va a editar sin tocar código.
2. **Tocar `app-shell` y `package.json`** para el botón «Ayuda» y `react-markdown`. Si no,
   uso `headerActions` y escribo el renderizador (más trabajo, menos fidelidad).
3. **Capturas de producción**: ¿tienes acceso a la app actual en producción para que yo navegue
   con tu sesión y documente lo que Thema aún no tiene (calendario, clientes, nómina…)? Si sí,
   dime la URL; si no, documento esas secciones desde Notion y las capturas llegan cuando se construyan.
4. **Idioma**: español de Colombia primero (como la app) y luego inglés (como Notion). ¿De acuerdo?
5. **Tono**: «tú» (como el copy de tiendas en español), no «usted». ¿De acuerdo?
6. **Orden del bloque 3** (§7). ¿Empiezo por Acceso como propones con el ejemplo del login?
