import { Banknote, Coins } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { countTotal, denominationsOf } from "./denominations";

export interface CashCountProps {
  currency: string;
  counts: Readonly<Record<string, number>>;
  onCountsChange: (counts: Record<string, number>) => void;
  /** Sin denominaciones (o si se prefiere), el total escrito a mano. */
  total: number | null;
  onTotalChange: (total: number | null) => void;
  byDenomination: boolean;
  onModeChange: (byDenomination: boolean) => void;
}

/**
 * Contar el efectivo billete por billete: cuántos de cada uno y el total se suma solo. Para quien ya trae
 * el total, «Escribir el total».
 */
export function CashCount({ currency, counts, onCountsChange, total, onTotalChange, byDenomination, onModeChange }: CashCountProps) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const denominations = denominationsOf(currency);
  const money = (value: number) => formatNumber(value, { style: "currency", currency, maximumFractionDigits: value % 1 === 0 ? 0 : 2 });
  const counting = byDenomination && denominations !== null;

  return (
    <div className="space-y-3" data-testid="cash-count">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text variant="label">{t("transactions.register.counted")}</Text>
        {denominations && (
          <Button type="button" size="xs" variant="ghost" onClick={() => onModeChange(!byDenomination)} data-testid="cash-count-mode">
            {t(counting ? "transactions.register.typeTotal" : "transactions.register.countBills")}
          </Button>
        )}
      </div>
      {counting ? (
        <>
          <ul className="grid gap-2 sm:grid-cols-2">
            {denominations.map((item) => (
              <li key={item.value} className="flex items-center gap-2">
                {item.kind === "bill" ? <Banknote className="size-4 shrink-0 text-text-muted" aria-hidden /> : <Coins className="size-4 shrink-0 text-text-muted" aria-hidden />}
                <span className="w-20 shrink-0 text-sm tabular-nums text-text-secondary">{money(item.value)}</span>
                <NumberField
                  value={counts[String(item.value)] ?? null}
                  onValueChange={(next) => onCountsChange({ ...counts, [String(item.value)]: Math.max(0, Math.floor(next ?? 0)) })}
                  min={0}
                  step={1}
                  size="sm"
                  aria-label={t("transactions.register.howMany", { value: money(item.value) })}
                  data-testid={`cash-count-${item.value}`}
                />
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between rounded-lg bg-surface-subtle px-3 py-2">
            <Text variant="muted">{t("transactions.register.countedTotal")}</Text>
            <span className="font-semibold tabular-nums" data-testid="cash-count-total">
              {money(countTotal(counts))}
            </span>
          </div>
        </>
      ) : (
        <NumberField value={total} onValueChange={onTotalChange} min={0} precision={2} data-testid="register-counted" aria-label={t("transactions.register.counted")} />
      )}
    </div>
  );
}
