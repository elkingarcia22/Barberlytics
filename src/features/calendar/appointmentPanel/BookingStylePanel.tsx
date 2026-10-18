import * as React from "react";
import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { AppointmentCard } from "@/features/booking/flow/AppointmentCard";
import { OrderSummary, type OrderLine } from "@/features/booking/flow/OrderSummary";
import { QuickActions, type QuickAction } from "@/features/booking/flow/QuickActions";
import type { Totals } from "@/features/booking/pricing";
import { appointmentStart, durationLabel, type ModelContext } from "../calendarModel";
import { AppointmentStatusBadge, ClientTypeBadge } from "../calendarShared";
import { StageHeadline } from "../appointmentTabs/AppointmentPanelParts";
import { AppointmentLinkSection, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { AppointmentEditForm } from "../appointmentTabs/AppointmentEditForm";
import type { Appointment, AppointmentPatch } from "../types";
import { ActionButton, CriticalAlerts, LoyaltyStrip, MoreActionsMenu, ReferencePhotos } from "./PanelParts";
import { mainAction, restActions } from "./panelLogic";
import { SourceLine } from "./SourceLine";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Versión «Como la reserva en línea». Quien atiende ve la cita con la misma
 * cara con la que el cliente la reservó: la tarjeta de la reserva (cuándo
 * grande, luego qué, para quién y con quién), su membresía con el anillo, los
 * atajos como tarjetas, «La cuenta» como el ticket del pago y, abajo, un solo
 * botón ancho. Si el cliente llama y dice «la de las 7», los dos miran lo mismo.
 */

export interface BookingStylePanelProps extends Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> {
  model: AppointmentModel;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onOpenClient: (clientId: string) => void;
}

export function BookingStylePanel({ model, ctx, onPatch, onOpenClient, linked = [], onSelectAppointment, onUnlink, onShowLinked }: BookingStylePanelProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const [editing, setEditing] = React.useState(false);
  const { appointment, known, barber, services } = model;
  const start = appointmentStart(appointment);
  const productLines: OrderLine[] = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
    return product ? [{ id: `p-${product.id}`, label: product.name, detail: `× ${line.qty}`, amount: product.price * line.qty }] : [];
  });
  const lines: OrderLine[] = [...services.map((service) => ({ id: `s-${service.id}`, label: service.name, detail: durationLabel(service.durationMin), amount: service.price })), ...productLines];
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const payment = appointment.payment;
  const totals: Totals = {
    services: services.reduce((sum, service) => sum + service.price, 0),
    products: productLines.reduce((sum, line) => sum + line.amount, 0),
    discount: 0,
    subtotal,
    tax: payment?.tax ?? 0,
    tip: payment?.tip ?? 0,
    fee: 0,
    feeName: null,
    gift: 0,
    reward: 0,
    prepaid: 0,
    total: payment?.total ?? subtotal,
  };

  const quick: QuickAction[] = [
    ...(model.phone ? [{ id: "call", icon: "phone" as const, label: t("calendar.detail.call"), href: model.href("call") ?? undefined }] : []),
    ...(model.phone ? [{ id: "whatsapp", icon: "chat" as const, label: t("calendar.detail.whatsapp"), href: model.href("whatsapp") ?? undefined }] : []),
    ...(model.unpaid ? [{ id: "edit", icon: "edit" as const, label: t("calendar.panel.change"), onClick: () => setEditing((value) => !value) }] : []),
    ...(known ? [{ id: "profile", icon: "users" as const, label: t("calendar.panel.profile"), onClick: () => onOpenClient(known.id) }] : []),
  ];

  return (
    <div className="flex flex-col gap-5" data-testid="panel-booking">
      <div className="flex items-center gap-3">
        <IconTile size="lg" shape="circle" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
        <div className="flex min-w-0 flex-col">
          <Text weight="semibold" truncate>
            {t("calendar.panel.booking.number", { number: appointment.id.replace(/\D/g, "").slice(-4) })}
          </Text>
          <SourceLine appointment={appointment} />
        </div>
      </div>

      <CriticalAlerts model={model} compact />
      <StageHeadline stage={model.playbook.stage}>{model.headline}</StageHeadline>

      {editing && model.unpaid ? (
        <AppointmentEditForm appointment={appointment} ctx={ctx} onPatch={onPatch} />
      ) : (
        <AppointmentCard
          data={{
            personName: model.clientName,
            services: services.map((service) => service.name),
            barberName: barber?.name ?? null,
            barberAvatarUrl: barber?.avatarUrl,
            day: format(start, "EEE, d 'de' MMM", { locale: calendarLocale(locale) }),
            time: formatClock(start, ctx.intl),
            duration: durationLabel(appointment.durationMin),
            price: ctx.formatMoney(model.price),
          }}
          status={<AppointmentStatusBadge status={appointment.status} />}
          personAction={known ? <ClientTypeBadge type={known.type} /> : undefined}
          muted={!model.unpaid && model.playbook.stage !== "paid"}
        />
      )}

      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}

      {quick.length > 0 && <QuickActions actions={quick} label={t("calendar.panel.booking.quick")} layout="tiles" />}

      <ReferencePhotos model={model} />
      {appointment.notes && (
        <div className="space-y-1 rounded-xl bg-surface-subtle px-3 py-2">
          <Text variant="caption">{t("calendar.create.notes")}</Text>
          <Text size="sm">{appointment.notes}</Text>
        </div>
      )}

      <LoyaltyStrip model={model} />

      <section aria-label={t("calendar.panel.booking.order")} className="space-y-2">
        <Text variant="label" weight="semibold">
          {t("calendar.panel.booking.order")}
        </Text>
        <OrderSummary totals={totals} money={ctx.formatMoney} lines={lines} />
      </section>
    </div>
  );
}

/** El pie de esta versión: un botón ancho, como «Continuar» en la reserva, y el resto al menú. */
export function BookingStyleFooter({ model }: { model: AppointmentModel }) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-5 py-4">
      <ActionButton model={model} action={mainAction(model)} variant="default" size="lg" className="flex-1" />
      <MoreActionsMenu model={model} actions={restActions(model)} />
    </footer>
  );
}
