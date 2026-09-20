import * as React from "react";
import { ThemaMobileTabBar } from "@/components/navigation";
import type { NavigationItem } from "@/components/navigation";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const ITEMS: NavigationItem[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "learning", label: "Aprender", icon: "graduation" },
  { id: "tasks", label: "Tareas", icon: "layers", badge: { count: 3 } },
  { id: "alerts", label: "Avisos", icon: "notification", badge: { dot: true } },
  { id: "profile", label: "Perfil", icon: "users" },
];

const COPY: Record<string, string> = {
  home: "Tu resumen del día.",
  learning: "Cursos en curso y recomendados.",
  tasks: "Tres tareas pendientes esta semana.",
  alerts: "Hay novedades sin leer.",
  profile: "Tus datos y preferencias.",
};

/** Un marco de teléfono para que la barra se lea abajo, como en la app. */
function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex h-[340px] w-full max-w-[390px] flex-col overflow-hidden rounded-[28px] border border-border/60 bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

function BarDemo({ items, initial = "home" }: { items: NavigationItem[]; initial?: string }) {
  const [active, setActive] = React.useState(initial);
  const current = items.find((item) => item.id === active);
  return (
    <Phone>
      <div className="flex flex-1 flex-col justify-end bg-background p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Pantalla</p>
        <h3 className="mt-1 text-lg font-bold text-text-primary">{current?.label}</h3>
        <p className="mt-1 text-[13px] text-text-secondary">{COPY[active] ?? "Sección seleccionada."}</p>
      </div>
      <ThemaMobileTabBar items={items} activeItemId={active} onItemSelect={setActive} />
    </Phone>
  );
}

function PlaygroundDemo({ count, withBadges, disableLast }: { count: number; withBadges: boolean; disableLast: boolean }) {
  const items = ITEMS.slice(0, count).map((item, index) => ({
    ...item,
    badge: withBadges ? item.badge : undefined,
    disabled: disableLast && index === count - 1,
  }));
  return <BarDemo key={`${count}-${disableLast}`} items={items} />;
}

export const themaMobileTabBarEntry = defineEntry({
  id: "thema-mobile-tab-bar",
  name: "ThemaMobileTabBar",
  group: "navigation",
  description:
    "La barra inferior de la app móvil: hasta cinco destinos con icono, etiqueta y un badge opcional (contador o punto). Marca el activo en primario y expone `aria-current` para lectores de pantalla.",
  importPath: 'import { ThemaMobileTabBar } from "@/components/navigation"',
  sourcePath: "src/components/navigation/ThemaMobileTabBar.tsx",
  status: "stable",
  tags: ["mobile", "controlled", "badge"],
  playground: definePlayground({
    controls: {
      count: { type: "number", label: "Destinos", default: 5, min: 2, max: 5, step: 1 },
      withBadges: { type: "boolean", label: "Con badges", default: true },
      disableLast: { type: "boolean", label: "Último deshabilitado", default: false },
    },
    layout: "stretch",
    render: ({ count, withBadges, disableLast }) => <PlaygroundDemo count={count} withBadges={withBadges} disableLast={disableLast} />,
    code: ({ count, withBadges, disableLast }) => {
      const rows = ITEMS.slice(0, count).map((item, index) => {
        const extra = [
          withBadges && item.badge ? `badge: ${item.badge.dot ? "{ dot: true }" : `{ count: ${item.badge.count} }`}` : "",
          disableLast && index === count - 1 ? "disabled: true" : "",
        ].filter(Boolean);
        return `  { id: "${item.id}", label: "${item.label}", icon: "${item.icon}"${extra.length ? `, ${extra.join(", ")}` : ""} },`;
      });
      return `const items: NavigationItem[] = [\n${rows.join("\n")}\n];\nconst [active, setActive] = React.useState("home");\n\n<ThemaMobileTabBar items={items} activeItemId={active} onItemSelect={setActive} />`;
    },
  }),
  examples: [
    {
      id: "basic",
      title: "Cinco destinos con badges",
      description: "Un contador en Tareas y un punto en Avisos. La pantalla cambia con la pestaña activa.",
      layout: "stretch",
      frameClassName: "min-h-[380px]",
      code: `const [active, setActive] = React.useState("home");

<ThemaMobileTabBar
  items={[
    { id: "home", label: "Inicio", icon: "home" },
    { id: "learning", label: "Aprender", icon: "graduation" },
    { id: "tasks", label: "Tareas", icon: "layers", badge: { count: 3 } },
    { id: "alerts", label: "Avisos", icon: "notification", badge: { dot: true } },
    { id: "profile", label: "Perfil", icon: "users" },
  ]}
  activeItemId={active}
  onItemSelect={setActive}
/>`,
      render: () => <BarDemo items={ITEMS} />,
    },
    {
      id: "three",
      title: "Tres destinos",
      description: "Con menos ítems cada uno ocupa más ancho; el componente reparte el espacio con `flex-1`.",
      layout: "stretch",
      frameClassName: "min-h-[380px]",
      code: `<ThemaMobileTabBar
  items={[
    { id: "home", label: "Inicio", icon: "home" },
    { id: "learning", label: "Aprender", icon: "graduation" },
    { id: "profile", label: "Perfil", icon: "users" },
  ]}
  activeItemId={active}
  onItemSelect={setActive}
/>`,
      render: () => <BarDemo items={[ITEMS[0], ITEMS[1], ITEMS[4]]} initial="learning" />,
    },
  ],
  props: [
    { name: "items", type: "NavigationItem[]", description: "Destinos; solo se pintan los cinco primeros. Cada uno admite `icon`, `badge` y `disabled`." },
    { name: "activeItemId", type: "string", description: "Id del destino activo." },
    { name: "onItemSelect", type: "(id: string) => void", description: "Se llama al tocar un destino habilitado." },
    { name: "className", type: "string", description: "Clases para el <nav>; trae `h-16 bg-surface border-t`." },
  ],
  guidelines: {
    do: ["Entre tres y cinco destinos, siempre con etiqueta.", "Usa `badge.dot` para «hay novedades» y `badge.count` solo cuando el número importa.", "Ánclala al fondo de la pantalla con `fixed bottom-0` en la app real."],
    dont: ["No la muestres en escritorio: ahí la navegación es el rail lateral.", "No pongas acciones (crear, subir) como destinos; son navegación, no comandos."],
  },
  related: ["playground-sidebar", "thema-sub-nav", "badge"],
});
