# Chip

Pastilla compacta para filtros, etiquetas y sugerencias. Ocho tonos semánticos (incluido el degradado de IA), dos tamaños, contador opcional y modo seleccionable o removible.

Familia: IA · Doc: `/docs#/components/chip` · Fuente: `src/components/ai-interaction/Chip.tsx`

```ts
import { Chip } from "@/components/ai-interaction"
```

## Props

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

## Guías

- Sí: Usa `selected` + `onClick` para filtros de selección múltiple.
- Sí: Reserva el tono `ai` para sugerencias o etiquetas generadas por la IA.
- Sí: Mantén las etiquetas cortas: el texto se trunca, no salta de línea.
- No: No uses chips como acciones primarias; para eso está Button.
- No: No mezcles `removable` con `onClick` en el mismo grupo sin necesidad: confunde el gesto.
- No: No uses el degradado de IA en chips que no vienen de la IA.

Relacionados: badge, ai-button, toggle-group

## Ejemplos

### Tonos

Los tonos de estado se reservan para significado; `ai` marca contenido o sugerencias que vienen de la IA.

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

### Filtros seleccionables

Con `onClick` el chip se convierte en un botón con `aria-pressed`; `selected` invierte el color.

```tsx
const [selected, setSelected] = React.useState<string[]>(["Ventas"]);
const toggle = (area: string) =>
  setSelected((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));

{["Ventas", "Producto", "Operaciones", "Talento"].map((area) => (
  <Chip key={area} label={area} icon="users" selected={selected.includes(area)} onClick={() => toggle(area)} />
))}
```

### Removibles

El botón de cierre dispara `onRemove` sin propagar el click al chip.

```tsx
const [tags, setTags] = React.useState(["Q3 2026", "Bogotá", "Remoto"]);

{tags.map((tag) => (
  <Chip key={tag} label={tag} tone="muted" removable onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))} />
))}
```

### Contador y tamaños

```tsx
<Chip label="Pendientes" count={8} size="sm" />
<Chip label="Pendientes" count={8} />
<Chip label="Sugerencias" tone="ai" icon="sparkles" count={3} />
```
