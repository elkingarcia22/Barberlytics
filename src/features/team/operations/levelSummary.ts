import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import type { Level } from "../types";
import type { LevelCheck, LevelCriteria } from "./operationsApi";

export const CHECK_KEYS: Readonly<Record<LevelCheck["id"], AppMessageKey>> = {
  services90: "teamLevels.criteria.services90",
  rebookRate: "teamLevels.criteria.rebookRate",
  rating: "teamLevels.criteria.rating",
  months: "teamLevels.criteria.months",
};
export const EMPTY_CRITERIA: LevelCriteria = { services90: null, rebookRate: null, rating: null, months: null };

/** «Precio ×1,25 · 250 servicios en 90 días · 55 % rebooking · 4,7 ★ · 24 meses»: las reglas de un nivel en una línea. */
export function useLevelSummary() {
  const t = useAppT();
  const { formatNumber } = useLocale();
  return (level: Level) => {
    const criteria = level.criteria ?? EMPTY_CRITERIA;
    const parts = [
      t("teamLevels.rules.factor", { factor: formatNumber(level.priceFactor ?? 1, { maximumFractionDigits: 2 }) }),
      ...(Object.keys(CHECK_KEYS) as LevelCheck["id"][]).filter((key) => criteria[key] !== null).map((key) => t(CHECK_KEYS[key], { value: formatNumber(criteria[key] as number) })),
    ];
    return parts.join(" · ");
  };
}

