import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { parseStart, type BookingFormatters } from "../bookingFormat";
import type { Reservation } from "../types";
import { OrderSummary } from "./OrderSummary";

interface ReceiptViewProps {
  reservation: Reservation;
  fmt: BookingFormatters;
}

/** El recibo de una reserva: número, lo cobrado por cita y producto, y con qué se pagó. */
export function ReceiptView({ reservation, fmt }: ReceiptViewProps) {
  const t = useAppT();
  const method =
    reservation.payment.method === "shop"
      ? null
      : reservation.payment.method === "credit"
        ? t("booking.payment.credit")
        : reservation.payment.last4
          ? `${reservation.payment.brand ?? ""} •••• ${reservation.payment.last4}`.trim()
          : (reservation.payment.brand ?? t("booking.payment.card"));
  const lines = [
    ...reservation.appointments.map((item) => ({
      id: item.id,
      label: item.serviceNames.join(" + "),
      detail: `${item.personName} · ${item.barberName} · ${fmt.when(parseStart(item.start))}`,
      amount: item.price,
    })),
    ...reservation.products.map((line) => ({ id: line.productId, label: line.qty > 1 ? `${line.name} × ${line.qty}` : line.name, amount: line.price * line.qty })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <Heading level={6}>{t("booking.payment.order")}</Heading>
          <Text size="xs" tone="muted" tabular>
            {t("booking.confirmed.number", { number: reservation.number })} · {fmt.day(new Date(reservation.createdAt))}
          </Text>
        </div>
        <Badge variant={reservation.payment.status === "paid" ? "secondary" : "outline"}>{method ? t("booking.receipt.paidWith", { method }) : t("booking.receipt.pending")}</Badge>
      </div>
      <OrderSummary totals={reservation.totals} money={fmt.money} lines={lines} promoCode={reservation.promoCode} />
    </div>
  );
}
