import * as React from "react";
import { Link2, Share2 } from "lucide-react";
import { ModalShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["sm", "md", "lg", "xl"] as const;
type Size = (typeof SIZES)[number];

function PlaygroundDemo({ size, showCloseButton, withDescription, withActions }: { size: Size; showCloseButton: boolean; withDescription: boolean; withActions: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <ModalShell
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Abrir modal</Button>}
      size={size}
      showCloseButton={showCloseButton}
      title="Renombrar plantilla"
      description={withDescription ? "El nombre se muestra en el catálogo de plantillas." : undefined}
      actions={withActions ? (<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => setOpen(false)}>Guardar</Button></>) : undefined}
    >
      <Input defaultValue="Evaluación 360 · Liderazgo" className="h-9" />
    </ModalShell>
  );
}

function RenameDemo() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("Evaluación 360 · Liderazgo");
  const [draft, setDraft] = React.useState(name);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[13px] text-text-secondary">Plantilla: <span className="font-semibold text-text-primary">{name}</span></p>
      <ModalShell
        open={open}
        onOpenChange={(next) => { if (next) setDraft(name); setOpen(next); }}
        trigger={<Button variant="outline">Renombrar</Button>}
        title="Renombrar plantilla"
        description="El nombre se muestra en el catálogo de plantillas."
        actions={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={!draft.trim()} onClick={() => { setName(draft.trim()); setOpen(false); }}>Guardar</Button></>}
      >
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} className="h-9" autoFocus />
      </ModalShell>
    </div>
  );
}

function ShareDemo() {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => { setOpen(next); if (!next) setCopied(false); }}
      trigger={<Button variant="outline"><Share2 /> Compartir</Button>}
      size="lg"
      title="Compartir reporte"
      description="Cualquiera con el enlace y acceso a la empresa podrá verlo."
      footer={
        <div className="-mx-4 -mb-4 flex items-center justify-between rounded-b-xl border-t bg-muted/40 p-4">
          <Button variant="link" size="sm" className="px-0" onClick={() => setCopied(true)}><Link2 /> {copied ? "Enlace copiado" : "Copiar enlace"}</Button>
          <Button onClick={() => setOpen(false)}>Listo</Button>
        </div>
      }
    >
      <div className="flex gap-2">
        <Input placeholder="Correo o nombre" className="h-9" />
        <Button variant="secondary">Invitar</Button>
      </div>
    </ModalShell>
  );
}

function InfoDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <ModalShell open={open} onOpenChange={setOpen} trigger={<Button variant="ghost">¿Cómo se calcula?</Button>} size="sm" title="Índice de avance">
      <p className="text-[13px] leading-relaxed text-text-secondary">
        Es el promedio ponderado del cumplimiento de cada resultado clave. Los resultados marcados como «en riesgo» pesan la mitad.
      </p>
    </ModalShell>
  );
}

