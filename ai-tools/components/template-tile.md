# TemplateTile

La ficha de una plantilla: fondo degradado en su tono, una miniatura que dibuja las líneas que trae con sus barras de peso, la insignia clavada en una esquina, y debajo el nombre y la medida. La miniatura se dibuja con divs y tokens, así que hereda el tema y el modo claro/oscuro sin existir en dos versiones.

Familia: Selección · Doc: `/docs#/components/template-tile` · Fuente: `src/components/templates/TemplateTile.tsx`

```ts
import { TemplateTile } from "@/components/templates"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `template` | `TemplateDefinition` |  | La plantilla: id, label, name, description, meta, icon, tone e items (label y weight de cada línea). |
| `variant` | `"compact" \| "card" \| "row"` | `"compact"` | compact: fila con nombre y medida. card: portada degradada, nombre, para qué sirve y medida. row: fila a todo lo ancho. |
| `onClick` | `() => void` |  | Qué hace la ficha al pulsarse. |
| `dashed` | `boolean` | `false` | Ficha de «ver más»: contorno punteado, el icono solo, sin degradado ni insignia. |
| `className` | `string` |  | Clases para el botón exterior. |

## Guías

- Sí: Da a cada plantilla el tono que le corresponda: la estantería se lee por color antes que por nombre.
- Sí: Escribe meta con la medida real de la plantilla («3 elementos · Trimestre»): el sistema no sabe contar lo que no es suyo.
- Sí: Usa compact en una página, card en una galería que se abre y row para recorrer muchas de un vistazo.
- Sí: Reserva dashed para la ficha que abre el catálogo completo.
- No: No uses imágenes ni ilustraciones en la miniatura: se dibuja con divs y tokens para que siga al tema.
- No: No mezcles las tres variantes en la misma rejilla; elige una por superficie.
- No: No le pongas el tono ai a una plantilla cualquiera: su degradado está reservado para lo que de verdad es IA.
- No: No la uses como tarjeta de métrica: la ficha retrata contenido, no un número.

Relacionados: template-catalog-drawer, selectable-card, option-tile, drawer-shell

## Ejemplos

### La estantería de una página

La variante compacta: una fila de atajos con una ficha punteada al final que abre el catálogo completo.

```tsx
<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} onClick={() => usar(plantilla)} />
  ))}
  <TemplateTile template={verMas} dashed onClick={abrirCatalogo} />
</div>
```

### Galería con portada

La variante card lleva el degradado en la portada de la miniatura y deja la ficha en superficie limpia, para que la portada destaque contra ella.

```tsx
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} variant="card" onClick={() => abrir(plantilla)} />
  ))}
</div>
```

### Filas a todo lo ancho

La variante row cambia la luz del degradado por un barrido de izquierda a derecha: una luz de esquina se apaga al tercio del camino en una fila larga.

```tsx
<div className="flex flex-col gap-2">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} variant="row" onClick={() => abrir(plantilla)} />
  ))}
</div>
```

### El peso se ve antes de leerse

Las barras se dibujan en proporción a la línea que más pesa, no sobre un total fijo: un reparto plano y uno desigual se distinguen de un vistazo.

```tsx
const desigual = { ...plantilla, items: [
  { label: "La que manda", weight: 80 },
  { label: "La segunda", weight: 15 },
  { label: "La última", weight: 5 },
] };

<TemplateTile template={desigual} variant="card" onClick={abrir} />
```
