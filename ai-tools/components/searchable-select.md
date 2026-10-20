# SearchableSelect

Un select de una sola opción con búsqueda integrada en el popover, filtrada por cmdk. Úsalo cuando la lista supera las diez opciones o el usuario sabe lo que busca y prefiere escribir a desplazarse.

Familia: Formularios · Doc: `/docs#/components/searchable-select` · Fuente: `src/components/forms/SearchableSelect.tsx`

```ts
import { SearchableSelect } from "@/components/forms"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SearchableSelectOption[]` |  | Opciones con value, label, description, keywords, leading (avatar o miniatura) y disabled, todos opcionales salvo los dos primeros. Se filtra por label, description y keywords con la regla de todos los buscadores (`matchesSearchText`): todas las palabras, sin tildes, y un celular escrito como sea. |
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
- Sí: Si las opciones son personas, pon `keywords: personSearchText(persona)` para que se encuentren por celular y correo aunque no se muestren.
- Sí: Personaliza `emptyMessage` con una acción posible cuando exista.
- No: No lo uses para 3 o 4 opciones: el buscador estorba; usa Select o SegmentedControl.
- No: No dependas del filtro para listas de miles: pagina o busca en servidor.

Relacionados: single-select, multi-select, select, field, popover

## Ejemplos

### Controlado con filtro

Abre el popover y escribe: la lista se filtra por el label y la descripción de cada opción.

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

### Con avatar o miniatura

`leading` pinta la cara del cliente (o la miniatura de un servicio, con `IconTile src`) en cada opción y en el botón con la opción elegida. La búsqueda mira el label y la descripción, no el id.

```tsx
<SearchableSelect
  options={clients.map((client) => ({
    value: client.id,
    label: client.name,
    description: client.phone,
    leading: (
      <Avatar size="sm">
        {client.avatarUrl && <AvatarImage src={client.avatarUrl} alt="" />}
        <AvatarFallback>{initials(client.name)}</AvatarFallback>
      </Avatar>
    ),
  }))}
  value={clientId}
  onValueChange={setClientId}
/>
```

### Deshabilitado

```tsx
<SearchableSelect options={countries} value="co" disabled />
```
