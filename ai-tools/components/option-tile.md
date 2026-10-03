# OptionTile

Un tile horizontal y compacto con icono, label, descripción y un radio a la derecha, pensado para listas densas. Úsalo cuando hay muchas opciones o poco espacio y las tarjetas grandes serían un exceso.

Familia: Selección · Doc: `/docs#/components/option-tile` · Fuente: `src/components/selection/OptionTile.tsx`

```ts
import { OptionTile } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `option` | `SelectionOption` |  | value, label, description, badge, icon y disabled. El eyebrow no se muestra. |
| `selected` | `boolean` | `false` | Estado elegido: borde primario, ring y radio relleno. |
| `disabled` | `boolean` | `false` | Deshabilita el tile además de option.disabled. |
| `onSelect` | `(value: string) => void` |  | Se llama con option.value al pulsar. |
| `compact` | `boolean` | `false` | Reduce padding e icono y oculta la descripción. |
| `className` | `string` |  | Clases para el botón. |

## Guías

- Sí: Úsalo en drawers, paneles laterales y listas de 5 o más opciones.
- Sí: Añade role=radiogroup o un aria-label al contenedor de la lista.
- No: No lo mezcles con SelectableCard en la misma lista.
- No: No uses compact si la descripción es lo que diferencia las opciones.

Relacionados: selectable-card, card-selection, radio-group

## Ejemplos

### Lista de selección única

Los tiles se apilan con space-y-2; el consumidor pone el role=radiogroup.

```tsx
const [value, setValue] = React.useState<string>("team");

<div className="space-y-2" role="radiogroup" aria-label="Visibilidad">
  {options.map((option) => (
    <OptionTile key={option.value} option={option} selected={value === option.value} onSelect={setValue} />
  ))}
</div>
```

### Compacto en grilla, selección múltiple

En modo compacto la descripción se oculta y el padding baja a 8px.

```tsx
<div className="grid grid-cols-2 gap-2">
  {options.map((option) => (
    <OptionTile key={option.value} option={option} compact selected={values.includes(option.value)} onSelect={toggle} />
  ))}
</div>
```