export const modalShellEntry = defineEntry({
  id: "modal-shell",
  name: "ModalShell",
  group: "overlays",
  description:
    "El modal centrado del producto sobre `Dialog`: cabecera con título y descripción, cuerpo y un pie con acciones o completamente propio. Cuatro tamaños para tareas cortas que no justifican un drawer.",
  importPath: 'import { ModalShell } from "@/components/overlays"',
  sourcePath: "src/components/overlays/ModalShell.tsx",
  status: "stable",
  tags: ["radix-dialog", "controlled"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "md" },
      showCloseButton: { type: "boolean", label: "Botón cerrar", default: true },
      withDescription: { type: "boolean", label: "Con descripción", default: true },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    render: ({ size, showCloseButton, withDescription, withActions }) => (
      <PlaygroundDemo size={size as Size} showCloseButton={showCloseButton} withDescription={withDescription} withActions={withActions} />
    ),
    code: ({ size, showCloseButton, withDescription, withActions }) => {
      const attrs = [
        "open={open}",
        "onOpenChange={setOpen}",
        "trigger={<Button>Abrir modal</Button>}",
        size !== "md" ? `size="${size}"` : "",
        !showCloseButton ? "showCloseButton={false}" : "",
        'title="Renombrar plantilla"',
        withDescription ? 'description="El nombre se muestra en el catálogo de plantillas."' : "",
        withActions ? "actions={<><Button variant=\"outline\" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}" : "",
      ].filter(Boolean);
      return `const [open, setOpen] = React.useState(false);\n\n<ModalShell\n  ${attrs.join("\n  ")}\n>\n  <Input defaultValue="Evaluación 360 · Liderazgo" />\n</ModalShell>`;
    },
  }),
  examples: [
    {
      id: "rename",
      title: "Edición corta",
      description: "Un campo y dos acciones. El borrador se reinicia al abrir y se aplica solo al guardar.",
      code: `const [open, setOpen] = React.useState(false);
const [draft, setDraft] = React.useState(name);

<ModalShell
  open={open}
  onOpenChange={(next) => { if (next) setDraft(name); setOpen(next); }}
  trigger={<Button variant="outline">Renombrar</Button>}
  title="Renombrar plantilla"
  description="El nombre se muestra en el catálogo de plantillas."
  actions={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button disabled={!draft.trim()} onClick={() => { setName(draft); setOpen(false); }}>Guardar</Button>
  </>}
>
  <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
</ModalShell>`,
      render: () => <RenameDemo />,
    },
    {
      id: "custom-footer",
      title: "Pie personalizado",
      description: "`footer` reemplaza a `actions` para poner algo a la izquierda, como copiar un enlace.",
      code: `<ModalShell
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="outline"><Share2 /> Compartir</Button>}
  size="lg"
  title="Compartir reporte"
  footer={
    <div className="-mx-4 -mb-4 flex items-center justify-between rounded-b-xl border-t bg-muted/40 p-4">
      <Button variant="link" size="sm"><Link2 /> Copiar enlace</Button>
      <Button onClick={() => setOpen(false)}>Listo</Button>
    </div>
  }
>
  …
</ModalShell>`,
      render: () => <ShareDemo />,
    },
    {
      id: "info",
      title: "Solo información",
      description: "Sin acciones ni descripción: título, texto y la X para cerrar.",
      code: `<ModalShell open={open} onOpenChange={setOpen} trigger={<Button variant="ghost">¿Cómo se calcula?</Button>} size="sm" title="Índice de avance">
  <p>Es el promedio ponderado del cumplimiento de cada resultado clave…</p>
</ModalShell>`,
      render: () => <InfoDemo />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado del modal." },
    { name: "trigger", type: "React.ReactNode", description: "Elemento que abre el modal (`asChild`)." },
    { name: "title / description", type: "string", description: "Cabecera; si ambos faltan, no se pinta." },
    { name: "children", type: "React.ReactNode", description: "Cuerpo del modal." },
    { name: "actions", type: "React.ReactNode", description: "Botones del pie, en un `DialogFooter` alineado a la derecha." },
    { name: "footer", type: "React.ReactNode", description: "Pie completamente personalizado; reemplaza a `actions`." },
    { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "Ancho máximo en `sm+`: 384, 448, 512 o 576px." },
    { name: "showCloseButton", type: "boolean", default: "true", description: "Muestra la X en la esquina." },
    { name: "className", type: "string", description: "Clases para el contenido del diálogo." },
  ],
  guidelines: {
    do: ["Úsalo para tareas de uno o dos campos; si crece, pásate a `DrawerShell`.", "Pon `autoFocus` en el primer campo cuando el modal es de edición.", "Siempre un título: es lo que anuncia el lector de pantalla."],
    dont: ["No lo uses para confirmar acciones destructivas: para eso está `ConfirmDialog`.", "No apiles modales; abre un `ConfirmDialog` encima si hace falta, nunca otro `ModalShell`."],
  },
  related: ["dialog", "drawer-shell", "confirm-dialog", "button"],
});
