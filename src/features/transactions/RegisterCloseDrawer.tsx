import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, EyeOff, Lock, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { Field, NumberField } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
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
import { useAccess } from "@/features/access";
import { useMembersQuery } from "@/features/team/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { useExpenseCategories } from "@/features/expenses/queries";
import { useSuppliers } from "@/features/expenses/suppliers";
import { CATEGORY_KEYS, expenseCategorySchema } from "@/features/expenses/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expectedInDrawer, useAddCashMovement, useChargeShortage, useCloseRegister, useRegisterDay, type CashMovement, type RegisterClosure, type RegisterDay } from "./register";

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
        {(data) => <RegisterBody key={`${data.date}-${data.closure?.id ?? "open"}-${data.shift}`} data={data} formatMoney={formatMoney} formatTime={(iso) => formatDate(new Date(iso), TIME)} />}
      </QueryBoundary>
    </DrawerShell>
  );
}

function RegisterBody({ data, formatMoney, formatTime }: { data: RegisterDay; formatMoney: (value: number) => string; formatTime: (iso: string) => string }) {
  const t = useAppT();
  const close = useCloseRegister();
  const currency = useBranchCurrency();
  // El turno siguiente abre con lo que quedó contado en el cajón al cerrar el anterior.
  const [opening, setOpening] = React.useState<number | null>(data.closures.at(-1)?.counted ?? 0);
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

  const submit = (final: boolean) => {
    if (!valid || opening === null || counted === null) return;
    close.mutate(
      { branchId: data.branchId, date: data.date, opening, counted, note: note.trim(), denominations: byDenomination ? counts : null, final },
      { onSuccess: () => toast.success(final ? t("transactions.register.closed") : t("transactions.register.shiftClosed", { shift: data.shift })) }
    );
  };
  const earlier = data.closures.filter((item) => item.id !== closure?.id);

  return (
    <div className="space-y-5" data-testid="register-close">
      {earlier.length > 0 && <ShiftList closures={earlier} formatMoney={formatMoney} formatTime={formatTime} />}
      <section aria-label={t("transactions.register.inflow")} className="space-y-2 rounded-xl bg-surface-subtle p-4">
        {(data.shift > 1 || earlier.length > 0) && (
          <Text variant="caption" data-testid="register-shift">
            {t("transactions.register.shiftLabel", { shift: data.shift })}
          </Text>
        )}
        <Text variant="label">{t("transactions.register.inflow", { count: expected.accounts })}</Text>
        <dl className="space-y-1.5 text-sm">
          {expected.cash === null ? (
            <Line label={t("transactions.register.cash")} value={t("transactions.register.blindValue")} muted testId="register-expected-cash" />
          ) : (
            <Line label={t("transactions.register.cash")} value={formatMoney(expected.cash)} strong testId="register-expected-cash" />
          )}
          <Line label={t("transactions.register.card")} value={formatMoney(expected.card)} />
          <Line label={t("transactions.register.link")} value={formatMoney(expected.link)} />
          {expected.transfer > 0 && <Line label={t("transactions.register.transfer")} value={formatMoney(expected.transfer)} />}
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
          {closure.difference < 0 && <ShortageCharge branchId={data.branchId} closureId={closure.id} charged={closure.shortage ?? null} />}
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
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button className="flex-1" onClick={() => submit(true)} disabled={!valid || close.isPending} data-testid="register-submit">
              <Lock /> {t("transactions.register.close")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => submit(false)} disabled={!valid || close.isPending} data-testid="register-close-shift">
              <Repeat /> {t("transactions.register.closeShift", { shift: data.shift })}
            </Button>
          </div>
          <Text variant="muted">{t("transactions.register.shiftHint")}</Text>
        </section>
      )}
    </div>
  );
}

