import * as React from "react";
import { Sortable, SortableItem, type SortableOrientation } from "@/components/data-display/Sortable";
import { defineEntry, definePlayground } from "../types";

interface Lesson {
  id: string;
  label: string;
}

const LESSONS: Lesson[] = [
  { id: "feedback", label: "Feedback efectivo" },
  { id: "delegacion", label: "Delegación" },
  { id: "1-1", label: "1:1 que funcionan" },
  { id: "comunicacion", label: "Comunicación asertiva" },
  { id: "cambio", label: "Gestión del cambio" },
  { id: "coaching", label: "Coaching de equipos" },
];

const SURVEY_QUESTIONS = [
  { id: "q1", label: "¿Qué tan satisfecho estás con tu líder directo?", type: "Escala 1-5" },
  { id: "q2", label: "¿Recomendarías la empresa a un amigo?", type: "Sí/No" },
  { id: "q3", label: "¿Qué cambiarías del último trimestre?", type: "Texto libre" },
];

const ONBOARDING_STEPS = [
  { id: "bienvenida", label: "Bienvenida" },
  { id: "documentos", label: "Documentos" },
  { id: "equipo", label: "Conoce al equipo" },
  { id: "capacitacion", label: "Capacitación inicial" },
];

function PlaygroundDemo({ handle, orientation, count }: { handle: boolean; orientation: SortableOrientation; count: number }) {
  // `count` cambia la cantidad de lecciones; el `key` en el llamador (más
  // abajo) remonta el componente para reiniciar el estado en vez de
  // sincronizarlo con un efecto.
  const [items, setItems] = React.useState(() => LESSONS.slice(0, count));

  return (
    <Sortable
      items={items}
      getId={(item) => item.id}
      onReorder={setItems}
      handle={handle}
      orientation={orientation}
      renderItem={(item) => <span className="text-sm text-text-primary">{item.label}</span>}
      className={orientation === "horizontal" ? "w-full" : "w-full max-w-sm"}
    />
  );
}

function TrainingPlan() {
  const [items, setItems] = React.useState(LESSONS);
  return (
    <Sortable
      items={items}
      getId={(item) => item.id}
      onReorder={setItems}
      renderItem={(item) => <span className="text-sm text-text-primary">{item.label}</span>}
      className="w-full max-w-sm"
    />
  );
}

function SurveyBuilder() {
  const [items, setItems] = React.useState(SURVEY_QUESTIONS);
  return (
    <Sortable
      items={items}
      getId={(item) => item.id}
      onReorder={setItems}
      handle={false}
      renderItem={(item) => (
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-text-primary">{item.label}</span>
          <span className="text-xs text-text-muted">{item.type}</span>
        </div>
      )}
      className="w-full max-w-md"
    />
  );
}

function OnboardingSteps() {
  const [items, setItems] = React.useState(ONBOARDING_STEPS);
  return (
    <Sortable
      items={items}
      getId={(item) => item.id}
      onReorder={setItems}
      orientation="horizontal"
      renderItem={(item) => <span className="text-sm text-text-primary">{item.label}</span>}
    />
  );
}

function LessonsCompound() {
  const [items, setItems] = React.useState([
    { id: "feedback", label: "Feedback efectivo", duration: "45 min" },
    { id: "delegacion", label: "Delegación", duration: "30 min" },
    { id: "1-1", label: "1:1 que funcionan", duration: "1 h" },
  ]);

  return (
    <Sortable items={items} getId={(item) => item.id} onReorder={setItems} className="w-full max-w-sm">
      {items.map((item) => (
        <SortableItem key={item.id} id={item.id}>
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm text-text-primary">{item.label}</span>
            <span className="text-xs text-text-muted">{item.duration}</span>
          </div>
        </SortableItem>
      ))}
    </Sortable>
  );
}

