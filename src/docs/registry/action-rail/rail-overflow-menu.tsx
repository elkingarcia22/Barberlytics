import * as React from "react";
import { Archive, Copy, Download, Link2, QrCode, Share2, Trash2, UserPlus, Users } from "lucide-react";
import { RailButton, RailOverflowMenu, type RailOrientation, type RailOverflowItem } from "@/components/action-rail";
import { defineEntry, definePlayground } from "../types";
import { RAIL_ICON, RailBar } from "./railDemo";

const ORIENTATIONS = ["horizontal", "vertical"] as const;

interface OverflowDemoProps {
  orientation?: RailOrientation;
  withDanger?: boolean;
  withBlocked?: boolean;
  withSubItems?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

/** Una barra con dos acciones a la vista y el resto plegadas detrás del «⋯». */
function OverflowDemo({ orientation = "horizontal", withDanger = true, withBlocked = true, withSubItems = false, icon, label }: OverflowDemoProps) {
  const [last, setLast] = React.useState<string | null>(null);
  const run = (name: string) => () => setLast(name);
  const items: RailOverflowItem[] = [
    { id: "duplicate", label: "Duplicar", icon: <Copy className="size-4" strokeWidth={2} />, onClick: run("Duplicar") },
    withSubItems
      ? {
          id: "share",
          label: "Compartir",
          icon: <Share2 className="size-4" strokeWidth={2} />,
          onClick: run("Compartir"),
          subItems: [
            { id: "link", label: "Copiar enlace", icon: <Link2 className="size-4" strokeWidth={2} />, onClick: run("Copiar enlace") },
            { id: "qr", label: "Descargar QR", icon: <QrCode className="size-4" strokeWidth={2} />, onClick: run("Descargar QR") },
          ],
        }
      : { id: "share", label: "Compartir", icon: <Share2 className="size-4" strokeWidth={2} />, onClick: run("Compartir") },
    {
      id: "archive",
      label: "Archivar",
      icon: <Archive className="size-4" strokeWidth={2} />,
      onClick: run("Archivar"),
      blockedReason: withBlocked ? "La encuesta sigue activa" : null,
    },
    ...(withDanger
      ? [{ id: "delete", label: "Eliminar", icon: <Trash2 className="size-4" strokeWidth={2} />, onClick: run("Eliminar"), tone: "danger" as const }]
      : []),
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar orientation={orientation}>
        <RailButton icon={<Download className={RAIL_ICON} strokeWidth={2} />} label="Exportar" onClick={run("Exportar")} />
        <RailOverflowMenu items={items} icon={icon} label={label} />
      </RailBar>
      <p className="text-xs text-text-muted">{last ? `Última acción: ${last}` : "Abre el menú y elige una acción"}</p>
    </div>
  );
}

function ParticipantsMenuDemo() {
  const [last, setLast] = React.useState<string | null>(null);
  const items: RailOverflowItem[] = [
    { id: "add", label: "Añadir participantes", icon: <UserPlus className="size-4" strokeWidth={2} />, onClick: () => setLast("Añadir participantes") },
    { id: "export", label: "Exportar lista", icon: <Download className="size-4" strokeWidth={2} />, onClick: () => setLast("Exportar lista") },
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <RailBar>
        <RailOverflowMenu items={items} icon={<Users className={RAIL_ICON} strokeWidth={2} />} label="Participantes" />
      </RailBar>
      <p className="text-xs text-text-muted">{last ?? "El icono del tema dice más que los tres puntos"}</p>
    </div>
  );
}

export const railOverflowMenuEntry = defineEntry({
  id: "rail-overflow-menu",
  name: "RailOverflowMenu",
  group: "action-rail",
  description:
    "Las acciones que no cupieron en la barra, detrás de un solo «⋯». Conservan el orden que tenían en la lista completa, llevan el rótulo escrito y pueden desplegar sub-opciones cuando una acción tiene más de una respuesta.",
  importPath: 'import { RailOverflowMenu, type RailOverflowItem } from "@/components/action-rail"',
  sourcePath: "src/components/action-rail/RailOverflowMenu.tsx",
  status: "stable",
  tags: ["popover", "orientation-aware"],
  playground: definePlayground({
    controls: {
      orientation: { type: "select", options: ORIENTATIONS, default: "horizontal" },
      withDanger: { type: "boolean", label: "Con acción danger", default: true },
      withBlocked: { type: "boolean", label: "Con acción bloqueada", default: true },
      withSubItems: { type: "boolean", label: "Con sub-opciones", default: false },
    },
    render: ({ orientation, withDanger, withBlocked, withSubItems }) => (
      <OverflowDemo orientation={orientation as RailOrientation} withDanger={withDanger} withBlocked={withBlocked} withSubItems={withSubItems} />
    ),
    code: ({ withDanger, withBlocked, withSubItems }) => {
      const share = withSubItems
        ? `  {
    id: "share", label: "Compartir", icon: <Share2 />, onClick: share,
    subItems: [
      { id: "link", label: "Copiar enlace", icon: <Link2 />, onClick: copyLink },
      { id: "qr", label: "Descargar QR", icon: <QrCode />, onClick: downloadQr },
    ],
  },`
        : `  { id: "share", label: "Compartir", icon: <Share2 />, onClick: share },`;
      const archive = withBlocked
        ? `  { id: "archive", label: "Archivar", icon: <Archive />, onClick: archive, blockedReason: "La encuesta sigue activa" },`
        : `  { id: "archive", label: "Archivar", icon: <Archive />, onClick: archive },`;
      const danger = withDanger ? `\n  { id: "delete", label: "Eliminar", icon: <Trash2 />, onClick: remove, tone: "danger" },` : "";
      return `const items: RailOverflowItem[] = [
  { id: "duplicate", label: "Duplicar", icon: <Copy />, onClick: duplicate },
${share}
${archive}${danger}
];

<RailOverflowMenu items={items} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Acciones plegadas",
      description: "El menú se cierra al elegir y llama al `onClick` de la fila. Una fila con `blockedReason` se desactiva y explica el motivo en su `title`.",
      code: `<RailOverflowMenu
  items={[
    { id: "duplicate", label: "Duplicar", icon: <Copy />, onClick: duplicate },
    { id: "share", label: "Compartir", icon: <Share2 />, onClick: share },
    { id: "archive", label: "Archivar", icon: <Archive />, onClick: archive, blockedReason: "La encuesta sigue activa" },
    { id: "delete", label: "Eliminar", icon: <Trash2 />, onClick: remove, tone: "danger" },
  ]}
/>`,
      render: () => <OverflowDemo />,
    },
    {
      id: "sub-items",
      title: "Sub-opciones",
      description: "Con `subItems` la fila abre un segundo popover al lado en vez de ejecutar `onClick`: «Compartir» se vuelve «Copiar enlace» o «Descargar QR».",
      code: `{
  id: "share",
  label: "Compartir",
  icon: <Share2 />,
  onClick: noop,
  subItems: [
    { id: "link", label: "Copiar enlace", icon: <Link2 />, onClick: copyLink },
    { id: "qr", label: "Descargar QR", icon: <QrCode />, onClick: downloadQr },
  ],
}`,
      render: () => <OverflowDemo withSubItems withBlocked={false} />,
    },
    {
      id: "custom-icon",
      title: "Icono y rótulo propios",
      description: "Un menú que agrupa un solo tema se anuncia con el icono de ese tema. `label` alimenta el tooltip y el `aria-label`.",
      code: `<RailOverflowMenu
  icon={<Users />}
  label="Participantes"
  items={[
    { id: "add", label: "Añadir participantes", icon: <UserPlus />, onClick: add },
    { id: "export", label: "Exportar lista", icon: <Download />, onClick: exportList },
  ]}
/>`,
      render: () => <ParticipantsMenuDemo />,
    },
    {
      id: "vertical",
      title: "En una barra vertical",
      description: "El popover abre a la izquierda, centrado en el botón; los sub-menús también se vuelcan hacia la izquierda.",
      code: `// Dentro de una barra vertical no cambia nada en el uso:
<RailOverflowMenu items={items} />`,
      render: () => <OverflowDemo orientation="vertical" withSubItems />,
    },
  ],
  props: [
    { name: "items", type: "readonly RailOverflowItem[]", description: "Las acciones, en el orden de la lista completa. Con un array vacío el botón no se renderiza." },
    { name: "label", type: "string", default: '"Más acciones"', description: "Tooltip y `aria-label` del disparador." },
    { name: "icon", type: "React.ReactNode", default: "<MoreHorizontal />", description: "Icono del disparador, para menús que agrupan un solo tema." },
    { name: "onOpenChange", type: "(open: boolean) => void", description: "Avisa cuando el menú abre o cierra." },
    { name: "RailOverflowItem.id / label / icon / onClick", type: "string / string / ReactNode / () => void", description: "Identidad, rótulo escrito, icono de 16px y la acción de cada fila." },
    { name: "RailOverflowItem.tone", type: '"default" | "danger"', default: '"default"', description: "Fila en rojo para acciones destructivas." },
    { name: "RailOverflowItem.blockedReason", type: "string | null", description: "Desactiva la fila y muestra el motivo como `title`." },
    { name: "RailOverflowItem.subItems", type: "readonly RailOverflowSubItem[]", description: "Sub-opciones; la fila abre otro popover en vez de ejecutar `onClick`." },
  ],
  guidelines: {
    do: [
      "Pliega a partir de la sexta acción: cinco iconos aún se reconocen de un vistazo.",
      "Mantén el orden de la lista completa; quien busca una acción la encuentra en el mismo sitio esté o no plegada.",
      "Usa `subItems` cuando una acción tiene varias formas legítimas, no para anidar categorías.",
    ],
    dont: [
      "No escondas la acción primaria ni las destructivas más frecuentes detrás del «⋯».",
      "No reordenes por importancia al plegar: el menú es la continuación de la barra, no un ranking.",
      "No uses iconos de 20px en las filas; el tile es de 32px y espera 16px.",
    ],
  },
  related: ["rail-button", "action-rail-shell", "rail-settings-menu", "dropdown-menu"],
});
