import * as React from "react";
import { GraduationCap, Grid2x2Plus, HeartHandshake, Megaphone, Users } from "lucide-react";
import { TemplateTile, type TemplateDefinition } from "@/components/templates";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["compact", "card", "row"] as const;
const TONES = ["brand", "positive", "warning", "negative", "neutral", "ai"] as const;

const CATALOG: readonly TemplateDefinition[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    name: "Plan de onboarding",
    description: "Los primeros treinta días de quien entra: formación, acompañamiento y cierre.",
    meta: "4 elementos · Mes",
    icon: GraduationCap,
    tone: "brand",
    items: [
      { label: "Completar la ruta de inducción", weight: 40 },
      { label: "Cerrar la primera conversación con el jefe", weight: 30 },
      { label: "Entregar el equipo y los accesos", weight: 20 },
      { label: "Firmar la documentación de ingreso", weight: 10 },
    ],
  },
  {
    id: "clima",
    label: "Clima",
    name: "Encuesta de clima",
    description: "Favorabilidad, liderazgo y plan de acción por área.",
    meta: "3 elementos · Semestre",
    icon: Users,
    tone: "positive",
    items: [
      { label: "Subir la favorabilidad general", weight: 50 },
      { label: "Cerrar los planes de acción de cada área", weight: 30 },
      { label: "Llegar al 85 % de participación", weight: 20 },
    ],
  },
  {
    id: "servicio",
    label: "Servicio",
    name: "Servicio al cliente",
    description: "Satisfacción, tiempos de respuesta y resolución en primer contacto.",
    meta: "3 elementos · Trimestre",
    icon: HeartHandshake,
    tone: "warning",
    items: [
      { label: "Subir la satisfacción del cliente", weight: 40 },
      { label: "Reducir el tiempo de primera respuesta", weight: 35 },
      { label: "Resolver en el primer contacto", weight: 25 },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    name: "Objetivos de marketing",
    description: "Demanda, costo de adquisición y presencia de marca.",
    meta: "3 elementos · Trimestre",
    icon: Megaphone,
    tone: "neutral",
    items: [
      { label: "Generar oportunidades calificadas", weight: 45 },
      { label: "Reducir el costo por oportunidad", weight: 35 },
      { label: "Lanzar la nueva marca de producto", weight: 20 },
    ],
  },
];

const MORE_TEMPLATE: TemplateDefinition = {
  id: "ver-mas",
  label: "Ver más plantillas",
  name: "Ver más plantillas",
  description: "Abre el catálogo completo.",
  meta: "Todo el catálogo",
  icon: Grid2x2Plus,
  tone: "neutral",
  items: [],
};

function PlaygroundDemo({
  variant,
  tone,
  dashed,
}: {
  variant: (typeof VARIANTS)[number];
  tone: (typeof TONES)[number];
  dashed: boolean;
}) {
  const [opened, setOpened] = React.useState<string | null>(null);
  const template: TemplateDefinition = { ...CATALOG[0], tone };
  return (
    <div className={variant === "compact" ? "w-full max-w-[260px]" : "w-full max-w-md"}>
      <TemplateTile
        template={template}
        variant={variant}
        dashed={dashed}
        onClick={() => setOpened(new Date().toLocaleTimeString())}
      />
      {opened && <p className="mt-3 text-xs text-text-muted">Abierta a las {opened}</p>}
    </div>
  );
}

function ShelfDemo() {
  const [picked, setPicked] = React.useState<string | null>(null);
  return (
    <div className="w-full space-y-3">
      <h3 className="text-[13px] font-semibold text-text-secondary">Empieza con una plantilla</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {CATALOG.map((template) => (
          <TemplateTile
            key={template.id}
            template={template}
            onClick={() => setPicked(template.name)}
          />
        ))}
        <TemplateTile template={MORE_TEMPLATE} dashed onClick={() => setPicked("El catálogo")} />
      </div>
      {picked && <p className="text-xs text-text-muted">{picked} · abierta</p>}
    </div>
  );
}

function GalleryDemo() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {CATALOG.map((template) => (
        <TemplateTile key={template.id} template={template} variant="card" onClick={() => {}} />
      ))}
    </div>
  );
}

function RowsDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      {CATALOG.map((template) => (
        <TemplateTile key={template.id} template={template} variant="row" onClick={() => {}} />
      ))}
    </div>
  );
}

function WeightsDemo() {
  const flat: TemplateDefinition = {
    ...CATALOG[1],
    id: "plano",
    name: "Tres líneas del mismo peso",
    meta: "3 elementos · iguales",
    tone: "brand",
    items: [
      { label: "Una", weight: 33 },
      { label: "Otra", weight: 33 },
      { label: "La tercera", weight: 34 },
    ],
  };
  const skewed: TemplateDefinition = {
    ...CATALOG[1],
    id: "desigual",
    name: "Una línea se lleva casi todo",
    meta: "3 elementos · desiguales",
    tone: "ai",
    items: [
      { label: "La que manda", weight: 80 },
      { label: "La segunda", weight: 15 },
      { label: "La última", weight: 5 },
    ],
  };
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      <TemplateTile template={flat} variant="card" onClick={() => {}} />
      <TemplateTile template={skewed} variant="card" onClick={() => {}} />
    </div>
  );
}

