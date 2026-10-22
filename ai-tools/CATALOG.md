# Catálogo de componentes Thema

Generado con `npm run catalog` desde `src/docs/registry`. No se edita a mano. Las reglas están en `AGENTS.md`.

**218 componentes** en 22 familias · 101 iconos en el registro · 113 tokens.

Este archivo es el índice: sirve para elegir la pieza. Antes de usarla, abre su ficha en `ai-tools/components/<id>.md` (props, guías y ejemplos); el `<id>` va entre corchetes en cada línea. No leas `catalog.json` entero: es el mismo contenido para consultarlo con un script.

## Guías

- **Cómo usar el sistema** (start) — Las cinco reglas y dónde está cada cosa. → `/docs#/guides/como-usar`
- **Flujo de trabajo** (start) — Cómo se suma una pantalla nueva, del archivo al enlace publicado. → `/docs#/guides/flujo-de-trabajo`
- **Trabajar con la IA** (start) — Qué sabe la IA de este proyecto y de dónde lo saca. → `/docs#/guides/trabajar-con-ia`
- **Botones** (patterns) — Jerarquía, combinaciones y el botón de IA. → `/docs#/guides/botones`
- **Modales y drawers** (patterns) — Cuándo una ventana, cuándo un panel, cuándo un aviso. → `/docs#/guides/ventanas`
- **Estados y feedback** (patterns) — Vacíos, carga, avisos, confirmaciones y errores. → `/docs#/guides/estados`
- **Formularios** (patterns) — Anatomía del campo, validación y formularios largos. → `/docs#/guides/formularios`

## Fundamentos

- Marca → `/docs#/foundations/brand`
- Temas → `/docs#/foundations/themes`
- Colores y tokens → `/docs#/foundations/colors`
- Tipografía → `/docs#/foundations/typography`
- Radios y sombras → `/docs#/foundations/radius`
- Espaciado → `/docs#/foundations/spacing`
- Iconos → `/docs#/foundations/icons`
- Idioma → `/docs#/foundations/language`
- Motion → `/docs#/foundations/motion`

## Primitivos · 46

Base shadcn/Radix afinada con los tokens Thema.

