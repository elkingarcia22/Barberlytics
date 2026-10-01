# Tree

Árbol jerárquico con expansión y selección: empresa → áreas → equipos, o cualquier estructura anidada que haya que recorrer o elegir. Implementa el patrón ARIA `tree` completo (foco itinerante, `aria-level`, indeterminado en la selección múltiple) para navegarse entero con el teclado.

Familia: Datos · Doc: `/docs#/components/tree` · Fuente: `src/components/data-display/Tree.tsx`

```ts
import { Tree } from "@/components/data-display/Tree"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `nodes` | `TreeNode[]` |  | La jerarquía completa; cada nodo puede traer sus propios `children`. |
| `selectable` | `"none" \| "single" \| "multiple"` | `"none"` | `multiple` añade casilla por nodo con propagación e indeterminado. |
| `size` | `"default" \| "sm"` | `"default"` | Alto de fila e íconos. Usa `sm` solo con dos niveles como máximo. |
| `expandedIds / defaultExpandedIds` | `string[]` |  | Ids abiertos, en modo controlado o inicial. |
| `onExpandedChange` | `(ids: string[]) => void` |  | Se dispara al abrir o cerrar un nodo. |
| `selectedIds / defaultSelectedIds` | `string[]` |  | Ids marcados, en modo controlado o inicial. |
| `onSelectedChange` | `(ids: string[]) => void` |  | Nueva selección completa, ya con los ancestros recalculados. |
| `emptyLabel` | `string` | `"Sin elementos"` | Texto cuando `nodes` viene vacío. |
| `TreeNode.id` | `string` |  | Identificador estable del nodo. |
| `TreeNode.label` | `string` |  | Etiqueta visible y accesible del nodo. |
| `TreeNode.icon` | `React.ReactNode` |  | Icono de 16px a la izquierda de la etiqueta. |
| `TreeNode.count` | `number` |  | Contador a la derecha, p. ej. cuántas personas cuelgan del nodo. |
| `TreeNode.disabled` | `boolean` |  | El nodo (y su rama) no se enfoca, no se selecciona y no cuenta para sus ancestros. |
| `TreeNode.children` | `TreeNode[]` |  | Nodos hijos; su presencia añade el chevron de expandir. |

## Guías

- Sí: Úsalo para jerarquías reales de al menos dos niveles; una lista plana no necesita `role="tree"`.
- Sí: Deja que el estado indeterminado comunique una selección parcial: no lo tapes con `className`.
- Sí: Marca `disabled` los nodos que no aplican en vez de quitarlos; la jerarquía se ve completa igual.
- No: No actives `selectable="multiple"` sin mostrar en algún lugar cuántos elementos quedaron seleccionados.
- No: No uses `size="sm"` en árboles de más de tres niveles: la indentación se vuelve ilegible.
- No: No dupliques la navegación con clics obligatorios; el árbol ya cubre flechas, Home, End y Espacio.

Relacionados: list-item, checkbox, badge

## Ejemplos

### Selección de audiencia

Marcar «Tecnología» selecciona sus tres equipos y deja a «Acme» indeterminado. El nodo deshabilitado (Nómina) no cuenta ni se puede marcar.

```tsx
const [selectedIds, setSelectedIds] = React.useState(["frontend", "backend"]);

<Tree
  nodes={nodes}
  selectable="multiple"
  defaultExpandedIds={["acme", "tecnologia", "personas"]}
  selectedIds={selectedIds}
  onSelectedChange={setSelectedIds}
/>
```

### Selección única

`selectable="single"` quita la casilla y marca un solo nodo a la vez; útil para elegir a quién reporta algo.

```tsx
const [selected, setSelected] = React.useState(["frontend"]);

<Tree nodes={nodes} selectable="single" selectedIds={selected} onSelectedChange={setSelected} />
```

### Con iconos y un nodo deshabilitado

El icono va a 16px a la izquierda de la etiqueta. «Nómina» está `disabled`: no se enfoca, no se selecciona y no cuenta para el indeterminado de su padre.

```tsx
<Tree
  nodes={[
    { id: "acme", label: "Acme", icon: <Building2 />, children: [
      { id: "personas", label: "Personas", icon: <Boxes />, children: [
        { id: "talento", label: "Talento", icon: <Users />, count: 4 },
        { id: "nomina", label: "Nómina", icon: <Users />, count: 3, disabled: true },
      ]},
    ]},
  ]}
  defaultExpandedIds={["acme", "personas"]}
/>
```

### Sin elementos

Con `nodes` vacío se muestra `emptyLabel` en lugar de un árbol en blanco.

```tsx
<Tree nodes={[]} emptyLabel="Sin áreas para esta empresa" />
```
