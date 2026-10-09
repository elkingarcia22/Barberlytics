# DrawerSection

La tarjeta con la que se arman todos los drawers del producto: chip de icono en su tono, título, una línea de ayuda y, bajo la divisoria, el contenido. Cambian el icono, el tono y el texto; nunca la anatomía.

Familia: Overlays · Doc: `/docs#/components/drawer-section` · Fuente: `src/components/overlays/DrawerSection.tsx`

```ts
import { DrawerSection } from "@/components/overlays"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `icon` | `LucideIcon` |  | Icono del chip de cabecera. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral" \| "ai"` |  | Tono del chip: fondo claro y glifo en el acento. |
| `title` | `string` |  | Título de la sección. |
| `hint` | `string` |  | Una línea que explica para qué sirve. |
| `badge` | `string` |  | Dato al vuelo junto al título, p. ej. un recuento. |
| `action` | `React.ReactNode` |  | Acción alineada a la derecha; sus clics no pliegan la sección. |
| `stickyHeader` | `boolean` |  | Fija la cabecera al hacer scroll dentro del panel. |
| `collapsible` | `boolean` | `false` | La cabecera pliega y despliega el contenido. |
| `defaultOpen` | `boolean` | `false` | Si es plegable, arranca abierta. |
| `className / contentClassName` | `string` |  | Solo para layout (alto, scroll); nunca color ni borde. |

## Guías

- Sí: Elige el tono por lo que significa el bloque, no por variar colores.
- Sí: Usa `stickyHeader` solo cuando la acción vive en la cabecera.
- Sí: Apila varias secciones en un drawer con `space-y-3`.
- No: No metas un acordeón dentro del cuerpo: usa `collapsible`.
- No: No cambies el borde ni el fondo por `className`; la anatomía es compartida.

Relacionados: drawer-shell, modal-shell, button

## Ejemplos

### Con acción y badge

La acción opera sobre el contenido y vive en la cabecera; el badge cuenta lo que hay dentro.

```tsx
const [options, setOptions] = React.useState(["Muy en desacuerdo", "En desacuerdo", "De acuerdo"]);

<DrawerSection
  icon={ListChecks}
  tone="brand"
  title="Opciones de respuesta"
  hint="Lo que la persona puede elegir al contestar."
  badge={String(options.length)}
  action={<Button size="xs" variant="outline" onClick={add}><Plus /> Agregar</Button>}
>
  {options.map((option) => <Input defaultValue={option} />)}
</DrawerSection>
```

### Plegable

La cabecera entera es el disparador; el chevron indica el estado. Para contenido de referencia.

```tsx
<DrawerSection
  icon={Sparkles}
  tone="ai"
  title="Sugerencias de Clipper"
  hint="Tres redacciones alternativas para el objetivo."
  collapsible
>
  <ul>…</ul>
</DrawerSection>
```

### Cabecera fija

`stickyHeader` mantiene título y acción a la vista mientras el contenido se desplaza.

```tsx
<div className="h-[280px] overflow-y-auto">
  <DrawerSection
    icon={Users}
    tone="neutral"
    title="Participantes"
    hint="Desplázate: la cabecera se queda arriba."
    badge="14"
    stickyHeader
    action={<Button size="xs" variant="outline"><Plus /> Invitar</Button>}
  >
    <ul>…</ul>
  </DrawerSection>
</div>
```