export const templateTileEntry = defineEntry({
  id: "template-tile",
  name: "TemplateTile",
  group: "selection",
  description:
    "La ficha de una plantilla: fondo degradado en su tono, una miniatura que dibuja las líneas que trae con sus barras de peso, la insignia clavada en una esquina, y debajo el nombre y la medida. La miniatura se dibuja con divs y tokens, así que hereda el tema y el modo claro/oscuro sin existir en dos versiones.",
  importPath: 'import { TemplateTile } from "@/components/templates"',
  sourcePath: "src/components/templates/TemplateTile.tsx",
  status: "stable",
  tags: ["card", "template", "tone"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", label: "Variante", options: VARIANTS, default: "compact" },
      tone: { type: "select", label: "Tono", options: TONES, default: "brand" },
      dashed: { type: "boolean", label: "Punteada (ver más)", default: false },
    },
    render: ({ variant, tone, dashed }) => (
      <PlaygroundDemo
        variant={variant as (typeof VARIANTS)[number]}
        tone={tone as (typeof TONES)[number]}
        dashed={dashed}
      />
    ),
    code: ({ variant, tone, dashed }) => {
      const attrs = [variant !== "compact" ? `variant="${variant}"` : "", dashed ? "dashed" : ""]
        .filter(Boolean)
        .join(" ");
      return `const plantilla = {
  id: "onboarding",
  label: "Onboarding",
  name: "Plan de onboarding",
  description: "Los primeros treinta días de quien entra.",
  meta: "4 elementos · Mes",
  icon: GraduationCap,
  tone: "${tone}",
  items: [
    { label: "Completar la ruta de inducción", weight: 40 },
    { label: "Cerrar la primera conversación con el jefe", weight: 30 },
    { label: "Entregar el equipo y los accesos", weight: 20 },
    { label: "Firmar la documentación de ingreso", weight: 10 },
  ],
};

<TemplateTile template={plantilla} onClick={abrir}${attrs ? ` ${attrs}` : ""} />`;
    },
  }),
  examples: [
    {
      id: "shelf",
      title: "La estantería de una página",
      description:
        "La variante compacta: una fila de atajos con una ficha punteada al final que abre el catálogo completo.",
      layout: "stretch",
      code: `<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} onClick={() => usar(plantilla)} />
  ))}
  <TemplateTile template={verMas} dashed onClick={abrirCatalogo} />
</div>`,
      render: () => <ShelfDemo />,
    },
    {
      id: "gallery",
      title: "Galería con portada",
      description:
        "La variante card lleva el degradado en la portada de la miniatura y deja la ficha en superficie limpia, para que la portada destaque contra ella.",
      layout: "stretch",
      code: `<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} variant="card" onClick={() => abrir(plantilla)} />
  ))}
</div>`,
      render: () => <GalleryDemo />,
    },
    {
      id: "rows",
      title: "Filas a todo lo ancho",
      description:
        "La variante row cambia la luz del degradado por un barrido de izquierda a derecha: una luz de esquina se apaga al tercio del camino en una fila larga.",
      layout: "stretch",
      code: `<div className="flex flex-col gap-2">
  {plantillas.map((plantilla) => (
    <TemplateTile key={plantilla.id} template={plantilla} variant="row" onClick={() => abrir(plantilla)} />
  ))}
</div>`,
      render: () => <RowsDemo />,
    },
    {
      id: "weights",
      title: "El peso se ve antes de leerse",
      description:
        "Las barras se dibujan en proporción a la línea que más pesa, no sobre un total fijo: un reparto plano y uno desigual se distinguen de un vistazo.",
      layout: "stretch",
      code: `const desigual = { ...plantilla, items: [
  { label: "La que manda", weight: 80 },
  { label: "La segunda", weight: 15 },
  { label: "La última", weight: 5 },
] };

<TemplateTile template={desigual} variant="card" onClick={abrir} />`,
      render: () => <WeightsDemo />,
    },
  ],
  props: [
    {
      name: "template",
      type: "TemplateDefinition",
      description:
        "La plantilla: id, label, name, description, meta, icon, tone e items (label y weight de cada línea).",
    },
    {
      name: "variant",
      type: '"compact" | "card" | "row"',
      default: '"compact"',
      description:
        "compact: fila con nombre y medida. card: portada degradada, nombre, para qué sirve y medida. row: fila a todo lo ancho.",
    },
    { name: "onClick", type: "() => void", description: "Qué hace la ficha al pulsarse." },
    {
      name: "dashed",
      type: "boolean",
      default: "false",
      description: "Ficha de «ver más»: contorno punteado, el icono solo, sin degradado ni insignia.",
    },
    { name: "className", type: "string", description: "Clases para el botón exterior." },
  ],
  guidelines: {
    do: [
      "Da a cada plantilla el tono que le corresponda: la estantería se lee por color antes que por nombre.",
      "Escribe meta con la medida real de la plantilla («3 elementos · Trimestre»): el sistema no sabe contar lo que no es suyo.",
      "Usa compact en una página, card en una galería que se abre y row para recorrer muchas de un vistazo.",
      "Reserva dashed para la ficha que abre el catálogo completo.",
    ],
    dont: [
      "No uses imágenes ni ilustraciones en la miniatura: se dibuja con divs y tokens para que siga al tema.",
      "No mezcles las tres variantes en la misma rejilla; elige una por superficie.",
      "No le pongas el tono ai a una plantilla cualquiera: su degradado está reservado para lo que de verdad es IA.",
      "No la uses como tarjeta de métrica: la ficha retrata contenido, no un número.",
    ],
  },
  related: ["template-catalog-drawer", "selectable-card", "option-tile", "drawer-shell"],
});
