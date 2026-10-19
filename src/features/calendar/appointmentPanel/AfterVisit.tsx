import { format } from "date-fns";
import { ReceiptText, Send, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { formatClock } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useAccess } from "@/features/access";
import { OrderSummary } from "@/features/booking/flow/OrderSummary";
import type { Totals } from "@/features/booking/pricing";
import { appointmentEnd, appointmentStart, durationLabel, type ModelContext } from "../calendarModel";
import { ProductThumb, ServiceThumb } from "../calendarShared";
import { AppointmentLinkSection, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { ACTION_ICON } from "../appointmentActions";
import { PAYMENT_METHOD_KEYS } from "../types";
import { ClientSummaryRow } from "./ClientPage";
import { NextVisitBooker } from "./NextVisitBooker";
import { ClientTags } from "./PanelParts";
import { PanelStepper } from "./PanelShared";
import { PanelField, PanelQuestion } from "./bookingStyle";
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
 * Cada versión del panel lo cuenta con su cara: «Arma la cita» en preguntas y
 * tarjetas, como la reserva en línea; «Tarjeta del momento» con la tarjeta
 * grande teñida del estado, con el cobro y sus atajos dentro.
 */

export interface AfterVisitProps extends Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> {
  model: AppointmentModel;
  ctx: ModelContext;
  variant: "cards" | "moment";
  onOpenClient: () => void;
  onOpenHistory: () => void;
}

/** El tinte de la tarjeta del momento: verde cobrada, gris si se cerró sin atender. */
const MOMENT_TINT = { paid: "from-success/15 via-success/5", closed: "from-muted via-muted/40" } as const;

/** Los atajos de después: recibo y devolución si se cobró; llamar y escribir si no vino. */
function useAfterTiles(model: AppointmentModel, ctx: ModelContext): Tile[] {
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
    if (model.phone) {
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
      tiles.push({ id: "send", icon: <Send className="size-5 text-primary" />, label: t("calendar.panel.after.send"), title: t("calendar.panel.after.sendTitle"), href: `https://wa.me/${model.phone.replace("+", "")}?text=${encodeURIComponent(message)}`, external: true });
    }
    tiles.push({ id: "receipt", icon: <ReceiptText className="size-5 text-primary" />, label: t("calendar.panel.after.receipt"), title: t("calendar.panel.after.receiptTitle"), onClick: openAccount });
    if (access.can("transactions", "edit")) {
      tiles.push({ id: "refund", icon: <Undo2 className="size-5 text-warning" />, label: t("calendar.panel.after.refund"), title: t("calendar.panel.after.refundTitle"), onClick: openAccount });
    }
  } else if (model.phone) {
    const Call = ACTION_ICON.call;
    const Chat = ACTION_ICON.whatsapp;
    tiles.push({ id: "call", icon: <Call className="size-5 text-primary" />, label: t("calendar.detail.call"), title: t("calendar.detail.call"), href: model.href("call") ?? undefined });
    tiles.push({ id: "whatsapp", icon: <Chat className="size-5 text-primary" />, label: t("calendar.detail.whatsapp"), title: t("calendar.detail.whatsapp"), href: model.href("whatsapp") ?? undefined, external: true });
  }
  return tiles;
}

/** El total de lo cobrado, sin las líneas: las líneas van en tarjetas («Arma la cita»). */
function chargedTotals(model: AppointmentModel, ctx: ModelContext): Totals {
  const { appointment, services } = model;
  const servicesTotal = services.reduce((sum, service) => sum + service.price, 0);
  const productsTotal = appointment.products.reduce((sum, line) => sum + (ctx.catalog.products.find((entry) => entry.id === line.productId)?.price ?? 0) * line.qty, 0);
  const payment = appointment.payment;
  return { services: servicesTotal, products: productsTotal, discount: 0, subtotal: servicesTotal + productsTotal, tax: payment?.tax ?? 0, tip: payment?.tip ?? 0, fee: 0, feeName: null, gift: 0, reward: 0, prepaid: 0, total: payment?.total ?? servicesTotal + productsTotal };
}

export function AfterVisit(props: AfterVisitProps) {
  return props.variant === "moment" ? <AfterVisitMoment {...props} /> : <AfterVisitCards {...props} />;
}

