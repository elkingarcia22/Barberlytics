# ActivityDropdown

Tarjeta de actividad reciente que se despliega al hacer clic: la cabecera se mantiene y las filas entran en cascada. Úsala en un panel lateral o en el inicio para resumir lo que pasó sin abrir una pantalla de notificaciones.

Familia: Primitivos · Doc: `/docs#/components/activity-dropdown` · Fuente: `src/components/ui/activity-dropdown.tsx`

```ts
import { ActivityDropdown, type ActivityItem } from "@/components/ui/activity-dropdown"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `ActivityItem[]` |  | Las filas: `{ id, title, description?, time, icon?, tone?, onClick? }`. Vacío muestra `emptyLabel`. |
| `title` | `string` | `"Actividad reciente"` | Título de la cabecera. El contador de filas se añade solo. |
| `description` | `string` |  | Frase de apoyo; solo se ve con la tarjeta cerrada. |
| `defaultOpen` | `boolean` | `false` | Estado inicial cuando el componente se gobierna solo. |
| `open / onOpenChange` | `boolean / (open: boolean) => void` |  | Estado controlado desde fuera; con él manda quien lo pasa. |
| `emptyLabel` | `string` |  | Texto cuando no hay actividad. |
| `className` | `string` |  | Para el layout de afuera: ancho y márgenes. |

## Guías

- Sí: Formatea `time` antes de pasarlo: el componente no calcula fechas relativas.
- Sí: Da `onClick` solo a las filas que de verdad llevan a algún sitio.
- Sí: Úsala para un resumen corto; si hay más de diez avisos, lleva a la pantalla de notificaciones.
- No: No la uses como menú del header: para eso está el Popover con la lista de notificaciones.
- No: No metas dos acciones en una fila; la fila entera es la acción.
- No: No repitas el tono de estado para decorar: `negative` significa que algo falló.

Relacionados: accordion, popover, card, list-item

## Ejemplos

### Por defecto

Haz clic en la cabecera para abrir y cerrar. Las filas entran escalonadas y el radio crece al expandirse.

```tsx
const actividad: ActivityItem[] = [
  { id: "mensaje", icon: <MessageCircle />, tone: "primary", title: "Mensaje nuevo", description: "Sara Restrepo te escribió sobre el plan de onboarding.", time: "Justo ahora" },
  { id: "insignia", icon: <Award />, tone: "positive", title: "Insignia conseguida", description: "Completaste «Seguridad en planta» con 92 %.", time: "Hace 2 min" },
  { id: "sesion", icon: <CalendarClock />, tone: "warning", title: "Sesión en 30 minutos", description: "Inducción operativa · Sala Bogotá 3.", time: "Hace 3 h" },
  { id: "tarea", icon: <ClipboardCheck />, title: "Tarea asignada", description: "Revisar las 12 postulaciones de Analista de datos.", time: "Ayer" },
];

<ActivityDropdown items={actividad} />
```

### Filas que llevan a algún sitio

Con `onClick` cada fila se vuelve un botón real, navegable con el teclado.

```tsx
<ActivityDropdown
  items={actividad.map((item) => ({ ...item, onClick: () => abrir(item.id) }))}
  defaultOpen
/>
```

### Sin actividad

Con la lista vacía la tarjeta se queda en su cabecera y explica que no hay nada que mirar.

```tsx
<ActivityDropdown items={[]} emptyLabel="Cuando pase algo en tu equipo, aparecerá aquí." />
```

### Tonos

El tono colorea el chip del icono y dice de qué va el aviso: `primary` informa, `positive` celebra, `warning` recuerda y `negative` alerta.

```tsx
{ id: "vencido", icon: <TriangleAlert />, tone: "negative", title: "Plan vencido", description: "«Inducción comercial» cerró con 8 personas sin terminar.", time: "Hace 1 h" }
```
