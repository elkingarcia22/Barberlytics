import * as React from "react";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { SidePanelShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { QueryBoundary } from "@/lib/query";
import { AppointmentStatusBadge, PersonAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentRange, findBarber, findClient, isUnpaid, servicesOf, servicesPrice, type ModelContext } from "./calendarModel";
import { useDayQuery } from "./queries";
import type { Appointment } from "./types";

/**
 * La lista de cobros: las citas del día que faltan por pagar y las que ya
 * se cobraron, con el total de cada pestaña y el día que se puede cambiar.
 */

export interface CollectionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  ctx: ModelContext;
  initialDate: Date;
  onOpenAppointment: (appointment: Appointment, date: Date) => void;
  /** Cobrar sin pasar por el detalle. */
  onPay?: (appointment: Appointment) => void;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CollectionsDrawer(props: CollectionsDrawerProps) {
  return <CollectionsPanel key={useOpenKey(props.open)} {...props} />;
}

function CollectionsPanel({ open, onOpenChange, branchId, ctx, initialDate, onOpenAppointment, onPay }: CollectionsDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const [date, setDate] = React.useState(initialDate);
  const [tab, setTab] = React.useState<"toCollect" | "paid">("toCollect");
  const query = useDayQuery(branchId, format(date, "yyyy-MM-dd"));

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.collections.title")}>
      <div className="space-y-4" data-testid="collections-drawer">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon-sm" aria-label={t("calendar.prevDay")} onClick={() => setDate((current) => addDays(current, -1))}>
            <ChevronLeft />
          </Button>
          <Text weight="semibold">{capitalize(format(date, "d 'de' MMMM", { locale: calendarLocale(locale) }))}</Text>
          <Button variant="outline" size="icon-sm" aria-label={t("calendar.nextDay")} onClick={() => setDate((current) => addDays(current, 1))}>
            <ChevronRight />
          </Button>
        </div>

        <QueryBoundary query={query}>
          {(day) => {
            const unpaid = day.appointments.filter(isUnpaid);
            const paid = day.appointments.filter((item) => item.status === "paid");
            const items = tab === "toCollect" ? unpaid : paid;
            const total = items.reduce((sum, item) => sum + (item.payment?.total ?? servicesPrice(servicesOf(ctx.catalog, item))), 0);
            return (
              <div className="space-y-3">
                <ThemaTabs
                  className="mb-0"
                  variant="page"
                  tabs={[
                    { id: "toCollect", label: t("calendar.collections.toCollect"), badge: unpaid.length, badgeTone: "warning" },
                    { id: "paid", label: t("calendar.collections.paid"), badge: paid.length, badgeTone: "positive" },
                  ]}
                  activeTabId={tab}
                  onTabChange={(id) => setTab(id as "toCollect" | "paid")}
                />
                {items.length === 0 ? (
                  <EmptyState icon="task" title={t("calendar.collections.empty")} />
                ) : (
                  <>
                    <ListItemGroup>
                      {items.map((appointment) => {
                        const client = findClient(ctx.catalog, appointment.clientId);
                        const barber = findBarber(ctx.catalog, appointment.barberId);
                        const services = servicesOf(ctx.catalog, appointment);
                        const name = client?.name ?? t("calendar.clientType.walkin");
                        return (
                          <ListItem
                            key={appointment.id}
                            leading={<PersonAvatar name={name} />}
                            title={name}
                            description={`${appointmentRange(appointment, ctx.intl)} · ${services.map((service) => service.name).join(" + ")} · ${barber?.name ?? ""}`}
                            meta={
                              <span className="flex items-center gap-2">
                                <AppointmentStatusBadge status={appointment.status} />
                                <span className="font-semibold">{ctx.formatMoney(appointment.payment?.total ?? servicesPrice(services))}</span>
                              </span>
                            }
                            actions={
                              onPay && isUnpaid(appointment) ? (
                                <Button size="xs" onClick={() => onPay(appointment)} aria-label={`${t("calendar.step.pay")}: ${name}`} data-testid={`collections-pay-${appointment.id}`}>
                                  {t("calendar.step.pay")}
                                </Button>
                              ) : undefined
                            }
                            onClick={() => onOpenAppointment(appointment, date)}
                          />
                        );
                      })}
                    </ListItemGroup>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <Text variant="muted">{t("calendar.collections.total")}</Text>
                      <Text weight="semibold" size="lg" tabular>
                        {ctx.formatMoney(total)}
                      </Text>
                    </div>
                  </>
                )}
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </SidePanelShell>
  );
}