- **Accordion** [accordion] — Lista de secciones plegables con un encabezado que muestra u oculta su contenido. `@/components/ui/accordion`
- **ActivityDropdown** [activity-dropdown] — Tarjeta de actividad reciente que se despliega al hacer clic: la cabecera se mantiene y las filas entran en cascada. `@/components/ui/activity-dropdown`
- **Alert** [alert] — Aviso en línea que llama la atención sobre un mensaje sin interrumpir el flujo. `@/components/ui/alert`
- **AlertDialog** [alert-dialog] — Diálogo modal que exige una decisión explícita antes de continuar: no se cierra al hacer clic fuera ni con Escape sin pasar por Cancelar. `@/components/ui/alert-dialog`
- **Avatar** [avatar] — Imagen circular que representa a una persona o equipo, con iniciales de respaldo mientras carga o si la imagen falla. `@/components/ui/avatar`
- **Badge** [badge] — Etiqueta compacta de 20px para clasificar, contar o señalar el estado de un elemento. `@/components/ui/badge`
- **BarberlyticsLogo** [barberlytics-logo] — El logotipo de Barberlytics como SVG inline que sigue al tema: «Barber» en `currentColor`, «lytics» y la flecha en el gradiente de marca de… `@/components/ui/BarberlyticsLogo`
- **BorderBeam** [border-beam] — Haz de luz que recorre el borde de su contenedor en bucle, sin afectar al layout. `@/components/ui/border-beam`
- **Button** [button] — La acción del sistema. `@/components/ui/button`
- **ButtonGroup** [button-group] — Une varios Button (o un botón y un trigger) en un solo control: quita los radios internos y solapa los bordes un píxel. `@/components/ui/button-group`
- **Calendar** [calendar] — Cuadrícula de fechas construida sobre react-day-picker con los tokens del sistema. `@/components/ui/calendar`
- **Card** [card] — Superficie elevada que agrupa contenido relacionado con cabecera, cuerpo y pie opcionales. `@/components/ui/card`
- **Carousel** [carousel] — Carrusel accesible construido sobre Embla, con flechas, navegación por teclado y soporte de arrastre. `@/components/ui/carousel`
- **Checkbox** [checkbox] — Casilla de 16px para elegir una o varias opciones de un conjunto, con estado indeterminado para selecciones parciales. `@/components/ui/checkbox`
- **Collapsible** [collapsible] — Muestra u oculta un bloque de contenido desde un trigger, sin la lista de ítems de Accordion. `@/components/ui/collapsible`
- **Command** [command] — Paleta de comandos con búsqueda difusa, grupos y atajos, basada en cmdk; el ítem activo se resalta con una píldora que se desliza entre opc… `@/components/ui/command`
- **ContextMenu** [context-menu] — Menú que se abre con clic derecho (o pulsación larga) sobre un elemento, con los mismos ítems, casillas, radios, atajos y submenús que Drop… `@/components/ui/context-menu`
- **Dialog** [dialog] — Ventana modal centrada para tareas cortas que requieren atención sin abandonar la pantalla: editar un campo, compartir, ver un detalle. `@/components/ui/dialog`
- **DropdownMenu** [dropdown-menu] — Menú contextual anclado a un botón con ítems, grupos, atajos, casillas, radios y submenús; el resaltado se desliza entre ítems con FluidHig… `@/components/ui/dropdown-menu`
- **FluidHighlight** [fluid-highlight] — Píldora de fondo que persigue al ítem activo de una lista en lugar de pintar cada ítem por separado, de modo que recorrer el menú se lee co… `@/components/ui/fluid-highlight`
- **HoverCard** [hover-card] — Panel flotante que aparece al pasar el cursor (o enfocar) un elemento, con el mismo lenguaje visual que Popover. `@/components/ui/hover-card`
- **Input** [input] — Campo de texto de una línea (40px) con los estados de foco, deshabilitado y archivo del sistema. `@/components/ui/input`
- **InputGroup** [input-group] — Campo compacto (32px) con complementos integrados: iconos, texto, botones o incluso un textarea con pie. `@/components/ui/input-group`
- **Kbd** [kbd] — Tecla de atajo en un `<kbd>` real, con aspecto de tecla física (20px o 16px de alto). `@/components/ui/kbd`
- **Label** [label] — Etiqueta accesible para controles de formulario, en 14px medium. `@/components/ui/label`
- **MagicCard** [magic-card] — Tarjeta seleccionable con barrido de luz al pasar el cursor, leve elevación y un estado seleccionado que no mueve el contenido. `@/components/ui/magic-card`
- **MovingBorderBeam** [moving-border-beam] — Un haz de luz con el degradado de IA que recorre el perímetro del contenedor. `@/components/ui/moving-border-beam`
- **Pagination** [pagination] — Navegación entre páginas de una lista, compuesta con enlaces que heredan los estilos de Button (ghost por defecto, outline para la activa). `@/components/ui/pagination`
- **Popover** [popover] — Panel flotante anclado a un disparador, con entrada suave (fade + zoom + deslizamiento según el lado) y salida rápida. `@/components/ui/popover`
- **Progress** [progress] — Barra de progreso determinada, de 2px de radio completo, que se desplaza con transform. `@/components/ui/progress`
- **RadioGroup** [radio-group] — Grupo de opciones excluyentes con navegación por flechas y un punto de 16px que se rellena en primario. `@/components/ui/radio-group`
- **ScrollArea** [scroll-area] — Contenedor con scroll y barra personalizada de 10px que aparece solo al desplazarse, coherente entre navegadores. `@/components/ui/scroll-area`
- **Select** [select] — Desplegable de una sola opción con chevron que gira al abrir, píldora de resaltado que se desliza entre ítems y entrada en cascada. `@/components/ui/select`
- **Separator** [separator] — Línea de 1px en el color de borde, horizontal o vertical. `@/components/ui/separator`
- **Sheet** [sheet] — Panel lateral (o inferior/superior) sobre un velo difuminado: entra recorriendo todo su ancho con curva expo-out en 500ms y sale en 300ms. `@/components/ui/sheet`
- **Skeleton** [skeleton] — Marcador de posición con pulso suave que ocupa el sitio del contenido mientras llega. `@/components/ui/skeleton`
- **Slider** [slider] — Control deslizante de Radix con pista fina, rango en color primario y un pulgar que crece al pasar el cursor. `@/components/ui/slider`
- **Switch** [switch] — Interruptor de dos estados con efecto inmediato, en dos tamaños (32px y 24px de ancho). `@/components/ui/switch`
- **Table** [table] — La tabla semántica base: contenedor con scroll horizontal, cabecera, cuerpo, pie y caption con la tipografía del sistema. `@/components/ui/table`
- **Tabs** [tabs] — Pestañas de Radix con un indicador que se desliza entre triggers gracias a `layoutId` de framer-motion. `@/components/ui/tabs`
- **Textarea** [textarea] — Campo de texto multilínea con el mismo borde, radio y anillo de foco que Input, y 120px de alto mínimo. `@/components/ui/textarea`
- **ThemaLogo** [thema-logo] — El isotipo Thema como SVG inline, blanco por defecto y con una leve escala al pasar el cursor. `@/components/ui/ThemaLogo`
- **Toaster / toast()** [sonner] — El Toaster de Sonner afinado con los tokens Thema: iconos por tipo, bordes tintados y un botón de cierre de 28px que sí se puede pulsar. `sonner`
- **Toggle** [toggle] — Botón de dos estados que se ve activo o inactivo en el acto: negrita, fijar, mostrar u ocultar. `@/components/ui/toggle`
- **ToggleGroup** [toggle-group] — Conjunto de Toggle pegados que comparten variante y tamaño por contexto. `@/components/ui/toggle-group`
- **Tooltip** [tooltip] — Etiqueta flotante de Radix en fondo oscuro con flecha, que aparece tras 200ms al pasar el cursor o enfocar. `@/components/ui/tooltip`

## Tipografía · 2

Heading y Text: la escala tipográfica como componentes, sin tamaños a mano.

- **Heading** [heading] — Los seis niveles de título del sistema como un componente. `@/components/typography`
- **Text** [text] — Todo el texto que no es un título: cuerpo, etiquetas, ayudas, cifras y código inline. `@/components/typography`

## Formularios · 11

Campos, secciones y selects compuestos.

- **ColorPicker** [color-picker] (beta) — Elegir un color dentro del espectro: área de saturación y brillo, barra de matiz y el HEX escrito, con una fila opcional de muestras sugeri… `@/components/forms`
- **Field** [field] — El envoltorio de un control de formulario: etiqueta, descripción, error y estado deshabilitado, con los ids y aria-describedby inyectados e… `@/components/forms`
- **FilterBar** [filter-bar] (beta) — La cabecera de filtros de un listado: una tarjeta con búsqueda, un hueco para los selects y otro para las acciones, y debajo la fila de chi… `@/components/filters`
- **FormSection** [form-section] — Una tarjeta que agrupa campos relacionados bajo un título, una descripción y un slot de acciones. `@/components/forms`
- **InputOtp** [input-otp] — Código de un solo uso repartido en celdas. `@/components/forms`
- **MultiSelect** [multi-select] — Un combobox controlado para elegir varias opciones, que muestra lo elegido como chips removibles dentro del trigger. `@/components/forms`
- **NumberField** [number-field] — Campo numérico con botones de − y +. `@/components/forms`
- **PhoneInput** [phone-input] — Teléfono con selector de país y prefijo. `@/components/forms`
- **Rating** [rating] — Puntuación con estrellas para encuestas de satisfacción y evaluaciones. `@/components/forms`
- **SearchableSelect** [searchable-select] — Un select de una sola opción con búsqueda integrada en el popover, filtrada por cmdk. `@/components/forms`
- **SingleSelect** [single-select] — El select de una opción con el mismo trigger y lista que MultiSelect: fondo muted, filas redondeadas y check a la derecha. `@/components/forms/SingleSelect`

