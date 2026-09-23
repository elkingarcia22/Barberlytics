import * as React from "react";
import {
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  TemplateCatalogDrawer,
  type TemplateDefinition,
  type TemplateGroup,
} from "@/components/templates";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const PERSONAS: readonly TemplateDefinition[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    name: "Plan de onboarding",
    description: "Los primeros treinta días de quien entra: formación, acompañamiento y cierre.",
    meta: "4 elementos · Mes",
    icon: GraduationCap,
    tone: "brand",
    featured: true,
    pitch:
      "Corta y concreta: cuatro líneas que casi cualquier compañía reconoce como suyas, y la forma más rápida de ver cómo funciona una plantilla de punta a punta.",
    items: [
      { label: "Completar la ruta de inducción", weight: 40, hint: "Cursos obligatorios del cargo." },
      { label: "Cerrar la primera conversación con el jefe", weight: 30, hint: "Hito: se cumple cuando queda registrada." },
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
    icon: UsersRound,
    tone: "positive",
    items: [
      { label: "Subir la favorabilidad general", weight: 50, hint: "Resultado de la medición del periodo." },
      { label: "Cerrar los planes de acción de cada área", weight: 30 },
      { label: "Llegar al 85 % de participación", weight: 20 },
    ],
  },
];

const NEGOCIO: readonly TemplateDefinition[] = [
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
  {
    id: "finanzas",
    label: "Finanzas",
    name: "Objetivos financieros",
    description: "Margen, cartera y control del gasto de la compañía.",
    meta: "3 elementos · Semestre",
    icon: Wallet,
    tone: "positive",
    items: [
      { label: "Subir el margen bruto", weight: 40 },
      { label: "Reducir la cartera vencida", weight: 35 },
      { label: "Cumplir el presupuesto de gasto", weight: 25 },
    ],
  },
];

const OPERACION: readonly TemplateDefinition[] = [
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
    id: "calidad",
    label: "Calidad",
    name: "Calidad y seguridad",
    description: "No conformidades, accidentalidad y cumplimiento normativo.",
    meta: "3 elementos · Semestre",
    icon: ShieldCheck,
    tone: "negative",
    items: [
      { label: "Bajar las no conformidades de calidad", weight: 35 },
      { label: "Bajar la accidentalidad laboral", weight: 35 },
      { label: "Cerrar las auditorías normativas", weight: 30 },
    ],
  },
];

const GROUPS: readonly TemplateGroup[] = [
  {
    id: "personas",
    label: "Personas",
    description: "Rotación, clima y desarrollo: la gente que hace todo lo demás.",
    icon: UsersRound,
    templates: PERSONAS,
  },
  {
    id: "negocio",
    label: "Negocio",
    description: "Ventas, demanda y rentabilidad: lo que la compañía vende y gana.",
    icon: Briefcase,
    templates: NEGOCIO,
  },
  {
    id: "operacion",
    label: "Operación",
    description: "Producción, calidad y servicio: cómo se entrega y cómo se atiende.",
    icon: ShieldCheck,
    templates: OPERACION,
  },
];

const SINGLE_GROUP: readonly TemplateGroup[] = [
  { id: "todas", label: "Todas las plantillas", templates: [...PERSONAS, ...NEGOCIO] },
];

function PlaygroundDemo({ deepLink }: { deepLink: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [used, setUsed] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={() => setOpen(true)}>Ver plantillas</Button>
      <TemplateCatalogDrawer
        open={open}
        onOpenChange={setOpen}
        groups={GROUPS}
        initialTemplateId={deepLink ? "servicio" : null}
        onUseTemplate={(template) => {
          setUsed(template.name);
          setOpen(false);
        }}
      />
      {used && <p className="text-xs text-text-muted">Se usó «{used}»</p>}
    </div>
  );
}

function SingleGroupDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Catálogo sin estantes
      </Button>
      <TemplateCatalogDrawer
        open={open}
        onOpenChange={setOpen}
        groups={SINGLE_GROUP}
        onUseTemplate={() => setOpen(false)}
      />
    </div>
  );
}

function DeepLinkDemo() {
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {PERSONAS.map((template) => (
          <Button key={template.id} variant="outline" onClick={() => setOpenId(template.id)}>
            {template.label}
          </Button>
        ))}
      </div>
      <TemplateCatalogDrawer
        open={openId !== null}
        onOpenChange={(next) => !next && setOpenId(null)}
        groups={GROUPS}
        initialTemplateId={openId}
        onUseTemplate={() => setOpenId(null)}
      />
    </div>
  );
}

function CustomTextsDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Elegir una encuesta base
      </Button>
      <TemplateCatalogDrawer
        open={open}
        onOpenChange={setOpen}
        groups={GROUPS}
        title="Encuestas listas para lanzar"
        description="Cada una trae sus preguntas escritas y el peso con el que entran al resultado."
        onUseTemplate={() => setOpen(false)}
      />
    </div>
  );
}

