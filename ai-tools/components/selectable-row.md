# SelectableRow

Una fila de lista para elegir, con foto, texto y la marca de elegir a la derecha (SelectMark). El fondo —puntero y elegido— es de la fila entera, también cuando lleva un enlace o algo más debajo. Es la fila de las hojas de sede, servicios y barbero de la reserva en línea.

Familia: Selección · Doc: `/docs#/components/selectable-row` · Fuente: `src/components/selection/SelectableRow.tsx`

```ts
import { SelectableRow } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `role` | `"radio" \| "checkbox"` |  | Una sola opción o varias: pone el rol, `aria-checked` y la forma de la marca. |
| `checked` | `boolean` |  | Elegida: fondo de marca y marca rellena. |
| `label` | `string` |  | El nombre completo de la opción para el lector de pantalla. |
| `leading` | `ReactNode` |  | Lo de la izquierda: foto, avatar o IconTile. |
| `onClick` | `() => void` |  | Se llama al elegir. |
| `disabled` | `boolean` | `false` | Atenuada y sin respuesta. |
| `size` | `"default" \| "lg"` | `"default"` | `lg` sube el alto mínimo para el dedo (tablet, kiosco). |
| `action` | `{ label; ariaLabel; onClick }` |  | Un enlace bajo el texto («Ver perfil»), como botón aparte. |
| `below` | `ReactNode` |  | Algo más bajo el texto, dentro de la misma tarjeta. |
| `className` | `string` |  | Para el layout de afuera. |

## Guías

- Sí: Úsala en listas dentro de hojas y paneles, con el rol de grupo en el contenedor.
- Sí: Pon la foto en `leading` con IconTile: sin imagen cae a su icono.
- No: No metas un botón dentro del texto: usa `action`.
- No: No la uses para acciones: elegir no navega ni ejecuta.

Relacionados: select-mark, option-tile, list-item, selectable-card

## Ejemplos

### Elegir una: sedes

Con role="radio" la marca es un círculo; el contenedor pone role="radiogroup". «Ver detalle» es otro botón al lado de la fila, no dentro.

```tsx
<div role="radiogroup" aria-label="Sede" className="flex flex-col gap-0.5">
  {branches.map((branch) => (
    <SelectableRow key={branch.id} role="radio" checked={value === branch.id} label={`${branch.name}, ${branch.address}`} leading={<IconTile … />} onClick={() => setValue(branch.id)} action={{ label: "Ver detalle", ariaLabel: …, onClick: … }}>
      …
    </SelectableRow>
  ))}
</div>
```

### Elegir varias: servicios

Con role="checkbox" la marca es una casilla.

```tsx
<div role="group" aria-label="Servicios" className="flex flex-col gap-0.5">
  {services.map((service) => (
    <SelectableRow key={service.id} role="checkbox" checked={picked.includes(service.id)} label={service.name} leading={<IconTile … />} onClick={() => toggle(service.id)}>
      …
    </SelectableRow>
  ))}
</div>
```
