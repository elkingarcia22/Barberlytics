import * as React from "react";
import { Archive, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const VARIANTS = ["default", "warning", "destructive"] as const;
type Variant = (typeof VARIANTS)[number];
const FAKE_LATENCY_MS = 1200;

function PlaygroundDemo({ variant, typed, secondary }: { variant: Variant; typed: boolean; secondary: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const isDestructive = variant === "destructive";
  return (
    <div className="flex flex-col items-center gap-3">
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant={isDestructive ? "destructive" : "default"}>{isDestructive ? "Eliminar registro" : "Publicar cambios"}</Button>}
        variant={variant}
        title={isDestructive ? "¿Eliminar el registro?" : "¿Publicar los cambios?"}
        description={isDestructive ? "Se borrará de forma permanente y no podrá recuperarse." : "Los colaboradores verán la nueva versión de inmediato."}
        confirmLabel={isDestructive ? "Eliminar" : "Publicar"}
        confirmationText={typed ? "ELIMINAR" : undefined}
        secondaryLabel={secondary ? "Guardar borrador" : undefined}
        onSecondary={secondary ? () => { setResult("Guardado como borrador"); setOpen(false); } : undefined}
        onConfirm={() => { setResult(isDestructive ? "Registro eliminado" : "Cambios publicados"); setOpen(false); }}
        onCancel={() => setResult("Cancelado")}
      />
      {result && <p className="text-[12px] text-text-muted">Último resultado: {result}</p>}
    </div>
  );
}

function AsyncDemo() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [archived, setArchived] = React.useState(false);
  const confirm = () => {
    setLoading(true);
    window.setTimeout(() => { setLoading(false); setOpen(false); setArchived(true); }, FAKE_LATENCY_MS);
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => { if (!loading) setOpen(next); }}
        trigger={<Button variant="outline" disabled={archived}><Archive /> {archived ? "Archivado" : "Archivar ciclo"}</Button>}
        title="¿Archivar el ciclo 2026-Q1?"
        description="Dejará de aparecer en el listado activo. Podrás restaurarlo desde el historial."
        confirmLabel="Archivar"
        loading={loading}
        onConfirm={confirm}
      />
      {archived && <Button variant="link" size="xs" onClick={() => setArchived(false)}>Restaurar</Button>}
    </div>
  );
}

function TypedDemo() {
  const [open, setOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="destructive" disabled={deleted}><Trash2 /> {deleted ? "Encuesta eliminada" : "Eliminar encuesta"}</Button>}
        variant="destructive"
        title="Eliminar «Clima laboral 2026»"
        description="Se borrarán las 312 respuestas recibidas. Esta acción no se puede deshacer."
        confirmationText="Clima laboral 2026"
        confirmLabel="Eliminar definitivamente"
        onConfirm={() => { setDeleted(true); setOpen(false); }}
      />
      {deleted && <Button variant="link" size="xs" onClick={() => setDeleted(false)}>Reiniciar demo</Button>}
    </div>
  );
}

function UnsavedDemo() {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState("Editando…");
  return (
    <div className="flex flex-col items-center gap-3">
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="outline">Salir del editor</Button>}
        variant="warning"
        title="Tienes cambios sin guardar"
        description="Si sales ahora, perderás lo editado en los últimos minutos."
        cancelLabel="Seguir editando"
        secondaryLabel="Salir sin guardar"
        secondaryVariant="destructive"
        onSecondary={() => { setStatus("Cambios descartados"); setOpen(false); }}
        confirmLabel="Guardar y salir"
        onConfirm={() => { setStatus("Guardado"); setOpen(false); }}
      />
      <p className="text-[12px] text-text-muted">Estado: {status}</p>
    </div>
  );
}

