import * as React from "react";
import { Kanban, type KanbanColumn, type KanbanItem, type KanbanTone } from "@/components/data-display/Kanban";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { defineEntry, definePlayground } from "../types";

const TONES = ["default", "primary", "positive", "warning", "negative"] as const;

const PIPELINE_ITEMS: KanbanItem[] = [
  { id: "c1", columnId: "nuevos", title: "Camila Ríos", description: "Diseñadora de producto", meta: "Hace 2 días" },
  { id: "c2", columnId: "nuevos", title: "Julián Ortiz", description: "Ingeniero backend", meta: "Hace 1 día" },
  { id: "c3", columnId: "revision", title: "Marcela Gil", description: "People analyst", meta: "Hace 4 días" },
  { id: "c4", columnId: "revision", title: "Andrés Peña", description: "Ingeniero frontend", meta: "Hace 3 días" },
  { id: "c5", columnId: "entrevista", title: "Renata Méndez", description: "Líder de diseño", meta: "Entrevista mañana" },
  { id: "c6", columnId: "oferta", title: "Diego Salas", description: "Ingeniero de datos", meta: "Oferta enviada" },
];

/** Devuelve una copia nueva con el item movido a la columna y posición indicadas. */
function moveKanbanItem(items: readonly KanbanItem[], itemId: string, toColumnId: string, toIndex: number): KanbanItem[] {
  const moving = items.find((item) => item.id === itemId);
  if (!moving) return [...items];

  const rest = items.filter((item) => item.id !== itemId);
  const updated: KanbanItem = { ...moving, columnId: toColumnId };
  const destinationIndices = rest.reduce<number[]>((acc, item, index) => {
    if (item.columnId === toColumnId) acc.push(index);
    return acc;
  }, []);
  const insertAt = destinationIndices[toIndex] ?? (destinationIndices.at(-1) !== undefined ? destinationIndices.at(-1)! + 1 : rest.length);

  return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)];
}

function buildPipelineColumns(tone: KanbanTone, limit: number, withDescription: boolean): KanbanColumn[] {
  return [
    { id: "nuevos", title: "Nuevos", description: withDescription ? "Postulaciones sin revisar" : undefined },
    { id: "revision", title: "En revisión", tone, limit, description: withDescription ? "Evaluación inicial de RR. HH." : undefined },
    { id: "entrevista", title: "Entrevista", description: withDescription ? "Con la líder del área" : undefined },
    { id: "oferta", title: "Oferta", tone: "positive", description: withDescription ? "Carta enviada" : undefined },
  ];
}

function PlaygroundDemo({ tone, limit, columnWidth, withDescription }: { tone: KanbanTone; limit: number; columnWidth: number; withDescription: boolean }) {
  const [items, setItems] = React.useState(PIPELINE_ITEMS);
  const columns = React.useMemo(() => buildPipelineColumns(tone, limit, withDescription), [tone, limit, withDescription]);

  return (
    <Kanban
      columns={columns}
      items={items}
      columnWidth={columnWidth}
      onItemMove={(itemId, toColumnId, toIndex) => setItems((current) => moveKanbanItem(current, itemId, toColumnId, toIndex))}
    />
  );
}

