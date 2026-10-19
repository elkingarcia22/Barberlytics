import { format } from "date-fns";
import { ReceiptText, Send, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { Text } from "@/components/typography";
import { useAccess } from "@/features/access";
import { appointmentStart, type ModelContext } from "../calendarModel";
import { AppointmentLinkSection, type AppointmentLinkProps } from "../appointmentTabs/AppointmentLinkSection";
import { ACTION_ICON } from "../appointmentActions";
import { PAYMENT_METHOD_KEYS } from "../types";
import { ClientSummaryRow } from "./ClientPage";
import { NextVisitBooker } from "./NextVisitBooker";
import { ClientTags } from "./PanelParts";
import { PanelStepper } from "./PanelShared";
import { SourceLine } from "./SourceLine";
import { StageHeading, TicketSummary, TileRow, type Tile } from "./StageParts";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * La cita ya cerrada —cobrada, o que no se atendió—. Lo que importa ya no es
 * la cita sino lo que sigue con el cliente: agendarle la próxima antes de que
 * se vaya, mandarle el recibo, verlo o devolver dinero si hace falta; lo que
 * se cobró y con qué citas iba enlazada. Lo demás (cambiar servicio o
 * barbero, la nota para el barbero, las alertas) ya no tiene uso y se queda
 * fuera; sigue en la ficha del cliente y en el historial.
 */

export interface AfterVisitProps extends Pick<AppointmentLinkProps, "linked" | "onSelectAppointment" | "onUnlink" | "onShowLinked"> {
  model: AppointmentModel;
  ctx: ModelContext;
  onOpenClient: () => void;
  onOpenHistory: () => void;
}

export function AfterVisit({ model, ctx, onOpenClient, onOpenHistory, linked = [], onSelectAppointment, onUnlink, onShowLinked }: AfterVisitProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const access = useAccess();
  const { appointment } = model;
  const paid = appointment.status === "paid" && appointment.payment !== null;
  const start = appointmentStart(appointment);
  const dayKey = format(start, "yyyy-MM-dd");
  // La cuenta de la cita en Transacciones: su recibo y, desde ahí, la devolución.
  const openAccount = () => navigate(`/transacciones?fecha=${dayKey}&cuenta=${appointment.id}`);

  const tiles: Tile[] = [];
  if (paid && appointment.payment) {
    const payment = appointment.payment;
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

  return (
    <div className="flex flex-col gap-5" data-testid="panel-after">
      {paid && <PanelStepper model={model} ctx={ctx} />}
      <StageHeading model={model} ctx={ctx} />
      <div className="-mt-2 flex flex-col gap-2">
        <SourceLine appointment={appointment} />
        <ClientTags model={model} />
      </div>
      <TileRow tiles={tiles} label={t("calendar.panel.after.title")} />
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
      {model.known && <ClientSummaryRow model={model} onOpen={onOpenClient} />}
      <button type="button" onClick={onOpenHistory} className="self-end rounded-md text-sm font-medium text-text-secondary outline-none transition-colors duration-fast hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/50">
        {t("calendar.history.title")} ›
      </button>
    </div>
  );
}