export const confirmDialogEntry = defineEntry({
  id: "confirm-dialog",
  name: "ConfirmDialog",
  group: "overlays",
  description:
    "El diálogo de confirmación del sistema sobre `AlertDialog`: título, aviso, cancelar y confirmar, con variante destructiva, estado de carga, un tercer botón opcional y una confirmación escrita para acciones irreversibles. En modo controlado no se cierra solo: el consumidor pone `open` en false cuando la operación termina.",
  importPath: 'import { ConfirmDialog } from "@/components/overlays"',
  sourcePath: "src/components/overlays/ConfirmDialog.tsx",
  status: "stable",
  tags: ["radix-alert-dialog", "controlled", "async"],
  playground: definePlayground({
    controls: {
      variant: { type: "select", options: VARIANTS, default: "destructive" },
      typed: { type: "boolean", label: "Confirmación escrita", default: false },
      secondary: { type: "boolean", label: "Tercer botón", default: false },
    },
    render: ({ variant, typed, secondary }) => <PlaygroundDemo variant={variant as Variant} typed={typed} secondary={secondary} />,
    code: ({ variant, typed, secondary }) => {
      const isDestructive = variant === "destructive";
      const attrs = [
        "open={open}",
        "onOpenChange={setOpen}",
        `trigger={<Button${isDestructive ? ' variant="destructive"' : ""}>${isDestructive ? "Eliminar registro" : "Publicar cambios"}</Button>}`,
        variant !== "default" ? `variant="${variant}"` : "",
        `title="${isDestructive ? "¿Eliminar el registro?" : "¿Publicar los cambios?"}"`,
        `description="${isDestructive ? "Se borrará de forma permanente." : "Los colaboradores verán la nueva versión."}"`,
        `confirmLabel="${isDestructive ? "Eliminar" : "Publicar"}"`,
        typed ? 'confirmationText="ELIMINAR"' : "",
        secondary ? 'secondaryLabel="Guardar borrador"' : "",
        secondary ? "onSecondary={() => { saveDraft(); setOpen(false); }}" : "",
        "onConfirm={() => { run(); setOpen(false); }}",
      ].filter(Boolean);
      return `const [open, setOpen] = React.useState(false);\n\n<ConfirmDialog\n  ${attrs.join("\n  ")}\n/>`;
    },
  }),
  examples: [
    {
      id: "async",
      title: "Con carga asíncrona",
      description: "`loading` bloquea los botones y muestra el spinner; el diálogo se cierra cuando el consumidor lo decide.",
      code: `const [open, setOpen] = React.useState(false);
const [loading, setLoading] = React.useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={(next) => { if (!loading) setOpen(next); }}
  trigger={<Button variant="outline"><Archive /> Archivar ciclo</Button>}
  title="¿Archivar el ciclo 2026-Q1?"
  description="Dejará de aparecer en el listado activo."
  confirmLabel="Archivar"
  loading={loading}
  onConfirm={async () => {
    setLoading(true);
    await archive();
    setLoading(false);
    setOpen(false);
  }}
/>`,
      render: () => <AsyncDemo />,
    },
    {
      id: "typed",
      title: "Confirmación escrita",
      description: "Con `confirmationText` el botón queda deshabilitado hasta que se escribe el texto exacto. Para borrados con nombre.",
      code: `<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="destructive"><Trash2 /> Eliminar encuesta</Button>}
  variant="destructive"
  title="Eliminar «Clima laboral 2026»"
  description="Se borrarán las 312 respuestas recibidas."
  confirmationText="Clima laboral 2026"
  confirmLabel="Eliminar definitivamente"
  onConfirm={() => { remove(); setOpen(false); }}
/>`,
      render: () => <TypedDemo />,
    },
    {
      id: "three-buttons",
      title: "Tres botones",
      description: "El tercer botón va entre cancelar y confirmar; aquí una salida destructiva junto a un «Guardar y salir» primario.",
      code: `<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  trigger={<Button variant="outline">Salir del editor</Button>}
  variant="warning"
  title="Tienes cambios sin guardar"
  cancelLabel="Seguir editando"
  secondaryLabel="Salir sin guardar"
  secondaryVariant="destructive"
  onSecondary={() => { discard(); setOpen(false); }}
  confirmLabel="Guardar y salir"
  onConfirm={() => { save(); setOpen(false); }}
/>`,
      render: () => <UnsavedDemo />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", description: "Estado controlado. Recomendado siempre: el diálogo no se cierra solo tras `onConfirm`." },
    { name: "trigger", type: "React.ReactNode", description: "Elemento que abre el diálogo; se envuelve con `asChild`." },
    { name: "title", type: "string", description: "Pregunta o acción a confirmar." },
    { name: "description", type: "string", description: "Consecuencia de la acción, en una frase." },
    { name: "variant", type: '"default" | "warning" | "destructive"', default: '"default"', description: "`destructive` pinta el título y el botón de confirmar en rojo." },
    { name: "confirmLabel / cancelLabel", type: "string", default: '"Confirmar" / "Cancelar"', description: "Textos de los botones." },
    { name: "confirmationText", type: "string", description: "Si se indica, hay que escribirlo exactamente para habilitar confirmar." },
    { name: "onConfirm / onCancel", type: "() => void", description: "Callbacks de cada botón. `onConfirm` evita el cierre automático." },
    { name: "loading", type: "boolean", default: "false", description: "Muestra el spinner en confirmar y bloquea todos los botones." },
    { name: "disabled", type: "boolean", default: "false", description: "Bloquea los botones sin spinner." },
    { name: "secondaryLabel / secondaryVariant / onSecondary", type: 'string / "default" | "destructive" | "outline" / () => void', description: "Tercer botón entre cancelar y confirmar." },
    { name: "className", type: "string", description: "Clases para el contenido del diálogo." },
  ],
  guidelines: {
    do: ["Nombra la acción en el botón («Eliminar», «Archivar»), nunca «Aceptar».", "Usa `confirmationText` solo para borrados irreversibles con nombre propio.", "Cierra el diálogo tú mismo después de que la operación asíncrona termine."],
    dont: ["No lo uses para informar: si no hay decisión, es un toast o un `ModalShell`.", "No pongas formularios dentro; para eso está `ModalShell` o `DrawerShell`."],
  },
  related: ["alert-dialog", "modal-shell", "drawer-shell", "button"],
});
