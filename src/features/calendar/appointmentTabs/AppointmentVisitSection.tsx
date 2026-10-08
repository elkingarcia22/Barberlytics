import { Unlink } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { DetailRow, ServiceThumb } from "../calendarShared";
import { appointmentRange, findBarber, servicesOf, servicesPrice, type ModelContext } from "../calendarModel";
import type { Appointment } from "../types";

/**
 * Una visita con servicios añadidos son varias citas pegadas del mismo
 * cliente y barbero. El panel las enseña todas: se elige cuál se mira (su
 * detalle y sus acciones van debajo), se ve el total de la visita y, si se
 * agruparon por error, se separan en citas independientes.
 */

export interface AppointmentVisitSectionProps {
  visit: readonly Appointment[];
  current: Appointment;
  ctx: ModelContext;
  onSelect: (appointment: Appointment) => void;
  onSeparate?: (visit: readonly Appointment[]) => void;
}

const priceOf = (appointment: Appointment, ctx: ModelContext) => appointment.payment?.total ?? servicesPrice(servicesOf(ctx.catalog, appointment));

export function AppointmentVisitSection({ visit, current, ctx, onSelect, onSeparate }: AppointmentVisitSectionProps) {
  const t = useAppT();
  const total = visit.reduce((sum, item) => sum + priceOf(item, ctx), 0);

  return (
    <section aria-label={t("calendar.visit.title", { count: visit.length })} className="space-y-2" data-testid="appointment-visit">
      <div className="flex items-center justify-between gap-2">
        <Text variant="label" weight="semibold">
          {t("calendar.visit.title", { count: visit.length })}
        </Text>
        {onSeparate && (
          <Button variant="ghost" size="xs" onClick={() => onSeparate(visit)} data-testid="appointment-visit-separate">
            <Unlink /> {t("calendar.visit.separate")}
          </Button>
        )}
      </div>
      <ListItemGroup>
        {visit.map((item) => {
          const services = servicesOf(ctx.catalog, item);
          return (
            <ListItem
              key={item.id}
              size="sm"
              selected={item.id === current.id}
              onClick={() => onSelect(item)}
              leading={<ServiceThumb service={services[0]} />}
              title={services.map((service) => service.name).join(" + ") || "—"}
              description={[appointmentRange(item, ctx.intl), findBarber(ctx.catalog, item.barberId)?.name].filter(Boolean).join(" · ")}
              meta={ctx.formatMoney(priceOf(item, ctx))}
              data-testid="appointment-visit-item"
            />
          );
        })}
      </ListItemGroup>
      <DetailRow plain strong label={t("calendar.visit.total")}>
        <span data-testid="appointment-visit-total">{ctx.formatMoney(total)}</span>
      </DetailRow>
    </section>
  );
}
