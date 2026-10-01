# Toggle

Botón de dos estados que se ve activo o inactivo en el acto: negrita, fijar, mostrar u ocultar. Comparte alturas con Button (28, 32 y 36px) para convivir en la misma barra. Para varias opciones relacionadas, usa ToggleGroup.

Familia: Primitivos · Doc: `/docs#/components/toggle` · Fuente: `src/components/ui/toggle.tsx`

```ts
import { Toggle } from "@/components/ui/toggle"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "outline"` | `"default"` | Sin borde (para barras) o con borde (para ir solo). |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | 28, 32 o 36px de alto, igual que Button. |
| `pressed / defaultPressed` | `boolean` |  | Estado controlado o inicial. |
| `onPressedChange` | `(pressed: boolean) => void` |  | Se dispara al conmutar. |
| `disabled` | `boolean` | `false` | Sin eventos y con opacidad al 50%. |
| `...props` | `React.ComponentProps<TogglePrimitive.Root>` |  | Radix expone `aria-pressed` y `data-state="on" \| "off"`. |

## Guías

- Sí: Etiqueta siempre con `aria-label` cuando solo lleva icono.
- Sí: Que el estado activo cambie algo visible al instante; si requiere guardar, usa Checkbox.
- Sí: Mantén la misma variante en toda la barra.
- No: No lo uses para navegar ni para abrir menús: ahí va Button.
- No: No lo uses para «sí / no» en formularios: eso es Switch o Checkbox.
- No: No cambies el icono y el color a la vez sin motivo; el fondo tintado ya marca el estado.

Relacionados: toggle-group, switch, button, segmented-control

## Ejemplos

### Formato de texto

Tres toggles independientes en la barra de un editor de descripción de vacante; cada uno guarda su propio estado.

```tsx
<Toggle aria-label="Negrita"><Bold /></Toggle>
<Toggle aria-label="Cursiva"><Italic /></Toggle>
<Toggle aria-label="Subrayado"><Underline /></Toggle>
```

### Controlado: fijar un curso

`pressed` y `onPressedChange` dejan el estado en el padre, que aquí cambia la línea de ayuda de la tarjeta.

```tsx
const [pinned, setPinned] = React.useState(false);

<Toggle aria-label="Fijar curso" size="sm" pressed={pinned} onPressedChange={setPinned}>
  <Pin className={pinned ? "fill-current" : undefined} />
</Toggle>
```

### Outline con texto

La variante `outline` se lee como botón; conviene cuando el toggle va solo y no dentro de una barra.

```tsx
<Toggle variant="outline" size="sm" aria-label="Mostrar salario" pressed={visible} onPressedChange={setVisible}>
  {visible ? <EyeOff /> : <Eye />}
  {visible ? "Ocultar" : "Mostrar"}
</Toggle>
```

### Tamaños

```tsx
<Toggle size="sm" aria-label="Negrita"><Bold /></Toggle>
<Toggle aria-label="Negrita"><Bold /></Toggle>
<Toggle size="lg" aria-label="Negrita"><Bold /></Toggle>
```
