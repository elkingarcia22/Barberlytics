import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagicCard } from "@/components/ui/magic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../flow/BookingContext";
import { PersonPicker } from "../flow/PersonPicker";
import { StepLayout } from "../flow/StepLayout";
import type { BookingService } from "../types";
import { itemDuration, itemPrice } from "../useBookingTotals";

const ALL = "__all__";
const SKELETON_ROWS = 5;
const plain = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Lo más barato que cobra alguien de la sede por ese servicio: el «desde». */
function fromPrice(service: BookingService, prices: readonly Record<string, number>[]): number {
  const values = prices.map((entry) => entry[service.id]).filter((value): value is number => value !== undefined);
  return values.length > 0 ? Math.min(...values) : service.price;
}

/**
 * Los servicios: varios en la misma cita (corte + barba), con foto, cuánto
 * duran y desde cuánto. Las categorías filtran sin esconder lo elegido.
 */
export function ServicesStep() {
  const t = useAppT();
  const { state, dispatch, catalog, catalogLoading, fmt, layout } = useBookingFlow();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(ALL);
  const selected = state.draft?.serviceIds ?? [];
  const services = catalog?.services ?? [];
  const categories = [...new Set(services.map((service) => service.category).filter(Boolean))];
  const prices = (catalog?.barbers ?? []).map((barber) => barber.prices);
  const visible = services.filter((service) => (category === ALL || service.category === category) && (query.trim() === "" || plain(`${service.name} ${service.description}`).includes(plain(query.trim()))));
  const minutes = itemDuration(selected, catalog);

  return (
    <StepLayout
      title={t("booking.services.title")}
      lead={t("booking.services.lead")}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            {selected.length > 0 ? (
              <>
                <Text size="xs" tone="muted">
                  {t("booking.services.selected", { count: selected.length, minutes })}
                </Text>
                <Text size="lg" weight="semibold" tabular>
                  {fmt.money(itemPrice({ serviceIds: selected, barberId: state.draft?.barberId ?? null }, catalog))}
                </Text>
              </>
            ) : (
              <Text size="sm" tone="muted">
                {t("booking.services.pick")}
              </Text>
            )}
          </div>
          <Button type="button" size="lg" disabled={selected.length === 0} onClick={() => dispatch({ type: "goTo", step: "barber" })}>
            {t("booking.services.next")}
            <ThemaIcon name="arrowRight" />
          </Button>
        </div>
      }
    >
      <PersonPicker />

      <div className="flex flex-col gap-3">
        <div className="relative">
          <ThemaIcon name="search" size="sm" tone="muted" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("booking.services.search")} aria-label={t("booking.services.search")} className="pl-9" />
        </div>
        {categories.length > 1 && (
          // En varias líneas y no en una tira que se desliza: con ratón no hay cómo moverla de lado.
          <div className="flex flex-wrap gap-2">
            <Chip label={t("booking.services.all")} selected={category === ALL} onClick={() => setCategory(ALL)} />
            {categories.map((item) => (
              <Chip key={item} label={item} selected={category === item} onClick={() => setCategory(item)} />
            ))}
          </div>
        )}
      </div>

      {catalogLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState icon="scissors" title={t("booking.services.emptyBranch")} />
      ) : visible.length === 0 ? (
        <EmptyState icon="search" title={t("booking.services.empty")} />
      ) : (
        <div className={cn("grid grid-cols-1 gap-3", layout === "wide" && "lg:grid-cols-2")}>
          {visible.map((service) => {
            const isSelected = selected.includes(service.id);
            return (
              <MagicCard
                key={service.id}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${service.name} · ${t("booking.services.minutes", { count: service.durationMin })}`}
                isSelected={isSelected}
                onClick={() => dispatch({ type: "toggleService", serviceId: service.id })}
                contentClassName="items-start gap-3 text-left"
              >
                <IconTile size="xl" src={service.imageUrl} icon={<ThemaIcon name="scissors" />} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Text weight="semibold" as="span">
                      {service.name}
                    </Text>
                    {service.popular && <Badge variant="secondary">{t("booking.services.popular")}</Badge>}
                    {service.isCombo && <Badge variant="outline">{t("booking.services.combo")}</Badge>}
                  </span>
                  {service.description && (
                    <Text size="xs" tone="secondary" className="line-clamp-2">
                      {service.description}
                    </Text>
                  )}
                  <Text size="sm" tone="muted" tabular as="span" className="mt-0.5">
                    {t("booking.services.minutes", { count: service.durationMin })} · <span className="font-medium text-text-primary">{t("booking.services.from", { price: fmt.money(fromPrice(service, prices)) })}</span>
                  </Text>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-text-muted"
                  )}
                >
                  <ThemaIcon name={isSelected ? "check" : "plus"} size="xs" tone={isSelected ? "inverse" : "muted"} />
                </span>
              </MagicCard>
            );
          })}
        </div>
      )}
    </StepLayout>
  );
}
