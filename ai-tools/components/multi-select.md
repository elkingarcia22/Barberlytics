# MultiSelect

Un combobox controlado para elegir varias opciones, que muestra lo elegido como chips removibles dentro del trigger. Úsalo cuando el usuario necesita combinar etiquetas, áreas o habilidades sin abandonar el formulario.

Familia: Formularios · Doc: `/docs#/components/multi-select` · Fuente: `src/components/forms/MultiSelect.tsx`

```ts
import { MultiSelect } from "@/components/forms"
```

## Props

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

## Guías

- Sí: Úsalo a partir de 5 opciones; con menos, un CheckboxCardGroup se lee mejor.
- Sí: Envuélvelo en un Field para etiqueta, ayuda y error.
- Sí: Ordena las opciones por frecuencia de uso o alfabéticamente.
- No: No lo uses para una sola elección: para eso está SingleSelect.
- No: No superes 3 o 4 chips visibles sin dar un resumen (`+N`) desde el consumidor.

Relacionados: single-select, searchable-select, checkbox-card-group, field, badge

## Ejemplos

### Controlado

El valor es un arreglo de strings; cada chip tiene su propia X para quitarlo.

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

### Con descripciones y opción deshabilitada

```tsx
<Field label="Áreas participantes" description="Finanzas no puede añadirse desde aquí.">
  <MultiSelect
    options={[
      { value: "sales", label: "Comercial", description: "Equipos de venta y preventa" },
      { value: "finance", label: "Finanzas", description: "Solo lectura", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Elige una o varias áreas"
  />
</Field>
```

### Con límite de selección

El límite vive en el onValueChange del consumidor; el componente no lo impone.

```tsx
const MAX = 2;
const handleChange = (next: string[]) => setValue(next.slice(0, MAX));

<Field label="Habilidades prioritarias" error={value.length >= MAX ? `Máximo ${MAX} habilidades.` : undefined}>
  <MultiSelect options={options} value={value} onValueChange={handleChange} placeholder="Hasta dos habilidades" />
</Field>
```
