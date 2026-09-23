import * as React from "react";
import { BookOpen, ChevronRight, MoreHorizontal, Pencil, Users } from "lucide-react";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { IconTile } from "@/components/utility/IconTile";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["default", "sm"] as const;
type Size = (typeof SIZES)[number];

const PLANS = [
  { id: "liderazgo", title: "Liderazgo para nuevos managers", description: "8 cursos · 12 h", people: 24, tone: "primary" },
  { id: "datos", title: "Analítica de datos para RR. HH.", description: "5 cursos · 7 h", people: 11, tone: "positive" },
  { id: "onboarding", title: "Onboarding corporativo", description: "3 cursos · 2 h", people: 96, tone: "info" },
] as const;

function PlansList() {
  const [selected, setSelected] = React.useState("liderazgo");
  return (
    <ListItemGroup className="w-full max-w-md">
      {PLANS.map((plan) => (
        <ListItem
          key={plan.id}
          leading={<IconTile icon={<BookOpen />} tone={plan.tone} />}
          title={plan.title}
          description={plan.description}
          meta={`${plan.people} personas`}
          selected={selected === plan.id}
          onClick={() => setSelected(plan.id)}
        />
      ))}
    </ListItemGroup>
  );
}

const CANDIDATES = [
  { id: "am", name: "Ana Morales", role: "Diseñadora de producto", status: "active" },
  { id: "jr", name: "Julián Restrepo", role: "Ingeniero frontend", status: "pending" },
  { id: "cp", name: "Camila Paz", role: "People analyst", status: "completed" },
] as const;

