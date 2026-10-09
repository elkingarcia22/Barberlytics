import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import type { Reservation } from "../types";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { useBookingFlow } from "./BookingContext";
import { CalendarSheet } from "./CalendarSheet";
import { RepeatSheet } from "./RepeatSheet";
import { SendReceiptDialog } from "./SendReceiptDialog";

type ActionId = "receipt" | "calendar" | "repeat" | "detail";

function ActionTile({ icon, label, hint, onClick }: { icon: IconName; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <IconTile size="md" shape="circle" icon={<ThemaIcon name={icon} />} />
      <span className="flex min-w-0 flex-col">
        <Text size="sm" weight="semibold">
          {label}
        </Text>
        <Text size="xs" tone="muted">
          {hint}
        </Text>
      </span>
    </button>
  );
}

/**
 * Lo que se hace con la cita ya confirmada: enviar el recibo, agregarla al calendario, dejarla
 * fija y ver su detalle. Cada una abre su hoja, para no alargar la pantalla.
 */
export function ConfirmedActions({ reservation }: { reservation: Reservation }) {
  const t = useAppT();
  const { state } = useBookingFlow();
  const [open, setOpen] = React.useState<ActionId | null>(null);
  const close = (next: boolean) => !next && setOpen(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <ActionTile icon="mail" label={t("booking.confirmed.receipt")} hint={t("booking.confirmed.receiptHint")} onClick={() => setOpen("receipt")} />
        <ActionTile icon="calendarAdd" label={t("booking.confirmed.calendar")} hint={t("booking.confirmed.calendarHint")} onClick={() => setOpen("calendar")} />
        {state.token && <ActionTile icon="refresh" label={t("booking.confirmed.repeat")} hint={t("booking.confirmed.repeatHint")} onClick={() => setOpen("repeat")} />}
        <ActionTile icon="info" label={t("booking.confirmed.detail")} hint={t("booking.confirmed.detailHint")} onClick={() => setOpen("detail")} />
      </div>

      <SendReceiptDialog reservation={open === "receipt" ? reservation : null} onOpenChange={close} />
      <CalendarSheet reservation={reservation} open={open === "calendar"} onOpenChange={close} />
      <AppointmentDetailSheet reservation={reservation} open={open === "detail"} onOpenChange={close} />
      {state.token && <RepeatSheet reservation={reservation} open={open === "repeat"} onOpenChange={close} />}
    </>
  );
}
