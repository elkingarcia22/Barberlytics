import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { DrawerShell } from "@/components/overlays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { canReactivate, useApproveReactivation, useReactivationCandidates, type ReactivationCandidate } from "./rhythm";

export interface ReactivationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

const SLOT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

/** Por qué no se le puede escribir a alguien de la lista. */
function blockedKey(item: ReactivationCandidate): AppMessageKey | null {
  if (!item.consent) return "customers.reactivate.noConsent";
  if (item.recentlyContacted) return "customers.reactivate.recent";
  if (!item.hasPhone) return "customers.reactivate.noPhone";
  if (!item.offer) return "customers.reactivate.noSlot";
  return null;
}

/**
 * Reactivar a los que ya se pasaron de su ritmo. La lista sale sola; el dueño revisa a quién y
 * aprueba. Sale por WhatsApp con la plantilla aprobada («te toca volver») y un hueco real con su
 * barbero. Solo a quien aceptó promociones y sin repetir en el mes: es la regla, no una opción.
 */
export function ReactivationDrawer({ open, onOpenChange, branchId }: ReactivationDrawerProps) {
  const t = useAppT();
  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="lg" title={t("customers.reactivate.title")} description={t("customers.reactivate.description")}>
      {open && <ReactivationBody branchId={branchId} onDone={() => onOpenChange(false)} />}
    </DrawerShell>
  );
}

function ReactivationBody({ branchId, onDone }: { branchId: string; onDone: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useReactivationCandidates(branchId, true);
  const approve = useApproveReactivation(branchId);
  const [unchecked, setUnchecked] = React.useState<ReadonlySet<string>>(new Set());

  return (
    <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full" />}>
      {(data) => {
        const eligible = data.items.filter(canReactivate);
        const chosen = eligible.filter((item) => !unchecked.has(item.clientId));
        const toggle = (id: string, on: boolean) =>
          setUnchecked((current) => {
            const next = new Set(current);
            if (on) next.delete(id);
            else next.add(id);
            return next;
          });
        const send = () =>
          approve.mutate(
            chosen.map((item) => item.clientId),
            {
              onSuccess: (result) => {
                toast.success(t("customers.reactivate.queued", { count: result.queued }), { description: result.skipped.length ? t("customers.reactivate.skipped", { count: result.skipped.length }) : undefined });
                onDone();
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            }
          );
        if (data.items.length === 0) return <Text variant="muted">{t("customers.reactivate.empty")}</Text>;
        return (
          <div className="space-y-4" data-testid="reactivation">
            <Alert>
              <AlertDescription>{t("customers.reactivate.template")}</AlertDescription>
            </Alert>
            <Text variant="muted">{t("customers.reactivate.summary", { total: data.items.length, eligible: eligible.length })}</Text>
            <ul className="divide-y divide-border/60" data-testid="reactivation-list">
              {data.items.map((item) => {
                const blocked = blockedKey(item);
                return (
                  <li key={item.clientId} className="flex items-start gap-3 py-2.5">
                    <Checkbox checked={!blocked && !unchecked.has(item.clientId)} disabled={blocked !== null} onCheckedChange={(value) => toggle(item.clientId, value === true)} aria-label={item.name} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <Text weight="semibold">{item.name}</Text>
                      <Text variant="muted">
                        {t("customers.reactivate.line", { days: item.daysSince ?? 0, every: item.everyDays ?? 0 })}
                        {item.offer ? ` · ${t("customers.reactivate.offer", { when: formatDate(new Date(item.offer.start), SLOT), barber: item.offer.barberName })}` : ""}
                      </Text>
                      {blocked && <Text className="text-xs text-status-warning">{t(blocked)}</Text>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button onClick={send} disabled={chosen.length === 0 || approve.isPending} data-testid="reactivation-approve">
              <Send /> {t("customers.reactivate.approve", { count: chosen.length })}
            </Button>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