export const listItemEntry = defineEntry({
  id: "list-item",
  name: "ListItem",
  group: "data-display",
  description:
    "Fila de lista con `leading` (avatar, icono o IconTile), título, descripción, `meta` a la derecha y acciones. Con `href` u `onClick` la fila entera se vuelve clicable sin anidar controles: las acciones quedan fuera del área del enlace. `ListItemGroup` apila las filas con espacio entre ellas; cada una lleva su propio borde y radio.",
  importPath: 'import { ListItem, ListItemGroup } from "@/components/data-display/ListItem"',
  sourcePath: "src/components/data-display/ListItem.tsx",
  status: "stable",
  tags: ["list", "a11y"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      title: { type: "text", default: "Liderazgo para nuevos managers" },
      description: { type: "text", default: "8 cursos · 12 h" },
      meta: { type: "text", default: "24 personas" },
      withLeading: { type: "boolean", label: "Con leading", default: true },
      clickable: { type: "boolean", label: "Clicable", default: true },
      selected: { type: "boolean", label: "Seleccionado", default: false },
    },
    layout: "stretch",
    render: ({ size, title, description, meta, withLeading, clickable, selected }) => (
      <ListItemGroup className="max-w-md">
        <ListItem
          size={size as Size}
          leading={withLeading ? <IconTile icon={<BookOpen />} size={size === "sm" ? "sm" : "md"} /> : undefined}
          title={title}
          description={description || undefined}
          meta={meta || undefined}
          onClick={clickable ? () => {} : undefined}
          selected={selected}
        />
      </ListItemGroup>
    ),
    code: ({ size, title, description, meta, withLeading, clickable, selected }) => {
      const attrs = [
        size !== "default" ? `size="${size}"` : "",
        withLeading ? "leading={<IconTile icon={<BookOpen />} />}" : "",
        `title="${title}"`,
        description ? `description="${description}"` : "",
        meta ? `meta="${meta}"` : "",
        clickable ? "onClick={() => select(plan)}" : "",
        selected ? "selected" : "",
      ].filter(Boolean);
      return `<ListItemGroup>
  <ListItem
    ${attrs.join("\n    ")}
  />
</ListItemGroup>`;
    },
  }),
  examples: [
    {
      id: "plans",
      title: "Lista de planes de formación",
      description: "Filas clicables con `onClick` y `selected`: la fila activa recibe un tinte primario y una barra a la izquierda.",
      layout: "stretch",
      code: `<ListItemGroup>
  {plans.map((plan) => (
    <ListItem
      key={plan.id}
      leading={<IconTile icon={<BookOpen />} tone={plan.tone} />}
      title={plan.title}
      description={plan.description}
      meta={\`\${plan.people} personas\`}
      selected={selected === plan.id}
      onClick={() => setSelected(plan.id)}
    />
  ))}
</ListItemGroup>`,
      render: () => <PlansList />,
    },
    {
      id: "actions",
      title: "Con acciones y estado",
      description: "Los botones de `actions` se renderizan fuera del enlace estirado, así la fila navega y los iconos actúan sin conflicto. `meta` admite cualquier nodo, aquí un StatusBadge.",
      layout: "stretch",
      code: `<ListItem
  href="#/candidatos/ana-morales"
  leading={<Avatar><AvatarFallback>AM</AvatarFallback></Avatar>}
  title="Ana Morales"
  description="Diseñadora de producto"
  meta={<StatusBadge status="active" label="En proceso" />}
  actions={
    <>
      <Button variant="ghost" size="icon-xs" aria-label="Editar"><Pencil /></Button>
      <Button variant="ghost" size="icon-xs" aria-label="Más opciones"><MoreHorizontal /></Button>
    </>
  }
/>`,
      render: () => (
        <ListItemGroup className="w-full max-w-md">
          {CANDIDATES.map((candidate) => (
            <ListItem
              key={candidate.id}
              href="#/components/list-item"
              leading={
                <Avatar>
                  <AvatarFallback>{candidate.id.toUpperCase()}</AvatarFallback>
                </Avatar>
              }
              title={candidate.name}
              description={candidate.role}
              meta={<StatusBadge status={candidate.status} />}
              actions={
                <>
                  <Button variant="ghost" size="icon-xs" aria-label={`Editar a ${candidate.name}`}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label={`Más opciones de ${candidate.name}`}>
                    <MoreHorizontal />
                  </Button>
                </>
              }
            />
          ))}
        </ListItemGroup>
      ),
    },
    {
      id: "static",
      title: "Estática, sin grupo",
      description: "Sin `href` ni `onClick` la fila no tiene hover ni foco. Fuera de `ListItemGroup` no lleva `role=\"listitem\"`, así puede vivir dentro de una tarjeta.",
      layout: "stretch",
      code: `<ListItem
  leading={<IconTile icon={<Users />} tone="neutral" />}
  title="Equipo de Producto"
  description="14 personas · Bogotá"
  meta="Actualizado hoy"
/>`,
      render: () => (
        <div className="w-full max-w-md rounded-xl border border-border/60 bg-surface shadow-card">
          <ListItem leading={<IconTile icon={<Users />} tone="neutral" />} title="Equipo de Producto" description="14 personas · Bogotá" meta="Actualizado hoy" />
        </div>
      ),
    },
    {
      id: "compact",
      title: "Tamaño sm con chevron",
      description: "Filas de 40px para menús y paneles laterales; un ChevronRight en `actions` indica navegación.",
      layout: "stretch",
      code: `<ListItem size="sm" href="…" title="Vacantes abiertas" meta="12" actions={<ChevronRight className="size-4 text-text-muted" />} />`,
      render: () => (
        <ListItemGroup className="w-72">
          {[
            ["Vacantes abiertas", "12"],
            ["Candidatos nuevos", "48"],
            ["Entrevistas esta semana", "7"],
          ].map(([label, count]) => (
            <ListItem key={label} size="sm" href="#/components/list-item" title={label} meta={count} actions={<ChevronRight className="size-4 text-text-muted" />} />
          ))}
        </ListItemGroup>
      ),
    },
    {
      id: "inside-shell",
      title: "Como cuerpo de un marco",
      description:
        "En la vista de lista de una tabla las filas ocupan todo el ancho y el marco se descarga: sin fondo ni borde bajo la cabecera. Cada fila conserva su borde —es lo que la separa de la siguiente— y el grupo no pone padding lateral, así las tarjetas llegan de lado a lado.",
      layout: "stretch",
      code: `<TableShell title="Lista de procesos" surface="header">
  <ListItemGroup className="py-2">
    <ListItem title="Plan trimestral 2026" description="Trimestre · 3 elementos" meta="7%" onClick={…} />
    <ListItem title="Seguimiento mensual 2026" description="Año · 10 elementos" meta="30%" onClick={…} />
  </ListItemGroup>
</TableShell>`,
      render: () => (
        <div className="w-full">
          <div className="border-b border-border/60 bg-surface p-card">
            <p className="text-base font-semibold text-text-primary">Lista de procesos</p>
          </div>
          <ListItemGroup className="py-2">
            {[
              ["Plan trimestral 2026", "Trimestre · 3 elementos", "7%"],
              ["Seguimiento mensual 2026", "Año · 10 elementos", "30%"],
              ["Revisión semestral 2026", "Mes · 4 elementos", "53%"],
            ].map(([title, description, meta]) => (
              <ListItem key={title} title={title} description={description} meta={meta} onClick={() => undefined} />
            ))}
          </ListItemGroup>
        </div>
      ),
    },
  ],
  props: [
    { name: "leading", type: "React.ReactNode", description: "Avatar, icono o IconTile a la izquierda, con 12px hasta el texto." },
    { name: "title", type: "React.ReactNode", description: "Una línea; se trunca con elipsis." },
    { name: "description", type: "React.ReactNode", description: "Línea secundaria, 4px bajo el título." },
    { name: "meta", type: "React.ReactNode", description: "Texto o badge alineado a la derecha, con dígitos tabulares." },
    { name: "actions", type: "React.ReactNode", description: "Botones a la derecha. Quedan fuera del área clicable." },
    { name: "href", type: "string", description: "Convierte la fila en un `<a>` estirado." },
    { name: "onClick", type: "React.MouseEventHandler", description: "Convierte la fila en un `<button>` (o se añade al `<a>` si hay `href`)." },
    { name: "selected", type: "boolean", default: "false", description: "Tinte primario y barra a la izquierda; `aria-pressed` / `aria-current` en el control." },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "Alto de ~40px o ~56px." },
    { name: "ListItemGroup", type: 'React.HTMLAttributes<"div">', description: "Contenedor con `role=\"list\"` que apila las filas con espacio entre ellas (cada fila trae su propio borde y radio `xl`). No pone padding lateral: las tarjetas llegan hasta donde llegue su contenedor." },
  ],
  guidelines: {
    do: ["Elige una convención de `leading` por lista: todos avatares o todos IconTile.", "Usa `meta` para un dato corto y `actions` para como máximo dos iconos.", "Da a los botones de `actions` un `aria-label` que incluya el nombre de la fila."],
    dont: ["No metas un enlace dentro de `title` si la fila ya es clicable.", "No uses ListItem para tablas con más de tres columnas: ahí va TableShell.", "No combines `selected` con `href` salvo para marcar la ruta actual."],
  },
  related: ["icon-tile", "avatar", "status-badge", "table-shell"],
});
