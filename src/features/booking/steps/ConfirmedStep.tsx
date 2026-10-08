import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { buildIcs, downloadIcs, parseStart } from "../bookingFormat";
import { AppointmentCard } from "../flow/AppointmentCard";
import { useBookingFlow } from "../flow/BookingContext";
import { ReceiptView } from "../flow/ReceiptView";
import { SendReceiptDialog } from "../flow/SendReceiptDialog";
import type { Reservation } from "../types";

/**
 * Hecho. Lo primero es la certeza —visto, número de reserva, cuándo—; luego
 * lo útil: guardarla en el calendario, el recibo, verla o cambiarla, y
 * reservar otra para la misma persona sin volver a empezar.
 */
export function ConfirmedStep({ onFinish }: { onFinish?: () => void }) {
  const t = useAppT();
  const { state, dispatch, shop, fmt } = useBookingFlow();
  const [receiptFor, setReceiptFor] = React.useState<Reservation | null>(null);
  const reservation = state.reservation;
  if (!reservation) return null;
  const isPaid = reservation.payment.status === "paid";

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="relative flex size-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-success/15 motion-safe:animate-ping motion-safe:[animation-iteration-count:1.5]" aria-hidden />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-success text-primary-foreground shadow-lg motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
            <ThemaIcon name="check" size="lg" tone="inverse" />
          </span>
        </span>
        <Heading level={2}>{t("booking.confirmed.title", { name: state.customer?.firstName ?? "" })}</Heading>
        <Text tone="secondary">{t("booking.confirmed.lead")}</Text>
        <Badge variant="outline">{t("booking.confirmed.number", { number: reservation.number })}</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {reservation.appointments.map((item) => (
          <AppointmentCard
            key={item.id}
            data={{
              personName: item.personName,
              relation: item.guestRelation,
              services: item.serviceNames,
              barberName: item.barberName,
              barberAvatarUrl: item.barberAvatarUrl,
              day: fmt.day(parseStart(item.start)),
    time: fmt.time(parseStart(item.start)),
              duration: t("booking.review.minutes", { count: item.durationMin }),
              price: fmt.money(item.price),
              branchName: item.branchName,
            }}
            status={<Badge variant="secondary">{t("booking.manage.status.scheduled")}</Badge>}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => downloadIcs(buildIcs(reservation.appointments, shop.name), `${reservation.number}.ics`)}>
          <ThemaIcon name="calendar" />
          {t("booking.confirmed.calendar")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setReceiptFor(reservation)}>
          <ThemaIcon name="send" />
          {t("booking.confirmed.receipt")}
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-surface-subtle p-4">
        <ReceiptView reservation={reservation} fmt={fmt} />
        {!isPaid && (
          <Text size="sm" tone="secondary" className="mt-3">
            {t("booking.confirmed.payAtShop", { amount: fmt.money(reservation.totals.total) })}
          </Text>
        )}
      </section>

      <Text size="sm" tone="muted" className="flex items-start gap-2">
        <ThemaIcon name="info" size="sm" />
        {t("booking.confirmed.arrive", { hours: shop.cancelHours })}
      </Text>

      <div className="mt-auto flex flex-col gap-2">
        <Button type="button" size="lg" onClick={() => dispatch({ type: "bookAgain" })}>
          <ThemaIcon name="plus" />
          {t("booking.confirmed.again")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => dispatch({ type: "openManage" })}>
          {t("booking.confirmed.manage")}
        </Button>
        {onFinish && (
          <Button type="button" variant="ghost" onClick={onFinish}>
            {t("booking.confirmed.done")}
          </Button>
        )}
      </div>

      <SendReceiptDialog reservation={receiptFor} onOpenChange={(open) => !open && setReceiptFor(null)} />
    </div>
  );
}
