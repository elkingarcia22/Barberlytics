import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { AttentionStrip } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useUnpaidAccounts } from "./queries";

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const SHOWN = 4;

/**
 * Las cuentas de días anteriores que nadie cobró (citas atendidas o sin cerrar, hasta 30 días atrás): la fuga de dinero
 * más común. Cada una lleva a su día con la cuenta abierta. Sin pendientes, no se muestra.
 */
export function UnpaidAccountsStrip({ branchId, formatMoney, onOpen }: { branchId: string; formatMoney: (value: number) => string; onOpen: (date: string, id: string) => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useUnpaidAccounts(branchId);
  const items = query.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <AttentionStrip
      className="mb-section"
      label={t("transactions.unpaid.aria")}
      tone="warning"
      icon={items.length > 0 ? TriangleAlert : CheckCircle2}
      title={t("transactions.unpaid.title", { count: items.length, amount: formatMoney(query.data?.total ?? 0) })}
      detail={t("transactions.unpaid.detail")}
    >
      <span className="flex flex-wrap gap-2" data-testid="transactions-unpaid">
        {items.slice(0, SHOWN).map((account) => (
          <Button key={account.id} size="xs" variant="outline" onClick={() => onOpen(account.date.slice(0, 10), account.id)}>
            {[account.client?.name.split(" ")[0] ?? t("transactions.counterSale"), formatDate(new Date(account.date), DAY), formatMoney(account.balance)].join(" · ")}
          </Button>
        ))}
        {items.length > SHOWN && <span className="self-center text-xs text-text-muted">{t("transactions.unpaid.more", { count: items.length - SHOWN })}</span>}
      </span>
    </AttentionStrip>
  );
}