## Selección · 9

Tarjetas, tiles y controles segmentados para elegir.

- **CardSelection** [card-selection] — Una grilla de tarjetas donde solo una puede estar elegida, con icono, eyebrow, badge y descripción por opción. `@/components/selection`
- **CheckboxCardGroup** [checkbox-card-group] — La grilla de tarjetas para selección múltiple: cada una alterna su presencia en un arreglo y muestra un checkbox cuadrado en la esquina. `@/components/selection`
- **OptionTile** [option-tile] — Un tile horizontal y compacto con icono, label, descripción y un radio a la derecha, pensado para listas densas. `@/components/selection`
- **RadioCardGroup** [radio-card-group] — Las mismas tarjetas de CardSelection, pero montadas sobre Radix RadioGroup: navegación con flechas, roving tabindex y un input oculto con n… `@/components/selection`
- **SegmentedControl** [segmented-control] — Un grupo de botones pegados para alternar entre pocas opciones excluyentes, en tres variantes (sólido, contorno y subrayado) y dos tamaños. `@/components/selection`
- **SelectableCard** [selectable-card] — La tarjeta individual que usan CardSelection y CheckboxCardGroup, expuesta como pieza suelta con `selected` y `onSelect`. `@/components/selection`
- **SelectableRow** [selectable-row] — Una fila de lista para elegir, con foto, texto y la marca de elegir a la derecha (SelectMark). `@/components/selection`
- **SelectMark** [select-mark] — La marca de elegir de las opciones que no son un control nativo —tarjetas y filas con foto, texto y acciones—: un círculo si se elige una o… `@/components/selection`
- **TemplateTile** [template-tile] — La ficha de una plantilla: fondo degradado en su tono, una miniatura que dibuja las líneas que trae con sus barras de peso, la insignia cla… `@/components/templates`

## Navegación · 9

Tabs, sub-navegación, breadcrumbs y paginación.

- **Breadcrumbs** [breadcrumbs] — El rastro de dónde está la persona dentro de una jerarquía, con el último tramo resaltado como página actual. `@/components/navigation`
- **GlobalSearch** [global-search] — La búsqueda general del producto: un solo campo para abrir un registro, ir a una pantalla o preguntar al agente. `@/components/search`
- **PaginationShell** [pagination-shell] — Paginación lista para tablas y listados: resumen de resultados a la izquierda, controles a la derecha y elipsis automáticas alrededor de la… `@/components/navigation`
- **Scrollspy** [scrollspy] — Índice lateral (o de pestañas) que resalta la sección visible mientras se hace scroll, con `IntersectionObserver` en vez de un handler de s… `@/components/navigation/Scrollspy`
- **Stepper** [stepper] — Flujo por pasos con círculo numerado, etiqueta y conector. `@/components/navigation/Stepper`
- **TabsNav** [tabs-nav] — Una fila de píldoras para cambiar de vista: la activa se rellena en primario y las demás quedan en texto apagado. `@/components/navigation`
- **ThemaMobileTabBar** [thema-mobile-tab-bar] — La barra inferior de la app móvil: hasta cinco destinos con icono, etiqueta y un badge opcional (contador o punto). `@/components/navigation`
- **ThemaProductHeader** [thema-product-header] — La cabecera de un producto dentro de la plataforma: logo del cliente a la izquierda, título del módulo y un hueco a la derecha para accione… `@/components/navigation`
- **ThemaTabs** [thema-tabs] — Las dos únicas tiras de pestañas de la app, sobre el primitivo `ui/tabs`: `view` cambia un panel dentro de la página con un track hundido,… `@/components/navigation`

## Overlays · 7

Drawers, modales y diálogos de confirmación.

- **ConfirmDialog** [confirm-dialog] — El diálogo de confirmación del sistema sobre `AlertDialog`: título, aviso, cancelar y confirmar, con variante destructiva, estado de carga,… `@/components/overlays`
- **DrawerSection** [drawer-section] — La tarjeta con la que se arman todos los drawers del producto: chip de icono en su tono, título, una línea de ayuda y, bajo la divisoria, e… `@/components/overlays`
- **DrawerShell** [drawer-shell] — El panel lateral del producto sobre `Sheet`: cabecera con título, cuerpo con scroll propio y pie con acciones, en once tamaños y desde cual… `@/components/overlays`
- **ModalShell** [modal-shell] — El modal centrado del producto sobre `Dialog`: cabecera con título y descripción, cuerpo y un pie con acciones o completamente propio. `@/components/overlays`
- **SidePanelShell** [side-panel-shell] (beta) — Un panel de trabajo que se abre al lado del contenido en vez de encima: entra por la derecha y empuja la página, que se estrecha y sigue us… `@/components/overlays`
- **TemplateCatalogDrawer** [template-catalog-drawer] — El catálogo de plantillas en un panel: galería por estantes con buscador y dos vistas, una plantilla destacada arriba, y un paso más adentr… `@/components/templates`
- **TruncationTooltip** [truncation-tooltip] — La regla del sistema para el texto cortado: todo texto que se corta con elipsis muestra el texto completo en un tooltip al pasar el ratón o… `@/components/overlays`

