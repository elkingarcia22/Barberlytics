import * as React from "react";
import { FeedbackDialog, type FeedbackValues } from "@/components/feedback-loop";
import { Button } from "@/components/ui/button";
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

function DialogDemo({ context, withSections }: { context: string; withSections: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Enviar feedback
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} sections={withSections ? SECTIONS : undefined} context={context || undefined} onSubmit={fakeSubmit} />
    </>
  );
}

export const feedbackDialogEntry = defineEntry({
  id: "feedback-dialog",
  name: "FeedbackDialog",
  group: "feedback-loop",
  description:
    "El único diálogo donde se deja feedback, lo abra el menú lateral o el botón de una campaña: tipo (mejora, error o idea), comentario y, si ayuda, lo que se ve —un recorte de la pantalla, un video de hasta un minuto o imágenes subidas—. Mientras se captura o se graba se aparta para dejar ver la página y vuelve con el adjunto puesto. Conserva todo si el envío falla y, al acertar, agradece y deja escribir otro.",
  importPath: 'import { FeedbackDialog } from "@/components/feedback-loop"',
  sourcePath: "src/components/feedback-loop/FeedbackDialog.tsx",
  status: "beta",
  tags: ["feedback", "form", "campaña", "captura", "video"],
  playground: definePlayground({
    controls: {
      context: { type: "text", label: "Página", default: "Métricas" },
      withSections: { type: "boolean", label: "Con secciones", default: false },
    },
    layout: "center",
    render: ({ context, withSections }) => <DialogDemo context={context} withSections={withSections} />,
    code: ({ context, withSections }) => `<FeedbackDialog
  open={open}
  onOpenChange={setOpen}${withSections ? "\n  sections={secciones}" : ""}
  context="${context}"
  onSubmit={enviar}
/>`,
  }),
  examples: [
    {
      id: "error",
      title: "Si el envío falla",
      description: "Escribe un comentario con la palabra «error» y envíalo: el texto y los adjuntos se quedan y el mensaje de `onSubmit` sale debajo.",
      code: `const enviar = async (values) => {
  await api.post("/feedback", values) // si lanza, el diálogo enseña error.message
}`,
      render: () => <DialogDemo context="Calendario" withSections />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlado. Escape, ✕ y «Cancelar» piden cerrar." },
    { name: "sections", type: "{ value; label }[]", description: "Partes evaluables. Con una o ninguna, el selector no se enseña." },
    { name: "defaultSection", type: "string", description: "La preseleccionada; por defecto, la primera." },
    { name: "context", type: "string", description: "Dónde está la persona («Métricas»). Va con el comentario salvo que desmarque la casilla." },
    {
      name: "onSubmit",
      type: "(values: { type; section; comment; attachments: File[]; includePage; canContact }) => Promise<void> | void",
      description: "Envía. El comentario llega recortado y los adjuntos como archivos. Si la promesa falla, su `message` se enseña.",
    },
    { name: "minLength / maxLength", type: "number", default: "5 / 1000", description: "Límites del comentario, con contador." },
    { name: "labels", type: "Partial<FeedbackDialogLabels>", description: "Todos los textos, para traducir o ajustar el tono." },
  ],
  guidelines: {
    do: [
      "Usa este mismo diálogo desde cualquier puerta: menú lateral, campaña o un enlace de ayuda.",
      "Traduce los errores a lenguaje de persona antes de lanzarlos desde `onSubmit`.",
      "Ofrece pocas secciones (5–7) y una para «algo que falta».",
    ],
    dont: ["No pidas la página en un campo: `context` ya la dice y viaja sola.", "No montes otro formulario de feedback al lado: dos experiencias distintas dan dos calidades de comentario."],
  },
  related: ["feedback-launcher", "feedback-campaign", "textarea", "toggle-group"],
});
