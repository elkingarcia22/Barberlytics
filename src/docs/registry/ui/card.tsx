import * as React from "react";
import { ArrowUpRight, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { defineEntry, definePlayground } from "../types";

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", detail: "Hasta 25 colaboradores" },
  { id: "growth", name: "Growth", price: "$4", detail: "Por colaborador / mes" },
  { id: "enterprise", name: "Enterprise", price: "A medida", detail: "SSO, SLA y soporte dedicado" },
] as const;

function SelectablePlans() {
  const [selected, setSelected] = React.useState<string>("growth");
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {PLANS.map((plan) => {
        const isActive = plan.id === selected;
        return (
          <Card
            key={plan.id}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => setSelected(plan.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelected(plan.id);
              }
            }}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive && "border-primary ring-2 ring-primary/20"
            )}
          >
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {isActive && <Badge>Elegido</Badge>}
              </div>
              <CardDescription>{plan.detail}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-2xl font-bold text-text-primary">{plan.price}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const cardEntry = defineEntry({
  id: "card",
  name: "Card",
  group: "ui",
  description:
    "Superficie elevada que agrupa contenido relacionado con cabecera, cuerpo y pie opcionales. Úsala para resumir una entidad, un métrica o un formulario corto; no como envoltorio genérico de cualquier sección.",
  importPath: 'import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"',
  sourcePath: "src/components/ui/card.tsx",
  status: "stable",
  tags: ["surface"],
  playground: definePlayground({
    controls: {
      title: { type: "text", label: "Título", default: "Onboarding comercial" },
      withDescription: { type: "boolean", label: "Con descripción", default: true },
      withFooter: { type: "boolean", label: "Con pie", default: true },
    },
    render: ({ title, withDescription, withFooter }) => (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {withDescription && <CardDescription>Ruta de 4 semanas para nuevos ejecutivos de cuenta.</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm text-text-secondary">12 módulos · 6 h estimadas · 48 inscritos</CardContent>
        {withFooter && (
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" size="sm">
              Ver detalle
            </Button>
            <Button size="sm">Asignar</Button>
          </CardFooter>
        )}
      </Card>
    ),
    code: ({ title, withDescription, withFooter }) =>
      [
        "<Card>",
        "  <CardHeader>",
        `    <CardTitle>${title}</CardTitle>`,
        withDescription ? "    <CardDescription>Ruta de 4 semanas para nuevos ejecutivos de cuenta.</CardDescription>" : "",
        "  </CardHeader>",
        "  <CardContent>12 módulos · 6 h estimadas · 48 inscritos</CardContent>",
        withFooter ? '  <CardFooter className="justify-end gap-2">\n    <Button variant="ghost" size="sm">Ver detalle</Button>\n    <Button size="sm">Asignar</Button>\n  </CardFooter>' : "",
        "</Card>",
      ]
        .filter(Boolean)
        .join("\n"),
  }),
  examples: [
    {
      id: "stat",
      title: "Tarjeta de métrica",
      description: "Cabecera compacta con icono y un valor grande en el cuerpo.",
      code: `<Card className="w-64">
  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
    <CardDescription>Usuarios activos</CardDescription>
    <Users className="size-4 text-text-muted" />
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">1.284</p>
    <p className="mt-1 flex items-center gap-1 text-xs text-success"><TrendingUp className="size-3" /> +12% vs. mes anterior</p>
  </CardContent>
</Card>`,
      render: () => (
        <Card className="w-64">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Usuarios activos</CardDescription>
            <Users className="size-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-text-primary">1.284</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <TrendingUp className="size-3" /> +12% vs. mes anterior
            </p>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "form",
      title: "Formulario corto",
      description: "Label + Input dentro del cuerpo y las acciones en el pie.",
      code: `<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Crear equipo</CardTitle>
    <CardDescription>Podrás invitar miembros después.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="space-y-1.5">
      <Label htmlFor="team-name">Nombre</Label>
      <Input id="team-name" placeholder="Ventas LATAM" />
    </div>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="ghost">Cancelar</Button>
    <Button>Crear</Button>
  </CardFooter>
</Card>`,
      render: () => (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Crear equipo</CardTitle>
            <CardDescription>Podrás invitar miembros después.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-team-name">Nombre</Label>
              <Input id="card-team-name" placeholder="Ventas LATAM" />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost">Cancelar</Button>
            <Button>Crear</Button>
          </CardFooter>
        </Card>
      ),
    },
    {
      id: "selectable",
      title: "Tarjetas seleccionables",
      description: "La tarjeta actúa como control: `role=\"button\"`, foco visible y anillo cuando está elegida.",
      layout: "stretch",
      code: `const [selected, setSelected] = React.useState("growth");

{PLANS.map((plan) => (
  <Card
    key={plan.id}
    role="button"
    tabIndex={0}
    aria-pressed={plan.id === selected}
    onClick={() => setSelected(plan.id)}
    className={cn("cursor-pointer hover:border-primary/40", plan.id === selected && "border-primary ring-2 ring-primary/20")}
  >
    <CardHeader className="p-4">
      <CardTitle className="text-base">{plan.name}</CardTitle>
      <CardDescription>{plan.detail}</CardDescription>
    </CardHeader>
    <CardContent className="p-4 pt-0 text-2xl font-bold">{plan.price}</CardContent>
  </Card>
))}`,
      render: () => <SelectablePlans />,
    },
    {
      id: "link",
      title: "Con enlace en el pie",
      code: `<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Reporte semanal</CardTitle>
    <CardDescription>Generado el lunes a las 8:00.</CardDescription>
  </CardHeader>
  <CardFooter>
    <Button variant="link" className="px-0" asChild>
      <a href="#/components/table">Abrir reporte <ArrowUpRight /></a>
    </Button>
  </CardFooter>
</Card>`,
      render: () => (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Reporte semanal</CardTitle>
            <CardDescription>Generado el lunes a las 8:00.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="link" className="px-0" asChild>
              <a href="#/components/table">
                Abrir reporte <ArrowUpRight />
              </a>
            </Button>
          </CardFooter>
        </Card>
      ),
    },
  ],
  props: [
    { name: "Card", type: "React.HTMLAttributes<HTMLDivElement>", description: "Contenedor con borde, radio 2xl y sombra `shadow-card`. Acepta `ref`." },
    { name: "CardHeader", type: "React.HTMLAttributes<HTMLDivElement>", description: "Columna con `p-6` y separación entre título y descripción." },
    { name: "CardTitle", type: "React.HTMLAttributes<HTMLDivElement>", description: "Título en 18px bold. Renderiza un div; pon un heading dentro si lo necesitas." },
    { name: "CardDescription", type: "React.HTMLAttributes<HTMLDivElement>", description: "Texto secundario en 14px." },
    { name: "CardContent", type: "React.HTMLAttributes<HTMLDivElement>", description: "Cuerpo con `p-6 pt-0`." },
    { name: "CardFooter", type: "React.HTMLAttributes<HTMLDivElement>", description: "Fila con borde superior para acciones o enlaces." },
  ],
  guidelines: {
    do: ["Una idea por tarjeta: una entidad, una métrica o una acción.", "Alinea las acciones a la derecha del pie y deja una sola primaria.", "Reduce el padding (`p-4`) en cuadrículas densas."],
    dont: ["No anides tarjetas dentro de tarjetas.", "No uses Card como contenedor de página completa; para eso está el layout.", "No mezcles tarjetas con y sin sombra en la misma cuadrícula."],
  },
  related: ["border-beam", "badge", "button"],
});
