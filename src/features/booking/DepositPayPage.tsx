import { useSearchParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, HandCoins } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { EmptyState, Spinner } from "@/components/feedback";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { depositApi } from "@/features/calendar/deposit";

const WHEN: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" };

/**
 * Lo que abre el enlace de anticipo que recepción mandó por SMS o correo: el monto y la cita, y «Pagar», que en
 * producción lleva a la página de la pasarela de la sede (Wompi, Stripe…) y vuelve con el pago confirmado por su
 * webhook. Sin sesión ni código: el token es de esa cita y no se adivina.
 */
export function DepositPayPage() {
  const t = useAppT();
  const { formatDate, current } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const deposit = useQuery({ queryKey: ["booking", "deposit", token], queryFn: ({ signal }) => depositApi.get(token, signal), enabled: Boolean(token), retry: false });
  const pay = useMutation({ mutationFn: () => depositApi.pay(token), onSuccess: () => void deposit.refetch() });
  const data = deposit.data;
  const money = (amount: number, currency: string) => new Intl.NumberFormat(current.intl, { style: "currency", currency, maximumFractionDigits: currency === "COP" ? 0 : 2 }).format(amount);

  const body = () => {
    if (!token || deposit.isError) return <EmptyState icon="error" title={t("booking.deposit.failedTitle")} description={token ? describeError(deposit.error).description : t("booking.deposit.noToken")} />;
    if (!data)
      return (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      );
    const when = formatDate(new Date(data.start), WHEN);
    const amount = money(data.amount, data.currency);
    if (data.status === "inactive") return <EmptyState icon="calendar" title={t("booking.deposit.inactiveTitle")} />;
    if (data.status === "paid")
      return (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface p-8 text-center shadow-card" data-testid="deposit-paid">
          <CalendarCheck className="size-10 text-status-positive" aria-hidden />
          <Heading level={3} as="h1">
            {t("booking.deposit.paidTitle", { name: data.client })}
          </Heading>
          <Text tone="muted">{t("booking.deposit.paidDetail", { amount, when, branch: data.branch })}</Text>
        </section>
      );
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8" data-testid="deposit-pay">
        <HandCoins className="size-9 text-primary" aria-hidden />
        <Heading level={3} as="h1">
          {t("booking.deposit.title", { name: data.client })}
        </Heading>
        <Text tone="muted">{t("booking.deposit.detail", { when, barber: data.barber, branch: data.branch })}</Text>
        <Text size="lg" weight="semibold" className="tabular-nums">
          {amount}
        </Text>
        {pay.isError && (
          <Text size="sm" tone="negative" role="alert">
            {describeError(pay.error).description}
          </Text>
        )}
        <Button type="button" size="lg" className="w-full" onClick={() => pay.mutate()} disabled={pay.isPending} data-testid="deposit-pay-submit">
          {pay.isPending ? <Spinner size="sm" tone="inverse" /> : <HandCoins />}
          {t("booking.deposit.pay", { amount })}
        </Button>
        <Text size="sm" tone="muted">
          {t("booking.deposit.gatewayNote")}
        </Text>
      </section>
    );
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">{body()}</div>
    </main>
  );
}