## Feedback · 5

Estados vacíos, avisos y toasts.

- **AttentionStrip** [attention-strip] — La franja de avisos: una sola fila que dice cuánto reclama atención y ofrece un botón por motivo. `@/components/feedback/AttentionStrip`
- **EmptyState** [empty-state] — La tarjeta punteada que ocupa el lugar de una lista vacía: una ilustración Glass, un título, una explicación breve y, si aplica, la acción… `@/components/feedback/EmptyState`
- **EmptyStateActionButton** [empty-state-action-button] — La acción secundaria dentro de un estado vacío: una píldora de contorno que invita a crear el primer elemento sin competir con la acción pr… `@/components/feedback/EmptyStateActionButton`
- **Spinner** [spinner] — Indicador de carga indeterminado en cuatro tamaños (12, 16, 24 y 32px) y tres tonos. `@/components/feedback/Spinner`
- **ThemaToaster** [thema-toaster] — El contenedor de toasts de Sonner con los ajustes Thema: apilados arriba a la derecha, por debajo del header, sin colores saturados y con b… `@/components/feedback/ThemaToaster`

## Feedback de usuarios · 4

Pedir opinión masiva sobre algo recién lanzado: recorrido guiado, botón flotante y panel de comentarios.

- **FeedbackCampaign** [feedback-campaign] (beta) — El circuito completo para pedir feedback masivo sobre algo recién lanzado: recorrido guiado la primera vez, botón flotante en todas las pág… `@/components/feedback-loop`
- **FeedbackDialog** [feedback-dialog] (beta) — El único diálogo donde se deja feedback, lo abra el menú lateral o el botón de una campaña: tipo (mejora, error o idea), comentario y, si a… `@/components/feedback-loop`
- **FeedbackLauncher** [feedback-launcher] (beta) — El botón flotante que abre el panel de feedback, fijo en la esquina inferior derecha (`z-rail`). `@/components/feedback-loop`
- **GuidedTour** [guided-tour] (beta) — Recorrido de coachmarks: una tarjeta por paso con «Paso N de M», barra de progreso y el elemento del paso recortado del velo y rodeado por… `@/components/feedback-loop`

## Comentarios · 3

Comentar sobre la pantalla al estilo Figma: pins en cualquier punto, hilos con respuestas y un panel lateral con filtros.

- **CommentLayer** [comment-layer] — Capa envolvente que superpone los marcadores (pines) interactivos sobre la interfaz. `@/components/comments`
- **CommentsPanel** [comments-panel] — Panel lateral derecho para la gestión de comentarios colaborativos tipo Figma. `@/components/comments`
- **CommentsToggle** [comments-toggle] — Botón para la cabecera o barra de herramientas que abre o cierra el panel de comentarios. `@/components/comments`

## Datos · 14

Tablas configurables y badges de estado.

- **Kanban** [kanban] — Tablero de columnas con tarjetas que cambian de etapa arrastrando: el pipeline de una vacante (Nuevos → En revisión → Entrevista → Oferta),… `@/components/data-display/Kanban`
- **ListItem** [list-item] — Fila de lista con `leading` (avatar, icono o IconTile), título, descripción, `meta` a la derecha y acciones. `@/components/data-display/ListItem`
- **ProgressRing** [progress-ring] (beta) — Avance en un anillo: lo conseguido en color pleno y, opcional, lo que suma la acción en curso en un tono más suave. `@/components/data-display/ProgressRing`
- **RowActionsMenu** [row-actions-menu] — El botón de acciones de una fila: lo que se puede hacer con ese registro sin pasar por marcarlo. `@/components/data-display`
- **RowContextMenu** [row-context-menu] — El clic derecho sobre un registro —una fila de tabla, una tarjeta de la agenda—: el mismo menú de acciones que el botón «⋯», sin tener que… `@/components/data-display`
- **Sortable** [sortable] — Lista que se reordena arrastrando: las lecciones de un plan de formación, las preguntas de una encuesta, los pasos de un proceso. `@/components/data-display/Sortable`
- **StatusBadge** [status-badge] — Un `Badge` con vocabulario de estado: cada valor trae su variante de color y su etiqueta en español por defecto. `@/components/data-display/StatusBadge`
- **StatusBadge (animado)** [status-badge-animated] — La píldora de estado con transición: al cambiar `state`, el icono entra con un resorte y el texto se desliza, así el ojo ve que algo pasó y… `@/components/status-badge`
- **Tabla configurable** [table-config] — El kit para que una tabla recuerde cómo quiere verla cada persona: qué columnas, en qué orden, cuáles quedan fijadas al desplazar de lado y… `@/components/data-display/table-config`
- **TableHeaderControls** [table-header-controls] — Los controles que viven en los encabezados de toda tabla seleccionable: el menú de selección masiva, el encabezado que ordena y filtra por… `@/components/data-display/TableHeaderControls`
- **TableShell** [table-shell] — La tarjeta que envuelve una tabla: título, descripción y acciones en la cabecera, y el estado vacío resuelto por defecto. `@/components/data-display/TableShell`
- **TicketCard** [ticket-card] — Una entrada: a la izquierda el talón —un número, una etiqueta— y, tras una línea de puntos con sus dos muescas, el cuerpo con lo que import… `@/components/data-display`
- **Timeline** [timeline] — Línea de tiempo de eventos: un punto o icono de 24px sobre una línea vertical continua, con título, hora y una descripción o cuerpo opciona… `@/components/data-display/Timeline`
- **Tree** [tree] — Árbol jerárquico con expansión y selección: empresa → áreas → equipos, o cualquier estructura anidada que haya que recorrer o elegir. `@/components/data-display/Tree`

