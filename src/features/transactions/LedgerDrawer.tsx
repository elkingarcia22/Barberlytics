import { Download } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { downloadCsv, toCsv } from "@/lib/csv";
import { QueryBoundary } from "@/lib/query";
import { cn } from "@/lib/utils";
import { DrawerShell } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { LEDGER_KIND_KEYS, methodKey, useLedgerQuery, type Ledger, type LedgerKind } from "./ledger";

export interface LedgerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  from: string;
  to: string;
  formatMoney: (value: number) => string;
}

const KIND_BADGE = { charge: "positive", online: "info", tip: "neutral", refund: "negative", sale: "positive" } as const satisfies Record<LedgerKind, "positive" | "info" | "neutral" | "negative">;
const WHEN: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

/**
 * El libro de pagos del periodo: lo que entró y salió por cada medio y cada movimiento con quién lo hizo.
 * Es de solo lectura: aquí nada se edita; una corrección se hace con una devolución desde la cuenta.
 */
export function LedgerDrawer({ open, onOpenChange, branchId, from, to, formatMoney }: LedgerDrawerProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useLedgerQuery(branchId, from, to, open);
  const methodLabel = (method: string) => {
    const key = methodKey(method);
    return key ? t(key) : method;
  };
  const exportCsv = (data: Ledger) =>
    downloadCsv(
      `libro-de-pagos-${from}-${to}.csv`,
      toCsv(
        [t("transactions.ledger.csv.at"), t("transactions.ledger.csv.kind"), t("transactions.ledger.csv.concept"), t("transactions.ledger.csv.method"), t("transactions.ledger.csv.amount"), t("transactions.ledger.csv.by")],
        data.entries.map((entry) => [entry.at, t(LEDGER_KIND_KEYS[entry.kind]), entry.concept || t("transactions.counterSale"), methodLabel(entry.method), entry.amount, entry.by])
      )
    );

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="lg" title={t("transactions.ledger.title")} description={t("transactions.ledger.hint")}>
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />}>
        {(data) => (
          <div className="space-y-5" data-testid="ledger">
            <section aria-label={t("transactions.ledger.totals")} className="space-y-2 rounded-xl bg-surface-subtle p-4">
              <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                <Total label={t("transactions.ledger.in")} value={formatMoney(data.totals.in)} />
                <Total label={t("transactions.ledger.out")} value={data.totals.out > 0 ? `−${formatMoney(data.totals.out)}` : formatMoney(0)} />
                <Total label={t("transactions.ledger.net")} value={formatMoney(data.totals.net)} strong testId="ledger-net" />
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(data.totals.byMethod).map(([method, amount]) => (
                  <Badge key={method} variant="neutral">
                    {methodLabel(method)} · {formatMoney(amount)}
                  </Badge>
                ))}
              </div>
            </section>
            <div className="flex items-center justify-between gap-3">
              <Text variant="label">{t("transactions.ledger.count", { count: data.entries.length })}</Text>
              <Button type="button" size="sm" variant="outline" onClick={() => exportCsv(data)} disabled={data.entries.length === 0} data-testid="ledger-export">
                <Download /> {t("transactions.ledger.export")}
              </Button>
            </div>
            {data.entries.length === 0 ? (
              <Text variant="muted">{t("transactions.ledger.empty")}</Text>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                {data.entries.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 px-3 py-2.5 text-sm" data-testid="ledger-entry">
                    <Badge variant={KIND_BADGE[entry.kind]} className="mt-0.5 shrink-0">
                      {t(LEDGER_KIND_KEYS[entry.kind])}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-text-primary">{entry.concept || t("transactions.counterSale")}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(new Date(entry.at), WHEN)} · {methodLabel(entry.method)}
                        {entry.by ? ` · ${entry.by}` : ""}
                      </p>
                    </div>
                    <span className={cn("shrink-0 tabular-nums font-medium", entry.amount < 0 ? "text-status-negative" : "text-text-primary")}>{entry.amount < 0 ? `−${formatMoney(-entry.amount)}` : formatMoney(entry.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </QueryBoundary>
    </DrawerShell>
  );
}

function Total({ label, value, strong = false, testId }: { label: string; value: string; strong?: boolean; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:block" data-testid={testId}>
      <dt className="text-text-secondary">{label}</dt>
      <dd className={cn("tabular-nums text-text-primary", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}
