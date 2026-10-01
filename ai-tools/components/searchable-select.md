# SearchableSelect

Un select de una sola opción con búsqueda integrada en el popover, filtrada por cmdk. Úsalo cuando la lista supera las diez opciones o el usuario sabe lo que busca y prefiere escribir a desplazarse.

Familia: Formularios · Doc: `/docs#/components/searchable-select` · Fuente: `src/components/forms/SearchableSelect.tsx`

```ts
import { SearchableSelect } from "@/components/forms"
```

## Props

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

## Guías

- Sí: Úsalo a partir de ~10 opciones o con nombres propios (personas, ciudades).
- Sí: Aprovecha `description` para desambiguar homónimos.
- Sí: Personaliza `emptyMessage` con una acción posible cuando exista.
- No: No lo uses para 3 o 4 opciones: el buscador estorba; usa Select o SegmentedControl.
- No: No dependas del filtro para listas de miles: pagina o busca en servidor.

Relacionados: single-select, multi-select, select, field, popover

## Ejemplos

### Controlado con filtro

Abre el popover y escribe: la lista se filtra por el label de cada opción.

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

### Con descripciones, requerido y opción deshabilitada

El error desaparece al elegir un responsable.

```tsx
<Field label="Responsable del programa" required error={value ? undefined : "Elige un responsable para continuar."}>
  <SearchableSelect
    options={[
      { value: "ana", label: "Ana Rodríguez", description: "Gerente comercial · Bogotá" },
      { value: "carlos", label: "Carlos Peña", description: "Fuera de la organización", disabled: true },
    ]}
    value={value}
    onValueChange={setValue}
    placeholder="Buscar por nombre"
    emptyMessage="Ninguna persona coincide."
  />
</Field>
```

### Deshabilitado

```tsx
<SearchableSelect options={countries} value="co" disabled />
```
