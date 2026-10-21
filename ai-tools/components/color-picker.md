# ColorPicker (beta)

Elegir un color dentro del espectro: área de saturación y brillo, barra de matiz y el HEX escrito, con una fila opcional de muestras sugeridas (los colores de un logo, la paleta de la marca). Se maneja con ratón, dedo o teclado; entra y sale HEX `#RRGGBB`.

Familia: Formularios · Doc: `/docs#/components/color-picker` · Fuente: `src/components/forms/ColorPicker.tsx`

```ts
import { ColorPicker } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `string` |  | Color actual en HEX `#RRGGBB` (controlado). |
| `onChange` | `(color: string) => void` |  | Se llama con el HEX en mayúsculas al arrastrar, teclear (al salir del campo o con Enter) o elegir una muestra. |
| `label` | `string` | `"Color"` | Nombre accesible; de él salen los del área, la barra de matiz y el campo HEX. |
| `swatches` | `{ color: string; label?: string }[]` |  | Muestras sugeridas encima del espectro. |
| `swatchesLabel` | `string` | `"Sugeridos"` | Título de la fila de muestras. |
| `className` | `string` |  | Se aplica al contenedor externo. |

## Guías

- Sí: Úsalo cuando el color es un dato que la persona decide (su marca, una categoría), no para elegir entre unos pocos tonos fijos.
- Sí: Ofrece `swatches` cuando hay colores que probablemente quiere (los de su logo, los ya usados): casi nadie atina un color de marca a mano.
- Sí: Si el color se usa como texto o fondo de interfaz, ajústalo después para que contraste (el tema «Personalizado» lo hace con `fitToMode`) y dilo.
- No: No lo uses para elegir entre los colores del sistema: para eso están los presets y los tonos semánticos.
- No: No pintes con el valor tal cual texto pequeño sin comprobar el contraste.

Relacionados: field, single-select

## Ejemplos

### Color de marca con los colores del logo

Es lo que usa el tema «Personalizado» de Personalización: arriba los colores que se leyeron del logo, debajo el espectro para afinarlos. Las muestras se marcan cuando coinciden con el color elegido.

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  label="Color primario"
  swatches={logoColors.map((color) => ({ color, label: `Del logo: ${color}` }))}
  swatchesLabel="Colores de tu logo"
/>
```

### Dentro de un formulario

Con `Field` para la etiqueta y la ayuda; el selector ya trae sus propios nombres accesibles a partir de `label`.

```tsx
<Field label="Color de la categoría" description="Se ve en la agenda y en los reportes.">
  <ColorPicker value={color} onChange={setColor} label="Color de la categoría" />
</Field>
```
