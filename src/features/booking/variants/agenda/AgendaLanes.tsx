import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf } from "../../bookingFormat";
import { useBookingFlow } from "../../flow/BookingContext";
import type { BookingBarber } from "../../types";
import { itemPrice } from "../../useBookingTotals";
import type { DayWindow, TimeOption } from "./agendaModel";

/** Cuántas horas se ven de entrada por barbero; el resto, tras «+N». */
const VISIBLE_TIMES = { compact: 8, wide: 12 } as const;
const AVATAR_STACK = 3;

const WINDOW_LABEL = { morning: "booking.waitlist.morning", afternoon: "booking.waitlist.afternoon", evening: "booking.waitlist.evening" } as const;

/** Una hora como pastilla: libre, apartada en el carrito o mientras se reserva. */
function TimePill({ label, taken, onPick, ariaLabel, children }: { label: string; taken: boolean; onPick: () => void; ariaLabel: string; children?: React.ReactNode }) {
  const { touch } = useBookingFlow();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={taken}
      disabled={taken}
      onClick={onPick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 tabular-nums transition-[background-color,border-color,transform] duration-fast ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.96] motion-reduce:transition-none",
        touch === "lg" ? "h-11 min-w-[5.5rem]" : "h-9 min-w-[4.75rem]",
        taken ? "border-primary bg-primary/10" : "border-border bg-surface hover:-translate-y-px hover:border-primary hover:bg-primary/5"
      )}
    >
      {taken && <ThemaIcon name="check" size="xs" tone="primary" />}
      <Text as="span" size="sm" weight="medium" tone={taken ? "primary" : "default"}>
        {label}
      </Text>
      {children}
    </button>
  );
}

interface BarberLaneProps {
  barber: BookingBarber;
  times: readonly { time: string; taken: boolean }[];
  isUsual: boolean;
  timeLabel: (time: string) => string;
  onPick: (time: string) => void;
  onProfile: () => void;
}

/**
 * Un barbero y sus horas libres del día, en una sola tarjeta: quién es, cuánto
 * cobra por lo elegido y, debajo, las horas a un toque. Quien no tiene horas
 * ese día se queda en la lista, apagado, para que se sepa que existe.
 */
export function BarberLane({ barber, times, isUsual, timeLabel, onPick, onProfile }: BarberLaneProps) {
  const t = useAppT();
  const { state, catalog, fmt, layout } = useBookingFlow();
  const [expanded, setExpanded] = React.useState(false);
  const limit = VISIBLE_TIMES[layout];
  const shown = expanded ? times : times.slice(0, limit);
  const hidden = times.length - shown.length;
  const serviceIds = state.draft?.serviceIds ?? [];

  return (
    <article aria-label={barber.name} className={cn("flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm", isUsual ? "border-primary/50" : "border-border", times.length === 0 && "opacity-70")}>
      <header className="flex items-center gap-3">
        <Avatar size="lg">
          {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
          <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Heading level={6} className="truncate">
              {barber.name}
            </Heading>
            {isUsual && <Badge variant="secondary">{t("booking.agenda.yourBarber")}</Badge>}
          </div>
          <Text size="xs" tone="secondary" className="flex flex-wrap items-center gap-x-1">
            <span className="text-warning" aria-hidden>
              ★
            </span>
            <span className="tabular-nums">{barber.rating.toFixed(1)}</span>
            <span aria-hidden>·</span>
            <span className="font-medium text-text-primary tabular-nums">{fmt.money(itemPrice({ serviceIds, barberId: barber.id }, catalog))}</span>
            {barber.level && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{barber.level}</span>
              </>
            )}
          </Text>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onProfile} aria-label={`${t("booking.barber.profile")}: ${barber.name}`}>
          {t("booking.barber.profile")}
        </Button>
      </header>
      {times.length === 0 ? (
        <Text size="sm" tone="muted">
          {t("booking.agenda.noSlotsBarber")}
        </Text>
      ) : (
        <div className="flex flex-wrap gap-2">
          {shown.map((slot) => (
            <TimePill
              key={slot.time}
              label={timeLabel(slot.time)}
              taken={slot.taken}
              onPick={() => onPick(slot.time)}
              ariaLabel={t("booking.agenda.pickWith", { time: timeLabel(slot.time), name: barber.name })}
            />
          ))}
          {hidden > 0 && (
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setExpanded(true)}>
              {t("booking.agenda.moreTimes", { count: hidden })}
            </Button>
          )}
          {expanded && times.length > limit && (
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setExpanded(false)}>
              {t("booking.agenda.lessTimes")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

interface TimeWindowsProps {
  groups: readonly { window: DayWindow; options: TimeOption[] }[];
  timeLabel: (time: string) => string;
  /** Si ya se eligió con quién: las horas se anuncian «con» esa persona. */
  withName?: string;
  onPick: (time: string) => void;
}

/**
 * Las horas del día sin pensar en quién: por franja, cada hora con las caras de
 * quienes pueden y cuántos son. Tocar una es reservar «con quien esté libre».
 */
export function TimeWindows({ groups, timeLabel, withName, onPick }: TimeWindowsProps) {
  const t = useAppT();
  const { catalog } = useBookingFlow();
  const faces = (ids: readonly string[]) => ids.map((id) => catalog?.barbers.find((barber) => barber.id === id)).filter((barber): barber is BookingBarber => barber !== undefined);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.window} aria-label={t(WINDOW_LABEL[group.window])} className="flex flex-col gap-2.5">
          <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
            {t(WINDOW_LABEL[group.window])}
          </Text>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const people = faces(option.barberIds);
              return (
                <TimePill
                  key={option.time}
                  label={timeLabel(option.time)}
                  taken={option.taken && option.barberIds.length === 0}
                  onPick={() => onPick(option.time)}
                  ariaLabel={withName ? t("booking.agenda.pickWith", { time: timeLabel(option.time), name: withName }) : t("booking.agenda.pickAny", { time: timeLabel(option.time), count: option.barberIds.length })}
                >
                  {people.length > 0 && (
                    <AvatarGroup aria-hidden>
                      {people.slice(0, AVATAR_STACK).map((barber) => (
                        <Avatar key={barber.id} size="sm">
                          {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
                          <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  )}
                </TimePill>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
