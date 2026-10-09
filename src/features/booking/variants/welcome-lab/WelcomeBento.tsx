import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf, parseStart } from "../../bookingFormat";
import { STEP_WIDTH } from "../../flow/stepWidth";
import type { WelcomeData } from "./useWelcomeData";

interface Shortcut {
  id: string;
  icon: IconName;
  label: string;
  hint: string;
  onClick: () => void;
}

/**
 * Propuesta B · Atajos. Lo de siempre manda: una pieza grande con la foto del servicio, su barbero,
 * el precio, las horas propuestas y el botón, todo encima de la imagen. Debajo, una rejilla de
 * atajos del mismo peso para lo demás (algo nuevo, citas, paquetes, regalar).
 */
export function WelcomeBento({ data }: { data: WelcomeData }) {
  const t = useAppT();
  const { customer, services, barber, suggestion, price, durationMin, fmt, layout, actions, catalog } = data;
  const [picked, setPicked] = React.useState(0);
  if (!customer) return null;
  const option = suggestion?.options[picked] ?? suggestion?.options[0] ?? null;
  const when = option ? parseStart(option.start) : null;
  const optionBarber = option && !option.sameBarber ? catalog?.barbers.find((item) => item.id === option.barberId) : barber;
  const lead = services[0];

  const shortcuts: Shortcut[] = [
    { id: "new", icon: "plus", label: t("booking.welcomeLab.somethingNew"), hint: t("booking.welcomeLab.somethingNewHint"), onClick: actions.startFresh },
    {
      id: "manage",
      icon: "calendar",
      label: t("booking.welcomeLab.appointments"),
      hint: customer.upcoming > 0 ? t("booking.welcomeLab.appointmentsHint", { count: customer.upcoming }) : t("booking.welcomeLab.appointmentsNone"),
      onClick: actions.manage,
    },
    ...(data.hasPackages ? [{ id: "packages", icon: "layers" as const, label: t("booking.welcomeLab.packages"), hint: t("booking.welcomeLab.packagesHint"), onClick: actions.packages }] : []),
    ...(data.canGift ? [{ id: "gift", icon: "ticket" as const, label: t("booking.welcomeLab.gift"), hint: t("booking.welcomeLab.giftHint"), onClick: actions.gift }] : []),
  ];

  return (
    <div className={cn("mx-auto flex w-full flex-1 flex-col gap-5 px-5 pb-8 pt-6", STEP_WIDTH[layout])}>
      <header className="flex flex-col gap-2">
        <Heading level={3}>{t("booking.welcomeLab.hello", { name: customer.firstName })}</Heading>
        {(customer.upcoming > 0 || customer.credit > 0) && (
          <div className="flex flex-wrap gap-2">
            {customer.upcoming > 0 && (
              <Badge variant="outline" className="gap-1">
                <ThemaIcon name="calendar" size="xs" tone="info" />
                {t("booking.welcome.upcoming", { count: customer.upcoming })}
              </Badge>
            )}
            {customer.credit > 0 && <Badge variant="secondary">{t("booking.welcomeLab.credit", { amount: fmt.money(customer.credit) })}</Badge>}
          </div>
        )}
      </header>

      {data.isLoading ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : (
        lead && (
          // La foto es el fondo; un velo oscuro de abajo hacia arriba hace legible el texto en los dos modos.
          <section aria-labelledby="bento-usual" className="relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-3xl bg-surface-subtle text-white shadow-md">
            {lead.imageUrl && <img src={lead.imageUrl} alt="" className="absolute inset-0 -z-10 size-full object-cover" />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 to-black/10" aria-hidden />
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Text size="xs" weight="semibold" className="uppercase tracking-widest text-white/70">
                    {t("booking.welcomeLab.usual")}
                  </Text>
                  <Heading level={3} id="bento-usual" className="text-white" truncate>
                    {services.map((item) => item.name).join(" + ")}
                  </Heading>
                  <Text size="xs" className="text-white/70">
                    {t("booking.services.minutes", { count: durationMin })}
                  </Text>
                  {optionBarber && (
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {optionBarber.avatarUrl && <AvatarImage src={optionBarber.avatarUrl} alt="" />}
                        <AvatarFallback>{initialsOf(optionBarber.name)}</AvatarFallback>
                      </Avatar>
                      <Text size="sm" className="text-white/85" truncate>
                        {t("booking.welcomeLab.with", { name: optionBarber.name })}
                      </Text>
                    </div>
                  )}
                </div>
                <Text size="xl" weight="semibold" tabular className="shrink-0 text-white">
                  {fmt.money(price)}
                </Text>
              </div>

              {suggestion && suggestion.options.length > 0 && (
                <div role="radiogroup" aria-label={t("booking.suggest.options")} className="grid grid-cols-3 gap-2">
                  {suggestion.options.map((item, index) => {
                    const date = parseStart(item.start);
                    const isPicked = index === picked;
                    return (
                      <button
                        key={item.start + item.barberId}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        onClick={() => setPicked(index)}
                        className={cn(
                          "flex flex-col items-center rounded-xl border px-1 py-2 backdrop-blur-md",
                          "transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                          isPicked ? "border-primary bg-primary/25" : "border-white/20 bg-white/10 hover:bg-white/20"
                        )}
                      >
                        <span className="text-xs capitalize text-white/70">{fmt.dayShort(date)}</span>
                        <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{fmt.time(date)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

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
              {option && (
                <button type="button" onClick={actions.repeat} className="self-center rounded-md text-xs text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  {t("booking.suggest.other")}
                </button>
              )}
            </div>
          </section>
        )
      )}

      {/* Atajos del mismo peso: ninguno compite con lo de siempre. */}
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-[transform,border-color] duration-fast ease-out-expo hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <IconTile size="md" icon={<ThemaIcon name={item.icon} />} />
            <span className="flex min-w-0 flex-col">
              <Text as="span" size="sm" weight="semibold">
                {item.label}
              </Text>
              <Text as="span" size="xs" tone="muted">
                {item.hint}
              </Text>
            </span>
          </button>
        ))}
      </div>

      <Button type="button" variant="link" size="sm" className="self-center" onClick={actions.notYou}>
        {t("booking.welcome.notYou")}
      </Button>
    </div>
  );
}
