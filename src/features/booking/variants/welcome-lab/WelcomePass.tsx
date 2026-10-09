import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf, parseStart } from "../../bookingFormat";
import { STEP_WIDTH } from "../../flow/stepWidth";
import type { WelcomeData } from "./useWelcomeData";

interface PassRow {
  id: string;
  icon: IconName;
  label: string;
  hint: string;
  onClick: () => void;
}

/**
 * Propuesta A · Pase. Una sola decisión: la hora que le toca, enorme, como titular. Debajo, su
 * visita de siempre como un pase (servicio arriba, barbero abajo, la línea troquelada en medio) y
 * el botón. Las otras horas son chips; lo demás, una lista sin cajas al final.
 */
export function WelcomePass({ data }: { data: WelcomeData }) {
  const t = useAppT();
  const { customer, services, barber, branch, suggestion, price, durationMin, fmt, layout, actions, catalog } = data;
  const [picked, setPicked] = React.useState(0);
  if (!customer) return null;
  const option = suggestion?.options[picked] ?? suggestion?.options[0] ?? null;
  const when = option ? parseStart(option.start) : null;
  const optionBarber = option && !option.sameBarber ? catalog?.barbers.find((item) => item.id === option.barberId) : barber;
  const lead = services[0];

  const rows: PassRow[] = [
    { id: "new", icon: "plus", label: t("booking.welcome.different"), hint: t("booking.welcomeLab.somethingNewHint"), onClick: actions.startFresh },
    ...(customer.upcoming > 0 ? [{ id: "manage", icon: "calendar" as const, label: t("booking.welcomeLab.appointments"), hint: t("booking.welcomeLab.appointmentsHint", { count: customer.upcoming }), onClick: actions.manage }] : []),
    ...(data.hasPackages ? [{ id: "packages", icon: "ticket" as const, label: t("booking.packages.cta"), hint: t("booking.packages.ctaHint"), onClick: actions.packages }] : []),
    ...(data.canGift ? [{ id: "gift", icon: "ticket" as const, label: t("booking.gift.cta"), hint: t("booking.gift.ctaHint"), onClick: actions.gift }] : []),
  ];

  return (
    <div className={cn("mx-auto flex w-full flex-1 flex-col gap-7 px-5 pb-8 pt-6", STEP_WIDTH[layout])}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/15 text-primary">{initialsOf(customer.name)}</AvatarFallback>
          </Avatar>
          <Text size="sm" tone="secondary" truncate>
            {t("booking.welcomeLab.hello", { name: customer.firstName })}
          </Text>
        </div>
        {customer.credit > 0 && <Badge variant="secondary">{t("booking.welcomeLab.credit", { amount: fmt.money(customer.credit) })}</Badge>}
      </header>

      {data.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : (
        <>
          {/* El titular es la hora: lo único que tiene que decidir. */}
          <section aria-labelledby="pass-when" className="flex flex-col gap-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <Text size="xs" weight="semibold" tone="primary" className="uppercase tracking-widest">
              {suggestion?.isOverdue ? t("booking.welcomeLab.overdue") : when ? t("booking.welcomeLab.due") : t("booking.welcomeLab.usual")}
            </Text>
            {when ? (
              <Heading level={1} id="pass-when" className="flex flex-col gap-1 leading-none [&>span]:leading-[1.05]">
                <span className="block first-letter:uppercase">{fmt.dayShort(when)}</span>
                <span className="block text-primary tabular-nums">{fmt.time(when)}</span>
              </Heading>
            ) : (
              <Heading level={2} id="pass-when">
                {t("booking.welcomeLab.pickTime")}
              </Heading>
            )}
          </section>

          {lead && (
            <article className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
              {lead.imageUrl && (
                <div className="relative h-28 overflow-hidden">
                  <img src={lead.imageUrl} alt="" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" aria-hidden />
                </div>
              )}
              <div className={cn("flex items-end justify-between gap-3 px-5 pb-4", lead.imageUrl ? "-mt-6 relative" : "pt-5")}>
                <div className="flex min-w-0 flex-col">
                  <Heading level={4} truncate>
                    {services.map((item) => item.name).join(" + ")}
                  </Heading>
                  <Text size="xs" tone="muted">
                    {t("booking.services.minutes", { count: durationMin })}
                    {branch ? ` · ${branch.name}` : ""}
                  </Text>
                </div>
                <Text size="xl" weight="semibold" tabular className="shrink-0">
                  {fmt.money(price)}
                </Text>
              </div>
              {/* La línea troquelada del pase: dos muescas del color del fondo y un trazo discontinuo. */}
              <div className="relative h-4" aria-hidden>
                <span className="absolute -left-2 top-0 size-4 rounded-full border border-border bg-background" />
                <span className="absolute -right-2 top-0 size-4 rounded-full border border-border bg-background" />
                <span className="absolute inset-x-4 top-1/2 border-t border-dashed border-border" />
              </div>
              {optionBarber && (
                <div className="flex items-center gap-3 px-5 pb-5 pt-2">
                  <Avatar>
                    {optionBarber.avatarUrl && <AvatarImage src={optionBarber.avatarUrl} alt="" />}
                    <AvatarFallback>{initialsOf(optionBarber.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Text size="xs" tone="muted">
                      {option && !option.sameBarber ? t("booking.welcomeLab.otherBarber") : t("booking.welcomeLab.yourBarber")}
                    </Text>
                    <Text size="sm" weight="medium" truncate>
                      {optionBarber.name}
                      {optionBarber.level ? ` · ${optionBarber.level}` : ""}
                    </Text>
                  </div>
                </div>
              )}
            </article>
          )}

          <div className="flex flex-col gap-4">
            {option && when ? (
              <Button type="button" size="lg" className="w-full" onClick={() => actions.book(option)}>
                {t("booking.suggest.book", { when: `${fmt.dayShort(when)} · ${fmt.time(when)}` })}
                <ThemaIcon name="arrowRight" />
              </Button>
            ) : (
              <Button type="button" size="lg" className="w-full" disabled={!data.canRepeat} onClick={actions.repeat}>
                {t("booking.welcome.repeat")}
                <ThemaIcon name="arrowRight" />
              </Button>
            )}

            {suggestion && suggestion.options.length > 0 && (
              <div className="flex flex-col gap-2">
                <Text size="xs" tone="muted">
                  {t("booking.welcomeLab.otherTimes")}
                </Text>
                <div role="radiogroup" aria-label={t("booking.suggest.options")} className="flex flex-wrap gap-2">
                  {suggestion.options.map((item, index) => {
                    const date = parseStart(item.start);
                    const isPicked = index === picked;
                    return (
                      <Button
                        key={item.start + item.barberId}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        size="sm"
                        variant={isPicked ? "default" : "outline"}
                        className="rounded-full tabular-nums"
                        onClick={() => setPicked(index)}
                      >
                        <span className="first-letter:uppercase">{fmt.dayShort(date)}</span> · {fmt.time(date)}
                      </Button>
                    );
                  })}
                  <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={actions.repeat}>
                    <ThemaIcon name="calendar" />
                    {t("booking.welcomeLab.moreTimes")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Lo demás, sin cajas: filas con su línea divisoria. */}
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={row.onClick}
              className="flex w-full items-center gap-3 py-3.5 text-left transition-colors duration-fast ease-out-expo hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              <ThemaIcon name={row.icon} size="sm" tone="muted" />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium">
                  {row.label}
                </Text>
                <Text as="span" size="xs" tone="muted" truncate>
                  {row.hint}
                </Text>
              </span>
              <ThemaIcon name="chevronRight" size="sm" tone="muted" />
            </button>
          </li>
        ))}
      </ul>

      <Button type="button" variant="link" size="sm" className="self-center" onClick={actions.notYou}>
        {t("booking.welcome.notYou")}
      </Button>
    </div>
  );
}
