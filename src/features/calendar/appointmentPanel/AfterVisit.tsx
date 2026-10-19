import { format } from "date-fns";
import * as React from "react";
import { ReceiptText, Repeat, Send, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useAccess } from "@/features/access";
import { appointmentEnd, appointmentStart, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { ACTION_ICON } from "../appointmentActions";
import { PAYMENT_METHOD_KEYS } from "../types";
import { ClientField } from "./ClientPage";
import { NextVisitBooker } from "./NextVisitBooker";
import { PinSeries } from "./PinSeries";
import { ClientTags } from "./PanelParts";
import { PanelStepper } from "./PanelShared";
import { NavRowLink } from "./bookingStyle";
import { writeMenu } from "./writeChannels";
import { SourceLine } from "./SourceLine";
import { ClipperButton, StageHeading, TicketSummary, TileRow, type Tile } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * La cita ya cerrada —cobrada, o que no se atendió—. Lo que importa ya no es
 * la cita sino lo que sigue con el cliente: agendarle la próxima antes de que
 * se vaya, mandarle el recibo, verlo o devolver dinero si hace falta; lo que
 * se cobró y con qué citas iba enlazada. Lo demás (cambiar servicio o
 * barbero, la nota para el barbero, las alertas) ya no tiene uso y se queda
 * fuera; sigue en la ficha del cliente y en el historial.
 *
 * Se cuenta con la tarjeta grande teñida del estado (verde cobrada, gris si
 * no se atendió), con el cliente, lo que se hizo y sus atajos dentro.
 */

export interface AfterVisitProps extends Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> {
  model: AppointmentModel;
  ctx: ModelContext;
  onOpenClient: () => void;
  onOpenHistory: () => void;
}

/** El tinte de la tarjeta del momento: verde cobrada, gris si se cerró sin atender. */
const MOMENT_TINT = { paid: "from-success/15 via-success/5", closed: "from-muted via-muted/40" } as const;

/** Los atajos de después: recibo y devolución si se cobró; llamar y escribir si no vino. */
function useAfterTiles(model: AppointmentModel, ctx: ModelContext, onPin: () => void): Tile[] {
  const t = useAppT();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const access = useAccess();
  const { appointment } = model;
  const start = appointmentStart(appointment);
  // La cuenta de la cita en Transacciones: su recibo y, desde ahí, la devolución.
  const openAccount = () => navigate(`/transacciones?fecha=${format(start, "yyyy-MM-dd")}&cuenta=${appointment.id}`);
  const payment = appointment.status === "paid" ? appointment.payment : null;
  const tiles: Tile[] = [];
  if (payment) {
    // Fijar la cita (como en la reserva en línea): las próximas con el mismo barbero y a la misma hora.
    tiles.push({ id: "pin", icon: <Repeat className="size-5 text-primary" />, label: t("calendar.panel.pin.short"), title: t("calendar.panel.pin.title"), onClick: onPin });
    if (model.phone || model.email) {
      const lines = [
        ...model.services.map((service) => `• ${service.name}: ${ctx.formatMoney(service.price)}`),
        ...appointment.products.flatMap((line) => {
          const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
          return product ? [`• ${product.name} × ${line.qty}: ${ctx.formatMoney(product.price * line.qty)}`] : [];
        }),
      ];
      const message = t("calendar.panel.after.receiptMessage", {
        name: model.firstName,
        date: format(start, "EEEE d 'de' MMMM", { locale: calendarLocale(locale) }),
        lines: lines.join("\n"),
        tip: ctx.formatMoney(payment.tip),
        total: ctx.formatMoney(payment.total),
        method: t(PAYMENT_METHOD_KEYS[payment.method]),
      });
      const subject = t("calendar.panel.after.receiptSubject", { date: format(start, "d 'de' MMMM", { locale: calendarLocale(locale) }) });
      tiles.push({ id: "send", icon: <Send className="size-5 text-primary" />, label: t("calendar.panel.after.send"), title: t("calendar.panel.after.sendTitle"), menu: writeMenu(model, t, { subject, text: message }) });
    }
    tiles.push({ id: "receipt", icon: <ReceiptText className="size-5 text-primary" />, label: t("calendar.panel.after.receipt"), title: t("calendar.panel.after.receiptTitle"), onClick: openAccount });
    if (access.can("transactions", "edit")) {
      tiles.push({ id: "refund", icon: <Undo2 className="size-5 text-warning" />, label: t("calendar.panel.after.refund"), title: t("calendar.panel.after.refundTitle"), onClick: openAccount });
    }
  } else if (model.phone) {
    const Call = ACTION_ICON.call;
    const Chat = ACTION_ICON.message;
    tiles.push({ id: "call", icon: <Call className="size-5 text-primary" />, label: t("calendar.detail.call"), title: t("calendar.detail.call"), href: model.href("call") ?? undefined });
    tiles.push({ id: "message", icon: <Chat className="size-5 text-primary" />, label: t("calendar.detail.message"), title: t("calendar.panel.write.title"), menu: writeMenu(model, t) });
  }
  return tiles;
}


/** La tarjeta grande con quién vino, lo que se hizo y sus atajos dentro; lo demás, debajo. */
export function AfterVisit({ model, ctx, onOpenClient, onOpenHistory, linked = [], onSelectAppointment, onUnlink, onShowLinked }: AfterVisitProps) {
  const t = useAppT();
  const [pinning, setPinning] = React.useState(false);
  // Con la cita fijada (o fijándose), la próxima ya no se agenda aparte.
  const [pinned, setPinned] = React.useState(false);
  const tiles = useAfterTiles(model, ctx, () => setPinning((value) => !value));
  const { appointment, services, barber } = model;
  const paid = appointment.status === "paid" && appointment.payment !== null;
  const products = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
    return product ? [`${product.name} × ${line.qty}`] : [];
  });
  return (
    <div className="flex flex-col gap-5" data-testid="panel-after">
      {paid && <PanelStepper model={model} ctx={ctx} />}
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", paid ? MOMENT_TINT.paid : MOMENT_TINT.closed)} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" />
        <div className="-mt-2 flex flex-col gap-2">
          <SourceLine appointment={appointment} />
          <ClientTags model={model} />
        </div>
        <ClientField model={model} ctx={ctx} onOpenPage={onOpenClient} />
        <div className="flex items-center gap-3">
          <IconTile size="lg" src={services[0]?.imageUrl} icon={<ThemaIcon name="scissors" />} />
          <div className="flex min-w-0 flex-col">
            <Text weight="semibold" truncate>
              {[services.map((service) => service.name).join(" + "), ...products].filter(Boolean).join(" · ") || "—"}
            </Text>
            <Text size="sm" tone="secondary" tabular truncate>
              {`${formatClock(appointmentStart(appointment), ctx.intl)} – ${formatClock(appointmentEnd(appointment), ctx.intl)} · ${barber?.name ?? "—"}`}
            </Text>
          </div>
        </div>
        <TileRow tiles={tiles} label={t("calendar.panel.after.title")} />
      </section>
      {pinning && <PinSeries model={model} ctx={ctx} onClose={() => setPinning(false)} onPinned={() => setPinned(true)} />}
      {!pinning && !pinned && <NextVisitBooker model={model} ctx={ctx} />}
      {paid && (
        <section aria-label={t("calendar.panel.after.charged")} className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            {t("calendar.panel.after.charged")}
          </Text>
          <TicketSummary model={model} ctx={ctx} />
        </section>
      )}
      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        <NavRowLink label={t("calendar.history.title")} onClick={onOpenHistory} />
      </div>
    </div>
  );
}