/** «Arma la cita», después: cada cosa es una pregunta con su respuesta en tarjetas, como la reserva. */
function AfterVisitCards({ model, ctx, onOpenClient, onOpenHistory, linked = [], onSelectAppointment, onUnlink, onShowLinked }: AfterVisitProps) {
  const t = useAppT();
  const tiles = useAfterTiles(model, ctx);
  const { appointment } = model;
  const paid = appointment.status === "paid" && appointment.payment !== null;
  return (
    <div className="flex flex-col gap-5" data-testid="panel-after" data-variant="cards">
      {paid && <PanelStepper model={model} ctx={ctx} />}
      <StageHeading model={model} ctx={ctx} />
      <div className="-mt-2 flex flex-col gap-2">
        <SourceLine appointment={appointment} />
        <ClientTags model={model} />
      </div>
      <TileRow tiles={tiles} label={t("calendar.panel.after.title")} />
      <PanelQuestion title={t("calendar.panel.next.title")}>
        <NextVisitBooker model={model} ctx={ctx} bare />
      </PanelQuestion>
      {paid && (
        <PanelQuestion title={t("calendar.panel.after.charged")}>
          <div className="flex flex-col gap-2">
            {model.services.map((service) => (
              <PanelField key={service.id} eyebrow={t("calendar.panel.fields.services")} value={service.name} detail={`${durationLabel(service.durationMin)} · ${ctx.formatMoney(service.price)}`} leading={<ServiceThumb service={service} size="md" />} />
            ))}
            {appointment.products.map((line) => {
              const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
              return product ? <PanelField key={line.productId} eyebrow={t("calendar.panel.fields.product")} value={product.name} detail={`× ${line.qty} · ${ctx.formatMoney(product.price * line.qty)}`} leading={<ProductThumb product={product} size="md" tone="neutral" />} /> : null;
            })}
          </div>
          <div className="px-1 pt-1">
            <OrderSummary totals={chargedTotals(model, ctx)} money={ctx.formatMoney} />
          </div>
        </PanelQuestion>
      )}
      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}
      {model.known && (
        <PanelQuestion title={t("calendar.panel.cards.who")}>
          <ClientSummaryRow model={model} onOpen={onOpenClient} />
        </PanelQuestion>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClipperButton model={model} ctx={ctx} />
        <HistoryLink onOpen={onOpenHistory} />
      </div>
    </div>
  );
}

/** «Tarjeta del momento», después: la tarjeta grande con el cobro y sus atajos dentro; lo demás, debajo. */
function AfterVisitMoment({ model, ctx, onOpenClient, onOpenHistory, linked = [], onSelectAppointment, onUnlink, onShowLinked }: AfterVisitProps) {
  const t = useAppT();
  const tiles = useAfterTiles(model, ctx);
  const { appointment, services, barber } = model;
  const paid = appointment.status === "paid" && appointment.payment !== null;
  const products = appointment.products.flatMap((line) => {
    const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
    return product ? [`${product.name} × ${line.qty}`] : [];
  });
  return (
    <div className="flex flex-col gap-5" data-testid="panel-after" data-variant="moment">
      {paid && <PanelStepper model={model} ctx={ctx} />}
      <section className={cn("flex flex-col gap-4 rounded-2xl bg-gradient-to-b to-transparent p-4", paid ? MOMENT_TINT.paid : MOMENT_TINT.closed)} data-testid="panel-moment-card">
        <StageHeading model={model} ctx={ctx} size="lg" />
        <div className="-mt-2 flex flex-col gap-2">
          <SourceLine appointment={appointment} />
          <ClientTags model={model} />
        </div>
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
      <NextVisitBooker model={model} ctx={ctx} />
      {paid && (
        <section aria-label={t("calendar.panel.after.charged")} className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            {t("calendar.panel.after.charged")}
          </Text>
          <TicketSummary model={model} ctx={ctx} />
        </section>
      )}
      {linked.length > 1 && onSelectAppointment && <AppointmentLinkSection linked={linked} current={appointment} ctx={ctx} onSelect={onSelectAppointment} onUnlink={onUnlink} onShowLinked={onShowLinked} />}
      <div className="grid grid-cols-2 gap-2">
        {model.known && (
          <ActionTile layout="stacked" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="users" />} />} title={t("calendar.tab.client")} description={t("calendar.panel.client.membershipShort", { count: model.loyaltyProgress, total: 10 })} onClick={onOpenClient} />
        )}
        <ActionTile layout="stacked" leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="clock" />} />} title={t("calendar.history.title")} description={t("calendar.panel.index.historyHint")} onClick={onOpenHistory} />
      </div>
      <ClipperButton model={model} ctx={ctx} />
    </div>
  );
}

function HistoryLink({ onOpen }: { onOpen: () => void }) {
  const t = useAppT();
  return (
    <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-text-secondary outline-none transition-colors duration-fast hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50">
      {t("calendar.history.title")}
      <ThemaIcon name="chevronRight" size="sm" />
    </button>
  );
}