function VacancyPipeline() {
  const [items, setItems] = React.useState(PIPELINE_ITEMS);
  const columns: KanbanColumn[] = [
    { id: "nuevos", title: "Nuevos" },
    { id: "revision", title: "En revisión", tone: "primary", limit: 3 },
    { id: "entrevista", title: "Entrevista", tone: "warning" },
    { id: "oferta", title: "Oferta", tone: "positive" },
  ];

  return (
    <Kanban
      columns={columns}
      items={items}
      onItemMove={(itemId, toColumnId, toIndex) => setItems((current) => moveKanbanItem(current, itemId, toColumnId, toIndex))}
    />
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function VacancyPipelineWithCustomCard() {
  const [items, setItems] = React.useState(PIPELINE_ITEMS.filter((item) => item.columnId !== "oferta"));
  const columns: KanbanColumn[] = [
    { id: "nuevos", title: "Nuevos" },
    { id: "revision", title: "En revisión", tone: "primary", limit: 3 },
    { id: "entrevista", title: "Entrevista", tone: "warning" },
  ];

  return (
    <Kanban
      columns={columns}
      items={items}
      onItemMove={(itemId, toColumnId, toIndex) => setItems((current) => moveKanbanItem(current, itemId, toColumnId, toIndex))}
      renderItem={(item) => (
        <div className="flex items-start gap-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{initials(item.title)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
            <p className="truncate text-xs text-text-secondary">{item.description}</p>
            <Badge variant="secondary" className="text-[11px]">
              {item.meta}
            </Badge>
          </div>
        </div>
      )}
    />
  );
}

export const kanbanEntry = defineEntry({
  id: "kanban",
  name: "Kanban",
  group: "data-display",
  description:
    "Tablero de columnas con tarjetas que cambian de etapa arrastrando: el pipeline de una vacante (Nuevos → En revisión → Entrevista → Oferta), o cualquier flujo por estados. Es controlado —`onItemMove` decide el nuevo orden— y comparte el motor de arrastre con `Sortable`, incluido el movimiento por teclado entre columnas.",
  importPath: 'import { Kanban } from "@/components/data-display/Kanban"',
  sourcePath: "src/components/data-display/Kanban.tsx",
  status: "stable",
  tags: ["dnd", "keyboard", "pipeline"],
  playground: definePlayground({
    controls: {
      tone: { type: "select", options: TONES, label: "Tono de «En revisión»", default: "primary" },
      limit: { type: "number", label: "Límite de «En revisión»", default: 3, min: 1, max: 6, step: 1 },
      columnWidth: { type: "number", label: "Ancho de columna", default: 288, min: 240, max: 360, step: 24 },
      withDescription: { type: "boolean", label: "Con descripción", default: true },
    },
    layout: "stretch",
    render: ({ tone, limit, columnWidth, withDescription }) => (
      <PlaygroundDemo tone={tone as KanbanTone} limit={limit} columnWidth={columnWidth} withDescription={withDescription} />
    ),
    code: ({ tone, limit, columnWidth, withDescription }) => `const columns = [
  { id: "nuevos", title: "Nuevos" },
  { id: "revision", title: "En revisión", tone: "${tone}", limit: ${limit}${withDescription ? ', description: "Evaluación inicial de RR. HH."' : ""} },
  { id: "entrevista", title: "Entrevista" },
  { id: "oferta", title: "Oferta", tone: "positive" },
];

<Kanban columns={columns} items={items} columnWidth={${columnWidth}} onItemMove={(itemId, toColumnId, toIndex) => setItems(moveItem(items, itemId, toColumnId, toIndex))} />`,
  }),
  examples: [
    {
      id: "vacancy-pipeline",
      title: "Pipeline de una vacante",
      description: "Espacio levanta la tarjeta, ↑/↓ la mueve dentro de la columna y ←/→ la pasa a la columna vecina. El contador de «En revisión» se pone en rojo al superar el límite de 3.",
      layout: "stretch",
      frameClassName: "min-h-[360px] items-start",
      code: `const columns = [
  { id: "nuevos", title: "Nuevos" },
  { id: "revision", title: "En revisión", tone: "primary", limit: 3 },
  { id: "entrevista", title: "Entrevista", tone: "warning" },
  { id: "oferta", title: "Oferta", tone: "positive" },
];

<Kanban columns={columns} items={items} onItemMove={(itemId, toColumnId, toIndex) => setItems(moveItem(items, itemId, toColumnId, toIndex))} />`,
      render: () => <VacancyPipeline />,
    },
    {
      id: "custom-card",
      title: "Tarjeta con renderItem",
      description: "`renderItem` sustituye el cuerpo de la tarjeta; el envoltorio arrastrable y el foco se mantienen. Aquí cada tarjeta muestra un avatar con iniciales y un badge de tiempo.",
      layout: "stretch",
      frameClassName: "min-h-[320px] items-start",
      code: `<Kanban
  columns={columns}
  items={items}
  onItemMove={onItemMove}
  renderItem={(item) => (
    <div>
      <Avatar><AvatarFallback>{initials(item.title)}</AvatarFallback></Avatar>
      <p>{item.title}</p>
      <p>{item.description}</p>
      <Badge variant="secondary">{item.meta}</Badge>
    </div>
  )}
/>`,
      render: () => <VacancyPipelineWithCustomCard />,
    },
    {
      id: "wip-limit",
      title: "Aviso de límite (WIP)",
      description: "Al pasar `limit` en una columna, el contador se vuelve `x/y` y aparece un aviso en cuanto la columna lo supera.",
      layout: "stretch",
      frameClassName: "min-h-[280px] items-start",
      code: `<Kanban
  columns={[
    { id: "revision", title: "En revisión", tone: "warning", limit: 2 },
    { id: "entrevista", title: "Entrevista" },
  ]}
  items={items}
/>`,
      render: () => (
        <Kanban
          columns={[
            { id: "revision", title: "En revisión", tone: "warning", limit: 2 },
            { id: "entrevista", title: "Entrevista" },
          ]}
          items={PIPELINE_ITEMS.filter((item) => item.columnId === "revision" || item.columnId === "entrevista")}
        />
      ),
    },
    {
      id: "empty-column",
      title: "Columna vacía",
      description: "Sin tarjetas, la columna muestra `emptyColumnLabel` en vez de quedar en blanco.",
      layout: "stretch",
      frameClassName: "min-h-[260px] items-start",
      code: `<Kanban
  columns={[{ id: "oferta", title: "Oferta" }]}
  items={[]}
  emptyColumnLabel="Ninguna oferta activa"
/>`,
      render: () => <Kanban columns={[{ id: "oferta", title: "Oferta" }]} items={[]} emptyColumnLabel="Ninguna oferta activa" />,
    },
  ],
  props: [
    { name: "columns", type: "KanbanColumn[]", description: "Las columnas, en el orden en que se dibujan." },
    { name: "items", type: "KanbanItem[]", description: "Todas las tarjetas del tablero; `columnId` decide en cuál aparece cada una." },
    { name: "onItemMove", type: "(itemId: string, toColumnId: string, toIndex: number) => void", description: "`toIndex` ya es la posición dentro de la columna destino, sin contar la tarjeta movida." },
    { name: "renderItem", type: "(item: KanbanItem) => React.ReactNode", description: "Sustituye el cuerpo de la tarjeta; el envoltorio arrastrable se mantiene." },
    { name: "columnWidth", type: "number", default: "288", description: "Ancho de cada columna en píxeles." },
    { name: "emptyColumnLabel", type: "string", default: '"Sin tarjetas"', description: "Texto cuando una columna no tiene tarjetas." },
    { name: "KanbanColumn.id", type: "string", description: "Identificador estable de la columna." },
    { name: "KanbanColumn.title", type: "string", description: "Título visible en la cabecera." },
    { name: "KanbanColumn.description", type: "string", description: "Línea de contexto bajo el título." },
    { name: "KanbanColumn.tone", type: '"default" | "primary" | "positive" | "warning" | "negative"', default: '"default"', description: "Color del punto junto al título y del contador." },
    { name: "KanbanColumn.limit", type: "number", description: "Umbral de WIP; al superarlo aparece el aviso y el contador pasa a «x/y»." },
    { name: "KanbanItem.id", type: "string", description: "Identificador estable de la tarjeta." },
    { name: "KanbanItem.columnId", type: "string", description: "Columna a la que pertenece la tarjeta." },
    { name: "KanbanItem.title", type: "string", description: "Título de la tarjeta." },
    { name: "KanbanItem.description", type: "string", description: "Línea de contexto bajo el título." },
    { name: "KanbanItem.meta", type: "React.ReactNode", description: "Texto corto al pie: una fecha, un responsable." },
    { name: "KanbanItem.avatar", type: "React.ReactNode", description: "Avatar mostrado junto al título en la tarjeta por defecto." },
    { name: "KanbanItem.badges", type: "React.ReactNode", description: "Fila de badges bajo la descripción, en la tarjeta por defecto." },
  ],
  guidelines: {
    do: [
      "Confirma el movimiento en tu backend antes de repintar; el tablero es controlado y el estado que devuelves es el que se ve.",
      "Pon `limit` solo en las columnas donde el exceso importa de verdad (revisión), no en todas.",
      "Prueba el flujo completo con teclado: Espacio levanta, ↑/↓ mueve dentro de la columna, ←/→ cambia de columna.",
    ],
    dont: [
      "No uses Kanban para menos de dos columnas; ahí una lista `Sortable` es más simple.",
      "No quites el contador de tarjetas por columna: es lo primero que se lee en una revisión de pipeline.",
      "No conviertas `renderItem` en un formulario; dispara una acción que abra el detalle en otro lado.",
    ],
  },
  related: ["sortable", "status-badge", "card"],
});
