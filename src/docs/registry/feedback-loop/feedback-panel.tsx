import * as React from "react";
import { FeedbackPanel, type FeedbackValues } from "@/components/feedback-loop";
import { defineEntry, definePlayground } from "../types";

const SECTIONS = [
  { value: "general", label: "Impresión general" },
  { value: "agenda", label: "Calendario y agenda" },
  { value: "metricas", label: "Métricas" },
];

/** Simula el envío: tarda un poco y acierta, o falla si el comentario dice «error». */
const fakeSubmit = (values: FeedbackValues) =>
  new Promise<void>((resolve, reject) =>
    window.setTimeout(() => (values.comment.toLowerCase().includes("error") ? reject(new Error("No se pudo enviar. Inténtalo de nuevo.")) : resolve()), 700)
  );

function PanelDemo({ context }: { context: string }) {
  const [open, setOpen] = React.useState(true);
  return open ? (
    <FeedbackPanel className="static" open onOpenChange={setOpen} sections={SECTIONS} context={context} onSubmit={fakeSubmit} />
  ) : (
    <button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
      Volver a abrir
    </button>
  );
}

export const feedbackPanelEntry = defineEntry({
  id: "feedback-panel",
  name: "FeedbackPanel",
  group: "feedback-loop",
  description:
    "El panel flotante donde se deja el feedback: sección a evaluar y comentario, con la página en la que estás a la vista. No es modal —la pantalla sigue visible para señalar lo que se comenta—, conserva el texto si el envío falla y, al acertar, agradece y deja escribir otro.",
  importPath: 'import { FeedbackPanel } from "@/components/feedback-loop"',
  sourcePath: "src/components/feedback-loop/FeedbackPanel.tsx",
  status: "beta",
  tags: ["feedback", "form", "campaña"],
  playground: definePlayground({
    controls: {
      context: { type: "text", label: "Página", default: "Métricas" },
    },
    layout: "center",
    render: ({ context }) => <PanelDemo context={context} />,
    code: ({ context }) => `<FeedbackPanel
  open={open}
  onOpenChange={setOpen}
  sections={secciones}
  context="${context}"
  onSubmit={enviar}
/>`,
  }),
  examples: [
    {
      id: "error",
      title: "Si el envío falla",
      description: "Escribe un comentario con la palabra «error» y envíalo: el texto se queda y el mensaje de `onSubmit` sale debajo.",
      code: `const enviar = async (values) => {
  await api.post("/feedback", values) // si lanza, el panel enseña error.message
}`,
      render: () => <PanelDemo context="Calendario" />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlado. Escape, ✕ y «Cancelar» piden cerrar." },
    { name: "sections", type: "{ value; label }[]", description: "Partes evaluables. Con una sola, el selector no se enseña." },
    { name: "defaultSection", type: "string", description: "La preseleccionada; por defecto, la primera." },
    { name: "context", type: "string", description: "Dónde está la persona («Métricas»)." },
    { name: "onSubmit", type: "(values: { section; comment }) => Promise<void> | void", description: "Envía. El comentario llega recortado. Si la promesa falla, su `message` se enseña." },
    { name: "minLength / maxLength", type: "number", default: "5 / 1000", description: "Límites del comentario, con contador." },
    { name: "labels", type: "Partial<FeedbackPanelLabels>", description: "Todos los textos, para traducir o ajustar el tono." },
  ],
  guidelines: {
    do: ["Traduce los errores a lenguaje de persona antes de lanzarlos desde `onSubmit`.", "Ofrece pocas secciones (5–7) y una para «algo que falta»."],
    dont: ["No pidas la página en un campo: `context` ya la dice y viaja sola.", "No lo metas en un Dialog: debe dejar ver la pantalla."],
  },
  related: ["feedback-launcher", "feedback-campaign", "textarea", "select"],
});
