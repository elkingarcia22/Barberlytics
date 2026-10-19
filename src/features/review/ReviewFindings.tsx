import { Link } from "react-router";
import { CircleCheck } from "lucide-react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { ADJUSTMENT_KIND_KEYS, KIND_KEYS, MONEY_PARAMS, SEVERITY_KEYS, needsAcknowledge, type Finding, type Severity } from "./review";

export interface ReviewFindingsProps {
  items: readonly Finding[] | undefined;
  loading: boolean;
  formatMoney: (value: number) => string;
  /** Con alertas graves: si quien cierra marcó que las revisó. */
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
}

const SEVERITY_BADGE = { high: "negative", medium: "warning", info: "info" } as const satisfies Record<Severity, "negative" | "warning" | "info">;
const MAX_VISIBLE = 8;

/**
 * Lo que conviene mirar antes de aprobar o cerrar, de lo grave a lo informativo. Cada alerta abre
 * la cita que la causó. No bloquea: con algo grave, pide marcar «Lo revisé» y deja seguir.
 */
export function ReviewFindings({ items, loading, formatMoney, acknowledged, onAcknowledgedChange }: ReviewFindingsProps) {
  const t = useAppT();
  if (loading) return <Skeleton className="h-20 w-full rounded-xl" />;
  // Si la revisión no llegó, no frena el cierre: es una ayuda, no un requisito.
  if (!items) return null;
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-status-positive/10 px-3 py-2.5 text-sm text-status-positive" data-testid="review-clear">
        <CircleCheck className="size-4 shrink-0" />
        {t("review.clear")}
      </div>
    );
  }

  const describe = (item: Finding) => {
    const key: AppMessageKey | undefined = KIND_KEYS[item.kind as keyof typeof KIND_KEYS];
    if (!key) return item.kind;
    const params = Object.fromEntries(Object.entries(item.params).map(([name, value]) => [name, MONEY_PARAMS.has(name) && typeof value === "number" ? formatMoney(value) : value]));
    const adjustmentKind = ADJUSTMENT_KIND_KEYS[String(item.params.adjustmentKind) as keyof typeof ADJUSTMENT_KIND_KEYS];
    const change = typeof item.params.change === "number" ? `${item.params.change > 0 ? "+" : ""}${item.params.change}` : undefined;
    return t(key, { ...params, ...(adjustmentKind ? { adjustmentKind: t(adjustmentKind) } : {}), ...(change ? { change } : {}) });
  };

  const visible = items.slice(0, MAX_VISIBLE);
  return (
    <section aria-label={t("review.title")} className="space-y-3" data-testid="review-findings">
      <Text variant="label">{t("review.title_count", { count: items.length })}</Text>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
        {visible.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-3 py-2.5" data-testid={`review-${item.kind}`}>
            <Badge variant={SEVERITY_BADGE[item.severity]} className="mt-0.5 shrink-0">
              {t(SEVERITY_KEYS[item.severity])}
            </Badge>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-text-primary">{describe(item)}</p>
              {item.appointmentId && item.date && (
                <Link to={`/calendario?fecha=${item.date}&cita=${item.appointmentId}`} className="text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  {t("review.openAppointment")}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length > MAX_VISIBLE && <Text variant="muted">{t("review.more", { count: items.length - MAX_VISIBLE })}</Text>}
      {needsAcknowledge(items) && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-status-negative/10 px-3 py-2.5 text-sm text-text-primary">
          <Checkbox checked={acknowledged} onCheckedChange={(value) => onAcknowledgedChange(value === true)} className="mt-0.5" data-testid="review-acknowledge" />
          {t("review.acknowledge")}
        </label>
      )}
    </section>
  );
}
