import { useNavigate } from "react-router";
import { CalendarDays, Package, Scissors, UserRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility";
import { STATUS_KEYS } from "@/features/calendar/types";
import { maskPhone } from "@/features/customers/customersUtils";
import { formatDuration } from "@/features/services/servicesUtils";
import { AccountStatusBadge } from "./transactionsShared";
import { ACCOUNT_STATUS_HINT_KEYS, METHOD_KEYS, ONLINE_METHOD_KEYS, type Account } from "./types";

export interface AccountDrawerProps {
  /** La cuenta abierta; `null` cierra el panel. */
  account: Account | null;
  onClose: () => void;
  formatMoney: (value: number) => string;
}

const DATE_TIME: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" };

/**
 * El detalle de una cuenta, en un panel: qué se cobró línea por línea, las
 * cuentas —subtotal, impuesto, total, propina, saldo—, cómo y quién lo
 * cobró, y los atajos a la cita y al cliente. Es de solo lectura: cobrar,
 * cancelar o mover una cita se hace en el calendario.
 */
export function AccountDrawer({ account, onClose, formatMoney }: AccountDrawerProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();

  return (
    <DrawerShell
      open={account !== null}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={account?.invoice ? t("transactions.detail.titleInvoice", { invoice: account.invoice }) : t("transactions.detail.title")}
      description={account ? formatDate(new Date(account.date), DATE_TIME) : undefined}
      actions={
        account && (
          <>
            {account.client && (
              <Button variant="outline" onClick={() => navigate(`/clientes/${account.client?.id}`)}>
                <UserRound /> {t("transactions.detail.seeClient")}
              </Button>
            )}
            {account.appointmentId && (
              <Button onClick={() => navigate(`/calendario?fecha=${account.date.slice(0, 10)}&cita=${account.appointmentId}`)} data-testid="account-see-appointment">
                <CalendarDays /> {t("transactions.detail.seeAppointment")}
              </Button>
            )}
          </>
        )
      }
    >
      {account && (
        <div className="space-y-5" data-testid="account-detail">
          <div className="rounded-xl bg-surface-subtle p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text variant="caption">{t("transactions.column.total")}</Text>
                <p className="text-2xl font-semibold tabular-nums text-text-primary">{formatMoney(account.total)}</p>
              </div>
              <AccountStatusBadge status={account.status} />
            </div>
            <Text variant="muted" className="mt-2">
              {t(ACCOUNT_STATUS_HINT_KEYS[account.status])}
            </Text>
          </div>

          <section aria-label={t("transactions.detail.lines")}>
            <Text variant="label" className="mb-2">
              {t("transactions.detail.lines")}
            </Text>
            <ul className="space-y-2">
              {account.lines.map((line, index) => (
                <li key={`${line.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  <IconTile icon={line.kind === "service" ? <Scissors /> : <Package />} tone="neutral" size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">{line.name}</span>
                    <span className="block text-xs text-text-muted">{line.kind === "service" ? t("transactions.detail.service") : t("transactions.detail.product", { count: line.qty })}</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums text-text-primary">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
          </section>

          <dl className="space-y-2 border-t border-border/60 pt-4 text-sm">
            <Row label={t("transactions.detail.subtotal")} value={formatMoney(account.subtotal)} />
            {(account.discount ?? 0) > 0 && <Row label={t("transactions.detail.discount")} value={`−${formatMoney(account.discount ?? 0)}`} tone="positive" />}
            <Row label={t("transactions.detail.tax")} value={formatMoney(account.tax)} />
            <Row label={t("transactions.column.total")} value={formatMoney(account.total)} strong />
            {(account.prepaid ?? 0) > 0 && (
              <Row
                label={t("transactions.detail.prepaid", { method: account.onlineMethod && ONLINE_METHOD_KEYS[account.onlineMethod] ? t(ONLINE_METHOD_KEYS[account.onlineMethod]) : "" })}
                value={formatMoney(account.prepaid ?? 0)}
                tone="positive"
                testId="account-prepaid"
              />
            )}
            {account.tip > 0 && <Row label={t("transactions.column.tip")} value={formatMoney(account.tip)} />}
            {account.status === "paid" && <Row label={t("transactions.column.collected")} value={formatMoney(account.collected)} tone="positive" />}
            {account.status === "refunded" && <Row label={t("transactions.detail.refunded")} value={formatMoney(account.refunded)} tone="warning" />}
            {account.status === "open" && <Row label={t("transactions.detail.balance")} value={formatMoney(account.balance)} tone="warning" strong />}
          </dl>

          <dl className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
            <Fact label={t("transactions.column.client")} value={account.client ? `${account.client.name} · ${maskPhone(account.client.phone)}` : t("transactions.counterSale")} />
            <Fact label={t("transactions.column.attended")} value={account.barber ?? "—"} />
            {account.appointmentStatus && <Fact label={t("transactions.column.appointment")} value={`${t(STATUS_KEYS[account.appointmentStatus])}${account.durationMin ? ` · ${formatDuration(account.durationMin)}` : ""}`} />}
            <Fact label={t("transactions.column.method")} value={account.method ? t(METHOD_KEYS[account.method]) : "—"} />
            <Fact label={t("transactions.detail.openedBy")} value={account.openedBy ?? "—"} />
            <Fact label={t("transactions.detail.chargedBy")} value={account.chargedBy ?? "—"} />
            {account.paidAt && <Fact label={t("transactions.detail.paidAt")} value={formatDate(new Date(account.paidAt), DATE_TIME)} />}
            <Fact label={t("transactions.detail.reference")} value={<span className="break-all font-mono text-xs">{account.reference}</span>} />
          </dl>
        </div>
      )}
    </DrawerShell>
  );
}

const ROW_TONE = { default: "text-text-primary", positive: "text-status-positive", warning: "text-status-warning" } as const;

function Row({ label, value, strong = false, tone = "default", testId }: { label: string; value: string; strong?: boolean; tone?: keyof typeof ROW_TONE; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3" data-testid={testId}>
      <dt className={strong ? "font-semibold text-text-primary" : "text-text-secondary"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${ROW_TONE[tone]}`}>{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm text-text-primary">{value}</dd>
    </div>
  );
}
