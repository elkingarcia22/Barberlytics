import { FeedbackLauncher } from "@/components/feedback-loop";
import { defineEntry, definePlayground } from "../types";

export const feedbackLauncherEntry = defineEntry({
  id: "feedback-launcher",
  name: "FeedbackLauncher",
  group: "feedback-loop",
  description:
    "El botón flotante que abre el panel de feedback, fijo en la esquina inferior derecha (`z-rail`). Empieza como pastilla con texto y, una vez usado, se contrae a un círculo; `highlight` añade un pulso para una campaña que aún no tiene tu opinión. En móvil sube para no pisar el `ActionFab`.",
  importPath: 'import { FeedbackLauncher } from "@/components/feedback-loop"',
  sourcePath: "src/components/feedback-loop/FeedbackLauncher.tsx",
  status: "beta",
  tags: ["feedback", "fab", "campaña"],
  playground: definePlayground({
    controls: {
      collapsed: { type: "boolean", label: "Contraído", default: false },
      highlight: { type: "boolean", label: "Pulso", default: true },
      label: { type: "text", label: "Texto", default: "Feedback" },
    },
    // En la doc se saca del flujo fijo (`static`) para verlo dentro del marco.
    render: ({ collapsed, highlight, label }) => (
      <FeedbackLauncher className="static" collapsed={collapsed} highlight={highlight} label={label} />
    ),
    code: ({ collapsed, highlight, label }) => {
      const attrs = [collapsed ? "collapsed" : "", highlight ? "highlight" : "", label !== "Feedback" ? `label="${label}"` : ""].filter(Boolean);
      return `<FeedbackLauncher ${[...attrs, "onClick={abrirPanel}"].join(" ")} />`;
    },
  }),
  examples: [
    {
      id: "states",
      title: "Primera vez y ya usado",
      description: "Con texto mientras nadie lo ha abierto; contraído a icono después. El nombre accesible es el mismo en los dos.",
      code: `<FeedbackLauncher highlight onClick={abrir} />
<FeedbackLauncher collapsed onClick={abrir} />`,
      render: () => (
        <div className="flex items-center gap-6">
          <FeedbackLauncher className="static" highlight />
          <FeedbackLauncher className="static" collapsed />
        </div>
      ),
    },
  ],
  props: [
    { name: "collapsed", type: "boolean", default: "false", description: "Solo el icono, con `aria-label` y `title`." },
    { name: "highlight", type: "boolean", default: "false", description: "Pulso suave alrededor; se apaga con `prefers-reduced-motion`." },
    { name: "expanded", type: "boolean", description: "El panel que abre está abierto (`aria-expanded`)." },
    { name: "label", type: "string", default: '"Feedback"', description: "Texto visible y nombre accesible." },
    { name: "...props", type: 'React.ComponentProps<"button">', description: "Atributos del botón: `onClick`, `data-tour` para que el recorrido lo señale." },
  ],
  guidelines: {
    do: ["Móntalo una sola vez, en el layout, para que acompañe a todas las páginas.", "Pásale `data-tour` si el recorrido debe señalarlo."],
    dont: ["No lo pongas dentro del contenido de una pantalla: es un elemento del marco.", "No cambies su color: es la llamada a la acción de la campaña."],
  },
  related: ["feedback-panel", "feedback-campaign", "action-fab"],
});