## Fechas y rangos · 11

Pickers de fecha, rango, mes, trimestre, periodo y slider de rango.

- **DateFilterBar** [date-filter-bar] — Barra horizontal que compone PeriodSelector, DatePicker y DateRangePicker detrás de un select de modo. `@/components/date`
- **DatePicker** [date-picker] — Selector de una sola fecha que combina Popover y Calendar en un campo con etiqueta, ayuda y error. `@/components/date`
- **DateRangePicker** [date-range-picker] — Selector de rango en un solo campo: abre un calendario de dos meses y cierra al completar inicio y fin. `@/components/date`
- **DualDateRangePicker** [dual-date-range-picker] — Dos campos (inicio y cierre) que comparten un calendario de dos meses con pasos guiados, previsualización al pasar el ratón y confirmación… `@/components/date`
- **EventCalendar** [event-calendar] (beta) — La agenda del producto en una rejilla: sesiones de formación, entrevistas de una vacante y fechas de cierre de encuestas, en vista de mes,… `@/components/date`
- **MonthPicker** [month-picker] — Selector de mes y año con una cuadrícula de doce meses y navegación por año. `@/components/date`
- **PeriodNavigator** [period-navigator] — La barra de tiempo de un tablero: el grano (día, semana, mes), el periodo que se está mirando y las flechas para moverlo. `@/components/date`
- **PeriodSelector** [period-selector] — Select de periodos predefinidos (hoy, últimos 7 días, este mes…) con etiqueta, ayuda y error. `@/components/date`
- **QuarterSelector** [quarter-selector] — Selector de trimestre y año con cuatro botones (Q1–Q4) y navegación por año. `@/components/date`
- **RangeSlider** [range-slider] — Slider de dos manejadores para acotar un rango numérico, con etiqueta, valores visibles y formateador propio. `@/components/range`
- **Utilidades de fecha** [date-utils] — Funciones puras sobre Date nativo e Intl.DateTimeFormat que usan todos los pickers: formateo por locale, rangos, comparación sin hora y lím… `@/components/date`

## Agenda · 5

La rejilla del día por barbero, la ocupación del mes y el selector de fecha y hora.

- **DayStrip** [day-strip] — La tira de días de la reserva: el día de la semana arriba y el número grande, en fila y deslizable con el dedo, arrastrando con el ratón o… `@/components/scheduling`
- **MonthOccupancyGrid** [month-occupancy-grid] (beta) — El mes de un barbero (o del equipo) día por día: cuánta de la jornada está reservada, en porcentaje y en barra, y cuántas citas hay. `@/components/scheduling`
- **ResourceDayGrid** [resource-day-grid] (beta) — El día de una barbería: una columna por barbero, las horas hacia abajo y cada cita como tarjeta en la columna de quien la atiende. `@/components/scheduling`
- **TimeSlotGroups** [time-slot-groups] — Las horas libres de un día repartidas por franja —mañana, tarde, noche—, cada una una pastilla que se toca para elegirla. `@/components/scheduling`
- **TimeSlotPicker** [time-slot-picker] (beta) — Elegir cuándo: una tira de días para la fecha y, debajo, las horas repartidas en mañana, tarde y noche como chips. `@/components/scheduling`

## Archivos · 7

Zonas de carga, previsualización y progreso.

- **AttachmentList** [attachment-list] — Colección de archivos renderizada con FilePreview en tres layouts: lista de filas, grilla de tarjetas o chips compactos. `@/components/upload`
- **FilePreview** [file-preview] — Muestra los metadatos de un archivo (nombre, tamaño y familia) con un icono por tipo. `@/components/upload`
- **FileUpload** [file-upload] — Selección de archivos mediante un botón y la File API nativa, sin arrastrar. `@/components/upload`
- **ImageCropper** [image-cropper] (beta) — Recorte de imagen sobre `react-easy-crop`: mover con arrastre o flechas, acercar con rueda, pellizco, teclas + y − o la barra, girar en pas… `@/components/upload`
- **ImportCsvPanel** [import-csv-panel] — Panel completo de importación CSV que orquesta UploadZone, FilePreview, UploadProgress y una tabla de previsualización. `@/components/upload`
- **UploadProgress** [upload-progress] — Barra de progreso con etiqueta, descripción, porcentaje y un icono por estado (cargando, validando, éxito, error). `@/components/upload`
- **UploadZone** [upload-zone] — Zona de arrastrar y soltar con la Drag & Drop API nativa y clic como alternativa. `@/components/upload`

## Gráficos · 15

ECharts con el tema Thema resuelto en tiempo real.

