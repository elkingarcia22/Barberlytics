import * as React from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { PreviewCard, type MediaItem } from "@/components/media";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { COURSE_ITEMS, ICON_ITEMS } from "./fixtures";

const ITEM_BY_ID = Object.fromEntries([...COURSE_ITEMS, ...ICON_ITEMS].map((item) => [item.id, item])) as Record<string, MediaItem>;
const ITEM_IDS = Object.keys(ITEM_BY_ID);

/** Fila de tarjetas con selección única. */
function SelectableRow() {
  const [selectedId, setSelectedId] = React.useState<string | null>(COURSE_ITEMS[0].id);
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {COURSE_ITEMS.slice(0, 3).map((item) => (
        <PreviewCard key={item.id} item={item} selected={item.id === selectedId} onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))} />
      ))}
    </div>
  );
}

export const previewCardEntry = defineEntry({
  id: "preview-card",
  name: "PreviewCard",
  group: "media",
  description:
    "La tarjeta individual de un `MediaItem`: imagen 16:9 o icono por tipo, badge, título, metadato y descripción, con un pie opcional de acciones. Es la pieza que usan los carruseles y las grillas cuando necesitas control ítem a ítem.",
  importPath: 'import { PreviewCard } from "@/components/media"',
  sourcePath: "src/components/media/PreviewCard.tsx",
  status: "stable",
  tags: ["card", "seleccion"],
  playground: definePlayground({
    controls: {
      item: { type: "select", label: "Ítem", options: ITEM_IDS, default: COURSE_ITEMS[0].id },
      selectable: { type: "boolean", label: "Seleccionable", default: true },
      selected: { type: "boolean", label: "Seleccionada", default: false },
      withActions: { type: "boolean", label: "Con acciones", default: false },
      disabled: { type: "boolean", default: false },
    },
    render: ({ item, selectable, selected, withActions, disabled }) => (
      <PreviewCard
        item={ITEM_BY_ID[item]}
        selected={selected}
        disabled={disabled}
        onSelect={selectable ? () => undefined : undefined}
        actions={
          withActions ? (
            <>
              <Button size="xs" variant="outline">
                <Eye /> Ver
              </Button>
              <Button size="xs" variant="ghost">
                <Download /> Descargar
              </Button>
            </>
          ) : undefined
        }
        className="w-72"
      />
    ),
    code: ({ item, selectable, selected, withActions, disabled }) => {
      const attrs = [
        selectable ? "onSelect={handleSelect}" : "",
        selected ? "selected" : "",
        disabled ? "disabled" : "",
        withActions ? 'actions={<Button size="xs" variant="outline"><Eye /> Ver</Button>}' : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `const item: MediaItem = { id: "${item}", title: "${ITEM_BY_ID[item].title}", kind: "${ITEM_BY_ID[item].kind}", … };

<PreviewCard item={item}${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Tarjeta básica",
      description: "Sin `onSelect` la tarjeta es solo informativa: no cambia el cursor ni muestra el indicador.",
      code: `<PreviewCard item={item} className="w-72" />`,
      render: () => <PreviewCard item={COURSE_ITEMS[0]} className="w-72" />,
    },
    {
      id: "selectable",
      title: "Selección única",
      description: "Con `onSelect` aparece el círculo al pasar el ratón; `selected` lo marca y resalta el borde.",
      layout: "stretch",
      code: `const [selectedId, setSelectedId] = React.useState<string | null>(null);

{items.map((item) => (
  <PreviewCard
    key={item.id}
    item={item}
    selected={item.id === selectedId}
    onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
  />
))}`,
      render: () => <SelectableRow />,
    },
    {
      id: "actions",
      title: "Con acciones",
      description: "El pie de acciones detiene la propagación del click, así los botones no disparan `onSelect`.",
      layout: "stretch",
      code: `<PreviewCard
  item={item}
  onSelect={handleSelect}
  actions={
    <>
      <Button size="xs" variant="outline"><Eye /> Ver</Button>
      <Button size="xs" variant="ghost"><Download /> Descargar</Button>
      <Button size="xs" variant="ghost" className="ml-auto text-destructive" aria-label="Eliminar"><Trash2 /></Button>
    </>
  }
/>`,
      render: () => (
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {COURSE_ITEMS.slice(2, 4).map((item) => (
            <PreviewCard
              key={item.id}
              item={item}
              onSelect={() => undefined}
              actions={
                <>
                  <Button size="xs" variant="outline">
                    <Eye /> Ver
                  </Button>
                  <Button size="xs" variant="ghost">
                    <Download /> Descargar
                  </Button>
                  <Button size="xs" variant="ghost" className="ml-auto text-destructive" aria-label="Eliminar">
                    <Trash2 />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      ),
    },
    {
      id: "kinds",
      title: "Sin miniatura y deshabilitada",
      description: "Sin `src` se muestra el icono de `kind`. `disabled` baja la opacidad, desatura y bloquea el click.",
      layout: "stretch",
      code: `<PreviewCard item={{ id: "doc", title: "Documento", kind: "document", metadata: "PDF" }} />
<PreviewCard item={{ id: "vid", title: "Video sin miniatura", kind: "video" }} disabled />`,
      render: () => (
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ICON_ITEMS.map((item, index) => (
            <PreviewCard key={item.id} item={item} disabled={index === 1} onSelect={() => undefined} />
          ))}
        </div>
      ),
    },
  ],
  props: [
    { name: "item", type: "MediaItem", description: "El recurso: `title`, `src`, `alt`, `kind`, `badge`, `metadata`, `description`." },
    { name: "selected", type: "boolean", default: "false", description: "Marca la tarjeta con borde primario e indicador." },
    { name: "disabled", type: "boolean", default: "false", description: "Opacidad reducida, escala de grises y sin click." },
    { name: "onSelect", type: "(id: string) => void", description: "Hace la tarjeta clicable y muestra el indicador de selección." },
    { name: "actions", type: "ReactNode", description: "Botones en el pie; no propagan el click a la tarjeta." },
    { name: "className", type: "string", description: "Clases extra (p. ej. un ancho fijo)." },
  ],
  guidelines: {
    do: [
      "Usa botones `size=\"xs\"` en `actions` para respetar la densidad de la tarjeta.",
      "Fija el ancho desde fuera (grid o `className`); la tarjeta se estira al contenedor.",
    ],
    dont: [
      "No pongas `onSelect` si no hay una selección real: el indicador confunde.",
      "No metas más de tres acciones en el pie; el resto va a un menú.",
    ],
  },
  related: ["image-grid", "thema-carousel", "card", "file-preview"],
});
