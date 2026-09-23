import * as React from "react";
import { Award, CalendarClock, ClipboardCheck, MessageCircle, TriangleAlert } from "lucide-react";
import { ActivityDropdown, type ActivityItem } from "@/components/ui/activity-dropdown";
import { defineEntry, definePlayground } from "../types";

/** Actividad de ejemplo de una plataforma de formación. */
const ACTIVIDAD: ActivityItem[] = [
  { id: "mensaje", icon: <MessageCircle />, tone: "primary", title: "Mensaje nuevo", description: "Sara Restrepo te escribió sobre el plan de onboarding.", time: "Justo ahora" },
  { id: "insignia", icon: <Award />, tone: "positive", title: "Insignia conseguida", description: "Completaste «Seguridad en planta» con 92 %.", time: "Hace 2 min" },
  { id: "sesion", icon: <CalendarClock />, tone: "warning", title: "Sesión en 30 minutos", description: "Inducción operativa · Sala Bogotá 3.", time: "Hace 3 h" },
  { id: "tarea", icon: <ClipboardCheck />, title: "Tarea asignada", description: "Revisar las 12 postulaciones de Analista de datos.", time: "Ayer" },
];

const CODE_ITEMS = `const actividad: ActivityItem[] = [
  { id: "mensaje", icon: <MessageCircle />, tone: "primary", title: "Mensaje nuevo", description: "Sara Restrepo te escribió sobre el plan de onboarding.", time: "Justo ahora" },
  { id: "insignia", icon: <Award />, tone: "positive", title: "Insignia conseguida", description: "Completaste «Seguridad en planta» con 92 %.", time: "Hace 2 min" },
  { id: "sesion", icon: <CalendarClock />, tone: "warning", title: "Sesión en 30 minutos", description: "Inducción operativa · Sala Bogotá 3.", time: "Hace 3 h" },
  { id: "tarea", icon: <ClipboardCheck />, title: "Tarea asignada", description: "Revisar las 12 postulaciones de Analista de datos.", time: "Ayer" },
];`;

/** Las filas que llevan a algún sitio se renderizan como botones. */
function ActividadNavegable() {
  const [ultima, setUltima] = React.useState<string | null>(null);
  const items = React.useMemo(
    () => ACTIVIDAD.map((item) => ({ ...item, onClick: () => setUltima(item.title) })),
    []
  );
  return (
    <div className="w-full max-w-md space-y-3">
      <ActivityDropdown items={items} defaultOpen />
      <p className="text-xs text-text-muted">{ultima ? `Abriste: ${ultima}` : "Ninguna fila abierta todavía."}</p>
    </div>
  );
}

