import * as React from "react";
import { Lock } from "lucide-react";
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
import { expectedInDrawer, useCloseRegister, useRegisterDay, type RegisterDay } from "./register";

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
  const [opening, setOpening] = React.useState<number | null>(0);
  const [counted, setCounted] = React.useState<number | null>(null);
  const [note, setNote] = React.useState("");
  const { expected, closure } = data;
  const shouldHave = expectedInDrawer(opening ?? 0, expected.cash);
  const difference = counted === null ? null : Math.round((counted - shouldHave) * 100) / 100;
  const needsNote = difference !== null && difference !== 0;
  const valid = opening !== null && counted !== null && (!needsNote || note.trim().length >= 3);

  const submit = () => {
    if (!valid || opening === null || counted === null) return;
    close.mutate({ branchId: data.branchId, date: data.date, opening, counted, note: note.trim() }, { onSuccess: () => toast.success(t("transactions.register.closed")) });
  };

  return (
    <div className="space-y-5" data-testid="register-close">
      <section aria-label={t("transactions.register.inflow")} className="space-y-2 rounded-xl bg-surface-subtle p-4">
        <Text variant="label">{t("transactions.register.inflow", { count: expected.accounts })}</Text>
        <dl className="space-y-1.5 text-sm">
          <Line label={t("transactions.register.cash")} value={formatMoney(expected.cash)} strong testId="register-expected-cash" />
          <Line label={t("transactions.register.card")} value={formatMoney(expected.card)} />
          <Line label={t("transactions.register.link")} value={formatMoney(expected.link)} />
          <Line label={t("transactions.register.online")} value={formatMoney(expected.online)} muted />
          {expected.refundsCash > 0 && <Line label={t("transactions.register.refundsCash")} value={`−${formatMoney(expected.refundsCash)}`} muted />}
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
          {closure.note && <Text variant="muted">{closure.note}</Text>}
          <Text variant="muted">{t("transactions.register.closedBy", { name: closure.closedBy, time: formatTime(closure.closedAt) })}</Text>
        </section>
      ) : (
        <section aria-label={t("transactions.register.count")} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("transactions.register.opening")} required description={t("transactions.register.openingHint")}>
              <NumberField value={opening} onValueChange={setOpening} min={0} precision={2} data-testid="register-opening" />
            </Field>
            <Field label={t("transactions.register.counted")} required>
              <NumberField value={counted} onValueChange={setCounted} min={0} precision={2} data-testid="register-counted" />
            </Field>
          </div>
          <dl className="space-y-1.5 text-sm">
            <Line label={t("transactions.register.shouldHave")} value={formatMoney(shouldHave)} />
            {difference !== null && <Line label={t("transactions.register.difference")} value={differenceLabel(t, formatMoney, difference)} tone={difference === 0 ? "positive" : "warning"} strong testId="register-difference" />}
          </dl>
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
