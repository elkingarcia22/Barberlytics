import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Switch } from "@/components/ui/switch";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "./BookingContext";

/**
 * La tarjeta de cliente frecuente: un sello por visita y, al completar la fila, una cortesía. En el
 * inicio enseña el avance; en el pago (`compact`), si tiene una por usar, se puede usar o guardar.
 */
export function LoyaltyCard({ compact = false }: { compact?: boolean }) {
  const t = useAppT();
  const { state, dispatch, fmt } = useBookingFlow();
  const loyalty = state.customer?.loyalty;
  if (!loyalty) return null;
  const reward = loyalty.rewardName || t("booking.loyalty.rewardFallback");

  if (compact) {
    if (loyalty.available === 0) return null;
    return (
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-3">
        <ThemaIcon name="star" tone="primary" />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text as="span" size="sm" weight="medium">
            {t("booking.loyalty.use", { reward })}
          </Text>
          <Text as="span" size="xs" tone="secondary" tabular>
            {state.useReward ? t("booking.loyalty.useOn", { amount: fmt.money(loyalty.rewardValue) }) : t("booking.loyalty.useOff")}
          </Text>
        </span>
        <Switch checked={state.useReward} onCheckedChange={(checked) => dispatch({ type: "setUseReward", useReward: checked })} aria-label={t("booking.loyalty.use", { reward })} />
      </label>
    );
  }

  const left = loyalty.every - loyalty.progress;
  return (
    <section aria-label={t("booking.loyalty.title")} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text size="sm" weight="semibold">
            {t("booking.loyalty.title")}
          </Text>
          <Text size="xs" tone="secondary">
            {loyalty.available > 0 ? t("booking.loyalty.ready", { reward }) : t("booking.loyalty.left", { count: left, reward })}
          </Text>
        </div>
        {loyalty.available > 0 && <ThemaIcon name="star" tone="primary" />}
      </div>
      {/* Un sello por visita de la fila actual. */}
      <ol className="grid grid-cols-10 gap-1.5" aria-label={t("booking.loyalty.progress", { count: loyalty.progress, total: loyalty.every })}>
        {Array.from({ length: loyalty.every }, (_, index) => (
          <li key={index} className={cn("aspect-square rounded-full border", index < loyalty.progress ? "border-primary bg-primary" : "border-border bg-surface-subtle")} />
        ))}
      </ol>
    </section>
  );
}
