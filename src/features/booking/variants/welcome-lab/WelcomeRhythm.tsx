import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf, parseStart } from "../../bookingFormat";
import { StepLayout } from "../../flow/StepLayout";
import type { WelcomeData } from "./useWelcomeData";

const WEEK_DAYS = 7;
const DAY_MS = 86_400_000;

interface Chip {
  id: string;
  icon: IconName;
  label: string;
  onClick: () => void;
}

/**
 * Propuesta C · Tu ritmo. Pensada para el pulgar: arriba, atajos como pastillas que se deslizan;
 * en medio, lo de siempre en una fila y las horas propuestas como lista grande (fecha a la
 * izquierda, hora y barbero a la derecha); abajo, el botón fijo con lo elegido y el precio.
 */
export function WelcomeRhythm({ data }: { data: WelcomeData }) {
  const t = useAppT();
  const { customer, services, barber, suggestion, price, durationMin, fmt, actions, catalog, last } = data;
  const [picked, setPicked] = React.useState(0);
  // «Hace N días» se mide contra el momento en que se abrió la pantalla, no en cada render.
  const [now] = React.useState(() => Date.now());
  if (!customer) return null;
  const option = suggestion?.options[picked] ?? suggestion?.options[0] ?? null;
  const when = option ? parseStart(option.start) : null;
  const lead = services[0];

  const rhythm = suggestion
    ? suggestion.everyDays % WEEK_DAYS === 0
      ? t("booking.suggest.everyWeeks", { count: suggestion.everyDays / WEEK_DAYS })
      : t("booking.suggest.everyDays", { count: suggestion.everyDays })
    : null;
  const daysSince = last ? Math.max(0, Math.round((now - new Date(last.at).getTime()) / DAY_MS)) : null;
  const leadText = [rhythm, daysSince !== null ? t("booking.suggest.lastVisit", { count: daysSince }) : null].filter(Boolean).join(" · ");

  const chips: Chip[] = [
    { id: "new", icon: "plus", label: t("booking.welcomeLab.somethingNew"), onClick: actions.startFresh },
    ...(customer.upcoming > 0 ? [{ id: "manage", icon: "calendar" as const, label: `${t("booking.welcomeLab.appointments")} · ${customer.upcoming}`, onClick: actions.manage }] : []),
    ...(data.hasPackages ? [{ id: "packages", icon: "layers" as const, label: t("booking.welcomeLab.packages"), onClick: actions.packages }] : []),
    ...(data.canGift ? [{ id: "gift", icon: "ticket" as const, label: t("booking.welcomeLab.gift"), onClick: actions.gift }] : []),
  ];

  const footer = (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="sm" weight="semibold" tabular truncate className="first-letter:uppercase">
          {when ? `${fmt.dayShort(when)} · ${fmt.time(when)}` : t("booking.welcomeLab.pickTime")}
        </Text>
        <Text size="xs" tone="muted" tabular>
          {fmt.money(price)}
          {customer.credit > 0 ? ` · ${t("booking.welcomeLab.credit", { amount: fmt.money(customer.credit) })}` : ""}
        </Text>
      </div>
      {option ? (
        <Button type="button" size="lg" onClick={() => actions.book(option)}>
          {t("booking.welcomeLab.book")}
          <ThemaIcon name="arrowRight" />
        </Button>
      ) : (
        <Button type="button" size="lg" disabled={!data.canRepeat} onClick={actions.repeat}>
          {t("booking.welcome.repeat")}
          <ThemaIcon name="arrowRight" />
        </Button>
      )}
    </div>
  );

  return (
    <StepLayout title={t("booking.welcomeLab.hello", { name: customer.firstName })} lead={leadText || undefined} footer={footer}>
      {/* Atajos que se deslizan de lado: no empujan lo importante hacia abajo. */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {chips.map((chip) => (
          <Button key={chip.id} type="button" size="sm" variant="outline" className="shrink-0 rounded-full" onClick={chip.onClick}>
            <ThemaIcon name={chip.icon} />
            {chip.label}
          </Button>
        ))}
      </div>

      {data.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          {lead && (
            <section aria-labelledby="rhythm-usual" className="flex flex-col gap-2">
              <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-widest">
                {t("booking.welcomeLab.usual")}
              </Text>
              <div className="flex items-center gap-3">
                <IconTile size="lg" src={lead.imageUrl} icon={<ThemaIcon name="scissors" />} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text weight="semibold" truncate id="rhythm-usual">
                    {services.map((item) => item.name).join(" + ")}
                  </Text>
                  <Text size="xs" tone="muted" truncate>
                    {t("booking.services.minutes", { count: durationMin })}
                    {barber ? ` · ${t("booking.welcomeLab.with", { name: barber.name })}` : ""}
                  </Text>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={actions.startFresh}>
                  {t("booking.welcomeLab.change")}
                </Button>
              </div>
            </section>
          )}

          <section aria-labelledby="rhythm-times" className="flex flex-col gap-3">
            <Heading level={5} id="rhythm-times" className="first-letter:uppercase">
              {suggestion ? (suggestion.isOverdue ? t("booking.suggest.overdue") : t("booking.suggest.due", { date: fmt.dayShort(parseStart(suggestion.options[0]?.start ?? suggestion.dueDate)) })) : t("booking.welcomeLab.pickTime")}
            </Heading>
            {suggestion && suggestion.options.length > 0 ? (
              <div role="radiogroup" aria-label={t("booking.suggest.options")} className="flex flex-col gap-2">
                {suggestion.options.map((item, index) => {
                  const date = parseStart(item.start);
                  const isPicked = index === picked;
                  const who = item.sameBarber ? barber : catalog?.barbers.find((entry) => entry.id === item.barberId);
                  return (
                    <button
                      key={item.start + item.barberId}
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      onClick={() => setPicked(index)}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border p-3 text-left",
                        "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        isPicked ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-surface-subtle"
                      )}
                    >
                      {/* La fecha como hoja de calendario: el día de la semana pequeño y el número grande. */}
                      <span className={cn("flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5", isPicked ? "bg-primary text-primary-foreground" : "bg-surface-subtle")}>
                        <span className="text-xs font-semibold uppercase opacity-80">{fmt.dayShort(date).split(" ")[0]}</span>
                        <span className="text-lg font-semibold leading-6 tabular-nums">{date.getDate()}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <Text as="span" size="lg" weight="semibold" tabular>
                          {fmt.time(date)}
                        </Text>
                        <Text as="span" size="xs" tone="muted" truncate>
                          {item.sameBarber ? t("booking.welcomeLab.yourBarber") : t("booking.welcomeLab.otherBarber")}
                          {who ? ` · ${who.name}` : ""}
                        </Text>
                      </span>
                      {who && (
                        <Avatar size="sm">
                          {who.avatarUrl && <AvatarImage src={who.avatarUrl} alt="" />}
                          <AvatarFallback>{initialsOf(who.name)}</AvatarFallback>
                        </Avatar>
                      )}
                    </button>
                  );
                })}
                <Button type="button" variant="ghost" className="self-start" onClick={actions.repeat}>
                  <ThemaIcon name="calendar" />
                  {t("booking.suggest.other")}
                </Button>
              </div>
            ) : (
              <Text size="sm" tone="secondary">
                {t("booking.welcomeLab.noSuggestion")}
              </Text>
            )}
          </section>
        </>
      )}

      <Button type="button" variant="link" size="sm" className="self-center" onClick={actions.notYou}>
        {t("booking.welcome.notYou")}
      </Button>
    </StepLayout>
  );
}
