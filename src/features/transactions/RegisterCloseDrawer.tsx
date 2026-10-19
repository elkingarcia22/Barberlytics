import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, EyeOff, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { Field, NumberField } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { ReviewFindings } from "@/features/review/ReviewFindings";
import { needsAcknowledge, useRegisterReview } from "@/features/review/review";
import { Input } from "@/components/ui/input";
import { ThemaTabs } from "@/components/navigation";
import { useBranchCurrency } from "@/features/branches";
import { CashCount } from "./CashCount";
import { countTotal } from "./denominations";
import { expectedInDrawer, useAddCashMovement, useCloseRegister, useRegisterDay, type CashMovement, type RegisterDay } from "./register";

export interface RegisterCloseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  /** AAAA-MM-DD. */
  date: string;
  formatMoney: (value: number) => string;
}

const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/**
 * Cerrar la caja del día: lo que entró por cada medio según las cuentas y, en efectivo, lo que
 * debería haber contra lo que se contó. Una diferencia se explica antes de cerrar; cerrada, queda
 * quién la cerró y con qué resultado.
 */
export function RegisterCloseDrawer({ open, onOpenChange, branchId, date, formatMoney }: RegisterCloseDrawerProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const query = useRegisterDay(branchId, date, open);

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="md" title={t("transactions.register.title")} description={formatDate(new Date(`${date}T12:00:00`), DAY)}>
      <QueryBoundary query={query} loading={<Skeleton className="h-64 w-full rounded-2xl" />}>
        {(data) => <RegisterBody key={`${data.date}-${data.closure?.id ?? "open"}`} data={data} formatMoney={formatMoney} formatTime={(iso) => formatDate(new Date(iso), TIME)} />}
      </QueryBoundary>
    </DrawerShell>
  );
}

