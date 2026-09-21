import * as React from "react";
import { Bell, Search } from "lucide-react";
import { ThemaProductHeader } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";

const Avatar = () => (
  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary ring-1 ring-primary/20">EM</div>
);

const ThemaLogo = () => (
  <div className="flex items-center gap-2 border-r border-border pr-4">
    <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
      <ThemaIcon name="sparkles" size="xs" tone="inverse" />
    </div>
    <span className="text-[13px] font-bold tracking-tight text-text-primary">Thema</span>
  </div>
);

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="w-full rounded-2xl bg-surface-subtle p-4">{children}</div>;
}

function NotificationsDemo() {
  const [unread, setUnread] = React.useState(4);
  return (
    <Shell>
      <ThemaProductHeader title="Aprendizaje" logo={<ThemaLogo />}>
        <Button variant="ghost" size="icon" aria-label="Buscar">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Notificaciones (${unread})`} className="relative" onClick={() => setUnread(0)}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-text-inverse">{unread}</span>
          )}
        </Button>
        <Avatar />
      </ThemaProductHeader>
    </Shell>
  );
}

function PlaygroundDemo({ title, customLogo, withActions }: { title: string; customLogo: boolean; withActions: boolean }) {
  return (
    <Shell>
      <ThemaProductHeader title={title} logo={customLogo ? <ThemaLogo /> : undefined}>
        {withActions && (
          <>
            <Badge variant="secondary">Beta</Badge>
            <Button size="sm">Nueva ruta</Button>
            <Avatar />
          </>
        )}
      </ThemaProductHeader>
    </Shell>
  );
}

export const themaProductHeaderEntry = defineEntry({
  id: "thema-product-header",
  name: "ThemaProductHeader",
  group: "navigation",
  description:
    "La cabecera de un producto dentro de la plataforma: logo del cliente a la izquierda, título del módulo y un hueco a la derecha para acciones, notificaciones y perfil. Sin logo propio muestra la marca del cliente por defecto.",
  importPath: 'import { ThemaProductHeader } from "@/components/navigation"',
  sourcePath: "src/components/navigation/ThemaProductHeader.tsx",
  status: "stable",
  tags: ["header", "slot"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Desempeño" },
      customLogo: { type: "boolean", label: "Logo propio", default: true },
      withActions: { type: "boolean", label: "Con acciones", default: true },
    },
    layout: "stretch",
    render: ({ title, customLogo, withActions }) => <PlaygroundDemo title={title} customLogo={customLogo} withActions={withActions} />,
    code: ({ title, customLogo, withActions }) => {
      const open = `<ThemaProductHeader title="${title}"${customLogo ? " logo={<ThemaLogo />}" : ""}>`;
      const body = withActions ? `\n  <Badge variant="secondary">Beta</Badge>\n  <Button size="sm">Nueva ruta</Button>\n  <Avatar />\n` : "";
      return `${open}${body}</ThemaProductHeader>`;
    },
  }),
  examples: [
    {
      id: "notifications",
      title: "Con notificaciones",
      description: "Los hijos van al bloque derecho. La campana lleva su propio contador y se limpia al pulsarla.",
      layout: "stretch",
      code: `const [unread, setUnread] = React.useState(4);

<ThemaProductHeader title="Aprendizaje" logo={<ThemaLogo />}>
  <Button variant="ghost" size="icon" aria-label="Buscar"><Search /></Button>
  <Button variant="ghost" size="icon" className="relative" onClick={() => setUnread(0)}>
    <Bell />
    {unread > 0 && <span className="…badge…">{unread}</span>}
  </Button>
  <Avatar />
</ThemaProductHeader>`,
      render: () => <NotificationsDemo />,
    },
    {
      id: "default-logo",
      title: "Logo por defecto",
      description: "Sin `logo` aparece la marca del cliente de ejemplo; en producción pásale siempre la real.",
      layout: "stretch",
      code: `<ThemaProductHeader title="Encuestas">
  <Button size="sm" variant="outline">Exportar</Button>
</ThemaProductHeader>`,
      render: () => (
        <Shell>
          <ThemaProductHeader title="Encuestas">
            <Button size="sm" variant="outline">Exportar</Button>
          </ThemaProductHeader>
        </Shell>
      ),
    },
  ],
  props: [
    { name: "title", type: "string", description: "Nombre del módulo o producto, en h1." },
    { name: "logo", type: "React.ReactNode", description: "Marca del cliente. Si se omite, se muestra un logo de ejemplo." },
    { name: "children", type: "React.ReactNode", description: "Acciones alineadas a la derecha (botones, badges, avatar)." },
    { name: "className", type: "string", description: "Clases para el <header>; trae `h-16 rounded-xl shadow-card`." },
  ],
  guidelines: {
    do: ["Una sola cabecera por producto, encima de la sub-navegación.", "Coloca el perfil siempre como último hijo, a la derecha del todo.", "Usa botones `ghost` de icono para búsqueda y notificaciones."],
    dont: ["No metas el título de la página aquí: este es el nombre del producto, no de la vista.", "No pases más de tres o cuatro acciones; el resto va a un menú."],
  },
  related: ["thema-tabs", "page-header", "button", "badge"],
});
