import * as React from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, HandCoins } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { PanelFooter, SidePanelShell } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { QueryBoundary } from "@/lib/query";
import { AppointmentStatusBadge, ClientAvatar } from "./calendarShared";
import { useOpenKey } from "./calendarFormat";
import { appointmentRange, findBarber, findClient, isUnpaid, servicesOf, servicesPrice, type ModelContext } from "./calendarModel";
import { useDayQuery } from "./queries";
import { FULL_CALENDAR_ACCESS, scopeDay } from "./calendarAccess";
import { PanelQuestion } from "./appointmentPanel/bookingStyle";
import { SaleCard, SaleCardHead } from "./saleParts";
import type { Appointment } from "./types";

/**
 * La lista de cobros, con la cara de «Crear cita»: la tarjeta teñida con lo que falta por cobrar del
 * día (y lo ya cobrado), el día que se cambia con flechas, las citas por cobrar o cobradas en
 * pestañas —cada una abre su cita— y un solo botón abajo: cobrar la primera que espera.
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

type Tab = "toCollect" | "paid";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function CollectionsDrawer(props: CollectionsDrawerProps) {
  return <CollectionsPanel key={useOpenKey(props.open)} {...props} />;
}

function CollectionsPanel({ open, onOpenChange, branchId, ctx, initialDate, onOpenAppointment, onPay }: CollectionsDrawerProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const [date, setDate] = React.useState(initialDate);
  const [tab, setTab] = React.useState<Tab>("toCollect");
  const query = useDayQuery(branchId, format(date, "yyyy-MM-dd"));
  const access = ctx.access ?? FULL_CALENDAR_ACCESS;
  // Quien vino sin ficha sale como «Cliente de paso», no con el nombre de relleno del catálogo.
  const nameOf = (item: Appointment) => {
    const client = findClient(ctx.catalog, item.clientId);
    return client && client.type !== "walkin" ? client.name : t("calendar.walkInSale.walkInClient");
  };
  const amountOf = (item: Appointment) => item.payment?.total ?? servicesPrice(servicesOf(ctx.catalog, item));
  const dayLabel = isSameDay(date, ctx.now ?? new Date()) ? t("schedule.today") : capitalize(format(date, "EEEE d 'de' MMMM", { locale: calendarLocale(locale) }));

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.action.collections")}>
      <div data-testid="collections-drawer">
        <QueryBoundary query={query}>
          {(fetched) => {
            // Un barbero cobra y repasa lo suyo; la lista de la sucursal es de quien opera el día.
            const day = scopeDay(fetched, access.ownBarberId);
            const unpaid = day.appointments.filter(isUnpaid);
            const paid = day.appointments.filter((item) => item.status === "paid");
            const items = tab === "toCollect" ? unpaid : paid;
            const toCollect = unpaid.reduce((sum, item) => sum + amountOf(item), 0);
            const collected = paid.reduce((sum, item) => sum + amountOf(item), 0);
            const total = tab === "toCollect" ? toCollect : collected;
            const [first] = unpaid;
            const firstName = first ? (findClient(ctx.catalog, first.clientId)?.type === "walkin" ? nameOf(first) : nameOf(first).split(" ")[0]) : "";
            return (
              <SaleCard testId="collections-cards">
                <SaleCardHead
                  eyebrow={t("calendar.action.collections")}
                  title={unpaid.length === 0 ? t("calendar.collections.allPaid") : access.showTotals ? t("calendar.collections.headAmount", { amount: ctx.formatMoney(toCollect) }) : t("calendar.collections.headCount", { count: unpaid.length })}
                  lead={access.showTotals ? t("calendar.collections.leadTotals", { count: unpaid.length, paid: paid.length, amount: ctx.formatMoney(collected) }) : t("calendar.collections.leadCount", { count: unpaid.length, paid: paid.length })}
                />

                <PanelQuestion title={t("calendar.collections.which")}>
                  <div className="flex min-h-16 items-center gap-3 rounded-xl border border-input bg-surface px-3 py-2.5">
                    <Button variant="ghost" size="icon-sm" aria-label={t("calendar.prevDay")} onClick={() => setDate((current) => addDays(current, -1))}>
                      <ChevronLeft />
                    </Button>
                    <span className="flex min-w-0 flex-1 flex-col items-center">
                      <Text as="span" size="xs" tone="muted">
                        {t("calendar.walkInSale.date")}
                      </Text>
                      <Text as="span" weight="semibold" truncate>
                        {dayLabel}
                      </Text>
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label={t("calendar.nextDay")} onClick={() => setDate((current) => addDays(current, 1))}>
                      <ChevronRight />
                    </Button>
                  </div>
                </PanelQuestion>

                <div className="flex flex-col gap-3">
                  <ThemaTabs
                    className="mb-0"
                    tabs={[
                      { id: "toCollect", label: t("calendar.collections.toCollect"), badge: unpaid.length, badgeTone: "warning" },
                      { id: "paid", label: t("calendar.collections.paid"), badge: paid.length, badgeTone: "positive" },
                    ]}
                    activeTabId={tab}
                    onTabChange={(id) => setTab(id as Tab)}
                  />
                  {items.length === 0 ? (
                    <EmptyState icon="task" title={t(tab === "toCollect" ? "calendar.collections.emptyToCollect" : "calendar.collections.emptyPaid")} />
                  ) : (
                    <ListItemGroup>
                      {items.map((appointment) => {
                        const client = findClient(ctx.catalog, appointment.clientId);
                        const barber = findBarber(ctx.catalog, appointment.barberId);
                        const services = servicesOf(ctx.catalog, appointment);
                        const name = nameOf(appointment);
                        return (
                          <ListItem
                            key={appointment.id}
                            leading={<ClientAvatar client={client?.type === "walkin" ? undefined : client} name={name} />}
                            title={name}
                            description={`${appointmentRange(appointment, ctx.intl)} · ${services.map((service) => service.name).join(" + ")}${barber ? ` · ${barber.name}` : ""}`}
                            meta={
                              <span className="flex items-center gap-2">
                                <AppointmentStatusBadge status={appointment.status} />
                                <span className="font-semibold">{ctx.formatMoney(amountOf(appointment))}</span>
                              </span>
                            }
                            actions={
                              onPay && isUnpaid(appointment) ? (
                                <Button size="xs" variant="outline" onClick={() => onPay(appointment)} aria-label={`${t("calendar.step.pay")}: ${name}`} data-testid={`collections-pay-${appointment.id}`}>
                                  {t("calendar.step.pay")}
                                </Button>
                              ) : undefined
                            }
                            onClick={() => onOpenAppointment(appointment, date)}
                          />
                        );
                      })}
                    </ListItemGroup>
                  )}
                </div>

                {(access.showTotals && items.length > 0) || (onPay && first) ? (
                  <PanelFooter>
                    {access.showTotals && items.length > 0 && (
                      <div className="flex items-baseline justify-between gap-3" data-testid="collections-total">
                        <Text size="sm" tone="muted">
                          {t(tab === "toCollect" ? "calendar.collections.totalToCollect" : "calendar.collections.totalPaid")}
                        </Text>
                        <Text size="lg" weight="semibold" tabular>
                          {ctx.formatMoney(total)}
                        </Text>
                      </div>
                    )}
                    {onPay && first && (
                      <Button size="lg" className="w-full" onClick={() => onPay(first)} data-testid="collections-pay-next">
                        <HandCoins aria-hidden />
                        {t("calendar.collections.payNext", { name: firstName, amount: ctx.formatMoney(amountOf(first)) })}
                      </Button>
                    )}
                  </PanelFooter>
                ) : null}
              </SaleCard>
            );
          }}
        </QueryBoundary>
      </div>
    </SidePanelShell>
  );
}
