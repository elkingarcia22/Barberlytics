import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { defineEntry, definePlayground } from "../types";

const SHAPES = ["línea", "círculo", "rectángulo"] as const;
type Shape = (typeof SHAPES)[number];

const SHAPE_CLASS: Record<Shape, string> = {
  línea: "h-4 w-48",
  círculo: "size-10 rounded-full",
  rectángulo: "h-24 w-56 rounded-xl",
};

function ProfileSkeleton() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-border/60 bg-surface p-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="mt-1 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

const ROWS = Array.from({ length: 4 }, (_, index) => index);

function TableSkeleton() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-surface">
      <div className="grid grid-cols-[1fr_96px_64px] gap-4 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
      {ROWS.map((row) => (
        <div key={row} className="grid grid-cols-[1fr_96px_64px] items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-3.5 w-10" />
        </div>
      ))}
    </div>
  );
}

const LOAD_MS = 1600;

function LoadThenShow() {
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    if (!isLoading) return;
    const timer = window.setTimeout(() => setIsLoading(false), LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">AS</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Ana Suárez</span>
            <span className="text-xs text-text-secondary">People Lead · Bogotá</span>
          </div>
        </div>
      )}
      <Button size="sm" variant="outline" className="self-start" onClick={() => setIsLoading(true)} disabled={isLoading}>
        {isLoading ? "Cargando…" : "Volver a cargar"}
      </Button>
    </div>
  );
}

export const skeletonEntry = defineEntry({
  id: "skeleton",
  name: "Skeleton",
  group: "ui",
  description:
    "Marcador de posición con pulso suave que ocupa el sitio del contenido mientras llega. Compón varios con las mismas medidas del contenido final para que la pantalla no salte al cargar.",
  importPath: 'import { Skeleton } from "@/components/ui/skeleton"',
  sourcePath: "src/components/ui/skeleton.tsx",
  status: "stable",
  tags: ["loading", "css"],
  playground: definePlayground({
    controls: {
      shape: { type: "select", label: "Forma", options: SHAPES, default: "línea" },
      count: { type: "number", label: "Cantidad", default: 3, min: 1, max: 6, step: 1 },
    },
    render: ({ shape, count }) => (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className={SHAPE_CLASS[shape as Shape]} />
        ))}
      </div>
    ),
    code: ({ shape, count }) => {
      const cls = SHAPE_CLASS[shape as Shape];
      return Array.from({ length: count }, () => `<Skeleton className="${cls}" />`).join("\n");
    },
  }),
  examples: [
    {
      id: "profile",
      title: "Perfil",
      description: "Avatar redondo y dos líneas de distinto largo: la forma del contenido real.",
      code: `<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-1 flex-col gap-2">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-1/3" />
  </div>
</div>`,
      render: () => <ProfileSkeleton />,
    },
    {
      id: "card",
      title: "Tarjeta",
      description: "Mantén el marco real (borde, padding) y sustituye solo el contenido.",
      code: `<div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface p-4">
  <Skeleton className="h-28 w-full rounded-lg" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-3 w-full" />
  <Skeleton className="h-3 w-5/6" />
  <div className="mt-1 flex gap-2">
    <Skeleton className="h-8 w-20 rounded-md" />
    <Skeleton className="h-8 w-16 rounded-md" />
  </div>
</div>`,
      render: () => <CardSkeleton />,
    },
    {
      id: "table-rows",
      title: "Filas de tabla",
      description: "Una fila esqueleto por fila esperada, con las mismas columnas.",
      code: `{rows.map((row) => (
  <div key={row} className="grid grid-cols-[1fr_96px_64px] items-center gap-4 border-b px-4 py-3">
    <div className="flex items-center gap-2">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-3.5 w-32" />
    </div>
    <Skeleton className="h-5 w-16 rounded-md" />
    <Skeleton className="h-3.5 w-10" />
  </div>
))}`,
      render: () => <TableSkeleton />,
    },
    {
      id: "swap",
      title: "Sustitución por contenido",
      description: "El esqueleto y el contenido comparten dimensiones, así el cambio no mueve nada.",
      code: `{isLoading ? <ProfileSkeleton /> : <ProfileRow user={user} />}`,
      render: () => <LoadThenShow />,
    },
  ],
  props: [
    { name: "className", type: "string", description: "Define ancho, alto y radio. Sin clases mide 0px: el esqueleto siempre necesita dimensiones." },
    { name: "...props", type: 'React.ComponentProps<"div">', description: "Cualquier atributo nativo de <div>." },
  ],
  guidelines: {
    do: ["Replica la silueta del contenido final: mismas alturas, anchos aproximados y radios.", "Usa `rounded-full` para avatares y `rounded-md/lg` para botones y medios.", "Muéstralo solo si la carga tarda más de ~300ms para evitar parpadeos."],
    dont: ["No lo uses para acciones en curso (guardar, enviar): ahí va Progress o un spinner.", "No pongas un único bloque gris gigante; varias piezas comunican mejor qué viene."],
  },
  related: ["progress", "card", "table"],
});