function RegisterBody({ data, formatMoney, formatTime }: { data: RegisterDay; formatMoney: (value: number) => string; formatTime: (iso: string) => string }) {
  const t = useAppT();
  const close = useCloseRegister();
  const currency = useBranchCurrency();
  const [opening, setOpening] = React.useState<number | null>(0);
  const [typed, setTyped] = React.useState<number | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [byDenomination, setByDenomination] = React.useState(true);
  const counted = byDenomination ? (Object.values(counts).some((count) => count > 0) ? countTotal(counts) : null) : typed;
  const [note, setNote] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const { expected, closure } = data;
  // A ciegas (recepción): se cuenta sin ver lo esperado; la diferencia aparece al cerrar y la revisa gerencia.
  const blind = data.blind === true || expected.cash === null;
  // Antes de contar: lo raro del día (dobles cobros, devoluciones, cuentas sin cobrar).
  const review = useRegisterReview(data.branchId, data.date, closure === null);
  const blockedByReview = review.isPending || (needsAcknowledge(review.data?.items ?? []) && !acknowledged);
  const shouldHave = expected.cash === null ? null : expectedInDrawer(opening ?? 0, expected.cash);
  const difference = counted === null || shouldHave === null ? null : Math.round((counted - shouldHave) * 100) / 100;
  const needsNote = !blind && difference !== null && difference !== 0;
  const valid = opening !== null && counted !== null && (!needsNote || note.trim().length >= 3) && !blockedByReview;

  const submit = () => {
    if (!valid || opening === null || counted === null) return;
    close.mutate(
      { branchId: data.branchId, date: data.date, opening, counted, note: note.trim(), denominations: byDenomination ? counts : null },
      { onSuccess: () => toast.success(t("transactions.register.closed")) }
    );
  };

  return (
    <div className="space-y-5" data-testid="register-close">
      <section aria-label={t("transactions.register.inflow")} className="space-y-2 rounded-xl bg-surface-subtle p-4">
        <Text variant="label">{t("transactions.register.inflow", { count: expected.accounts })}</Text>
        <dl className="space-y-1.5 text-sm">
          {expected.cash === null ? (
            <Line label={t("transactions.register.cash")} value={t("transactions.register.blindValue")} muted testId="register-expected-cash" />
          ) : (
            <Line label={t("transactions.register.cash")} value={formatMoney(expected.cash)} strong testId="register-expected-cash" />
          )}
          <Line label={t("transactions.register.card")} value={formatMoney(expected.card)} />
          <Line label={t("transactions.register.link")} value={formatMoney(expected.link)} />
          <Line label={t("transactions.register.online")} value={formatMoney(expected.online)} muted />
          {expected.refundsCash > 0 && <Line label={t("transactions.register.refundsCash")} value={`−${formatMoney(expected.refundsCash)}`} muted />}
          {!blind && (expected.movementsIn ?? 0) > 0 && <Line label={t("transactions.register.movementsIn")} value={`+${formatMoney(expected.movementsIn ?? 0)}`} muted />}
          {!blind && (expected.movementsOut ?? 0) > 0 && <Line label={t("transactions.register.movementsOut")} value={`−${formatMoney(expected.movementsOut ?? 0)}`} muted />}
          {(expected.renterCash ?? 0) > 0 && <Line label={t("transactions.register.renterCash")} value={formatMoney(expected.renterCash ?? 0)} muted testId="register-renter-cash" />}
        </dl>
        <Text variant="muted">{t("transactions.register.inflowHint")}</Text>
      </section>

      {closure ? (
        <section aria-label={t("transactions.register.result")} className="space-y-2" data-testid="register-closure">
          <dl className="space-y-1.5 text-sm">
            <Line label={t("transactions.register.opening")} value={formatMoney(closure.opening)} />
            <Line label={t("transactions.register.shouldHave")} value={formatMoney(expectedInDrawer(closure.opening, closure.expectedCash))} />
            <Line label={t("transactions.register.counted")} value={formatMoney(closure.counted)} strong />
            <Line label={t("transactions.register.difference")} value={differenceLabel(t, formatMoney, closure.difference)} tone={closure.difference === 0 ? "positive" : "warning"} strong />
          </dl>
          {closure.blind && closure.difference !== 0 && <Text variant="muted">{t("transactions.register.blindReview")}</Text>}
          {closure.note && <Text variant="muted">{closure.note}</Text>}
          <Text variant="muted">{t("transactions.register.closedBy", { name: closure.closedBy, time: formatTime(closure.closedAt) })}</Text>
        </section>
      ) : (
        <section aria-label={t("transactions.register.count")} className="space-y-4">
          <ReviewFindings items={review.data?.items} loading={review.isPending} formatMoney={formatMoney} acknowledged={acknowledged} onAcknowledgedChange={setAcknowledged} />
          <CashMovements branchId={data.branchId} date={data.date} movements={data.movements ?? []} formatMoney={formatMoney} formatTime={formatTime} />
          <Field label={t("transactions.register.opening")} required description={t("transactions.register.openingHint")}>
            <NumberField value={opening} onValueChange={setOpening} min={0} precision={2} data-testid="register-opening" />
          </Field>
          {blind && (
            <Text variant="muted" className="flex items-start gap-2" data-testid="register-blind">
              <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("transactions.register.blindHint")}
            </Text>
          )}
          <CashCount currency={currency} counts={counts} onCountsChange={setCounts} total={typed} onTotalChange={setTyped} byDenomination={byDenomination} onModeChange={setByDenomination} />
          {shouldHave !== null && (
            <dl className="space-y-1.5 text-sm">
              <Line label={t("transactions.register.shouldHave")} value={formatMoney(shouldHave)} />
              {difference !== null && <Line label={t("transactions.register.difference")} value={differenceLabel(t, formatMoney, difference)} tone={difference === 0 ? "positive" : "warning"} strong testId="register-difference" />}
            </dl>
          )}
          {needsNote && (
            <Field label={t("transactions.register.note")} required description={t("transactions.register.noteHint")}>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} data-testid="register-note" />
            </Field>
          )}
          <Button className="w-full" onClick={submit} disabled={!valid || close.isPending} data-testid="register-submit">
            <Lock /> {t("transactions.register.close")}
          </Button>
        </section>
      )}
    </div>
  );
}

