import * as React from "react";
import { Download, Share2 } from "lucide-react";
import { MediaPreview, PreviewCard, type MediaItem } from "@/components/media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { defineEntry, definePlayground } from "../types";
import { COURSE_ITEMS, ICON_ITEMS } from "./fixtures";

const ITEM_BY_ID = Object.fromEntries([...COURSE_ITEMS, ...ICON_ITEMS].map((item) => [item.id, item])) as Record<string, MediaItem>;
const ITEM_IDS = Object.keys(ITEM_BY_ID);

function PreviewActions() {
  return (
    <>
      <Button size="sm" variant="outline">
        <Share2 /> Compartir
      </Button>
      <Button size="sm">
        <Download /> Descargar
      </Button>
    </>
  );
}

/** Lista maestro-detalle: la tarjeta elegida se previsualiza a la derecha. */
function MasterDetail() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = COURSE_ITEMS.find((item) => item.id === selectedId);
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-3">
        {COURSE_ITEMS.slice(0, 3).map((item) => (
          <PreviewCard key={item.id} item={item} selected={item.id === selectedId} onSelect={setSelectedId} />
        ))}
      </div>
      <MediaPreview item={selected} actions={selected ? <PreviewActions /> : undefined} />
    </div>
  );
}

/** Previsualización dentro de un Dialog. */
function PreviewDialog() {
  const item = COURSE_ITEMS[3];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Abrir previsualización</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle del recurso</DialogTitle>
          <DialogDescription>Revisa el material antes de asignarlo.</DialogDescription>
        </DialogHeader>
        <MediaPreview item={item} actions={<PreviewActions />} />
      </DialogContent>
    </Dialog>
  );
}

export const mediaPreviewEntry = defineEntry({
  id: "media-preview",
  name: "MediaPreview",
  group: "media",
  description:
    "La previsualización en detalle de un único `MediaItem`: imagen a tamaño completo o icono de tipo, título, metadatos, descripción y acciones. Sin `item` muestra un estado vacío listo para drawers y paneles maestro-detalle.",
  importPath: 'import { MediaPreview } from "@/components/media"',
  sourcePath: "src/components/media/MediaPreview.tsx",
  status: "stable",
  tags: ["detalle", "estado-vacio"],
  playground: definePlayground({
    controls: {
      item: { type: "select", label: "Ítem", options: ITEM_IDS, default: COURSE_ITEMS[0].id },
      withActions: { type: "boolean", label: "Con acciones", default: true },
      customMetadata: { type: "boolean", label: "Metadata custom", default: false },
      empty: { type: "boolean", label: "Sin ítem", default: false },
    },
    layout: "stretch",
    render: ({ item, withActions, customMetadata, empty }) => (
      <MediaPreview
        item={empty ? undefined : ITEM_BY_ID[item]}
        actions={withActions ? <PreviewActions /> : undefined}
        metadata={
          customMetadata ? (
            <span className="flex items-center gap-2">
              <Badge variant="secondary">v3</Badge>
              Actualizado hace 2 días · 4,8 ★
            </span>
          ) : undefined
        }
        className="w-full"
      />
    ),
    code: ({ item, withActions, customMetadata, empty }) => {
      const attrs = [
        `item={${empty ? "undefined" : "item"}}`,
        withActions ? 'actions={<Button size="sm"><Download /> Descargar</Button>}' : "",
        customMetadata ? "metadata={<><Badge variant=\"secondary\">v3</Badge> Actualizado hace 2 días</>}" : "",
      ]
        .filter(Boolean)
        .map((attr) => `\n  ${attr}`)
        .join("");
      return `${empty ? "" : `const item: MediaItem = { id: "${item}", title: "${ITEM_BY_ID[item].title}", … };\n\n`}<MediaPreview${attrs}
/>`;
    },
  }),
  examples: [
    {
      id: "image",
      title: "Imagen con acciones",
      description: "La imagen se ajusta con `object-contain` hasta 600px de alto; el badge del ítem se pinta encima.",
      layout: "stretch",
      code: `<MediaPreview
  item={item}
  actions={
    <>
      <Button size="sm" variant="outline"><Share2 /> Compartir</Button>
      <Button size="sm"><Download /> Descargar</Button>
    </>
  }
/>`,
      render: () => <MediaPreview item={COURSE_ITEMS[0]} actions={<PreviewActions />} className="w-full" />,
    },
    {
      id: "document",
      title: "Documento sin vista previa",
      description: "Sin `src` se muestra el icono grande según `kind` y el texto de sin vista previa.",
      layout: "stretch",
      code: `<MediaPreview
  item={{ id: "doc", title: "Documento", kind: "document", metadata: "PDF · 2.1 MB" }}
  title="Política de teletrabajo 2026"
  description="Versión aprobada por el comité. Aplica a todas las sedes."
/>`,
      render: () => (
        <MediaPreview
          item={{ ...ICON_ITEMS[2], metadata: "PDF · 2.1 MB" }}
          title="Política de teletrabajo 2026"
          description="Versión aprobada por el comité. Aplica a todas las sedes."
          actions={<PreviewActions />}
          className="w-full"
        />
      ),
    },
    {
      id: "master-detail",
      title: "Maestro-detalle",
      description: "Sin selección se ve el estado vacío por defecto; al elegir una tarjeta aparece su detalle.",
      layout: "stretch",
      frameClassName: "min-h-[360px]",
      code: `const [selectedId, setSelectedId] = React.useState<string | null>(null);
const selected = items.find((item) => item.id === selectedId);

<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
  <div className="space-y-3">
    {items.map((item) => (
      <PreviewCard key={item.id} item={item} selected={item.id === selectedId} onSelect={setSelectedId} />
    ))}
  </div>
  <MediaPreview item={selected} />
</div>`,
      render: () => <MasterDetail />,
    },
    {
      id: "dialog",
      title: "Dentro de un Dialog",
      description: "El componente no trae contenedor propio, así que encaja en modales y drawers sin ajustes.",
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Abrir previsualización</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>Detalle del recurso</DialogTitle>
    </DialogHeader>
    <MediaPreview item={item} actions={<Button size="sm"><Download /> Descargar</Button>} />
  </DialogContent>
</Dialog>`,
      render: () => <PreviewDialog />,
    },
  ],
  props: [
    { name: "item", type: "MediaItem", description: "El recurso a previsualizar. Si falta, se muestra el estado vacío." },
    { name: "title", type: "string", description: "Sobrescribe `item.title`." },
    { name: "description", type: "string", description: "Sobrescribe `item.description`." },
    { name: "metadata", type: "ReactNode", description: "Sobrescribe `item.metadata`; admite nodos (badges, iconos)." },
    { name: "actions", type: "ReactNode", description: "Botones a la derecha del bloque de información." },
    { name: "emptyState", type: "ReactNode", description: "Reemplaza el EmptyState por defecto cuando no hay `item`." },
    { name: "className", type: "string", description: "Clases del contenedor raíz." },
  ],
  guidelines: {
    do: [
      "Úsalo como panel de detalle junto a una lista o grilla seleccionable.",
      "Pon la acción principal (descargar, asignar) como botón primario y el resto en contorno.",
    ],
    dont: [
      "No lo uses para listar varios recursos: para eso están ImageGrid y Gallery.",
      "No lo metas en un contenedor sin ancho definido dentro de un flex; la imagen necesita ancho para escalar.",
    ],
  },
  related: ["preview-card", "dialog", "file-preview", "empty-gallery-state"],
});
