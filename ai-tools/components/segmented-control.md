# SegmentedControl

Un grupo de botones pegados para alternar entre pocas opciones excluyentes, en tres variantes (sólido, contorno y subrayado) y dos tamaños. Úsalo para cambiar de vista, de periodo o de estado sin abrir un menú.

Familia: Selección · Doc: `/docs#/components/segmented-control` · Fuente: `src/components/selection/SegmentedControl.tsx`

```ts
import { SegmentedControl } from "@/components/selection"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `options` | `SelectionOption[]` |  | Se usan value, label, icon y disabled; description, eyebrow y badge se ignoran. |
| `value` | `string` |  | Segmento activo (controlado). |
| `onChange` | `(value: string) => void` |  | Se llama al pulsar un segmento. |
| `variant` | `"solid" \| "outline" \| "underline"` | `"solid"` | Estilo del contenedor y del segmento activo. |
| `size` | `"sm" \| "md"` | `"md"` | Altura y tipografía de los segmentos. |
| `fullWidth` | `boolean` | `false` | Reparte el ancho del contenedor entre los segmentos. |
| `disabled` | `boolean` | `false` | Deshabilita todos los segmentos. |
| `label` | `string` |  | Etiqueta del Field envolvente. |
| `description` | `string` |  | Ayuda bajo el control. |
| `error` | `string` |  | Mensaje de error del Field. |
| `ariaLabel` | `string` |  | aria-label del radiogroup cuando no hay label visible. |
| `className` | `string` |  | Clases para el contenedor. |

## Guías

- Sí: Úsalo con 2 a 5 opciones de label corto.
- Sí: Pasa `ariaLabel` siempre que no haya `label` visible.
- Sí: Usa underline cuando el control actúa como filtro de una tabla o lista.
- Sí: En los menús del marco (Personalización, selector de tema) envuélvelo en `SegmentedGroup` de `@/components/ui/segmented-group`: pone la etiqueta en versalitas de 11px encima. En una pantalla, el título de la sección va en la escala normal, sin mayúsculas.
- No: No lo uses para navegar entre páginas: para eso están Tabs.
- No: No pongas labels largos: el segmento trunca y pierde sentido.
- No: No pintes otro grupo de botones a mano para elegir una opción: el sólido ya comparte pista y activo con las pestañas `view`.
- No: No lo metas, ni metas otras pestañas, dentro de una pestaña para filtrar una lista: ahí van chips (`Chip` con `selected` y `count`).

Relacionados: tabs, radio-group, option-tile, card-selection

## Ejemplos

### Cambio de vista (solid)

El segmento activo se eleva sobre el fondo muted.

```tsx
<SegmentedControl
  ariaLabel="Modo de vista"
  options={[
    { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
    { value: "list", label: "Lista", icon: List },
    { value: "table", label: "Tabla", icon: Table2 },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Periodos (outline, sm) con opción deshabilitada

```tsx
<SegmentedControl
  variant="outline"
  size="sm"
  ariaLabel="Periodo"
  options={[
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "90d", label: "90 días" },
    { value: "custom", label: "Personalizado", icon: Calendar, disabled: true },
  ]}
  value={value}
  onChange={setValue}
/>
```

### Subrayado a ancho completo, con etiqueta

La variante underline se comporta como pestañas de filtro; label y description vienen del Field interno.

```tsx
<SegmentedControl
  variant="underline"
  fullWidth
  label="Estado"
  description="Filtra la tabla de programas."
  options={[
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "archived", label: "Archivados" },
  ]}
  value={value}
  onChange={setValue}
/>
```
