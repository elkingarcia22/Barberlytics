import * as React from "react";
import { startOfDay } from "date-fns";
import { useAppT } from "@/app/i18n";
import { TimeSlotPicker } from "@/components/scheduling";
import { Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { clockMinutes, dayKeyOf, firstBookableDay, initialsOf, isSameDayAs, isTodayOver, parseStart, toStart } from "../bookingFormat";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";
import { useAvailabilityQuery } from "../queries";
import { itemDuration } from "../useBookingTotals";

/** Cuántos días hacia delante se puede reservar. */
const BOOKING_WINDOW_DAYS = 42;
const HOUR = 60;

const clockOf = (date: Date): string => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/**
 * Cuándo: el día en una tira y solo las horas libres de ese día, para el
 * barbero elegido o para cualquiera. La disponibilidad se pide al servidor
 * por día, así lo que se ve es lo que se puede reservar.
 */
export function TimeStep() {
  const t = useAppT();
  const { state, dispatch, shop, catalog, touch } = useBookingFlow();
  const draft = state.draft;
  const branch = shop.branches.find((item) => item.id === state.branchId);
  const todayOver = branch ? isTodayOver(branch.closesAt, shop.minNoticeMinutes) : false;
  const [day, setDay] = React.useState<Date>(() => (draft?.start ? startOfDay(parseStart(draft.start)) : branch ? firstBookableDay(branch.closesAt, shop.minNoticeMinutes) : startOfDay(new Date())));
  const availability = useAvailabilityQuery({ branchId: state.branchId, date: dayKeyOf(day), serviceIds: draft?.serviceIds ?? [], barberId: draft?.barberId ?? null });
  const free = React.useMemo(() => new Set((availability.data?.date === dayKeyOf(day) ? availability.data.slots : []).map((slot) => slot.time)), [availability.data, day]);
  const isWaiting = availability.isLoading || (availability.isFetching && availability.data?.date !== dayKeyOf(day));
  const barber = catalog?.barbers.find((item) => item.id === draft?.barberId);
  const minutes = itemDuration(draft?.serviceIds ?? [], catalog);
  const services = (draft?.serviceIds ?? []).map((id) => catalog?.services.find((service) => service.id === id)?.name).filter(Boolean);

  if (!draft || !branch) return null;

  return (
    <StepLayout title={t("booking.time.title")} lead={t("booking.time.lead")}>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-subtle p-3">
        {barber ? (
          <Avatar>
            {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
            <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <IconTile size="md" shape="circle" icon={<ThemaIcon name="users" />} />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Text size="sm" weight="medium" truncate>
            {barber ? t("booking.time.with", { name: barber.name }) : t("booking.time.withAny")}
          </Text>
          <Text size="xs" tone="muted" truncate>
            {services.join(" + ")} · {t("booking.review.minutes", { count: minutes })}
          </Text>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: "goTo", step: "barber" })}>
          {t("booking.time.change")}
        </Button>
      </div>

      <TimeSlotPicker
        value={draft.start ? parseStart(draft.start) : null}
        onChange={(date) => dispatch({ type: "chooseTime", start: toStart(date) })}
        day={day}
        onDayChange={setDay}
        daysCount={BOOKING_WINDOW_DAYS}
        startHour={Math.floor(clockMinutes(branch.opensAt) / HOUR)}
        endHour={Math.ceil(clockMinutes(branch.closesAt) / HOUR)}
        slotMinutes={shop.slotMinutes}
        isDayDisabled={(date) => todayOver && isSameDayAs(date, new Date())}
        isSlotDisabled={(date) => !free.has(clockOf(date))}
        hideUnavailable
        loading={isWaiting}
        size={touch}
      />

      {!isWaiting && free.size === 0 && (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-4">
          <Text size="sm" tone="secondary">
            {t("booking.time.noSlots")}
          </Text>
          {draft.barberId && (
            <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "chooseBarber", barberId: null })}>
              <ThemaIcon name="users" />
              {t("booking.time.tryAny")}
            </Button>
          )}
        </div>
      )}
    </StepLayout>
  );
}
