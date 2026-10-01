# TemplateCatalogDrawer

El catálogo de plantillas en un panel: galería por estantes con buscador y dos vistas, una plantilla destacada arriba, y un paso más adentro la ficha con las líneas que trae, su peso dibujado y una fila de alternativas. Usa las mismas TemplateTile que van en la página, así que la plantilla que alguien reconoció fuera es la que reconoce dentro.

Familia: Overlays · Doc: `/docs#/components/template-catalog-drawer` · Fuente: `src/components/templates/TemplateCatalogDrawer.tsx`

```ts
import { TemplateCatalogDrawer } from "@/components/templates"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open` | `boolean` |  | Si el panel está abierto. |
| `onOpenChange` | `(open: boolean) => void` |  | Cambio de apertura. |
| `groups` | `readonly TemplateGroup[]` |  | El catálogo, por estantes: id, label, description, icon y templates de cada uno. Con un solo estante la cabecera no se dibuja. |
| `onUseTemplate` | `(template: TemplateDefinition) => void` |  | Adelante con la plantilla. Qué signifique «usarla» lo decide quien monta el panel; cerrarlo también. |
| `initialTemplateId` | `string \| null` |  | Abre directamente en esa ficha en vez de en la galería. Se vuelve a leer en cada apertura. |
| `title` | `string` | `"Empieza con una plantilla"` | Título del panel. |
| `description` | `string` |  | Subtítulo del panel. |

## Guías

- Sí: Marca una plantilla con featured y escríbele un pitch: una rejilla de fichas iguales deja la primera decisión entera en manos de quien mira.
- Sí: Rellena el hint de cada línea cuando el nombre no baste: la ficha es donde se decide si la plantilla vale.
- Sí: Cierra el panel desde onUseTemplate, cuando ya sepas que la acción salió bien.
- Sí: Agrupa por categorías de verdad: dentro de un estante las plantillas tienen que competir entre sí.
- No: No dupliques el catálogo entre la página y el panel: pásale los mismos datos a los dos.
- No: No metas la lógica del dominio aquí; el panel solo sabe de líneas con nombre y peso.
- No: No abras el panel con initialTemplateId fijo si el atajo cambia: se lee en cada apertura, no una sola vez.
- No: No lo uses para elegir entre dos o tres opciones: para eso está CardSelection.

Relacionados: template-tile, drawer-shell, drawer-section, card-selection

## Ejemplos

### Desde la estantería a la ficha

Un atajo de fuera abre el panel directamente en la plantilla que señala; el estado se lee en cada apertura, así que cada botón cae en la suya.

```tsx
const [openId, setOpenId] = React.useState<string | null>(null);

<TemplateCatalogDrawer
  open={openId !== null}
  onOpenChange={(next) => !next && setOpenId(null)}
  groups={estantes}
  initialTemplateId={openId}
  onUseTemplate={usar}
/>
```

### Catálogo sin estantes

Con un solo grupo la galería se dibuja sin su cabecera: no hay nada que distinguir de nada.

```tsx
<TemplateCatalogDrawer
  open={open}
  onOpenChange={setOpen}
  groups={[{ id: "todas", label: "Todas las plantillas", templates }]}
  onUseTemplate={usar}
/>
```

### Otro dominio, mismo panel

El panel no sabe de qué son las líneas de una plantilla. Cambiando title y description sirve igual para encuestas, cursos o procesos.

```tsx
<TemplateCatalogDrawer
  open={open}
  onOpenChange={setOpen}
  groups={estantes}
  title="Encuestas listas para lanzar"
  description="Cada una trae sus preguntas escritas y el peso con el que entran al resultado."
  onUseTemplate={usar}
/>
```