export const activityDropdownEntry = defineEntry({
  id: "activity-dropdown",
  name: "ActivityDropdown",
  group: "ui",
  description:
    "Tarjeta de actividad reciente que se despliega al hacer clic: la cabecera se mantiene y las filas entran en cascada. Úsala en un panel lateral o en el inicio para resumir lo que pasó sin abrir una pantalla de notificaciones.",
  importPath: 'import { ActivityDropdown, type ActivityItem } from "@/components/ui/activity-dropdown"',
  sourcePath: "src/components/ui/activity-dropdown.tsx",
  status: "stable",
  tags: ["animación", "cascada", "notificaciones"],
  playground: definePlayground({
    controls: {
      title: { type: "text", default: "Actividad reciente" },
      description: { type: "text", label: "Frase de apoyo", default: "Lo que pasó en tu equipo" },
      defaultOpen: { type: "boolean", label: "Abierta al montar", default: false },
      empty: { type: "boolean", label: "Sin actividad", default: false },
    },
    layout: "start",
    render: ({ title, description, defaultOpen, empty }) => (
      <div className="w-full max-w-md">
        <ActivityDropdown items={empty ? [] : ACTIVIDAD} title={title} description={description} defaultOpen={defaultOpen} />
      </div>
    ),
    code: ({ title, description, defaultOpen, empty }) =>
      `<ActivityDropdown\n  items={${empty ? "[]" : "actividad"}}\n  title="${title}"\n  description="${description}"${defaultOpen ? "\n  defaultOpen" : ""}\n/>`,
  }),
  examples: [
    {
      id: "default",
      title: "Por defecto",
      description: "Haz clic en la cabecera para abrir y cerrar. Las filas entran escalonadas y el radio crece al expandirse.",
      code: `${CODE_ITEMS}\n\n<ActivityDropdown items={actividad} />`,
      render: () => (
        <div className="w-full max-w-md">
          <ActivityDropdown items={ACTIVIDAD} />
        </div>
      ),
      frameClassName: "min-h-[340px] items-start",
    },
    {
      id: "clickable",
      title: "Filas que llevan a algún sitio",
      description: "Con `onClick` cada fila se vuelve un botón real, navegable con el teclado.",
      code: `<ActivityDropdown
  items={actividad.map((item) => ({ ...item, onClick: () => abrir(item.id) }))}
  defaultOpen
/>`,
      render: () => <ActividadNavegable />,
      frameClassName: "min-h-[360px] items-start",
    },
    {
      id: "empty",
      title: "Sin actividad",
      description: "Con la lista vacía la tarjeta se queda en su cabecera y explica que no hay nada que mirar.",
      code: `<ActivityDropdown items={[]} emptyLabel="Cuando pase algo en tu equipo, aparecerá aquí." />`,
      render: () => (
        <div className="w-full max-w-md">
          <ActivityDropdown items={[]} emptyLabel="Cuando pase algo en tu equipo, aparecerá aquí." defaultOpen />
        </div>
      ),
      frameClassName: "min-h-[200px] items-start",
    },
    {
      id: "tones",
      title: "Tonos",
      description: "El tono colorea el chip del icono y dice de qué va el aviso: `primary` informa, `positive` celebra, `warning` recuerda y `negative` alerta.",
      code: `{ id: "vencido", icon: <TriangleAlert />, tone: "negative", title: "Plan vencido", description: "«Inducción comercial» cerró con 8 personas sin terminar.", time: "Hace 1 h" }`,
      render: () => (
        <div className="w-full max-w-md">
          <ActivityDropdown
            items={[
              { id: "vencido", icon: <TriangleAlert />, tone: "negative", title: "Plan vencido", description: "«Inducción comercial» cerró con 8 personas sin terminar.", time: "Hace 1 h" },
              ...ACTIVIDAD.slice(0, 2),
            ]}
            defaultOpen
          />
        </div>
      ),
      frameClassName: "min-h-[300px] items-start",
    },
  ],
  props: [
    { name: "items", type: "ActivityItem[]", description: "Las filas: `{ id, title, description?, time, icon?, tone?, onClick? }`. Vacío muestra `emptyLabel`." },
    { name: "title", type: "string", default: '"Actividad reciente"', description: "Título de la cabecera. El contador de filas se añade solo." },
    { name: "description", type: "string", description: "Frase de apoyo; solo se ve con la tarjeta cerrada." },
    { name: "defaultOpen", type: "boolean", default: "false", description: "Estado inicial cuando el componente se gobierna solo." },
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado desde fuera; con él manda quien lo pasa." },
    { name: "emptyLabel", type: "string", description: "Texto cuando no hay actividad." },
    { name: "className", type: "string", description: "Para el layout de afuera: ancho y márgenes." },
  ],
  guidelines: {
    do: [
      "Formatea `time` antes de pasarlo: el componente no calcula fechas relativas.",
      "Da `onClick` solo a las filas que de verdad llevan a algún sitio.",
      "Úsala para un resumen corto; si hay más de diez avisos, lleva a la pantalla de notificaciones.",
    ],
    dont: [
      "No la uses como menú del header: para eso está el Popover con la lista de notificaciones.",
      "No metas dos acciones en una fila; la fila entera es la acción.",
      "No repitas el tono de estado para decorar: `negative` significa que algo falló.",
    ],
  },
  related: ["accordion", "popover", "card", "list-item"],
});
