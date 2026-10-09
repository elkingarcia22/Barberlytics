import * as React from "react";
import { useAppT } from "@/app/i18n";
import { EmptyState } from "@/components/feedback/EmptyState";
import { DrawerShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../../flow/BookingContext";
import { DRAWER_FIT_STYLE } from "../../flow/drawerFit";
import type { BookingService } from "../../types";
import { fromPrice, itemDuration, itemPrice } from "../../useBookingTotals";

/** Con menos servicios que esto el buscador estorba más de lo que ayuda. */
const SEARCH_FROM = 7;
/** Cuántos nombres caben en el campo antes de resumir con «y N más». */
const NAMES_SHOWN = 2;
const plain = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * «Qué te vas a hacer» en la agenda abierta: un campo que se lee como un
 * select —lo elegido, cuánto dura y desde cuánto— y que al tocarlo abre la
 * lista entera. Así la cabecera del tablero mide lo mismo con 3 servicios que
 * con 30, y las horas libres quedan a la vista.
 *
 * La lista se abre donde se siente nativa en cada pantalla: en celular y en el
 * widget sube desde abajo, al alcance del pulgar; en tablet y monitor es un
 * modal centrado (una hoja a lo ancho de una tablet se ve estirada). Se elige
 * dentro y se aplica con «Ver horas»; cerrar sin aplicar no cambia nada.
 */
export function AgendaServiceField({ disabled = false }: { disabled?: boolean }) {
  const t = useAppT();
  const { state, dispatch, catalog, catalogLoading, fmt, touch } = useBookingFlow();
  const [open, setOpen] = React.useState(false);
  const selected = state.draft?.serviceIds ?? [];
  const services = catalog?.services ?? [];
  const chosen = selected.map((id) => services.find((service) => service.id === id)).filter((service): service is BookingService => Boolean(service));
  const lead = chosen[0];

  const apply = (next: readonly string[]) => {
    setOpen(false);
    const draft = state.draft;
    if (!draft) {
      dispatch({ type: "openDraft", person: { kind: "self" }, serviceIds: next, barberId: null });
      return;
    }
    // De a uno, para no perder la cita que se está cambiando (abrir otro borrador la soltaría).
    const changed = [...draft.serviceIds.filter((id) => !next.includes(id)), ...next.filter((id) => !draft.serviceIds.includes(id))];
    changed.forEach((serviceId) => dispatch({ type: "toggleService", serviceId }));
  };

  if (catalogLoading) return <Skeleton className={cn("w-full rounded-xl", touch === "lg" ? "h-[4.5rem]" : "h-16")} />;

  const names = chosen.length > NAMES_SHOWN ? t("booking.agenda.whatMore", { names: chosen.slice(0, NAMES_SHOWN - 1).map((service) => service.name).join(" + "), count: chosen.length - (NAMES_SHOWN - 1) }) : chosen.map((service) => service.name).join(" + ");

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby="agenda-what agenda-what-value"
        onClick={() => setOpen(true)}
        data-testid="agenda-service-field"
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border border-input bg-background px-3 text-left shadow-xs outline-none transition-[border-color,box-shadow] duration-fast",
          "hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          touch === "lg" ? "min-h-[4.5rem] py-3" : "min-h-16 py-2.5"
        )}
      >
        <IconTile size={touch === "lg" ? "lg" : "md"} src={lead?.imageUrl} icon={<ThemaIcon name="scissors" />} tone={lead ? "primary" : "neutral"} />
        <span id="agenda-what-value" className="flex min-w-0 flex-1 flex-col">
          {chosen.length > 0 ? (
            <>
              <Text as="span" weight="medium" className="truncate">
                {names}
              </Text>
              <Text as="span" size="xs" tone="muted" tabular>
                {t("booking.agenda.whatSummary", { minutes: itemDuration(selected, catalog), price: fmt.money(itemPrice({ serviceIds: selected, barberId: null }, catalog)) })}
              </Text>
            </>
          ) : (
            <Text as="span" tone="muted">
              {t("booking.agenda.whatPlaceholder")}
            </Text>
          )}
        </span>
        <ThemaIcon name="chevronDown" size="sm" tone="muted" className="shrink-0 transition-transform duration-fast group-aria-expanded:rotate-180" />
      </button>
      <ServicePickerOverlay open={open} onOpenChange={setOpen} initial={selected} onApply={apply} />
    </>
  );
}

interface ServicePickerOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: readonly string[];
  onApply: (serviceIds: readonly string[]) => void;
}

