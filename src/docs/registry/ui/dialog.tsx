import * as React from "react";
import { Loader2, Pencil, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defineEntry, definePlayground } from "../types";

function EditProfileDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("Ana Torres");
  const [saving, setSaving] = React.useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setOpen(false);
    }, 900);
  };

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-text-secondary">
        Nombre actual: <span className="font-medium text-text-primary">{name}</span>
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil /> Editar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={submit} className="contents">
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Los cambios se verán en toda la plataforma.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="dialog-name">Nombre completo</Label>
              <Input id="dialog-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={saving}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving || name.trim() === ""}>
                {saving && <Loader2 className="animate-spin" />}
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const dialogEntry = defineEntry({
  id: "dialog",
  name: "Dialog",
  group: "ui",
  description:
    "Ventana modal centrada para tareas cortas que requieren atención sin abandonar la pantalla: editar un campo, compartir, ver un detalle. Para confirmaciones destructivas usa AlertDialog; para flujos largos, un Sheet.",
  importPath: 'import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"',
  sourcePath: "src/components/ui/dialog.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Compartir curso" },
      showCloseButton: { type: "boolean", label: "Botón X", default: true },
      withFooter: { type: "boolean", label: "Con pie", default: true },
      footerClose: { type: "boolean", label: "Botón «Close» en el pie", default: false },
    },
    render: ({ title, showCloseButton, withFooter, footerClose }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Share2 /> Abrir diálogo
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={showCloseButton}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Cualquiera con el enlace podrá ver el contenido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pg-dialog-link">Enlace</Label>
            <Input id="pg-dialog-link" readOnly value="https://app.ubits.co/c/liderazgo-101" />
          </div>
          {withFooter && (
            <DialogFooter showCloseButton={footerClose}>
              <Button>Copiar enlace</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    ),
    code: ({ title, showCloseButton, withFooter, footerClose }) => `<Dialog>
  <DialogTrigger asChild>
    <Button><Share2 /> Abrir diálogo</Button>
  </DialogTrigger>
  <DialogContent${showCloseButton ? "" : " showCloseButton={false}"}>
    <DialogHeader>
      <DialogTitle>${title}</DialogTitle>
      <DialogDescription>Cualquiera con el enlace podrá ver el contenido.</DialogDescription>
    </DialogHeader>
    <Label htmlFor="link">Enlace</Label>
    <Input id="link" readOnly value="https://app.ubits.co/c/liderazgo-101" />${
      withFooter ? `\n    <DialogFooter${footerClose ? " showCloseButton" : ""}>\n      <Button>Copiar enlace</Button>\n    </DialogFooter>` : ""
    }
  </DialogContent>
</Dialog>`,
  }),
  examples: [
    {
      id: "form",
      title: "Formulario controlado",
      description: "El diálogo se cierra desde el estado del padre cuando termina el guardado; `DialogClose` cancela sin lógica extra.",
      code: `const [open, setOpen] = React.useState(false);

const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  await saveProfile();
  setOpen(false);
};

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm"><Pencil /> Editar</Button>
  </DialogTrigger>
  <DialogContent>
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>Los cambios se verán en toda la plataforma.</DialogDescription>
      </DialogHeader>
      <Label htmlFor="name">Nombre completo</Label>
      <Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
      render: () => <EditProfileDialog />,
    },
    {
      id: "info",
      title: "Solo lectura",
      description: "Sin pie ni acciones: el usuario cierra con la X, Escape o clic fuera.",
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost">Ver detalles del plan</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Plan Growth</DialogTitle>
      <DialogDescription>Facturación mensual por colaborador activo.</DialogDescription>
    </DialogHeader>
    <ul className="list-disc space-y-1 pl-5 text-text-secondary">
      <li>Catálogo completo de cursos</li>
      <li>Rutas de aprendizaje ilimitadas</li>
      <li>Reportes de progreso por equipo</li>
    </ul>
  </DialogContent>
</Dialog>`,
      render: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost">Ver detalles del plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plan Growth</DialogTitle>
              <DialogDescription>Facturación mensual por colaborador activo.</DialogDescription>
            </DialogHeader>
            <ul className="list-disc space-y-1 pl-5 text-text-secondary">
              <li>Catálogo completo de cursos</li>
              <li>Rutas de aprendizaje ilimitadas</li>
              <li>Reportes de progreso por equipo</li>
            </ul>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      id: "wide",
      title: "Ancho personalizado",
      description: "Sobrescribe `sm:max-w-*` en `DialogContent` para contenido más amplio.",
      code: `<DialogContent className="sm:max-w-2xl">…</DialogContent>`,
      render: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir diálogo ancho</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comparativa de planes</DialogTitle>
              <DialogDescription>Un diálogo de 672px para tablas o contenido en columnas.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Starter", "Growth", "Enterprise"].map((plan) => (
                <div key={plan} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-semibold text-text-primary">{plan}</p>
                  <p className="text-xs text-text-muted">Detalle del plan</p>
                </div>
              ))}
            </div>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ),
    },
  ],
  props: [
    { name: "open / defaultOpen", type: "boolean", description: "Estado de apertura. Usa `open` + `onOpenChange` para controlarlo." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Se dispara al abrir o cerrar (X, Escape, clic fuera o DialogClose)." },
    { name: "modal", type: "boolean", default: "true", description: "Bloquea la interacción con el resto de la página." },
    { name: "DialogContent.showCloseButton", type: "boolean", default: "true", description: "Muestra la X en la esquina superior derecha." },
    { name: "DialogContent.className", type: "string", description: "Sobrescribe el ancho (`sm:max-w-*`) u otros estilos del panel." },
    { name: "DialogFooter.showCloseButton", type: "boolean", default: "false", description: "Añade un botón outline «Close» que cierra el diálogo." },
    { name: "DialogClose", type: "Radix Close", description: "Cualquier elemento con `asChild` que cierra el diálogo al hacer clic." },
  ],
  guidelines: {
    do: ["Incluye siempre `DialogTitle` (y `DialogDescription` si aporta contexto) para accesibilidad.", "Mantén el contenido en una sola columna y sin scroll interno cuando sea posible.", "Devuelve el foco al trigger al cerrar; Radix lo hace por ti si usas `DialogTrigger`."],
    dont: ["No abras un diálogo desde otro diálogo.", "No lo uses para confirmaciones destructivas; usa AlertDialog.", "No metas flujos de varios pasos; usa un Sheet o una página."],
  },
  related: ["alert-dialog", "sheet", "command", "popover"],
});
