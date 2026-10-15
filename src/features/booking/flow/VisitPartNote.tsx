import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { previousPartIndex, type DraftItem } from "../bookingState";
import { parseStart } from "../bookingFormat";
import { visitPartOf } from "../visit";
import { useBookingFlow } from "./BookingContext";
import { BookingOverlay } from "./BookingOverlay";
import { HeldCards } from "./HeldCards";
import { PersonPicker } from "./PersonPicker";

/** El ancho del talón y dónde caen las muescas (el ancho menos la mitad de una muesca). */
const STUB_WIDTH = "w-20";
const NOTCH_AT = "left-[4.5rem]";
/** El cuerpo en grafito (sólido: se lee aunque vaya sobre la foto de la Agenda); el talón, dorado. */
const BODY = "bg-surface-muted shadow-sm";

interface VisitPartNoteProps {
  /** El carrito sin la hora que se va a reemplazar (la Agenda). */
  items?: readonly DraftItem[];
  /** Preguntar aquí para quién es esta parte (con cuenta: sin ella no hay a quién más elegir). */
  withPerson?: boolean;
  /** Las ya apartadas de la visita, en una línea que abre su hoja (Paso a paso; la Agenda ya las enseña arriba). */
  showDone?: boolean;
}

/**
 * Al armar una parte de una visita, un talón (la piel «dorada» de las propuestas): qué parte es
 * («2 de 3»), de qué servicio, qué sigue y, en el mismo talón, para quién es: cada parte puede ser
 * de alguien distinto (yo el corte, mi hijo el suyo). «Juntar todo» sale del «por separado» y vuelve
 * a una sola cita. Fuera de una visita no se muestra.
 */
export function VisitPartNote({ items, withPerson = false, showDone = false }: VisitPartNoteProps) {
  const t = useAppT();
  const { state, dispatch, catalog, fmt } = useBookingFlow();
  const [isDoneOpen, setIsDoneOpen] = React.useState(false);
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
  const done = (items ?? state.items).filter((item, index) => item.visitId === draft.visitId && index !== state.editingIndex && item.start);
  const lastDone = done.at(-1);
  const canGoBack = previousPartIndex(state) >= 0;

  return (
    <section
      ref={ref}
      aria-label={t("booking.visit.part", part)}
      className={cn("relative isolate flex scroll-mt-24 overflow-hidden rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300", BODY)}
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
            {/* Hasta dos líneas: con «Juntar todo» al lado, «Arreglo de barba» no cabía en una. */}
            <Text size="lg" weight="semibold" className="line-clamp-2">
              {service}
            </Text>
            <Text size="xs" tone="muted" truncate>
              {pending.length > 0 ? t("booking.visit.next", { services: pending.join(", ") }) : t("booking.visit.lastPart")}
            </Text>
          </div>
          <Button type="button" variant="ghost" size="sm" className="-mr-2 -mt-1 h-7 shrink-0 text-text-secondary hover:text-text-primary" onClick={() => dispatch({ type: "exitVisit" })} aria-label={t("booking.visit.exitAria")}>
            {t("booking.visit.exit")}
          </Button>
        </div>
        {withPerson && <PersonPicker label={t("booking.visit.forWho")} />}

        {(showDone && lastDone) || canGoBack ? (
          <div className="-mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5">
            {/* Lo ya apartado, discreto: una línea que abre la hoja con esas citas. */}
            {showDone && lastDone?.start && (
              <button type="button" onClick={() => setIsDoneOpen(true)} aria-haspopup="dialog" className="flex min-w-0 items-center gap-1.5 rounded-md text-left text-xs text-text-secondary outline-none transition-colors duration-fast hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none">
                <ThemaIcon name="check" size="xs" tone="positive" />
                <span className="truncate">
                  {t("booking.visit.doneLine", { count: done.length, service: nameOf(lastDone.serviceIds), time: fmt.time(parseStart(lastDone.start)) })}
                </span>
                <span className="shrink-0 font-medium text-primary">{t("booking.agenda.heldSee")}</span>
              </button>
            )}
            {canGoBack && (
              <Button type="button" variant="link" size="sm" className="ml-auto h-auto px-0 text-xs" onClick={() => dispatch({ type: "previousPart" })}>
                <ThemaIcon name="arrowLeft" size="xs" />
                {t("booking.visit.previous")}
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {showDone && (
        <BookingOverlay open={isDoneOpen} onOpenChange={setIsDoneOpen} title={t("booking.agenda.heldTitle", { count: done.length })} description={t("booking.agenda.heldLead")}>
          <HeldCards items={done} />
        </BookingOverlay>
      )}
    </section>
  );
}