function ServicePickerOverlay({ open, onOpenChange, initial, onApply }: ServicePickerOverlayProps) {
  const t = useAppT();
  const { catalog, fmt, layout, touch } = useBookingFlow();
  const [picked, setPicked] = React.useState<readonly string[]>(initial);
  const [query, setQuery] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);

  // Cada vez que se abre arranca de lo que ya está elegido, sin búsqueda vieja.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPicked(initial);
      setQuery("");
    }
  }

  // El foco va a la lista y no al buscador: en un celular o una tablet el teclado taparía los servicios.
  const focusList = (event: Event) => {
    event.preventDefault();
    const target = listRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ?? listRef.current?.querySelector<HTMLElement>("[role=checkbox]");
    target?.focus({ preventScroll: false });
  };

  const toggle = (id: string) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const minutes = itemDuration(picked, catalog);
  const title = t("booking.agenda.whatTitle");
  const description = t("booking.agenda.whatLead");

  const body = <ServicePickerList ref={listRef} picked={picked} onToggle={toggle} query={query} onQueryChange={setQuery} />;
  const footer = (
    <div className="flex w-full items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
        {picked.length > 0 ? (
          <>
            <Text size="xs" tone="muted">
              {t("booking.services.selected", { count: picked.length, minutes })}
            </Text>
            <Text weight="semibold" tabular>
              {t("booking.services.from", { price: fmt.money(itemPrice({ serviceIds: [...picked], barberId: null }, catalog)) })}
            </Text>
          </>
        ) : (
          <Text size="sm" tone="muted">
            {t("booking.services.pick")}
          </Text>
        )}
      </div>
      <Button type="button" size="lg" disabled={picked.length === 0} onClick={() => onApply(picked)} data-testid="agenda-service-apply">
        {t("booking.agenda.whatApply")}
      </Button>
    </div>
  );

  // Celular y widget: hoja desde abajo. Tablet (táctil grande) y monitor: modal centrado.
  if (layout === "compact" && touch === "default") {
    return (
      <DrawerShell open={open} onOpenChange={onOpenChange} side="bottom" contentStyle={DRAWER_FIT_STYLE} title={title} description={description} actions={footer} onOpenAutoFocus={focusList} disablePadding>
        {body}
      </DrawerShell>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={focusList}
        aria-describedby={undefined}
        // Medido contra la reserva (el marco de la tablet o la pantalla), no contra la ventana.
        className={cn("flex max-h-[calc(100%-3rem)] flex-col gap-0 overflow-hidden p-0", touch === "lg" ? "sm:max-w-xl" : "sm:max-w-lg")}
      >
        <DialogHeader className="border-b bg-muted/30 p-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">{body}</div>
        <DialogFooter className="m-0 rounded-b-xl bg-muted/30 p-4">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ServicePickerListProps {
  picked: readonly string[];
  onToggle: (serviceId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

/** La lista de la carta: buscador si hay muchos, agrupada por categoría y con casilla por fila (se pueden varios). */
const ServicePickerList = React.forwardRef<HTMLDivElement, ServicePickerListProps>(function ServicePickerList({ picked, onToggle, query, onQueryChange }, ref) {
  const t = useAppT();
  const { catalog, fmt, touch } = useBookingFlow();
  const services = catalog?.services ?? [];
  const needle = plain(query.trim());
  const visible = needle === "" ? services : services.filter((service) => plain(`${service.name} ${service.description} ${service.category}`).includes(needle));
  // Por categoría mientras no se busca; buscando, una sola lista con lo que coincide.
  const groups = needle === "" ? [...new Set(visible.map((service) => service.category))].map((category) => ({ category, items: visible.filter((service) => service.category === category) })) : [{ category: "", items: visible }];
  const showHeadings = groups.length > 1;

  return (
    <div ref={ref} className="flex flex-col">
      {services.length >= SEARCH_FROM && (
        <div className="sticky top-0 z-10 bg-popover px-4 pb-2 pt-3">
          <div className="relative">
            <ThemaIcon name="search" size="sm" tone="muted" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
            <Input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("booking.services.search")} aria-label={t("booking.services.search")} className="pl-9" />
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState icon="scissors" title={t("booking.services.emptyBranch")} />
      ) : visible.length === 0 ? (
        <EmptyState icon="search" title={t("booking.services.empty")} />
      ) : (
        <div className="flex flex-col gap-4 px-2 pb-3 pt-1">
          {groups.map((group) => (
            <section key={group.category || "all"} aria-label={group.category || undefined} className="flex flex-col gap-0.5">
              {showHeadings && group.category && (
                <Text as="h3" size="xs" weight="medium" tone="muted" className="px-2 pb-1 pt-2 uppercase tracking-wide">
                  {group.category}
                </Text>
              )}
              {group.items.map((service) => {
                const isPicked = picked.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isPicked}
                    aria-label={`${service.name} · ${t("booking.services.minutes", { count: service.durationMin })} · ${t("booking.services.from", { price: fmt.money(fromPrice(service, catalog)) })}`}
                    onClick={() => onToggle(service.id)}
                    className={cn(
                      "group/row flex w-full items-center gap-3 rounded-xl px-2 text-left outline-none transition-colors duration-fast",
                      "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-muted/80",
                      isPicked && "bg-primary/5 hover:bg-primary/10",
                      touch === "lg" ? "min-h-16 py-2.5" : "min-h-14 py-2"
                    )}
                  >
                    <IconTile size={touch === "lg" ? "lg" : "md"} src={service.imageUrl} icon={<ThemaIcon name="scissors" />} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Text as="span" weight="medium" className="truncate">
                          {service.name}
                        </Text>
                        {service.popular && <Badge variant="secondary">{t("booking.services.popular")}</Badge>}
                        {service.isCombo && <Badge variant="outline">{t("booking.services.combo")}</Badge>}
                      </span>
                      <Text as="span" size="xs" tone="muted" tabular>
                        {t("booking.services.minutes", { count: service.durationMin })} · <span className="font-medium text-text-primary">{t("booking.services.from", { price: fmt.money(fromPrice(service, catalog)) })}</span>
                      </Text>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors duration-fast",
                        isPicked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background group-hover/row:border-primary/50"
                      )}
                    >
                      {isPicked && <ThemaIcon name="check" size="xs" tone="inverse" />}
                    </span>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
});
