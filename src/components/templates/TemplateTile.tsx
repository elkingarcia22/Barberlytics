import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneAccent, toneBar, toneChip, toneGradient } from "@/lib/tone";
import { templateThumbWeights, type TemplateDefinition } from "./templateTypes";

/**
 * La ficha de una plantilla: un fondo degradado en su tono, una miniatura que
 * dibuja las líneas que la plantilla trae con sus barras de peso, la insignia
 * de la plantilla clavada en una esquina, y debajo su nombre y su medida.
 *
 * No es una tarjeta de métrica con un icono: es el retrato de lo que hay
 * dentro. Quien mira una estantería reconoce «esta trae tres líneas y una
 * pesa el doble» antes de leer un solo nombre, y esa es toda la gracia.
 *
 * La miniatura se dibuja con divs y tokens —nada de imágenes ni de SVG
 * traído de fuera—, así que hereda el tema y el modo claro/oscuro sin tener
 * que existir en dos versiones.
 */

/** Cuántas líneas caben en cada tamaño de miniatura. */
const THUMB_LINES: Readonly<Record<TemplateThumbSize, number>> = { sm: 3, md: 3, lg: 4 };

const THUMB_SIZE_CLASSES: Readonly<Record<TemplateThumbSize, string>> = {
  sm: "h-12 w-10 gap-[3px] rounded-[7px] px-1.5 pt-2",
  md: "h-14 w-[46px] gap-[3px] rounded-lg px-1.5 pt-2",
  lg: "h-[68px] w-14 gap-1 rounded-[9px] px-2 pt-2.5",
};

/** El largo que llega a tener la barra de peso más pesada, por tamaño. */
const THUMB_BAR_WIDTH: Readonly<Record<TemplateThumbSize, number>> = { sm: 8, md: 9, lg: 12 };

export type TemplateThumbSize = "sm" | "md" | "lg";

export interface TemplateThumbProps {
  template: TemplateDefinition;
  size?: TemplateThumbSize;
  /** Una ficha de «ver más»: contorno punteado, el icono solo y sin insignia. */
  dashed?: boolean;
  className?: string;
}

/**
 * La lista de la plantilla en miniatura: una línea de título en su tono y
 * debajo una fila por línea, cada una con el hueco de su nombre y la barra de
 * lo que pesa. Se inclina un poco cuando se pasa el puntero por su `.group`,
 * como una hoja que se levanta de un montón.
 */
export function TemplateThumb({
  template,
  size = "sm",
  dashed = false,
  className,
}: TemplateThumbProps) {
  const { icon: Icon, tone, items } = template;
  const weights = templateThumbWeights(items, THUMB_LINES[size]);
  const barWidth = THUMB_BAR_WIDTH[size];
  const isLarge = size === "lg";

  return (
    <span className={cn("relative z-[1] mb-1 mr-1 block shrink-0", className)}>
      <span
        className={cn(
          "flex flex-col border shadow-card transition-transform duration-normal ease-out-expo",
          "group-hover:-translate-y-0.5 group-hover:-rotate-2",
          "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:rotate-0",
          THUMB_SIZE_CLASSES[size],
          dashed
            ? "items-center justify-center border-dashed border-border bg-surface pt-0"
            : "border-border/70 bg-surface"
        )}
      >
        {dashed ? (
          <Icon className="h-4 w-4 text-text-muted" strokeWidth={2} aria-hidden />
        ) : (
          <>
            {/* El título de la hoja, en el tono de la insignia: miniatura e
                insignia tienen que leerse como un solo objeto. */}
            <span
              className={cn("rounded-full", isLarge ? "h-1 w-6" : "h-[3px] w-4")}
              style={toneBar(tone, 70)}
            />
            {weights.map((weight, index) => (
              <span key={index} className="mt-px flex items-center gap-[2px]">
                <span className="h-[2px] flex-1 rounded-full bg-border" />
                <span
                  className="h-[3px] rounded-full"
                  style={{ width: `${weight * barWidth}px`, ...toneBar(tone, 70) }}
                />
              </span>
            ))}
          </>
        )}
      </span>
      {!dashed && (
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-1.5 -right-2 flex items-center justify-center rounded-full ring-2 ring-surface",
            "transition-transform duration-normal group-hover:scale-110",
            "motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            isLarge ? "size-[26px]" : "size-[22px]"
          )}
          style={toneChip(tone)}
        >
          <Icon className={isLarge ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.25} />
        </span>
      )}
    </span>
  );
}

export interface TemplateStageProps {
  template: TemplateDefinition;
  children: React.ReactNode;
  className?: string;
}

/**
 * La portada degradada sobre la que se apoya una miniatura dentro de una
 * tarjeta. Es el degradado del tono, así que un estante se lee por color antes
 * que por nombre.
 */
