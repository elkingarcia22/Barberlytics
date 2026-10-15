import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftItem } from "../bookingState";
import { visitPartOf } from "../visit";
import { useBookingFlow } from "./BookingContext";
import { PersonPicker } from "./PersonPicker";

/** El ancho del talón y dónde caen las muescas (el ancho menos la mitad de una muesca). */
const STUB_WIDTH = "w-20";
const NOTCH_AT = "left-[4.5rem]";
/** Sólido aunque vaya sobre la foto de la Agenda: el tinte de la marca encima de la superficie. */
const SOLID_TINT = "bg-surface bg-[linear-gradient(hsl(var(--primary)/0.1),hsl(var(--primary)/0.1))]";

interface VisitPartNoteProps {
  /** El carrito sin la hora que se va a reemplazar (la Agenda). */
  items?: readonly DraftItem[];
  /** Preguntar aquí para quién es esta parte (con cuenta: sin ella no hay a quién más elegir). */
  withPerson?: boolean;
}

/**
 * Al armar una parte de una visita, un talón (la piel «dorada» de las propuestas): qué parte es
 * («2 de 3»), de qué servicio, qué sigue y, en el mismo talón, para quién es: cada parte puede ser
 * de alguien distinto (yo el corte, mi hijo el suyo). «Juntar todo» sale del «por separado» y vuelve
 * a una sola cita. Fuera de una visita no se muestra.
 */
export function VisitPartNote({ items, withPerson = false }: VisitPartNoteProps) {
  const t = useAppT();
  const { state, dispatch, catalog } = useBookingFlow();
  const draft = state.draft;
  const part = visitPartOf(state, items);
  // Cada parte nueva se trae a la vista: el interruptor queda abajo y el cambio pasa arriba (la Agenda).
  const ref = React.useRef<HTMLElement>(null);
  const partKey = part ? draft?.key : undefined;
  React.useEffect(() => {
    if (!partKey) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [partKey]);
  if (!draft || !part) return null;
  const nameOf = (ids: readonly string[]) => ids.map((id) => catalog?.services.find((service) => service.id === id)?.name ?? id).join(" + ");
  const service = nameOf(draft.serviceIds);
  const pending = (state.pendingParts ?? []).map((id) => nameOf([id]));

  return (
    <section
      ref={ref}
      aria-label={t("booking.visit.part", part)}
      className={cn("relative isolate flex scroll-mt-24 overflow-hidden rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300", SOLID_TINT)}
    >
      {/* Un talón, no otra tarjeta como Sede o Barbero: el relleno de la marca dice qué parte es. */}
      <div className={cn("flex shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 border-dashed border-primary-foreground/40 bg-primary py-4", STUB_WIDTH)} aria-hidden>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">{t("booking.visit.stubPart")}</span>
        <span className="text-3xl font-semibold tabular-nums text-primary-foreground">{part.current}</span>
        <span className="text-xs tabular-nums text-primary-foreground/80">{t("booking.visit.stubOf", { total: part.total })}</span>
      </div>
      {/* Las muescas de la perforación, del color del fondo. */}
      <span className={cn("absolute -top-2 size-4 rounded-full bg-background", NOTCH_AT)} aria-hidden />
      <span className={cn("absolute -bottom-2 size-4 rounded-full bg-background", NOTCH_AT)} aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" truncate>
              {service}
            </Text>
            <Text size="xs" tone="muted" truncate>
              {pending.length > 0 ? t("booking.visit.next", { services: pending.join(", ") }) : t("booking.visit.lastPart")}
            </Text>
          </div>
          <Button type="button" variant="ghost" size="sm" className="-mr-2 -mt-1 h-7 shrink-0 text-primary" onClick={() => dispatch({ type: "exitVisit" })} aria-label={t("booking.visit.exitAria")}>
            {t("booking.visit.exit")}
          </Button>
        </div>
        {withPerson && <PersonPicker label={t("booking.visit.forWho")} />}
      </div>
    </section>
  );
}