/** Entradas y salidas de efectivo del día que no son cobros: el sencillo, un pago a un proveedor, un retiro. */
function CashMovements({ branchId, date, movements, formatMoney, formatTime }: { branchId: string; date: string; movements: readonly CashMovement[]; formatMoney: (value: number) => string; formatTime: (iso: string) => string }) {
  const t = useAppT();
  const add = useAddCashMovement();
  const [adding, setAdding] = React.useState(false);
  const [type, setType] = React.useState<"in" | "out">("out");
  const [amount, setAmount] = React.useState<number | null>(null);
  const [reason, setReason] = React.useState("");
  const save = () =>
    amount !== null &&
    add.mutate(
      { branchId, date, type, amount, reason: reason.trim() },
      {
        onSuccess: () => {
          setAdding(false);
          setAmount(null);
          setReason("");
          toast.success(t(type === "in" ? "transactions.register.movementInSaved" : "transactions.register.movementOutSaved"));
        },
      }
    );
  return (
    <section aria-label={t("transactions.register.movements")} className="space-y-2" data-testid="register-movements">
      <div className="flex items-center justify-between gap-2">
        <Text variant="label">{t("transactions.register.movements")}</Text>
        {!adding && (
          <Button type="button" size="xs" variant="ghost" onClick={() => setAdding(true)} data-testid="register-movement-add">
            <Plus /> {t("transactions.register.movementAdd")}
          </Button>
        )}
      </div>
      {movements.length === 0 && !adding && <Text variant="muted">{t("transactions.register.movementsEmpty")}</Text>}
      {movements.length > 0 && (
        <ul className="space-y-1 text-sm">
          {movements.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                {item.type === "in" ? <ArrowDownToLine className="size-3.5 shrink-0 text-status-positive" aria-hidden /> : <ArrowUpFromLine className="size-3.5 shrink-0 text-status-warning" aria-hidden />}
                <span className="truncate">{item.reason}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-text-muted">
                {item.type === "in" ? "+" : "−"}
                {formatMoney(item.amount)} · {formatTime(item.at)} · {item.by}
              </span>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <ThemaTabs
            className="mb-0"
            fitContent
            tabs={[
              { id: "out", label: t("transactions.register.movementOut") },
              { id: "in", label: t("transactions.register.movementIn") },
            ]}
            activeTabId={type}
            onTabChange={(id) => setType(id as "in" | "out")}
          />
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <NumberField value={amount} onValueChange={setAmount} min={0} precision={2} aria-label={t("transactions.register.movementAmount")} data-testid="register-movement-amount" />
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("transactions.register.movementReason")} maxLength={300} data-testid="register-movement-reason" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={amount === null || amount <= 0 || reason.trim().length < 3 || add.isPending} data-testid="register-movement-save">
              {t("transactions.register.movementSave")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

type Translate = ReturnType<typeof useAppT>;

const differenceLabel = (t: Translate, formatMoney: (value: number) => string, value: number): string =>
  value === 0 ? t("transactions.register.balanced") : value > 0 ? t("transactions.register.over", { amount: formatMoney(value) }) : t("transactions.register.short", { amount: formatMoney(-value) });

const LINE_TONE = { default: "text-text-primary", positive: "text-status-positive", warning: "text-status-warning" } as const;

function Line({ label, value, strong = false, muted = false, tone = "default", testId }: { label: string; value: string; strong?: boolean; muted?: boolean; tone?: keyof typeof LINE_TONE; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3" data-testid={testId}>
      <dt className={muted ? "text-text-muted" : "text-text-secondary"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""} ${muted ? "text-text-muted" : LINE_TONE[tone]}`}>{value}</dd>
    </div>
  );
}