export const templateCatalogDrawerEntry = defineEntry({
  id: "template-catalog-drawer",
  name: "TemplateCatalogDrawer",
  group: "overlays",
  description:
    "El catálogo de plantillas en un panel: galería por estantes con buscador y dos vistas, una plantilla destacada arriba, y un paso más adentro la ficha con las líneas que trae, su peso dibujado y una fila de alternativas. Usa las mismas TemplateTile que van en la página, así que la plantilla que alguien reconoció fuera es la que reconoce dentro.",
  importPath: 'import { TemplateCatalogDrawer } from "@/components/templates"',
  sourcePath: "src/components/templates/TemplateCatalogDrawer.tsx",
  status: "stable",
  tags: ["drawer", "catalog", "template"],
  playground: definePlayground({
    controls: {
      deepLink: { type: "boolean", label: "Abrir en una ficha", default: false },
    },
    render: ({ deepLink }) => <PlaygroundDemo deepLink={deepLink} />,
    code: ({ deepLink }) => `const [open, setOpen] = React.useState(false);

<TemplateCatalogDrawer
  open={open}
  onOpenChange={setOpen}
  groups={estantes}${deepLink ? '\n  initialTemplateId="servicio"' : ""}
  onUseTemplate={(plantilla) => {
    crearDesde(plantilla);
    setOpen(false);
  }}
/>`,
  }),
  examples: [
    {
      id: "deep-link",
      title: "Desde la estantería a la ficha",
      description:
        "Un atajo de fuera abre el panel directamente en la plantilla que señala; el estado se lee en cada apertura, así que cada botón cae en la suya.",
      code: `const [openId, setOpenId] = React.useState<string | null>(null);

<TemplateCatalogDrawer
  open={openId !== null}
  onOpenChange={(next) => !next && setOpenId(null)}
  groups={estantes}
  initialTemplateId={openId}
  onUseTemplate={usar}
/>`,
      render: () => <DeepLinkDemo />,
    },
    {
      id: "single-group",
      title: "Catálogo sin estantes",
      description:
        "Con un solo grupo la galería se dibuja sin su cabecera: no hay nada que distinguir de nada.",
      code: `<TemplateCatalogDrawer
  open={open}
  onOpenChange={setOpen}
  groups={[{ id: "todas", label: "Todas las plantillas", templates }]}
  onUseTemplate={usar}
/>`,
      render: () => <SingleGroupDemo />,
    },
    {
      id: "custom-texts",
      title: "Otro dominio, mismo panel",
      description:
        "El panel no sabe de qué son las líneas de una plantilla. Cambiando title y description sirve igual para encuestas, cursos o procesos.",
      code: `<TemplateCatalogDrawer
  open={open}
  onOpenChange={setOpen}
  groups={estantes}
  title="Encuestas listas para lanzar"
  description="Cada una trae sus preguntas escritas y el peso con el que entran al resultado."
  onUseTemplate={usar}
/>`,
      render: () => <CustomTextsDemo />,
    },
  ],
  props: [
    { name: "open", type: "boolean", description: "Si el panel está abierto." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Cambio de apertura." },
    {
      name: "groups",
      type: "readonly TemplateGroup[]",
      description:
        "El catálogo, por estantes: id, label, description, icon y templates de cada uno. Con un solo estante la cabecera no se dibuja.",
    },
    {
      name: "onUseTemplate",
      type: "(template: TemplateDefinition) => void",
      description:
        "Adelante con la plantilla. Qué signifique «usarla» lo decide quien monta el panel; cerrarlo también.",
    },
    {
      name: "initialTemplateId",
      type: "string | null",
      description:
        "Abre directamente en esa ficha en vez de en la galería. Se vuelve a leer en cada apertura.",
    },
    { name: "title", type: "string", default: '"Empieza con una plantilla"', description: "Título del panel." },
    { name: "description", type: "string", description: "Subtítulo del panel." },
  ],
  guidelines: {
    do: [
      "Marca una plantilla con featured y escríbele un pitch: una rejilla de fichas iguales deja la primera decisión entera en manos de quien mira.",
      "Rellena el hint de cada línea cuando el nombre no baste: la ficha es donde se decide si la plantilla vale.",
      "Cierra el panel desde onUseTemplate, cuando ya sepas que la acción salió bien.",
      "Agrupa por categorías de verdad: dentro de un estante las plantillas tienen que competir entre sí.",
    ],
    dont: [
      "No dupliques el catálogo entre la página y el panel: pásale los mismos datos a los dos.",
      "No metas la lógica del dominio aquí; el panel solo sabe de líneas con nombre y peso.",
      "No abras el panel con initialTemplateId fijo si el atajo cambia: se lee en cada apertura, no una sola vez.",
      "No lo uses para elegir entre dos o tres opciones: para eso está CardSelection.",
    ],
  },
  related: ["template-tile", "drawer-shell", "drawer-section", "card-selection"],
});