export function TemplateStage({ template, children, className }: TemplateStageProps) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl ring-1 ring-inset ring-border/40",
        className
      )}
      style={toneGradient(template.tone, { alpha: 18 })}
    >
      {children}
    </span>
  );
}

export type TemplateTileVariant = "compact" | "card" | "row";

export interface TemplateTileProps {
  template: TemplateDefinition;
  /**
   * `compact`: una fila —miniatura, nombre y medida—, para una estantería de
   * atajos en una página.
   * `card`: más alta —la miniatura sobre su portada degradada, después el
   * nombre, para qué sirve y la medida—, para una galería que se abre.
   * `row`: una fila a todo lo ancho, para recorrer muchas plantillas de un
   * vistazo en vez de barrer una rejilla.
   */
  variant?: TemplateTileVariant;
  onClick: () => void;
  /** Una ficha de «ver más»: contorno punteado, sin degradado ni insignia. */
  dashed?: boolean;
  className?: string;
}

export function TemplateTile({
  template,
  variant = "compact",
  onClick,
  dashed = false,
  className,
}: TemplateTileProps) {
  const isCard = variant === "card";
  const isRow = variant === "row";

  // En `compact` y en `row` el degradado baña la ficha entera; en `card` lo
  // lleva la portada de la miniatura, y la ficha se queda en superficie limpia
  // para que la portada destaque contra ella. La luz del degradado cambia con
  // el ancho: una esquina basta en una ficha pequeña, una fila necesita que
  // siga empujando de izquierda a derecha (ver `toneGradient`).
  const gradient =
    dashed || isCard ? undefined : toneGradient(template.tone, { light: isRow ? "sweep" : "corner" });

  return (
    <button
      type="button"
      title={`${template.name} · ${template.meta}`}
      onClick={onClick}
      style={{ "--tone": toneAccent(template.tone), ...gradient } as React.CSSProperties}
      className={cn(
        "group relative flex w-full overflow-hidden rounded-2xl border text-left",
        // El mismo baño y el mismo milímetro de levantada que el resto de las
        // tarjetas del sistema, en el tono de la plantilla.
        "magic-card-sweep magic-card-lift magic-card-toned",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isCard ? "flex-col gap-stack p-3" : "items-center gap-inline py-2.5 pl-3 pr-3",
        isRow && "sm:gap-stack",
        dashed
          ? "border-dashed border-border bg-surface-muted/50 hover:border-primary/40"
          : "border-border/60 bg-surface",
        className
      )}
    >
      {isCard ? (
        <>
          <TemplateStage template={template} className="h-[92px] w-full">
            <TemplateThumb template={template} size="lg" dashed={dashed} className="mb-0 mr-0" />
          </TemplateStage>
          <span className="relative z-[1] flex min-w-0 flex-col gap-1 px-1">
            <span className="flex items-start gap-inline">
              <span className="line-clamp-2 min-w-0 flex-1 text-[13.5px] font-semibold leading-snug text-text-primary">
                {template.name}
              </span>
              <TileChevron />
            </span>
            <span className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
              {template.description}
            </span>
            <span className="mt-1 text-[11px] font-medium text-text-muted">{template.meta}</span>
          </span>
        </>
      ) : isRow ? (
        <>
          <TemplateThumb template={template} dashed={dashed} />
          {/* Una sola línea recortada: los dos textos tienen que encogerse
              juntos, así que el `truncate` vive en el envoltorio. */}
          <span className="relative z-[1] min-w-0 flex-1 truncate text-[13px] leading-tight">
            <span className="font-semibold text-text-primary">{template.name}</span>
            {template.description && (
              <span className="text-text-secondary"> — {template.description}</span>
            )}
          </span>
          <span className="relative z-[1] hidden shrink-0 text-[11px] font-medium text-text-muted sm:block">
            {template.meta}
          </span>
          <TileChevron />
        </>
      ) : (
        <>
          <TemplateThumb template={template} dashed={dashed} />
          <span className="relative z-[1] flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold leading-tight text-text-primary">
              {template.label}
            </span>
            <span className="truncate text-[11px] font-medium leading-tight text-text-muted">
              {template.meta}
            </span>
          </span>
        </>
      )}
    </button>
  );
}

/** La flecha que entra al pasar el puntero: dice «esto se abre», sin ocupar
 *  sitio mientras nadie la necesita. */
function TileChevron() {
  return (
    <ChevronRight
      aria-hidden
      strokeWidth={2}
      className={cn(
        "relative z-[1] mt-px h-4 w-4 shrink-0 -translate-x-1 text-text-muted opacity-0",
        "transition-all duration-normal group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100",
        "motion-reduce:transition-none motion-reduce:translate-x-0 motion-reduce:opacity-60"
      )}
    />
  );
}
