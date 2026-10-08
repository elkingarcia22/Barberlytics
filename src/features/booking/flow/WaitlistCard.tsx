import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { SegmentedControl } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { dayKeyOf } from "../bookingFormat";
import { useJoinWaitlistMutation, useLeaveWaitlistMutation } from "../queries";
import type { WaitlistJoined, WaitlistWindow } from "../types";
import { useBookingFlow } from "./BookingContext";

const WINDOW_KEYS: Record<WaitlistWindow, AppMessageKey> = {
  morning: "booking.waitlist.morning",
  afternoon: "booking.waitlist.afternoon",
  any: "booking.waitlist.any",
};

interface WaitlistCardProps {
  day: Date;
  /** Dónde ya se apuntó, por día: vive en el paso para no perderlo al cambiar de día y volver. */
  joined: WaitlistJoined | null;
  onJoinedChange: (joined: WaitlistJoined | null) => void;
}

/**
 * La lista de espera: si prefiere a su barbero (o ese día) aunque no haya
 * hora, se apunta con la franja que le sirve. La entrada cae en la misma lista
 * de espera que ve la barbería en el Calendario, que le escribe si alguien cancela.
 */
export function WaitlistCard({ day, joined, onJoinedChange }: WaitlistCardProps) {
  const t = useAppT();
  const { state, catalog, fmt } = useBookingFlow();
  const [window, setWindow] = React.useState<WaitlistWindow>("any");
  const join = useJoinWaitlistMutation();
  const leave = useLeaveWaitlistMutation();
  const draft = state.draft;
  const customer = state.customer;
  const barber = catalog?.barbers.find((item) => item.id === draft?.barberId);
  if (!draft || !customer || !state.branchId) return null;
  const dayLabel = fmt.dayLong(day);

  if (joined) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
        <IconTile size="md" shape="circle" tone="positive" icon={<ThemaIcon name="check" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Text size="sm" weight="semibold">
            {t("booking.waitlist.joined")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("booking.waitlist.joinedDetail", { day: dayLabel, window: t(WINDOW_KEYS[joined.window]) })}
          </Text>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="self-start px-0"
            disabled={leave.isPending}
            onClick={() =>
              leave.mutate(
                { id: joined.id, customerId: customer.id },
                { onSuccess: () => (onJoinedChange(null), toast(t("booking.waitlist.left"))), onError: () => toast.error(t("booking.waitlist.error")) }
              )
            }
          >
            {t("booking.waitlist.leave")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="waitlist-title" className="flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4">
      <div className="flex items-start gap-3">
        <IconTile size="md" shape="circle" icon={<ThemaIcon name="notification" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Heading level={6} id="waitlist-title">
            {barber ? t("booking.waitlist.titleWith", { name: barber.name.split(" ")[0] }) : t("booking.waitlist.title")}
          </Heading>
          <Text size="sm" tone="secondary">
            {t("booking.waitlist.lead", { day: dayLabel })}
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Text size="xs" tone="muted">
          {t("booking.waitlist.window")}
        </Text>
        <SegmentedControl
          size="sm"
          fullWidth
          value={window}
          onChange={(value) => setWindow(value as WaitlistWindow)}
          options={(Object.keys(WINDOW_KEYS) as WaitlistWindow[]).map((value) => ({ value, label: t(WINDOW_KEYS[value]) }))}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={join.isPending}
        onClick={() =>
          join.mutate(
            { branchId: state.branchId as string, customerId: customer.id, date: dayKeyOf(day), serviceIds: draft.serviceIds, barberId: draft.barberId, window },
            { onSuccess: onJoinedChange, onError: () => toast.error(t("booking.waitlist.error")) }
          )
        }
      >
        <ThemaIcon name="notification" />
        {t("booking.waitlist.join")}
      </Button>
    </section>
  );
}
