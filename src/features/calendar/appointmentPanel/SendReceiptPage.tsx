import { format } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { calendarLocale } from "@/components/date/calendarLocale";
import { appointmentStart, type ModelContext } from "../calendarModel";
import { PAYMENT_METHOD_KEYS } from "../types";
import { SendToClient } from "./SendToClient";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Enviar el recibo, como una página del panel: lo cobrado línea por línea en
 * el texto, y Correo y SMS para marcar con un solo «Enviar» debajo, igual que
 * el recibo de la reserva en línea.
 */
export function SendReceiptPage({ model, ctx, onDone }: { model: AppointmentModel; ctx: ModelContext; onDone: () => void }) {
  const t = useAppT();
  const { locale } = useLocale();
  const { appointment } = model;
  const payment = appointment.status === "paid" ? appointment.payment : null;
  if (!payment) return null;
  const lines = [
    ...model.services.map((service) => `• ${service.name}: ${ctx.formatMoney(service.price)}`),
    ...appointment.products.flatMap((line) => {
      const product = ctx.catalog.products.find((entry) => entry.id === line.productId);
      return product ? [`• ${product.name} × ${line.qty}: ${ctx.formatMoney(product.price * line.qty)}`] : [];
    }),
  ];
  const body = t("calendar.panel.after.receiptMessage", {
    name: model.firstName,
    date: format(appointmentStart(appointment), "EEEE d 'de' MMMM", { locale: calendarLocale(locale) }),
    lines: lines.join("\n"),
    tip: ctx.formatMoney(payment.tip),
    total: ctx.formatMoney(payment.total),
    method: t(PAYMENT_METHOD_KEYS[payment.method]),
  });
  return <SendToClient model={model} kind="receipt" lead={t("calendar.panel.send.lead")} body={body} onSent={onDone} />;
}
