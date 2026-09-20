import * as React from "react";
import { FileText, LayoutDashboard, Settings, Share2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { defineEntry, definePlayground } from "../types";

const SIDES = ["right", "left", "bottom", "top"] as const;
type Side = (typeof SIDES)[number];

function EditSheet() {
  const [name, setName] = React.useState("Clima Q3");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Editar encuesta</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar encuesta</SheetTitle>
          <SheetDescription>Los cambios se aplican al guardar.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="sheet-name">Nombre</Label>
            <Input id="sheet-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sheet-owner">Responsable</Label>
            <Input id="sheet-owner" defaultValue="Ana Suárez" />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end">
          <SheetClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Guardar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const NAV = [
  { icon: LayoutDashboard, label: "Resumen" },
  { icon: FileText, label: "Encuestas" },
  { icon: Users, label: "Personas" },
  { icon: Settings, label: "Ajustes" },
];

function NavSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir menú</Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Navegación</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          {NAV.map(({ icon: Icon, label }) => (
            <SheetClose key={label} asChild>
              <button type="button" className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-muted">
                <Icon className="size-4 text-text-secondary" /> {label}
              </button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function ActionsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Acciones</Button>
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Clima Q3</SheetTitle>
          <SheetDescription>¿Qué quieres hacer con esta encuesta?</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
          <SheetClose asChild>
            <Button variant="outline" className="justify-start">
              <Share2 /> Compartir resultados
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="outline" className="justify-start text-destructive">
              <Trash2 /> Eliminar
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const sheetEntry = defineEntry({
  id: "sheet",
  name: "Sheet",
  group: "ui",
  description:
    "Panel lateral (o inferior/superior) sobre un velo difuminado: entra recorriendo todo su ancho con curva expo-out en 500ms y sale en 300ms. Úsalo para editar un registro, navegar en móvil o mostrar acciones sin abandonar la página.",
  importPath: 'import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"',
  sourcePath: "src/components/ui/sheet.tsx",
  status: "stable",
  tags: ["radix-dialog", "overlay", "animación"],
  playground: definePlayground({
    controls: {
      side: { type: "select", options: SIDES, default: "right" },
      showCloseButton: { type: "boolean", label: "Botón cerrar", default: true },
    },
    render: ({ side, showCloseButton }) => (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir desde {side}</Button>
        </SheetTrigger>
        <SheetContent side={side as Side} showCloseButton={showCloseButton}>
          <SheetHeader>
            <SheetTitle>Panel lateral</SheetTitle>
            <SheetDescription>Entra desde el lado «{side}» recorriendo todo su ancho.</SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row justify-end">
            <SheetClose asChild>
              <Button>Listo</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
    code: ({ side, showCloseButton }) => `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Abrir desde ${side}</Button>
  </SheetTrigger>
  <SheetContent${side !== "right" ? ` side="${side}"` : ""}${showCloseButton ? "" : " showCloseButton={false}"}>
    <SheetHeader>
      <SheetTitle>Panel lateral</SheetTitle>
      <SheetDescription>Entra desde el lado «${side}» recorriendo todo su ancho.</SheetDescription>
    </SheetHeader>
    <SheetFooter className="flex-row justify-end">
      <SheetClose asChild><Button>Listo</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
  }),
  examples: [
    {
      id: "edit-form",
      title: "Formulario de edición (right)",
      description: "El caso más común: header, campos y un footer con las acciones al fondo (`mt-auto`).",
      code: `<Sheet>
  <SheetTrigger asChild><Button variant="outline">Editar encuesta</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editar encuesta</SheetTitle>
      <SheetDescription>Los cambios se aplican al guardar.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 px-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
    </div>
    <SheetFooter className="flex-row justify-end">
      <SheetClose asChild><Button variant="ghost">Cancelar</Button></SheetClose>
      <SheetClose asChild><Button>Guardar</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
      render: () => <EditSheet />,
    },
    {
      id: "nav",
      title: "Navegación (left)",
      description: "Cada enlace envuelto en SheetClose cierra el panel al elegir.",
      code: `<SheetContent side="left" className="sm:max-w-xs">
  <SheetHeader><SheetTitle>Navegación</SheetTitle></SheetHeader>
  <nav className="flex flex-col gap-1 px-2">
    {items.map(({ icon: Icon, label }) => (
      <SheetClose key={label} asChild>
        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
          <Icon className="size-4" /> {label}
        </button>
      </SheetClose>
    ))}
  </nav>
</SheetContent>`,
      render: () => <NavSheet />,
    },
    {
      id: "actions",
      title: "Acciones (bottom)",
      description: "Con `h-auto` el panel inferior mide lo que su contenido; sin botón de cerrar, se cierra tocando el velo.",
      code: `<SheetContent side="bottom" showCloseButton={false}>
  <SheetHeader>
    <SheetTitle>Clima Q3</SheetTitle>
    <SheetDescription>¿Qué quieres hacer con esta encuesta?</SheetDescription>
  </SheetHeader>
  <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
    <SheetClose asChild><Button variant="outline"><Share2 /> Compartir resultados</Button></SheetClose>
    <SheetClose asChild><Button variant="outline" className="text-destructive"><Trash2 /> Eliminar</Button></SheetClose>
  </div>
</SheetContent>`,
      render: () => <ActionsSheet />,
    },
  ],
  props: [
    { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"right"', description: "Lado de anclaje; fija posición, radio, borde y la animación de entrada/salida." },
    { name: "showCloseButton", type: "boolean", default: "true", description: "Botón X fantasma en la esquina superior derecha." },
    { name: "modal", type: "boolean", default: "true", description: "Debe coincidir con el `modal` de `Sheet`. En `false` el componente pinta su propio velo (z-40) para no dejar la página clicable." },
    { name: "overlayClassName / overlayStyle", type: "string / CSSProperties", description: "Recortan o desplazan el velo cuando el panel convive con algo fuera de él (p. ej. el Agente IA)." },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Estado controlado, en `Sheet`." },
    { name: "useBodyScrollLock(active)", type: "hook", description: "Exportado del mismo archivo: bloquea el scroll del body en drawers no modales, con contador para varios a la vez." },
  ],
  guidelines: {
    do: ["Usa `right` para editar, `left` para navegar y `bottom` para acciones en móvil.", "Cierra con SheetClose desde los botones del footer.", "Pon siempre SheetTitle: Radix lo exige para accesibilidad."],
    dont: ["No lo uses para confirmaciones cortas: usa Dialog o AlertDialog.", "No mezcles `modal={false}` en Sheet sin pasarlo también a SheetContent."],
  },
  related: ["dialog", "drawer-shell", "popover", "button"],
});
