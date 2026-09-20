import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Marco acotado para los shells de pantalla completa. Fija la altura y fuerza
 * al hijo directo a llenarla (los shells se dimensionan con `h-screen` /
 * `h-dvh`, que aquí no sirven). `translateZ(0)` convierte al marco en el
 * bloque contenedor de cualquier `position: fixed` interno —el drawer móvil
 * del sidebar, el velo, una barra vertical— para que no se escape al
 * viewport de la documentación.
 */
export function ShellFrame({
  children,
  className,
  height = 520,
}: {
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-xl border border-border/60 bg-background [&>*]:!h-full", className)}
      style={{ height, transform: "translateZ(0)" }}
    >
      {children}
    </div>
  );
}

const STATS = [
  { label: "Colaboradores activos", value: "1.284", delta: "+3,2 %" },
  { label: "Cursos en curso", value: "96", delta: "+12" },
  { label: "Evaluaciones pendientes", value: "27", delta: "−4" },
  { label: "Participación", value: "87 %", delta: "+1,5 pt" },
] as const;

/** Cuatro tarjetas de métricas, el contenido típico de un dashboard. */
export function DemoStats({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {STATS.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-text-primary">{stat.value}</p>
          <p className="mt-1 text-xs font-medium text-status-positive">{stat.delta}</p>
        </div>
      ))}
    </div>
  );
}

/** Un bloque de contenido largo, para ver el scroll de un shell. */
export function DemoLongContent({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold text-text-primary">Sección {index + 1}</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Contenido de relleno para que la página tenga más alto que el marco y el scroll quede dentro del shell, no en la documentación.
          </p>
        </div>
      ))}
    </div>
  );
}

/** Una columna de contenido vacía con retícula, para acompañar un sidebar o un header sueltos. */
export function DemoCanvas({ label = "Contenido de la pantalla", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface text-[13px] text-text-muted", className)}>
      {label}
    </div>
  );
}

/** Botón discreto para los controles de las demos. */
export function DemoButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-subtle",
        active && "border-primary/40 bg-primary/5 text-primary"
      )}
    >
      {children}
    </button>
  );
}