- **AreaChart** [area-chart] — Preset de área sobre ChartCard para tendencias donde importa el volumen acumulado: cursos completados en el año, minutos de aprendizaje por… `@/components/charts`
- **BarChart** [bar-chart] — Preset de barras sobre ChartCard para comparar magnitudes entre categorías: áreas, equipos, cursos. `@/components/charts`
- **BarList** [bar-list] — Un ranking: qué se vendió más, de dónde salió el ingreso, qué servicio se pidió. `@/components/charts`
- **ChartCard** [chart-card] — La Card pensada para alojar un gráfico: encabezado con eyebrow, título, descripción, acciones y un slot de filtros, y debajo un ChartShell… `@/components/charts`
- **ChartShell** [chart-shell] — El contenedor estructural de todo gráfico: gestiona los cuatro estados (datos, cargando, vacío y error), anuncia el lienzo como region role… `@/components/charts`
- **CompositionDonut** [composition-donut] — El reparto de un total en pocas partes como panel de tablero: un anillo mudo con el total escrito en el centro y una leyenda al lado con ca… `@/components/charts`
- **DistributionBar** [distribution-bar] — Un total repartido en pocos tramos contiguos —mañana, tarde y noche; con cita, sin cita— como una sola barra donde cada tramo ocupa lo que… `@/components/charts`
- **DonutChart** [donut-chart] — Preset de dona o pastel sobre ChartCard para composiciones parte-todo: estado de los objetivos, modalidad de los cursos, distribución por s… `@/components/charts`
- **EChart** [echart] — El wrapper base de Apache ECharts: inicializa la instancia una sola vez, la redimensiona con ResizeObserver y la destruye al desmontar. `@/components/charts`
- **HeatmapChart** [heatmap-chart] — Preset de mapa de calor sobre ChartCard para cruzar dos dimensiones: día por franja horaria, equipo por competencia. `@/components/charts`
- **HeatmapMatrix** [heatmap-matrix] — Matriz de calor en tabla: filas jerárquicas y desplegables contra columnas, con la primera columna fija al hacer scroll horizontal. `@/components/charts`
- **KpiCard** [kpi-card] — Tarjeta de indicador para dashboards: título, valor grande siempre en texto, delta coloreado por tendencia y un sparkline opcional como con… `@/components/charts`
- **LineChart** [line-chart] — Preset de línea sobre ChartCard para series temporales y tendencias: usuarios activos por mes, NPS por semana, avance de un indicador. `@/components/charts`
- **MetricCard** [metric-card] — La tarjeta de la que se hace una fila de indicadores: acento vertical del tono junto al título, icono en chip, número grande y neutro, píld… `@/components/charts`
- **SparklineChart** [sparkline-chart] — Línea ultracompacta sin ejes, leyenda ni cuadrícula, pensada para acompañar un número: dentro de un KpiCard, en una celda de tabla o al lad… `@/components/charts`

## IA · 18

Botones, loaders, badges y paneles con la identidad de IA.

