# SingleSelect

El select de una opción con el mismo trigger y lista que MultiSelect: fondo muted, filas redondeadas y check a la derecha. Úsalo en formularios donde conviven ambos para que los triggers se vean idénticos.

Familia: Formularios · Doc: `/docs#/components/single-select` · Fuente: `src/components/forms/SingleSelect.tsx`

```ts
import { SingleSelect } from "@/components/forms/SingleSelect"
```

## Props

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

## Guías

- Sí: Úsalo junto a MultiSelect para que ambos triggers compartan estilo.
- Sí: Mantén los labels cortos: el trigger trunca en una línea.
- No: No lo importes desde el barrel `@/components/forms`: no está exportado ahí.
- No: No lo uses para listas largas que requieran filtrar: SearchableSelect sí filtra.

Relacionados: multi-select, searchable-select, select, field

## Ejemplos

### Controlado

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

### Con descripciones dentro de un Field

La descripción del Field cambia según la opción elegida.

```tsx
<Field label="Plan de la organización" description={plan?.description ?? "Define cuántos colaboradores puedes invitar."}>
  <SingleSelect
    options={[
      { value: "starter", label: "Starter", description: "Hasta 50 colaboradores" },
      { value: "growth", label: "Growth", description: "Hasta 500 colaboradores" },
      { value: "legacy", label: "Plan legado", description: "Ya no disponible", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Elige un plan"
  />
</Field>
```

### Deshabilitado

```tsx
<SingleSelect options={levels} value="advanced" disabled />
```
