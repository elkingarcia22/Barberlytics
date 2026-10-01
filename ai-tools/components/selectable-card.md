# SelectableCard

La tarjeta individual que usan CardSelection y CheckboxCardGroup, expuesta como pieza suelta con `selected` y `onSelect`. Úsala cuando necesites tu propia grilla, un layout mixto o una lógica de selección que los grupos no cubren.

Familia: Selección · Doc: `/docs#/components/selectable-card` · Fuente: `src/components/selection/SelectableCard.tsx`

```ts
import { SelectableCard } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `SelectionOption` |  | Los datos de la tarjeta: value, label, description, eyebrow, badge, icon, disabled. |
| `selected` | `boolean` | `false` | Estado elegido; controla borde, ring e indicador. |
| `disabled` | `boolean` | `false` | Deshabilita la tarjeta además de option.disabled. |
| `onSelect` | `(value: string) => void` |  | Se llama con option.value al pulsar. |
| `mode` | `"single" \| "multiple"` | `"single"` | Define el role (radio o checkbox) y el indicador. |
| `className` | `string` |  | Clases para el botón exterior. |

## Guías

- Sí: Úsala cuando la grilla o la lógica no encajan en los grupos ya hechos.
- Sí: Mantén el role coherente con la lógica: single para uno, multiple para varios.
- No: No reconstruyas CardSelection a mano si el grupo ya resuelve el caso.
- No: No olvides el estado disabled visual cuando una opción no aplica.

Relacionados: card-selection, checkbox-card-group, option-tile, card

## Ejemplos

### Grilla propia en modo único

El consumidor decide la grilla; la tarjeta solo sabe si está elegida.

```tsx
const [value, setValue] = React.useState<string>("video");

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {blocks.map((option) => (
    <SelectableCard key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>
```

### Modo múltiple

Con mode="multiple" el rol es checkbox y el indicador muestra un círculo vacío al pasar el cursor.

```tsx
const toggle = (next: string) =>
  setValues((prev) => (prev.includes(next) ? prev.filter((v) => v !== next) : [...prev, next]));

{blocks.map((option) => (
  <SelectableCard key={option.value} option={option} mode="multiple" selected={values.includes(option.value)} onSelect={toggle} />
))}
```

### Deshabilitada

```tsx
<SelectableCard option={{ value: "module", label: "Módulo", description: "Agrupa varios bloques.", icon: Layers, disabled: true }} />
```