/** Los turnos ya cerrados del día: quién, a qué hora y si cuadró. El faltante de cada uno se puede descontar. */
function ShiftList({ closures, formatMoney, formatTime }: { closures: readonly RegisterClosure[]; formatMoney: (value: number) => string; formatTime: (iso: string) => string }) {
  const t = useAppT();
  return (
    <section aria-label={t("transactions.register.shifts")} className="space-y-2" data-testid="register-shifts">
      <Text variant="label">{t("transactions.register.shifts")}</Text>
      <ul className="divide-y divide-border/60 rounded-lg border border-border text-sm">
        {closures.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2">
            <span className="text-text-secondary">{t("transactions.register.shiftLine", { shift: item.shift ?? index + 1, name: item.closedBy, time: formatTime(item.closedAt) })}</span>
            <span className={`tabular-nums ${item.difference === 0 ? "text-status-positive" : "text-status-warning"}`}>
              {formatMoney(item.counted)} · {differenceLabel(t, formatMoney, item.difference)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** El faltante de un cierre se puede descontar en la nómina de quien responde por él (dueño o administrador). */
function ShortageCharge({ branchId, closureId, charged }: { branchId: string; closureId: string; charged: { memberId: string; by: string } | null }) {
  const t = useAppT();
  const access = useAccess();
  const manages = access.role === "owner" || access.role === "admin";
  const members = useMembersQuery(branchId).data?.items ?? [];
  const charge = useChargeShortage();
  const [memberId, setMemberId] = React.useState("");
  const nameOf = (id: string) => {
    const member = members.find((item) => item.id === id);
    return member ? `${member.firstName} ${member.lastName}` : id;
  };
  if (charged) return <Text variant="muted" data-testid="register-shortage-charged">{t("transactions.register.shortageCharged", { name: nameOf(charged.memberId), by: charged.by })}</Text>;
  if (!manages) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3" data-testid="register-shortage">
      <Text variant="muted" className="w-full">{t("transactions.register.shortageHint")}</Text>
      <Select value={memberId} onValueChange={setMemberId}>
        <SelectTrigger className="w-56" aria-label={t("transactions.register.shortageWho")} data-testid="register-shortage-member">
          <SelectValue placeholder={t("transactions.register.shortageWho")} />
        </SelectTrigger>
        <SelectContent>
          {members.filter((item) => item.status === "active").map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.firstName} {item.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" disabled={!memberId || charge.isPending} onClick={() => charge.mutate({ closureId, memberId }, { onSuccess: () => toast.success(t("transactions.register.shortageDone")) })} data-testid="register-shortage-save">
        {t("transactions.register.shortageCharge")}
      </Button>
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
  // Caja menor: una salida que es un gasto de la barbería queda también en Gastos, con su categoría y su proveedor.
  const [asExpense, setAsExpense] = React.useState(true);
  const [categoryId, setCategoryId] = React.useState("supplies");
  const [supplier, setSupplier] = React.useState("");
  const categories = useExpenseCategories();
  const suppliers = useSuppliers(branchId, null, adding && type === "out");
  const save = () =>
    amount !== null &&
    add.mutate(
      { branchId, date, type, amount, reason: reason.trim(), ...(type === "out" && asExpense ? { expense: { categoryId, ...(supplier.trim() ? { supplier: supplier.trim() } : {}) } } : {}) },
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
                {item.expenseId && <Badge variant="neutral" className="shrink-0">{t("transactions.register.pettyCashTag")}</Badge>}
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
          {type === "out" && (
            <div className="space-y-3" data-testid="register-petty-cash">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={asExpense} onCheckedChange={(checked) => setAsExpense(checked === true)} className="mt-0.5" />
                <span>
                  <span className="text-text-primary">{t("transactions.register.pettyCash")}</span>
                  <span className="block text-xs text-text-muted">{t("transactions.register.pettyCashHint")}</span>
                </span>
              </label>
              {asExpense && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger aria-label={t("transactions.register.pettyCashCategory")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategorySchema.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(CATEGORY_KEYS[option])}
                        </SelectItem>
                      ))}
                      {(categories.data?.custom ?? []).map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder={t("transactions.register.pettyCashSupplier")} list="register-suppliers" maxLength={80} />
                  <datalist id="register-suppliers">
                    {(suppliers.data?.items ?? []).map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>
          )}
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