- **AiAgentDrawer** [ai-agent-drawer] — El panel lateral del Agente IA. `@/components/ai/AiAgentDrawer`
- **AiAnalyzingState** [ai-analyzing-state] — La forma única en que la IA dice «dame un momento» en toda la plataforma. `@/components/ai-interaction`
- **AIButton** [ai-button] — El botón que dispara una acción de IA. `@/components/ai-interaction`
- **AiGeneratedBadge** [ai-generated-badge] — Marca de procedencia: este contenido lo escribió la IA. `@/components/ai-interaction`
- **AIInsightCard** [ai-insight-card] — Tarjeta para un hallazgo de la IA: tipo (insight, riesgo, recomendación u oportunidad), nivel de confianza, evidencia e impacto en dos colu… `@/components/ai`
- **AILoader** [ai-loader] — Estado de espera mientras la IA trabaja, en tres formas: una línea con spinner, un bloque con esqueleto o una tarjeta con progreso. `@/components/ai-interaction`
- **AIPanel** [ai-panel] — Contenedor de insights de IA: una Card con la chispa en el título, acciones en la cabecera, pie opcional y estados de carga y vacío ya resu… `@/components/ai`
- **AiSparkGlyph** [ai-spark-glyph] — La marca de «la IA está trabajando»: el orbe de Clipper pensando (gira rápido, halo vivo). `@/components/ai-interaction`
- **ChatActionCard** [chat-action-card] (beta) — Un cambio que el agente propone y la persona aplica: qué cambia (lo de antes tachado, lo nuevo al lado), los avisos y «Aplicar» o «Descarta… `@/components/chat`
- **ChatComposer** [chat-composer] (beta) — La caja de escribir del chat: el borde que recorre y la malla al enfocar, Enter envía y Shift+Enter baja de línea, el «+» con conectores y… `@/components/chat`
- **ChatPanel** [chat-panel] (beta) — El chat como panel lateral: se porta al ancla de AdminShell (la pantalla se estrecha, no se tapa) y flota a OVERLAY_INSET del borde. `@/components/chat`
- **ChatQuestionCard** [chat-question-card] (beta) — Una pregunta del agente con opciones numeradas: se contesta tocando, con la tecla del número o escribiendo en «Otro». `@/components/chat`
- **ChatScreen** [chat-screen] (beta) — El chat a pantalla completa: lo que AdminShell enseña en modo «Agente IA» cuando la app lo pasa en `config.agentView`. `@/components/chat`
- **ChatThread** [chat-thread] (beta) — El hilo: las preguntas a la derecha (copiar, editar y reenviar desde ahí) y las respuestas con el destello del agente, que se escriben sola… `@/components/chat`
- **ChatVoiceMode** [chat-voice-mode] (beta) — El modo voz, a pantalla completa: en `immersive` siempre en oscuro con la malla de IA; en `page` (el de Clipper, lo usan la app y la reserv… `@/components/chat`
- **Chip** [chip] — Pastilla compacta para filtros, etiquetas y sugerencias. `@/components/ai-interaction`
- **ClipperOrb** [clipper-orb] — El símbolo de la IA en todo el sistema: el orbe de Clipper, un poste de barbería hecho esfera de vidrio con el gradiente de IA. `@/components/ai-interaction`
- **SaveIndicator** [save-indicator] — Indicador discreto del estado de autoguardado: en la nube, guardando, guardado, error o sin conexión. `@/components/ai-interaction`

## Action rail · 10

La barra de acciones flotante y sus piezas.

- **ActionFab** [action-fab] — La barra de acciones cuando no hay sitio para una barra: un solo botón en la esquina que, al tocarlo, despliega hacia arriba todo lo que se… `@/components/action-rail`
- **ActionRailShell** [action-rail-shell] — La barra de acciones flotante que comparten todas las pantallas: una sola pastilla que se abre, se recoge, se arrastra y recuerda su orient… `@/components/action-rail`
- **ConfirmActionPopover** [confirm-action-popover] — El sí/no de una acción de la barra, anclado al botón que lo pide en vez de un diálogo centrado con velo. `@/components/action-rail`
- **DataListActionRail** [data-list-action-rail] — La barra flotante de una pantalla con lista, ya cableada: concentra todo lo que se puede hacer y cambia de contenido según lo marcado. `@/components/action-rail`
- **DrawerActionRail** [drawer-action-rail] — La barra flotante de un drawer de pasos: el pie que crecía con cada herramienta se convierte en el mismo dock que usa la pantalla de fondo,… `@/components/action-rail`
- **RailButton** [rail-button] — Las piezas con las que una pantalla llena su barra flotante: el botón de icono (RailButton), la única acción rellena que admite la barra (R… `@/components/action-rail`
- **RailDragHandle** [rail-drag-handle] — El asa con la que se recoloca la barra flotante, y el hook useDraggableRail que hace el trabajo: sigue al puntero, guarda el punto de solta… `@/components/action-rail`
- **RailOverflowMenu** [rail-overflow-menu] — Las acciones que no cupieron en la barra, detrás de un solo «⋯». `@/components/action-rail`
- **RailSelectionChip** [rail-selection-chip] — «N seleccionadas ✕»: el lector de selección que toda barra flotante muestra mientras una tabla tiene filas marcadas. `@/components/action-rail`
- **RailSettingsMenu** [rail-settings-menu] — Los ajustes propios de la barra —en qué eje se tiende y si se oculta sola— detrás de un solo botón, para no gastar dos huecos de icono en c… `@/components/action-rail`

## Layout y shell · 13

Sidebar, header, shell de administración y páginas.

- **AccountMenu** [account-menu] — Quién eres, dónde estás y como quién estás mirando, en una sola puerta al final de la cabecera. `@/components/app-shell`
- **AdminShell** [admin-shell] — El cascarón del panel de administración: AppSidebar plegable (se recoge solo a los dos segundos), AppHeader, pie legal y un diálogo de feed… `@/components/app-shell`
- **AgentView** [agent-view] (beta) — La pantalla inicial del Agente IA que AdminShell muestra en modo «agent»: saludo con el nombre de la persona, la tarjeta de prompt con el b… `@/components/app-shell/AgentView`
- **AppHeader** [app-header] — La franja de 56px del AdminShell. `@/components/app-shell/AppHeader`
- **AppSidebar** [app-sidebar] — El sidebar del AdminShell, en dos capas: un rail de iconos de 64px que está siempre y no se mueve, y un panel de 240px que se desliza por e… `@/components/app-shell/AppSidebar`
- **CompanyMenu** [company-menu] — El espacio de trabajo activo y su cambio. `@/components/app-shell/CompanyMenu`
- **CoverHero** [cover-hero] — La portada de una pantalla: la foto arriba, encuadrada donde está la cara y fundida hacia abajo, con la columna del contenido montada sobre… `@/components/layout`
- **Header** [header] — La franja superior de 80px del shell: migas, título y descripción a la izquierda; buscador y notificaciones a la derecha. `@/components/layout`
- **PageShell** [page-shell] — El `<main>` de una página: hace scroll por su cuenta, pone el padding de página y centra el contenido en una columna con ancho máximo. `@/components/layout`
- **ProcessCenter** [process-center] (beta) — El Centro de procesos de la cabecera: lo que sigue trabajando aunque la persona cambie de pantalla —importaciones, subidas, exportaciones—… `@/components/app-shell`
- **Resizable** [resizable] — Paneles que se reparten el ancho o el alto de un grupo y se redimensionan arrastrando el asa que los separa. `@/components/layout/Resizable`
- **SidebarIconRail** [sidebar-icon-rail] — El rail de iconos de 64px que queda a la vista cuando el sidebar se pliega: no es el panel encogido, sino una capa propia que nunca cambia… `@/components/app-shell/SidebarIconRail`
- **WorkspaceMenu** [workspace-menu] — El menú que cuelga de la marca del producto en el sidebar: antes de esto, ajustar la cuenta era un engranaje suelto en la cabecera y person… `@/components/app-shell/WorkspaceMenu`

## Media · 6

Carrusel, galerías y previsualizaciones.

- **EmptyGalleryState** [empty-gallery-state] — El estado vacío especializado para colecciones multimedia: icono de imagen, textos por defecto en español y altura mínima para que la secci… `@/components/media`
- **Gallery** [gallery] — El contenedor de página para colecciones multimedia: SectionHeader con título y acciones, ImageGrid debajo y un estado vacío automático cua… `@/components/media`
- **ImageGrid** [image-grid] — La grilla técnica que pinta una lista de `MediaItem` en tarjetas, miniaturas compactas o un bento con spans. `@/components/media`
- **MediaPreview** [media-preview] — La previsualización en detalle de un único `MediaItem`: imagen a tamaño completo o icono de tipo, título, metadatos, descripción y acciones. `@/components/media`
- **PreviewCard** [preview-card] — La tarjeta individual de un `MediaItem`: imagen 16:9 o icono por tipo, badge, título, metadato y descripción, con un pie opcional de accion… `@/components/media`
- **ThemaCarousel** [thema-carousel] — Envoltorio del Carousel de shadcn con cabecera de sección, flechas y puntos de paginación resueltos. `@/components/media`

## Utilidades · 5

Encabezados de página y sección, tags.

- **ActionTile** [action-tile] — Una tarjeta pulsable con icono, título y una pista: «Agregar otra cita», «Enviar recibo», «Avísame si se libera una hora». `@/components/utility`
- **IconTile** [icon-tile] — Un icono sobre una baldosa tintada: fondo al 10 % del tono y glifo en el color pleno, en cuatro tamaños (28, 36, 48 y 64px) y dos formas. `@/components/utility/IconTile`
- **PageHeader** [page-header] — El encabezado de nivel superior de una pantalla: breadcrumbs, título h1 con descripción, acciones primarias a la derecha y una fila de meta… `@/components/utility`
- **SectionHeader** [section-header] — El encabezado de una sección interna de página: eyebrow, título en 18px, descripción y un slot de acciones alineado abajo a la derecha, cer… `@/components/utility`
- **Tag** [tag] — Una etiqueta compacta para metadatos, filtros activos o categorías ligeras, con cinco tonos y una X opcional. `@/components/utility`

## Iconos · 2

El registro semántico de iconos y su wrapper.

- **GlassIcon** [glass-icon] — Ilustración «glass» de 48, 64 o 96px: dos capas de cristal con gradiente, brillo superior y el glifo del registro en blanco. `@/icons`
- **ThemaIcon** [thema-icon] — El wrapper único de iconos del sistema: se pide por nombre semántico del registro, no por proveedor, con tallas de camiseta y tonos semánti… `@/icons`

## Atmósfera y marca · 15

Fondos con material, la personalidad del oficio y la aparición al hacer scroll: cabello, poste, tijeras, grano, halo.

- **BarberGlyph** [barber-glyph] — Grafismos de fondo en línea, un peine y una navaja abierta, dibujados con currentColor a muy baja opacidad detrás de una sección. `@/components/atmosphere`
- **BarberPole** [barber-pole] — El poste de barbería girando: dos remates dorados y un cilindro con las franjas diagonales desplazándose en vertical, el giro clásico hecho… `@/components/atmosphere`
- **CutLine** [cut-line] — Separador entre secciones: unas tijeras cruzan la página y dejan la línea continua convertida en línea de puntos. `@/components/atmosphere`
- **Enter** [enter] — Entrada de los bloques de portada. `@/components/atmosphere`
- **Foil** [foil] — Lámina dorada: la palabra de marca de un titular con un barrido de luz cada siete segundos. `@/components/atmosphere`
- **Grain** [grain] — Grano: una textura de ruido (un SVG en línea, sin coste de red) fundida sobre el fondo con soft-light y sin interceptar el puntero. `@/components/atmosphere`
- **HairBurst** [hair-burst] — Pelo de barba que cae para celebrar: como el confeti, pero con los pelos finos que quedan tras un arreglo de barba, largos, con una curva s… `@/components/atmosphere`
- **HairCanvas** [hair-canvas] — Cabello cayendo sobre una portada: hebras finas y curvas que bajan, se mecen y giran, la mitad en el color de marca y la otra mitad en el d… `@/components/atmosphere`
- **Halo** [halo] — Halo: un resplandor del primario en un punto del contenedor relative, que se funde en el fondo. `@/components/atmosphere`
- **Marquee** [marquee] — Ticker de vocabulario en bucle: los extremos se funden con el fondo, cada palabra lleva su rombo del primario y se pausa al pasar el punter… `@/components/atmosphere`
- **PoleRing** [pole-ring] — La rueda: el poste visto desde arriba, un anillo de ticks radiales del primario girando muy despacio (una vuelta cada 80 s) detrás de un ti… `@/components/atmosphere`
- **Reveal** [reveal] — Envoltorio que aparece al entrar en pantalla: 14px de ascenso y opacidad, una sola vez, con un IntersectionObserver por elemento y ningún m… `@/components/atmosphere`
- **RotatingSeal** [rotating-seal] — El sello de membresía: un anillo de texto girando muy despacio (36 s por vuelta) alrededor de una pieza central, por defecto la flecha del… `@/components/atmosphere`
- **Tilt** [tilt] — Perspectiva hacia el puntero: el panel se inclina siguiendo al ratón (rotateX/rotateY con perspectiva) y vuelve a su sitio al salir. `@/components/atmosphere`
- **Vignette** [vignette] — Viñeta: los bordes se hunden y el centro respira. `@/components/atmosphere`

## Bloques · 1

Composiciones completas listas para una pantalla: piezas del sistema ya cableadas entre sí.

- **DataListBlock** [data-list-block] — Una lista de datos con todo lo que se le pide a una: buscador, configuración de columnas (orden, visibilidad y fijado), vista de tabla o de… `@/components/blocks`

## Iconos del registro

`<ThemaIcon name="…" />` · analytics, arrowLeft, arrowRight, attach, audioWave, award, bolt, bug, building, calendar, calendarAdd, camera, chart, chat, check, chevronDown, chevronLeft, chevronRight, chevronUp, clock, close, code, compass, copy, crop, dashboard, download, edit, error, expand, eyeOff, eyeOn, facebook, feedback, file, filter, flag, folderAdd, globe, google, graduation, help, home, idea, image, info, instagram, layers, link, lock, login, logout, magicWand, mail, mic, micOff, microsoft, moon, more, neutral, notification, palette, pause, phone, plus, pointer, queue, record, refresh, rocket, rotateLeft, rotateRight, scissors, search, securityLock, send, settings, share, smsCode, sparkles, star, stop, success, sun, survey, task, templates, thumbsDown, thumbsUp, ticket, trendDown, trendUp, upload, userAdd, users, vacancies, video, volume, warning, zoomIn, zoomOut