export const sortableEntry = defineEntry({
  id: "sortable",
  name: "Sortable",
  group: "data-display",
  description:
    "Lista que se reordena arrastrando: las lecciones de un plan de formación, las preguntas de una encuesta, los pasos de un proceso. El arrastre con ratón y el teclado (Espacio levanta, flechas mueve, Espacio suelta, Escape cancela) comparten el mismo motor, y cada cambio se anuncia en una región `aria-live`.",
  importPath: 'import { Sortable, SortableItem } from "@/components/data-display/Sortable"',
  sourcePath: "src/components/data-display/Sortable.tsx",
  status: "stable",
  tags: ["dnd", "keyboard", "reorder"],
  playground: definePlayground({
    controls: {
      handle: { type: "boolean", label: "Con agarre", default: true },
      orientation: { type: "select", options: ["vertical", "horizontal"], default: "vertical" },
      count: { type: "number", label: "Lecciones", default: 4, min: 3, max: 6, step: 1 },
    },
    layout: "start",
    render: ({ handle, orientation, count }) => (
      <PlaygroundDemo key={count} handle={handle} orientation={orientation as SortableOrientation} count={count} />
    ),
    code: ({ handle, orientation, count }) => {
      const attrs = [!handle ? "handle={false}" : "", orientation !== "vertical" ? `orientation="${orientation}"` : ""].filter(Boolean);
      const attrsBlock = attrs.length ? `${attrs.join("\n  ")}\n  ` : "";
      return `const [items, setItems] = React.useState(lessons.slice(0, ${count}));

<Sortable
  items={items}
  getId={(item) => item.id}
  onReorder={setItems}
  ${attrsBlock}renderItem={(item) => <span>{item.label}</span>}
/>`;
    },
  }),
  examples: [
    {
      id: "training-plan",
      title: "Lecciones de un plan de formación",
      description: "Tab hasta el agarre, Espacio para levantar la lección, flechas para moverla y Espacio otra vez para soltarla. Escape la devuelve a su posición original.",
      layout: "start",
      frameClassName: "min-h-[280px] items-start",
      code: `const [items, setItems] = React.useState(lessons);

<Sortable items={items} getId={(item) => item.id} onReorder={setItems} renderItem={(item) => <span>{item.label}</span>} />`,
      render: () => <TrainingPlan />,
    },
    {
      id: "no-handle",
      title: "Sin agarre dedicado",
      description: "Con `handle={false}` la fila entera es el control de arrastre: útil cuando no hay otra acción en la fila que compita por el clic.",
      layout: "start",
      frameClassName: "min-h-[220px] items-start",
      code: `<Sortable items={items} getId={(item) => item.id} onReorder={setItems} handle={false} renderItem={(item) => (
  <div>
    <span>{item.label}</span>
    <span>{item.type}</span>
  </div>
)} />`,
      render: () => <SurveyBuilder />,
    },
    {
      id: "horizontal",
      title: "Orientación horizontal",
      description: "`orientation=\"horizontal\"` cambia qué flechas mueven el elemento levantado: ← y → en vez de ↑ y ↓. Sirve para pasos de un proceso mostrados como chips.",
      layout: "start",
      frameClassName: "min-h-[120px] items-start",
      code: `<Sortable items={steps} getId={(item) => item.id} onReorder={setSteps} orientation="horizontal" renderItem={(item) => <span>{item.label}</span>} />`,
      render: () => <OnboardingSteps />,
    },
    {
      id: "compound",
      title: "Composición con SortableItem",
      description: "Alternativa a `renderItem`: compón los hijos tú mismo con `SortableItem`, en el mismo orden que `items`, cuando el contenido de cada fila varía demasiado para una sola función.",
      layout: "start",
      frameClassName: "min-h-[240px] items-start",
      code: `<Sortable items={items} getId={(item) => item.id} onReorder={setItems}>
  {items.map((item) => (
    <SortableItem key={item.id} id={item.id}>
      <span>{item.label}</span>
      <span>{item.duration}</span>
    </SortableItem>
  ))}
</Sortable>`,
      render: () => <LessonsCompound />,
    },
  ],
  props: [
    { name: "items", type: "T[]", description: "La lista en su orden actual. `Sortable` es un componente controlado: nunca la muta." },
    { name: "getId", type: "(item: T) => string", description: "Identificador estable de cada elemento." },
    { name: "onReorder", type: "(items: T[]) => void", description: "Recibe la lista completa ya reordenada, como copia nueva." },
    { name: "getLabel", type: "(item: T) => string", description: "Texto para los anuncios («Lección 3 movida a…»). Sin él se usa `label`, `title` o `name` del propio item." },
    { name: "renderItem", type: "(item: T, state: SortableItemState) => React.ReactNode", description: "Compone cada fila; alternativa a pasar `SortableItem` como children." },
    { name: "children", type: "React.ReactNode", description: "Composición manual con `SortableItem`, en el mismo orden que `items`." },
    { name: "handle", type: "boolean", default: "true", description: "Agarre dedicado con `GripVertical`. En `false` toda la fila arrastra." },
    { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Define el eje de arrastre y qué flechas mueven el elemento levantado." },
    { name: "disabled", type: "boolean", default: "false", description: "Desactiva el arrastre y el teclado sin ocultar la lista." },
    { name: "SortableItemState.isDragging", type: "boolean", description: "El elemento se está arrastrando con el puntero." },
    { name: "SortableItemState.isOver", type: "boolean", description: "El puntero está encima de este elemento con algo agarrado." },
    { name: "SortableItemState.isLifted", type: "boolean", description: "Se levantó con teclado y las flechas lo mueven." },
  ],
  guidelines: {
    do: [
      "Da siempre `getLabel`, o un campo `label`/`title`/`name` en el objeto: los anuncios `aria-live` dependen de eso.",
      "Deja `handle` en `true` (su valor por defecto) cuando la fila tiene además un `onClick`; sin agarre dedicado el clic y el arrastre compiten.",
      "Prueba el reordenamiento completo con teclado (Espacio, flechas, Espacio, Escape) antes de dar la lista por accesible.",
    ],
    dont: [
      "No mutes `items` dentro de `onReorder`; usa la copia que ya te entrega el componente.",
      "No uses `orientation=\"horizontal\"` en columnas estrechas: las flechas izquierda/derecha compiten con el scroll de la página.",
      "No pongas dos `Sortable` con ids repetidos en la misma pantalla; la región `aria-live` es por instancia, pero los anuncios se confunden si los ids coinciden.",
    ],
  },
  related: ["kanban", "list-item", "table-shell"],
});
