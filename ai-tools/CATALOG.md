# Catálogo de componentes Thema

Generado el 2026-09-23 con `npm run catalog` desde `src/docs/registry`. No se edita a mano. Las reglas están en `AGENTS.md`; cada ficha completa en `/docs#/components/<id>`.

**166 componentes** en 18 familias · 43 iconos en el registro · 113 tokens.

## Guías

- **[object Object]** (start) — [object Object] → `/docs#/guides/como-usar`
- **[object Object]** (start) — [object Object] → `/docs#/guides/flujo-de-trabajo`
- **[object Object]** (start) — [object Object] → `/docs#/guides/trabajar-con-ia`
- **[object Object]** (patterns) — [object Object] → `/docs#/guides/botones`
- **[object Object]** (patterns) — [object Object] → `/docs#/guides/ventanas`
- **[object Object]** (patterns) — [object Object] → `/docs#/guides/estados`
- **[object Object]** (patterns) — [object Object] → `/docs#/guides/formularios`

## Fundamentos

- [object Object] → `/docs#/foundations/themes`
- [object Object] → `/docs#/foundations/colors`
- [object Object] → `/docs#/foundations/typography`
- [object Object] → `/docs#/foundations/radius`
- [object Object] → `/docs#/foundations/spacing`
- [object Object] → `/docs#/foundations/icons`
- [object Object] → `/docs#/foundations/language`
- [object Object] → `/docs#/foundations/motion`

## [object Object] · 45

[object Object]

### Accordion

Lista de secciones plegables con un encabezado que muestra u oculta su contenido. Úsalo para preguntas frecuentes, ajustes agrupados o cualquier contenido largo que el usuario no necesita ver de golpe.

```ts
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `"single" \| "multiple"` |  | Si solo una sección puede estar abierta o varias a la vez. |
| `collapsible` | `boolean` | `false` | En modo single, permite cerrar la sección abierta haciendo clic de nuevo. |
| `value / defaultValue` | `string \| string[]` |  | Sección(es) abierta(s). Usa `value` + `onValueChange` para controlarlo. |
| `onValueChange` | `(value) => void` |  | Se dispara cuando cambia la sección abierta. |
| `disabled` | `boolean` | `false` | Desactiva todos los triggers. |
| `AccordionItem.value` | `string` |  | Identificador único de la sección (obligatorio). |

Ejemplo · Una sección a la vez:

```tsx
<Accordion type="single" collapsible defaultValue="plans">
  <AccordionItem value="plans">
    <AccordionTrigger>¿Puedo cambiar de plan más adelante?</AccordionTrigger>
    <AccordionContent>Sí. El cambio se aplica al instante y el cobro se prorratea.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="seats">
    <AccordionTrigger>¿Cómo se cuentan los asientos?</AccordionTrigger>
    <AccordionContent>Cada usuario activo del mes cuenta como un asiento.</AccordionContent>
  </AccordionItem>
</Accordion>
```

Sí: Redacta los encabezados como preguntas o títulos cortos que anticipen el contenido. · Abre por defecto la sección más relevante si el usuario la necesita de inmediato. · Usa `multiple` cuando el usuario compara información entre secciones.
No: No escondas en un acordeón contenido crítico o acciones primarias. · No anides acordeones dentro de acordeones. · No lo uses para navegación; para eso están Tabs o la sub-navegación.
Relacionados: tabs, card

### ActivityDropdown

Tarjeta de actividad reciente que se despliega al hacer clic: la cabecera se mantiene y las filas entran en cascada. Úsala en un panel lateral o en el inicio para resumir lo que pasó sin abrir una pantalla de notificaciones.

```ts
import { ActivityDropdown, type ActivityItem } from "@/components/ui/activity-dropdown"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `ActivityItem[]` |  | Las filas: `{ id, title, description?, time, icon?, tone?, onClick? }`. Vacío muestra `emptyLabel`. |
| `title` | `string` | `"Actividad reciente"` | Título de la cabecera. El contador de filas se añade solo. |
| `description` | `string` |  | Frase de apoyo; solo se ve con la tarjeta cerrada. |
| `defaultOpen` | `boolean` | `false` | Estado inicial cuando el componente se gobierna solo. |
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado desde fuera; con él manda quien lo pasa. |
| `emptyLabel` | `string` |  | Texto cuando no hay actividad. |
| `className` | `string` |  | Para el layout de afuera: ancho y márgenes. |

Ejemplo · Por defecto:

```tsx
const actividad: ActivityItem[] = [
  { id: "mensaje", icon: <MessageCircle />, tone: "primary", title: "Mensaje nuevo", description: "Sara Restrepo te escribió sobre el plan de onboarding.", time: "Justo ahora" },
  { id: "insignia", icon: <Award />, tone: "positive", title: "Insignia conseguida", description: "Completaste «Seguridad en planta» con 92 %.", time: "Hace 2 min" },
  { id: "sesion", icon: <CalendarClock />, tone: "warning", title: "Sesión en 30 minutos", description: "Inducción operativa · Sala Bogotá 3.", time: "Hace 3 h" },
  { id: "tarea", icon: <ClipboardCheck />, title: "Tarea asignada", description: "Revisar las 12 postulaciones de Analista de datos.", time: "Ayer" },
];

<ActivityDropdown items={actividad} />
```

Sí: Formatea `time` antes de pasarlo: el componente no calcula fechas relativas. · Da `onClick` solo a las filas que de verdad llevan a algún sitio. · Úsala para un resumen corto; si hay más de diez avisos, lleva a la pantalla de notificaciones.
No: No la uses como menú del header: para eso está el Popover con la lista de notificaciones. · No metas dos acciones en una fila; la fila entera es la acción. · No repitas el tono de estado para decorar: `negative` significa que algo falló.
Relacionados: accordion, popover, card, list-item

### Alert

Aviso en línea que llama la atención sobre un mensaje sin interrumpir el flujo. Úsalo para contextualizar una pantalla o sección con información, éxito, advertencia o error; para mensajes efímeros usa un toast.

```ts
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "info" \| "success" \| "warning" \| "destructive"` | `"default"` | Intención semántica; tiñe borde, fondo, texto e icono. |
| `children` | `React.ReactNode` |  | Un SVG opcional como primer hijo, seguido de AlertTitle, AlertDescription y AlertAction. |
| `AlertAction` | `React.ComponentProps<"div">` |  | Contenedor posicionado en la esquina superior derecha para un botón o enlace. |
| `...props` | `React.ComponentProps<"div">` |  | Atributos nativos del contenedor (role="alert" ya viene puesto). |

Ejemplo · Variantes semánticas:

```tsx
<Alert variant="info">
  <Info />
  <AlertTitle>Sincronización en curso</AlertTitle>
  <AlertDescription>Los datos pueden tardar unos minutos en reflejarse.</AlertDescription>
</Alert>
<Alert variant="success">
  <CheckCircle2 />
  <AlertTitle>Curso publicado</AlertTitle>
  <AlertDescription>Ya es visible para los equipos asignados.</AlertDescription>
</Alert>
<Alert variant="warning">
  <AlertTriangle />
  <AlertTitle>Licencias por vencer</AlertTitle>
  <AlertDescription>12 licencias expiran en los próximos 7 días.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <ShieldAlert />
  <AlertTitle>No se pudo importar el archivo</AlertTitle>
  <AlertDescription>Revisa que las columnas coincidan con la plantilla.</AlertDescription>
</Alert>
```

Sí: Coloca el aviso cerca del contenido al que se refiere. · Acompaña las variantes de color con un icono para no depender solo del color. · Escribe un título corto y deja el detalle en la descripción.
No: No apiles más de dos alertas en la misma vista. · No lo uses para confirmaciones puntuales; usa un toast (Sonner). · No pongas más de una acción dentro de `AlertAction`.
Relacionados: alert-dialog, badge, sonner

### AlertDialog

Diálogo modal que exige una decisión explícita antes de continuar: no se cierra al hacer clic fuera ni con Escape sin pasar por Cancelar. Úsalo para confirmar acciones destructivas o irreversibles; para formularios y contenido general usa Dialog.

```ts
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado de apertura. Usa `open` + `onOpenChange` para controlarlo. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar. |
| `AlertDialogContent.size` | `"default" \| "sm"` | `"default"` | `sm` centra el texto y muestra los botones en dos columnas. |
| `AlertDialogAction.variant` | `ButtonProps["variant"]` | `"default"` | Variante del botón de confirmación. |
| `AlertDialogCancel.variant` | `ButtonProps["variant"]` | `"outline"` | Variante del botón de cancelar. |
| `AlertDialogMedia` | `React.ComponentProps<"div">` |  | Contenedor de 40px para un icono ilustrativo dentro del header. |

Ejemplo · Confirmar una acción destructiva:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive"><Trash2 /> Eliminar curso</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
      <AlertDialogDescription>
        Los 230 colaboradores inscritos perderán su progreso. Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Sí: Formula el título como pregunta y nombra el objeto afectado. · Explica la consecuencia en la descripción («no se puede deshacer»). · Etiqueta la acción con el verbo concreto: «Eliminar», no «Aceptar».
No: No lo uses para formularios ni contenido navegable; usa Dialog. · No lo abras automáticamente al cargar una página. · No encadenes dos confirmaciones seguidas.
Relacionados: dialog, button, sheet

### Avatar

Imagen circular que representa a una persona o equipo, con iniciales de respaldo mientras carga o si la imagen falla. Úsalo en listas de usuarios, comentarios, asignaciones y cabeceras de perfil.

```ts
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | 24, 32 o 40px. Badge y contador del grupo se ajustan al tamaño. |
| `AvatarImage.src / alt` | `string` |  | Imagen del usuario. Mientras carga o si falla, se muestra el fallback. |
| `AvatarFallback.delayMs` | `number` |  | Retrasa el fallback para evitar parpadeos con imágenes rápidas. |
| `AvatarBadge` | `React.ComponentProps<"span">` |  | Punto de estado en la esquina inferior derecha; el color va en `className`. |
| `AvatarGroup` | `React.ComponentProps<"div">` |  | Solapa los avatares hijos con un anillo del color de fondo. |
| `AvatarGroupCount` | `React.ComponentProps<"div">` |  | Círculo final del grupo para «+N» o un icono de acción. |

Ejemplo · Tamaños:

```tsx
<Avatar size="sm"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar size="lg"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
```

Sí: Usa siempre un `AvatarFallback` con iniciales (máximo dos letras). · Incluye `alt` descriptivo en la imagen. · Limita el grupo a 3-4 avatares visibles y agrupa el resto en el contador.
No: No mezcles tamaños dentro del mismo grupo. · No uses el badge para más de un estado; un color, un significado. · No lo uses como botón sin envolverlo en un control accesible.
Relacionados: badge, hover-card, card

### Badge

Etiqueta compacta de 20px para clasificar, contar o señalar el estado de un elemento. Úsalo junto a títulos, filas de tabla o tarjetas cuando una palabra basta para dar contexto.

```ts
import { Badge } from "@/components/ui/badge"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "secondary" \| "outline" \| "neutral" \| "destructive" \| "ghost" \| "link"` | `"default"` | Estilo visual del badge. |
| `asChild` | `boolean` | `false` | Aplica los estilos al hijo (p. ej. un <a>) en lugar de renderizar un <span>. |
| `...props` | `React.ComponentProps<"span">` |  | Atributos nativos del span. |

Ejemplo · Variantes:

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="neutral">Neutral</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="link">Link</Badge>
```

Sí: Usa una o dos palabras; el badge no envuelve texto. · Mantén un significado fijo por color en toda la aplicación. · Acompaña los estados con icono para no depender solo del color.
No: No uses badges como botones sin `asChild` y un control real. · No pongas más de tres badges seguidos en la misma fila. · No lo uses para contadores grandes; a partir de 99 muestra «99+».
Relacionados: button, alert, avatar

### BorderBeam

Haz de luz que recorre el borde de su contenedor en bucle, sin afectar al layout. Úsalo con moderación para destacar una tarjeta, un plan recomendado o un panel de IA; el padre debe ser `relative` y tener radio de borde.

```ts
import { BorderBeam } from "@/components/ui/border-beam"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `duration` | `number` | `15` | Segundos que tarda el haz en dar una vuelta completa. |
| `size` | `number` | `200` | Tamaño de referencia del haz (variable CSS `--size`). |
| `borderWidth` | `number` | `1.5` | Grosor del borde iluminado, en px. |
| `anchor` | `number` | `90` | Ángulo inicial del gradiente cónico, en grados. |
| `colorFrom` | `string` | `"#ffaa40"` | Color al inicio del haz. Acepta cualquier valor CSS, incluidas variables. |
| `colorTo` | `string` | `"#9c40ff"` | Color en la cola del haz. |
| `delay` | `number` | `0` | Desfase de la animación en segundos (útil con varios haces). |
| `className` | `string` |  | Clases extra para el contenedor absoluto. |

Ejemplo · Con los colores de marca:

```tsx
<Card className="relative">
  <CardHeader>
    <CardTitle>Asistente Thema</CardTitle>
    <CardDescription>Pregunta sobre tu progreso o pide una recomendación.</CardDescription>
  </CardHeader>
  <BorderBeam duration={10} colorFrom="var(--primary)" colorTo="var(--info)" />
</Card>
```

Sí: Asegúrate de que el padre sea `relative` y tenga `rounded-*`; el haz hereda el radio. · Resérvalo para un solo elemento destacado por vista. · Usa variables del tema en los colores para respetar el modo oscuro.
No: No lo apliques a listas o tablas: satura y cuesta rendimiento. · No lo uses sobre contenedores con `overflow: visible` intencionado; el haz recorta al borde. · No lo combines con otros efectos animados de borde en el mismo elemento.
Relacionados: card, ai-panel

### Button

[object Object]

```ts
import { Button } from "@/components/ui/button"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "outline" \| "secondary" \| "ghost" \| "destructive" \| "link"` | `"default"` | Intención visual del botón. |
| `size` | `"xs" \| "sm" \| "default" \| "lg" \| "icon-xs" \| "icon-sm" \| "icon" \| "icon-lg"` | `"default"` | Altura y padding. Las variantes icon-* son cuadradas. |
| `asChild` | `boolean` | `false` | Renderiza el hijo (p. ej. un <a>) con los estilos del botón. |
| `disabled` | `boolean` | `false` | Desactiva el botón y baja la opacidad al 50%. |
| `...props` | `React.ComponentProps<"button">` |  | Cualquier atributo nativo de <button>. |

Ejemplo · Variantes:

```tsx
<Button>Primaria</Button>
<Button variant="outline">Contorno</Button>
<Button variant="secondary">Secundaria</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="link">Enlace</Button>
```

Sí: Una sola acción primaria por vista o por drawer. · Usa `destructive` solo para acciones irreversibles. · Añade `aria-label` a los botones de solo icono.
No: No uses `link` para acciones que cambian datos. · No mezcles tamaños dentro del mismo grupo de acciones.
Relacionados: badge, ai-button

### ButtonGroup

Une varios Button (o un botón y un trigger) en un solo control: quita los radios internos y solapa los bordes un píxel. Úsalo para acciones hermanas (Exportar / Importar), botones divididos y paginadores compactos.

```ts
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Dirección del grupo. En vertical los hijos ocupan el ancho completo. |
| `...props` | `React.ComponentProps<"div">` |  | Se renderiza con `role="group"`; añade `aria-label` para nombrarlo. |
| `ButtonGroupSeparator.orientation` | `"horizontal" \| "vertical"` | `"vertical"` | Usa `horizontal` dentro de un grupo vertical. Es un Separator decorativo con color `border`. |

Ejemplo · Botón dividido:

```tsx
<ButtonGroup>
  <Button><Download data-icon="inline-start" /> Exportar</Button>
  <ButtonGroupSeparator className="bg-primary-foreground/30" />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="icon" aria-label="Más formatos de exportación"><ChevronDown /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem><FileDown /> Exportar CSV</DropdownMenuItem>
      <DropdownMenuItem><FileDown /> Exportar Excel</DropdownMenuItem>
      <DropdownMenuItem><Mail /> Enviar por correo</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>
```

Sí: Agrupa solo acciones relacionadas y del mismo tamaño. · Usa `outline` o `secondary` para grupos de iguales; reserva `default` para el botón dividido. · Nombra el grupo con `aria-label` cuando los botones sean solo iconos.
No: No mezcles tamaños ni variantes dentro del grupo: el solape de bordes deja de cuadrar. · No lo uses como selector de estado (vista tabla / tablero): eso es ToggleGroup. · No pases de cuatro botones; a partir de ahí, un menú.
Relacionados: button, toggle-group, dropdown-menu, input-group

### Calendar

Cuadrícula de fechas construida sobre react-day-picker con los tokens del sistema. Úsalo dentro de un Popover para los pickers o en línea cuando la fecha es el foco de la pantalla; pasa `locale={es}` para nombres en español.

```ts
import { Calendar } from "@/components/ui/calendar"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"single" \| "multiple" \| "range"` |  | Tipo de selección. Determina la forma de `selected` y `onSelect`. |
| `selected / onSelect` | `Date \| Date[] \| DateRange` |  | Valor seleccionado y su callback, según el modo. |
| `locale` | `Locale` |  | Locale de date-fns (`es`) para nombres de meses y días. |
| `captionLayout` | `"label" \| "dropdown" \| "dropdown-months" \| "dropdown-years"` | `"label"` | Encabezado como texto o con selectores de mes/año. |
| `numberOfMonths` | `number` | `1` | Meses visibles a la vez. |
| `showOutsideDays` | `boolean` | `true` | Muestra atenuados los días de los meses vecinos. |
| `showWeekNumber` | `boolean` | `false` | Añade una columna con el número de semana. |
| `disabled` | `Matcher \| Matcher[]` |  | Fechas no seleccionables: rangos, días de la semana, funciones… |
| `buttonVariant` | `ButtonProps["variant"]` | `"ghost"` | Variante de los botones de navegación de mes. |
| `...props` | `DayPickerProps` |  | Cualquier otra prop de react-day-picker (defaultMonth, fromDate, toDate, etc.). |

Ejemplo · Selección simple:

```tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";

const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar mode="single" locale={es} selected={date} onSelect={setDate} />
<p>{date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : "Sin fecha"}</p>
```

Sí: Pasa siempre `locale={es}` en interfaces en español. · Deshabilita explícitamente las fechas no válidas en lugar de validar después. · Usa dos meses cuando el usuario elige rangos de más de una semana.
No: No lo muestres en línea en formularios densos; envuélvelo en un Popover. · No cambies `--cell-size` por componente; ajústalo con `className` solo si es imprescindible. · No uses `dropdown` sin acotar el rango de años con `fromYear`/`toYear`.
Relacionados: popover, date-picker, date-range-picker

### Card

Superficie elevada que agrupa contenido relacionado con cabecera, cuerpo y pie opcionales. Úsala para resumir una entidad, un métrica o un formulario corto; no como envoltorio genérico de cualquier sección.

```ts
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Card` | `React.HTMLAttributes<HTMLDivElement>` |  | Contenedor con borde, radio 2xl y sombra `shadow-card`. Acepta `ref`. |
| `CardHeader` | `React.HTMLAttributes<HTMLDivElement>` |  | Columna con `p-6` y separación entre título y descripción. |
| `CardTitle` | `React.HTMLAttributes<HTMLDivElement>` |  | Título en 18px bold. Renderiza un div; pon un heading dentro si lo necesitas. |
| `CardDescription` | `React.HTMLAttributes<HTMLDivElement>` |  | Texto secundario en 14px. |
| `CardContent` | `React.HTMLAttributes<HTMLDivElement>` |  | Cuerpo con `p-6 pt-0`. |
| `CardFooter` | `React.HTMLAttributes<HTMLDivElement>` |  | Fila con borde superior para acciones o enlaces. |

Ejemplo · Tarjeta de métrica:

```tsx
<Card className="w-64">
  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
    <CardDescription>Usuarios activos</CardDescription>
    <Users className="size-4 text-text-muted" />
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">1.284</p>
    <p className="mt-1 flex items-center gap-1 text-xs text-success"><TrendingUp className="size-3" /> +12% vs. mes anterior</p>
  </CardContent>
</Card>
```

Sí: Una idea por tarjeta: una entidad, una métrica o una acción. · Alinea las acciones a la derecha del pie y deja una sola primaria. · Reduce el padding (`p-4`) en cuadrículas densas.
No: No anides tarjetas dentro de tarjetas. · No uses Card como contenedor de página completa; para eso está el layout. · No mezcles tarjetas con y sin sombra en la misma cuadrícula.
Relacionados: border-beam, badge, button

### Carousel

Carrusel accesible construido sobre Embla, con flechas, navegación por teclado y soporte de arrastre. Úsalo para recorrer colecciones de tarjetas o imágenes cuando no cabe todo en pantalla y el orden importa.

```ts
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje de desplazamiento. En vertical fija una altura en CarouselContent. |
| `opts` | `EmblaOptionsType` |  | Opciones de Embla: `loop`, `align`, `dragFree`, `skipSnaps`… |
| `plugins` | `EmblaPluginType[]` |  | Plugins de Embla (autoplay, wheel gestures, etc.). |
| `setApi` | `(api: CarouselApi) => void` |  | Recibe la instancia de Embla para controlar el carrusel desde fuera. |
| `CarouselItem.className` | `string` |  | Usa `basis-1/2`, `basis-1/3`… para mostrar varios ítems por vista. |
| `CarouselPrevious / CarouselNext` | `ButtonProps` |  | Botones absolutos; aceptan `variant`, `size` y `className` para reposicionarlos. |

Ejemplo · Básico:

```tsx
<div className="w-full max-w-sm px-12">
  <Carousel>
    <CarouselContent>
      {courses.map((course) => (
        <CarouselItem key={course}>
          <Card><CardContent className="flex aspect-video items-center justify-center">{course}</CardContent></Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</div>
```

Sí: Deja espacio lateral (`px-12`) para las flechas o reposiciónalas con `className`. · Muestra indicadores cuando hay más de 3 slides. · Activa `loop` solo en colecciones cortas donde tenga sentido volver al inicio.
No: No lo uses como único acceso a contenido importante; el usuario puede no desplazarse. · No añadas autoplay sin control de pausa. · No mezcles alturas distintas entre slides del mismo carrusel.
Relacionados: card, button

### Checkbox

Casilla de 16px para elegir una o varias opciones de un conjunto, con estado indeterminado para selecciones parciales. Úsalo en formularios y listas seleccionables; para una preferencia on/off usa Switch.

```ts
import { Checkbox } from "@/components/ui/checkbox"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `checked / defaultChecked` | `boolean \| "indeterminate"` |  | Estado de la casilla. `indeterminate` muestra un guion para selecciones parciales. |
| `onCheckedChange` | `(checked: boolean \| "indeterminate") => void` |  | Se dispara al cambiar el estado. |
| `disabled` | `boolean` | `false` | Desactiva la casilla y baja la opacidad. |
| `required` | `boolean` | `false` | Marca el control como obligatorio en formularios nativos. |
| `name / value` | `string` |  | Se envían con el formulario como un input oculto. |
| `aria-invalid` | `boolean` |  | Aplica el borde y anillo destructivos. |

Ejemplo · Con etiqueta y descripción:

```tsx
const [accepted, setAccepted] = React.useState(false);

<div className="flex items-start gap-3">
  <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
  <div className="grid gap-1">
    <Label htmlFor="terms">Acepto los términos y la política de privacidad</Label>
    <p className="text-[13px] text-text-muted">Es necesario para crear la cuenta.</p>
  </div>
</div>
```

Sí: Coloca siempre una etiqueta visible o `aria-label`. · Usa `indeterminate` solo en casillas que resumen un grupo. · Alinea la casilla con la primera línea del texto cuando la etiqueta es larga.
No: No lo uses para acciones inmediatas; para eso está Switch. · No hagas depender el envío del formulario de una única casilla sin explicar por qué. · No lo hagas más pequeño de 16px: el área táctil ya es mínima.
Relacionados: switch, radio-group, label

### Collapsible

Muestra u oculta un bloque de contenido desde un trigger, sin la lista de ítems de Accordion. Úsalo para «Ver más detalles», filtros avanzados o listas que se pliegan para dejar solo el primer elemento.

```ts
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado controlado o inicial. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar. |
| `disabled` | `boolean` | `false` | El trigger deja de responder. |
| `CollapsibleTrigger.asChild` | `boolean` |  | Aplica el rol y `aria-expanded` al hijo (normalmente un Button). |
| `CollapsibleContent.forceMount` | `boolean` |  | Mantiene el contenido en el DOM aunque esté cerrado (p. ej. para formularios). |

Ejemplo · «Ver más detalles» en una ficha:

```tsx
const [open, setOpen] = React.useState(false);

<Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-surface">
  <div className="flex items-center justify-between px-4 py-3">
    <span>Ana Lucía Torres</span>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm">
        {open ? "Ver menos" : "Ver más detalles"}
        <ChevronDown data-icon="inline-end" className={open ? "rotate-180" : ""} />
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    <dl className="border-t px-4 py-3">…</dl>
  </CollapsibleContent>
</Collapsible>
```

Sí: Di en el trigger qué se va a mostrar («Ver más detalles», «3 pendientes más»), no solo «Más». · Gira la flecha con el estado para que se entienda que se puede volver a plegar. · Deja fuera del contenido lo imprescindible: el título, el primer ítem, el contador.
No: No lo uses para varias secciones seguidas: eso es Accordion. · No escondas dentro campos obligatorios de un formulario sin indicarlo. · No anides collapsibles; el usuario pierde la referencia de qué abrió.
Relacionados: accordion, drawer-section, button

### Command

Paleta de comandos con búsqueda difusa, grupos y atajos, basada en cmdk; el ítem activo se resalta con una píldora que se desliza entre opciones. Úsala como buscador global (⌘K) o como lista filtrable dentro de un Popover o Combobox.

```ts
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from "@/components/ui/command"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Command.loop` | `boolean` | `false` | Al llegar al final de la lista, las flechas vuelven al inicio. |
| `Command.filter` | `(value, search, keywords) => number` |  | Función de puntuación personalizada para el filtrado. |
| `Command.shouldFilter` | `boolean` | `true` | Desactívalo si filtras en el servidor. |
| `CommandDialog.open / onOpenChange` | `boolean / (open) => void` |  | Estado del diálogo; hereda todas las props de Dialog. |
| `CommandDialog.title / description` | `string` |  | Texto accesible (visualmente oculto) del diálogo. |
| `CommandDialog.showCloseButton` | `boolean` | `false` | Muestra la X de cierre del Dialog. |
| `CommandItem.value` | `string` |  | Valor usado para filtrar; por defecto es el texto del ítem. |
| `CommandItem.onSelect` | `(value: string) => void` |  | Se dispara con clic o Enter. |
| `CommandItem.data-checked` | `boolean` |  | Muestra el icono de check al final del ítem. |
| `CommandGroup.heading` | `string` |  | Título del grupo. |

Ejemplo · En línea:

```tsx
<Command className="rounded-xl border shadow-card">
  <CommandInput placeholder="Escribe un comando o busca…" />
  <CommandList>
    <CommandEmpty>Sin resultados.</CommandEmpty>
    <CommandGroup heading="Sugerencias">
      <CommandItem><Calendar /> Calendario</CommandItem>
      <CommandItem><BookOpen /> Catálogo de cursos</CommandItem>
      <CommandItem><Users /> Equipos</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Cuenta">
      <CommandItem><User /> Perfil <CommandShortcut>⌘P</CommandShortcut></CommandItem>
      <CommandItem><Settings /> Ajustes <CommandShortcut>⌘,</CommandShortcut></CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

Sí: Agrupa los resultados por tipo y ordena los grupos por frecuencia de uso. · Muestra un `CommandEmpty` con una acción alternativa cuando no hay coincidencias. · Registra el atajo ⌘K/Ctrl+K si la paleta es global.
No: No metas más de 7-8 ítems por grupo sin filtrar; el usuario se pierde. · No uses Command para listas pequeñas sin búsqueda; usa DropdownMenu o Select. · No dupliques atajos entre ítems.
Relacionados: dialog, popover, dropdown-menu, fluid-highlight

### ContextMenu

Menú que se abre con clic derecho (o pulsación larga) sobre un elemento, con los mismos ítems, casillas, radios, atajos y submenús que DropdownMenu y la misma apariencia. Úsalo como atajo experto sobre filas, tarjetas y lienzos; nunca como único acceso a una acción.

```ts
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar; la apertura la decide el clic derecho, no es controlable. |
| `modal` | `boolean` | `true` | Bloquea la interacción con el resto de la página mientras está abierto. |
| `ContextMenuTrigger.disabled` | `boolean` | `false` | El clic derecho vuelve a mostrar el menú del navegador. |
| `ContextMenuTrigger.asChild` | `boolean` |  | Convierte al hijo (una fila, una tarjeta) en la zona de clic derecho. |
| `ContextMenuItem.variant` | `"default" \| "destructive"` | `"default"` | Tiñe el ítem y la píldora de resaltado en rojo. |
| `ContextMenuItem.inset` | `boolean` |  | Sangría izquierda para alinear con ítems que tienen indicador. |
| `ContextMenuItem.onSelect` | `(event) => void` |  | Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto. |
| `ContextMenuCheckboxItem.checked / onCheckedChange` | `boolean / (checked) => void` |  | Estado de la casilla. |
| `ContextMenuRadioGroup.value / onValueChange` | `string / (value) => void` |  | Valor activo del grupo de radios. |
| `ContextMenuSubContent.sideOffset` | `number` | `12` | Separación del submenú respecto al ítem que lo abre. |

Ejemplo · Clic derecho sobre una fila de colaboradores:

```tsx
<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="flex items-center gap-3 px-4 py-2.5 data-[state=open]:bg-muted">
      <Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
      <span>Ana Lucía Torres</span>
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuLabel>Ana Lucía Torres</ContextMenuLabel>
    <ContextMenuItem onSelect={edit}><Pencil /> Editar perfil <ContextMenuShortcut>⌘E</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuItem onSelect={copyEmail}><Copy /> Copiar correo</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger><Send /> Enviar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Encuesta de clima</ContextMenuItem>
        <ContextMenuItem>Recordatorio de curso</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" onSelect={offboard}><Trash2 /> Dar de baja</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

Sí: Ofrece las mismas acciones también por un botón visible (un DropdownMenu de «⋯»): el clic derecho no se descubre solo. · Resalta el trigger mientras el menú está abierto (`data-[state=open]`) para que se sepa sobre qué se actúa. · Ordena igual que en el DropdownMenu equivalente; lo destructivo, al final y separado.
No: No lo pongas sobre zonas donde el usuario espera el menú nativo (campos de texto, enlaces, imágenes). · No superes ~10 ítems ni más de un nivel de submenú. · No mezcles en un mismo menú acciones sobre la fila y ajustes globales de la tabla.
Relacionados: dropdown-menu, kbd, table, fluid-highlight

### Dialog

Ventana modal centrada para tareas cortas que requieren atención sin abandonar la pantalla: editar un campo, compartir, ver un detalle. Para confirmaciones destructivas usa AlertDialog; para flujos largos, un Sheet.

```ts
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / defaultOpen` | `boolean` |  | Estado de apertura. Usa `open` + `onOpenChange` para controlarlo. |
| `onOpenChange` | `(open: boolean) => void` |  | Se dispara al abrir o cerrar (X, Escape, clic fuera o DialogClose). |
| `modal` | `boolean` | `true` | Bloquea la interacción con el resto de la página. |
| `DialogContent.showCloseButton` | `boolean` | `true` | Muestra la X en la esquina superior derecha. |
| `DialogContent.className` | `string` |  | Sobrescribe el ancho (`sm:max-w-*`) u otros estilos del panel. |
| `DialogFooter.showCloseButton` | `boolean` | `false` | Añade un botón outline «Close» que cierra el diálogo. |
| `DialogClose` | `Radix Close` |  | Cualquier elemento con `asChild` que cierra el diálogo al hacer clic. |

Ejemplo · Formulario controlado:

```tsx
const [open, setOpen] = React.useState(false);

const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  await saveProfile();
  setOpen(false);
};

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm"><Pencil /> Editar</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>Los cambios se verán en toda la plataforma.</DialogDescription>
      </DialogHeader>
      <Label htmlFor="name">Nombre completo</Label>
      <Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

Sí: Incluye siempre `DialogTitle` (y `DialogDescription` si aporta contexto) para accesibilidad. · Mantén el contenido en una sola columna y sin scroll interno cuando sea posible. · Devuelve el foco al trigger al cerrar; Radix lo hace por ti si usas `DialogTrigger`.
No: No abras un diálogo desde otro diálogo. · No lo uses para confirmaciones destructivas; usa AlertDialog. · No metas flujos de varios pasos; usa un Sheet o una página.
Relacionados: alert-dialog, sheet, command, popover

### DropdownMenu

Menú contextual anclado a un botón con ítems, grupos, atajos, casillas, radios y submenús; el resaltado se desliza entre ítems con FluidHighlight. Úsalo para acciones secundarias sobre un elemento o para menús de cuenta.

```ts
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado de apertura controlado. |
| `DropdownMenuContent.align` | `"start" \| "center" \| "end"` | `"start"` | Alineación respecto al trigger. |
| `DropdownMenuContent.side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Lado preferido; cambia si no cabe. |
| `DropdownMenuContent.sideOffset` | `number` | `4` | Separación con el trigger en px. |
| `DropdownMenuItem.variant` | `"default" \| "destructive"` | `"default"` | Tiñe el ítem y la píldora de resaltado en rojo. |
| `DropdownMenuItem.inset` | `boolean` |  | Añade sangría izquierda para alinear con ítems que tienen indicador. |
| `DropdownMenuItem.onSelect` | `(event) => void` |  | Se dispara al elegir; `event.preventDefault()` mantiene el menú abierto. |
| `DropdownMenuCheckboxItem.checked / onCheckedChange` | `boolean / (checked) => void` |  | Estado de la casilla. |
| `DropdownMenuRadioGroup.value / onValueChange` | `string / (value) => void` |  | Valor activo del grupo de radios. |

Ejemplo · Menú de cuenta con submenú:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Más opciones"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Ana Torres</DropdownMenuLabel>
    <DropdownMenuGroup>
      <DropdownMenuItem><User /> Perfil <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem><Settings /> Ajustes <DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger><UserPlus /> Invitar</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Por correo</DropdownMenuItem>
        <DropdownMenuItem>Por enlace</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><LogOut /> Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Sí: Ordena los ítems por frecuencia y separa lo destructivo al final. · Usa `align="end"` cuando el trigger está en el borde derecho. · Añade `aria-label` al trigger si es solo un icono.
No: No superes ~10 ítems sin agrupar; considera Command con búsqueda. · No uses el menú para navegación principal. · No anides más de un nivel de submenú.
Relacionados: command, popover, select, fluid-highlight

### FluidHighlight

Píldora de fondo que persigue al ítem activo de una lista en lugar de pintar cada ítem por separado, de modo que recorrer el menú se lee como un movimiento continuo. Ya viene integrada en DropdownMenu, Select y Command; úsala directamente solo al construir una lista propia.

```ts
import { FluidHighlight } from "@/components/ui/fluid-highlight"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Clases extra para la píldora (p. ej. cambiar el color `bg-accent`). |
| `Contenedor padre` | `requisito` |  | Debe ser `position: relative` y ser el elemento con scroll; monta la píldora como PRIMER hijo. |
| `Ítem activo` | `requisito` |  | Se detecta por `[data-highlighted]`, `[cmdk-item][data-selected="true"]` o por el foco dentro de `[data-radix-collection-item]` / `[cmdk-item]`. |
| `data-variant` | `"destructive"` |  | En el ítem activo: la píldora se tiñe con `bg-destructive/10`. |
| `Ítems` | `requisito` |  | Deben llevar `relative z-[1]` para quedar por encima de la píldora y no pintar su propio fondo de hover/focus. |

Ejemplo · Integrada en DropdownMenu:

```tsx
// No hay que hacer nada: DropdownMenuContent ya monta <FluidHighlight /> como primer hijo.
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Acciones <ChevronDown /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuItem><Pencil /> Editar</DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicar</DropdownMenuItem>
    <DropdownMenuItem><Archive /> Archivar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive"><Trash2 /> Eliminar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Sí: Deja que DropdownMenu, Select y Command la monten por ti; no la dupliques dentro de ellos. · En listas propias, quita `hover:bg-*` / `focus:bg-*` de los ítems para que se vea el recorrido. · Mantén el `border-radius` en el ítem: la píldora lo copia.
No: No la montes fuera de un contenedor `relative`; se posicionaría respecto a otro ancestro. · No la uses en listas virtualizadas con ítems que se desmontan mientras están activos. · No la coloques después de los ítems en el DOM: quedaría por encima del texto.
Relacionados: dropdown-menu, select, command

### HoverCard

Panel flotante que aparece al pasar el cursor (o enfocar) un elemento, con el mismo lenguaje visual que Popover. Úsalo para previsualizar información de paso, como un perfil o una definición; para contenido que el usuario abre y cierra a propósito usa Popover.

```ts
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `openDelay` | `number` | `150` | Milisegundos antes de abrir tras entrar con el cursor. |
| `closeDelay` | `number` | `100` | Milisegundos antes de cerrar tras salir. |
| `open / onOpenChange` | `boolean / (open) => void` |  | Control externo del estado. |
| `HoverCardContent.side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Lado preferido; se invierte si no cabe. |
| `HoverCardContent.align` | `"start" \| "center" \| "end"` | `"center"` | Alineación respecto al trigger. |
| `HoverCardContent.sideOffset` | `number` | `4` | Separación con el trigger en px. |
| `HoverCardContent.className` | `string` |  | Sobrescribe el ancho (`w-72` por defecto) u otros estilos. |

Ejemplo · Vista previa de perfil:

```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <a href="#/people/ana" className="font-medium text-primary hover:underline">@ana.torres</a>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-3">
      <Avatar size="lg"><AvatarImage src="…" /><AvatarFallback>AT</AvatarFallback></Avatar>
      <div>
        <p className="text-sm font-semibold">Ana Torres</p>
        <p className="text-[13px] text-text-secondary">Líder de Talento · Bogotá</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

Sí: Usa un trigger enfocable (enlace o botón) para que funcione con teclado. · Limita el contenido a texto, avatar y badges; nada que requiera clic. · Sube el `openDelay` si el trigger está en una lista densa para evitar aperturas accidentales.
No: No metas botones ni formularios dentro; el panel se cierra al salir. · No lo uses en pantallas táctiles como único acceso a información importante. · No lo confundas con Tooltip: si cabe en una línea, usa Tooltip.
Relacionados: popover, tooltip, avatar

### Input

Campo de texto de una línea (40px) con los estados de foco, deshabilitado y archivo del sistema. Úsalo para cualquier dato corto; para varias líneas usa Textarea y para iconos o botones integrados usa InputGroup.

```ts
import { Input } from "@/components/ui/input"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `string` | `"text"` | Tipo nativo: text, email, password, number, search, date, file… |
| `value / defaultValue` | `string` |  | Valor controlado o inicial. |
| `onChange` | `(event) => void` |  | Se dispara con cada pulsación. |
| `placeholder` | `string` |  | Texto de ayuda dentro del campo; no sustituye a la etiqueta. |
| `disabled` | `boolean` | `false` | Bloquea la edición y baja la opacidad. |
| `aria-invalid` | `boolean` |  | Marca el campo como inválido para tecnologías de asistencia; combina con clases destructivas. |
| `ref` | `React.Ref<HTMLInputElement>` |  | Acceso al input nativo (forwardRef). |
| `...props` | `React.ComponentProps<"input">` |  | Cualquier atributo nativo de <input>. |

Ejemplo · Con etiqueta, ayuda y validación:

```tsx
const [value, setValue] = React.useState("");
const isValid = value === "" || EMAIL_RE.test(value);

<Label htmlFor="email">Correo corporativo</Label>
<Input
  id="email"
  type="email"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  aria-invalid={!isValid}
  aria-describedby="email-hint"
  className={isValid ? undefined : "border-destructive focus-visible:ring-destructive/20"}
/>
<p id="email-hint" className={isValid ? "text-text-muted" : "text-destructive"}>…</p>
```

Sí: Acompaña siempre el campo de un Label asociado por `htmlFor`. · Usa el `type` correcto para obtener el teclado adecuado en móvil. · Muestra el error debajo del campo y enlázalo con `aria-describedby`.
No: No uses el placeholder como única etiqueta. · No cambies la altura por campo; mantén los 40px para alinear con botones `lg`. · No pongas iconos dentro con posicionamiento manual; usa InputGroup.
Relacionados: label, input-group, textarea, select

### InputGroup

Campo compacto (32px) con complementos integrados: iconos, texto, botones o incluso un textarea con pie. Úsalo cuando el campo necesita contexto o una acción pegada (buscar, limpiar, mostrar contraseña); para un campo simple basta con Input.

```ts
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupButton, InputGroupText } from "@/components/ui/input-group"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `InputGroup` | `React.ComponentProps<"div">` |  | Contenedor `role="group"` de 32px que dibuja borde, foco y estado inválido de su control. |
| `InputGroupAddon.align` | `"inline-start" \| "inline-end" \| "block-start" \| "block-end"` | `"inline-start"` | Posición del complemento. Los `block-*` apilan el grupo en columna. |
| `InputGroupInput` | `React.ComponentProps<"input">` |  | Input sin borde propio; hereda el foco del grupo. |
| `InputGroupTextarea` | `React.ComponentProps<"textarea">` |  | Textarea sin borde propio; el grupo crece en altura. |
| `InputGroupButton.size` | `"xs" \| "sm" \| "icon-xs" \| "icon-sm"` | `"xs"` | Botón compacto (ghost por defecto) para acciones dentro del campo. |
| `InputGroupButton.variant` | `ButtonProps["variant"]` | `"ghost"` | Variante del botón. |
| `InputGroupText` | `React.ComponentProps<"span">` |  | Texto o icono+texto en color secundario. |

Ejemplo · Búsqueda con limpiar:

```tsx
const [query, setQuery] = React.useState("");

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput placeholder="Buscar…" value={query} onChange={(event) => setQuery(event.target.value)} />
  {query && (
    <InputGroupAddon align="inline-end">
      <InputGroupButton size="icon-xs" aria-label="Limpiar" onClick={() => setQuery("")}><X /></InputGroupButton>
    </InputGroupAddon>
  )}
</InputGroup>
```

Sí: Pon `aria-label` en los botones de solo icono dentro del grupo. · Usa `InputGroupText` para unidades y prefijos fijos en lugar de placeholder. · Mantén un solo botón por lado.
No: No mezcles InputGroup (32px) con Input (40px) en la misma fila sin ajustar alturas. · No anides otro InputGroup dentro. · No uses addons `block-*` con inputs de una línea; son para textarea.
Relacionados: input, textarea, button, command

### Kbd

Tecla de atajo en un `<kbd>` real, con aspecto de tecla física (20px o 16px de alto). Úsalo para indicar atajos en menús, tooltips, campos de búsqueda y páginas de ayuda; KbdGroup encadena varias teclas con «+».

```ts
import { Kbd, KbdGroup } from "@/components/ui/kbd"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"default" \| "sm"` | `"default"` | 20px de alto con texto de 11px, o 16px con texto de 10px. |
| `...props` | `React.ComponentProps<"kbd">` |  | Atributos nativos del elemento kbd. |
| `KbdGroup.separator` | `React.ReactNode \| null` | `"+"` | Se intercala entre teclas y queda oculto para lectores de pantalla. `null` las pega sin separador. |

Ejemplo · Pista en un campo de búsqueda:

```tsx
<button type="button" className="flex h-9 w-72 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted">
  <Search className="size-4" />
  <span className="flex-1 text-left">Buscar colaboradores, cursos…</span>
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </KbdGroup>
</button>
```

Sí: Usa el símbolo del sistema del usuario (⌘ en macOS, Ctrl en el resto) y resuélvelo en tiempo de ejecución. · Una tecla por Kbd; la combinación la arma KbdGroup. · Añade `aria-label` cuando la tecla solo lleva un icono.
No: No uses Kbd como botón: no es interactivo y anula los eventos de puntero. · No documentes un atajo que no exista de verdad en la aplicación. · No mezcles tamaños dentro de un mismo grupo.
Relacionados: tooltip, command, dropdown-menu, context-menu

### Label

Etiqueta accesible para controles de formulario, en 14px medium. Asóciala por `htmlFor` a un Input, Checkbox, Switch o Select para ampliar el área de clic y que los lectores de pantalla anuncien el campo.

```ts
import { Label } from "@/components/ui/label"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `htmlFor` | `string` |  | `id` del control asociado. Obligatorio salvo que el control esté dentro del label. |
| `children` | `React.ReactNode` |  | Texto de la etiqueta; puede incluir un asterisco o un icono. |
| `className` | `string` |  | Clases extra (color, tamaño). |
| `...props` | `React.ComponentProps<"label">` |  | Cualquier atributo nativo de <label>. |

Ejemplo · Con Input:

```tsx
<div className="space-y-1.5">
  <Label htmlFor="email">Correo</Label>
  <Input id="email" type="email" placeholder="nombre@empresa.com" />
</div>
```

Sí: Usa frases cortas en forma de sustantivo: «Correo», «Fecha de inicio». · Marca los campos obligatorios de forma consistente en todo el formulario. · Coloca la etiqueta a la izquierda para Checkbox y Switch, encima para Input y Select.
No: No termines las etiquetas con dos puntos. · No uses el label para instrucciones largas; usa un texto de ayuda debajo del campo. · No dejes controles sin etiqueta aunque tengan placeholder.
Relacionados: input, checkbox, switch, select

### MagicCard

Tarjeta seleccionable con barrido de luz al pasar el cursor, leve elevación y un estado seleccionado que no mueve el contenido. Úsala cuando la persona elige una opción entre varias tarjetas (tipos de encuesta, formas de convocar) o en pares sí/no.

```ts
import { MagicCard } from "@/components/ui/magic-card"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isSelected` | `boolean` | `false` | Pinta el borde, el fondo y el texto en el acento; el borde de 1.5px ya está reservado, así que el contenido no salta. |
| `variant` | `"primary" \| "ai"` | `"primary"` | La variante `ai` usa la malla degradada y el anillo de IA; ignora `tone`. |
| `tone` | `Tone` |  | Acento con el que se selecciona y hace hover (`brand`, `positive`, `warning`, `negative`, `neutral`, `ai`). Sin tono, azul de marca. |
| `contentClassName` | `string` |  | Clases del contenedor interno (`flex w-full`). Útil para apilar en columna. |
| `...props` | `React.HTMLAttributes<HTMLButtonElement>` |  | Se renderiza como <button type="button">; acepta onClick, aria-*, etc. |

Ejemplo · Conjunto con tonos:

```tsx
const [selected, setSelected] = React.useState("pulse");

<MagicCard tone="brand" isSelected={selected === "pulse"} onClick={() => setSelected("pulse")} contentClassName="flex-col items-start gap-2">
  <span className="tone-reveal-chip flex size-8 items-center justify-center rounded-lg"><ClipboardList className="size-4" /></span>
  <span className="text-sm font-semibold">Pulso</span>
  <span className="text-xs text-text-secondary">Cinco preguntas, cada semana.</span>
</MagicCard>
<MagicCard tone="positive" isSelected={selected === "climate"} onClick={() => setSelected("climate")}>…</MagicCard>
<MagicCard tone="warning" isSelected={selected === "feedback"} onClick={() => setSelected("feedback")}>…</MagicCard>
```

Sí: Usa `tone` cuando cada opción ya tiene su propio color en el producto. · Deja el contenido corto: un icono, un título y una línea de ayuda. · Mantén un solo elemento seleccionado por grupo (o usa un par sí/no).
No: No la uses como tarjeta informativa sin acción: para eso está Card. · No combines `variant="ai"` con `tone`; la variante lo ignora. · No metas controles interactivos dentro: ya es un botón.
Relacionados: card, button, radio-group

### MovingBorderBeam

Un haz de luz con el degradado de IA que recorre el perímetro del contenedor. Es decorativo: se coloca dentro de un elemento `relative` y señala que una acción o un panel es de IA.

```ts
import { MovingBorderBeam } from "@/components/ui/moving-border-beam"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"glow" \| "line"` | `"glow"` | `glow`: blob radial recortado al borde. `line`: trazo con fundido en los extremos, estable en cualquier proporción. |
| `duration` | `number` | `6000` | Milisegundos por vuelta completa. |
| `borderWidth` | `number` | `1.5` | Grosor del anillo (px). |
| `rx / ry` | `number \| string` | `22` | Radios del rectángulo; deben coincidir con el `border-radius` del contenedor. |
| `colorFrom / colorTo` | `string` | `degradado IA` | Extremos del degradado del haz. |
| `beamSize` | `number` | `160` | Diámetro del blob; solo aplica al modo `glow`. |
| `className` | `string` |  | Clases extra para la capa absoluta. |

Ejemplo · Botón de icono (glow):

```tsx
<button type="button" className="relative flex size-10 items-center justify-center rounded-[12px] bg-surface shadow-card" aria-label="Abrir asistente">
  <MovingBorderBeam mode="glow" rx={12} ry={12} beamSize={90} duration={4000} />
  <Sparkles className="relative size-4" />
</button>
```

Sí: Coloca el haz dentro de un contenedor `relative` con el mismo radio. · Usa `line` en píldoras y tarjetas anchas; `glow` en botones cuadrados. · Resérvalo para la superficie de IA del producto.
No: No lo pongas en varios elementos a la vez en la misma vista. · No lo uses como indicador de foco o de estado seleccionado.
Relacionados: magic-card, ai-button, card

### Pagination

Navegación entre páginas de una lista, compuesta con enlaces que heredan los estilos de Button (ghost por defecto, outline para la activa). Úsala al pie de tablas y listados largos con URL por página.

```ts
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `PaginationLink.isActive` | `boolean` | `false` | Marca la página actual: variante outline y `aria-current="page"`. |
| `PaginationLink.size` | `ButtonProps["size"]` | `"icon"` | Tamaño heredado de Button; los enlaces numéricos son cuadrados. |
| `PaginationPrevious.text / PaginationNext.text` | `string` | `"Previous" / "Next"` | Etiqueta visible (oculta en móvil, solo queda el chevron). Pásala en español. |
| `...props` | `React.ComponentProps<"a">` |  | PaginationLink es un <a>: href, onClick, etc. Pagination es un <nav>, PaginationContent un <ul>. |

Ejemplo · Con estado:

```tsx
const [page, setPage] = React.useState(3);

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" text="Anterior" onClick={go(page - 1)} />
    </PaginationItem>
    {pageWindow(page, total).map((token) =>
      token === "ellipsis" ? (
        <PaginationItem><PaginationEllipsis /></PaginationItem>
      ) : (
        <PaginationItem key={token}>
          <PaginationLink href="#" isActive={token === page} onClick={go(token)}>{token}</PaginationLink>
        </PaginationItem>
      )
    )}
    <PaginationItem>
      <PaginationNext href="#" text="Siguiente" onClick={go(page + 1)} />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

Sí: Pasa siempre `text` en español a Previous/Next. · Usa elipsis cuando hay más de 7 páginas; muestra primera, última y vecinas. · Sincroniza la página con la URL para que sea compartible.
No: No la uses para menos de 2 páginas: oculta el componente. · No renderices todas las páginas de una lista larga.
Relacionados: button, table

### Popover

Panel flotante anclado a un disparador, con entrada suave (fade + zoom + deslizamiento según el lado) y salida rápida. Úsalo para filtros, selectores y microformularios que no justifican un diálogo.

```ts
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverAnchor } from "@/components/ui/popover"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Lado del disparador por el que sale; también decide la dirección del deslizamiento. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alineación respecto al disparador. |
| `sideOffset` | `number` | `4` | Separación en px respecto al disparador. |
| `collisionPadding` | `number` | `16` | Margen mínimo con los bordes del viewport antes de recolocarse. |
| `container` | `HTMLElement` |  | Nodo donde se monta el portal (por defecto, body). |
| `liquid` | `boolean` | `false` | Reservado a los paneles del header del shell: sustituye el zoom por un clip-path circular desde `--reveal-x`/`--reveal-y`. |
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado controlado, en `Popover`. |

Ejemplo · Microformulario:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline"><Settings2 /> Dimensiones</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64 gap-3">
    <PopoverHeader>
      <PopoverTitle>Dimensiones</PopoverTitle>
      <PopoverDescription>Tamaño del bloque en píxeles.</PopoverDescription>
    </PopoverHeader>
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="width">Ancho</Label>
      <Input id="width" className="h-8" value={width} onChange={(e) => setWidth(e.target.value)} />
      <Label htmlFor="height">Alto</Label>
      <Input id="height" className="h-8" value={height} onChange={(e) => setHeight(e.target.value)} />
    </div>
  </PopoverContent>
</Popover>
```

Sí: Usa `asChild` en el disparador para que el botón conserve su semántica. · Mantén el contenido a una tarea: un filtro, un ajuste, una confirmación ligera. · Cierra desde dentro con estado controlado cuando hay acciones.
No: No lo uses para flujos largos o con scroll: usa Sheet o Dialog. · No actives `liquid` fuera del header del shell.
Relacionados: tooltip, dialog, sheet, hover-card, dropdown-menu

### Progress

Barra de progreso determinada, de 2px de radio completo, que se desplaza con transform. Úsala cuando se conoce el avance de una tarea: cargas, pasos completados, cuotas.

```ts
import { Progress } from "@/components/ui/progress"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` | `0` | Avance de 0 a 100. |
| `color` | `"primary" \| "success" \| "warning" \| "destructive"` | `"primary"` | Color del indicador. |
| `className` | `string` |  | Clases del riel; cambia `h-*` para otra altura. |
| `...props` | `React.ComponentProps<ProgressPrimitive.Root>` |  | Atributos Radix y nativos (aria-label, max…). |

Ejemplo · Colores semánticos:

```tsx
<Progress value={45} />
<Progress value={100} color="success" />
<Progress value={85} color="warning" />
<Progress value={100} color="destructive" />
```

Sí: Acompáñala de un porcentaje o un texto que diga qué avanza. · Usa `success` al llegar al 100% de una tarea. · Añade `aria-label` cuando no hay texto asociado.
No: No la uses para esperas indeterminadas: usa un loader. · No cambies el color solo por decoración.
Relacionados: skeleton, slider

### RadioGroup

Grupo de opciones excluyentes con navegación por flechas y un punto de 16px que se rellena en primario. Úsalo cuando hay de dos a cinco opciones que deben verse todas a la vez; con más, prefiere un Select.

```ts
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | Opción seleccionada (controlado / inicial), en `RadioGroup`. |
| `onValueChange` | `(value: string) => void` |  | Se dispara al elegir otra opción. |
| `disabled` | `boolean` | `false` | En el grupo desactiva todo; en un ítem, solo esa opción. |
| `orientation` | `"horizontal" \| "vertical"` |  | Solo afecta a la navegación por teclado; la disposición se cambia con `className`. |
| `RadioGroupItem.value` | `string` |  | Valor del ítem. Requerido. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState("biweekly");

<RadioGroup value={value} onValueChange={setValue}>
  {options.map((option) => (
    <div key={option.value} className="flex items-center gap-2">
      <RadioGroupItem id={option.value} value={option.value} />
      <Label htmlFor={option.value}>{option.label}</Label>
    </div>
  ))}
</RadioGroup>
```

Sí: Asocia cada ítem a un Label con `htmlFor`. · Elige una opción por defecto cuando exista una razonable. · Ordena las opciones de forma predecible (frecuencia, tamaño, alfabético).
No: No lo uses para más de ~5 opciones. · No lo uses para activar/desactivar algo: es un Switch.
Relacionados: checkbox, switch, select, label, magic-card

### ScrollArea

Contenedor con scroll y barra personalizada de 10px que aparece solo al desplazarse, coherente entre navegadores. Úsalo en listas y paneles con altura fija: sidebars, listas de resultados, carruseles de tarjetas.

```ts
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Va en la raíz: aquí se fija la altura o el ancho máximos. |
| `children` | `React.ReactNode` |  | Contenido del viewport. |
| `type` | `"auto" \| "always" \| "scroll" \| "hover"` | `"hover"` | Cuándo se muestra la barra (prop de Radix). |
| `ScrollBar.orientation` | `"vertical" \| "horizontal"` | `"vertical"` | La vertical ya viene incluida; añade una horizontal cuando el contenido desborde en ancho. |

Ejemplo · Lista vertical:

```tsx
<ScrollArea className="h-64 w-56 rounded-xl border border-border/60 bg-surface">
  <div className="p-3">
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Versiones</h4>
    {versions.map((version) => (
      <React.Fragment key={version}>
        <div className="py-1.5 text-sm">{version}</div>
        <Separator />
      </React.Fragment>
    ))}
  </div>
</ScrollArea>
```

Sí: Fija la altura en el ScrollArea, no en el contenido. · Usa `w-max` en el contenido cuando el scroll es horizontal. · Redondea el ScrollArea y el viewport heredará el radio.
No: No anides ScrollAreas: confunde el scroll con la rueda. · No lo uses para la página entera; es para regiones.
Relacionados: separator, table, sheet

### Select

Desplegable de una sola opción con chevron que gira al abrir, píldora de resaltado que se desliza entre ítems y entrada en cascada. Úsalo para listas de 5 a ~30 opciones conocidas; para buscar entre muchas, usa Command.

```ts
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | Opción elegida (controlado / inicial), en `Select`. |
| `onValueChange` | `(value: string) => void` |  | Se dispara al elegir. |
| `disabled` | `boolean` | `false` | En `Select` desactiva el control; en `SelectItem`, esa opción. |
| `SelectTrigger.size` | `"sm" \| "default"` | `"default"` | Marca `data-size`; combina con `h-8 text-xs` para la versión compacta. |
| `SelectValue.placeholder` | `string` |  | Texto cuando no hay valor. |
| `SelectContent.position` | `"item-aligned" \| "popper"` | `"item-aligned"` | Alineado al ítem activo (nativo) o colgando del disparador. |
| `SelectContent.collisionPadding` | `number` | `16` | Margen con los bordes del viewport. |

Ejemplo · Controlado con Label:

```tsx
const [area, setArea] = React.useState("Personas");

<Label htmlFor="area">Área</Label>
<Select value={area} onValueChange={setArea}>
  <SelectTrigger id="area"><SelectValue placeholder="Elige un área" /></SelectTrigger>
  <SelectContent>
    {areas.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
  </SelectContent>
</Select>
```

Sí: Pon un placeholder que diga qué se elige, no «Seleccionar». · Agrupa con SelectLabel cuando hay más de ~8 opciones. · Asocia un Label con `htmlFor` al id del SelectTrigger.
No: No lo uses para 2–4 opciones visibles: usa RadioGroup o Tabs. · No lo uses para selección múltiple. · No pongas acciones en la lista: es para elegir un valor.
Relacionados: radio-group, command, dropdown-menu, input, label

### Separator

Línea de 1px en el color de borde, horizontal o vertical. Úsala para separar bloques de contenido o ítems de una fila cuando el espacio en blanco no basta.

```ts
import { Separator } from "@/components/ui/separator"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Dirección de la línea. |
| `decorative` | `boolean` | `true` | Si es decorativa se oculta a lectores de pantalla; con `false` se anuncia como separador. |
| `className` | `string` |  | Márgenes (`my-4`, `mx-2`) o color alternativo. |

Ejemplo · Entre bloques:

```tsx
<div className="space-y-1">
  <h4 className="text-sm font-semibold">Encuesta de clima</h4>
  <p className="text-xs text-text-secondary">Cerrada el 12 de marzo · 312 respuestas</p>
</div>
<Separator className="my-4" />
<p className="text-sm">Los resultados se comparten con líderes de equipo.</p>
```

Sí: Añade el margen desde fuera (`my-*`, `mx-*`). · Pon `decorative={false}` cuando separa secciones con sentido semántico.
No: No apiles separadores entre cada elemento de una lista densa; usa bordes en los ítems. · No la uses como línea de énfasis o decoración de color.
Relacionados: scroll-area, card

### Sheet

Panel lateral (o inferior/superior) sobre un velo difuminado: entra recorriendo todo su ancho con curva expo-out en 500ms y sale en 300ms. Úsalo para editar un registro, navegar en móvil o mostrar acciones sin abandonar la página.

```ts
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Lado de anclaje; fija posición, radio, borde y la animación de entrada/salida. |
| `showCloseButton` | `boolean` | `true` | Botón X fantasma en la esquina superior derecha. |
| `modal` | `boolean` | `true` | Debe coincidir con el `modal` de `Sheet`. En `false` el componente pinta su propio velo (z-40) para no dejar la página clicable. |
| `overlayClassName / overlayStyle` | `string / CSSProperties` |  | Recortan o desplazan el velo cuando el panel convive con algo fuera de él (p. ej. el Agente IA). |
| `open / onOpenChange` | `boolean / (open) => void` |  | Estado controlado, en `Sheet`. |
| `useBodyScrollLock(active)` | `hook` |  | Exportado del mismo archivo: bloquea el scroll del body en drawers no modales, con contador para varios a la vez. |

Ejemplo · Formulario de edición (right):

```tsx
<Sheet>
  <SheetTrigger asChild><Button variant="outline">Editar encuesta</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editar encuesta</SheetTitle>
      <SheetDescription>Los cambios se aplican al guardar.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 px-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </div>
    <SheetFooter className="flex-row justify-end">
      <SheetClose asChild><Button variant="ghost">Cancelar</Button></SheetClose>
      <SheetClose asChild><Button>Guardar</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

Sí: Usa `right` para editar, `left` para navegar y `bottom` para acciones en móvil. · Cierra con SheetClose desde los botones del footer. · Pon siempre SheetTitle: Radix lo exige para accesibilidad.
No: No lo uses para confirmaciones cortas: usa Dialog o AlertDialog. · No mezcles `modal={false}` en Sheet sin pasarlo también a SheetContent.
Relacionados: dialog, drawer-shell, popover, button

### Skeleton

Marcador de posición con pulso suave que ocupa el sitio del contenido mientras llega. Compón varios con las mismas medidas del contenido final para que la pantalla no salte al cargar.

```ts
import { Skeleton } from "@/components/ui/skeleton"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Define ancho, alto y radio. Sin clases mide 0px: el esqueleto siempre necesita dimensiones. |
| `...props` | `React.ComponentProps<"div">` |  | Cualquier atributo nativo de <div>. |

Ejemplo · Perfil:

```tsx
<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-1 flex-col gap-2">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-1/3" />
  </div>
</div>
```

Sí: Replica la silueta del contenido final: mismas alturas, anchos aproximados y radios. · Usa `rounded-full` para avatares y `rounded-md/lg` para botones y medios. · Muéstralo solo si la carga tarda más de ~300ms para evitar parpadeos.
No: No lo uses para acciones en curso (guardar, enviar): ahí va Progress o un spinner. · No pongas un único bloque gris gigante; varias piezas comunican mejor qué viene.
Relacionados: progress, card, table

### Slider

Control deslizante de Radix con pista fina, rango en color primario y un pulgar que crece al pasar el cursor. Acepta uno o varios pulgares (rango), pasos discretos y orientación vertical.

```ts
import { Slider } from "@/components/ui/slider"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `number[]` |  | Uno o más valores; cada uno pinta un pulgar. |
| `onValueChange` | `(value: number[]) => void` |  | Se dispara en cada movimiento. Usa `onValueCommit` para reaccionar solo al soltar. |
| `min / max` | `number` | `0 / 100` | Límites de la escala. |
| `step` | `number` | `1` | Incremento entre valores válidos. |
| `minStepsBetweenThumbs` | `number` | `0` | Separación mínima entre pulgares en un rango. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | En vertical toma la altura del contenedor. |
| `disabled` | `boolean` | `false` | Baja la opacidad al 50% y bloquea la interacción. |

Ejemplo · Controlado con etiqueta y valor:

```tsx
const [value, setValue] = React.useState([65]);

<div className="flex items-center justify-between">
  <Label htmlFor="volume"><Volume2 /> Volumen</Label>
  <span className="text-xs tabular-nums">{value[0]}%</span>
</div>
<Slider id="volume" value={value} onValueChange={setValue} max={100} step={1} />
```

Sí: Muestra el valor numérico al lado; el pulgar solo no basta para leerlo. · Usa `step` acorde a la precisión que importa (100 en montos, 1 en porcentajes). · Asocia un Label con `htmlFor` al `id` del slider.
No: No lo uses para elegir entre pocas opciones nombradas: usa RadioGroup o SegmentedControl. · No dispares peticiones en `onValueChange`; usa `onValueCommit`.
Relacionados: range-slider, progress, radio-group

### Switch

Interruptor de dos estados con efecto inmediato, en dos tamaños (32px y 24px de ancho). Úsalo para preferencias que se aplican al instante; para opciones que se envían con un formulario, prefiere Checkbox.

```ts
import { Switch } from "@/components/ui/switch"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"default" \| "sm"` | `"default"` | 32×18px o 24×14px. El pulgar se ajusta solo. |
| `checked / defaultChecked` | `boolean` |  | Estado controlado o inicial. |
| `onCheckedChange` | `(checked: boolean) => void` |  | Se dispara al conmutar. |
| `disabled` | `boolean` | `false` | Cursor not-allowed y opacidad al 50%. |
| `aria-invalid` | `boolean` |  | Pinta el borde y el anillo en destructivo. |
| `...props` | `React.ComponentProps<SwitchPrimitive.Root>` |  | Incluye `name` y `value` para formularios nativos. |

Ejemplo · Controlado con etiqueta:

```tsx
const [checked, setChecked] = React.useState(true);

<Switch id="notify" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="notify">Notificarme por correo</Label>
```

Sí: Aplica el cambio al instante; si necesita «Guardar», usa Checkbox. · Etiqueta siempre: Label con `htmlFor` o `aria-label` en listas densas. · Escribe la etiqueta en positivo («Recordatorios»), no en negativo («No enviar»).
No: No lo uses como selector entre dos opciones equivalentes: ahí va SegmentedControl. · No agrupes varios switches que dependan entre sí sin explicarlo en la ayuda.
Relacionados: checkbox, label, segmented-control

### Table

La tabla semántica base: contenedor con scroll horizontal, cabecera, cuerpo, pie y caption con la tipografía del sistema. Al montarse, las filas del cuerpo entran en cascada (fade + leve ascenso escalonado por fila, definido en globals.css).

```ts
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Table` | `componente` |  | Envuelve la <table> en un contenedor `overflow-x-auto`; la tabla mide `w-full`. |
| `TableHeader / TableBody / TableFooter` | `componente` |  | thead, tbody y tfoot. El cuerpo lleva `data-slot="table-body"`, que activa la cascada. |
| `TableRow` | `componente` |  | Borde inferior, hover en `bg-muted/50` y `data-state="selected"` para la selección. |
| `TableHead / TableCell` | `componente` |  | Celda de cabecera (h-10, medium) y de cuerpo (p-2). `whitespace-nowrap` por defecto. |
| `TableCaption` | `componente` |  | Texto secundario debajo de la tabla. |
| `className / ...props` | `atributos nativos` |  | Cada pieza acepta las props de su elemento HTML. |

Ejemplo · Básica con caption:

```tsx
<Table>
  <TableCaption>Equipos con asientos asignados en el ciclo 2026.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Área</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Asientos</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>…</TableBody>
</Table>
```

Sí: Alinea los números a la derecha con `tabular-nums`. · Usa Badge para estados en vez de texto coloreado. · Para tablas con ordenación, paginación o columnas fijas usa TableShell, que se apoya en estas piezas.
No: No metas la tabla en otro contenedor con scroll horizontal; Table ya trae el suyo. · No animes las filas por tu cuenta: la cascada ya está en globals.css y se activa sola.
Relacionados: table-shell, table-header-controls, pagination, checkbox, badge

### Tabs

Pestañas de Radix con un indicador que se desliza entre triggers gracias a `layoutId` de framer-motion. Dos variantes: `view` (por defecto, píldora blanca sobre la pista, texto primario) para cambiar de vista dentro de una sección, y `page` (relleno primario, 40px) para las secciones principales de una página.

```ts
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | En `Tabs`. Pestaña activa controlada o inicial. |
| `onValueChange` | `(value: string) => void` |  | En `Tabs`. Se dispara al cambiar de pestaña. |
| `variant` | `"view" \| "page"` | `"view"` | En `TabsList`. Cambia la altura (36/40px), el radio y el estilo del indicador; los triggers lo leen por contexto. |
| `value` | `string` |  | En `TabsTrigger` y `TabsContent`. Debe coincidir entre ambos. |
| `disabled` | `boolean` |  | En `TabsTrigger`. Opacidad al 50% y sin eventos. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | En `Tabs`. Cambia la navegación por teclado; los estilos están pensados para horizontal. |

Ejemplo · Variante view (por defecto):

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview"><BarChart3 /> Resumen</TabsTrigger>
    <TabsTrigger value="people"><Users /> Personas</TabsTrigger>
    <TabsTrigger value="tasks"><ListChecks /> Acciones</TabsTrigger>
    <TabsTrigger value="settings"><Settings /> Ajustes</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  …
</Tabs>
```

Sí: Una sola `page` por pantalla; dentro de cada sección usa `view`. · Mantén las etiquetas cortas (1–2 palabras) y, si llevan icono, en todas. · Renderiza un `TabsContent` por cada trigger, con el mismo `value`.
No: No uses Tabs para navegar entre rutas: para eso está ThemaTabs / TabsNav. · No anides dos niveles de Tabs con la misma variante. · No pongas más de 5–6 pestañas; agrupa o usa Select.
Relacionados: thema-tabs, tabs-nav, segmented-control

### Textarea

Campo de texto multilínea con el mismo borde, radio y anillo de foco que Input, y 120px de alto mínimo. Úsalo para comentarios, descripciones y cualquier texto que no quepa en una línea.

```ts
import { Textarea } from "@/components/ui/textarea"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `rows` | `number` |  | Filas visibles. El `min-h-[120px]` manda salvo que lo bajes con `className="min-h-0"`. |
| `placeholder` | `string` |  | Texto de ayuda en color muted. |
| `disabled` | `boolean` | `false` | Cursor not-allowed y opacidad al 50%. |
| `readOnly` | `boolean` | `false` | Se puede seleccionar y copiar, no editar. |
| `aria-invalid` | `boolean` |  | Marca el campo como inválido para lectores de pantalla; combina con clases destructivas. |
| `...props` | `React.ComponentProps<"textarea">` |  | Cualquier atributo nativo: value, onChange, maxLength, name… |

Ejemplo · Con etiqueta y ayuda:

```tsx
<div className="grid gap-2">
  <Label htmlFor="notes">Notas internas</Label>
  <Textarea id="notes" placeholder="Solo las verá el equipo de People." />
  <span className="text-xs text-text-muted">Opcional.</span>
</div>
```

Sí: Etiqueta siempre con Label y `htmlFor`. · Indica límites o requisitos en la línea de ayuda, no solo en el error. · Valida al salir del campo o al enviar, no en cada tecla.
No: No lo uses para una sola línea: usa Input. · No fijes `resize: none` sin motivo; la persona debe poder ampliarlo.
Relacionados: input, label, field, form-section

### ThemaLogo

El isotipo Thema como SVG inline, blanco por defecto y con una leve escala al pasar el cursor. Pensado para superficies oscuras (sidebar, header, pantallas de acceso); en fondos claros pásale un color explícito o `currentColor`.

```ts
import { ThemaLogo } from "@/components/ui/ThemaLogo"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `24` | Ancho en px; el alto es `size × 25 / 24`. |
| `color` | `string` | `"white"` | Relleno de los trazos. Acepta cualquier color CSS o `currentColor`. |
| `className` | `string` |  | Clases del contenedor (flex centrado con hover:scale-110). |

Ejemplo · Tamaños:

```tsx
<ThemaLogo size={16} />
<ThemaLogo size={24} />
<ThemaLogo size={32} />
<ThemaLogo size={48} />
```

Sí: Úsalo sobre fondos oscuros o pásale un color con contraste suficiente. · Respeta la proporción: cambia solo `size`, nunca estires el SVG. · Deja aire alrededor: al menos la mitad del tamaño del isotipo.
No: No lo recolorees con degradados ni sombras. · No lo uses como botón sin envolverlo en un enlace o botón real.
Relacionados: thema-icon, thema-product-header

### Toaster / toast()

El Toaster de Sonner afinado con los tokens Thema: iconos por tipo, bordes tintados y un botón de cierre de 28px que sí se puede pulsar. Se monta una sola vez (la app ya lo hace vía ThemaToaster) y desde cualquier pantalla se dispara con `toast()`.

```ts
import { toast } from "sonner"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `toast(title, options?)` | `función` |  | Dispara un toast neutro. `toast.success/info/warning/error/loading` cambian icono y borde. |
| `options.description` | `string` |  | Segunda línea en color secundario. |
| `options.action` | `{ label, onClick }` |  | Botón primario dentro del toast. |
| `options.duration` | `number` | `4000` | Milisegundos en pantalla; `Infinity` lo hace persistente. |
| `options.id` | `string \| number` |  | Reutiliza un toast existente (p. ej. actualizar un `loading`). |
| `toast.promise(promise, { loading, success, error })` | `función` |  | Encadena los tres estados en un mismo toast. |
| `<Toaster />` | `componente` |  | El contenedor de `@/components/ui/sonner`. Ya está montado a través de ThemaToaster; no montes otro. |

Ejemplo · Tipos:

```tsx
toast("Nota guardada");
toast.success("Encuesta publicada");
toast.info("Hay una versión nueva disponible");
toast.warning("Quedan 2 asientos");
toast.error("No se pudo conectar");
```

Sí: Confirma lo que acaba de ocurrir en una línea; usa la descripción para el detalle. · Ofrece «Deshacer» en lugar de pedir confirmación previa cuando la acción es reversible. · Reutiliza el `id` para actualizar un toast de carga en vez de apilar dos.
No: No montes un segundo `<Toaster />`: cada toast saldría duplicado. · No uses toasts para errores que bloquean el flujo; ahí va Alert o AlertDialog. · No abuses de `duration: Infinity`; solo para avisos que requieren acción.
Relacionados: thema-toaster, alert, alert-dialog, button

### Toggle

Botón de dos estados que se ve activo o inactivo en el acto: negrita, fijar, mostrar u ocultar. Comparte alturas con Button (28, 32 y 36px) para convivir en la misma barra. Para varias opciones relacionadas, usa ToggleGroup.

```ts
import { Toggle } from "@/components/ui/toggle"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "outline"` | `"default"` | Sin borde (para barras) o con borde (para ir solo). |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | 28, 32 o 36px de alto, igual que Button. |
| `pressed / defaultPressed` | `boolean` |  | Estado controlado o inicial. |
| `onPressedChange` | `(pressed: boolean) => void` |  | Se dispara al conmutar. |
| `disabled` | `boolean` | `false` | Sin eventos y con opacidad al 50%. |
| `...props` | `React.ComponentProps<TogglePrimitive.Root>` |  | Radix expone `aria-pressed` y `data-state="on" \| "off"`. |

Ejemplo · Formato de texto:

```tsx
<Toggle aria-label="Negrita"><Bold /></Toggle>
<Toggle aria-label="Cursiva"><Italic /></Toggle>
<Toggle aria-label="Subrayado"><Underline /></Toggle>
```

Sí: Etiqueta siempre con `aria-label` cuando solo lleva icono. · Que el estado activo cambie algo visible al instante; si requiere guardar, usa Checkbox. · Mantén la misma variante en toda la barra.
No: No lo uses para navegar ni para abrir menús: ahí va Button. · No lo uses para «sí / no» en formularios: eso es Switch o Checkbox. · No cambies el icono y el color a la vez sin motivo; el fondo tintado ya marca el estado.
Relacionados: toggle-group, switch, button, segmented-control

### ToggleGroup

Conjunto de Toggle pegados que comparten variante y tamaño por contexto. En modo `single` funciona como selector exclusivo (vista tabla o tablero); en `multiple`, como barra de opciones combinables (negrita + cursiva).

```ts
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `"single" \| "multiple"` |  | Obligatorio. `single` guarda un string; `multiple`, un array. |
| `value / defaultValue` | `string \| string[]` |  | Estado controlado o inicial, según `type`. |
| `onValueChange` | `(value: string \| string[]) => void` |  | En `single`, al deseleccionar llega `""`. |
| `variant` | `"default" \| "outline"` | `"default"` | Se propaga a todos los ítems por contexto. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Se propaga a todos los ítems por contexto. |
| `disabled` | `boolean` | `false` | Deshabilita el grupo completo. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Solo afecta a la navegación con flechas; el layout sigue siendo en fila. |
| `ToggleGroupItem.value` | `string` |  | Obligatorio. Identificador del ítem. |

Ejemplo · Selector de vista (single):

```tsx
const [view, setView] = React.useState("table");

<ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => { if (v) setView(v); }} aria-label="Vista de colaboradores">
  <ToggleGroupItem value="table" aria-label="Tabla"><Table2 /> Tabla</ToggleGroupItem>
  <ToggleGroupItem value="board" aria-label="Tablero"><KanbanSquare /> Tablero</ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="Lista"><List /> Lista</ToggleGroupItem>
</ToggleGroup>
```

Sí: Usa `single` para vistas o alineaciones (exclusivas) y `multiple` para atributos combinables. · Pon `aria-label` en el grupo y en cada ítem que solo lleve icono. · Fija `variant` y `size` en el grupo, no ítem por ítem.
No: No lo uses como navegación entre páginas: eso es Tabs. · No pases de cinco o seis ítems; a partir de ahí, Select. · No dejes un `single` sin valor si la interfaz necesita siempre una opción activa: filtra el `""`.
Relacionados: toggle, segmented-control, tabs, button-group

### Tooltip

Etiqueta flotante de Radix en fondo oscuro con flecha, que aparece tras 200ms al pasar el cursor o enfocar. Úsalo para nombrar botones de solo icono o dar un dato breve; nunca para contenido que la persona necesite leer para continuar.

```ts
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"top"` | En `TooltipContent`. Lado preferido; Radix lo invierte si no cabe. |
| `align` | `"start" \| "center" \| "end"` | `"center"` | En `TooltipContent`. Alineación sobre el trigger. |
| `sideOffset` | `number` | `0` | En `TooltipContent`. Separación en px; la flecha ya aporta la suya. |
| `open / onOpenChange` | `boolean / (open) => void` |  | En `Tooltip`. Estado controlado. |
| `delayDuration` | `number` | `200` | En `TooltipProvider`. Milisegundos antes de mostrarse. La app monta un provider global. |
| `asChild` | `boolean` |  | En `TooltipTrigger`. Usa el hijo como trigger sin añadir un botón extra. |

Ejemplo · Botones de solo icono:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>
  </TooltipTrigger>
  <TooltipContent>Editar</TooltipContent>
</Tooltip>
```

Sí: Nombra los botones de solo icono con tooltip y `aria-label`. · Una línea corta; si necesitas más, usa HoverCard o Popover. · Envuelve los triggers deshabilitados en un `<span tabIndex={0}>`.
No: No pongas información imprescindible solo en un tooltip: en móvil no hay hover. · No metas enlaces ni botones dentro; el contenido no es interactivo. · No montes otro `TooltipProvider` global; ya existe en la app.
Relacionados: hover-card, popover, button


## [object Object] · 2

[object Object]

### Heading

Los seis niveles de título del sistema como un componente. El nivel fija tamaño, interlínea y etiqueta (h1–h6); `as` desacopla la etiqueta cuando la semántica del documento no coincide con el tamaño. Nadie escribe `text-[Npx]` ni `font-bold` a mano.

```ts
import { Heading } from "@/components/typography"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` |  | Obligatoria. Fija tamaño, interlínea y la etiqueta por defecto (`h{level}`). |
| `as` | `keyof JSX.IntrinsicElements` | `h{level}` | Etiqueta a renderizar cuando la semántica no coincide con el nivel visual. |
| `weight` | `"semibold" \| "bold" \| "medium"` | `"semibold"` | Peso. `bold` para portadas; `medium` para títulos secundarios. |
| `tone` | `"default" \| "muted" \| "inverse"` | `"default"` | Color: `text-text-primary`, `text-text-muted` o `text-text-inverse` sobre fondos oscuros. |
| `truncate` | `boolean` | `false` | Una sola línea con elipsis. |
| `...props` | `React.HTMLAttributes<HTMLHeadingElement>` |  | Atributos nativos del encabezado, incluido `className`. |

Ejemplo · Escala completa:

```tsx
<Heading level={1}>Nivel 1</Heading>
<Heading level={2}>Nivel 2</Heading>
<Heading level={3}>Nivel 3</Heading>
<Heading level={4}>Nivel 4</Heading>
<Heading level={5}>Nivel 5</Heading>
<Heading level={6}>Nivel 6</Heading>
```

Sí: La página empieza en nivel 2; el nivel 1 es para portadas. · Baja de nivel en orden, sin saltos: una card en nivel 4 tiene sus bloques en 5 y 6. · Usa `as` cuando necesites el tamaño de un nivel con otra etiqueta, no otro nivel.
No: No fijes tamaños con `text-[Npx]` ni pesos con `font-*` en un Heading. · No uses Heading para cifras: eso es `Text size="xl" weight="semibold" tabular`. · No uses Heading para etiquetas de formulario ni eyebrows: eso es Label o `Text variant="small"`.
Relacionados: text, page-header, section-header

### Text

Todo el texto que no es un título: cuerpo, etiquetas, ayudas, cifras y código inline. Tres ejes (`size`, `weight`, `tone`) y unos `variant` que los combinan. Por defecto es un párrafo de 14px, el tamaño de la interfaz.

```ts
import { Text } from "@/components/typography"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"xs" \| "sm" \| "base" \| "lg" \| "xl"` | `"sm"` | 12, 14, 16, 18 o 20px con su interlínea. |
| `weight` | `"normal" \| "medium" \| "semibold" \| "bold"` | `"normal"` | Peso de la fuente. |
| `tone` | `"default" \| "secondary" \| "muted" \| "inverse" \| "primary" \| "positive" \| "negative" \| "warning"` | `"default"` | Color desde tokens. Gana al tono que fije el `variant`. |
| `variant` | `"body" \| "lead" \| "muted" \| "small" \| "label" \| "caption" \| "code"` | `"body"` | Combinación lista de tamaño, peso y tono. `code` además usa `span` y monoespaciada. |
| `as` | `keyof JSX.IntrinsicElements` | `"p"` | Etiqueta a renderizar. Usa `span` para texto en línea. |
| `truncate` | `boolean` | `false` | Una sola línea con elipsis. |
| `tabular` | `boolean` | `false` | `tabular-nums`: dígitos de ancho fijo para cifras alineadas. |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos nativos, incluido `className`. |

Ejemplo · Tamaños:

```tsx
<Text size="xs">12px</Text>
<Text>14px (sm, por defecto)</Text>
<Text size="base">16px</Text>
<Text size="lg">18px</Text>
<Text size="xl">20px</Text>
```

Sí: Deja el tamaño por defecto (`sm`) para la interfaz; sube a `base` solo en lectura larga. · Usa `tabular` en cualquier cifra que viva en una columna o cambie en vivo. · Pasa `as="span"` cuando el texto va en línea con otros elementos; un `<p>` dentro de un botón o una celda no es válido.
No: No escribas `text-[13px]`, `font-light` ni `text-gray-500`: cada eje tiene una prop. · No uses Text para títulos: la jerarquía es de Heading. · No combines más de dos tonos semánticos en la misma frase.
Relacionados: heading, label, badge


## [object Object] · 10

[object Object]

### Field

El envoltorio de un control de formulario: etiqueta, descripción, error y estado deshabilitado, con los ids y aria-describedby inyectados en el hijo. Úsalo alrededor de cualquier Input, Textarea o Select para que todos los campos compartan la misma jerarquía y accesibilidad.

```ts
import { Field } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto de la etiqueta. Se enlaza al hijo mediante htmlFor/id. |
| `description` | `string` |  | Ayuda contextual bajo el control. Se oculta mientras haya error. |
| `error` | `string` |  | Mensaje de error; se anuncia vía aria-describedby. |
| `required` | `boolean` | `false` | Añade el asterisco rojo a la etiqueta. |
| `disabled` | `boolean` | `false` | Atenúa la etiqueta y propaga disabled al hijo. |
| `children` | `React.ReactNode` |  | El control. Si es un elemento válido recibe id, disabled y aria-describedby. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

Ejemplo · Etiqueta y descripción:

```tsx
<Field label="Nombre del equipo" description="Aparece en los reportes y en la sidebar.">
  <Input placeholder="Ej. Producto LATAM" />
</Field>
```

Sí: Envuelve cada control de un formulario en un Field, incluso sin descripción. · Escribe errores accionables: qué pasó y cómo corregirlo. · Marca como requeridos solo los campos que bloquean el envío.
No: No pongas varios controles dentro de un mismo Field: el id solo llega al primero. · No uses la descripción para repetir la etiqueta.
Relacionados: input, textarea, label, form-section, single-select

### FilterBar (beta)

La cabecera de filtros de un listado: una tarjeta con búsqueda, un hueco para los selects y otro para las acciones, y debajo la fila de chips con los filtros activos y «Limpiar filtros». Úsala encima de tablas y grids cuando la persona combina búsqueda y varios criterios; el componente no guarda estado, tú le pasas los filtros ya resueltos.

```ts
import { FilterBar, type ActiveFilter } from "@/components/filters"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `searchValue` | `string` |  | Valor controlado del campo de búsqueda. |
| `onSearchChange` | `(value: string) => void` |  | Al escribir. Sin él, el campo de búsqueda no se muestra. |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del campo de búsqueda. |
| `filters` | `React.ReactNode` |  | Selects y controles de filtro; se colocan en fila con `flex-wrap` junto a la búsqueda. |
| `actions` | `React.ReactNode` |  | Botones alineados al final de la tarjeta (exportar, crear…). |
| `activeFilters` | `ActiveFilter[]` | `[]` | Chips de filtros activos: `{ id, label, value?, onRemove? }`. Cada uno pinta «label: value» con su botón de quitar. |
| `onClearFilters` | `() => void` |  | Muestra «Limpiar filtros» al final de los chips cuando hay alguno activo. |
| `className` | `string` |  | Clases extra del contenedor exterior. |

Ejemplo · Búsqueda, selects y chips:

```tsx
const [search, setSearch] = React.useState("");
const [area, setArea] = React.useState<string>();
const [states, setStates] = React.useState<string[]>([]);

const activeFilters: ActiveFilter[] = [
  ...(area ? [{ id: "area", label: "Área", value: AREA_LABEL[area], onRemove: () => setArea(undefined) }] : []),
  ...states.map((state) => ({
    id: `estado-${state}`,
    label: "Estado",
    value: STATE_LABEL[state],
    onRemove: () => setStates((items) => items.filter((item) => item !== state)),
  })),
];

<FilterBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar colaboradores…"
  filters={
    <>
      <SearchableSelect options={AREAS} value={area} onValueChange={setArea} placeholder="Área" className="w-44" />
      <MultiSelect options={STATES} value={states} onValueChange={setStates} placeholder="Estado" className="w-52" />
    </>
  }
  activeFilters={activeFilters}
  onClearFilters={() => { setArea(undefined); setStates([]); }}
/>
```

Sí: Deriva `activeFilters` del mismo estado que alimenta los selects, así los chips y los controles nunca se contradicen. · Da a cada chip un `onRemove` que quite solo ese criterio; `onClearFilters` es para vaciarlos todos. · Aplica la búsqueda con un debounce si la lista consulta al servidor.
No: No metas la lógica de filtrado dentro de `filters`: la barra solo dispone controles, no filtra. · No pongas más de tres o cuatro selects; a partir de ahí conviene un panel de filtros avanzados. · No uses los chips como navegación ni como estado de selección de filas.
Relacionados: searchable-select, multi-select, field, badge, input

### FormSection

Una tarjeta que agrupa campos relacionados bajo un título, una descripción y un slot de acciones. Úsala para dividir formularios largos en bloques con sentido propio: datos generales, configuración, permisos.

```ts
import { FormSection } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título del bloque, en 18px bold. |
| `description` | `string` |  | Texto secundario bajo el título. |
| `actions` | `React.ReactNode` |  | Botones o menús alineados a la derecha del encabezado. |
| `children` | `React.ReactNode` |  | Los campos; se separan con space-y-6. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos de la Card contenedora. |

Ejemplo · Con acción de guardado:

```tsx
<FormSection
  title="Información general"
  description="Estos datos se muestran a los colaboradores invitados."
  actions={<Button size="sm" disabled={saved} onClick={save}>{saved ? "Guardado" : "Guardar"}</Button>}
>
  <Field label="Nombre del programa" required>
    <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
  </Field>
  <Field label="Descripción" description="Máximo 280 caracteres.">
    <Textarea placeholder="¿De qué trata este programa?" />
  </Field>
</FormSection>
```

Sí: Agrupa de 2 a 6 campos por sección; más de eso, divide. · Usa el título para nombrar el bloque, no la pantalla completa. · Reserva las acciones para operaciones locales al bloque (añadir fila, restablecer).
No: No anides FormSection dentro de FormSection. · No pongas el botón de envío global dentro de una sección: va al pie del formulario.
Relacionados: field, card, section-header, button

### InputOtp

Código de un solo uso repartido en celdas. Pegar el código completo lo distribuye desde la primera celda, Backspace retrocede y las flechas mueven. Cada celda es un input real con `autoComplete="one-time-code"`, así que el autorrelleno del teléfono lo encuentra.

```ts
import { InputOtp } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `length` | `number` | `6` | Número de celdas. |
| `value / onChange` | `string / (value: string) => void` |  | Valor controlado. Siempre es una cadena compacta, sin huecos. |
| `onComplete` | `(value: string) => void` |  | Se dispara al llenar la última celda. |
| `mask` | `boolean` | `false` | Oculta los caracteres, como una contraseña. |
| `groups` | `number[]` |  | Separadores visuales: `[3, 3]` pinta una raya en la mitad. |
| `type` | `"numeric" \| "alphanumeric"` | `"numeric"` | Qué caracteres se aceptan. El alfanumérico pasa a mayúsculas. |
| `disabled` | `boolean` |  | Apaga todas las celdas. |
| `autoFocus` | `boolean` |  | Enfoca la primera celda al montar. |
| `aria-label` | `string` | `"Código de verificación"` | Etiqueta del grupo; cada celda anuncia su posición. |

Ejemplo · Verificación en dos pasos del login:

```tsx
const [code, setCode] = React.useState("");

<Field label="Verificación en dos pasos" description="Escribe el código de 6 dígitos que enviamos a tu correo.">
  <InputOtp value={code} onChange={setCode} onComplete={verificar} groups={[3, 3]} />
</Field>
```

Sí: Verifica en `onComplete`: quien escribe un código no espera tener que pulsar «Continuar». · Di en la descripción a dónde se envió el código y ofrece reenviarlo. · Usa `groups` a partir de 6 celdas: leer 482 915 es más fácil que 482915.
No: No lo uses para contraseñas ni para códigos largos: a partir de 8 celdas, Input normal. · No borres el código al fallar la verificación sin decirlo; deja el foco en la primera celda y explica el error. · No pongas `mask` en un código de un solo uso que caduca en minutos: estorba más de lo que protege.
Relacionados: field, input, phone-input

### MultiSelect

Un combobox controlado para elegir varias opciones, que muestra lo elegido como chips removibles dentro del trigger. Úsalo cuando el usuario necesita combinar etiquetas, áreas o habilidades sin abandonar el formulario.

```ts
import { MultiSelect } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `MultiSelectOption[]` |  | Lista de opciones: value, label, description opcional y disabled. |
| `value` | `string[]` | `[]` | Valores seleccionados (controlado). |
| `onValueChange` | `(value: string[]) => void` |  | Se llama con el arreglo completo al añadir o quitar una opción. |
| `placeholder` | `string` | `"Seleccionar opciones"` | Texto del trigger cuando no hay selección. |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del campo de búsqueda del popover. |
| `emptyMessage` | `string` | `"No se encontraron resultados."` | Mensaje cuando la lista queda vacía. |
| `disabled` | `boolean` | `false` | Deshabilita el trigger completo. |
| `className` | `string` |  | Clases extra para el trigger. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<string[]>([]);

<MultiSelect
  options={[
    { value: "leadership", label: "Liderazgo" },
    { value: "communication", label: "Comunicación" },
    { value: "data", label: "Análisis de datos" },
  ]}
  value={value}
  onValueChange={setValue}
/>
```

Sí: Úsalo a partir de 5 opciones; con menos, un CheckboxCardGroup se lee mejor. · Envuélvelo en un Field para etiqueta, ayuda y error. · Ordena las opciones por frecuencia de uso o alfabéticamente.
No: No lo uses para una sola elección: para eso está SingleSelect. · No superes 3 o 4 chips visibles sin dar un resumen (`+N`) desde el consumidor.
Relacionados: single-select, searchable-select, checkbox-card-group, field, badge

### NumberField

Campo numérico con botones de − y +. Va con `inputMode="decimal"` y no con `type="number"`: así la rueda del ratón no cambia el valor al desplazar la página. Las flechas suben y bajan, Shift multiplica por diez y el valor se recorta a min/max al salir del campo.

```ts
import { NumberField } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number \| null` |  | Valor controlado. `null` deja el campo vacío. |
| `defaultValue` | `number` |  | Valor inicial cuando no está controlado. |
| `onValueChange` | `(value: number \| null) => void` |  | Se llama con el valor saneado; `null` si el campo queda vacío. |
| `min / max` | `number` |  | Límites. El valor se recorta al salir del campo y apagan el botón correspondiente. |
| `step` | `number` | `1` | Salto de flechas y botones. Con Shift se multiplica por 10; PageUp/PageDown también. |
| `precision` | `number` |  | Decimales fijos al mostrar. Si no se pasa, se deducen del `step`. |
| `size` | `"sm" \| "default"` | `"default"` | Alto de 32px o de 40px, el mismo que Input. |
| `prefix / suffix` | `React.ReactNode` |  | Adornos dentro del campo: «$», «horas», «%». Son decorativos (`aria-hidden`). |
| `stepper` | `"inline" \| "sides" \| "none"` | `"inline"` | Botones pegados a la derecha, a cada lado, o sin botones. |
| `disabled / readOnly` | `boolean` |  | `readOnly` deja leer y copiar; `disabled` apaga el campo entero. |
| `aria-label` | `string` |  | Obligatorio si el campo no va dentro de un `Field` con etiqueta. |

Ejemplo · Cupos de un plan de formación:

```tsx
const [seats, setSeats] = React.useState<number | null>(24);

<Field label="Cupos del plan de formación" error={seats < 19 ? "Hay 19 personas inscritas." : undefined}>
  <NumberField value={seats} onValueChange={setSeats} min={1} max={200} />
</Field>
```

Sí: Pon `min` y `max` siempre que existan: es lo que apaga los botones y evita el error después de enviar. · Usa `suffix` para la unidad («horas», «%») en vez de meterla en la etiqueta. · Deja que `Field` inyecte el `id` y la descripción; el campo los propaga al input.
No: No lo uses para cantidades largas sin sentido aritmético (cédula, teléfono, código): ahí va Input o PhoneInput. · No pongas `step` decimal sin `precision`: el valor acaba mostrando 0.30000000000000004. · No escondas los límites en la ayuda si puedes expresarlos con `min`/`max`.
Relacionados: field, input, slider, rating

### PhoneInput

Teléfono con selector de país y prefijo. Hacia dentro se escribe agrupado («300 123 4567»); hacia fuera siempre emite E.164 («+573001234567»), que es el formato que guarda el backend.

```ts
import { PhoneInput } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `string` |  | Valor controlado en E.164, p. ej. «+573001234567». |
| `onValueChange` | `(value: string) => void` |  | Se llama con el número en E.164; cadena vacía si no hay dígitos. |
| `defaultCountry` | `CountryCode` | `"CO"` | País preseleccionado cuando el campo empieza vacío (sin `value`). |
| `countries` | `readonly Country[]` | `PHONE_COUNTRIES` | Lista de países a ofrecer en el selector; por defecto LATAM + España + EE. UU. |
| `placeholder` | `string` |  | Si no se pasa, se arma con ceros agrupados según el país (p. ej. «300 123 4567»). |
| `disabled` | `boolean` |  | Apaga el selector de país y el input. |
| `id / className` | `string` |  | Se aplican al contenedor externo del selector y el input. |
| `...props` | `React.ComponentProps<"input">` |  | Resto de atributos nativos del input (excepto `value`, `defaultValue`, `onChange`, `type` y `prefix`, que controla el propio componente). |

Ejemplo · Teléfono de contacto de un candidato:

```tsx
const [phone, setPhone] = React.useState("");

<PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" aria-label="Teléfono del candidato" />
```

Sí: Guarda siempre el E.164 que emite `onValueChange`; no reconstruyas el número a mano concatenando el prefijo. · Deja `defaultCountry` en el país donde opera la mayoría de tus usuarios para no obligarlos a cambiarlo. · Valida sobre el número nacional (longitud según el país), no sobre el string completo con el prefijo.
No: No lo uses para documentos o códigos que no sean un teléfono real (cédula, NIT): ahí va `Input` o `NumberField`. · No fuerces `type="tel"` ni un patrón propio por encima del componente; ya normaliza dígitos y formato. · No amplíes `countries` con un catálogo mundial completo si el producto solo opera en un puñado de países: la lista corta agiliza el selector.
Relacionados: field, input, single-select

### Rating

Puntuación con estrellas para encuestas de satisfacción y evaluaciones. Editable es un radiogroup con una sola parada de tabulación y flechas; de solo lectura es un dato (`role="img"`), no un control, así que úsalo así en tablas y resúmenes.

```ts
import { Rating } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` |  | Valor controlado, de 0 a `max`. |
| `defaultValue` | `number` |  | Valor inicial cuando no está controlado. |
| `onValueChange` | `(value: number) => void` |  | Se llama al elegir una estrella (o media, con `allowHalf`). |
| `max` | `number` | `5` | Número de estrellas. |
| `allowHalf` | `boolean` | `false` | Permite medias estrellas (pasos de 0,5). |
| `readOnly` | `boolean` | `false` | Lo convierte en un dato (`role="img"`): sin botones, sin foco, con el puntaje en el `aria-label`. |
| `disabled` | `boolean` | `false` | Apaga la interacción y baja la opacidad. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Tamaño del icono, el texto del valor y el espaciado entre estrellas. |
| `tone` | `"warning" \| "primary"` | `"warning"` | Color de relleno de las estrellas activas. |
| `icon` | `React.ReactNode` |  | Reemplaza la estrella por otro icono (p. ej. un corazón). |
| `label` | `string` |  | Nombre accesible del grupo. Sin él, se anuncia «Puntuación» (editable) o el puntaje leído (solo lectura). |
| `showValue` | `boolean` | `false` | Muestra «4,2 de 5» junto a las estrellas, con formato numérico es-CO. |
| `id / className` | `string` |  | Se aplican al contenedor externo. |

Ejemplo · Satisfacción de una sesión de formación:

```tsx
<Rating value={4.2} allowHalf readOnly showValue label="Satisfacción con la sesión" />
```

Sí: Usa `readOnly` para mostrar un dato ya calculado (promedios, evaluaciones cerradas): no es un botón. · Pon `allowHalf` solo si el dato realmente tiene precisión de 0,5; si no, el radiogroup ofrece pasos que no existen en tus datos. · Da un `label` descriptivo («Satisfacción con la sesión», no «Rating») para que el lector de pantalla anuncie algo útil.
No: No lo uses como un «me gusta» binario: para eso está un botón o un Switch. · No mezcles tamaños de Rating en la misma tabla o listado. · No dupliques el número si ya usas `showValue`; una sola fuente de verdad por fila.
Relacionados: field, number-field, badge

### SearchableSelect

Un select de una sola opción con búsqueda integrada en el popover, filtrada por cmdk. Úsalo cuando la lista supera las diez opciones o el usuario sabe lo que busca y prefiere escribir a desplazarse.

```ts
import { SearchableSelect } from "@/components/forms"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SearchableSelectOption[]` |  | Opciones con value, label, description opcional y disabled. |
| `value` | `string` |  | Valor seleccionado (controlado). |
| `onValueChange` | `(value: string) => void` |  | Se llama al elegir; el popover se cierra solo. |
| `placeholder` | `string` | `"Selecciona una opción"` | Texto del trigger sin selección. |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del CommandInput. |
| `emptyMessage` | `string` | `"No se encontraron resultados."` | Mensaje cuando el filtro no coincide con nada. |
| `disabled` | `boolean` | `false` | Deshabilita el trigger. |
| `className` | `string` |  | Clases extra para el trigger. |

Ejemplo · Controlado con filtro:

```tsx
const [value, setValue] = React.useState<string>("co");

<SearchableSelect
  options={[
    { value: "co", label: "Colombia" },
    { value: "mx", label: "México" },
    { value: "pe", label: "Perú" },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="País de operación"
  searchPlaceholder="Escribe para filtrar…"
/>
```

Sí: Úsalo a partir de ~10 opciones o con nombres propios (personas, ciudades). · Aprovecha `description` para desambiguar homónimos. · Personaliza `emptyMessage` con una acción posible cuando exista.
No: No lo uses para 3 o 4 opciones: el buscador estorba; usa Select o SegmentedControl. · No dependas del filtro para listas de miles: pagina o busca en servidor.
Relacionados: single-select, multi-select, select, field, popover

### SingleSelect

El select de una opción con el mismo trigger y lista que MultiSelect: fondo muted, filas redondeadas y check a la derecha. Úsalo en formularios donde conviven ambos para que los triggers se vean idénticos.

```ts
import { SingleSelect } from "@/components/forms/SingleSelect"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SingleSelectOption[]` |  | Opciones con value, label, description opcional y disabled. |
| `value` | `string` |  | Valor seleccionado (controlado). |
| `onValueChange` | `(value: string) => void` |  | Se llama al elegir; el popover se cierra solo. |
| `placeholder` | `string` | `"Seleccionar..."` | Texto del trigger sin selección. |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del campo de búsqueda del popover. |
| `emptyMessage` | `string` | `"No se encontraron resultados."` | Mensaje cuando la lista queda vacía. |
| `disabled` | `boolean` | `false` | Deshabilita el trigger. |
| `className` | `string` |  | Clases extra para el trigger. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<string>("intermediate");

<SingleSelect
  options={[
    { value: "basic", label: "Básico" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="Nivel del curso"
/>
```

Sí: Úsalo junto a MultiSelect para que ambos triggers compartan estilo. · Mantén los labels cortos: el trigger trunca en una línea.
No: No lo importes desde el barrel `@/components/forms`: no está exportado ahí. · No lo uses para listas largas que requieran filtrar: SearchableSelect sí filtra.
Relacionados: multi-select, searchable-select, select, field


## [object Object] · 7

[object Object]

### CardSelection

Una grilla de tarjetas donde solo una puede estar elegida, con icono, eyebrow, badge y descripción por opción. Úsala cuando la decisión merece contexto visual, como elegir un formato, un plan o una plantilla.

```ts
import { CardSelection } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string` |  | Valor elegido (controlado). |
| `onChange` | `(value: string) => void` |  | Se llama al pulsar una tarjeta. |
| `columns` | `1 \| 2 \| 3 \| 4` | `3` | Columnas en desktop; en móvil siempre es una. |
| `disabled` | `boolean` | `false` | Deshabilita todas las tarjetas. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

Ejemplo · Con iconos y etiqueta:

```tsx
const [value, setValue] = React.useState<string>();

<CardSelection
  label="Formato del contenido"
  description="Podrás cambiarlo antes de publicar."
  options={[
    { value: "course", label: "Curso", description: "Lecciones en video con evaluación final.", icon: BookOpen },
    { value: "path", label: "Ruta", description: "Varios cursos encadenados con un objetivo.", icon: Compass, badge: "Popular" },
    { value: "cohort", label: "Cohorte", description: "Sesiones en vivo con un facilitador.", icon: Users },
  ]}
  value={value}
  onChange={setValue}
/>
```

Sí: Úsala para 2 a 6 opciones con descripción; más de eso, pasa a OptionTile. · Da a cada opción un icono o un eyebrow para que se distingan de un vistazo. · Reserva el badge para una sola tarjeta (Recomendado, Popular).
No: No la uses cuando el label basta: un RadioGroup normal es más liviano. · No mezcles tarjetas con y sin descripción en la misma grilla.
Relacionados: radio-card-group, selectable-card, option-tile, radio-group, checkbox-card-group

### CheckboxCardGroup

La grilla de tarjetas para selección múltiple: cada una alterna su presencia en un arreglo y muestra un checkbox cuadrado en la esquina. Úsala para activar módulos, permisos o funcionalidades cuando cada opción merece una descripción.

```ts
import { CheckboxCardGroup } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string[]` | `[]` | Valores marcados (controlado). |
| `onChange` | `(value: string[]) => void` |  | Recibe el arreglo resultante tras alternar una tarjeta. |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Columnas en desktop. |
| `disabled` | `boolean` | `false` | Deshabilita todo el grupo. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<string[]>(["reports", "reminders"]);

<CheckboxCardGroup
  label="Módulos activos"
  description="Puedes activar varios."
  options={[
    { value: "reports", label: "Reportes", description: "Avance por persona y por equipo.", icon: FileBarChart },
    { value: "reminders", label: "Recordatorios", description: "Notificaciones automáticas.", icon: Bell, badge: "Incluido" },
    { value: "integrations", label: "Integraciones", description: "Slack, Teams y calendario.", icon: Link2 },
    { value: "sso", label: "SSO", description: "Solo en plan Enterprise.", icon: ShieldCheck, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

Sí: Úsalo para 2 a 8 opciones con descripción. · Valida mínimos y máximos en el consumidor y comunícalos con `error`.
No: No lo uses para una sola elección: RadioCardGroup o CardSelection. · No superes cuatro columnas: las tarjetas pierden legibilidad.
Relacionados: card-selection, radio-card-group, selectable-card, checkbox, multi-select

### OptionTile

Un tile horizontal y compacto con icono, label, descripción y un radio a la derecha, pensado para listas densas. Úsalo cuando hay muchas opciones o poco espacio y las tarjetas grandes serían un exceso.

```ts
import { OptionTile } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `SelectionOption` |  | value, label, description, badge, icon y disabled. El eyebrow no se muestra. |
| `selected` | `boolean` | `false` | Estado elegido: borde primario, ring y radio relleno. |
| `disabled` | `boolean` | `false` | Deshabilita el tile además de option.disabled. |
| `onSelect` | `(value: string) => void` |  | Se llama con option.value al pulsar. |
| `compact` | `boolean` | `false` | Reduce padding e icono y oculta la descripción. |
| `className` | `string` |  | Clases para el botón. |

Ejemplo · Lista de selección única:

```tsx
const [value, setValue] = React.useState<string>("team");

<div className="space-y-2" role="radiogroup" aria-label="Visibilidad">
  {options.map((option) => (
    <OptionTile key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>
```

Sí: Úsalo en drawers, paneles laterales y listas de 5 o más opciones. · Añade role=radiogroup o un aria-label al contenedor de la lista.
No: No lo mezcles con SelectableCard en la misma lista. · No uses compact si la descripción es lo que diferencia las opciones.
Relacionados: selectable-card, card-selection, radio-group

### RadioCardGroup

Las mismas tarjetas de CardSelection, pero montadas sobre Radix RadioGroup: navegación con flechas, roving tabindex y un input oculto con name para formularios nativos. Es la opción a elegir cuando el grupo vive dentro de un form o necesita accesibilidad de radio real.

```ts
import { RadioCardGroup } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | value, label, description, eyebrow, badge, icon y disabled por opción. |
| `value` | `string` |  | Valor elegido (controlado). |
| `onChange` | `(value: string) => void` |  | Recibe el nuevo valor desde Radix. |
| `name` | `string` |  | Nombre del input oculto para envíos nativos de formulario. |
| `columns` | `1 \| 2 \| 3 \| 4` | `2` | Columnas en desktop. |
| `disabled` | `boolean` | `false` | Deshabilita todo el grupo. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo la grilla. |
| `error` | `string` |  | Mensaje de error del Field. |
| `className` | `string` |  | Clases para el contenedor. |

Ejemplo · Navegación con teclado:

```tsx
const [value, setValue] = React.useState<string>("chat");

<RadioCardGroup
  name="channel"
  label="Canal de recordatorios"
  options={[
    { value: "email", label: "Correo", description: "Un resumen por correo cada semana.", icon: Mail },
    { value: "chat", label: "Chat interno", description: "Mensaje directo.", icon: MessageSquare, badge: "Nuevo" },
    { value: "push", label: "Notificación push", description: "Aviso inmediato.", icon: Zap },
    { value: "digest", label: "Agenda", description: "Se integra con tu calendario.", icon: CalendarClock, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

Sí: Prefiérelo sobre CardSelection dentro de formularios o cuando importa la navegación con teclado. · Pasa `name` si el formulario se envía de forma nativa.
No: No lo uses para selección múltiple: usa CheckboxCardGroup. · No dejes el grupo sin valor inicial si hay una opción por defecto razonable.
Relacionados: card-selection, radio-group, checkbox-card-group, field

### SegmentedControl

Un grupo de botones pegados para alternar entre pocas opciones excluyentes, en tres variantes (sólido, contorno y subrayado) y dos tamaños. Úsalo para cambiar de vista, de periodo o de estado sin abrir un menú.

```ts
import { SegmentedControl } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | Se usan value, label, icon y disabled; description, eyebrow y badge se ignoran. |
| `value` | `string` |  | Segmento activo (controlado). |
| `onChange` | `(value: string) => void` |  | Se llama al pulsar un segmento. |
| `variant` | `"solid" \| "outline" \| "underline"` | `"solid"` | Estilo del contenedor y del segmento activo. |
| `size` | `"sm" \| "md"` | `"md"` | Altura y tipografía de los segmentos. |
| `fullWidth` | `boolean` | `false` | Reparte el ancho del contenedor entre los segmentos. |
| `disabled` | `boolean` | `false` | Deshabilita todos los segmentos. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo el control. |
| `error` | `string` |  | Mensaje de error del Field. |
| `ariaLabel` | `string` |  | aria-label del radiogroup cuando no hay label visible. |
| `className` | `string` |  | Clases para el contenedor. |

Ejemplo · Cambio de vista (solid):

```tsx
<SegmentedControl
  ariaLabel="Modo de vista"
  options={[
    { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
    { value: "list", label: "Lista", icon: List },
    { value: "table", label: "Tabla", icon: Table2 },
  ]}
  value={value}
  onChange={setValue}
/>
```

Sí: Úsalo con 2 a 5 opciones de label corto. · Pasa `ariaLabel` siempre que no haya `label` visible. · Usa underline cuando el control actúa como filtro de una tabla o lista.
No: No lo uses para navegar entre páginas: para eso están Tabs. · No pongas labels largos: el segmento trunca y pierde sentido.
Relacionados: tabs, radio-group, option-tile, card-selection

### SelectableCard

La tarjeta individual que usan CardSelection y CheckboxCardGroup, expuesta como pieza suelta con `selected` y `onSelect`. Úsala cuando necesites tu propia grilla, un layout mixto o una lógica de selección que los grupos no cubren.

```ts
import { SelectableCard } from "@/components/selection"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `SelectionOption` |  | Los datos de la tarjeta: value, label, description, eyebrow, badge, icon, disabled. |
| `selected` | `boolean` | `false` | Estado elegido; controla borde, ring e indicador. |
| `disabled` | `boolean` | `false` | Deshabilita la tarjeta además de option.disabled. |
| `onSelect` | `(value: string) => void` |  | Se llama con option.value al pulsar. |
| `mode` | `"single" \| "multiple"` | `"single"` | Define el role (radio o checkbox) y el indicador. |
| `className` | `string` |  | Clases para el botón exterior. |

Ejemplo · Grilla propia en modo único:

```tsx
const [value, setValue] = React.useState<string>("video");

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {blocks.map((option) => (
    <SelectableCard key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>
```

Sí: Úsala cuando la grilla o la lógica no encajan en los grupos ya hechos. · Mantén el role coherente con la lógica: single para uno, multiple para varios.
No: No reconstruyas CardSelection a mano si el grupo ya resuelve el caso. · No olvides el estado disabled visual cuando una opción no aplica.
Relacionados: card-selection, checkbox-card-group, option-tile, card

### TemplateTile

La ficha de una plantilla: fondo degradado en su tono, una miniatura que dibuja las líneas que trae con sus barras de peso, la insignia clavada en una esquina, y debajo el nombre y la medida. La miniatura se dibuja con divs y tokens, así que hereda el tema y el modo claro/oscuro sin existir en dos versiones.

```ts
import { TemplateTile } from "@/components/templates"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `template` | `TemplateDefinition` |  | La plantilla: id, label, name, description, meta, icon, tone e items (label y weight de cada línea). |
| `variant` | `"compact" \| "card" \| "row"` | `"compact"` | compact: fila con nombre y medida. card: portada degradada, nombre, para qué sirve y medida. row: fila a todo lo ancho. |
| `onClick` | `() => void` |  | Qué hace la ficha al pulsarse. |
| `dashed` | `boolean` | `false` | Ficha de «ver más»: contorno punteado, el icono solo, sin degradado ni insignia. |
| `className` | `string` |  | Clases para el botón exterior. |

Ejemplo · La estantería de una página:

```tsx
<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} onClick={() => usar(plantilla)} />
  ))}
  <TemplateTile template={verMas} dashed onClick={abrirCatalogo} />
</div>
```

Sí: Da a cada plantilla el tono que le corresponda: la estantería se lee por color antes que por nombre. · Escribe meta con la medida real de la plantilla («3 elementos · Trimestre»): el sistema no sabe contar lo que no es suyo. · Usa compact en una página, card en una galería que se abre y row para recorrer muchas de un vistazo. · Reserva dashed para la ficha que abre el catálogo completo.
No: No uses imágenes ni ilustraciones en la miniatura: se dibuja con divs y tokens para que siga al tema. · No mezcles las tres variantes en la misma rejilla; elige una por superficie. · No le pongas el tono ai a una plantilla cualquiera: su degradado está reservado para lo que de verdad es IA. · No la uses como tarjeta de métrica: la ficha retrata contenido, no un número.
Relacionados: template-catalog-drawer, selectable-card, option-tile, drawer-shell


## [object Object] · 9

[object Object]

### Breadcrumbs

El rastro de dónde está la persona dentro de una jerarquía, con el último tramo resaltado como página actual. Cada tramo es un texto o un { label, onClick } cuando lleva a algún sitio; el componente se encarga del separador y del contraste entre niveles.

```ts
import { Breadcrumbs } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `(string \| { label: string; onClick?: () => void })[]` |  | Cada nivel, de la raíz a la página actual. Un string es solo contexto; con `onClick` el tramo navega. El último elemento nunca es clicable, aunque traiga `onClick`. |
| `className` | `string` |  | Clases extra para el <nav>. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo; el `aria-label` ya viene puesto. |

Ejemplo · Básico:

```tsx
<Breadcrumbs items={["Empresa", "Usuarios", "Elena Martínez"]} />
```

Sí: Úsalo a partir de dos niveles de profundidad; con uno solo no aporta nada. · Mantén las etiquetas cortas y en el mismo orden que la jerarquía real. · Colócalo encima del título de la página, nunca dentro del contenido. · Pon `onClick` en todo tramo que tenga página propia; déjalo como texto solo cuando de verdad no la tiene (una categoría, un grupo sin pantalla).
No: No lo uses como sustituto de la sub-navegación: no cambia de sección, solo ubica. · No superes cinco niveles; a partir de ahí colapsa los intermedios.
Relacionados: thema-product-header, page-header, header

### GlobalSearch

La búsqueda general del producto: un solo campo para abrir un registro, ir a una pantalla o preguntar al agente. Quien la monta le pasa el índice —sus registros y su árbol de navegación— y el componente se encarga del filtrado sin tildes, de las pestañas de alcance, del recuento y de los atajos. En el shell ya viene puesta en la cabecera y se abre con ⌘K.

```ts
import { GlobalSearch } from "@/components/search"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `objects` | `SearchObjectItem[]` |  | Registros del producto. Cada uno con `title`, `meta` visible, `keywords` invisibles y su `onSelect`. |
| `navigate` | `SearchNavigateItem[]` |  | Destinos. `path` es la ruta legible completa: se pinta como migas y se busca por cualquier tramo. |
| `onAsk` | `(question: string) => void` |  | Habilita preguntar al agente con lo escrito. Sin esto no hay grupo de preguntas. |
| `askHint` | `string` |  | Una línea que explica dónde responde la pregunta. |
| `scope` | `string` |  | Sobre qué se busca; se muestra en la barra inferior como «Alcance». |
| `placeholder` | `string` | `"Buscar o preguntar"` | Texto del campo. |
| `triggerLabel` | `string` |  | Texto del disparador en la cabecera; por defecto, el del campo. |
| `mark` | `React.ReactNode` |  | Glifo del campo. Por defecto la chispa de IA si se puede preguntar, y la lupa si no. |

Ejemplo · El índice:

```tsx
const objects = [
  { id: "vac", title: "Analista de datos", meta: ["vacante", "Entrevistas", "12 candidatos"], onSelect: abrirVacante },
  { id: "cand", title: "Andrés Malo", meta: ["candidato", "Analista de datos"], onSelect: abrirPersona },
];

const navigate = [
  { id: "vacantes", path: ["Selección", "Vacantes"], onSelect: () => navigate("/seleccion/vacantes") },
];
```

Sí: Deja que el shell la monte: así el atajo ⌘K y su sitio en la cabecera son los mismos en todo el producto. · Pon en `meta` lo que distingue a dos registros con el mismo nombre: tipo, estado, cifras. · Usa `keywords` para alias y jerga que la gente escribe pero que no quieres pintar en la fila. · Pasa `scope` cuando la búsqueda no abarque todo: la empresa, el espacio o el proyecto activo.
No: No la uses para filtrar una tabla o una lista de una pantalla: para eso está su propio campo de búsqueda. · No pases `onAsk` si no hay un agente que responda; la fila de preguntas prometería algo que no ocurre. · No metas cientos de objetos sin filtrar en el cliente: por encima de unos pocos cientos, filtra en el servidor y pasa el resultado.
Relacionados: thema-product-header, admin-shell, command

### PaginationShell

Paginación lista para tablas y listados: resumen de resultados a la izquierda, controles a la derecha y elipsis automáticas alrededor de la página actual. Es controlada, sin routing ni lógica de datos: recibe la página y avisa del cambio.

```ts
import { PaginationShell } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `page` | `number` |  | Página actual, empezando en 1. |
| `pageCount` | `number` |  | Total de páginas. Los controles se desactivan en los extremos. |
| `totalItems` | `number` |  | Total de resultados. Si se indica, el resumen muestra el rango «x - y de n». |
| `pageSize` | `number` |  | Resultados por página; necesario para calcular el rango del resumen. |
| `onPageChange` | `(page: number) => void` |  | Se llama con la página destino; nunca fuera de [1, pageCount]. |
| `showSummary` | `boolean` | `true` | Muestra u oculta el texto de resumen a la izquierda. |
| `className` | `string` |  | Clases para el contenedor (trae `py-4` por defecto). |

Ejemplo · Al pie de una tabla:

```tsx
const [page, setPage] = React.useState(1);
const pageCount = Math.ceil(total / pageSize);

<table>…</table>
<PaginationShell
  page={page}
  pageCount={pageCount}
  totalItems={total}
  pageSize={pageSize}
  onPageChange={setPage}
/>
```

Sí: Guarda la página en la URL cuando el listado sea compartible. · Pasa `totalItems` y `pageSize` siempre que los conozcas: el rango orienta más que «Página 3 de 14». · Vuelve a la página 1 al cambiar filtros o búsqueda.
No: No lo uses para scroll infinito ni para «cargar más». · No calcules `pageCount` dentro del render en cada cambio de página si el total viene del servidor: cachéalo.
Relacionados: pagination, configurable-table, button

### Scrollspy

Índice lateral (o de pestañas) que resalta la sección visible mientras se hace scroll, con `IntersectionObserver` en vez de un handler de scroll. Úsalo en pantallas largas de configuración o en fichas con varias secciones fijas.

```ts
import { Scrollspy, useScrollspy } from "@/components/navigation/Scrollspy"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `sections` | `ScrollspySection[]` |  | `{ id, label, level? }`. `id` debe existir en el DOM dentro de `scrollContainer` (o del documento). `level: 2` indenta la entrada como subsección. |
| `scrollContainer` | `React.RefObject<HTMLElement \| null>` |  | Contenedor con scroll propio. Sin él, se observa contra el viewport. |
| `offset` | `number` | `0` | Píxeles que tapa una cabecera fija sobre el contenedor; desplaza tanto el destino del clic como la banda activa del observador. |
| `title` | `string` |  | Rótulo del índice; también es el `aria-label` del `<nav>` ("En esta página" si no se indica ninguno de los dos). |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Vertical dibuja una lista con filete lateral; horizontal, una barra de pestañas con scroll. |
| `onSectionChange` | `(id: string) => void` |  | Se llama cada vez que cambia la sección activa (mismo evento que dispara el hook). |
| `updateHash` | `boolean` | `true` | Escribe `#id` en la barra de direcciones con `replaceState` al hacer clic. Desactívalo en pantallas con router por hash, donde el hash ya es la ruta. |
| `...props` | `Omit<React.HTMLAttributes<HTMLElement>, "title">` |  | Atributos nativos del `<nav>`. |
| `useScrollspy(ids, options)` | `(ids: readonly string[], options?: UseScrollspyOptions) => UseScrollspyResult` |  | El hook detrás de `Scrollspy`. `options`: `{ scrollContainer?, offset?, onChange? }`. Devuelve `{ activeId, setActiveId }`; reutilízalo para un índice con markup propio. |

Ejemplo · Cuatro secciones de una pantalla de configuración:

```tsx
const scrollContainer = React.useRef<HTMLDivElement>(null);

<Scrollspy sections={sections} scrollContainer={scrollContainer} title="En esta página" />
<div ref={scrollContainer} className="overflow-auto">
  <section id="general">...</section>
  <section id="notificaciones">...</section>
  <section id="permisos">...</section>
  <section id="integraciones">...</section>
</div>
```

Sí: Pasa siempre `scrollContainer` cuando las secciones viven dentro de un panel con su propio scroll; sin él, `Scrollspy` observa el viewport completo. · Da a cada sección un `id` estable y usa `scroll-mt-*` (o `offset`) si hay una cabecera fija encima. · En pantallas con router por hash, pasa `updateHash={false}` para no pisar la ruta actual.
No: No lo uses con menos de tres secciones: un enlace «Ver más abajo» resuelve el caso simple. · No dupliques `id`s entre `Scrollspy` y otras anclas de la misma página; el observador solo ve el primero. · No lo reemplaces por un listener de `scroll`: pierdes la eficiencia del `IntersectionObserver` y el efecto es más difícil de igualar.
Relacionados: tabs-nav, breadcrumbs, page-shell, table-shell

### Stepper

Flujo por pasos con círculo numerado, etiqueta y conector. Marca el paso activo con `aria-current="step"` y deriva el estado de cada paso de `current`; un `status` explícito (p. ej. `error`) lo sobrescribe. Úsalo en asistentes de alta, importaciones y procesos con un orden fijo.

```ts
import { Stepper } from "@/components/navigation/Stepper"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `steps` | `StepperStep[]` |  | `{ id, label, description?, status? }`. El `status` explícito sobrescribe el derivado de `current`. |
| `current` | `number` |  | Índice (base 0) del paso activo. Los anteriores se marcan como completados. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Horizontal reparte los pasos a lo ancho; vertical los apila con el conector a la izquierda. |
| `size` | `"sm" \| "default"` | `"default"` | Círculo de 24px o 28px. |
| `onStepClick` | `(index: number) => void` |  | Vuelve clicables los pasos completados, el actual y los que tienen error. Los pendientes quedan `disabled`. |
| `...props` | `React.HTMLAttributes<"ol">` |  | Atributos nativos del `<ol>` (lleva `aria-label="Progreso"` por defecto). |

Ejemplo · Alta de vacante en 4 pasos:

```tsx
const [current, setCurrent] = React.useState(1);

<Stepper steps={steps} current={current} onStepClick={setCurrent} />
<Button onClick={() => setCurrent((s) => s + 1)}>Siguiente</Button>
```

Sí: Usa entre 3 y 6 pasos; con más, agrúpalos o cambia a una lista de tareas. · Etiqueta cada paso con un sustantivo corto («Requisitos»), no con una frase. · Permite volver atrás con `onStepClick`; avanzar debe pasar por la validación del paso actual.
No: No lo uses como navegación entre secciones sin orden: ahí van Tabs. · No marques `error` en un paso pendiente; solo en uno que ya se intentó completar. · No ocultes el stepper en móvil sin dejar un indicador «Paso 2 de 4».
Relacionados: tabs-nav, thema-tabs, progress, breadcrumbs

### TabsNav

Una fila de píldoras para cambiar de vista: la activa se rellena en primario y las demás quedan en texto apagado. Es la versión más ligera de tabs del sistema, sin track ni animación, pensada para filtros y periodos.

```ts
import { TabsNav } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tabs` | `Tab[]` |  | Lista de `{ id, label }`. |
| `activeTabId` | `string` |  | Id de la pestaña activa (controlado). |
| `onTabChange` | `(id: string) => void` |  | Se llama con el id de la pestaña pulsada. |
| `className` | `string` |  | Clases para el contenedor; trae `w-full bg-surface px-8 py-3`. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

Ejemplo · Cabecera de un panel:

```tsx
const [active, setActive] = React.useState("overview");

<TabsNav tabs={tabs} activeTabId={active} onTabChange={setActive} className="border-b border-border/60" />
<div className="p-6">{content[active]}</div>
```

Sí: Úsalo para filtros y periodos donde el cambio es inmediato y sin carga. · Limita el grupo a cinco píldoras; más allá, pasa a `ThemaTabs` o a un select.
No: No lo uses como navegación principal de página: para eso está `ThemaTabs` en variante `page`. · No mezcles iconos: el componente solo pinta la etiqueta.
Relacionados: thema-tabs, tabs, segmented-control

### ThemaMobileTabBar

La barra inferior de la app móvil: hasta cinco destinos con icono, etiqueta y un badge opcional (contador o punto). Marca el activo en primario y expone `aria-current` para lectores de pantalla.

```ts
import { ThemaMobileTabBar } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `NavigationItem[]` |  | Destinos; solo se pintan los cinco primeros. Cada uno admite `icon`, `badge` y `disabled`. |
| `activeItemId` | `string` |  | Id del destino activo. |
| `onItemSelect` | `(id: string) => void` |  | Se llama al tocar un destino habilitado. |
| `className` | `string` |  | Clases para el <nav>; trae `h-16 bg-surface border-t`. |

Ejemplo · Cinco destinos con badges:

```tsx
const [active, setActive] = React.useState("home");

<ThemaMobileTabBar
  items={[
    { id: "home", label: "Inicio", icon: "home" },
    { id: "learning", label: "Aprender", icon: "graduation" },
    { id: "tasks", label: "Tareas", icon: "layers", badge: { count: 3 } },
    { id: "alerts", label: "Avisos", icon: "notification", badge: { dot: true } },
    { id: "profile", label: "Perfil", icon: "users" },
  ]}
  activeItemId={active}
  onItemSelect={setActive}
/>
```

Sí: Entre tres y cinco destinos, siempre con etiqueta. · Usa `badge.dot` para «hay novedades» y `badge.count` solo cuando el número importa. · Ánclala al fondo de la pantalla con `fixed bottom-0` en la app real.
No: No la muestres en escritorio: ahí la navegación es el rail lateral. · No pongas acciones (crear, subir) como destinos; son navegación, no comandos.
Relacionados: thema-tabs, tabs-nav, badge

### ThemaProductHeader

La cabecera de un producto dentro de la plataforma: logo del cliente a la izquierda, título del módulo y un hueco a la derecha para acciones, notificaciones y perfil. Sin logo propio muestra la marca del cliente por defecto.

```ts
import { ThemaProductHeader } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Nombre del módulo o producto, en h1. |
| `logo` | `React.ReactNode` |  | Marca del cliente. Si se omite, se muestra un logo de ejemplo. |
| `children` | `React.ReactNode` |  | Acciones alineadas a la derecha (botones, badges, avatar). |
| `className` | `string` |  | Clases para el <header>; trae `h-16 rounded-xl shadow-card`. |

Ejemplo · Con notificaciones:

```tsx
const [unread, setUnread] = React.useState(4);

<ThemaProductHeader title="Aprendizaje" logo={<ThemaLogo />}>
  <Button variant="ghost" size="icon" aria-label="Buscar"><Search /></Button>
  <Button variant="ghost" size="icon" className="relative" onClick={() => setUnread(0)}>
    <Bell />
    {unread > 0 && <span className="…badge…">{unread}</span>}
  </Button>
  <Avatar />
</ThemaProductHeader>
```

Sí: Una sola cabecera por producto, encima de la sub-navegación. · Coloca el perfil siempre como último hijo, a la derecha del todo. · Usa botones `ghost` de icono para búsqueda y notificaciones.
No: No metas el título de la página aquí: este es el nombre del producto, no de la vista. · No pases más de tres o cuatro acciones; el resto va a un menú.
Relacionados: thema-tabs, page-header, button, badge

### ThemaTabs

Las dos únicas tiras de pestañas de la app, sobre el primitivo `ui/tabs`: `view` cambia un panel dentro de la página con un track hundido, `page` cambia la pantalla entera con la píldora rellena. Cada pestaña admite icono y un contador con tono.

```ts
import { ThemaTabs } from "@/components/navigation"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tabs` | `TabItem[]` |  | Pestañas: `id`, `label` y opcionalmente `icon`, `badge` (número, oculto si es 0) y `badgeTone`. |
| `activeTabId` | `string` |  | Id de la pestaña activa (controlado). |
| `onTabChange` | `(id: string) => void` |  | Se llama al cambiar de pestaña. |
| `variant` | `"view" \| "page"` | `"view"` | `view` para paneles dentro de la página; `page` para cambiar la pantalla entera. |
| `fitContent` | `boolean` | `false` | Ajusta la tira a sus etiquetas en vez de repartir el ancho. |
| `className` | `string` |  | Clases para el <Tabs>; trae `mb-8 w-full`. |

Ejemplo · Variante view:

```tsx
const [active, setActive] = React.useState("summary");

<ThemaTabs
  tabs={[{ id: "summary", label: "Resumen" }, { id: "detail", label: "Detalle" }, { id: "history", label: "Historial" }]}
  activeTabId={active}
  onTabChange={setActive}
/>
```

Sí: Una sola tira `page` por pantalla, arriba del todo. · Usa `fitContent` con dos o tres pestañas; con cinco o seis deja que repartan el ancho. · Da `badgeTone` a los contadores solo cuando la pestaña es un estado.
No: No anides una tira `page` dentro de un panel `view`. · No pongas un contador en cero: el componente lo oculta, pero mejor no lo mandes.
Relacionados: tabs, tabs-nav, badge


## [object Object] · 5

[object Object]

### ConfirmDialog

El diálogo de confirmación del sistema sobre `AlertDialog`: título, aviso, cancelar y confirmar, con variante destructiva, estado de carga, un tercer botón opcional y una confirmación escrita para acciones irreversibles. En modo controlado no se cierra solo: el consumidor pone `open` en false cuando la operación termina.

```ts
import { ConfirmDialog } from "@/components/overlays"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado. Recomendado siempre: el diálogo no se cierra solo tras `onConfirm`. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el diálogo; se envuelve con `asChild`. |
| `title` | `string` |  | Pregunta o acción a confirmar. |
| `description` | `string` |  | Consecuencia de la acción, en una frase. |
| `variant` | `"default" \| "warning" \| "destructive"` | `"default"` | `destructive` pinta el título y el botón de confirmar en rojo. |
| `confirmLabel / cancelLabel` | `string` | `"Confirmar" / "Cancelar"` | Textos de los botones. |
| `confirmationText` | `string` |  | Si se indica, hay que escribirlo exactamente para habilitar confirmar. |
| `onConfirm / onCancel` | `() => void` |  | Callbacks de cada botón. `onConfirm` evita el cierre automático. |
| `loading` | `boolean` | `false` | Muestra el spinner en confirmar y bloquea todos los botones. |
| `disabled` | `boolean` | `false` | Bloquea los botones sin spinner. |
| `secondaryLabel / secondaryVariant / onSecondary` | `string / "default" \| "destructive" \| "outline" / () => void` |  | Tercer botón entre cancelar y confirmar. |
| `className` | `string` |  | Clases para el contenido del diálogo. |

Ejemplo · Con carga asíncrona:

```tsx
const [open, setOpen] = React.useState(false);
const [loading, setLoading] = React.useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={(next) => { if (!loading) setOpen(next); }}
  trigger={<Button variant="outline"><Archive /> Archivar ciclo</Button>}
  title="¿Archivar el ciclo 2026-Q1?"
  description="Dejará de aparecer en el listado activo."
  confirmLabel="Archivar"
  loading={loading}
  onConfirm={async () => {
    setLoading(true);
    await archive();
    setLoading(false);
    setOpen(false);
  }}
/>
```

Sí: Nombra la acción en el botón («Eliminar», «Archivar»), nunca «Aceptar». · Usa `confirmationText` solo para borrados irreversibles con nombre propio. · Cierra el diálogo tú mismo después de que la operación asíncrona termine.
No: No lo uses para informar: si no hay decisión, es un toast o un `ModalShell`. · No pongas formularios dentro; para eso está `ModalShell` o `DrawerShell`.
Relacionados: alert-dialog, modal-shell, drawer-shell, button

### DrawerSection

La tarjeta con la que se arman todos los drawers del producto: chip de icono en su tono, título, una línea de ayuda y, bajo la divisoria, el contenido. Cambian el icono, el tono y el texto; nunca la anatomía.

```ts
import { DrawerSection } from "@/components/overlays"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `LucideIcon` |  | Icono del chip de cabecera. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral" \| "ai"` |  | Tono del chip: fondo claro y glifo en el acento. |
| `title` | `string` |  | Título de la sección. |
| `hint` | `string` |  | Una línea que explica para qué sirve. |
| `badge` | `string` |  | Dato al vuelo junto al título, p. ej. un recuento. |
| `action` | `React.ReactNode` |  | Acción alineada a la derecha; sus clics no pliegan la sección. |
| `stickyHeader` | `boolean` |  | Fija la cabecera al hacer scroll dentro del panel. |
| `collapsible` | `boolean` | `false` | La cabecera pliega y despliega el contenido. |
| `defaultOpen` | `boolean` | `false` | Si es plegable, arranca abierta. |
| `className / contentClassName` | `string` |  | Solo para layout (alto, scroll); nunca color ni borde. |

Ejemplo · Con acción y badge:

```tsx
const [options, setOptions] = React.useState(["Muy en desacuerdo", "En desacuerdo", "De acuerdo"]);

<DrawerSection
  icon={ListChecks}
  tone="brand"
  title="Opciones de respuesta"
  hint="Lo que la persona puede elegir al contestar."
  badge={String(options.length)}
  action={<Button size="xs" variant="outline" onClick={add}><Plus /> Agregar</Button>}
>
  {options.map((option) => <Input defaultValue={option} />)}
</DrawerSection>
```

Sí: Elige el tono por lo que significa el bloque, no por variar colores. · Usa `stickyHeader` solo cuando la acción vive en la cabecera. · Apila varias secciones en un drawer con `space-y-3`.
No: No metas un acordeón dentro del cuerpo: usa `collapsible`. · No cambies el borde ni el fondo por `className`; la anatomía es compartida.
Relacionados: drawer-shell, modal-shell, button

### DrawerShell

El panel lateral del producto sobre `Sheet`: cabecera con título, cuerpo con scroll propio y pie con acciones, en once tamaños y desde cualquier lado. Admite modo no modal y recorte del velo para convivir con paneles externos como el del Agente IA.

```ts
import { DrawerShell } from "@/components/overlays"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del panel. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el drawer (`asChild`). |
| `title / description` | `string` |  | Cabecera con borde inferior; si ambos faltan, no se pinta. |
| `children` | `React.ReactNode` |  | Cuerpo con scroll propio y `scrollbar-gutter: stable`. |
| `actions` | `React.ReactNode` |  | Botones del pie, en un `SheetFooter` con borde superior. |
| `footer` | `React.ReactNode` |  | Pie completamente personalizado; reemplaza a `actions`. |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Lado desde el que entra. |
| `size` | `"sm" … "7xl" \| "full"` | `"md"` | Ancho máximo en `sm+` (de 384px a 1280px o completo). No aplica a top/bottom. |
| `showCloseButton` | `boolean` | `true` | Muestra la X en la esquina. |
| `disablePadding / disableScrollbarGutter` | `boolean` | `false` | Quitan el padding del cuerpo o la reserva de la barra de scroll. |
| `modal` | `boolean` | `true` | En `false` el fondo sigue vivo (para convivir con un panel externo); el velo se sigue dibujando. |
| `overlayClassName / overlayStyle` | `string / CSSProperties` |  | Recortan o animan el velo. |
| `contentStyle` | `CSSProperties` |  | Estilo en línea del cajón, para sincronizar su movimiento con otro panel. |
| `onInteractOutside` | `(e: Event) => void` |  | Intercepta el clic fuera; llama a `e.preventDefault()` para no cerrar. |

Ejemplo · Formulario con acciones:

```tsx
const [open, setOpen] = React.useState(false);

<DrawerShell
  open={open}
  onOpenChange={setOpen}
  trigger={<Button>Nuevo objetivo</Button>}
  title="Nuevo objetivo"
  description="Define qué se quiere lograr y quién responde por ello."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button onClick={() => { create(); setOpen(false); }}>Crear objetivo</Button>
  </>}
>
  <Field label="Nombre" />
  <Field label="Responsable" />
</DrawerShell>
```

Sí: Compón el cuerpo con `DrawerSection` para que todos los paneles se lean igual. · Una acción primaria en el pie y la secundaria como `outline`. · Usa `lg` o más solo para vistas de detalle con varias columnas.
No: No apagues `modal` salvo para convivir con un panel fuera del portal. · No pongas la confirmación de borrado dentro del drawer: abre un `ConfirmDialog` encima.
Relacionados: sheet, drawer-section, modal-shell, confirm-dialog

### ModalShell

El modal centrado del producto sobre `Dialog`: cabecera con título y descripción, cuerpo y un pie con acciones o completamente propio. Cuatro tamaños para tareas cortas que no justifican un drawer.

```ts
import { ModalShell } from "@/components/overlays"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del modal. |
| `trigger` | `React.ReactNode` |  | Elemento que abre el modal (`asChild`). |
| `title / description` | `string` |  | Cabecera; si ambos faltan, no se pinta. |
| `children` | `React.ReactNode` |  | Cuerpo del modal. |
| `actions` | `React.ReactNode` |  | Botones del pie, en un `DialogFooter` alineado a la derecha. |
| `footer` | `React.ReactNode` |  | Pie completamente personalizado; reemplaza a `actions`. |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Ancho máximo en `sm+`: 384, 448, 512 o 576px. |
| `showCloseButton` | `boolean` | `true` | Muestra la X en la esquina. |
| `className` | `string` |  | Clases para el contenido del diálogo. |

Ejemplo · Edición corta:

```tsx
const [open, setOpen] = React.useState(false);
const [draft, setDraft] = React.useState(name);

<ModalShell
  open={open}
  onOpenChange={(next) => { if (next) setDraft(name); setOpen(next); }}
  trigger={<Button variant="outline">Renombrar</Button>}
  title="Renombrar plantilla"
  description="El nombre se muestra en el catálogo de plantillas."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button disabled={!draft.trim()} onClick={() => { setName(draft); setOpen(false); }}>Guardar</Button>
  </>}
>
  <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
</ModalShell>
```

Sí: Úsalo para tareas de uno o dos campos; si crece, pásate a `DrawerShell`. · Pon `autoFocus` en el primer campo cuando el modal es de edición. · Siempre un título: es lo que anuncia el lector de pantalla.
No: No lo uses para confirmar acciones destructivas: para eso está `ConfirmDialog`. · No apiles modales; abre un `ConfirmDialog` encima si hace falta, nunca otro `ModalShell`.
Relacionados: dialog, drawer-shell, confirm-dialog, button

### TemplateCatalogDrawer

El catálogo de plantillas en un panel: galería por estantes con buscador y dos vistas, una plantilla destacada arriba, y un paso más adentro la ficha con las líneas que trae, su peso dibujado y una fila de alternativas. Usa las mismas TemplateTile que van en la página, así que la plantilla que alguien reconoció fuera es la que reconoce dentro.

```ts
import { TemplateCatalogDrawer } from "@/components/templates"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open` | `boolean` |  | Si el panel está abierto. |
| `onOpenChange` | `(open: boolean) => void` |  | Cambio de apertura. |
| `groups` | `readonly TemplateGroup[]` |  | El catálogo, por estantes: id, label, description, icon y templates de cada uno. Con un solo estante la cabecera no se dibuja. |
| `onUseTemplate` | `(template: TemplateDefinition) => void` |  | Adelante con la plantilla. Qué signifique «usarla» lo decide quien monta el panel; cerrarlo también. |
| `initialTemplateId` | `string \| null` |  | Abre directamente en esa ficha en vez de en la galería. Se vuelve a leer en cada apertura. |
| `title` | `string` | `"Empieza con una plantilla"` | Título del panel. |
| `description` | `string` |  | Subtítulo del panel. |

Ejemplo · Desde la estantería a la ficha:

```tsx
const [openId, setOpenId] = React.useState<string | null>(null);

<TemplateCatalogDrawer
  open={openId !== null}
  onOpenChange={(next) => !next && setOpenId(null)}
  groups={estantes}
  initialTemplateId={openId}
  onUseTemplate={usar}
/>
```

Sí: Marca una plantilla con featured y escríbele un pitch: una rejilla de fichas iguales deja la primera decisión entera en manos de quien mira. · Rellena el hint de cada línea cuando el nombre no baste: la ficha es donde se decide si la plantilla vale. · Cierra el panel desde onUseTemplate, cuando ya sepas que la acción salió bien. · Agrupa por categorías de verdad: dentro de un estante las plantillas tienen que competir entre sí.
No: No dupliques el catálogo entre la página y el panel: pásale los mismos datos a los dos. · No metas la lógica del dominio aquí; el panel solo sabe de líneas con nombre y peso. · No abras el panel con initialTemplateId fijo si el atajo cambia: se lee en cada apertura, no una sola vez. · No lo uses para elegir entre dos o tres opciones: para eso está CardSelection.
Relacionados: template-tile, drawer-shell, drawer-section, card-selection


## [object Object] · 5

[object Object]

### AttentionStrip

La franja de avisos: una sola fila que dice cuánto reclama atención y ofrece un botón por motivo. El ánimo va en el filete lateral y el disco del icono, no en un lavado de color sobre toda la fila.

```ts
import { AttentionStrip, AttentionAction } from "@/components/feedback/AttentionStrip"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Cómo se anuncia el grupo a un lector de pantalla (`aria-label`). |
| `icon` | `LucideIcon` |  | Icono del disco a la izquierda de la franja. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral"` | `"warning"` | Color del filete lateral y del disco del icono. |
| `title` | `string` |  | La cifra de arriba: cuánto reclama atención. |
| `detail` | `string` |  | La línea de abajo: qué hacer con la fila. |
| `children` | `React.ReactNode` |  | Los botones, un `AttentionAction` por motivo. |
| `AttentionAction.icon` | `LucideIcon` |  | Icono del motivo; se colorea con `tone`. |
| `AttentionAction.label` | `string` |  | Nombre del motivo. |
| `AttentionAction.hint` | `string` |  | Explicación del aviso, mostrada en un tooltip. |
| `AttentionAction.value` | `number` |  | Cifra del motivo, formateada con separador de miles (es-CO). |
| `AttentionAction.tone` | `AttentionTone` | `"brand"` | Color del icono del botón cuando no está activo. |
| `AttentionAction.active` | `boolean` | `false` | Se pinta encendido cuando el aviso es además un filtro puesto. |
| `AttentionAction.onClick` | `() => void` |  | Qué pasa al pulsar el motivo. |

Ejemplo · Acciones como filtro:

```tsx
const [active, setActive] = React.useState<string | null>(null);
const toggle = (id: string) => setActive((current) => (current === id ? null : id));

<AttentionStrip label="Avisos del ciclo" icon={AlertTriangle} title="14 colaboradores reclaman atención" detail="Pulsa un motivo para filtrar la lista">
  <AttentionAction icon={Clock} label="Sin evaluar" hint="Aún no han recibido ninguna evaluación en este ciclo." value={9} tone="warning" active={active === "pending"} onClick={() => toggle("pending")} />
  <AttentionAction icon={UserX} label="Sin líder" hint="No tienen un líder asignado que pueda evaluarlos." value={5} tone="negative" active={active === "no-leader"} onClick={() => toggle("no-leader")} />
</AttentionStrip>
```

Sí: Una sola franja por bloque: agrupa varios motivos dentro con `AttentionAction`. · Usa `active` cuando el aviso filtra la lista que está debajo. · Escribe `hint` como una frase completa: es lo que explica el aviso.
No: No apiles varias franjas del mismo tono para decir lo mismo. · No la uses para mensajes de sistema o errores de formulario; para eso está Alert. · No pongas más de tres o cuatro acciones: la fila se vuelve una barra de menú.
Relacionados: alert, badge, button, tooltip

### EmptyState

La tarjeta punteada que ocupa el lugar de una lista vacía: un icono, un título, una explicación breve y, si aplica, la acción que la llena. Reutiliza `Card` con borde discontinuo y fondo sutil.

```ts
import { EmptyState } from "@/components/feedback/EmptyState"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | El titular del estado vacío. |
| `description` | `string` |  | Explicación breve de por qué está vacío o qué hacer. |
| `icon` | `LucideIcon` |  | Icono en el disco superior; se omite si no se pasa. |
| `action` | `React.ReactNode` |  | Botón o grupo de botones bajo la descripción. |
| `className` | `string` |  | Clases extra sobre la `Card` (p. ej. para quitar el marco). |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

Ejemplo · Sin acción:

```tsx
<EmptyState icon={FolderOpen} title="Sin evaluaciones recibidas" description="Cuando tu líder envíe la evaluación aparecerá aquí." />
```

Sí: Di qué está vacío y qué lo llenaría, en una o dos frases. · Ofrece la acción que resuelve el vacío cuando el usuario puede hacerla desde aquí. · Quita el marco con `className` si el contenedor ya dibuja uno.
No: No lo uses como pantalla de error: para fallos está Alert o un toast. · No metas más de dos acciones; el estado vacío no es un menú.
Relacionados: empty-state-action-button, table-shell, card, button

### EmptyStateActionButton

La acción secundaria dentro de un estado vacío: una píldora de contorno que invita a crear el primer elemento sin competir con la acción primaria de la página. Comparte el hover de borde y tinte con su alternativa de IA para que ambas se lean como un par.

```ts
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | Icono a la izquierda del texto; pásalo ya con su tamaño (`size-4`). |
| `children` | `React.ReactNode` |  | El texto del botón. |
| `className` | `string` |  | Clases extra sobre el botón. |
| `...props` | `React.ButtonHTMLAttributes<HTMLButtonElement>` |  | `onClick`, `disabled` y cualquier atributo nativo de <button>. |

Ejemplo · Par de opciones:

```tsx
<EmptyState
  title="Aún no hay competencias"
  description="Crea la primera o importa tu catálogo."
  action={
    <div className="flex flex-wrap justify-center gap-2">
      <EmptyStateActionButton icon={<Plus className="size-4" />}>Crear competencia</EmptyStateActionButton>
      <EmptyStateActionButton icon={<Upload className="size-4" />}>Importar catálogo</EmptyStateActionButton>
    </div>
  }
/>
```

Sí: Úsalo solo dentro de un estado vacío, como invitación a crear el primero. · Combínalo en pares (manual + IA, crear + importar) con el mismo peso.
No: No lo uses como acción primaria de una página; para eso está `Button`. · No mezcles un `Button` relleno y este contorno en el mismo par: rompe la equivalencia.
Relacionados: empty-state, button, ai-button

### Spinner

Indicador de carga indeterminado en cuatro tamaños (12, 16, 24 y 32px) y tres tonos. Anuncia el estado con `role="status"` y un texto solo para lectores de pantalla; con `prefers-reduced-motion` el arco se queda quieto. Para cargas largas con progreso conocido, prefiere Progress.

```ts
import { Spinner } from "@/components/feedback/Spinner"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | 12, 16, 24 o 32px. |
| `tone` | `"default" \| "primary" \| "inverse"` | `"default"` | Texto secundario, primario o blanco sobre fondos oscuros. |
| `label` | `string` | `"Cargando"` | Texto para lectores de pantalla (`sr-only`). |
| `...props` | `React.HTMLAttributes<"span">` |  | Atributos del contenedor; ya lleva `role="status"` y `aria-live="polite"`. |

Ejemplo · Tamaños:

```tsx
<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

Sí: Describe qué se carga en `label` («Importando usuarios»), no solo «Cargando». · Reserva el espacio del contenido mientras carga para no provocar saltos. · Muéstralo solo si la espera supera ~300ms; para menos, no hace falta feedback.
No: No uses varios spinners a la vez en la misma vista: uno por zona que carga. · No lo uses para progresos con porcentaje conocido; ahí va Progress. · No lo pongas sobre texto que siga interactivo sin deshabilitarlo.
Relacionados: progress, skeleton, button, empty-state

### ThemaToaster

El contenedor de toasts de Sonner con los ajustes Thema: apilados arriba a la derecha, por debajo del header, sin colores saturados y con botón de cierre. Se monta una sola vez a nivel de app (esta documentación ya lo hace); desde cualquier pantalla solo se llama a `toast()` de `sonner`.

```ts
import { ThemaToaster } from "@/components/feedback/ThemaToaster"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `topOffset` | `number` | `76` | Distancia en px desde el borde superior a la pila de toasts; libra el header de la app. |
| `className` | `string` |  | Clases extra sobre el contenedor de Sonner. |
| `style` | `React.CSSProperties` |  | Estilos inline sobre el contenedor. |

Ejemplo · Tipos:

```tsx
toast("Recordatorio enviado");
toast.success("Cambios guardados");
toast.info("Hay una versión nueva de la plantilla");
toast.warning("El ciclo cierra en 2 días");
toast.error("No se pudo enviar la evaluación");
```

Sí: Monta `<ThemaToaster />` una sola vez, en el root de la app. · Usa `toast.success` para confirmar lo que acaba de pasar y `toast.error` para lo que falló. · Añade `action` cuando el usuario pueda deshacer o ir al resultado.
No: No montes un segundo Toaster en una pantalla: cada toast se pintaría dos veces. · No uses toasts para validaciones de formulario; el error va junto al campo. · No uses `richColors`: el sistema mantiene el fondo sobrio y colorea solo icono y borde.
Relacionados: alert, button, alert-dialog


## [object Object] · 11

[object Object]

### Kanban

Tablero de columnas con tarjetas que cambian de etapa arrastrando: el pipeline de una vacante (Nuevos → En revisión → Entrevista → Oferta), o cualquier flujo por estados. Es controlado —`onItemMove` decide el nuevo orden— y comparte el motor de arrastre con `Sortable`, incluido el movimiento por teclado entre columnas.

```ts
import { Kanban } from "@/components/data-display/Kanban"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `columns` | `KanbanColumn[]` |  | Las columnas, en el orden en que se dibujan. |
| `items` | `KanbanItem[]` |  | Todas las tarjetas del tablero; `columnId` decide en cuál aparece cada una. |
| `onItemMove` | `(itemId: string, toColumnId: string, toIndex: number) => void` |  | `toIndex` ya es la posición dentro de la columna destino, sin contar la tarjeta movida. |
| `renderItem` | `(item: KanbanItem) => React.ReactNode` |  | Sustituye el cuerpo de la tarjeta; el envoltorio arrastrable se mantiene. |
| `columnWidth` | `number` | `288` | Ancho de cada columna en píxeles. |
| `emptyColumnLabel` | `string` | `"Sin tarjetas"` | Texto cuando una columna no tiene tarjetas. |
| `KanbanColumn.id` | `string` |  | Identificador estable de la columna. |
| `KanbanColumn.title` | `string` |  | Título visible en la cabecera. |
| `KanbanColumn.description` | `string` |  | Línea de contexto bajo el título. |
| `KanbanColumn.tone` | `"default" \| "primary" \| "positive" \| "warning" \| "negative"` | `"default"` | Color del punto junto al título y del contador. |
| `KanbanColumn.limit` | `number` |  | Umbral de WIP; al superarlo aparece el aviso y el contador pasa a «x/y». |
| `KanbanItem.id` | `string` |  | Identificador estable de la tarjeta. |
| `KanbanItem.columnId` | `string` |  | Columna a la que pertenece la tarjeta. |
| `KanbanItem.title` | `string` |  | Título de la tarjeta. |
| `KanbanItem.description` | `string` |  | Línea de contexto bajo el título. |
| `KanbanItem.meta` | `React.ReactNode` |  | Texto corto al pie: una fecha, un responsable. |
| `KanbanItem.avatar` | `React.ReactNode` |  | Avatar mostrado junto al título en la tarjeta por defecto. |
| `KanbanItem.badges` | `React.ReactNode` |  | Fila de badges bajo la descripción, en la tarjeta por defecto. |

Ejemplo · Pipeline de una vacante:

```tsx
const columns = [
  { id: "nuevos", title: "Nuevos" },
  { id: "revision", title: "En revisión", tone: "primary", limit: 3 },
  { id: "entrevista", title: "Entrevista", tone: "warning" },
  { id: "oferta", title: "Oferta", tone: "positive" },
];

<Kanban columns={columns} items={items} onItemMove={(itemId, toColumnId, toIndex) => setItems(moveItem(items, itemId, toColumnId, toIndex))} />
```

Sí: Confirma el movimiento en tu backend antes de repintar; el tablero es controlado y el estado que devuelves es el que se ve. · Pon `limit` solo en las columnas donde el exceso importa de verdad (revisión), no en todas. · Prueba el flujo completo con teclado: Espacio levanta, ↑/↓ mueve dentro de la columna, ←/→ cambia de columna.
No: No uses Kanban para menos de dos columnas; ahí una lista `Sortable` es más simple. · No quites el contador de tarjetas por columna: es lo primero que se lee en una revisión de pipeline. · No conviertas `renderItem` en un formulario; dispara una acción que abra el detalle en otro lado.
Relacionados: sortable, status-badge, card

### ListItem

Fila de lista con `leading` (avatar, icono o IconTile), título, descripción, `meta` a la derecha y acciones. Con `href` u `onClick` la fila entera se vuelve clicable sin anidar controles: las acciones quedan fuera del área del enlace. `ListItemGroup` apila las filas con espacio entre ellas; cada una lleva su propio borde y radio.

```ts
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `leading` | `React.ReactNode` |  | Avatar, icono o IconTile a la izquierda, con 12px hasta el texto. |
| `title` | `React.ReactNode` |  | Una línea; se trunca con elipsis. |
| `description` | `React.ReactNode` |  | Línea secundaria, 4px bajo el título. |
| `meta` | `React.ReactNode` |  | Texto o badge alineado a la derecha, con dígitos tabulares. |
| `actions` | `React.ReactNode` |  | Botones a la derecha. Quedan fuera del área clicable. |
| `href` | `string` |  | Convierte la fila en un `<a>` estirado. |
| `onClick` | `React.MouseEventHandler` |  | Convierte la fila en un `<button>` (o se añade al `<a>` si hay `href`). |
| `selected` | `boolean` | `false` | Tinte primario y barra a la izquierda; `aria-pressed` / `aria-current` en el control. |
| `size` | `"sm" \| "default"` | `"default"` | Alto de ~40px o ~56px. |
| `ListItemGroup` | `React.HTMLAttributes<"div">` |  | Contenedor con `role="list"` que apila las filas con espacio entre ellas (cada fila trae su propio borde y radio `xl`). No pone padding lateral: las tarjetas llegan hasta donde llegue su contenedor. |

Ejemplo · Lista de planes de formación:

```tsx
<ListItemGroup>
  {plans.map((plan) => (
    <ListItem
      key={plan.id}
      leading={<IconTile icon={<BookOpen />} tone={plan.tone} />}
      title={plan.title}
      description={plan.description}
      meta={`${plan.people} personas`}
      selected={selected === plan.id}
      onClick={() => setSelected(plan.id)}
    />
  ))}
</ListItemGroup>
```

Sí: Elige una convención de `leading` por lista: todos avatares o todos IconTile. · Usa `meta` para un dato corto y `actions` para como máximo dos iconos. · Da a los botones de `actions` un `aria-label` que incluya el nombre de la fila.
No: No metas un enlace dentro de `title` si la fila ya es clicable. · No uses ListItem para tablas con más de tres columnas: ahí va TableShell. · No combines `selected` con `href` salvo para marcar la ruta actual.
Relacionados: icon-tile, avatar, status-badge, table-shell

### RowActionsMenu

El botón de acciones de una fila: lo que se puede hacer con ese registro sin pasar por marcarlo. Es la alternativa a las casillas cuando la lista se opera de una en una —un menú por fila en vez de un modelo de lote—, y es lo que pinta DataListBlock cuando quien mira elige «Menú en cada fila» en el panel de configuración.

```ts
import { RowActionsMenu } from "@/components/data-display"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `RowAction[]` |  | Lo que se puede hacer con la fila. Con la lista vacía el botón no se pinta: un menú sin nada dentro es peor que no tenerlo. |
| `RowAction` | `{ id; label; icon?; tone?; blockedReason?; onSelect? }` |  | Mismo contrato que las acciones de la barra flotante, para declarar una vez y pintar en los dos sitios. |
| `rowLabel` | `string` |  | Qué fila se opera. Entra en el `aria-label` del botón para que no sea un «⋯» sin dueño. |
| `className` | `string` |  | Clases del botón disparador. |

Ejemplo · Una fila, sus acciones:

```tsx
<RowActionsMenu rowLabel={row.name} actions={acciones} />
```

Sí: Pasa `rowLabel` siempre: es lo único que distingue un botón de otro para quien navega con lector de pantalla. · Pon `tone: "danger"` en lo destructivo y déjalo al final de la lista. · Usa `blockedReason` en vez de quitar la acción cuando no aplica en ese estado.
No: No lo mezcles con casillas en la misma tabla: o se opera en lote o se opera de una en una. · No metas ahí acciones que afectan a toda la pantalla; esas van en la cabecera o en la barra flotante.
Relacionados: data-list-block, data-list-action-rail, table-config, list-item

### Sortable

Lista que se reordena arrastrando: las lecciones de un plan de formación, las preguntas de una encuesta, los pasos de un proceso. El arrastre con ratón y el teclado (Espacio levanta, flechas mueve, Espacio suelta, Escape cancela) comparten el mismo motor, y cada cambio se anuncia en una región `aria-live`.

```ts
import { Sortable, SortableItem } from "@/components/data-display/Sortable"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `T[]` |  | La lista en su orden actual. `Sortable` es un componente controlado: nunca la muta. |
| `getId` | `(item: T) => string` |  | Identificador estable de cada elemento. |
| `onReorder` | `(items: T[]) => void` |  | Recibe la lista completa ya reordenada, como copia nueva. |
| `getLabel` | `(item: T) => string` |  | Texto para los anuncios («Lección 3 movida a…»). Sin él se usa `label`, `title` o `name` del propio item. |
| `renderItem` | `(item: T, state: SortableItemState) => React.ReactNode` |  | Compone cada fila; alternativa a pasar `SortableItem` como children. |
| `children` | `React.ReactNode` |  | Composición manual con `SortableItem`, en el mismo orden que `items`. |
| `handle` | `boolean` | `true` | Agarre dedicado con `GripVertical`. En `false` toda la fila arrastra. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Define el eje de arrastre y qué flechas mueven el elemento levantado. |
| `disabled` | `boolean` | `false` | Desactiva el arrastre y el teclado sin ocultar la lista. |
| `SortableItemState.isDragging` | `boolean` |  | El elemento se está arrastrando con el puntero. |
| `SortableItemState.isOver` | `boolean` |  | El puntero está encima de este elemento con algo agarrado. |
| `SortableItemState.isLifted` | `boolean` |  | Se levantó con teclado y las flechas lo mueven. |

Ejemplo · Lecciones de un plan de formación:

```tsx
const [items, setItems] = React.useState(lessons);

<Sortable items={items} getId={(item) => item.id} onReorder={setItems} renderItem={(item) => <span>{item.label}</span>} />
```

Sí: Da siempre `getLabel`, o un campo `label`/`title`/`name` en el objeto: los anuncios `aria-live` dependen de eso. · Deja `handle` en `true` (su valor por defecto) cuando la fila tiene además un `onClick`; sin agarre dedicado el clic y el arrastre compiten. · Prueba el reordenamiento completo con teclado (Espacio, flechas, Espacio, Escape) antes de dar la lista por accesible.
No: No mutes `items` dentro de `onReorder`; usa la copia que ya te entrega el componente. · No uses `orientation="horizontal"` en columnas estrechas: las flechas izquierda/derecha compiten con el scroll de la página. · No pongas dos `Sortable` con ids repetidos en la misma pantalla; la región `aria-live` es por instancia, pero los anuncios se confunden si los ids coinciden.
Relacionados: kanban, list-item, table-shell

### StatusBadge

Un `Badge` con vocabulario de estado: cada valor trae su variante de color y su etiqueta en español por defecto. Sirve para que una tabla o una tarjeta digan «Activo» o «Pendiente» sin repetir el mapa de colores en cada pantalla.

```ts
import { StatusBadge } from "@/components/data-display/StatusBadge"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `status` | `"active" \| "inactive" \| "pending" \| "completed" \| "warning" \| "error" \| "info" \| "neutral"` |  | El estado; decide la variante de color y la etiqueta por defecto. |
| `label` | `string` |  | Texto alternativo; si se omite se usa la etiqueta en español del estado. |
| `className` | `string` |  | Clases extra sobre el `Badge`. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo del contenedor. |

Ejemplo · Todos los estados:

```tsx
<StatusBadge status="active" />
<StatusBadge status="completed" />
<StatusBadge status="pending" />
<StatusBadge status="warning" />
<StatusBadge status="error" />
<StatusBadge status="info" />
<StatusBadge status="inactive" />
<StatusBadge status="neutral" />
```

Sí: Usa el mismo `status` para el mismo significado en toda la app; cambia solo `label`. · Prefiere `inactive` o `neutral` para lo archivado, no `error`.
No: No lo uses como botón ni como filtro: es solo lectura. · No inventes colores con `className`; si falta un estado, amplía el mapa.
Relacionados: badge, status-badge-animated, table-shell

### StatusBadge (animado)

La píldora de estado con transición: al cambiar `state`, el icono entra con un resorte y el texto se desliza, así el ojo ve que algo pasó y no solo que algo es distinto. El estado pendiente lleva un spinner girando; el resto, un icono fijo.

```ts
import { StatusBadge } from "@/components/status-badge"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `state` | `"pending" \| "failed" \| "success" \| "neutral" \| "info"` | `"pending"` | El estado actual; cambiarlo dispara la transición. |
| `labels` | `Partial<Record<StatusState, string>>` |  | Etiquetas propias por estado; se mezclan con las de fábrica. |
| `className` | `string` |  | Clases extra sobre la píldora. |

Ejemplo · Transiciones entre estados:

```tsx
const [state, setState] = React.useState<StatusState>("neutral");

<StatusBadge state={state} />
<Button size="xs" onClick={() => setState("pending")}>Pendiente</Button>
<Button size="xs" onClick={() => setState("success")}>Éxito</Button>
```

Sí: Úsalo donde el estado cambia delante del usuario: envíos, sincronizaciones, procesos. · Pasa `labels` con el vocabulario del dominio (Enviada, Rechazada…).
No: No lo uses en listas largas y estáticas: cada instancia monta framer-motion; ahí va `StatusBadge` de data-display. · No cambies el estado en cada render; la animación se dispara con cada cambio de `state`.
Relacionados: status-badge, badge

### Tabla configurable

El kit para que una tabla recuerde cómo quiere verla cada persona: qué columnas, en qué orden, cuáles quedan fijadas al desplazar de lado y si las filas llegan por scroll o por páginas. Las columnas se declaran una sola vez (`TableColumnSpec[]`) y de esa lista salen el encabezado, las celdas y el panel de «Configurar». La preferencia vive en `localStorage` por tabla, no en la URL.

```ts
import { useTableConfig, TableConfigButton, ConfigurableHeaderCells, ConfigurableRowCells, useColumnDrag, useLazyRows, LazyRowsSentinel, LazyRowsSummary, TableBleedBox } from "@/components/data-display/table-config"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.view` | `"table" \| "list"` | `"table"` | Rejilla o lista. Lo elige quien lee desde el panel («Cómo se ven») y se recuerda con el resto de la configuración; la pantalla decide cómo dibuja cada una. |
| `config.setView` | `(view) => void` |  | Cambia la vista. El panel ya lo llama; está aquí para un atajo propio de la pantalla. |
| `TableColumnSpec` | `{ id; label; fixed?; hiddenByDefault?; available? }` |  | Una columna declarada una vez. `fixed` la hace inamovible (solo la de selección); `available: false` la saca de la tabla y del panel sin olvidar su sitio. |
| `useTableConfig(tableId, columns, options?)` | `TableConfig` |  | El estado de la tabla, leído de `localStorage` en el primer render. `options.defaultMode` cambia el modo de fábrica (`"lazy"`). |
| `TableConfig.columns / fixedColumns / movableColumns` | `readonly TableColumnSpec[]` |  | Las visibles en orden, las que nunca se mueven y todas las movibles (para el panel). |
| `TableConfig.isLazy / mode / isDirty` | `boolean / TableRowsMode / boolean` |  | Cómo llegan las filas y si algo se salió de fábrica (enciende el punto del botón). |
| `TableConfig.toggleVisibility / togglePin / moveColumn / reset` | `(…) => void` |  | Las acciones del panel. Ocultar una fijada la suelta; fijar una oculta la muestra. |
| `TableColumnCells<T>` | `Record<string, { head; cell(row); headClassName?; cellClassName? }>` |  | Encabezado y celda de cada columna, juntos, para que el orden se aplique una vez sobre el par. |
| `ConfigurableHeaderCells / ConfigurableRowCells` | `component` |  | Recorren `config.columns` y sacan su mitad de `cells`. También miden los anchos para apilar las columnas fijadas. |
| `config.actions` | `"rail" \| "inline"` | `"rail"` | Dónde vive lo que se puede hacer. `rail` lo concentra todo en la barra flotante —las de la pantalla sin selección, las de los registros en cuanto se marca algo, sustituyéndolas— y deja la cabecera de la pantalla sin botones. `inline` las devuelve al layout: arriba las de la pantalla, y en la cabecera de la lista las de lo marcado. |
| `config.setActions` | `(placement) => void` |  | Cambia dónde van las acciones. Lo llama el panel («Dónde van las acciones»). |
| `config.rowControl` | `"checkbox" \| "menu"` | `"checkbox"` | Cómo se actúa sobre un registro. `checkbox` es el modelo de lote: se marcan filas —con su casilla o picando en la fila— y las acciones operan sobre lo marcado. `menu` quita las casillas y le da a cada fila su botón de acciones: se actúa sobre una sola, sin pasar por seleccionar, y no hay acciones en lote. |
| `config.setRowControl` | `(control) => void` |  | Cambia el modelo de fila. Lo llama el panel («Cómo se actúa sobre una fila»). |
| `TableConfigButton` | `{ config; noun?; showRowsMode?; showActionsPlacement?; showRowControl?; className? }` |  | El botón «Configurar» con el popover. `noun` nombra lo listado («colaboradores»); `showRowsMode={false}` esconde el selector de modo, `showActionsPlacement={false}` el de dónde van las acciones y `showRowControl={false}` el del modelo de fila (los dos últimos sobran donde no se opera sobre registros). |
| `DraggableHeaderCell` | `{ column; drag; pinned?; …th }` |  | Un `TableHead` con tirador de arrastre y guía de destino. Lo usa `ConfigurableHeaderCells`; úsalo directo solo en encabezados a mano. |
| `useColumnDrag({ axis, onReorder })` | `ColumnDrag` |  | Arrastre nativo, sin librería. `axis: "x"` en el encabezado, `"y"` en la lista del panel. Devuelve `dragHandleProps`, `dropTargetProps` y `dropSideFor`. |
| `useLazyRows({ total, enabled, step?, resetKey? })` | `LazyRows` |  | Cuántas filas mostrar (`count`), si faltan (`hasMore`) y el `attachSentinel`. Con `enabled: false` devuelve el total. `resetKey` reinicia al cambiar filtros. |
| `LazyRowsSentinel` | `{ lazy; colSpan; noun }` |  | Las últimas filas del `<tbody>`: hasta cuatro esqueletos y un botón «Cargar más» solo para teclado. |
| `LazyRowsSummary` | `{ lazy; total; noun; className? }` |  | El contador «12 de 48 colaboradores» que sustituye al paginador. |
| `TableBleedBox` | `{ bleed?: string; …div }` | `"-mx-6"` | La caja que saca la tabla al borde de su tarjeta, con regla arriba y abajo y scroll horizontal. |

Ejemplo · Tabla completa:

```tsx
const COLUMNS: TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  { id: "name", label: "Colaborador" },
  { id: "area", label: "Área" },
  { id: "progress", label: "Avance" },
  { id: "status", label: "Estado", hiddenByDefault: true },
];

const CELLS: TableColumnCells<Person> = {
  name: { head: "Colaborador", cell: (row) => row.name },
  area: { head: "Área", cell: (row) => row.area },
  progress: { head: "Avance", headClassName: "text-right", cell: (row) => `${row.progress}%`, cellClassName: "text-right" },
  status: { head: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
};

const config = useTableConfig("colaboradores", COLUMNS);
const drag = useColumnDrag({ axis: "x", onReorder: config.moveColumn });
const lazy = useLazyRows({ total: rows.length, enabled: config.isLazy, step: 25, resetKey: query });

<TableConfigButton config={config} noun="colaboradores" />

<div className="max-h-[300px] overflow-y-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-10" />                       {/* la columna fija, a mano */}
        <ConfigurableHeaderCells config={config} drag={drag} cells={CELLS} />
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.slice(0, lazy.count).map((row) => (
        <TableRow key={row.id}>
          <TableCell><Checkbox /></TableCell>
          <ConfigurableRowCells config={config} cells={CELLS} row={row} />
        </TableRow>
      ))}
      <LazyRowsSentinel lazy={lazy} colSpan={1 + config.columns.length} noun="colaboradores" />
    </TableBody>
  </Table>
</div>
<LazyRowsSummary lazy={lazy} total={rows.length} noun="colaboradores" />
```

Sí: Ofrece la vista de lista cuando las columnas sobran para decidir: en la lista se queda lo que identifica el registro y su estado. · Comparte la selección entre las dos vistas: es la misma lista, solo cambia el dibujo. · Usa un `tableId` estable y único por tabla: es la llave con la que se recuerda la preferencia. · Pinta la columna fija (selección) a mano antes de `ConfigurableHeaderCells`; no pasa por el diccionario. · Acota la altura de la caja con scroll cuando uses `useLazyRows`: el centinela necesita un contenedor que recorte de verdad. · Pasa `resetKey` con la búsqueda y los filtros para que la carga vuelva al primer tramo.
No: No guardes la configuración en la URL: es preferencia de quien mira, no parte de lo que se comparte. · No marques `fixed` más que la columna de selección; para dejar quieta una columna está la chincheta (`pinned`). · No cambies el `id` de una columna ya publicada: rompe el orden guardado en `localStorage`.
Relacionados: table, table-shell, table-header-controls, status-badge, popover, skeleton

### TableHeaderControls

Los controles que viven en los encabezados de toda tabla seleccionable: el menú de selección masiva, el encabezado que ordena y filtra por valores, y el que solo ordena. Una sola copia para que la lista de encuestas y la de participación se comporten igual.

```ts
import { SelectionHeaderMenu, FilterSortHeader, SortOnlyHeader } from "@/components/data-display/TableHeaderControls"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `SelectionHeaderMenu.state` | `boolean \| "indeterminate"` |  | Cuántas filas están marcadas: ninguna, algunas o todas. |
| `SelectionHeaderMenu.paged` | `boolean` |  | Si la tabla se lee por páginas. Solo entonces hay menú; en scroll infinito es una casilla. |
| `SelectionHeaderMenu.pageCount / matchCount` | `number` |  | Filas en la página actual y filas que coinciden con búsqueda y filtros. |
| `SelectionHeaderMenu.show*` | `boolean` |  | Qué opciones del menú se ofrecen (seleccionar/deseleccionar página o todos). |
| `SelectionHeaderMenu.on*` | `() => void` |  | Las cuatro acciones del menú. |
| `SelectionHeaderMenu.align` | `"center" \| "start"` | `"center"` | Dónde cae la marca; debe coincidir con la casilla de las filas. |
| `HeaderSelectAllCheckbox` | `component` |  | La casilla sola, para tablas sin páginas; `SelectionHeaderMenu` la usa cuando `paged` es falso. |
| `FilterSortHeader.options / selected` | `readonly string[] / ReadonlySet<string>` |  | Los valores filtrables y los marcados. |
| `FilterSortHeader.defaultAllSelected` | `boolean` | `false` | Cierto cuando un conjunto vacío significa «nada excluido» en vez de «nada elegido». |
| `FilterSortHeader.filterLabel` | `string` |  | Nombre del embudo para el lector de pantalla si difiere del título. |
| `SortOnlyHeader.label` | `ReactNode` |  | Título de la columna; admite nodos para alternar nombre largo y abreviatura. |
| `sortActive / onSort` | `boolean / () => void` |  | Si esta columna manda el orden y qué hacer al pulsar. |
| `align` | `"left" \| "right"` | `"left"` | Alineación del encabezado; a la derecha en columnas numéricas. |

Ejemplo · Selección masiva:

```tsx
<SelectionHeaderMenu
  state={headerState}            // false | true | "indeterminate"
  paged={paged}
  pageCount={pageIds.length}
  matchCount={allIds.length}
  showSelectPage={pageSelectedCount < pageIds.length}
  showSelectAll={selected.size < allIds.length}
  showDeselectPage={pageSelectedCount > 0}
  showDeselectAll={selected.size > 0}
  onSelectPage={() => select(pageIds)}
  onSelectAll={() => select(allIds)}
  onDeselectPage={() => deselect(pageIds)}
  onDeselectAll={() => setSelected(new Set())}
  formatCount={(n) => n.toLocaleString("es-CO")}
/>
```

Sí: Alinea `align` del menú con la casilla de las filas; si no, la columna se lee como dos. · Usa `SortOnlyHeader` en cifras, porcentajes y fechas. · Recalcula los `show*` desde el estado real: el menú solo ofrece lo que tiene sentido.
No: No metas un `Checkbox` real dentro del trigger del menú: es un botón dentro de un botón. · No ofrezcas «esta página» en scroll infinito; pasa `paged={false}`.
Relacionados: table, table-config, checkbox, dropdown-menu

### TableShell

La tarjeta que envuelve una tabla: título, descripción y acciones en la cabecera, y el estado vacío resuelto por defecto. La tabla en sí va como `children`; el shell solo pone el marco, el scroll horizontal y, si se pide, el encabezado pegajoso.

```ts
import { TableShell } from "@/components/data-display/TableShell"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `React.ReactNode` |  | Título de la cabecera. Acepta un nodo para lo que va pegado al nombre: el total en un `Badge`, una insignia de estado. |
| `description` | `string` |  | Línea secundaria bajo el título. |
| `actions` | `React.ReactNode` |  | Botones o controles alineados a la derecha de la cabecera. |
| `children` | `React.ReactNode` |  | La tabla; se envuelve en una caja con scroll horizontal. |
| `empty` | `boolean` | `false` | Si es cierto, se pinta el estado vacío en lugar de la tabla. |
| `emptyState` | `React.ReactNode` |  | Estado vacío propio; por defecto un `EmptyState` genérico. |
| `stickyHeader` | `boolean` | `false` | Fija el `<thead>` arriba mientras la caja interior hace scroll. |
| `surface` | `"card" \| "header"` | `"card"` | Dónde pinta superficie el marco. `header` la deja solo en la barra de título y descarga el cuerpo, para cuando las filas ya se sostienen solas —una lista a sangre— y una segunda superficie sería una caja dentro de otra. |
| `footer` | `React.ReactNode` |  | El pie del marco, separado por su línea: la paginación, el resumen de «x de y». Dentro de la tarjeta, no flotando debajo. |
| `className` | `string` |  | Clases extra sobre la `Card`. |

Ejemplo · Con búsqueda y vacío propio:

```tsx
const rows = PEOPLE.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));

<TableShell
  title="Colaboradores"
  description={`${rows.length} de ${PEOPLE.length}`}
  empty={rows.length === 0}
  emptyState={<EmptyState icon={Search} title="Nadie coincide" className="border-none bg-transparent shadow-none" action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Limpiar</Button>} />}
  actions={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="h-8 w-44" />}
>
  <Table>…</Table>
</TableShell>
```

Sí: Calcula `empty` desde los datos ya filtrados, no desde la carga inicial. · Pon en `actions` solo lo que actúa sobre toda la tabla: exportar, crear, buscar. · Manda la paginación a `footer`: pertenece a la lista, así que va dentro de su marco. · Deja que la tabla vaya a sangre: el marco ya pone el borde y el texto de la primera columna se alinea solo con el título.
No: No anides otra `Card` ni una caja con borde dentro: el shell ya es la tarjeta. · No uses `stickyHeader` sin acotar la altura de la caja interior; sin scroll no hay nada que pegar.
Relacionados: table, empty-state, table-config, table-header-controls, card

### Timeline

Línea de tiempo de eventos: un punto o icono de 24px sobre una línea vertical continua, con título, hora y una descripción o cuerpo opcional. Úsala para historiales (de un candidato, de una solicitud) y registros de actividad.

```ts
import { Timeline, TimelineItem } from "@/components/data-display/Timeline"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `Timeline.align` | `"left" \| "alternate"` | `"left"` | Lado de los eventos respecto a la línea. |
| `TimelineItem.icon` | `React.ReactNode` |  | Icono de 12px dentro del punto. Sin él se dibuja un punto sólido. |
| `TimelineItem.tone` | `"default" \| "primary" \| "positive" \| "negative" \| "warning"` | `"default"` | Color del punto y del icono. |
| `TimelineItem.title` | `React.ReactNode` |  | Qué pasó, en pocas palabras. |
| `TimelineItem.time` | `React.ReactNode` |  | Fecha u hora, alineada a la derecha con dígitos tabulares. |
| `TimelineItem.description` | `React.ReactNode` |  | Una línea de contexto bajo el título. |
| `TimelineItem.children` | `React.ReactNode` |  | Cuerpo libre bajo la descripción. |

Ejemplo · Historial de un candidato:

```tsx
<Timeline>
  <TimelineItem icon={<UserPlus />} tone="primary" title="Postulación recibida" time="12 mar, 09:14" description="Desde LinkedIn…" />
  <TimelineItem icon={<FileText />} title="CV revisado por Renata Méndez" time="12 mar, 16:40" />
  <TimelineItem icon={<Mail />} title="Invitación a entrevista enviada" time="13 mar, 10:02" />
  <TimelineItem icon={<CalendarCheck />} tone="positive" title="Entrevista completada" time="17 mar, 15:30">
    <blockquote>«Muy buen criterio de sistemas. Pasa a la prueba técnica.»</blockquote>
  </TimelineItem>
  <TimelineItem tone="warning" title="Prueba técnica pendiente" time="Vence el 24 mar" />
</Timeline>
```

Sí: Ordena del más reciente al más antiguo salvo que el flujo sea cronológico (un proceso de selección). · Escribe títulos en pasado y con sujeto («CV revisado por Renata»). · Usa la hora relativa («hace 2 h») en actividad reciente y la fecha absoluta en historiales.
No: No mezcles más de dos tonos de color en la misma lista si no son estados reales. · No pongas formularios dentro del cuerpo; enlaza a la pantalla correspondiente. · No uses `alternate` en columnas de menos de 480px.
Relacionados: status-badge, stepper, badge, avatar

### Tree

Árbol jerárquico con expansión y selección: empresa → áreas → equipos, o cualquier estructura anidada que haya que recorrer o elegir. Implementa el patrón ARIA `tree` completo (foco itinerante, `aria-level`, indeterminado en la selección múltiple) para navegarse entero con el teclado.

```ts
import { Tree } from "@/components/data-display/Tree"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `nodes` | `TreeNode[]` |  | La jerarquía completa; cada nodo puede traer sus propios `children`. |
| `selectable` | `"none" \| "single" \| "multiple"` | `"none"` | `multiple` añade casilla por nodo con propagación e indeterminado. |
| `size` | `"default" \| "sm"` | `"default"` | Alto de fila e íconos. Usa `sm` solo con dos niveles como máximo. |
| `expandedIds / defaultExpandedIds` | `string[]` |  | Ids abiertos, en modo controlado o inicial. |
| `onExpandedChange` | `(ids: string[]) => void` |  | Se dispara al abrir o cerrar un nodo. |
| `selectedIds / defaultSelectedIds` | `string[]` |  | Ids marcados, en modo controlado o inicial. |
| `onSelectedChange` | `(ids: string[]) => void` |  | Nueva selección completa, ya con los ancestros recalculados. |
| `emptyLabel` | `string` | `"Sin elementos"` | Texto cuando `nodes` viene vacío. |
| `TreeNode.id` | `string` |  | Identificador estable del nodo. |
| `TreeNode.label` | `string` |  | Etiqueta visible y accesible del nodo. |
| `TreeNode.icon` | `React.ReactNode` |  | Icono de 16px a la izquierda de la etiqueta. |
| `TreeNode.count` | `number` |  | Contador a la derecha, p. ej. cuántas personas cuelgan del nodo. |
| `TreeNode.disabled` | `boolean` |  | El nodo (y su rama) no se enfoca, no se selecciona y no cuenta para sus ancestros. |
| `TreeNode.children` | `TreeNode[]` |  | Nodos hijos; su presencia añade el chevron de expandir. |

Ejemplo · Selección de audiencia:

```tsx
const [selectedIds, setSelectedIds] = React.useState(["frontend", "backend"]);

<Tree
  nodes={nodes}
  selectable="multiple"
  defaultExpandedIds={["acme", "tecnologia", "personas"]}
  selectedIds={selectedIds}
  onSelectedChange={setSelectedIds}
/>
```

Sí: Úsalo para jerarquías reales de al menos dos niveles; una lista plana no necesita `role="tree"`. · Deja que el estado indeterminado comunique una selección parcial: no lo tapes con `className`. · Marca `disabled` los nodos que no aplican en vez de quitarlos; la jerarquía se ve completa igual.
No: No actives `selectable="multiple"` sin mostrar en algún lugar cuántos elementos quedaron seleccionados. · No uses `size="sm"` en árboles de más de tres niveles: la indentación se vuelve ilegible. · No dupliques la navegación con clics obligatorios; el árbol ya cubre flechas, Home, End y Espacio.
Relacionados: list-item, checkbox, badge


## [object Object] · 10

[object Object]

### DateFilterBar

Barra horizontal que compone PeriodSelector, DatePicker y DateRangePicker detrás de un select de modo. Todo el estado es controlado por el padre, que decide qué hacer con periodo, fecha o rango.

```ts
import { DateFilterBar } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `mode` | `"period" \| "date" \| "range"` | `"period"` | Modo activo; decide qué control se muestra. |
| `onModeChange` | `(mode: DateFilterMode) => void` |  | Se dispara al cambiar el select de modo. |
| `period` | `string` |  | Valor del PeriodSelector (modo `period`). |
| `onPeriodChange` | `(value: string) => void` |  | Cambio de periodo. |
| `date` | `Date` |  | Fecha del DatePicker (modo `date`). |
| `onDateChange` | `(date?: Date) => void` |  | Cambio de fecha. |
| `range` | `{ from?: Date; to?: Date }` |  | Rango del DateRangePicker (modo `range`). |
| `onRangeChange` | `(range?: { from?: Date; to?: Date }) => void` |  | Cambio de rango. |
| `disabled` | `boolean` | `false` | Desactiva toda la barra. |
| `className` | `string` |  | Clases extra para el contenedor flex. |

Ejemplo · Totalmente controlada:

```tsx
const [mode, setMode] = React.useState<DateFilterMode>("period")
const [period, setPeriod] = React.useState<string>("last_30_days")
const [date, setDate] = React.useState<Date>()
const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateFilterBar
  mode={mode}
  onModeChange={setMode}
  period={period}
  onPeriodChange={setPeriod}
  date={date}
  onDateChange={setDate}
  range={range}
  onRangeChange={setRange}
/>
```

Sí: Úsala como cabecera de filtros en dashboards e informes. · Conserva los tres valores en el padre para que cambiar de modo no pierda lo elegido.
No: No la uses en formularios: sus etiquetas fijas y su disposición horizontal son de filtro. · No la coloques en contenedores estrechos (<420px): los controles se apilan y pierden la lectura horizontal.
Relacionados: period-selector, date-picker, date-range-picker, select, date-utils

### DatePicker

Selector de una sola fecha que combina Popover y Calendar en un campo con etiqueta, ayuda y error. Trabaja con Date nativo y formatea el valor con Intl según el locale indicado.

```ts
import { DatePicker } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `Date \| null` |  | Fecha seleccionada. Las fechas inválidas o fuera de rango se muestran como vacías. |
| `onChange` | `(date: Date \| undefined) => void` |  | Se dispara al elegir un día; `undefined` al deseleccionarlo. |
| `placeholder` | `string` | `"Select a date"` | Texto del campo cuando no hay valor. |
| `label` | `string` |  | Etiqueta visible enlazada al botón por `aria-labelledby`. |
| `description` | `string` |  | Texto de ayuda bajo el campo. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo del campo. |
| `minDate` | `Date` |  | Primer día seleccionable (inclusive). |
| `maxDate` | `Date` |  | Último día seleccionable (inclusive). |
| `disabled` | `boolean` | `false` | Desactiva el campo y baja la opacidad de la etiqueta. |
| `locale` | `string` | `"en-US"` | Código Intl para formatear el valor; con `es*` el calendario también se traduce. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Controlado:

```tsx
const [date, setDate] = React.useState<Date | undefined>()

<DatePicker
  value={date}
  onChange={setDate}
  label="Fecha de entrega"
  placeholder="Elige una fecha"
  locale="es-ES"
/>
```

Sí: Pasa `locale="es-ES"` en producto para que campo y calendario hablen el mismo idioma. · Limita con `minDate`/`maxDate` cuando el dominio lo exige (fechas futuras, cierre de periodo). · Usa `error` con un mensaje accionable, no solo un borde rojo.
No: No lo uses para rangos: existe DateRangePicker. · No mezcles el formato Intl del campo con otro formato en el resto de la pantalla.
Relacionados: date-range-picker, calendar, popover, date-utils

### DateRangePicker

Selector de rango en un solo campo: abre un calendario de dos meses y cierra al completar inicio y fin. Ideal para filtros de informes donde el rango se lee de un vistazo.

```ts
import { DateRangePicker } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ from?: Date; to?: Date } \| null` |  | Rango seleccionado; cualquiera de los extremos puede faltar mientras se elige. |
| `onChange` | `(range: { from?: Date; to?: Date } \| undefined) => void` |  | Se dispara en cada clic sobre el calendario. |
| `placeholder` | `string` | `"Select a date range"` | Texto del campo sin valor. |
| `label` | `string` |  | Etiqueta visible enlazada al botón. |
| `description` | `string` |  | Texto de ayuda bajo el campo. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `minDate` | `Date` |  | Primer día seleccionable (inclusive). |
| `maxDate` | `Date` |  | Último día seleccionable (inclusive). |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `locale` | `string` | `"en-US"` | Código Intl para formatear `from - to` en el campo. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Controlado:

```tsx
const [range, setRange] = React.useState<{ from?: Date; to?: Date }>()

<DateRangePicker
  value={range}
  onChange={setRange}
  label="Periodo del informe"
  placeholder="Elige un rango"
  locale="es-ES"
/>
```

Sí: Úsalo en filtros donde el rango cabe en un solo campo compacto. · Combínalo con PeriodSelector para ofrecer atajos (últimos 7 días, mes actual). · Muestra el rango resultante en la cabecera del informe con `formatDateRange`.
No: No lo uses en formularios de creación donde inicio y fin necesitan validación propia: usa DualDateRangePicker. · No cambies `value` desde fuera mientras el usuario está eligiendo el segundo extremo.
Relacionados: date-picker, dual-date-range-picker, date-filter-bar, calendar, date-utils

### DualDateRangePicker

Dos campos (inicio y cierre) que comparten un calendario de dos meses con pasos guiados, previsualización al pasar el ratón y confirmación explícita con Aplicar. Pensado para crear campañas o programas donde ambos extremos son obligatorios.

```ts
import { DualDateRangePicker } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `startDate` | `Date \| null` |  | Fecha de inicio controlada. |
| `endDate` | `Date \| null` |  | Fecha de cierre controlada. |
| `onChange` | `(range: { startDate?: Date; endDate?: Date }) => void` |  | Se dispara en cada clic de día y al borrar o aplicar. |
| `onApply` | `() => void` |  | Se dispara al pulsar Aplicar, después de `onChange`. |
| `startLabel` | `string` | `"Fecha de inicio"` | Etiqueta del primer campo. |
| `endLabel` | `string` | `"Fecha de cierre"` | Etiqueta del segundo campo. |
| `startPlaceholder` | `string` | `"Selecciona fecha"` | Placeholder del campo de inicio. |
| `endPlaceholder` | `string` | `"Selecciona fecha"` | Placeholder del campo de cierre. |
| `startError` | `string` |  | Error bajo el campo de inicio. |
| `endError` | `string` |  | Error bajo el campo de cierre. |
| `minDate` | `Date` |  | Primer día seleccionable. |
| `maxDate` | `Date` |  | Último día seleccionable. |
| `autoCloseOnStartSelect` | `boolean` | `false` | Cierra el popover tras elegir el inicio en lugar de avanzar al cierre. |
| `open` | `boolean` |  | Estado abierto controlado; combínalo con `onOpenChange`. |
| `onOpenChange` | `(open: boolean) => void` |  | Notifica aperturas y cierres del popover. |
| `disabled` | `boolean` | `false` | Desactiva ambos campos. |
| `locale` | `string` | `"es"` | Locale para el formato `Mié. 9 sep. 2026` de los campos y el calendario. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Flujo inicio → cierre:

```tsx
const [range, setRange] = React.useState({ startDate: undefined, endDate: undefined })

<DualDateRangePicker
  startDate={range.startDate}
  endDate={range.endDate}
  onChange={setRange}
  onApply={() => guardar(range)}
/>
```

Sí: Úsalo cuando inicio y cierre son campos de un formulario y cada uno puede tener su error. · Dale al menos ~560px de ancho: el popover se alinea al ancho de los dos campos. · Usa `onApply` para persistir y `onChange` solo para reflejar el estado.
No: No lo uses como filtro rápido de tabla: ahí basta DateRangePicker. · No cierres el popover desde fuera sin `open` controlado; el usuario espera confirmar con Aplicar.
Relacionados: date-range-picker, date-picker, calendar, popover

### EventCalendar (beta)

La agenda del producto en una rejilla: sesiones de formación, entrevistas de una vacante y fechas de cierre de encuestas, en vista de mes, semana o día. Los pickers eligen una fecha; este componente muestra qué pasa en ella.

```ts
import { EventCalendar } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `events` | `readonly CalendarEvent[]` |  | Los eventos a pintar: `id`, `title`, `start`, y opcionalmente `end`, `allDay`, `tone`, `location` y `meta`. |
| `view` | `"month" \| "week" \| "day"` |  | Vista controlada. Sin ella el componente lleva su propio estado. |
| `defaultView` | `"month" \| "week" \| "day"` | `"month"` | Vista inicial cuando el componente no está controlado. |
| `onViewChange` | `(view: CalendarView) => void` |  | Se dispara al usar el conmutador de la cabecera. |
| `date` | `Date` |  | Día o mes visible, controlado. |
| `defaultDate` | `Date` | `hoy` | Periodo inicial cuando el componente no está controlado. |
| `onDateChange` | `(date: Date) => void` |  | Se dispara con anterior, siguiente, «Hoy» y al navegar con el teclado fuera del mes. |
| `onEventClick` | `(event: CalendarEvent) => void` |  | Clic en un chip o bloque de evento. |
| `onSlotClick` | `(date: Date) => void` |  | Clic en un hueco libre: el día en la vista de mes, el día y la hora en semana y día. |
| `dayStart` | `number` | `7` | Primera hora visible en semana y día. |
| `dayEnd` | `number` | `20` | Última hora visible en semana y día. |
| `locale` | `Locale` | `es` | Locale de date-fns para los nombres de mes y día. |
| `now` | `Date` | `new Date()` | El «ahora» de la línea roja. Fíjalo en pruebas y documentación para que el resultado no cambie cada día. |
| `className` | `string` |  | Clases del contenedor externo (ancho, márgenes). |

Ejemplo · Agenda de formación del mes:

```tsx
const [view, setView] = React.useState<CalendarView>("month");
const [date, setDate] = React.useState(new Date(2026, 8, 15));

<EventCalendar
  events={sesiones}
  view={view}
  onViewChange={setView}
  date={date}
  onDateChange={setDate}
/>
```

Sí: Usa el tono para decir qué es cada cosa: `primary` para sesiones, `positive` para lo confirmado, `warning` y `negative` para cierres que se acercan o vencen. · Pasa `onSlotClick` cuando el usuario pueda crear algo: el hueco vacío es el sitio natural para empezar. · Recorta la franja con `dayStart` y `dayEnd` a la jornada real; catorce horas vacías no informan de nada. · Fija `now` y las fechas de ejemplo en pruebas y documentación para que el resultado no dependa del día.
No: No metas más de una línea de texto en `title`: el chip trunca y la etiqueta accesible ya lleva la hora completa. · No uses la vista de mes para agendas con decenas de eventos diarios; ahí la semana o el día leen mejor. · No dependas solo del color para distinguir tipos de evento: el título tiene que decirlo también. · No pases `end` anterior a `start`; el bloque se asume de una hora y la duración queda mal.
Relacionados: date-picker, date-range-picker, period-selector, empty-state

### MonthPicker

Selector de mes y año con una cuadrícula de doce meses y navegación por año. Devuelve `{ year, month }` con el mes indexado desde cero, listo para construir fechas nativas.

```ts
import { MonthPicker } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ year: number; month: number }` |  | Mes seleccionado; `month` va de 0 (enero) a 11 (diciembre). |
| `onChange` | `(value: { year: number; month: number }) => void` |  | Se dispara al elegir un mes. |
| `minYear` | `number` | `1900` | Primer año navegable. |
| `maxYear` | `number` | `2100` | Último año navegable. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select month"` | Texto del campo sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `className` | `string` |  | Clases extra para el contenedor y el botón. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<{ year: number; month: number }>()

<MonthPicker value={value} onChange={setValue} label="Mes de cierre" placeholder="Elige un mes" />
```

Sí: Úsalo para periodos mensuales: nóminas, cierres contables, informes. · Acota los años al rango con datos reales para evitar navegación inútil.
No: No lo uses si el usuario necesita un día concreto: usa DatePicker. · No olvides que `month` es base cero al construir un `Date`.
Relacionados: quarter-selector, date-picker, period-selector, popover

### PeriodSelector

Select de periodos predefinidos (hoy, últimos 7 días, este mes…) con etiqueta, ayuda y error. Acepta opciones propias con descripción secundaria para ciclos o cohortes de negocio.

```ts
import { PeriodSelector } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `string` |  | `value` de la opción seleccionada. |
| `onChange` | `(value: string) => void` |  | Se dispara al elegir una opción. |
| `options` | `PeriodSelectorOption[]` | `9 periodos en inglés` | Lista de `{ label, value, description? }`. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select period"` | Texto del trigger sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el select. |
| `className` | `string` |  | Clases extra para el contenedor y el trigger. |

Ejemplo · Periodos habituales:

```tsx
const PERIODOS: PeriodSelectorOption[] = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "last_7_days" },
  { label: "Últimos 30 días", value: "last_30_days" },
  { label: "Este mes", value: "this_month" },
  { label: "Rango personalizado", value: "custom" },
]
const [value, setValue] = React.useState<string>("last_30_days")

<PeriodSelector value={value} onChange={setValue} options={PERIODOS} label="Periodo" />
```

Sí: Ofrece siempre una opción `custom` que abra un DateRangePicker. · Resuelve el `value` a fechas reales en un solo lugar (un helper) para que todos los informes coincidan.
No: No mezcles periodos relativos (últimos 7 días) con fechas fijas en la misma lista sin separarlos visualmente. · No dejes las opciones por defecto en inglés en interfaces en español.
Relacionados: select, date-range-picker, date-filter-bar, quarter-selector

### QuarterSelector

Selector de trimestre y año con cuatro botones (Q1–Q4) y navegación por año. Devuelve `{ year, quarter }` y se formatea como `Q2 2026` con las utilidades de fecha.

```ts
import { QuarterSelector } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `{ year: number; quarter: 1 \| 2 \| 3 \| 4 }` |  | Trimestre seleccionado. |
| `onChange` | `(value: { year: number; quarter: 1 \| 2 \| 3 \| 4 }) => void` |  | Se dispara al elegir un trimestre. |
| `minYear` | `number` | `1900` | Primer año navegable. |
| `maxYear` | `number` | `2100` | Último año navegable. |
| `label` | `string` |  | Etiqueta visible. |
| `description` | `string` |  | Ayuda bajo el campo; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; activa el estado destructivo. |
| `placeholder` | `string` | `"Select quarter"` | Texto del campo sin valor. |
| `disabled` | `boolean` | `false` | Desactiva el campo. |
| `className` | `string` |  | Clases extra para el contenedor y el botón. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<{ year: number; quarter: 1 | 2 | 3 | 4 }>()

<QuarterSelector value={value} onChange={setValue} label="Trimestre fiscal" placeholder="Elige un trimestre" />
```

Sí: Úsalo en objetivos, OKR y reportes trimestrales. · Traduce el trimestre a fechas reales con `getQuarterFromDate` y `formatQuarter` para mantener una sola fuente de verdad.
No: No lo uses para rangos arbitrarios: usa DateRangePicker. · No dejes `minYear`/`maxYear` en sus valores por defecto (1900–2100) en pantallas de producto.
Relacionados: month-picker, period-selector, date-utils, popover

### RangeSlider

Slider de dos manejadores para acotar un rango numérico, con etiqueta, valores visibles y formateador propio. Envuelve el Slider base y reporta siempre una tupla `[min, max]`.

```ts
import { RangeSlider } from "@/components/range"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `[number, number]` | `[0, 100]` | Rango seleccionado como tupla `[inicio, fin]`. |
| `onChange` | `(value: [number, number]) => void` |  | Se dispara mientras se arrastra cualquiera de los manejadores. |
| `min` | `number` | `0` | Valor mínimo de la pista. |
| `max` | `number` | `100` | Valor máximo de la pista. |
| `step` | `number` | `1` | Incremento entre posiciones. |
| `label` | `string` |  | Etiqueta visible enlazada por `aria-labelledby`. |
| `description` | `string` |  | Ayuda bajo el slider; se oculta si hay error. |
| `error` | `string` |  | Mensaje de error; tiñe pista y manejadores de destructivo. |
| `showValue` | `boolean` | `true` | Muestra `inicio — fin` a la derecha de la etiqueta. |
| `valueFormatter` | `(value: number) => string` | `String` | Formatea cada valor mostrado. |
| `disabled` | `boolean` | `false` | Desactiva el slider. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Controlado:

```tsx
const [value, setValue] = React.useState<[number, number]>([20, 80])

<RangeSlider value={value} onChange={setValue} label="Porcentaje de avance" />
```

Sí: Úsalo para acotar filtros numéricos continuos (salario, edad, porcentaje). · Formatea con unidad o moneda para que el rango se lea sin contexto adicional. · Mantén `value` dentro de `[min, max]` al cambiar los límites desde fuera.
No: No lo uses para fechas: existen los pickers de rango. · No lo uses cuando el usuario necesita escribir un valor exacto; ofrece inputs numéricos junto al slider.
Relacionados: slider, input, date-range-picker

### Utilidades de fecha

Funciones puras sobre Date nativo e Intl.DateTimeFormat que usan todos los pickers: formateo por locale, rangos, comparación sin hora y límites de día. No dependen de ninguna librería externa.

```ts
import { formatDate, formatDateRange, isDateInRange } from "@/components/date"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isValidDate` | `(value: unknown) => value is Date` |  | Type guard: `Date` real cuyo tiempo no es NaN. |
| `formatDate` | `(date?: Date \| null, locale?: string) => string` | `locale "en-US"` | Fecha numérica corta según el locale; cadena vacía si no hay fecha. |
| `formatDateRange` | `(from?: Date \| null, to?: Date \| null, locale?: string) => string` | `locale "en-US"` | `from - to`; si falta un extremo devuelve solo el otro. |
| `isDateInRange` | `(date: Date, min?: Date, max?: Date) => boolean` |  | Comprueba límites inclusivos; los límites inválidos se ignoran. |
| `compareDates` | `(a: Date, b: Date) => -1 \| 0 \| 1` |  | Compara solo año, mes y día. |
| `startOfDay` | `(date: Date) => Date` |  | Copia a las 00:00:00.000. |
| `endOfDay` | `(date: Date) => Date` |  | Copia a las 23:59:59.999. |
| `formatMonthYear` | `(year: number, month: number, locale?: string) => string` | `locale "en-US"` | Mes largo y año; `month` es base cero. |
| `formatQuarter` | `(year: number, quarter: 1 \| 2 \| 3 \| 4, locale?: string) => string` |  | Devuelve `Q<n> <año>`; el locale se reserva para futuro. |
| `getQuarterFromDate` | `(date: Date) => 1 \| 2 \| 3 \| 4` |  | Trimestre natural de la fecha. |

Ejemplo · Formateo por locale:

```tsx
formatDate(date, "es-ES")                 // "09/09/2026"
formatDate(date, "en-US")                 // "09/09/2026" (MM/DD/YYYY)
formatDate(date, "de-DE")                 // "09.09.2026"
formatDateRange(from, to, "es-ES")        // "09/09/2026 - 23/09/2026"
formatDateRange(from, undefined)          // solo el inicio
formatDate(undefined)                     // ""
```

Sí: Formatea siempre con estas funciones para que pickers y tablas coincidan. · Pasa el mismo `locale` que usas en los pickers. · Usa `startOfDay`/`endOfDay` al construir filtros de rango para incluir el día completo.
No: No compares fechas con `===`; usa `compareDates`. · No reimplementes el formateo con `toLocaleDateString` suelto por la app.
Relacionados: date-picker, date-range-picker, month-picker, quarter-selector


## [object Object] · 6

[object Object]

### AttachmentList

Colección de archivos renderizada con FilePreview en tres layouts: lista de filas, grilla de tarjetas o chips compactos. Gestiona el estado vacío y delega la eliminación al padre por índice.

```ts
import { AttachmentList } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `files` | `Array<File \| UploadFileItem>` |  | Archivos a mostrar. Con lista vacía renderiza el estado vacío. |
| `variant` | `"list" \| "grid" \| "compact"` | `"list"` | Layout: filas, grilla de tarjetas o chips. |
| `removable` | `boolean` | `false` | Muestra el botón de quitar en cada archivo. |
| `onRemove` | `(index: number) => void` |  | Índice del archivo a quitar. |
| `emptyState` | `React.ReactNode` |  | Reemplaza el EmptyState por defecto. |
| `disabled` | `boolean` | `false` | Deshabilita todos los previews. |
| `className` | `string` |  | Clases extra para el contenedor (se añaden al layout). |

Ejemplo · Lista con eliminación:

```tsx
// Archivos de ejemplo (en producción vienen del <input type="file">)
const files = [
  new File([new Uint8Array(1240 * 1024)], "informe-trimestral.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(340 * 1024)], "portada-curso.png", { type: "image/png" }),
  new File([new Uint8Array(96 * 1024)], "nomina-marzo.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
];

const [attachments, setAttachments] = React.useState(files);

<AttachmentList
  files={attachments}
  removable
  onRemove={(index) => setAttachments((prev) => prev.filter((_, i) => i !== index))}
/>
```

Sí: Úsalo junto a UploadZone o FileUpload para mostrar lo cargado con más detalle que la lista interna. · Elige `grid` cuando importa reconocer el tipo de un vistazo; `list` cuando importa el nombre completo.
No: No lo uses para archivos remotos con miniaturas reales: ahí va ImageGrid o Gallery. · No ocultes el estado vacío con un `div` en blanco; explica qué hacer.
Relacionados: file-preview, upload-zone, file-upload, empty-state

### FilePreview

Muestra los metadatos de un archivo (nombre, tamaño y familia) con un icono por tipo. Tres variantes de densidad: tarjeta para grillas, fila para listas y chip compacto para resúmenes.

```ts
import { FilePreview } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `file` | `File \| UploadFileItem` |  | El archivo o sus metadatos. Solo se leen `name`, `size` y `type`. |
| `variant` | `"card" \| "row" \| "compact"` | `"card"` | Densidad visual: tarjeta, fila o chip. |
| `removable` | `boolean` | `false` | Muestra el botón de quitar. |
| `onRemove` | `() => void` |  | Se llama al pulsar quitar. El padre decide qué hacer. |
| `disabled` | `boolean` | `false` | Baja la opacidad y oculta el botón de quitar. |
| `error` | `string` |  | Mensaje de error por archivo; cambia el borde y el icono. |
| `className` | `string` |  | Clases extra (p. ej. un ancho fijo). |

Ejemplo · Variantes:

```tsx
<FilePreview file={file} variant="card" removable />
<FilePreview file={file} variant="row" removable />
<FilePreview file={file} variant="compact" removable />
```

Sí: Usa `row` en listas verticales y `compact` cuando el espacio es un resumen o un chip de filtro. · Muestra el `error` aquí cuando el fallo es de un archivo, no de toda la carga.
No: No lo uses para previsualizar el contenido de la imagen: para eso está MediaPreview. · No mezcles variantes dentro de la misma lista.
Relacionados: attachment-list, upload-zone, media-preview, card

### FileUpload

Selección de archivos mediante un botón y la File API nativa, sin arrastrar. Valida tipo, tamaño y cantidad antes de avisar al padre y lista lo elegido con opción de quitarlo.

```ts
import { FileUpload } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `File[]` | `[]` | Archivos seleccionados. El componente es controlado. |
| `onChange` | `(files: File[]) => void` |  | Se llama con la nueva lista tras validar o al quitar un archivo. |
| `accept` | `string` |  | Extensiones o MIME admitidos, como en el atributo nativo (`.pdf,image/*`). |
| `multiple` | `boolean` | `false` | Permite varios archivos; las selecciones se acumulan. |
| `maxFiles` | `number` |  | Cantidad máxima de archivos permitida. |
| `maxSizeMB` | `number` |  | Tamaño máximo por archivo en megabytes. |
| `disabled` | `boolean` | `false` | Desactiva el botón y oculta los botones de quitar. |
| `label` | `string` |  | Etiqueta sobre el botón. |
| `description` | `string` |  | Texto de ayuda; se oculta cuando hay error. |
| `error` | `string` |  | Error externo. Tiene prioridad sobre el de validación local. |
| `buttonLabel` | `string` | `"Choose file"` | Texto del botón de selección. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Un solo archivo:

```tsx
const [files, setFiles] = React.useState<File[]>([]);

<FileUpload
  value={files}
  onChange={setFiles}
  label="Certificado"
  buttonLabel="Elegir PDF"
  accept=".pdf"
  maxSizeMB={5}
  description="Solo PDF, hasta 5 MB."
/>
```

Sí: Úsalo en formularios densos donde una zona de arrastre ocuparía demasiado. · Define `accept` y `maxSizeMB` siempre: el mensaje de error se deriva de ellos. · Pasa `buttonLabel` en español; el valor por defecto está en inglés.
No: No lo uses para cargas masivas: ahí conviene UploadZone o ImportCsvPanel. · No dupliques la lista de archivos fuera del componente; ya la muestra.
Relacionados: upload-zone, attachment-list, button

### ImportCsvPanel

Panel completo de importación CSV que orquesta UploadZone, FilePreview, UploadProgress y una tabla de previsualización. No parsea el archivo: el padre le entrega columnas y filas ya leídas, además del estado y el progreso.

```ts
import { ImportCsvPanel } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `file` | `File \| UploadFileItem` |  | Archivo elegido. Sin él se muestra la UploadZone. |
| `onFileChange` | `(files: File[]) => void` |  | Se llama al soltar/elegir y con `[]` al quitar el archivo. |
| `previewColumns` | `CsvPreviewColumn[]` |  | Columnas `{ key, label }` de la tabla de previsualización. |
| `previewRows` | `CsvPreviewRow[]` |  | Filas ya parseadas (solo las primeras N). |
| `progress` | `number` | `0` | Progreso 0–100 para la UploadProgress interna. |
| `status` | `UploadProgressStatus` | `"idle"` | Estado de la operación; en `uploading` se oculta la tabla. |
| `error` | `string` |  | Mensaje mostrado cuando `status` es `error`. |
| `disabled` | `boolean` | `false` | Deshabilita zona y preview. |
| `maxSizeMB` | `number` | `10` | Límite de tamaño para la UploadZone interna. |
| `actions` | `React.ReactNode` |  | Botones del pie (importar, cancelar). |
| `className` | `string` |  | Clases extra para la Card. |

Ejemplo · Flujo completo:

```tsx
const csv = `nombre,correo,area
Ana Rojas,ana.rojas@empresa.com,Talento
Luis Pérez,luis.perez@empresa.com,Ventas`;
const sampleFile = new File([csv], "colaboradores.csv", { type: "text/csv" });

const [file, setFile] = React.useState<File>();
const [preview, setPreview] = React.useState<{ columns: CsvPreviewColumn[]; rows: CsvPreviewRow[] }>();
const [status, setStatus] = React.useState<UploadProgressStatus>("idle");
const [progress, setProgress] = React.useState(0);

const loadFile = async (files: File[]) => {
  const next = files[0];
  setFile(next);
  setPreview(next ? parseCsv(await next.text()) : undefined);
};

<ImportCsvPanel
  file={file}
  onFileChange={loadFile}
  previewColumns={preview?.columns}
  previewRows={preview?.rows}
  status={status}
  progress={progress}
  actions={<Button onClick={() => setStatus("uploading")}>Importar</Button>}
/>
```

Sí: Parsea en cliente solo para la previsualización; la validación definitiva va en el servidor. · Limita `previewRows` a las primeras 5–10 filas: la tabla no pagina. · Deshabilita el botón de importar mientras `status` sea `uploading` o `validating`.
No: No pases el archivo completo como filas: para miles de registros usa DataTable con paginación. · No ocultes el `error` del servidor; el usuario debe poder corregir y reintentar.
Relacionados: upload-zone, upload-progress, file-preview, table

### UploadProgress

Barra de progreso con etiqueta, descripción, porcentaje y un icono por estado (cargando, validando, éxito, error). Es totalmente controlada: no tiene temporizadores, el padre decide el valor y el estado.

```ts
import { UploadProgress } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` | `0` | Progreso de 0 a 100. |
| `status` | `"idle" \| "validating" \| "uploading" \| "success" \| "error"` | `"idle"` | Estado actual; controla icono, color y si se muestra el porcentaje. |
| `label` | `string` |  | Texto principal. También alimenta `aria-label`. |
| `description` | `string` |  | Texto secundario (nombre, tamaño, filas). |
| `error` | `string` |  | Mensaje que reemplaza la descripción cuando `status` es `error`. |
| `showValue` | `boolean` | `true` | Muestra el porcentaje a la derecha (nunca en `idle`). |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Carga simulada:

```tsx
const [value, setValue] = React.useState(0);
const [status, setStatus] = React.useState<UploadProgressStatus>("idle");

React.useEffect(() => {
  if (status !== "uploading") return;
  const timer = window.setInterval(() => {
    setValue((prev) => {
      if (prev + 4 >= 100) {
        window.clearInterval(timer);
        setStatus("validating");
        return 100;
      }
      return prev + 4;
    });
  }, 120);
  return () => window.clearInterval(timer);
}, [status]);

<UploadProgress value={value} status={status} label={STATUS_LABEL[status]} description="informe-trimestral.pdf · 1.2 MB" />
<Button onClick={() => { setValue(0); setStatus("uploading"); }}>Iniciar carga</Button>
```

Sí: Mantén el valor y el estado en el padre; el componente no adivina nada. · Pasa el `error` real del servidor: el usuario necesita saber si reintentar. · Usa `validating` para el tramo posterior a la subida (parseo, chequeos).
No: No lo uses como spinner indeterminado: si no conoces el progreso, usa Skeleton o un loader. · No cambies a `success` antes de que el servidor confirme.
Relacionados: progress, import-csv-panel, upload-zone

### UploadZone

Zona de arrastrar y soltar con la Drag & Drop API nativa y clic como alternativa. Valida tipo, tamaño y cantidad, acepta una comprobación extra síncrona y tiene una variante con la identidad de IA.

```ts
import { UploadZone } from "@/components/upload"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `File[]` | `[]` | Archivos seleccionados. El componente es controlado. |
| `onChange` | `(files: File[]) => void` |  | Nueva lista tras soltar, elegir o quitar un archivo. |
| `accept` | `string` |  | Extensiones o MIME admitidos (`.pdf,image/*`). |
| `multiple` | `boolean` | `false` | Permite varios archivos y acumula selecciones. |
| `maxFiles` | `number` |  | Cantidad máxima total, contando los ya seleccionados. |
| `maxSizeMB` | `number` |  | Tamaño máximo por archivo en megabytes. |
| `validate` | `(files: File[]) => string \| null \| undefined` |  | Comprobación síncrona extra. Devuelve un mensaje para rechazar la selección. |
| `idleText` | `string` | `"Drag and drop files here…"` | Texto en reposo. Pásalo en español. |
| `activeText` | `string` | `"Drop files here..."` | Texto mientras se arrastra encima. |
| `label` | `string` |  | Etiqueta sobre la zona. |
| `description` | `string` |  | Texto de ayuda; se oculta cuando hay error. |
| `error` | `string` |  | Error externo con prioridad sobre el local. |
| `isAI` | `boolean` | `false` | Aplica el borde y barrido con el gradiente de IA. |
| `disabled` | `boolean` | `false` | Bloquea arrastre, clic y eliminación. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Solo imágenes:

```tsx
const [files, setFiles] = React.useState<File[]>([]);

<UploadZone
  value={files}
  onChange={setFiles}
  label="Portada"
  accept="image/*"
  maxSizeMB={2}
  idleText="Arrastra la portada o haz clic"
  activeText="Suelta la imagen"
  description="PNG, JPG o WebP de hasta 2 MB."
/>
```

Sí: Úsala como carga principal de una pantalla, con espacio suficiente para arrastrar. · Traduce `idleText` y `activeText`: los valores por defecto están en inglés. · Combina `validate` con reglas de negocio (duplicados, nombres, cuotas).
No: No la pongas dentro de una fila de formulario estrecha; ahí va FileUpload. · No uses `isAI` solo por estética: reserva el gradiente para funciones asistidas.
Relacionados: file-upload, attachment-list, import-csv-panel, ai-button


## [object Object] · 12

[object Object]

### AreaChart

Preset de área sobre ChartCard para tendencias donde importa el volumen acumulado: cursos completados en el año, minutos de aprendizaje por semana. Es un LineChart con relleno al 15 % de opacidad, sin degradados; se remonta al cambiar de tema en esta docs.

```ts
import { AreaChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `AreaChartData[]` |  | Arreglo de `{ label, value }` en orden cronológico. |
| `smooth` | `boolean` | `true` | Suaviza la curva. El relleno bajo la línea se mantiene en ambos casos. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

Ejemplo · Acumulado anual:

```tsx
const completadosAcumulados = [
  { label: "Ene", value: 180 },
  { label: "Feb", value: 390 },
  { label: "Mar", value: 650 },
  { label: "Abr", value: 900 },
  { label: "May", value: 1200 },
  { label: "Jun", value: 1540 },
  { label: "Jul", value: 1870 },
  { label: "Ago", value: 2250 },
  { label: "Sep", value: 2670 },
  { label: "Oct", value: 3120 },
  { label: "Nov", value: 3600 },
  { label: "Dic", value: 4120 },
];

<AreaChart
  title="Cursos completados acumulados"
  description="Suma progresiva a lo largo del año"
  data={completadosAcumulados}
  seriesName="Completados"
  height={260}
/>
```

Sí: Úsalo para series acumulativas o de volumen (totales, minutos, ingresos). · Empieza el eje de valores en cero: el área pierde sentido si se recorta. · Mantén una sola serie; con varias, las áreas se tapan entre sí.
No: No lo uses para porcentajes o tasas que no se acumulan; ahí una línea es más honesta. · No cambies la opacidad del relleno por option: el 15 % es el estándar del sistema.
Relacionados: line-chart, sparkline-chart, chart-card, card

### BarChart

Preset de barras sobre ChartCard para comparar magnitudes entre categorías: áreas, equipos, cursos. Acepta orientación vertical u horizontal y hereda encabezado, estados y accesibilidad de la tarjeta; en esta docs se remonta al cambiar de tema para reflejar la paleta activa.

```ts
import { BarChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `BarChartData[]` |  | Arreglo de `{ label, value }`. Con un arreglo vacío el gráfico no se pinta; combínalo con `empty`. |
| `horizontal` | `boolean` | `false` | Intercambia los ejes: categorías en Y y valores en X. Útil para etiquetas largas o rankings. |
| `stacked` | `boolean` | `false` | Marca la serie con `stack: "total"`. Solo tiene efecto visible al combinar varias series vía onChartReady. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

Ejemplo · Barras verticales:

```tsx
const horasPorArea = [
  { label: "Tecnología", value: 1240 },
  { label: "Ventas", value: 980 },
  { label: "Operaciones", value: 1120 },
  { label: "Talento", value: 640 },
  { label: "Finanzas", value: 520 },
  { label: "Marketing", value: 710 },
];

<BarChart
  title="Horas de aprendizaje por área"
  description="Total acumulado en el trimestre"
  data={horasPorArea}
  seriesName="Horas"
  height={260}
/>
```

Sí: Usa barras para comparar categorías discretas; para evolución en el tiempo prefiere LineChart. · Pasa `horizontal` cuando las etiquetas superan dos palabras o hay más de seis categorías. · Ordena los datos por valor cuando el objetivo es un ranking.
No: No mezcles unidades distintas en una misma serie; el eje de valores es único. · No dependas del color para distinguir categorías: la etiqueta del eje es el identificador.
Relacionados: line-chart, donut-chart, chart-card, echart, card

### ChartCard

La Card pensada para alojar un gráfico: encabezado con eyebrow, título, descripción, acciones y un slot de filtros, y debajo un ChartShell que hereda todos los estados. Es la base de los presets BarChart, LineChart, AreaChart, DonutChart y HeatmapChart; los ejemplos se remontan al cambiar de tema en esta docs.

```ts
import { ChartCard } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título visible de la tarjeta. Obligatorio; por defecto es también el ariaLabel. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `meta` | `string` |  | Eyebrow en mayúsculas sobre el título (sección, rango de fechas). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del título. |
| `filters` | `React.ReactNode` |  | Slot bajo el encabezado para selects o segmentos. |
| `footer` | `React.ReactNode` |  | Notas al pie del gráfico. |
| `summary` | `React.ReactNode` |  | Resumen sr-only delegado a ChartShell. |
| `option` | `EChartsOption` |  | Option del gráfico. Se ignora si hay hijos. |
| `height` | `number \| string` | `300` | Alto del área del gráfico. |
| `loading` | `boolean` | `false` | Estado de carga. |
| `empty` | `boolean` | `false` | Estado vacío. |
| `error` | `string \| null` | `null` | Mensaje de error. |
| `ariaLabel` | `string` | `title` | Etiqueta accesible del region del gráfico. |
| `children` | `React.ReactNode` |  | Sustituye al EChart por contenido propio. |
| `className` | `string` |  | Clases para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se reenvía hasta el EChart. |

Ejemplo · Encabezado completo:

```tsx
<ChartCard
  meta="Adopción"
  title="Colaboradores activos por área"
  description="Usuarios con al menos una sesión en el periodo"
  option={option}
  height={240}
  actions={
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Descargar"><Download /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Más opciones"><MoreHorizontal /></Button>
    </>
  }
  filters={
    <Select defaultValue="q3">
      <SelectTrigger size="sm" className="w-[160px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="q2">Q2 2026</SelectItem>
        <SelectItem value="q3">Q3 2026</SelectItem>
        <SelectItem value="ytd">Año en curso</SelectItem>
      </SelectContent>
    </Select>
  }
  footer="Fuente: analítica de plataforma · actualizado hace 2 horas"
/>
```

Sí: Escribe títulos que digan qué se mide y en qué unidad: «Horas de aprendizaje por área». · Reserva actions para exportar o abrir el detalle; los filtros van en el slot filters. · Mantén el mismo height entre tarjetas de una misma fila del dashboard.
No: No pongas otra Card dentro como hijo: los bordes se duplican. · No uses meta para texto largo; es un eyebrow de una o dos palabras.
Relacionados: chart-shell, bar-chart, line-chart, donut-chart, card

### ChartShell

El contenedor estructural de todo gráfico: gestiona los cuatro estados (datos, cargando, vacío y error), anuncia el lienzo como region role="img" y expone un resumen solo para lectores de pantalla. Renderiza EChart por defecto o cualquier contenido que pases como hijos, y en esta docs se remonta al cambiar de tema.

```ts
import { ChartShell } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `EChartsOption` |  | Option para el EChart interno. Se ignora si hay hijos. |
| `height` | `number \| string` | `300` | Alto del área del gráfico; se aplica al region y al EChart. |
| `loading` | `boolean` | `false` | Overlay de Skeleton. |
| `empty` | `boolean` | `false` | Overlay de estado vacío. |
| `error` | `string \| null` | `null` | Mensaje de error; reemplaza el gráfico y tiene prioridad sobre loading y empty. |
| `ariaLabel` | `string` | `"Gráfico"` | Etiqueta del region role="img" y del section. |
| `summary` | `React.ReactNode` |  | Resumen sr-only con los datos del gráfico. |
| `footer` | `React.ReactNode` |  | Contenido bajo el gráfico, en texto secundario. |
| `children` | `React.ReactNode` |  | Sustituye al EChart por contenido propio. |
| `className` | `string` |  | Clases para el section raíz. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se reenvía al EChart interno. |

Ejemplo · Con resumen accesible:

```tsx
<ChartShell
  option={option}
  height={260}
  ariaLabel="Objetivos cumplidos por equipo"
  summary={
    <ul>
      {equipos.map((equipo, i) => (
        <li key={equipo}>{equipo}: {cumplidos[i]} objetivos cumplidos</li>
      ))}
    </ul>
  }
/>
```

Sí: Pasa siempre un ariaLabel descriptivo: es lo único que lee un lector de pantalla del canvas. · Aporta summary cuando los valores importan para tomar una decisión. · Usa el footer para la fuente y la fecha de corte de los datos.
No: No lo uses suelto en una pantalla: envuélvelo con ChartCard o una Card para darle título visible. · No dupliques el estado de error con un toast; el shell ya lo muestra en contexto.
Relacionados: echart, chart-card, card

### DonutChart

Preset de dona o pastel sobre ChartCard para composiciones parte-todo: estado de los objetivos, modalidad de los cursos, distribución por sede. Funciona mejor con dos a ocho categorías y usa la paleta semántica del tema; se remonta al cambiar de tema en esta docs.

```ts
import { DonutChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `DonutChartData[]` |  | Arreglo de `{ label, value }`. Cada entrada es un sector; ECharts calcula el porcentaje. |
| `variant` | `"donut" \| "pie"` | `"donut"` | Dona con radio 40–70 % o pastel completo. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

Ejemplo · Dona:

```tsx
const estadoObjetivos = [
  { label: "Cumplidos", value: 46 },
  { label: "En progreso", value: 31 },
  { label: "En riesgo", value: 12 },
  { label: "Sin iniciar", value: 11 },
];

<DonutChart
  title="Estado de los objetivos"
  description="Ciclo de desempeño Q3 2026"
  data={estadoObjetivos}
  seriesName="Objetivos"
  height={280}
/>
```

Sí: Limita la composición a ocho categorías; agrupa el resto en «Otros». · Ordena los sectores de mayor a menor para que la lectura sea inmediata. · Incluye los porcentajes en el summary o el footer: la dona no los muestra por defecto.
No: No compares dos donas entre sí para ver cambios en el tiempo; usa barras o líneas. · No lo uses cuando los valores son muy parecidos: los sectores se vuelven indistinguibles.
Relacionados: bar-chart, chart-card, echart, card

### EChart

El wrapper base de Apache ECharts: inicializa la instancia una sola vez, la redimensiona con ResizeObserver y la destruye al desmontar. Al montar resuelve el tema con getChartTheme(), que lee los tokens del <html> con getComputedStyle porque el canvas no entiende var(--token); en esta docs los ejemplos se remontan al cambiar de tema para reflejar los colores actuales.

```ts
import { EChart, getChartTheme } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `EChartsOption` |  | El objeto de configuración de ECharts. Se aplica con notMerge en cada cambio. |
| `height` | `number \| string` | `300` | Alto del contenedor en px o valor CSS. El ancho siempre es 100%. |
| `loading` | `boolean` | `false` | Overlay con Skeleton mientras se cargan los datos. |
| `empty` | `boolean` | `false` | Overlay con EmptyState cuando no hay datos. |
| `className` | `string` |  | Clases para el contenedor externo. |
| `style` | `React.CSSProperties` |  | Estilos inline del contenedor; height se sobreescribe con la prop. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Se llama tras el primer setOption con la instancia lista. |

Ejemplo · Cómo se resuelve el tema:

```tsx
import { getChartTheme } from "@/components/charts";

// Se llama al montar el gráfico. Lee <html> con getComputedStyle, así que
// el resultado depende del preset y del modo activos en ese instante.
const theme = getChartTheme();

theme.color;
// → ["#0c5bef", "#059669", "#ff7b0d", "#e9343c", "#5c646f"]
//    brand      positive   warning    negative   neutral

theme.textStyle.color;
// → "hsl(214, 19%, 23%)"  ← "214 19% 23%" de --foreground, con comas para zrender

// EChart lo pasa como tema de init:
echarts.init(el, theme);
```

Sí: Usa los presets (BarChart, LineChart…) para lo habitual y reserva EChart para options que no cubren. · Deja que el tema pinte ejes, leyenda y tooltip: no repitas colores que ya salen de los tokens. · Registra en registerECharts.ts cualquier serie o componente nuevo antes de usarlo en una option.
No: No pases var(--token) dentro de la option: el canvas no lo resuelve y se pinta negro. · No fijes el alto por CSS externo; usa la prop height para que ResizeObserver mida bien.
Relacionados: chart-shell, chart-card, bar-chart, line-chart

### HeatmapChart

Preset de mapa de calor sobre ChartCard para cruzar dos dimensiones: día por franja horaria, equipo por competencia. La escala de cinco niveles va de --color-positive a --color-negative y se resuelve de los tokens al construir la option, por lo que en esta docs se remonta al cambiar de tema.

```ts
import { HeatmapChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `xLabels` | `string[]` |  | Categorías del eje X, en orden. Cada `data[].x` debe existir aquí. |
| `yLabels` | `string[]` |  | Categorías del eje Y, en orden. Cada `data[].y` debe existir aquí. |
| `data` | `HeatmapDatum[]` |  | Arreglo de `{ x, y, value }`. Las celdas sin dato quedan vacías. |
| `min` | `number` |  | Límite inferior de la escala de color. Si falta, se toma el mínimo de los datos. |
| `max` | `number` |  | Límite superior de la escala de color. Si falta, se toma el máximo de los datos. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

Ejemplo · Actividad por día y franja:

```tsx
const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const franjas = ["06–09", "09–12", "12–15", "15–18", "18–21"];
const actividad = franjas.flatMap((franja, fila) =>
  dias.map((dia, columna) => ({ x: dia, y: franja, value: sesiones[fila][columna] }))
);

<HeatmapChart
  title="Actividad por día y franja horaria"
  description="Sesiones iniciadas, promedio de las últimas 4 semanas"
  xLabels={dias}
  yLabels={franjas}
  data={actividad}
  seriesName="Sesiones"
  height={320}
/>
```

Sí: Fija `min` y `max` cuando el mapa se compara con otro o se actualiza en el tiempo. · Dale al menos 280 px de alto: el grid reserva 100 px a cada lado para etiquetas y leyenda. · Explica en el footer qué significa cada extremo del color; verde–rojo no siempre es «bueno–malo».
No: No superes unas 12 × 12 celdas; por debajo de 24 px por celda las etiquetas se pisan. · No lo uses con una sola dimensión: para eso está BarChart.
Relacionados: bar-chart, chart-card, echart, card

### HeatmapMatrix

Matriz de calor en tabla: filas jerárquicas y desplegables contra columnas, con la primera columna fija al hacer scroll horizontal. Cada celda se pinta con la banda de la escala de favorabilidad (tokens --fav-*, definidos para claro y oscuro), y las celdas sin dato quedan fuera de escala en gris. Es una tabla semántica, no una imagen: un lector de pantalla la recorre por filas y columnas.

```ts
import { HeatmapMatrix } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `columns` | `HeatmapColumn[]` |  | Columnas de la matriz: `{ id, label }`. El `id` es la clave que se busca en `row.values`. |
| `rows` | `HeatmapRow[]` |  | Filas: `{ id, label, caption?, children?, values }`. Anidar por `children` crea la jerarquía desplegable. |
| `bands` | `HeatBand[]` | `FAVORABILITY_BANDS` | Bandas de color, ascendentes por `min`. Se cambia para escalas que no van de 0 a 100. |
| `defaultExpanded` | `string[]` | `todas` | Ids de las filas abiertas al montar. `[]` arranca todo cerrado. |
| `rowHeaderLabel` | `string` |  | Cabecera de la primera columna. Nombra qué es cada fila. |
| `formatValue` | `(value: number) => string` | `v => `${Math.round(v)} %`` | Cómo se escribe el valor dentro de la celda y en el tooltip. |
| `legend` | `boolean` | `true` | Muestra las bandas con su rango bajo la tabla. |
| `onCellClick` | `(row, column, value) => void` |  | Hace la celda accionable: pasa a ser un `<button>` enfocable. Las celdas sin dato nunca lo son. |
| `caption` | `string` |  | Resumen de la tabla para lectores de pantalla. Se renderiza como `<caption>` oculto. |

Ejemplo · Objetivos por área:

```tsx
const areas = [
  { id: "ventas", label: "Ventas" },
  { id: "marketing", label: "Marketing" },
  // …
];

const objetivos = [
  {
    id: "crecer",
    label: "Crecer en cuentas grandes",
    caption: "Objetivo de empresa",
    values: { ventas: 82, marketing: 71, producto: 64 },
    children: [
      { id: "crecer-pipeline", label: "Duplicar el pipeline enterprise",
        values: { ventas: 96, marketing: 88, producto: null } },
    ],
  },
];

<HeatmapMatrix columns={areas} rows={objetivos} rowHeaderLabel="Objetivo" />
```

Sí: Nombra la primera columna con `rowHeaderLabel`: sin ella nadie sabe qué es cada fila. · Usa `null` para lo que no aplica y reserva el 0 para lo que de verdad vale cero. · Deja la leyenda visible mientras la escala no sea obvia para quien lee. · Cierra con `defaultExpanded={[]}` cuando la matriz pase de unas 20 filas visibles.
No: No lo uses para cruzar dos dimensiones anónimas sin jerarquía: para eso está HeatmapChart, que escala mejor. · No cambies `bands` por colores de marca; la escala es semántica y se comparte con el resto del sistema. · No metas más de unas 12 columnas: a partir de ahí la primera columna fija deja de bastar para orientarse.
Relacionados: heatmap-chart, metric-card, table-shell, status-badge

### KpiCard

Tarjeta de indicador para dashboards: título, valor grande siempre en texto, delta coloreado por tendencia y un sparkline opcional como contexto visual. El valor nunca depende del canvas, así que la tarjeta es legible aunque el gráfico no cargue; el sparkline se remonta al cambiar de tema en esta docs.

```ts
import { KpiCard } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título en texto secundario. Obligatorio; es también el ariaLabel por defecto del valor. |
| `value` | `string \| number` |  | El valor principal, ya formateado (separadores, unidad, símbolo). Siempre visible como texto. |
| `delta` | `string` |  | Variación frente al periodo anterior, p. ej. «+8,5 %». Se colorea según `trend`. |
| `trend` | `"positive" \| "negative" \| "neutral"` | `"neutral"` | Color del delta (status-positive, status-negative o muted) y opacidad del sparkline. |
| `description` | `string` |  | Aclaración corta bajo el valor: contra qué se compara o qué periodo cubre. |
| `sparklineData` | `SparklineDatum[]` |  | Serie para el sparkline de 40 px con tooltip. Si falta o está vacía no se renderiza. |
| `actions` | `React.ReactNode` |  | Acciones a la derecha del título (menú, enlace). |
| `footer` | `React.ReactNode` |  | Contenido bajo una línea divisoria: fecha de corte, enlace al detalle. |
| `ariaLabel` | `string` | `title` | Etiqueta accesible del valor principal. |
| `className` | `string` |  | Clases para la Card. |

Ejemplo · Fila de indicadores:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <KpiCard title="Colaboradores activos" value="1.740" delta="+8,5 %" trend="positive" description="Frente a la semana anterior" sparklineData={activosPorSemana} />
  <KpiCard title="Horas por colaborador" value="5,1 h" delta="+0,3 h" trend="positive" description="Promedio semanal" sparklineData={horasPorSemana} />
  <KpiCard title="Rotación voluntaria" value="4,8 %" delta="+1,7 pp" trend="negative" description="Acumulado del trimestre" sparklineData={rotacionPorSemana} />
</div>
```

Sí: Formatea el valor antes de pasarlo: «1.740», «5,1 h», «72 %». La tarjeta no formatea. · Elige `trend` por lo que significa el cambio, no por su signo: una rotación que sube es negativa. · Mantén la misma altura en una fila pasando o no `sparklineData` a todas las tarjetas.
No: No pongas el dato clave solo en el sparkline; el valor en texto es la información, la línea es contexto. · No uses más de cuatro o cinco KpiCard seguidas; a partir de ahí el ojo deja de priorizar.
Relacionados: sparkline-chart, chart-card, card

### LineChart

Preset de línea sobre ChartCard para series temporales y tendencias: usuarios activos por mes, NPS por semana, avance de un indicador. Suaviza la curva por defecto y marca cada punto con un círculo pequeño; los ejemplos se remontan al cambiar de tema en esta docs.

```ts
import { LineChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `LineChartData[]` |  | Arreglo de `{ label, value }`, normalmente con etiquetas temporales ordenadas. |
| `smooth` | `boolean` | `true` | Suaviza la curva entre puntos. Desactívalo para mediciones discretas. |
| `title` | `string` |  | Título de la tarjeta. Obligatorio: también es la etiqueta accesible del gráfico. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `seriesName` | `string` | `"Value"` | Nombre de la serie; aparece en el tooltip y la leyenda. |
| `height` | `number \| string` | `300` | Alto del área del gráfico en px o como valor CSS. |
| `loading` | `boolean` | `false` | Muestra un Skeleton sobre el lienzo mientras llegan los datos. |
| `empty` | `boolean` | `false` | Muestra el estado vacío en lugar del gráfico. |
| `error` | `string \| null` | `null` | Mensaje de error; si existe, reemplaza el gráfico por el estado de error. |
| `ariaLabel` | `string` | `title` | Etiqueta del region role="img". Por defecto usa el título. |
| `summary` | `React.ReactNode` |  | Resumen solo para lectores de pantalla (p. ej. una lista con los valores). |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha del encabezado. |
| `filters` | `React.ReactNode` |  | Controles debajo del encabezado (selects de periodo, segmentos). |
| `footer` | `React.ReactNode` |  | Notas al pie: fuente, aclaraciones, fecha de corte. |
| `className` | `string` |  | Clases extra para la Card. |
| `onChartReady` | `(instance: EChartsInstance) => void` |  | Recibe la instancia de ECharts una vez inicializada y con datos. |

Ejemplo · Tendencia mensual:

```tsx
const usuariosActivos = [
  { label: "Ene", value: 1180 },
  { label: "Feb", value: 1240 },
  { label: "Mar", value: 1310 },
  { label: "Abr", value: 1290 },
  { label: "May", value: 1420 },
  { label: "Jun", value: 1510 },
  { label: "Jul", value: 1470 },
  { label: "Ago", value: 1590 },
  { label: "Sep", value: 1680 },
  { label: "Oct", value: 1740 },
  { label: "Nov", value: 1810 },
  { label: "Dic", value: 1920 },
];

<LineChart
  title="Usuarios activos mensuales"
  description="Colaboradores con al menos una sesión en el mes"
  data={usuariosActivos}
  seriesName="Usuarios activos"
  height={260}
/>
```

Sí: Usa líneas para mostrar cómo cambia un valor a lo largo del tiempo. · Mantén las etiquetas del eje X en orden cronológico y con un formato corto (Ene, Sem 1). · Describe la tendencia en el summary: es lo que un lector de pantalla necesita saber.
No: No uses una línea para categorías sin orden natural; ahí va BarChart. · No suavices datos de conteo exacto si la curva puede sugerir valores intermedios que no existen.
Relacionados: area-chart, bar-chart, sparkline-chart, chart-card, card

### MetricCard

La tarjeta de la que se hace una fila de indicadores: acento vertical del tono junto al título, icono en chip, número grande y neutro, píldora de variación al lado, pie de contexto y un gráfico pequeño —junto al número o a sangre por el borde inferior—. El color se gasta solo donde significa algo, así que cuatro tarjetas seguidas se leen tranquilas. Exporta también DeltaPill, que calcula sola su flecha y su tono con un umbral de medio punto.

```ts
import { MetricCard, DeltaPill } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Qué se mide. Corto: es el título y va truncado a una línea. |
| `value` | `React.ReactNode` |  | El valor principal. Un número se formatea en es-ES; cualquier otro nodo se pinta tal cual, así que el símbolo y la unidad los pone quien llama. Siempre visible como texto. |
| `delta` | `number` |  | La variación con signo frente al periodo anterior, en su propia unidad. Si falta, no hay píldora. |
| `deltaLabel` | `string` |  | El texto de la píldora con su unidad, p. ej. «+3,2 pp». Sin él se formatea `delta` en es-ES. |
| `deltaTone` | `"positive" \| "negative" \| "neutral"` |  | Fuerza el tono de la píldora cuando el signo miente: una rotación que sube es una mala noticia. |
| `caption` | `string` |  | Una línea apagada bajo el número: sobre qué se calcula o con qué compara. |
| `hint` | `string` |  | Qué mide exactamente. Monta un icono de información con tooltip junto al título. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral"` | `"brand"` | Tiñe el acento vertical, el chip del icono y el gráfico. Sale de `lib/tone`, así que sigue al tema. |
| `icon` | `IconName` |  | Icono del registro semántico, en un chip al final de la fila del título. |
| `chart` | `React.ReactNode` |  | Gráfico pequeño. Va envuelto en el color del tono, así que un SVG que dibuje con `currentColor` queda teñido solo; a `EChart` hay que pasarle el color en las opciones. |
| `chartPlacement` | `"side" \| "bottom"` | `"side"` | `side` lo mete junto al número; `bottom` lo corre a sangre por el borde inferior de la tarjeta. |
| `className` | `string` |  | Clases para la Card. |

Ejemplo · Pulso de tres lecturas:

```tsx
const cumplimientoPorCiclo = [
  { label: "2024-T1", value: 64 },
  { label: "2024-T2", value: 66 },
  { label: "2024-T3", value: 63 },
  { label: "2024-T4", value: 69 },
  { label: "2025-T1", value: 70 },
  { label: "2025-T2", value: 72 },
];

// El anillo y el medidor son opciones de EChart (`type: "pie"` y
// `type: "gauge"`), no presets: la tarjeta solo pide un nodo.
<div className="grid gap-4 sm:grid-cols-3">
  <MetricCard
    label="Avance promedio"
    value="72 %"
    delta={3.2}
    deltaLabel="+3,2 pp"
    caption="Sobre 8 ciclos iniciados"
    hint="Promedio del avance de las personas de cada ciclo ya iniciado."
    tone="positive"
    icon="analytics"
    chart={<MetricRing value={72} />}
  />
  <MetricCard
    label="Objetivos cumplidos"
    value="72 %"
    delta={2}
    deltaLabel="+2 pp"
    caption="Últimos 6 ciclos por fecha de cierre"
    tone="brand"
    icon="award"
    chartPlacement="bottom"
    chart={<SparklineChart data={cumplimientoPorCiclo} height={44} />}
  />
  <MetricCard
    label="Personas reportando"
    value="63 %"
    delta={-4.1}
    deltaLabel="-4,1 pp"
    caption="De 1.740 personas del ciclo"
    hint="El dial va de 0 a 100 %: riesgo bajo 50, en camino de 50 a 79 y en meta desde 80."
    tone="warning"
    icon="users"
    chart={<MetricDial value={63} />}
  />
</div>
```

Sí: Formatea el valor antes de pasarlo: «72 %», «5,1 h», «1.740». La tarjeta solo formatea si le llega un número pelado. · Elige el tono por lo que significa el dato hoy, no por lo que mide: la misma métrica pasa de positive a warning cuando baja. · Da a cada escala su gráfico: anillo para un reparto sobre el total, línea a sangre para una serie en el tiempo, medidor para un 0–100 por zonas. · Usa `deltaTone` en las métricas invertidas (rotación, incidencias, bajas) para que el verde no premie una mala noticia. · Mantén el mismo `chartPlacement` en toda una fila; mezclar `side` y `bottom` descuadra las alturas.
No: No dejes el dato clave solo en el gráfico: el número en texto es la información y el gráfico es el contexto. · No pongas un 0 donde todavía no hay medición; baja a `tone="neutral"` con una raya y quita la píldora. · No pases más de cuatro o cinco tarjetas seguidas: a partir de ahí el ojo deja de priorizar. · No tiñas el número con el tono. El color va en el acento, el chip, el gráfico y la píldora; el número se queda neutro.
Relacionados: kpi-card, sparkline-chart, donut-chart, chart-card, card

### SparklineChart

Línea ultracompacta sin ejes, leyenda ni cuadrícula, pensada para acompañar un número: dentro de un KpiCard, en una celda de tabla o al lado de un texto. Nunca es la única fuente de información y, en esta docs, se remonta al cambiar de tema para tomar el color de --color-brand.

```ts
import { SparklineChart } from "@/components/charts"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `data` | `SparklineDatum[]` |  | Arreglo de `{ label, value }`. Las etiquetas solo se ven en el tooltip. |
| `height` | `number \| string` | `32` | Alto del lienzo. El ancho siempre es el 100 % del contenedor. |
| `trend` | `"positive" \| "negative" \| "neutral"` |  | Intención semántica. Sube la opacidad del área a 0.15; el color de la línea sigue saliendo del tema. |
| `showTooltip` | `boolean` | `false` | Activa el tooltip de eje al pasar el cursor. |
| `loading` | `boolean` | `false` | Overlay con Skeleton. |
| `empty` | `boolean` | `false` | Overlay con estado vacío. A alturas pequeñas queda recortado: prefiere ocultar el sparkline. |
| `ariaLabel` | `string` | `"Sparkline chart"` | Etiqueta del region role="img". Escríbela en español y con contexto. |
| `summary` | `React.ReactNode` |  | Resumen sr-only con los valores. |
| `className` | `string` |  | Clases para el contenedor flex externo. |

Ejemplo · Junto a un valor:

```tsx
<div className="flex items-center gap-6">
  <div>
    <p className="text-xs text-muted-foreground">Sesiones · últimos 30 días</p>
    <p className="text-2xl font-bold tabular-nums">152 <span className="text-sm font-medium text-status-positive">+18 %</span></p>
  </div>
  <div className="w-40">
    <SparklineChart data={sesiones} height={32} trend="positive" ariaLabel="Sesiones diarias" />
  </div>
</div>
```

Sí: Acompáñalo siempre de un número o etiqueta visible: la línea sola no informa. · Dale un contenedor con ancho definido (una celda, un `w-40`); si no, no hay nada que medir. · Usa entre 8 y 60 puntos; con menos parece un garabato y con más el detalle se pierde.
No: No pongas `empty` a 24 px de alto: el EmptyState no cabe. Oculta el componente en su lugar. · No lo uses como gráfico principal de una tarjeta; para eso está LineChart.
Relacionados: kpi-card, line-chart, area-chart, echart


## [object Object] · 10

[object Object]

### AiAgentDrawer

El panel lateral del Agente IA. Se porta al ancla que AdminShell reserva junto a la columna de contenido (ShellAgentPanelSlot), así abrirlo estrecha la pantalla en vez de taparla; el contexto define título, placeholder y sugerencias, o se entrega un panel a medida.

```ts
import { AiAgentDrawer } from "@/components/ai/AiAgentDrawer"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open` | `boolean` |  | Si el panel está abierto. Cerrado colapsa a 0px pero sigue montado. |
| `onOpenChange` | `(open: boolean) => void` |  | Se llama con `false` desde el botón de cerrar. |
| `context` | `"dashboard" \| "builder" \| "results" \| "demographics" \| "custom"` | `"dashboard"` | Define título, placeholder y sugerencias. `custom` desactiva la conversación genérica. |
| `customPanel` | `React.ReactNode` |  | UI a medida que reemplaza la conversación. Solo se usa con `context="custom"`. |

Ejemplo · Cómo funciona el ancla:

```tsx
const [open, setOpen] = React.useState(false);
const [host, setHost] = React.useState<HTMLDivElement | null>(null);

<div className="flex h-[480px] gap-2 overflow-hidden p-2">
  <ShellAgentPanelSlotProvider value={host}>
    <div className="flex min-w-0 flex-1 flex-col">
      <Button onClick={() => setOpen((v) => !v)}>Abrir Agente IA</Button>
      {/* contenido de la pantalla */}
    </div>
    <AiAgentDrawer open={open} onOpenChange={setOpen} context="results" />
  </ShellAgentPanelSlotProvider>
  {/* el ancla: hermano flex de la columna */}
  <div ref={setHost} className="relative flex h-full shrink-0" />
</div>
```

Sí: Renderízalo dentro de AdminShell (o provee el ancla como en el ejemplo) para que estreche la columna en vez de taparla. · Usa `agentPanelShift` en los Sheets que convivan con el panel abierto. · Elige el `context` de la pantalla para que las sugerencias tengan sentido.
No: No lo montes como overlay fijo: perdería el gesto de «hacer sitio» que comparte con el cajón. · No reutilices el degradado ni el fondo `ai-mesh-agent` en paneles que no son de IA. · No animes con clases `duration-*`: las transiciones van en línea para que ganen a las del Sheet.
Relacionados: sheet, ai-panel, admin-shell

### AiAnalyzingState

La forma única en que la IA dice «dame un momento» en toda la plataforma. Un panel con la chispa latiendo, barra de progreso opcional y un titular que entra con fundido cada vez que cambia; la versión inline reduce lo mismo a una línea.

```ts
import { AiAnalyzingState } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Titular. Cada cambio de valor entra con un fundido (framer-motion, `AnimatePresence`). |
| `progress` | `number` |  | 0–100. Si se omite, la barra no se muestra y la espera se lee como indeterminada. |
| `detail` | `string` |  | Línea sobre la barra, a la izquierda: qué se está produciendo. Solo en `panel`. |
| `caption` | `string` |  | Frase bajo la barra: qué está pasando en una línea. Solo en `panel`. |
| `variant` | `"panel" \| "inline"` | `"panel"` | `panel` es el bloque grande (300px mínimo); `inline` reduce la chispa y el título a una línea. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Secuencia de pasos:

```tsx
const STEPS = ["Leyendo el archivo", "Detectando columnas", "Validando correos", "Preparando la importación"];
const [progress, setProgress] = React.useState(0);
const step = STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))];

<AiAnalyzingState
  title={progress >= 100 ? "Importación lista" : step}
  detail="participantes.xlsx"
  progress={progress}
  caption="La IA revisa el archivo antes de crear los participantes."
/>
```

Sí: Cambia `title` conforme avanza el proceso: es lo que convierte la espera en una secuencia. · Usa `panel` cuando la espera ocupa la pantalla y `inline` cuando ocupa un hueco. · Pasa `progress` solo si conoces el avance real.
No: No crees otra versión del mismo momento: es la única forma en que la IA pide tiempo en el producto. · No lo uses para cargas normales de datos; el degradado de IA es exclusivo de superficies de IA. · No animes el porcentaje con saltos ficticios.
Relacionados: ai-loader, ai-spark-glyph, empty-state

### AIButton

El botón que dispara una acción de IA. Envuelve a Button con forma de píldora, la chispa como icono por defecto, el degradado de IA en la variante primaria y un estado de carga con texto propio.

```ts
import { AIButton } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto del botón. Alternativamente se puede pasar como `children`. |
| `variant` | `"primary" \| "secondary" \| "subtle" \| "outline"` | `"primary"` | Intención visual. `primary` rellena con el degradado de IA; `secondary` y `outline` bordean con él. |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Altura de 28, 32, 40 o 48px. |
| `loading` | `boolean` | `false` | Muestra el spinner, desactiva el botón y marca `aria-busy`. |
| `disabled` | `boolean` | `false` | Desactiva el botón. |
| `leftIcon` | `IconName` | `"sparkles"` | Icono a la izquierda del texto. |
| `rightIcon` | `IconName` |  | Icono a la derecha del texto. |
| `helperText` | `string` |  | Línea pequeña en cursiva bajo el botón para explicar qué hará la IA. |
| `onClick` | `() => void` |  | Callback al pulsar. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Tipo nativo del botón. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Variantes:

```tsx
<AIButton label="Generar" />
<AIButton label="Generar" variant="secondary" />
<AIButton label="Generar" variant="subtle" />
<AIButton label="Generar" variant="outline" />
```

Sí: Úsalo solo para acciones que invocan a la IA: generar, resumir, sugerir. · Añade `helperText` cuando el usuario necesite saber qué datos usará la IA. · Refleja el proceso con `loading` en vez de deshabilitar sin explicación.
No: No lo uses para acciones normales: el degradado de IA está reservado para superficies de IA. · No pongas más de un AIButton primario por vista. · No cambies el texto durante `loading` a algo que no describa lo que pasa.
Relacionados: button, ai-loader, chip

### AiGeneratedBadge

Marca de procedencia: este contenido lo escribió la IA. Es solo la chispa con el degradado de IA y un tooltip que guarda la palabra; no es un estado ni una acción, y por eso no se puede pulsar ni cambia al editar.

```ts
import { AiGeneratedBadge } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Clases extra para el contenedor inline. El icono mide 14px por defecto. |

Ejemplo · En la línea del rótulo:

```tsx
<div className="flex items-center gap-1.5">
  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Objetivo 1</span>
  <AiGeneratedBadge />
</div>
<p className="text-sm">Aumentar la retención del equipo comercial un 10% este semestre.</p>
```

Sí: Colócala junto al rótulo de la pieza, no junto al título. · Úsala en todo contenido que redactó la IA y el usuario aún puede revisar. · Deja que el tooltip diga la palabra: la chispa sola ya es la marca.
No: No la conviertas en botón ni la uses como estado de carga. · No la retires cuando el usuario edita el texto: sigue indicando su origen. · No la uses en contenido escrito por personas: el degradado de IA marca procedencia.
Relacionados: ai-spark-glyph, badge, tooltip

### AIInsightCard

Tarjeta para un hallazgo de la IA: tipo (insight, riesgo, recomendación u oportunidad), nivel de confianza, evidencia e impacto en dos columnas y una acción opcional al pie. Es la unidad que AIPanel agrupa.

```ts
import { AIInsightCard } from "@/components/ai"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Titular del hallazgo. Obligatorio. |
| `description` | `string` |  | Explicación breve bajo el título. |
| `type` | `"insight" \| "risk" \| "recommendation" \| "opportunity"` | `"insight"` | Naturaleza del hallazgo; define icono, etiqueta y color. |
| `confidence` | `"low" \| "medium" \| "high"` | `"high"` | Nivel de confianza mostrado como badge en la esquina. |
| `evidence` | `string` |  | Dato que sustenta el hallazgo. |
| `impact` | `string` |  | Consecuencia esperada. |
| `actionLabel` | `string` |  | Texto del botón al pie. Sin él no hay pie. |
| `onAction` | `() => void` |  | Callback de la acción del pie. |
| `className` | `string` |  | Clases extra para la Card. |

Ejemplo · Tipos:

```tsx
<AIInsightCard type="insight" title="El eNPS mejora en equipos con líder nuevo" confidence="high" />
<AIInsightCard type="risk" title="Riesgo de burnout en Soporte" confidence="medium" />
<AIInsightCard type="recommendation" title="Reforzar el onboarding de Producto" confidence="medium" />
<AIInsightCard type="opportunity" title="Talento interno listo para promoción" confidence="low" />
```

Sí: Muestra siempre la confianza: el usuario decide cuánto fiarse. · Rellena evidencia e impacto cuando existan; es lo que hace accionable el hallazgo. · Usa `risk` solo para lo que requiere atención, no para cualquier dato negativo.
No: No mezcles varios hallazgos en una tarjeta; una tarjeta, un insight. · No uses la tarjeta para contenido que no generó la IA: la identidad de IA marca procedencia.
Relacionados: ai-panel, card, badge

### AILoader

Estado de espera mientras la IA trabaja, en tres formas: una línea con spinner, un bloque con esqueleto o una tarjeta con progreso. Cada estado trae su texto por defecto en español y anuncia con `aria-live`.

```ts
import { AILoader } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"inline" \| "block" \| "card"` | `"block"` | Forma del loader. |
| `status` | `"thinking" \| "generating" \| "analyzing" \| "complete" \| "error"` | `"thinking"` | Fase del proceso; define el texto por defecto y, en `card`, si se muestra el spinner. |
| `label` | `string` |  | Texto que reemplaza al del estado. |
| `description` | `string` |  | Segunda línea bajo el título. Solo en `card`. |
| `progress` | `number` |  | 0–100. Solo en `card`: cambia el esqueleto por una barra de progreso. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Variantes:

```tsx
<AILoader variant="inline" />
<AILoader />
<AILoader variant="card" status="generating" description="Redactando el resumen ejecutivo" />
```

Sí: Elige la variante según el hueco que ocupa el resultado: línea, párrafo o tarjeta. · Pasa `progress` cuando conozcas el avance real; si no, deja el esqueleto. · Cambia `status` a `complete` o `error` al terminar en vez de desmontar de golpe.
No: No lo uses para cargas que no vienen de la IA: el degradado está reservado para superficies de IA. · No inventes porcentajes: una barra que salta de 10 a 100 pierde credibilidad.
Relacionados: ai-analyzing-state, ai-button, skeleton

### AIPanel

Contenedor de insights de IA: una Card con la chispa en el título, acciones en la cabecera, pie opcional y estados de carga y vacío ya resueltos. Sus hijos suelen ser AIInsightCard apilados en una columna.

```ts
import { AIPanel } from "@/components/ai"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` | `"Insights de IA"` | Título junto a la chispa. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `children` | `React.ReactNode` |  | Contenido, normalmente AIInsightCard. Se apila en una columna con gap. |
| `actions` | `React.ReactNode` |  | Botones a la derecha de la cabecera. |
| `footer` | `React.ReactNode` |  | Pie separado por una línea. |
| `loading` | `boolean` | `false` | Reemplaza el contenido por un spinner con texto. |
| `empty` | `boolean` | `false` | Reemplaza el contenido por el estado vacío. |
| `emptyState` | `React.ReactNode` |  | Estado vacío a medida; por defecto usa EmptyState. |
| `className` | `string` |  | Clases extra para la Card. |

Ejemplo · Con acciones y regeneración:

```tsx
const [loading, setLoading] = React.useState(false);

<AIPanel
  title="Insights del trimestre"
  description="Basada en 1.240 respuestas"
  loading={loading}
  actions={<Button variant="outline" size="sm" onClick={() => setLoading(true)}><RefreshCw /> Regenerar</Button>}
  footer={<p className="text-xs text-text-muted">La IA puede cometer errores; verifica antes de actuar.</p>}
>
  <AIInsightCard type="insight" title="El eNPS sube 6 puntos en equipos híbridos" evidence="+6 vs Q2" impact="Retención" />
  <AIInsightCard type="risk" title="Soporte reporta carga alta tres meses seguidos" confidence="medium" />
</AIPanel>
```

Sí: Agrupa aquí todo lo que generó la IA en la vista, en vez de dispersar tarjetas. · Ofrece una acción de regenerar cuando el usuario pueda cambiar la entrada. · Deja el aviso de verificación en el `footer`.
No: No lo uses como contenedor genérico: la identidad de IA marca procedencia del contenido. · No mezcles `loading` y `empty` a la vez; `loading` gana y el estado vacío no se ve.
Relacionados: ai-insight-card, card, empty-state

### AiSparkGlyph

La chispa de la IA: el destello grande con dos satélites que laten a destiempo. Vive suelta porque es la misma marca a 42px en el panel de análisis y a 18px en una tarjeta que se rehace; el latido escalonado es lo que la hace leerse como trabajo en curso.

```ts
import { AiSparkGlyph } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `number` | `42` | Lado del glifo en píxeles. |
| `className` | `string` |  | Clases extra para el <svg>. Es `aria-hidden`: acompáñalo de texto. |

Ejemplo · Tamaños:

```tsx
<AiSparkGlyph size={18} />
<AiSparkGlyph size={24} />
<AiSparkGlyph />
<AiSparkGlyph size={64} />
```

Sí: Úsala como marca de «la IA está trabajando» junto a un texto que lo diga. · Prefiere AiAnalyzingState o AiGeneratedBadge; usa el glifo suelto solo para composiciones nuevas de IA.
No: No la uses como icono decorativo en superficies que no son de IA: el degradado está reservado. · No dupliques el SVG en otro componente; importa este para que el dibujo no se separe.
Relacionados: ai-analyzing-state, ai-generated-badge, thema-icon

### Chip

Pastilla compacta para filtros, etiquetas y sugerencias. Ocho tonos semánticos (incluido el degradado de IA), dos tamaños, contador opcional y modo seleccionable o removible.

```ts
import { Chip } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto del chip. Obligatorio. |
| `tone` | `"default" \| "muted" \| "primary" \| "positive" \| "negative" \| "warning" \| "info" \| "ai"` | `"default"` | Color semántico. `ai` aplica el borde y el texto con degradado de IA. |
| `size` | `"sm" \| "md"` | `"md"` | Altura de 24px o 32px. |
| `selected` | `boolean` | `false` | Estado activo; cambia el relleno en los tonos default, primary y positive. |
| `removable` | `boolean` | `false` | Muestra el botón de cierre que dispara `onRemove`. |
| `icon` | `IconName` |  | Icono del registro Thema a la izquierda del texto. |
| `count` | `number` |  | Contador pequeño a la derecha del texto. |
| `disabled` | `boolean` | `false` | Desactiva el chip y baja la opacidad. |
| `onClick` | `() => void` |  | Si se pasa, el chip se renderiza como <button> con `aria-pressed`. |
| `onRemove` | `() => void` |  | Callback del botón de cierre. |
| `variant` | `"solid" \| "outline" \| "ghost"` |  | Reservado en los tipos; hoy no altera el estilo. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Tonos:

```tsx
<Chip label="Default" />
<Chip label="Muted" tone="muted" />
<Chip label="Primary" tone="primary" />
<Chip label="Positivo" tone="positive" />
<Chip label="Negativo" tone="negative" />
<Chip label="Alerta" tone="warning" />
<Chip label="Info" tone="info" />
<Chip label="Sugerido por IA" tone="ai" icon="sparkles" />
```

Sí: Usa `selected` + `onClick` para filtros de selección múltiple. · Reserva el tono `ai` para sugerencias o etiquetas generadas por la IA. · Mantén las etiquetas cortas: el texto se trunca, no salta de línea.
No: No uses chips como acciones primarias; para eso está Button. · No mezcles `removable` con `onClick` en el mismo grupo sin necesidad: confunde el gesto. · No uses el degradado de IA en chips que no vienen de la IA.
Relacionados: badge, ai-button, toggle-group

### SaveIndicator

Indicador discreto del estado de autoguardado: en la nube, guardando, guardado, error o sin conexión. Icono y color cambian por estado, y con `timestamp` muestra la hora del último guardado.

```ts
import { SaveIndicator } from "@/components/ai-interaction"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `status` | `"idle" \| "saving" \| "saved" \| "error" \| "offline"` |  | Estado actual. Obligatorio. |
| `label` | `string` |  | Texto que reemplaza al del estado. |
| `timestamp` | `string` |  | Hora del último guardado; solo se muestra con `status="saved"`. |
| `compact` | `boolean` | `false` | Oculta el texto y deja solo el icono. |
| `className` | `string` |  | Clases extra para el contenedor. |

Ejemplo · Estados:

```tsx
<SaveIndicator status="idle" />
<SaveIndicator status="saving" />
<SaveIndicator status="saved" timestamp="10:42" />
<SaveIndicator status="error" />
<SaveIndicator status="offline" />
```

Sí: Colócalo cerca de lo que se guarda: en la cabecera del formulario o del editor. · Pasa `timestamp` ya formateado en el idioma del usuario. · Mantén el estado `saved` visible; no lo escondas al segundo.
No: No lo uses como confirmación de acciones explícitas (para eso está el toast). · No muestres `error` sin ofrecer una vía de reintento cerca.
Relacionados: badge, toast, input


## [object Object] · 10

[object Object]

### ActionFab

La barra de acciones cuando no hay sitio para una barra: un solo botón en la esquina que, al tocarlo, despliega hacia arriba todo lo que se puede hacer, con la acción principal la primera y destacada. Cerrado enseña el icono de esa acción principal —o el recuento, si hay algo marcado—, y abierto se convierte en la ✕ que lo cierra. No hace falta montarlo a mano: DataListActionRail lo pone solo por debajo de 1024px.

```ts
import { ActionFab } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `RailActionSpec[]` |  | Las mismas que recibe la barra, con su `scope`. Si ninguna aplica, el botón no se pinta: un botón que no ofrece nada estorba. |
| `selectedCount` | `number` |  | Cuántos registros hay marcados. Decide el reparto y, cerrado, lo que enseña el botón. |
| `onClearSelection` | `() => void` |  | Soltar la selección, que aparece como primera entrada del abanico cuando hay algo marcado. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «soltar 3 seleccionadas» frente a «3 seleccionados». |
| `className` | `string` |  | Clases del contenedor anclado. |

Ejemplo · Lo mismo que la barra, en otra forma:

```tsx
<ActionFab actions={acciones} selectedCount={selected.size} onClearSelection={clear} />
```

Sí: Déjalo dentro del ancla del rail del shell: se posiciona solo abajo a la derecha, sobre el contenido. · Cuida que las etiquetas sean cortas: aquí se leen enteras junto al icono, no en un tooltip. · Deja la acción principal marcada con `primary`: es la que da cara al botón cerrado.
No: No lo montes a la vez que la barra: `DataListActionRail` ya elige uno u otro según el ancho. · No le cuelgues diez acciones: un abanico largo tapa la pantalla y obliga a estirar el pulgar.
Relacionados: data-list-action-rail, action-rail-shell, rail-button

### ActionRailShell

La barra de acciones flotante que comparten todas las pantallas: una sola pastilla que se abre, se recoge, se arrastra y recuerda su orientación. Recibe dos slots —acciones contextuales de la selección y acciones persistentes de la pantalla— y pone por su cuenta el asa, el menú de ajustes y las divisorias.

```ts
import { ActionRailShell, RailDivider, RailGroupShimmer, useContextChangeKey } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `persistent` | `React.ReactNode` |  | Acciones que la pantalla ofrece siempre. Van al final de la barra. |
| `contextual` | `React.ReactNode` | `null` | Acciones que dependen de la selección actual. Con `null` el grupo y su divisoria desaparecen del todo. |
| `keepOpen` | `boolean` | `false` | Mantiene la barra abierta aunque la preferencia sea auto-ocultar. Enciéndelo mientras exista una selección. |
| `isBlocked` | `boolean` | `false` | Recoge la barra a su pastilla y la deja inerte; para cuando un panel modal ocupa la pantalla. |
| `RailDivider` | `() => JSX.Element` |  | Regla fina entre grupos; lee la orientación del contexto del shell. |
| `RailGroupShimmer` | `{ animKey: number }` |  | Brillo que recorre la barra cuando cambia el grupo contextual. Necesita un ancestro `relative`. |
| `useContextChangeKey` | `(context: string) => number` |  | Devuelve una clave que sube cada vez que `context` cambia; alimenta `animKey`. |

Ejemplo · Barra completa con selección:

```tsx
const animKey = useContextChangeKey(hasSelection ? "selection" : "none");
const popoutSide = useRailPopoutSide();

<ActionRailShell
  keepOpen={hasSelection}
  contextual={
    hasSelection ? (
      <>
        <RailGroupShimmer animKey={animKey} />
        <AnimatedActionItem animKey={animKey} staggerIndex={0} skipColorFlash>
          <RailSelectionChip count={selected.length} onClear={clear} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={1}>
          <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={2}>
          <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
        </AnimatedActionItem>
      </>
    ) : null
  }
  persistent={
    <>
      <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
      <RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />
      <Popover>
        <PopoverTrigger asChild>
          <RailPrimaryAction icon={<Plus />} label="Crear encuesta" />
        </PopoverTrigger>
        <PopoverContent side={popoutSide} align="end" className="w-72 bg-surface-nav p-2">
          <RailCreateOption icon={<FileText />} title="Desde cero" description="Una encuesta en blanco." onClick={createBlank} />
          <RailCreateOption icon={<Sparkles />} title="Con IA" description="La IA propone las preguntas." onClick={createWithAi} />
        </PopoverContent>
      </Popover>
    </>
  }
/>
```

Sí: Monta un solo shell por pantalla y cambia solo su contenido; para el lector es la misma barra en todas partes. · Pasa `keepOpen` mientras haya selección: una acción que necesita filas marcadas no puede desaparecer al mover el cursor. · Deriva `contextual` a `null` cuando no hay nada marcado; no dejes botones apagados colgando.
No: No pongas ajustes de la barra (orientación, auto-ocultar) entre las acciones: ya viven en RailSettingsMenu. · No reimplementes la pastilla, el asa o la divisoria en una pantalla; extiende el shell. · No la renderices dentro de un contenedor que hace scroll: usa el anclaje `ShellRailSlot` del AdminShell.
Relacionados: rail-button, rail-selection-chip, rail-settings-menu, rail-drag-handle, admin-shell

### ConfirmActionPopover

El sí/no de una acción de la barra, anclado al botón que lo pide en vez de un diálogo centrado con velo. RailConfirmButton lo empaqueta con un botón de la barra que lleva tooltip y popover sobre el mismo elemento, y railButtonClass da las clases de un botón con rótulo para disparadores propios.

```ts
import { ConfirmActionPopover, RailConfirmButton, railButtonClass } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado del popover. Cierra tú mismo en `onConfirm`. |
| `trigger` | `React.ReactNode` |  | Solo en ConfirmActionPopover: un único elemento del DOM que recibe las props del trigger vía `asChild`. |
| `title / description` | `string` |  | La pregunta y su consecuencia, en una línea cada una. |
| `confirmLabel` | `string` |  | Texto del botón que confirma; el de cancelar siempre dice «Cancelar». |
| `tone (ConfirmActionPopover) / confirmTone (RailConfirmButton)` | `"destructive" \| "warning" \| "primary"` |  | Color del botón de confirmar según la gravedad de la acción. |
| `onConfirm` | `() => void` |  | Se ejecuta al confirmar. |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `useRailPopoutSide()` | Solo en ConfirmActionPopover: hacia dónde abre; por defecto, lejos de la barra. |
| `tooltip` | `React.ReactNode` |  | Solo en ConfirmActionPopover: rótulo al pasar por encima cuando el disparador es un icono desnudo. |
| `icon / label / tone / blockedReason` | `RailButton props` |  | Solo en RailConfirmButton: el botón de la barra que dispara la pregunta. `tone` colorea el botón, no la confirmación. |
| `railButtonClass(variant, iconOnly)` | `("ghost" \| "primary" \| "warning" \| "danger", boolean) => string` |  | Las clases del botón con rótulo de un drawer, para un `<button>` crudo que hace de trigger. |

Ejemplo · Confirmar sobre la selección:

```tsx
<RailConfirmButton
  icon={<Trash2 />}
  label="Eliminar"
  tone="danger"
  blockedReason={count === 0 ? "Marca al menos una encuesta" : null}
  open={open}
  onOpenChange={setOpen}
  title={`¿Eliminar ${count} encuestas?`}
  description="Se borran sus respuestas y no se pueden recuperar."
  confirmLabel="Eliminar"
  confirmTone="destructive"
  onConfirm={() => { removeSelected(); setOpen(false); }}
/>
```

Sí: Pregunta solo cuando la acción es irreversible o afecta a varias filas; para el resto, actúa y ofrece deshacer. · Pon el número de filas en el título: «¿Eliminar 3 encuestas?» dice más que «¿Estás seguro?». · Cierra el popover en `onConfirm`; el componente no lo cierra por ti.
No: No envuelvas el `trigger` en un Tooltip propio: usa la prop `tooltip`, o el popover nunca abrirá. · No uses `confirmTone="primary"` para borrar: el color anuncia la gravedad. · No abras un ConfirmDialog centrado desde la barra; la decisión es sobre lo que ya está marcado y no necesita tapar la tabla.
Relacionados: rail-button, action-rail-shell, drawer-action-rail, confirm-dialog

### DataListActionRail

La barra flotante de una pantalla con lista, ya cableada: concentra todo lo que se puede hacer y cambia de contenido según lo marcado. Por debajo de 1024px se vuelve un solo botón flotante que despliega las mismas acciones hacia arriba, con la principal destacada —el reparto lo decide el mismo código, así que girar el teléfono no cambia lo que se puede hacer. Sin selección muestra las acciones de la pantalla y su primaria; con un registro esas desaparecen —no se apilan— y entran el recuento y lo que se puede hacer con él; con varios se caen las individuales y el recuento pasa a la etiqueta. Quien la usa declara las acciones y su ámbito; los modos, el escalonado de entrada y el plegado los resuelve la barra.

```ts
import { DataListActionRail } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `—` | `responsive` |  | No hay nada que configurar: por debajo de 1024px —el mismo corte que vuelve el sidebar un cajón— la barra se sustituye sola por `ActionFab`, el botón flotante. Se puede montar `ActionFab` a mano donde no haya barra. |
| `actions` | `RailActionSpec[]` |  | Lo que se puede hacer, declarado una vez. Cada una dice su `scope`, y la barra elige cuáles enseña. |
| `RailActionSpec.scope` | `("screen" \| "single" \| "bulk")[]` |  | `screen` sin selección; `single` solo con un registro; `bulk` con varios. Duplicar suele ser `["single", "bulk"]`. |
| `RailActionSpec.primary` | `boolean` |  | La acción rellena que cierra la fila. Solo una, y solo con `scope: ["screen"]`. |
| `RailActionSpec.overflow` | `boolean` |  | La pliega en el menú «más acciones» en vez de darle sitio en la barra. Es para lo que se configura una vez —un alta de catálogo, una regla—: sigue estando, pero no compite con lo que se hace a diario. El plegado por `inlineLimit` es otra cosa: aquel es por sitio, este es por peso. |
| `RailActionSpec.tone` | `"default" \| "danger"` | `"default"` | `danger` tiñe la acción destructiva. |
| `RailActionSpec.countInLabel` | `boolean` |  | Añade el recuento a la etiqueta con varios marcados: «Duplicar (3)». |
| `RailActionSpec.blockedReason` | `string \| null` |  | Por qué no se puede ahora. La deja a la vista y apagada, con el motivo: explicar vale más que esconder. |
| `selectedCount` | `number` |  | Cuántos registros hay marcados. Es lo único que decide el modo. |
| `onClearSelection` | `() => void` |  | La ✕ del recuento: suelta las marcas sin tocar las filas. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados». |
| `inlineLimit` | `number` | `5` | Cuántas caben antes de plegarse al menú «más». |
| `locked` | `boolean` | `false` | Una decisión inmersiva se adueñó de una fila: la barra se desmonta en vez de ofrecer algo que no viene a cuento. |
| `isBlocked` | `boolean` | `false` | Un panel modal tomó la pantalla: la barra se recoge a su pastilla y deja de responder. Vuelve sola al cerrarlo. |

Ejemplo · Los tres modos:

```tsx
<DataListActionRail
  actions={ACCIONES}
  selectedCount={selected.size}
  onClearSelection={clear}
/>
```

Sí: Deja que la selección *sustituya* las acciones de la pantalla; apilarlas obliga a leer dos grupos para encontrar uno. · Marca como `single` lo que de verdad solo vale para un registro: abrirlo, renombrarlo, ver su detalle. · Usa `countInLabel` en lo que actúa sobre todo lo marcado, para que se lea a cuántos va a afectar antes de pulsar. · Si la barra manda, deja la cabecera de la pantalla sin botones: tenerlos en los dos sitios es tenerlos duplicados. · Marca con `overflow` lo que se configura una vez y se olvida: así la barra enseña de un vistazo lo que de verdad se hace a diario. · Prueba la pantalla estrecha: ahí las acciones pasan al botón flotante y las etiquetas se leen enteras, así que una etiqueta larga se nota antes que en la barra.
No: No pongas más de una acción `primary`: la fila se cierra con una sola y dos compiten. · No escondas una acción que no se puede usar ahora; dale `blockedReason` y explica por qué. · No la montes en una pantalla sin selección ni acciones propias: ahí la barra es un marco vacío. · No pliegues con `overflow` una sola acción: un menú de un ítem cuesta más de abrir que el icono que sustituye.
Relacionados: action-rail-shell, rail-button, rail-selection-chip, rail-overflow-menu, data-list-block

### DrawerActionRail

La barra flotante de un drawer de pasos: el pie que crecía con cada herramienta se convierte en el mismo dock que usa la pantalla de fondo, con pista del paso, herramientas puntuales y las acciones que lo cierran. Comparte asa, ajustes y preferencia de auto-ocultar con ActionRailShell, y DrawerRailButton es su botón con rótulo.

```ts
import { DrawerActionRail, DrawerRailButton } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `actions` | `React.ReactNode` |  | Lo que cierra el paso: continuar, guardar. `null` cuando depende de una selección vacía; el grupo desaparece entero. |
| `hint` | `React.ReactNode` |  | Dónde está el paso, en una línea. Se trunca a 34 caracteres. |
| `tools` | `React.ReactNode` |  | Acciones puntuales del paso: cuadrar pesos, resolver un conflicto. |
| `keepOpen` | `boolean` | `false` | Mantiene la barra abierta pese a la preferencia de auto-ocultar; para avisos que solo se resuelven desde aquí. |
| `isBlocked` | `boolean` | `false` | Recoge y bloquea la barra: no hay nada seguro que hacer todavía. |
| `minimal` | `boolean` | `false` | Deja solo `actions`: sin asa, ajustes, pista ni herramientas. |
| `DrawerRailButton.icon` | `React.ComponentType<{ className?; strokeWidth? }>` |  | El componente de icono (no el elemento); se pinta a 16px. |
| `DrawerRailButton.label / onClick / disabled` | `string / () => void / boolean` |  | Rótulo (también `aria-label`), acción y estado. |
| `DrawerRailButton.variant` | `"ghost" \| "primary" \| "warning" \| "danger"` | `"ghost"` | Intención del botón; una sola `primary` por barra. |
| `DrawerRailButton.iconOnly` | `boolean` | `false` | Cuadrado de 36px con el rótulo en tooltip. |

Ejemplo · Un paso con pista, herramientas y acciones:

```tsx
<DrawerActionRail
  hint={isBalanced ? "Los pesos suman 100 %" : "Los pesos suman 95 %: cuadra antes de continuar"}
  tools={
    <>
      <DrawerRailButton icon={Scale} label="Cuadrar pesos" iconOnly onClick={balance} />
      <DrawerRailButton icon={Wand2} label="Sugerir con IA" iconOnly onClick={suggest} />
    </>
  }
  actions={
    <>
      <DrawerRailButton icon={ArrowLeft} label="Atrás" onClick={back} />
      <DrawerRailButton icon={ArrowRight} label="Continuar" variant="primary" disabled={!isBalanced} onClick={next} />
    </>
  }
/>
```

Sí: Colócala en la franja del pie del drawer, no sobre el contenido: así nada queda tapado y la lista no salta al recogerse. · Usa `iconOnly` para las herramientas y deja el rótulo a las acciones que cierran el paso. · Enciende `keepOpen` cuando la pista sea un aviso que hay que resolver desde la barra.
No: No pases más de dos acciones de cierre; el resto son herramientas. · No uses `minimal` para ahorrar espacio: es para cuando decidir es lo único seguro. · No mezcles DrawerRailButton con RailButton en la misma barra; son dos lenguajes (con rótulo y sin él).
Relacionados: action-rail-shell, confirm-action-popover, rail-settings-menu, drawer-shell

### RailButton

Las piezas con las que una pantalla llena su barra flotante: el botón de icono (RailButton), la única acción rellena que admite la barra (RailPrimaryAction), la fila de un popover de creación (RailCreateOption) y el envoltorio que hace entrar cada acción escalonada (AnimatedActionItem). Todas leen la orientación del shell para saber si se ponen de pie y hacia dónde abrir su tooltip.

```ts
import { RailButton, RailPrimaryAction, RailCreateOption, AnimatedActionItem } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | El icono del botón. Usa 20px con `strokeWidth={2}` para igualar el resto de la barra. |
| `label` | `string` |  | Rótulo accesible; se muestra en el tooltip. |
| `onClick` | `() => void` |  | La acción. No se dispara mientras haya `blockedReason`. |
| `blockedReason` | `string \| null` | `null` | Explica por qué la acción no está disponible; con valor, el botón se desactiva y el tooltip muestra el motivo. |
| `tone` | `"default" \| "danger"` | `"default"` | Color del botón; `danger` para acciones destructivas. |
| `RailPrimaryAction` | `{ icon; label } & ComponentProps<"button">` |  | La única acción rellena de la barra. Reenvía ref y props sueltas para poder ser trigger de un popover. De pie, el rótulo pasa al tooltip. |
| `RailCreateOption` | `{ icon; title; description; onClick }` |  | Fila de un popover de creación: icono en tile, título en negrita y una descripción corta. |
| `AnimatedActionItem` | `{ animKey: number; staggerIndex: number; skipColorFlash?: boolean }` |  | Entrada escalonada para una acción contextual. `skipColorFlash` evita el destello en chips y divisorias. |

Ejemplo · Tonos y bloqueo:

```tsx
<RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
<RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
<RailButton icon={<Filter />} label="Filtrar" blockedReason="No hay filtros para esta vista" onClick={noop} />
```

Sí: Una sola RailPrimaryAction por barra: es el botón al que apunta la pantalla. · Usa `blockedReason` en vez de ocultar el botón; la barra mantiene su forma y la persona entiende qué le falta. · Envuelve solo las acciones contextuales con AnimatedActionItem; las persistentes no entran ni salen.
No: No cambies el tamaño de icono por botón: 20px en todos, o la barra pierde su ritmo. · No uses `tone="danger"` para acciones reversibles como limpiar una selección. · No pongas RailCreateOption fuera de un popover oscuro: sus colores asumen el fondo `surface-nav`.
Relacionados: action-rail-shell, confirm-action-popover, rail-overflow-menu, rail-selection-chip

### RailDragHandle

El asa con la que se recoloca la barra flotante, y el hook useDraggableRail que hace el trabajo: sigue al puntero, guarda el punto de soltado en un store compartido (useRailPosition) y limita la barra al viewport si la ventana se encoge. Doble clic en el asa devuelve la barra a su dock.

```ts
import { RailDragHandle, useDraggableRail, useRailPosition } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `isDragging` | `boolean` |  | Estado del gesto; pinta el asa como agarrada. |
| `onPointerDown / onPointerMove / onPointerUp / onPointerCancel` | `(event: React.PointerEvent<HTMLButtonElement>) => void` |  | Los manejadores del gesto. Pásalos con `{...gripHandlers}`. |
| `onDoubleClick` | `() => void` |  | Devuelve la barra al dock; `gripHandlers` lo conecta con `resetPosition`. |
| `useDraggableRail()` | `{ barRef; position; isDragging; resetPosition; gripHandlers }` |  | `barRef` va en la caja que se recoloca; `position` es null hasta el primer arrastre. |
| `useRailPosition()` | `readonly [RailPosition \| null, (value) => void]` |  | El store compartido, sin persistencia. `x` es el centro de la barra, no su borde izquierdo. |

Ejemplo · Barra arrastrable con useDraggableRail:

```tsx
const { barRef, position, isDragging, gripHandlers } = useDraggableRail();
const isFloating = position != null;

<div
  ref={barRef}
  className={cn("flex flex-col items-center", isFloating && "fixed z-[60]")}
  style={position ? { left: position.x, top: position.y, transform: "translateX(-50%)" } : undefined}
>
  <RailBar>
    <RailDragHandle isDragging={isDragging} {...gripHandlers} />
    <RailDivider />
    <RailButton icon={<Download />} label="Exportar" onClick={exportAll} />
  </RailBar>
</div>
```

Sí: Mantén la barra abierta mientras `isDragging` sea true: el shell suspende su temporizador de auto-ocultar durante el gesto. · Pon el asa en cabeza de la barra, junto al menú de ajustes: son los controles de la barra, no de la pantalla. · Aplica `position` con `left` + `translateX(-50%)`; la barra cambia de ancho al recogerse y el centro es lo que la persona soltó.
No: No persistas la posición en storage: una recarga debe devolver la barra a su dock. · No montes dos barras arrastrables a la vez en la misma pantalla; comparten posición y se pisarían. · No pongas el asa en un elemento sin `touch-action: none`; el componente ya lo trae, no lo sobrescribas.
Relacionados: action-rail-shell, rail-settings-menu, drawer-action-rail

### RailOverflowMenu

Las acciones que no cupieron en la barra, detrás de un solo «⋯». Conservan el orden que tenían en la lista completa, llevan el rótulo escrito y pueden desplegar sub-opciones cuando una acción tiene más de una respuesta.

```ts
import { RailOverflowMenu, type RailOverflowItem } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `readonly RailOverflowItem[]` |  | Las acciones, en el orden de la lista completa. Con un array vacío el botón no se renderiza. |
| `label` | `string` | `"Más acciones"` | Tooltip y `aria-label` del disparador. |
| `icon` | `React.ReactNode` | `<MoreHorizontal />` | Icono del disparador, para menús que agrupan un solo tema. |
| `onOpenChange` | `(open: boolean) => void` |  | Avisa cuando el menú abre o cierra. |
| `RailOverflowItem.id / label / icon / onClick` | `string / string / ReactNode / () => void` |  | Identidad, rótulo escrito, icono de 16px y la acción de cada fila. |
| `RailOverflowItem.tone` | `"default" \| "danger"` | `"default"` | Fila en rojo para acciones destructivas. |
| `RailOverflowItem.blockedReason` | `string \| null` |  | Desactiva la fila y muestra el motivo como `title`. |
| `RailOverflowItem.subItems` | `readonly RailOverflowSubItem[]` |  | Sub-opciones; la fila abre otro popover en vez de ejecutar `onClick`. |

Ejemplo · Acciones plegadas:

```tsx
<RailOverflowMenu
  items={[
    { id: "duplicate", label: "Duplicar", icon: <Copy />, onClick: duplicate },
    { id: "share", label: "Compartir", icon: <Share2 />, onClick: share },
    { id: "archive", label: "Archivar", icon: <Archive />, onClick: archive, blockedReason: "La encuesta sigue activa" },
    { id: "delete", label: "Eliminar", icon: <Trash2 />, onClick: remove, tone: "danger" },
  ]}
/>
```

Sí: Pliega a partir de la sexta acción: cinco iconos aún se reconocen de un vistazo. · Mantén el orden de la lista completa; quien busca una acción la encuentra en el mismo sitio esté o no plegada. · Usa `subItems` cuando una acción tiene varias formas legítimas, no para anidar categorías.
No: No escondas la acción primaria ni las destructivas más frecuentes detrás del «⋯». · No reordenes por importancia al plegar: el menú es la continuación de la barra, no un ranking. · No uses iconos de 20px en las filas; el tile es de 32px y espera 16px.
Relacionados: rail-button, action-rail-shell, rail-settings-menu, dropdown-menu

### RailSelectionChip

«N seleccionadas ✕»: el lector de selección que toda barra flotante muestra mientras una tabla tiene filas marcadas. Responde a cuántas filas afectará la siguiente acción y ofrece la salida de la selección sin buscar el checkbox que la empezó.

```ts
import { RailSelectionChip } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `count` | `number` |  | Filas marcadas. Con 1 el rótulo va en singular. |
| `onClear` | `() => void` |  | Quita las marcas sin tocar las filas. |
| `gender` | `"f" \| "m"` | `"f"` | Género del sustantivo contado, para que el participio concuerde. |
| `className` | `string` |  | Clases extra del contenedor. |

Ejemplo · Ligado a la selección de una tabla:

```tsx
const contextual = selected.length > 0 ? (
  <>
    <RailSelectionChip count={selected.length} onClear={clear} />
    <RailDivider />
    <RailButton icon={<Copy />} label="Duplicar" onClick={duplicate} />
    <RailButton icon={<Trash2 />} label="Eliminar" tone="danger" onClick={remove} />
  </>
) : null;
```

Sí: Ponlo siempre el primero del grupo contextual: el número explica a qué afectan los botones que le siguen. · Pasa el género correcto; «3 seleccionadas colaboradores» se nota. · Envuélvelo en AnimatedActionItem con `skipColorFlash`: es un lector, no una acción.
No: No lo dejes montado con `count={0}`; retira el grupo contextual entero. · No lo uses como botón de acción: la ✕ solo limpia la selección, nunca borra.
Relacionados: action-rail-shell, rail-button, table-shell

### RailSettingsMenu

Los ajustes propios de la barra —en qué eje se tiende y si se oculta sola— detrás de un solo botón, para no gastar dos huecos de icono en cosas que no tocan el contenido. Escribe en las preferencias compartidas que exponen useRailOrientation y useRailAutoHide, persistidas en localStorage para que la barra sea la misma en todas las pantallas.

```ts
import { RailSettingsMenu, useRailOrientation, useRailAutoHide, useRailPosition } from "@/components/action-rail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `RailSettingsMenu` | `() => JSX.Element` |  | Sin props. Lee y escribe las preferencias compartidas; ActionRailShell y DrawerActionRail lo montan solos al frente de la barra. |
| `useRailOrientation()` | `readonly ["horizontal" \| "vertical", (value) => void]` |  | Preferencia de eje, persistida en `thema.actionRail.orientation.v1`. |
| `setRailOrientation(value)` | `(value: RailOrientation) => void` |  | El setter suelto, para cambiar la preferencia fuera de un componente. |
| `useRailAutoHide()` | `readonly [boolean, (value: boolean) => void]` |  | Si la barra se recoge al salir el puntero, persistida en `thema.actionRail.autoHide.v1`. |
| `useRailPosition()` | `readonly [RailPosition \| null, (value) => void]` |  | Dónde se soltó la barra tras arrastrarla; `null` es el dock. No se persiste. |
| `useRailAxis() / useRailIsVertical()` | `() => RailOrientation / () => boolean` |  | El eje que ve una pieza: el del shell que la envuelve o, sin shell, la preferencia. |
| `useRailPopoutSide()` | `() => "top" \| "left"` |  | Hacia dónde abrir tooltips y popovers, siempre lejos de la barra. |

Ejemplo · El menú y lo que escribe:

```tsx
const [orientation] = useRailOrientation(); // "horizontal" | "vertical"
const [autoHide] = useRailAutoHide();       // boolean

<RailSettingsMenu />
```

Sí: Deja que el shell monte el menú; una pantalla solo aporta acciones. · Lee la orientación con `useRailAxis` en las piezas nuevas, así funcionan dentro y fuera del shell. · Enciende `keepOpen` en el shell mientras haya selección: auto-ocultar no debe esconder una acción que se está a punto de usar.
No: No dupliques los ajustes como botones sueltos en la barra: costarían dos huecos y perderían el rótulo. · No guardes la orientación en el estado de una pantalla; se perdería al cambiar de tab. · No persistas la posición arrastrada: una barra que aparece en un rincón tras recargar parece perdida.
Relacionados: action-rail-shell, rail-drag-handle, rail-overflow-menu, drawer-action-rail


## [object Object] · 11

[object Object]

### AccountMenu

Quién eres, dónde estás y como quién estás mirando, en una sola puerta al final de la cabecera. Antes eran tres piezas repartidas —el chip de sucursal a la izquierda, el de rol junto al avatar y el avatar con su propio menú— y las tres respondían a la misma pregunta. El disparador lleva borde —se lee como botón, no como firma de la pantalla— y enseña la foto, la sucursal activa y, debajo, el rol en una píldora: el nombre no se escribe porque ya lo dicen la foto y sus iniciales, y dentro está entero con el correo; el menú abre con el nombre y el correo, cambia de sucursal (submenú lateral, pueden ser muchas), cambia de rol (lista directa, son un puñado) y cierra la sesión. Nada más: el tema y el idioma son de la plataforma, no de la cuenta, y viven en «Personalización», colgando de la marca. AppHeader lo monta con los datos de ShellConfig; documéntalo suelto solo para ver sus estados.

```ts
import { AccountMenu } from "@/components/app-shell"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `user` | `ShellUser` |  | La persona conectada: su foto (o iniciales) en el chip, su nombre y su correo dentro. Sin espacio activo, el nombre sube al chip. |
| `onLogout` | `() => void` |  | Cerrar sesión, al final del menú. Sin él, el menú no ofrece salir. |
| `companies` | `readonly Company[]` |  | Todos los espacios de la persona; alimentan el submenú de cambio. |
| `activeCompany` | `Company` |  | El espacio activo: lo que se lee en el chip y la fila que abre el cambio. `meta` es su línea descriptiva; `licenses` y `credits` son pares `[usado, total]`. |
| `onSelectCompany` | `(id: string) => void` |  | Al elegir otro espacio. La app decide qué recarga. |
| `roles` | `readonly UserRoleOption[]` |  | Los roles que se pueden asumir. Con menos de dos no hay lista que mostrar. Cada uno puede traer `icon` (un componente de icono) para reconocerlo sin leer; el shell no sabe qué roles existen en cada producto. |
| `activeRole` | `UserRoleOption` |  | El rol activo: la píldora bajo el nombre del espacio y la opción marcada de la lista. |
| `onSelectRole` | `(id: string) => void` |  | Al asumir otro rol. No es cambiar de cuenta: la sesión sigue siendo la misma. |
| `links` | `readonly string[]` | `[]` | Enlaces de administración del espacio, entre su identidad y el cambio. |
| `linkIcons` | `readonly React.ComponentType<{ className?: string }>[]` |  | Iconos opcionales para `links`, en el mismo orden. |
| `labels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio: `entity`, `change` y `list`. |
| `showUsage` | `boolean` | `true` | Los anillos de licencias y créditos. Apagado, el menú es identidad y cambios. |

Ejemplo · La cuenta y su contexto:

```tsx
<AccountMenu
  user={user}
  onLogout={logout}
  companies={BRANCHES}
  activeCompany={activeBranch}
  onSelectCompany={setBranchId}
  showUsage={false}
  labels={{ entity: "Sucursal", change: "Cambiar de sucursal", list: "Tus sucursales" }}
  roles={ROLES}
  activeRole={activeRole}
  onSelectRole={setRoleId}
/>
```

Sí: Deja que AppHeader lo monte con `user`, `companies`, `roles` y `workspaceLabels` de ShellConfig: así la esquina dice lo mismo en toda la aplicación. · Mantén juntas las tres respuestas —quién, dónde y como quién—: repartidas por la cabecera obligaban a cruzar la pantalla para cambiar de contexto. · Reacciona en `onSelectCompany` y `onSelectRole`: el menú solo mueve la marca, la navegación y los permisos son de la app.
No: No metas aquí el tema ni el idioma: son de la plataforma, no de la cuenta, y viven en «Personalización» (menú de la marca). · No añadas los ajustes del negocio: esos están en `WorkspaceMenu` y en su propia pantalla. · No uses el cambio de rol como cambio de cuenta: la sesión no cambia, solo la vista.
Relacionados: app-header, company-menu, admin-shell, workspace-menu

### AdminShell

El cascarón del panel de administración: AppSidebar plegable (se recoge solo a los dos segundos), AppHeader, pie legal y un diálogo de feedback, todo en un `h-dvh` con margen de 8px. Expone tres anclas por portal —ShellHeaderSlot, ShellRailSlot y ShellAgentPanelSlot— para que una pantalla ponga su identidad, su barra flotante y su panel lateral sin levantar estado al router.

```ts
import { AdminShell, ShellHeaderSlot, ShellRailSlot, ShellAgentPanelSlot } from "@/components/app-shell"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `children` | `React.ReactNode` |  | La pantalla. Con `scrollContent` va dentro de un scroller; sin él, en una caja `overflow-hidden` que debe llenar con `h-full`. |
| `config.contentWidth` | `"narrow" \| "normal" \| "wide" \| "full"` | `"normal"` | Ancho máximo de la columna de contenido, con los tres anchos del sistema: 720px para formularios, 1140px por defecto y 1600px para tableros densos. `full` deja el lienzo entero. Lo pone el marco una vez; ninguna pantalla vuelve a fijar su ancho. |
| `scrollContent` | `boolean` | `true` | El shell hace scroll del contenido y muestra el pie. Las pantallas tipo app pasan `false` y gestionan su scroll. |
| `showFooter` | `boolean` | `scrollContent \|\| modo agente` | Fuerza el pie legal aunque `scrollContent` sea false. |
| `onNavigateHome` | `() => void` |  | Se dispara al pulsar «Objetivos» en el sidebar: la vuelta a la lista. |
| `ShellHeaderSlot` | `{ children }` |  | Portala junto al toggle del header: identidad viva de la pantalla (nombre, estado, autosave). |
| `ShellRailSlot` | `{ children }` |  | Portala al ancla inferior centrada del `main`, fuera del scroller; para ActionRailShell. |
| `ShellAgentPanelSlot` | `{ children }` |  | Portala al ancla lateral, hermana de la columna de contenido; el hijo trae su ancho. |

Ejemplo · Pantalla tipo app con los tres slots:

```tsx
<AdminShell scrollContent={false} onNavigateHome={goHome}>
  <ShellHeaderSlot>
    <span className="text-sm font-semibold">Ciclo de desempeño 2026</span>
    <Badge variant="secondary">Borrador</Badge>
  </ShellHeaderSlot>

  <div className="flex h-full flex-col">{/* contenido con su propio overflow-y-auto */}</div>

  <ShellRailSlot>
    <ActionRailShell persistent={<ScreenActions />} />
  </ShellRailSlot>
</AdminShell>
```

Sí: Una pantalla con tabla y barra flotante pasa `scrollContent={false}` y monta su barra en ShellRailSlot. · Pon en ShellHeaderSlot solo identidad que la pantalla ya posee; el shell no debe conocerla. · Deja que el shell escriba la clase `dark` en `<html>`; no lo hagas también desde la pantalla. · Si la pantalla necesita más aire, cambia `contentWidth` en el marco; no le pongas un `max-w-` propio.
No: No rendericen los slots fuera de AdminShell: sin proveedor devuelven null en silencio. · No pongas un panel lateral como overlay sobre la columna; usa ShellAgentPanelSlot para que la columna ceda ancho. · No anides AdminShell dentro de otro cascarón de pantalla completa.
Relacionados: app-sidebar, app-header, action-rail-shell, ai-agent-drawer

### AgentView (beta)

La pantalla inicial del Agente IA que AdminShell muestra en modo «agent»: saludo con el nombre de la persona, la tarjeta de prompt con el borde animado de IA y cuatro sugerencias que rellenan el campo. No tiene props: lee `user`, `agentSuggestions` y `onAgentPrompt` de ShellConfig, y de momento es solo la portada, sin hilo de conversación.

```ts
import { AgentView } from "@/components/app-shell/AgentView"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.user` | `ShellUser` |  | Vía ShellConfig. Del `name` se toma el primer nombre para el saludo. |
| `config.agentSuggestions` | `readonly string[]` |  | Vía ShellConfig. Las tarjetas de sugerencia; al pulsarlas rellenan el prompt y enfocan el campo. |
| `config.onAgentPrompt` | `(prompt: string) => void` |  | Vía ShellConfig. Se llama con el texto recortado al pulsar «Enviar»; un prompt vacío no dispara nada. |

Ejemplo · Portada del agente:

```tsx
// AdminShell la monta cuando mode === "agent":
<AdminShell config={{ onAgentPrompt: (prompt) => askAgent(prompt) }}>…</AdminShell>

// Suelta, dentro de un contenedor con altura:
<div className="h-full bg-background">
  <AgentView />
</div>
```

Sí: Conecta `onAgentPrompt` en el `config` de AdminShell; la vista se encarga de vaciar el campo. · Mantén las sugerencias en cuatro y escritas como peticiones completas: son el prompt tal cual. · Móntala dentro de un contenedor con altura definida; se centra con `h-full`.
No: No le añadas estado de conversación: para el hilo de chat está AiAgentDrawer o el panel del agente. · No la uses fuera del modo «agent» del shell; su saludo y su borde de IA presuponen ese contexto.
Relacionados: admin-shell, app-sidebar, ai-agent-drawer

### AppHeader

La franja de 56px del AdminShell. A la izquierda, el hueco donde la pantalla portala su identidad (ShellHeaderSlot). A la derecha, la búsqueda general primero, Novedades, ayuda, las notificaciones y, cerrando la fila, `AccountMenu`: la foto y el nombre de la persona con «sucursal · rol» debajo, y un solo menú que cambia de sucursal, cambia de rol y cierra la sesión. Los ajustes, el tema y el idioma no están aquí: viven en `WorkspaceMenu` y en «Personalización», colgados de la marca del sidebar. Los popovers se abren desde el punto exacto de su botón. Por debajo de `md` la fila se queda con lo que responde a la pantalla que estás mirando —búsqueda, notificaciones y el chip de la cuenta, que sigue siendo el mismo chip y solo cede ancho—: la ayuda se va y Novedades baja al pie del menú lateral.

```ts
import { AppHeader } from "@/components/app-shell/AppHeader"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.companies` | `Company[]` | `COMPANIES` | Los espacios entre los que se cambia desde el menú de la cuenta: empresas, sucursales, sedes. `chrome.company: false` los quita. |
| `config.activeCompanyId` | `string` |  | Espacio activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado. |
| `config.onSelectCompany` | `(id: string) => void` |  | Al elegir otro espacio. Todo lo que se ve debajo es de ese espacio, así que la app decide qué recarga. |
| `config.workspaceLabels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio en este producto: `entity` («Sucursal»), `change` («Cambiar de sucursal») y `list` («Tus sucursales»). |
| `config.showWorkspaceUsage` | `boolean` | `true` | Licencias y créditos dentro del menú. Un producto que no las vende lo apaga y el menú queda en identidad y cambio. |
| `config.roles` | `UserRoleOption[]` | `USER_ROLES` | Roles que la persona puede asumir. Con menos de dos el chip no los menciona. `chrome.role: false` quita la lista del menú. |
| `config.activeRoleId` | `string` |  | Rol activo controlado desde fuera. Sin él, el header arranca en el primero y gestiona su propio estado. |
| `config.onSelectRole` | `(id: string) => void` |  | Al elegir un rol. La app decide qué recarga: navegación, permisos o la pantalla entera. |
| `onToggleSidebar` | `() => void` |  | El botón «Menú», visible solo por debajo de `lg`, donde el sidebar es un cajón. |
| `onOpenNews` | `() => void` |  | Obsoleto: Novedades ya se abre solo. Se mantiene por compatibilidad. |
| `onSlotRef` | `(element: HTMLDivElement \| null) => void` |  | Recibe el elemento del hueco de identidad para pasarlo a ShellHeaderSlotProvider. |

Ejemplo · Identidad de la pantalla en el header:

```tsx
// En AdminShell:
<AppHeader … onSlotRef={setHeaderSlot} />
<ShellHeaderSlotProvider value={headerSlot}>{children}</ShellHeaderSlotProvider>

// En la pantalla:
<ShellHeaderSlot>
  <span className="text-sm font-semibold">{name}</span>
  <Badge variant="secondary">{status}</Badge>
</ShellHeaderSlot>
```

Sí: Guarda el elemento de `onSlotRef` en estado (no en un ref): el slot se monta después del primer render y los consumidores necesitan re-renderizar. · Usa ShellHeaderSlot para identidad corta: nombre, estado, autosave. Máximo una línea. · Cuando cambie el rol o la sucursal, reacciona en `onSelectRole` / `onSelectCompany`: el shell solo mueve la marca, la navegación y los permisos son de la app. · Da a `workspaceLabels` el nombre que usa el producto: el mismo conmutador se lee «Empresa» en un SaaS y «Sucursal» en un negocio con locales.
No: No pongas migas en el header: la navegación vive en el sidebar y el hueco es para la pantalla. · No montes AppHeader fuera de AdminShell salvo para probarlo; los popovers asumen el ancho del shell. · No repartas el contexto: quién, dónde y como quién son la misma pregunta y viven en la misma puerta, con el rol y la sucursal visibles en el propio chip. · No dejes el chip de la cuenta en la cara sola en móvil: es donde más cuesta saber en qué sucursal estás. Si falta ancho, lo que sale de la fila es lo que no depende de la pantalla (Novedades, ayuda). · No metas la configuración en el árbol de navegación ni de vuelta en esta cabecera: se ajusta una vez, así que vive en `WorkspaceMenu`, colgado de la marca (ver `admin-shell` y `workspace-menu`).
Relacionados: admin-shell, account-menu, app-sidebar, workspace-menu, header, save-indicator

### AppSidebar

El sidebar del AdminShell, en dos capas: un rail de iconos de 64px que está siempre y no se mueve, y un panel de 240px que se desliza por encima con la marca del producto, el segmentado Workspace / Agente IA, el árbol con acordeones y drill, una tarjeta promocional opt-in y un pie con «Novedades» —solo por debajo de `md`, donde la cabecera la suelta para dejarle su ancho al chip de la cuenta— y el feedback. Con `config.settings`, la marca es el disparador de `WorkspaceMenu` (personalización y ajustes agrupados); sin ajustes que ofrecer, es solo identidad. Plegar no encoge el panel: lo aparta y descubre el rail, así los iconos se quedan quietos y las etiquetas nunca se estrujan. Ninguna sección queda sin salida con el panel plegado: el icono de una sección con hijos despliega su árbol a la derecha, con submenú para los que tienen nietos. Dentro de una sección, una tarjeta dice dónde estás y deja saltar a un hermano sin volver atrás. Es un componente controlado: AdminShell le dice si está plegado, si el cajón móvil está abierto y en qué modo está.

```ts
import { AppSidebar } from "@/components/app-shell/AppSidebar"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `collapsed` | `boolean` |  | Aparta el panel de 240px y deja a la vista el rail de 64px con tooltips. |
| `mobileOpen` | `boolean` |  | Por debajo de `lg` el sidebar es un cajón fijo; esto lo muestra. |
| `mode` | `"workspace" \| "agent"` |  | Qué muestra el segmentado y el árbol: navegación o historial de chats. |
| `onModeChange` | `(mode: ShellMode) => void` |  | Al pulsar el segmentado. |
| `onToggleCollapse` | `() => void` |  | Al pulsar el botón de plegar (solo visible desde `lg`). |
| `onOpenFeedback` | `() => void` |  | Al pulsar «Feedback» en el pie. |
| `onCloseMobile` | `() => void` |  | Tras cualquier selección, para cerrar el cajón móvil. |
| `onNavigateHome` | `() => void` |  | Al aterrizar en «Objetivos», el nodo que significa «volver a la lista». |
| `config.promo` | `ShellPromo \| null` | `null` | Tarjeta promocional del sidebar en modo Workspace. Apagada por defecto: no sale sola, se enciende a propósito pasando el objeto. |

Ejemplo · Acordeones y drill:

```tsx
<AppSidebar
  collapsed={collapsed}
  mobileOpen={mobileOpen}
  mode="workspace"
  onModeChange={setMode}
  onToggleCollapse={toggle}
  onCloseMobile={() => setMobileOpen(false)}
  onOpenFeedback={openFeedback}
  onNavigateHome={goHome}
/>
```

Sí: Deja que AdminShell lo controle; monta el sidebar suelto solo para probarlo. · Añade secciones en NAV_TREE (appShellData.ts): con `children` es acordeón, con nietos abre un drill. · Cierra el cajón móvil en `onCloseMobile` después de navegar. · Enciende `config.promo` solo cuando la pantalla tenga algo real que anunciar; apagada es el estado por defecto.
No: No guardes `collapsed` dentro del sidebar: el header móvil también lo alterna. · No pongas más de dos niveles bajo un acordeón; el drill existe para el tercero.
Relacionados: admin-shell, app-header

### CompanyMenu

El espacio de trabajo activo y su cambio. En la cabecera de la aplicación (`placement="header"`) es un `HeaderChip`: una sola línea con la marca y el nombre, sin rótulo apretado encima — el tipo («Sucursal») se lee dentro, en la cabecera del menú que abre, donde sí hay sitio para la frase completa. El menú trae el consumo de licencias y créditos como anillos de proporción —apagable con `showUsage` para un producto que no las vende—, los enlaces de administración y un submenú lateral para cambiar. `labels` decide cómo se lee: empresa, sucursal o sede. La cabecera de la aplicación ya no lo monta: ahí el espacio activo va con la persona y el rol en la misma puerta (ver `AccountMenu`). Este queda para el espacio activo a solas —un sidebar, un producto sin cuenta ni roles que asumir—.

```ts
import { CompanyMenu, CompanyMark } from "@/components/app-shell/CompanyMenu"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `companies` | `readonly Company[]` |  | Todas las empresas de la persona; alimentan el submenú «Cambiar de empresa». |
| `activeCompany` | `Company` |  | El espacio mostrado en el disparador y en la cabecera del menú. `licenses` y `credits` son pares `[usado, total]` opcionales; `meta` es la línea que se lee bajo el nombre. |
| `onSelectCompany` | `(id: string) => void` |  | Al elegir otra empresa en el submenú. |
| `links` | `readonly string[]` |  | Etiquetas de los enlaces de administración, entre el consumo y el cambio de empresa. |
| `linkIcons` | `readonly React.ComponentType<{ className?: string }>[]` |  | Iconos opcionales para `links`, en el mismo orden. |
| `placement` | `"sidebar" \| "header"` | `"sidebar"` | Dónde vive el disparador: la fila ancha del sidebar o el chip compacto de la cabecera de la aplicación. |
| `labels` | `ShellWorkspaceLabels` | `Empresa` | Cómo se lee el espacio: `entity`, `change` y `list`. |
| `showUsage` | `boolean` | `true` | Los anillos de licencias y créditos. Apagado (o sin esos datos en la empresa), el menú es identidad y cambio. |
| `CompanyMark` | `{ company: Company; size?: "sm" \| "md" }` |  | Export secundario: la marca cuadrada de una empresa, reutilizada por el rail plegado. |

Ejemplo · Menú y cambio de empresa:

```tsx
const [activeId, setActiveId] = React.useState(COMPANIES[0].id);
const activeCompany = COMPANIES.find((c) => c.id === activeId) ?? COMPANIES[0];

<CompanyMenu
  companies={COMPANIES}
  activeCompany={activeCompany}
  onSelectCompany={setActiveId}
  links={COMPANY_MENU_LINKS}
/>
```

Sí: Deja que AppHeader lo monte con `companies` y `companyMenuLinks` de ShellConfig; los enlaces y los rótulos se personalizan ahí. · Mantén `licenses` y `credits` como pares `[usado, total]`: el anillo calcula el porcentaje por sí solo. · Da a cada empresa un `bg` con contraste suficiente para la inicial en blanco; sin `bg`, la marca usa el color del tema. · Describe cada espacio con `meta` cuando no sean empresas: una sucursal se reconoce por su dirección, no por su plan.
No: No conviertas «Cambiar de empresa» en una vista que sustituya al menú: el submenú lateral existe para no perder de vista dónde se estaba. · No añadas más de cinco o seis enlaces; el menú es un atajo, no la navegación de administración. · No dejes el rótulo en «Empresa» si el producto trabaja por sucursales: el chip es lo único que dice en qué contexto ocurre todo lo demás.
Relacionados: account-menu, app-sidebar, sidebar-icon-rail, admin-shell, dropdown-menu

### Header

La franja superior de 80px del shell: migas, título y descripción a la izquierda; buscador y notificaciones a la derecha. El AdminShell usa su propio AppHeader con un slot para la identidad de la pantalla.

```ts
import { Header } from "@/components/layout"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | El `<h1>` de la pantalla. |
| `description` | `string` |  | Una línea bajo el título. |
| `breadcrumbs` | `string[]` | `[]` | Migas sobre el título; con array vacío no se renderizan. |
| `className` | `string` |  | Se mezcla con el `<header>` (`h-20 border-b bg-surface px-8`). |
| `...props` | `React.HTMLAttributes<HTMLElement>` |  | Atributos nativos del `<header>`. Reenvía `ref`. |

Ejemplo · Título y descripción:

```tsx
<Header title="Encuestas" description="Gestión de encuestas de clima y satisfacción" />
```

Sí: Deriva `title`, `description` y `breadcrumbs` de navigationConfig, no los escribas dos veces. · Úsalo como cabecera de una app clásica con scroll interno en PageShell; su `shrink-0` y el borde inferior están pensados para ahí.
No: No lo uses como cabecera de una tarjeta o sección: para eso están PageHeader y SectionHeader. · No combines Header con AppHeader: pertenecen a shells distintos.
Relacionados: page-shell, app-header, breadcrumbs, page-header

### PageShell

El `<main>` de una página: hace scroll por su cuenta, pone el padding de página y centra el contenido en una columna con ancho máximo. Tres anchos según la densidad de la pantalla: enterprise para tablas y dashboards, constrained para lectura y formularios, full para lienzos.

```ts
import { PageShell } from "@/components/layout"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `maxWidth` | `"enterprise" \| "constrained" \| "full"` | `"enterprise"` | Ancho máximo de la columna: 1600px, 1200px o sin límite. |
| `children` | `React.ReactNode` |  | Las secciones de la página; se apilan con `space-y-8`. |
| `className` | `string` |  | Se mezcla con el `<main>` (`flex-1 overflow-y-auto bg-background p-8`). |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos nativos del `<main>`. Reenvía `ref`. |

Ejemplo · Los tres anchos:

```tsx
<PageShell>…</PageShell>                       // max-w-[1600px]
<PageShell maxWidth="constrained">…</PageShell> // max-w-[1200px]
<PageShell maxWidth="full">…</PageShell>        // max-w-full
```

Sí: Usa `enterprise` para tablas anchas y dashboards; `constrained` cuando el contenido se lee de arriba abajo. · Encabeza la página con PageHeader como primera sección. · Deja que PageShell sea el único elemento con scroll vertical de la vista.
No: No pongas otro `<main>` dentro; ya lo es. · No sobrescribas el padding por sección: es el ritmo de página compartido.
Relacionados: admin-shell, page-header, section-header

### Resizable

Paneles que se reparten el ancho o el alto de un grupo y se redimensionan arrastrando el asa que los separa. Sin dependencias: el reparto vive como porcentajes en el grupo y cada panel lo recibe como `flex-basis`.

```ts
import { ResizableGroup, ResizablePanel, ResizableHandle } from "@/components/layout/Resizable"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `ResizableGroup — direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje del reparto. Horizontal pone los paneles en fila; vertical, en columna. |
| `ResizableGroup — onLayout` | `(sizes: number[]) => void` |  | Se llama con el reparto completo (porcentajes que suman 100) en cada cambio, incluido el arrastre en curso. |
| `ResizableGroup — storageKey` | `string` |  | Clave de `localStorage` donde se recuerda el reparto entre visitas. Se guarda al soltar el asa, no en cada frame. |
| `ResizableGroup — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del contenedor del grupo. |
| `ResizablePanel — defaultSize` | `number` |  | Porcentaje inicial del grupo. Sin él, el panel se reparte a partes iguales lo que sobre entre los paneles sin tamaño declarado. |
| `ResizablePanel — minSize` | `number` |  | Porcentaje mínimo. También topa al panel vecino al arrastrar el asa que comparten. |
| `ResizablePanel — maxSize` | `number` |  | Porcentaje máximo del panel. |
| `ResizablePanel — collapsible` | `boolean` | `false` | Deja que el panel se pliegue a 0 al arrastrarlo por debajo de la mitad de `minSize`. |
| `ResizablePanel — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del panel (`min-h-0 min-w-0 overflow-auto` ya vienen incluidos para que el contenido no le impida encogerse). |
| `ResizableHandle — withGrip` | `boolean` | `false` | Dibuja el tirador central, para que se vea que el borde se puede arrastrar. |
| `ResizableHandle — ...props` | `React.HTMLAttributes<"div">` |  | Atributos nativos del asa. Es un `role="separator"` enfocable: el grupo le inyecta los `aria-value*`, `aria-orientation` y los manejadores de puntero y teclado. |

Ejemplo · Maestro-detalle de candidatos:

```tsx
<ResizableGroup direction="horizontal" className="h-full rounded-xl border border-border">
  <ResizablePanel defaultSize={30} minSize={15} maxSize={70}>
    <CandidateList />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={70} minSize={20}>
    <CandidateDetail />
  </ResizablePanel>
</ResizableGroup>
```

Sí: Fija un `minSize` en cada panel para que ninguno desaparezca por accidente al arrastrar. · Dale al `ResizableGroup` una altura explícita (`h-full` sobre un contenedor con alto definido); los porcentajes se calculan contra ella. · Usa `storageKey` cuando el reparto tenga sentido recordarlo entre sesiones, como un panel lateral de la app.
No: No lo uses para layouts que no necesitan ajuste manual: un `grid` fijo es más simple y más predecible. · No pongas contenido crítico solo en un panel `collapsible` sin una forma de volver a abrirlo (doble clic en el asa o un botón externo). · No anides más de dos niveles de `ResizableGroup`; la pista deja de ser legible con tantas asas.
Relacionados: page-shell, admin-shell, scroll-area, table-shell

### SidebarIconRail

El rail de iconos de 64px que queda a la vista cuando el sidebar se pliega: no es el panel encogido, sino una capa propia que nunca cambia de ancho, así los iconos no viajan durante la transición. Cada raíz sin hijos navega directo; una sección con hijos abre su árbol a la derecha al pasar el puntero, con submenú para los nietos; los grupos se vuelven separadores y el conmutador Workspace / Agente IA se apila.

```ts
import { SidebarIconRail } from "@/components/app-shell/SidebarIconRail"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `navigation` | `readonly NavEntry[]` |  | El árbol del sidebar: raíces (`kind: "item"`) y grupos (`kind: "group"`), normalmente `NAV_TREE` o `config.navigation`. |
| `currentNodeId` | `string` |  | Id del nodo activo, en cualquier nivel. |
| `holdsCurrent` | `(item: NavRoot, currentNodeId: string) => boolean` |  | Decide si una raíz se enciende: ella misma o algo que cuelgue de ella. |
| `onSelectRoot` | `(item: NavRoot) => void` |  | Al pulsar una raíz sin hijos. |
| `onSelectNode` | `(id: string) => void` |  | Al elegir un hijo o una hoja desde el desplegable de una sección. |
| `mode` | `"workspace" \| "agent"` |  | Qué botón del conmutador apilado está pulsado. |
| `onModeChange` | `(mode: ShellMode) => void` |  | Al pulsar Workspace o Agente IA. |
| `onExpand` | `() => void` |  | Al pulsar «Expandir menú», el botón superior. |
| `onOpenFeedback` | `() => void` |  | Al pulsar «Feedback» en el pie. |
| `brandMark` | `React.ReactNode` |  | La marca del producto; AppSidebar pasa `<BrandMark name={brand.productName} />`. El espacio activo (empresa, sucursal) se cambia desde la cabecera, no desde aquí. |
| `brandLabel` | `string` |  | Nombre del producto, para el tooltip y el `aria-label` de la marca. |
| `className` | `string` |  | Clases extra del `<nav>`. |

Ejemplo · Raíces, secciones y grupos:

```tsx
function holdsCurrent(item: NavRoot, currentNodeId: string) {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some(
    (child) => child.id === currentNodeId || (child.children ?? []).some((leaf) => leaf.id === currentNodeId)
  );
}

<SidebarIconRail
  navigation={NAV_TREE}
  currentNodeId={currentNodeId}
  holdsCurrent={holdsCurrent}
  onSelectRoot={(item) => setCurrentNodeId(item.id)}
  onSelectNode={setCurrentNodeId}
  mode={mode}
  onModeChange={setMode}
  onExpand={expand}
  onOpenFeedback={openFeedback}
  brandMark={<BrandMark name={brand.productName} />}
  brandLabel={brand.productName}
/>
```

Sí: Deja que AppSidebar lo monte y lo superponga al panel; suelto solo sirve para probarlo. · Pasa el mismo `holdsCurrent` que usa el panel para que ambos enciendan la misma raíz. · Apaga la marca o el conmutador desde `chrome` en ShellConfig, nunca con CSS.
No: No animes su ancho: la gracia es que mide 64px siempre y el panel se desliza por encima. · No pongas raíces sin icono en NAV_TREE; en el rail el icono es lo único que se ve. · No metas más de tres niveles: el submenú del desplegable es el último.
Relacionados: app-sidebar, company-menu, admin-shell, tooltip, dropdown-menu

### WorkspaceMenu

El menú que cuelga de la marca del producto en el sidebar: antes de esto, ajustar la cuenta era un engranaje suelto en la cabecera y personalizar el tema otro botón aparte, compitiendo con la sucursal, el buscador y el avatar por sitio. Aquí es una sola puerta: la identidad del producto, lo que la app añada en `extra` (tema, idioma) y los grupos de `config.settings`, con un pie opcional que lleva a la pantalla que los reúne todos. El shell no sabe qué hay dentro de `extra` — solo le da un lugar entre la identidad y los ajustes.

```ts
import { WorkspaceMenu } from "@/components/app-shell/WorkspaceMenu"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `trigger` | `React.ReactElement` |  | El elemento que lo abre: la fila de marca del panel expandido, o el icono solo en el rail plegado. |
| `productName` | `string` |  | Encabeza el menú, junto al `tagline` si lo hay. |
| `tagline` | `string` |  | Segunda línea bajo el nombre del producto. |
| `groups` | `SettingsGroup[]` | `config.settings` | Los ajustes agrupados. Cada ítem navega por `onNavigate`. |
| `all` | `{ id, label, path? }` |  | El pie del menú: la pantalla que reúne todos los ajustes. |
| `onNavigate` | `(id: string, path?: string) => void` |  | Al elegir un ajuste o el pie «Ver toda la configuración». |
| `extra` | `React.ReactNode` |  | Controles que la app añade entre la identidad y los ajustes — el shell no sabe qué son, típicamente `ThemeSelector` y `LanguageSelector`. |
| `side / align` | `"bottom" \| "right" · "start" \| "end"` | `"bottom" · "start"` | Lado del contenido: `bottom` para la fila expandida del panel, `right` para el icono del rail plegado. |

Ejemplo · Identidad, personalización y ajustes:

```tsx
<WorkspaceMenu
  trigger={<BrandRow />}
  productName={brand.productName}
  tagline={brand.tagline}
  groups={config.settings}
  all={config.settingsAll}
  onNavigate={config.onNavigate}
  extra={<ThemeSelector className="w-full justify-start" />}
/>
```

Sí: Da a `extra` el mismo peso visual que un ítem del menú (fila completa, no un botón suelto): así se lee como una sección más, no como un intruso. · Deja que AppSidebar decida cuándo montarlo: sin `config.settings` (la documentación, por ejemplo), la marca se queda como identidad simple, sin abrir nada. · Usa el mismo `config.settings` que ya alimentaba el engranaje de la cabecera; este componente no inventa su propio catálogo de ajustes.
No: No lo dupliques en la cabecera: los ajustes solo se ofrecen desde la marca, para no repartir la misma puerta en dos sitios distintos. · No metas contenido pesado y sin relación en `extra`; es un atajo a personalización, no un cajón de sastre.
Relacionados: admin-shell, app-sidebar, app-header, sidebar-icon-rail, dropdown-menu


## [object Object] · 6

[object Object]

### EmptyGalleryState

El estado vacío especializado para colecciones multimedia: icono de imagen, textos por defecto en español y altura mínima para que la sección no colapse. Es lo que Gallery renderiza cuando `items` está vacío.

```ts
import { EmptyGalleryState } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` | `"Sin elementos multimedia"` | Título del estado vacío. |
| `description` | `string` | `"No se han encontrado recursos…"` | Explicación breve bajo el título. |
| `action` | `ReactNode` |  | Botón o enlace que resuelve el vacío. |
| `className` | `string` |  | Clases extra; por defecto trae `min-h-[300px]` y borde discontinuo. |

Ejemplo · Por defecto:

```tsx
<EmptyGalleryState />
```

Sí: Adapta título y descripción al contexto (curso, actividad, filtros) en lugar de dejar el genérico. · Ofrece siempre una acción cuando el usuario puede resolver el vacío.
No: No lo uses fuera de colecciones multimedia: EmptyState es el genérico. · No lo apiles con otro mensaje de aviso; ya explica por qué no hay nada.
Relacionados: gallery, empty-state, upload-zone, image-grid

### Gallery

El contenedor de página para colecciones multimedia: SectionHeader con título y acciones, ImageGrid debajo y un estado vacío automático cuando no hay ítems. Acepta las mismas props de grilla y selección que ImageGrid.

```ts
import { Gallery } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `MediaItem[]` |  | Ítems a mostrar. Vacío o indefinido activa el estado vacío. |
| `title` | `string` |  | Título de la sección; activa el SectionHeader. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `actions` | `ReactNode` |  | Botones alineados a la derecha de la cabecera. |
| `emptyState` | `ReactNode` |  | Reemplaza el EmptyGalleryState por defecto. |
| `columns` | `2 \| 3 \| 4` | `3` | Columnas de la grilla (ignorado en bento). |
| `variant` | `"cards" \| "compact" \| "bento"` | `"cards"` | Variante visual que se pasa a ImageGrid. |
| `selectable` | `boolean` | `false` | Habilita la selección de ítems. |
| `selectedIds` | `string[]` | `[]` | Ids seleccionados (controlado). |
| `onSelect` | `(id: string) => void` |  | Avisa el id pulsado. |
| `disabled` | `boolean` | `false` | Deshabilita toda la grilla. |
| `className` | `string` |  | Clases del contenedor. |

Ejemplo · Sección con acciones:

```tsx
<Gallery
  title="Biblioteca de recursos"
  description="Todo lo que tu equipo ha compartido."
  actions={<Button size="sm"><Upload /> Subir</Button>}
  items={items}
/>
```

Sí: Coloca la acción principal (subir, crear) en `actions`, y repítela en el `emptyState` para no dejar al usuario sin salida. · Usa `title` siempre que la galería sea una sección de página; sin él usa ImageGrid directamente.
No: No pongas más de dos acciones en la cabecera; el resto va a un menú. · No uses Gallery para un único recurso: para eso está MediaPreview.
Relacionados: image-grid, empty-gallery-state, preview-card, upload-zone

### ImageGrid

La grilla técnica que pinta una lista de `MediaItem` en tarjetas, miniaturas compactas o un bento con spans. Soporta selección múltiple controlada y estado deshabilitado por ítem o global.

```ts
import { ImageGrid } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `MediaItem[]` |  | Lista de ítems: `id`, `title`, `src`, `kind`, `badge`, `metadata`, `colSpan`, `rowSpan`… |
| `columns` | `2 \| 3 \| 4` | `3` | Columnas en escritorio (se reducen en móvil). Ignorado en bento. |
| `variant` | `"cards" \| "compact" \| "bento"` | `"cards"` | Tarjeta completa, miniatura cuadrada o bento con spans. |
| `selectable` | `boolean` | `false` | Activa el click y el indicador de selección. |
| `selectedIds` | `string[]` | `[]` | Ids seleccionados (controlado). |
| `onSelect` | `(id: string) => void` |  | Se llama con el id pulsado; el padre decide si añade o quita. |
| `disabled` | `boolean` | `false` | Deshabilita toda la grilla. Cada ítem puede traer su propio `disabled`. |
| `className` | `string` |  | Clases del contenedor grid. |

Ejemplo · Tarjetas:

```tsx
// Placeholder SVG inline; en producción `src` es la URL real
const placeholder = (label: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#2563eb"/>
    <text x="320" y="180" fill="#fff" font-size="40" text-anchor="middle">${label}</text>
  </svg>`);

const items: MediaItem[] = [
  { id: "liderazgo", title: "Liderazgo situacional", src: placeholder("Liderazgo"), kind: "video", badge: "Nuevo", metadata: "12 lecciones" },
  // …
];

<ImageGrid items={items} columns={3} />
```

Sí: Usa `compact` para elegir entre muchos recursos y `cards` cuando la descripción importa. · En bento, limita los ítems con span a uno o dos por bloque para que la composición respire. · Provee `alt` en los ítems cuando la imagen aporta información.
No: No uses ImageGrid suelto en una página: Gallery añade cabecera y estado vacío. · No mezcles `colSpan`/`rowSpan` fuera de la variante bento; se ignoran.
Relacionados: gallery, preview-card, card, thema-carousel

### MediaPreview

La previsualización en detalle de un único `MediaItem`: imagen a tamaño completo o icono de tipo, título, metadatos, descripción y acciones. Sin `item` muestra un estado vacío listo para drawers y paneles maestro-detalle.

```ts
import { MediaPreview } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `item` | `MediaItem` |  | El recurso a previsualizar. Si falta, se muestra el estado vacío. |
| `title` | `string` |  | Sobrescribe `item.title`. |
| `description` | `string` |  | Sobrescribe `item.description`. |
| `metadata` | `ReactNode` |  | Sobrescribe `item.metadata`; admite nodos (badges, iconos). |
| `actions` | `ReactNode` |  | Botones a la derecha del bloque de información. |
| `emptyState` | `ReactNode` |  | Reemplaza el EmptyState por defecto cuando no hay `item`. |
| `className` | `string` |  | Clases del contenedor raíz. |

Ejemplo · Imagen con acciones:

```tsx
<MediaPreview
  item={item}
  actions={
    <>
      <Button size="sm" variant="outline"><Share2 /> Compartir</Button>
      <Button size="sm"><Download /> Descargar</Button>
    </>
  }
/>
```

Sí: Úsalo como panel de detalle junto a una lista o grilla seleccionable. · Pon la acción principal (descargar, asignar) como botón primario y el resto en contorno.
No: No lo uses para listar varios recursos: para eso están ImageGrid y Gallery. · No lo metas en un contenedor sin ancho definido dentro de un flex; la imagen necesita ancho para escalar.
Relacionados: preview-card, dialog, file-preview, empty-gallery-state

### PreviewCard

La tarjeta individual de un `MediaItem`: imagen 16:9 o icono por tipo, badge, título, metadato y descripción, con un pie opcional de acciones. Es la pieza que usan los carruseles y las grillas cuando necesitas control ítem a ítem.

```ts
import { PreviewCard } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `item` | `MediaItem` |  | El recurso: `title`, `src`, `alt`, `kind`, `badge`, `metadata`, `description`. |
| `selected` | `boolean` | `false` | Marca la tarjeta con borde primario e indicador. |
| `disabled` | `boolean` | `false` | Opacidad reducida, escala de grises y sin click. |
| `onSelect` | `(id: string) => void` |  | Hace la tarjeta clicable y muestra el indicador de selección. |
| `actions` | `ReactNode` |  | Botones en el pie; no propagan el click a la tarjeta. |
| `className` | `string` |  | Clases extra (p. ej. un ancho fijo). |

Ejemplo · Tarjeta básica:

```tsx
<PreviewCard item={item} className="w-72" />
```

Sí: Usa botones `size="xs"` en `actions` para respetar la densidad de la tarjeta. · Fija el ancho desde fuera (grid o `className`); la tarjeta se estira al contenedor.
No: No pongas `onSelect` si no hay una selección real: el indicador confunde. · No metas más de tres acciones en el pie; el resto va a un menú.
Relacionados: image-grid, thema-carousel, card, file-preview

### ThemaCarousel

Envoltorio del Carousel de shadcn con cabecera de sección, flechas y puntos de paginación resueltos. Recibe cualquier hijo como slide y deja el ancho de cada ítem en manos de `itemClassName`.

```ts
import { ThemaCarousel } from "@/components/media"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `children` | `ReactNode` |  | Cada hijo directo se convierte en un slide. |
| `title` | `string` |  | Título de la sección; activa el SectionHeader. |
| `description` | `string` |  | Subtítulo bajo el título. |
| `actions` | `ReactNode` |  | Acciones alineadas a la derecha del título. |
| `showControls` | `boolean` | `true` | Flechas anterior/siguiente (ocultas en móvil). |
| `showDots` | `boolean` | `false` | Puntos de paginación clicables bajo el carrusel. |
| `loop` | `boolean` | `false` | Vuelve al inicio tras el último slide. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Eje de desplazamiento. |
| `contentClassName` | `string` |  | Clases del contenedor de slides; en vertical fija aquí la altura. |
| `itemClassName` | `string` |  | Clases de cada slide; controla cuántos caben por vista con `basis-*`. |
| `ariaLabel` | `string` |  | Etiqueta accesible; por defecto usa `title`. |
| `className` | `string` |  | Clases del contenedor raíz. |

Ejemplo · Sección de tarjetas:

```tsx
<ThemaCarousel
  title="Cursos recomendados"
  description="Seleccionados según tu rol."
  actions={<Button size="sm" variant="outline"><Plus /> Añadir</Button>}
  itemClassName="md:basis-1/2 lg:basis-1/3"
>
  {courses.map((item) => (
    <PreviewCard key={item.id} item={item} />
  ))}
</ThemaCarousel>
```

Sí: Define siempre `itemClassName` con `basis-*` responsivo; sin él cada slide ocupa el 100%. · Usa `showDots` cuando hay pocos slides y todos importan (banners); flechas cuando la lista es larga. · Pasa `ariaLabel` si no hay `title`.
No: No lo uses para listas con más de ~20 ítems: una Gallery con paginación se navega mejor. · No anides carruseles ni pongas más de uno con `loop` en la misma vista.
Relacionados: carousel, preview-card, gallery, card


## [object Object] · 4

[object Object]

### IconTile

Un icono sobre una baldosa tintada: fondo al 10 % del tono y glifo en el color pleno, en tres tamaños (28, 36 y 48px) y dos formas. Es la pieza que da color a atajos, filas de lista y cabeceras de tarjeta sin recurrir a un avatar.

```ts
import { IconTile } from "@/components/utility/IconTile"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `React.ReactNode` |  | El icono. La baldosa fija su tamaño (14, 18 o 24px). |
| `tone` | `"primary" \| "neutral" \| "positive" \| "negative" \| "warning" \| "info" \| "ai"` | `"primary"` | Color del tinte y del glifo. `ai` usa el gradiente de IA. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 28, 36 o 48px. |
| `shape` | `"rounded" \| "circle"` | `"rounded"` | Esquinas según el tamaño o círculo completo. |
| `...props` | `React.HTMLAttributes<"span">` |  | Atributos del span. Lleva `aria-hidden`: el significado va en el texto contiguo. |

Ejemplo · Tonos:

```tsx
<IconTile icon={<BookOpen />} tone="primary" />
<IconTile icon={<ClipboardList />} tone="neutral" />
<IconTile icon={<CheckCircle2 />} tone="positive" />
<IconTile icon={<XCircle />} tone="negative" />
<IconTile icon={<AlertTriangle />} tone="warning" />
<IconTile icon={<Info />} tone="info" />
<IconTile icon={<Sparkles />} tone="ai" />
```

Sí: Asocia un tono a un dominio y mantenlo: formación en `positive`, selección en `primary`, IA en `ai`. · Acompaña siempre la baldosa de un texto; es decorativa (`aria-hidden`). · Usa `lg` en atajos y cabeceras de tarjeta, `md` en filas de lista y `sm` en tablas densas.
No: No mezcles baldosas y avatares en la misma lista: elige una convención por lista. · No uses `negative` o `warning` de forma decorativa; son estados. · No cambies el tamaño del icono con clases: lo controla la baldosa.
Relacionados: list-item, avatar, badge, tag

### PageHeader

El encabezado de nivel superior de una pantalla: breadcrumbs, título h1 con descripción, acciones primarias a la derecha y una fila de metadatos. Úsalo una vez por página, justo debajo del header de la app, para que todas las vistas abran igual.

```ts
import { PageHeader } from "@/components/utility"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `React.ReactNode` |  | Título de la página (h1). Acepta nodos para añadir badges o iconos. |
| `description` | `string` |  | Subtítulo en color muted bajo el título. |
| `breadcrumbs` | `React.ReactNode` |  | Fila superior de navegación contextual. |
| `actions` | `React.ReactNode` |  | Acciones alineadas a la derecha; en móvil pasan debajo del título. |
| `meta` | `React.ReactNode` |  | Fila inferior de metadatos con gap de 16px y texto en 14px muted. |
| `...props` | `Omit<React.HTMLAttributes<HTMLDivElement>, "title">` |  | Atributos del contenedor. |

Ejemplo · Completo, con estado en el título:

```tsx
<PageHeader
  breadcrumbs={<Breadcrumbs items={["Programas", "Onboarding comercial"]} />}
  title={
    <span className="flex items-center gap-2">
      Onboarding comercial
      <Badge variant={published ? "default" : "neutral"}>{published ? "Publicado" : "Borrador"}</Badge>
    </span>
  }
  description="Ruta de 12 lecciones para nuevos ingresos del equipo de ventas."
  actions={
    <>
      <Button variant="outline" size="sm">Vista previa</Button>
      <Button size="sm" onClick={togglePublished}>{published ? "Despublicar" : "Publicar"}</Button>
    </>
  }
  meta={
    <>
      <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> 48 inscritos</span>
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Actualizado hace 2 días</span>
    </>
  }
/>
```

Sí: Un solo PageHeader por pantalla, con una sola acción primaria. · Usa los breadcrumbs cuando la página está a dos o más niveles de profundidad. · Reserva `meta` para datos que cambian (contadores, fechas, estado).
No: No lo uses dentro de drawers o tarjetas: para secciones internas está SectionHeader. · No pongas más de tres acciones; agrupa el resto en un menú.
Relacionados: section-header, tag, badge, button, breadcrumb

### SectionHeader

El encabezado de una sección interna de página: eyebrow, título en 18px, descripción y un slot de acciones alineado abajo a la derecha, cerrado con una línea. Úsalo para separar bloques dentro de una misma vista, entre el PageHeader y el contenido.

```ts
import { SectionHeader } from "@/components/utility"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título de la sección, renderizado como h3. |
| `description` | `string` |  | Texto secundario bajo el título. |
| `eyebrow` | `string` |  | Texto pequeño sobre el título: paso, categoría o contexto. |
| `actions` | `React.ReactNode` |  | Botones alineados a la derecha, con gap de 8px. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

Ejemplo · Título y descripción:

```tsx
<SectionHeader title="Actividad reciente" description="Últimos 30 días." />
```

Sí: Uno por bloque de contenido; deja que la línea inferior separe las secciones. · Limita las acciones a dos y hazlas secundarias (outline o ghost). · Usa el eyebrow para el contexto que el título no necesita repetir.
No: No lo uses como encabezado de página: para eso está PageHeader. · No apiles dos SectionHeader sin contenido entre ellos.
Relacionados: page-header, form-section, button

### Tag

Una etiqueta compacta para metadatos, filtros activos o categorías ligeras, con cinco tonos y una X opcional. A diferencia de un StatusBadge no representa el estado de una entidad, sino información que la acompaña o un filtro que el usuario puede quitar.

```ts
import { Tag } from "@/components/utility"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Texto de la etiqueta; también forma el aria-label del botón de cierre. |
| `tone` | `"neutral" \| "info" \| "success" \| "warning" \| "danger"` | `"neutral"` | Color semántico del fondo y el texto. |
| `removable` | `boolean` | `false` | Muestra la X al final. |
| `onRemove` | `() => void` |  | Se llama al pulsar la X; el click no se propaga al contenedor. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

Ejemplo · Tonos:

```tsx
<Tag label="Categoría" />
<Tag label="Informativo" tone="info" />
<Tag label="Completado" tone="success" />
<Tag label="Por vencer" tone="warning" />
<Tag label="Bloqueado" tone="danger" />
```

Sí: Usa neutral por defecto y un tono de color solo si comunica algo. · Mantén los labels en una o dos palabras. · Si es removible, ofrece una forma de restablecer los filtros.
No: No lo uses para estados de una entidad (Activo, Pendiente): eso es un badge de estado. · No hagas clickeable el Tag entero; solo la X tiene acción.
Relacionados: badge, multi-select, page-header


## [object Object] · 2

[object Object]

### GlassIcon

Ilustración «glass» de 48, 64 o 96px: dos capas de cristal con gradiente, brillo superior y el glifo del registro en blanco. Es para atajos del inicio, indicadores y estados vacíos, siempre acompañada de texto; para iconos en línea sigue siendo ThemaIcon.

```ts
import { GlassIcon } from "@/icons"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `name` | `IconName` |  | Nombre semántico del glifo; reutiliza el mismo registro que ThemaIcon. Obligatorio. |
| `tone` | `"violet" \| "blue" \| "green" \| "orange" \| "rose" \| "amber" \| "teal" \| "brand"` | `"violet"` | Par de gradiente. `brand` usa las variables del gradiente de marca del tema. |
| `size` | `48 \| 64 \| 96` | `64` | Lado del cuadrado en píxeles. |
| `label` | `string` |  | Etiqueta accesible. Sin ella la ilustración es decorativa (`aria-hidden`); con ella pasa a `role="img"`. |
| `className` | `string` |  | Clases extra del SVG (p. ej. una sombra o un margen). |

Ejemplo · Tonos:

```tsx
<GlassIcon name="survey" tone="violet" />
<GlassIcon name="calendar" tone="blue" />
<GlassIcon name="success" tone="green" />
<GlassIcon name="bolt" tone="orange" />
<GlassIcon name="notification" tone="rose" />
<GlassIcon name="award" tone="amber" />
<GlassIcon name="analytics" tone="teal" />
<GlassIcon name="sparkles" tone="brand" />
```

Sí: Acompáñala siempre de texto: es una ilustración, no un icono de acción. · Elige un tono por significado y mantenlo en toda la app: la misma función, el mismo color. · Usa `brand` cuando la ilustración represente al producto o a la empresa, no a un módulo.
No: No la uses en botones, celdas de tabla ni a menos de 48px; ahí va ThemaIcon. · No mezcles más de tres o cuatro tonos en la misma vista. · No pongas `label` si ya hay texto al lado: se leería dos veces.
Relacionados: thema-icon, empty-state, badge

### ThemaIcon

El wrapper único de iconos del sistema: se pide por nombre semántico del registro, no por proveedor, con tallas de camiseta y tonos semánticos. Hoy resuelve a Hugeicons (stroke rounded, 1.5); cambiar de set solo toca `iconRegistry.ts`.

```ts
import { ThemaIcon } from "@/icons"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `name` | `IconName` |  | Nombre semántico del registro (`iconRegistry.ts`). Obligatorio. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Talla: 14, 16, 24, 32 o 40px. |
| `tone` | `"default" \| "muted" \| "primary" \| "positive" \| "negative" \| "warning" \| "info" \| "inverse"` | `"default"` | Color semántico con tokens del tema. |
| `decorative` | `boolean` | `true` | Si es `true` se oculta a lectores de pantalla; si es `false` se expone como `role="img"`. |
| `label` | `string` |  | Texto para `aria-label` cuando `decorative` es `false`. |
| `className` | `string` |  | Clases extra; útil para el degradado de IA (`text-ai-gradient`) o animaciones. |

Ejemplo · Tamaños:

```tsx
<ThemaIcon name="analytics" size="xs" />
<ThemaIcon name="analytics" size="sm" />
<ThemaIcon name="analytics" />
<ThemaIcon name="analytics" size="lg" />
<ThemaIcon name="analytics" size="xl" />
```

Sí: Pide siempre el icono por su nombre semántico; nunca importes el proveedor (Hugeicons o Lucide) directamente en un componente. · Deja `decorative` en `true` cuando hay texto al lado que ya lo describe. · Añade nombres nuevos al registro y al tipo `IconName` en vez de usar `className` para disfrazar otro icono.
No: No uses tamaños arbitrarios con `className`; las cinco tallas son el sistema. · No uses `tone="inverse"` sobre fondos claros. · No pongas `label` sin `decorative={false}`: no tendrá efecto.
Relacionados: button, ai-spark-glyph, chip


## [object Object] · 1

[object Object]

### DataListBlock

Una lista de datos con todo lo que se le pide a una: buscador, configuración de columnas (orden, visibilidad y fijado), vista de tabla o de lista, filas por página o carga al bajar, selección múltiple y estado vacío. Quien lo usa declara qué se lista —filas, columnas y celdas— y no cómo se opera. Las preferencias se recuerdan por `tableId` entre sesiones.

```ts
import { DataListBlock } from "@/components/blocks"
```

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `tableId` | `string` |  | Identidad de la lista: con ella se recuerdan columnas, vista y modo de filas. Si cambia, quien la usaba pierde sus ajustes. |
| `title` | `ReactNode` |  | El título de la lista, en la cabecera del marco. |
| `showCount` | `boolean` | `true` | El total tras filtrar, en una insignia junto al título. |
| `noun` | `string` |  | El sustantivo en plural —«procesos»— para los textos de estado, resumen y etiquetas. |
| `rows` | `readonly T[]` |  | Las filas ya filtradas por lo que decida la pantalla. El buscador del bloque filtra encima. |
| `columns` | `TableColumnSpec[]` |  | Las columnas declaradas una sola vez: id, etiqueta y si es fija u oculta por defecto. |
| `cells` | `TableColumnCells<T>` |  | Encabezado y celda de cada columna, juntos, para que mover una no desalinee la otra. |
| `getRowId` | `(row: T) => string` |  | La clave estable de cada fila. Es lo que guarda la selección. |
| `getRowLabel` | `(row: T) => string` |  | Cómo se nombra una fila en la casilla que la selecciona. Sin ella se usa el id. |
| `searchBy` | `(row: T) => string` |  | Sobre qué texto busca el buscador. Sin ella no hay buscador. |
| `renderListItem` | `(row, state) => ReactNode` |  | El dibujo de una fila en la vista lista. Sin ella el bloque se queda siempre en tabla. El `state` trae ya construidos `checkbox` y `menu` —uno u otro, según la preferencia—: colócalos, no los construyas. |
| `DataListRowState` | `{ selected; toggle; checkbox; menu }` |  | Lo que el bloque pasa a `renderListItem`. `checkbox` va en `leading` y `menu` al final; el que no aplique llega como `null`. |
| `selectable` | `boolean` | `false` | Añade la casilla por fila y la de «seleccionar la página». |
| `selected` | `ReadonlySet<string>` |  | Con ella la selección la manda quien llama; sin ella, el bloque. Pásala cuando la pantalla necesite leerla —por ejemplo para abrir el action rail. |
| `onSelectedChange` | `(next: ReadonlySet<string>) => void` |  | Se avisa en cada cambio de selección, mande quien mande. |
| `recordActions` | `RailActionSpec[]` |  | Lo que se puede hacer con los registros, con el mismo modelo declarativo que la barra flotante: cada acción dice su `scope` (`single`, `bulk`) y se pintan las que apliquen. Dónde se pintan lo decide quien mira desde el panel. |
| `onActionsPlacementChange` | `(placement: "rail" \| "inline") => void` |  | Avisa de dónde quiere las acciones quien mira. La pantalla lo usa para decidir también las suyas: con `rail` monta la barra flotante y deja su cabecera sin botones; con `inline` los devuelve arriba y no monta la barra. |
| `gender` | `"f" \| "m"` | `"m"` | Concordancia del recuento: «3 seleccionadas» frente a «3 seleccionados». |
| `pageSize` | `number` | `10` | Filas por página, y también el tamaño del salto al cargar bajando. |
| `emptyState` | `ReactNode` |  | Reemplaza el texto de lista vacía. |
| `actions` | `ReactNode` |  | Acciones propias en la cabecera, antes del buscador y la configuración. |

Ejemplo · Con todo puesto:

```tsx
<DataListBlock
  tableId="procesos"
  title="Lista de procesos"
  noun="procesos"
  rows={procesos}
  columns={columns}
  cells={cells}
  getRowId={(row) => row.id}
  searchBy={(row) => row.name}
  renderListItem={renderListItem}
  selectable
/>
```

Sí: Dale un `tableId` estable y único por pantalla: es la llave de las preferencias de quien la usa. · Declara `recordActions` una sola vez y pásaselas también a la barra: son la misma lista, y así los dos sitios se comportan igual. · Escucha `onActionsPlacementChange`: si la pantalla monta la barra sin hacerlo, las acciones se ven dos veces. · En la barra flotante, que la selección *sustituya* las acciones de la pantalla en vez de sumarse, y que las que solo valen para un registro se caigan en cuanto haya más de uno marcado. · Filtra fuera lo que sea una decisión de la pantalla —una alerta, un periodo— y deja que el bloque se ocupe de la búsqueda. · Pasa `selected` y `onSelectedChange` cuando la pantalla tenga que reaccionar a la selección; si no, deja que el bloque la lleve. · Da `renderListItem` siempre que la lista se vaya a leer en móvil: la vista de lista es la que aguanta el ancho estrecho.
No: No lo uses para una tabla corta y fija dentro de un panel: ahí basta TableShell con una Table. · No repitas el buscador por fuera: si necesitas buscar sobre otro campo, cambia `searchBy`. · No metas el contador a mano en el `title`; para eso está `showCount`.
Relacionados: table-shell, list-item, status-badge, heatmap-matrix

## Iconos del registro

`<ThemaIcon name="…" />` · analytics, arrowLeft, arrowRight, award, bolt, building, calendar, chart, check, chevronDown, chevronLeft, chevronRight, chevronUp, close, code, dashboard, download, error, file, filter, graduation, help, home, info, layers, logout, moon, neutral, notification, palette, search, settings, sparkles, success, sun, survey, templates, trendDown, trendUp, upload, users, vacancies, warning
