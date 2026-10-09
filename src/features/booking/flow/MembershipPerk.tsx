import { useAppT } from "@/app/i18n";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { Text } from "@/components/typography";
import { Switch } from "@/components/ui/switch";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "./BookingContext";

/**
 * La membresía del cliente, en el pago: cada tantas visitas gana un servicio de cortesía. Enseña lo
 * que suma esta cita y, si ya tiene una cortesía, deja usarla ahora o guardarla para otra vez.
 */
export function MembershipPerk() {
  const t = useAppT();
  const { state, dispatch, fmt, totals } = useBookingFlow();
  const loyalty = state.customer?.loyalty;
  if (!loyalty) return null;
  const reward = loyalty.rewardName || t("booking.loyalty.rewardFallback");
  const hasReward = loyalty.available > 0;
  // Esta cita cuenta como una visita más hacia la próxima cortesía.
  const next = Math.min(loyalty.progress + 1, loyalty.every);
  const left = loyalty.every - next;

  const title = hasReward ? t("booking.loyalty.use", { reward }) : t("booking.loyalty.thisVisit", { count: next, total: loyalty.every });
  const detail = hasReward
    ? // Si el paquete ya pagó los servicios, la cortesía no se gasta: queda para otra vez.
      !state.useReward
      ? t("booking.loyalty.useOff")
      : totals.reward > 0
        ? t("booking.loyalty.useOn", { amount: fmt.money(totals.reward) })
        : t("booking.loyalty.keptForLater")
    : left === 0
      ? t("booking.loyalty.earns", { reward })
      : t("booking.loyalty.left", { count: left, reward });

  const content = (
    <>
      {/* Con la cortesía ganada el anillo va completo: es el premio, no el avance hacia el siguiente. */}
      <ProgressRing
        value={hasReward ? loyalty.every : loyalty.progress}
        pending={hasReward ? 0 : 1}
        max={loyalty.every}
        aria-label={hasReward ? t("booking.loyalty.ready", { reward }) : t("booking.loyalty.progress", { count: next, total: loyalty.every })}
      >
        {hasReward ? (
          <ThemaIcon name="award" size="sm" tone="primary" />
        ) : (
          <Text as="span" size="xs" weight="semibold" tabular>
            {next}
            <span className="text-text-muted">/{loyalty.every}</span>
          </Text>
        )}
      </ProgressRing>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text as="span" size="xs" weight="medium" tone="primary" className="uppercase tracking-wide">
          {t("booking.loyalty.title")}
        </Text>
        <Text as="span" size="sm" weight="medium">
          {title}
        </Text>
        <Text as="span" size="xs" tone="secondary" tabular>
          {detail}
        </Text>
      </span>
    </>
  );
  const frame = "flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3";

  if (!hasReward) {
    return (
      <section aria-label={t("booking.loyalty.title")} className={frame}>
        {content}
      </section>
    );
  }
  return (
    <label className={cn(frame, "cursor-pointer")}>
      {content}
      <Switch checked={state.useReward} onCheckedChange={(checked) => dispatch({ type: "setUseReward", useReward: checked })} aria-label={title} />
    </label>
  );
}
